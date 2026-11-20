import { createHmac, timingSafeEqual } from "node:crypto";
import { type ErrorBody, type EventOf, errorMap, errorStatus } from "@avel/contract";
import { users, webhookDeliveries } from "@avel/db";
import { Clock, ConfigProvider, Effect, Layer, ManagedRuntime, Redacted } from "effect";
import { z } from "zod";
import { FactoryVersions, isCommitSha } from "../../knowledge/index.ts";
import { ClientIp } from "../auth/services.ts";
import { Db, DbLive, Tx } from "../db/db.ts";
import { Events } from "../db/events.ts";
import { errorTable, type MappedError } from "../errors.ts";
import { RateLimit, RateLimitLive } from "../rate-limit.ts";
import { RequestId } from "../request-id.ts";

/** The GitHub webhook's settings (createApp's `webhook`). */
export interface WebhookOptions {
  readonly databaseUrl: string;
  /** GITHUB_WEBHOOK_SECRET: GitHub signs every delivery's raw body with it. */
  readonly secret: string;
  /** The factory repo, as "owner/name". */
  readonly repo: string;
  /** The factory's GitHub App, as GitHub names it in `merged_by.login`. */
  readonly appLogin: string;
}

const PATH = "/api/webhooks/github";

/** The factory repo's protected branch (Design v0.6, Factory as code). */
const FACTORY_BRANCH = "main";

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

/**
 * What a signed delivery does (plain TypeScript, Writing Effect rule 10): a pull request merged
 * into the factory repo's main is a merge; every other event, repo or branch is ignored.
 * GitHub's repo names are case-insensitive.
 */
function decideDelivery(
  event: string,
  body: string,
  options: Pick<WebhookOptions, "repo" | "appLogin">,
): Merge | undefined {
  if (event !== "pull_request") return undefined;
  const parsed = MergedPullRequest.safeParse(parseJson(body));
  if (!parsed.success) return undefined;
  const { pull_request: pr, repository } = parsed.data;
  if (repository.full_name.toLowerCase() !== options.repo.toLowerCase()) return undefined;
  if (pr.base.ref !== FACTORY_BRANCH) return undefined;
  return {
    sha: pr.merge_commit_sha,
    mergedAt: new Date(pr.merged_at),
    mergedByApp: pr.merged_by.login === options.appLogin,
    summary: pr.title,
    prNumber: pr.number,
  };
}

/** The alert a merge by anyone but the factory's App raises; finalize stays frozen while it stands. */
const unexpectedMerge = (sha: string, since: string) =>
  ({
    alert: {
      key: `unexpected_factory_merge:${sha}`,
      kind: "unexpected_factory_merge",
      severity: "stopped",
      missionId: null,
      plain: "A factory change was merged without the factory's App, so finalize is frozen",
      since,
    },
  }) satisfies EventOf<"system.alert.raised">["payload"];

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
  /** The webhook's rate limiter and database pool, built once per app. */
  readonly runtime: ManagedRuntime.ManagedRuntime<RateLimit | Db, never>;
  /** Whether a request is a delivery to the webhook. */
  readonly serves: (request: Request) => boolean;
  /** Answers a request `serves` accepts. */
  readonly handle: (
    request: Request,
  ) => Effect.Effect<Response, never, RateLimit | Db | RequestId | ClientIp>;
}

export function makeGithubWebhook(
  options: WebhookOptions,
  clock: Clock.Clock | undefined,
): GithubWebhook {
  const secret = Redacted.make(options.secret);
  const db = DbLive.pipe(
    Layer.provide(
      ConfigProvider.layerAdd(ConfigProvider.fromEnvRecord({ DATABASE_URL: options.databaseUrl }), {
        asPrimary: true,
      }),
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

  /**
   * One signed delivery, once: its webhook_deliveries row, the factory_versions row of a merge,
   * and the alert of a merge the App didn't make commit together. A replayed X-GitHub-Delivery
   * finds its row and does nothing.
   */
  const apply = (deliveryId: string, event: string, merge: Merge | undefined) =>
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
          if (fresh.length === 0 || merge === undefined) return;
          yield* FactoryVersions.record({ ...merge, approvedBy: yield* operatorId });
          if (merge.mergedByApp) return;
          const now = yield* Clock.currentTimeMillis;
          yield* Events.append({
            schemaVersion: 1,
            kind: "system.alert.raised",
            payload: unexpectedMerge(merge.sha, new Date(now).toISOString()),
          });
          yield* database.commitWithEvents;
        }),
      );
    });

  const handle = (request: Request) =>
    Effect.gen(function* () {
      const limiter = yield* RateLimit;
      yield* limiter.check("webhook", yield* ClientIp);
      const body = new Uint8Array(yield* Effect.promise(() => request.arrayBuffer()));
      if (!isSignedBy(secret, body, request.headers.get("x-hub-signature-256"))) {
        return yield* unsigned;
      }
      const event = request.headers.get("x-github-event");
      const deliveryId = request.headers.get("x-github-delivery");
      if (event === null || deliveryId === null) return yield* missingHeaders;
      const merge = decideDelivery(event, new TextDecoder().decode(body), options);
      yield* apply(deliveryId, event, merge);
      return new Response(null, { status: 204 });
    }).pipe(Effect.catch(failed));

  return {
    runtime,
    serves: (request: Request) =>
      request.method === "POST" && new URL(request.url).pathname === PATH,
    handle,
  };
}
