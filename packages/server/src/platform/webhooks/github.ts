import { createHmac, timingSafeEqual } from "node:crypto";
import { type ErrorBody, type EventOf, errorMap, errorStatus } from "@avel/contract";
import { users, webhookDeliveries } from "@avel/db";
import {
  Clock,
  ConfigProvider,
  type Context,
  Effect,
  Layer,
  ManagedRuntime,
  Redacted,
} from "effect";
import { z } from "zod";
import { FactoryVersions, isCommitSha } from "../../knowledge/index.ts";
import { ClientIp } from "../auth/services.ts";
import { Db, DbLive, Tx } from "../db/db.ts";
import { Events } from "../db/events.ts";
import { errorTable, type MappedError, PayloadTooLarge } from "../errors.ts";
import { RateLimit, RateLimitLive } from "../rate-limit.ts";
import { RequestId } from "../request-id.ts";

/**
 * The GitHub webhook's settings (createApp's `webhook`). Its database is either its own pool on
 * `databaseUrl`, or `db`: the owner's Db, which the owner releases (startServer's scope).
 */
export type WebhookOptions = (
  | { readonly databaseUrl: string }
  | { readonly db: Context.Context<Db> }
) & {
  /** GITHUB_WEBHOOK_SECRET: GitHub signs every delivery's raw body with it. */
  readonly secret: string | Redacted.Redacted<string>;
  /** The factory repo, as "owner/name". */
  readonly repo: string;
  /** The factory's GitHub App, as GitHub names it in `merged_by.login` and `sender.login`. */
  readonly appLogin: string;
};

const PATH = "/api/webhooks/github";

/** The factory repo's protected branch (Design v0.6, Factory as code). */
const FACTORY_BRANCH = "main";
const FACTORY_REF = `refs/heads/${FACTORY_BRANCH}`;

/** GitHub caps a webhook payload at 25 MB (GitHub Docs, "Webhook events and payloads"). */
const MAX_BODY_BYTES = 25 * 1024 * 1024;

const SIGNATURE = /^sha256=([0-9a-f]{64})$/;

/**
 * Whether `header` is X-Hub-Signature-256 for this raw body: an HMAC-SHA256 under the secret,
 * compared in constant time.
 */
const isSignedBy = (secret: Redacted.Redacted<string>, body: Uint8Array, header: string | null) => {
  const hex = header === null ? undefined : SIGNATURE.exec(header)?.[1];
  if (hex === undefined) return false;
  const expected = createHmac("sha256", Redacted.value(secret)).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(hex, "hex"));
};

/** The fields of GitHub's pull_request event that a merge into the factory repo is read from. */
const MergedPullRequest = z.object({
  action: z.literal("closed"),
  pull_request: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    merged: z.literal(true),
    merged_at: z.iso.datetime(),
    merge_commit_sha: z.string().refine(isCommitSha),
    merged_by: z.object({ login: z.string() }),
    base: z.object({ ref: z.string() }),
  }),
  repository: z.object({ full_name: z.string() }),
});

/**
 * A pull_request event that says it closed by a merge, read only as far as it must be to tell
 * whether it concerns the factory repo's main. A field that doesn't parse is unknown, not other.
 */
const ClosedByMerge = z.object({
  action: z.literal("closed"),
  pull_request: z.object({
    merged: z.literal(true),
    base: z.object({ ref: z.string() }).optional().catch(undefined),
  }),
  repository: z.object({ full_name: z.string() }).optional().catch(undefined),
});

/** A push event's branch and repo, read as loosely as ClosedByMerge. */
const PushTo = z.object({
  ref: z.string(),
  repository: z.object({ full_name: z.string() }).optional().catch(undefined),
});

/** The fields of a push to the factory repo's main that tell who moved it, and to which commit. */
const PushToMain = z.object({
  after: z.string().refine(isCommitSha),
  sender: z.object({ login: z.string() }),
});

/** A merge the webhook lists in factory_versions, before the operator is looked up. */
interface Merge {
  readonly sha: string;
  readonly mergedAt: Date;
  readonly mergedByApp: boolean;
  readonly summary: string;
  readonly prNumber: number;
}

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** What a signed delivery does: list a merge, raise an alert alone, or nothing. */
type Decision =
  | { readonly _tag: "Merge"; readonly merge: Merge }
  | { readonly _tag: "Alert"; readonly key: string; readonly plain: string }
  | { readonly _tag: "Ignore" };

const IGNORE: Decision = { _tag: "Ignore" };

/** The alert's key is `<kind>:<subject>` (AlertDto): the commit, or the delivery if none is read. */
const alertOf = (subject: string, plain: string): Decision => ({
  _tag: "Alert",
  key: `unexpected_factory_merge:${subject}`,
  plain,
});

const unreadable = (deliveryId: string) =>
  alertOf(
    `delivery:${deliveryId}`,
    "A merge into the factory repo couldn't be read, so finalize is frozen",
  );

/** Whether a field read from the payload names another repo. GitHub's names are case-insensitive. */
const isOtherRepo = (repository: { full_name: string } | undefined, repo: string) =>
  repository !== undefined && repository.full_name.toLowerCase() !== repo.toLowerCase();

function decidePullRequest(
  payload: unknown,
  deliveryId: string,
  options: Pick<WebhookOptions, "repo" | "appLogin">,
): Decision {
  const closed = ClosedByMerge.safeParse(payload);
  if (!closed.success) return IGNORE;
  const { pull_request: about, repository } = closed.data;
  if (isOtherRepo(repository, options.repo)) return IGNORE;
  if (about.base !== undefined && about.base.ref !== FACTORY_BRANCH) return IGNORE;
  const parsed = MergedPullRequest.safeParse(payload);
  if (!parsed.success) return unreadable(deliveryId);
  const pr = parsed.data.pull_request;
  return {
    _tag: "Merge",
    merge: {
      sha: pr.merge_commit_sha,
      mergedAt: new Date(pr.merged_at),
      mergedByApp: pr.merged_by.login === options.appLogin,
      summary: pr.title,
      prNumber: pr.number,
    },
  };
}

/**
 * A push to the factory repo's main by anyone but the App (an admin bypassing branch protection)
 * is an alert, and lists nothing, so its commit is never selectable. The App's own merges push
 * too; those are listed from their pull_request event.
 */
function decidePush(
  payload: unknown,
  deliveryId: string,
  options: Pick<WebhookOptions, "repo" | "appLogin">,
): Decision {
  const push = PushTo.safeParse(payload);
  if (!push.success || push.data.ref !== FACTORY_REF) return IGNORE;
  if (isOtherRepo(push.data.repository, options.repo)) return IGNORE;
  const parsed = PushToMain.safeParse(payload);
  if (!parsed.success) return unreadable(deliveryId);
  if (parsed.data.sender.login === options.appLogin) return IGNORE;
  return alertOf(
    parsed.data.after,
    "A push to the factory repo's main didn't come from the factory's App, so finalize is frozen",
  );
}

/**
 * What a signed delivery does (plain TypeScript, Writing Effect rule 10): a pull request merged
 * into the factory repo's main is a merge, and a push to it by anyone but the App is an alert.
 * Either one that says it concerns that main but doesn't parse is an alert too, never dropped.
 * Every other event, repo or branch is ignored.
 */
function decideDelivery(
  event: string,
  deliveryId: string,
  body: string,
  options: Pick<WebhookOptions, "repo" | "appLogin">,
): Decision {
  if (event === "pull_request") return decidePullRequest(parseJson(body), deliveryId, options);
  if (event === "push") return decidePush(parseJson(body), deliveryId, options);
  return IGNORE;
}

/** The alert a factory change made without the App raises; finalize stays frozen while it stands. */
const unexpectedChange = (key: string, plain: string, since: string) =>
  ({
    alert: {
      key,
      kind: "unexpected_factory_merge",
      severity: "stopped",
      missionId: null,
      plain,
      since,
    },
  }) satisfies EventOf<"system.alert.raised">["payload"];

const MERGED_WITHOUT_APP =
  "A factory change was merged without the factory's App, so finalize is frozen";

/** The one operator approves every factory change (one operator, CR-18). */
const operatorId = Effect.gen(function* () {
  const tx = yield* Tx;
  const found = yield* Effect.promise(() => tx.select({ id: users.id }).from(users).limit(1));
  const id = found[0]?.id;
  if (id === undefined) {
    return yield* Effect.die(new Error("no operator: run the seed before a factory merge"));
  }
  return id;
});

const errorResponse = (body: Omit<ErrorBody, "requestId">, status: number) =>
  Effect.gen(function* () {
    const requestId = yield* RequestId;
    return Response.json({ ...body, requestId } satisfies ErrorBody, { status });
  });

/** A tagged failure as the contract's error body, through the one error table. */
const failed = (error: MappedError) => {
  const code = errorTable[error._tag];
  return errorResponse(
    {
      code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
    errorStatus[code],
  );
};

const unsigned = errorResponse(
  { code: "UNAUTHORIZED", message: "The delivery's X-Hub-Signature-256 doesn't match" },
  errorMap.UNAUTHORIZED.status,
);

const missingHeaders = errorResponse(
  { code: "BAD_REQUEST", message: "A delivery needs X-GitHub-Event and X-GitHub-Delivery" },
  errorMap.BAD_REQUEST.status,
);

/** POST /api/webhooks/github, outside the contract, with the services its program uses. */
export interface GithubWebhook {
  /** The webhook's rate limiter and database, built once per app. */
  readonly runtime: ManagedRuntime.ManagedRuntime<RateLimit | Db, never>;
  /** Whether a request is a delivery to the webhook. */
  readonly serves: (request: Request) => boolean;
  /** Answers a request `serves` accepts. */
  readonly handle: (
    request: Request,
  ) => Effect.Effect<Response, never, RateLimit | Db | RequestId | ClientIp>;
}

/**
 * The raw body, up to MAX_BODY_BYTES: a declared Content-Length over it is refused before a byte
 * is read, and a body sent without one is read only until it passes the limit. Undefined when
 * it's over.
 */
const readCapped = (request: Request) =>
  Effect.promise(async () => {
    if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return undefined;
    if (request.body === null) return new Uint8Array();
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (let read = await reader.read(); !read.done; read = await reader.read()) {
      size += read.value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(read.value);
    }
    return Buffer.concat(chunks);
  });

const tooLarge = new PayloadTooLarge({
  message: "A delivery's body is limited to GitHub's 25 MB payload cap",
  details: { maxChars: MAX_BODY_BYTES },
});

export function makeGithubWebhook(
  options: WebhookOptions,
  clock: Clock.Clock | undefined,
): GithubWebhook {
  const secret = Redacted.isRedacted(options.secret)
    ? options.secret
    : Redacted.make(options.secret);
  const db =
    "db" in options
      ? Layer.succeedContext(options.db)
      : DbLive.pipe(
          Layer.provide(
            ConfigProvider.layerAdd(
              ConfigProvider.fromEnvRecord({ DATABASE_URL: options.databaseUrl }),
              { asPrimary: true },
            ),
          ),
          // A database the server can't reach, or one whose messages aren't English, is a defect.
          Layer.orDie,
        );
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(
      RateLimitLive,
      db,
      clock === undefined ? Layer.empty : Layer.succeed(Clock.Clock)(clock),
    ),
  );

  /** The alert, queued in the open transaction and written by commitWithEvents. */
  const raise = (key: string, plain: string) =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;
      yield* Events.append({
        schemaVersion: 1,
        kind: "system.alert.raised",
        payload: unexpectedChange(key, plain, new Date(now).toISOString()),
      });
    });

  /**
   * One signed delivery, once: its webhook_deliveries row, the factory_versions row of a merge,
   * and the alert of a change the App didn't make commit together. A replayed X-GitHub-Delivery
   * finds its row and does nothing.
   */
  const apply = (deliveryId: string, event: string, decision: Decision) =>
    Effect.gen(function* () {
      const database = yield* Db;
      yield* database.withTransaction(
        Effect.gen(function* () {
          const tx = yield* Tx;
          const fresh = yield* Effect.promise(() =>
            tx
              .insert(webhookDeliveries)
              .values({ deliveryId, event })
              .onConflictDoNothing()
              .returning({ deliveryId: webhookDeliveries.deliveryId }),
          );
          if (fresh.length === 0 || decision._tag === "Ignore") return;
          if (decision._tag === "Alert") {
            yield* raise(decision.key, decision.plain);
          } else {
            const { merge } = decision;
            yield* FactoryVersions.record({ ...merge, approvedBy: yield* operatorId });
            if (merge.mergedByApp) return;
            yield* raise(`unexpected_factory_merge:${merge.sha}`, MERGED_WITHOUT_APP);
          }
          yield* database.commitWithEvents;
        }),
      );
    });

  const handle = (request: Request) =>
    Effect.gen(function* () {
      const limiter = yield* RateLimit;
      yield* limiter.check("webhook", yield* ClientIp);
      const body = yield* readCapped(request);
      if (body === undefined) return yield* tooLarge;
      if (!isSignedBy(secret, body, request.headers.get("x-hub-signature-256"))) {
        return yield* unsigned;
      }
      const event = request.headers.get("x-github-event");
      const deliveryId = request.headers.get("x-github-delivery");
      if (event === null || deliveryId === null) return yield* missingHeaders;
      const decision = decideDelivery(event, deliveryId, new TextDecoder().decode(body), options);
      yield* apply(deliveryId, event, decision);
      return new Response(null, { status: 204 });
    }).pipe(Effect.catch(failed));

  return {
    runtime,
    serves: (request: Request) =>
      request.method === "POST" && new URL(request.url).pathname === PATH,
    handle,
  };
}
