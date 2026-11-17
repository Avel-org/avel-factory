import {
  type CanonStreamChunk,
  type ClientDto,
  CONTRACT_VERSION_HEADER,
  contract,
  type ErrorBody,
  errorMap,
  IDEMPOTENCY_KEY_HEADER,
  type MissionListRowDto,
  type PendingDecisionDto,
  type ProposalViewDto,
  REQUEST_ID_HEADER,
} from "@avel/contract";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { implement, type ORPCError, ValidationError } from "@orpc/server";
import { fixtures } from "#fixtures";
import {
  decisionChoices,
  type FactorySeed,
  refOf,
  type SeedRow,
  type StoredProposal,
  toPendingRow,
  toStoredProposal,
} from "#rows";
import * as world from "#world";

/**
 * The contract mock (UI contract section 2): m1's routes 52, 53 and 54, and route 19
 * (missions) and route 8 (clients) for the shell (shell-layout.md section 4), served through
 * `@avel/contract` by oRPC's OpenAPI handler, so paths, input validation, success statuses
 * and the error body are the contract's. Every error is m1's `ErrorBody`.
 */

/** The operator the mock records as `resolvedBy`: a fixed UUIDv7 (INT). */
export const MOCK_OPERATOR_ID = "0193a000-0000-7000-8000-000000000001";

export type MockRoute = 8 | 19 | 52 | 53 | 54;

export type MockFailure =
  | { status: number; code: string; data?: unknown; message?: string }
  | { network: true };

export interface RecordedRequest {
  route: MockRoute | null;
  method: string;
  path: string;
  requestId: string | null;
  idempotencyKey: string | null;
  /** The JSON body as received, before the handler; null when there's none. */
  body: unknown;
}

export interface Mock {
  /**
   * Serves /api/* like the server. When a network failure is set, it rejects with a TypeError
   * instead. Extra arguments are ignored, so it can be passed as createApiClient's `fetch`.
   */
  fetch(request: Request): Promise<Response>;
  /** Replaces the store with these rows. */
  seed(rows: SeedRow[]): void;
  /** Another tab or agent changed the proposal: version + 1. Returns the new version. */
  bumpVersion(proposalId: string): number;
  /** Decided elsewhere: state 'resolved', with choice, resolvedBy and resolvedAt set. */
  resolve(proposalId: string): void;
  /** Expired: expiresAt moves into the past. */
  expire(proposalId: string): void;
  /** Deleted: the row is no longer in the store (route 54 then answers NOT_FOUND). */
  remove(proposalId: string): void;
  /**
   * The next `times` requests to that route (default 1) fail, before any check. Each call
   * replaces any failure still pending for that route. An error failure is written raw, past
   * the contract's error schemas, as ErrorBody: status, then
   * { code, message: message ?? code, details: data, requestId }, with the usual headers.
   * Use it for what m1's schemas can't express (for example Step 1's INVALID_TRANSITION.state).
   */
  failNext(route: MockRoute, failure: MockFailure, opts?: { times?: number }): void;
  /** Route 52's next response carries this item as it is, after the store's rows (UC-24). */
  injectRawItem(item: Record<string, unknown>): void;
  /**
   * Every request the mock received, oldest first: also those failNext failed, a network
   * failure included, each with its requestId, idempotencyKey and body.
   */
  requests(): RecordedRequest[];
  reset(): void;
}

/**
 * Routes 52, 19 and 8 serve this many rows when the request sends no `limit` (provisional:
 * finding 25).
 */
const DEFAULT_LIMIT = 50;

type Json = Record<string, unknown>;

/** The route a request is for, by method and path; null for anything else. */
function routeOf(method: string, path: string): MockRoute | null {
  if (method === "GET" && path === "/api/clients") return 8;
  if (method === "GET" && path === "/api/missions") return 19;
  if (method === "GET" && path === "/api/pending-decisions") return 52;
  if (method === "GET" && /^\/api\/proposals\/[^/]+$/.test(path)) return 53;
  if (method === "POST" && /^\/api\/proposals\/[^/]+\/decisions$/.test(path)) return 54;
  return null;
}

/** The body as received: parsed JSON, the raw text when it isn't JSON, or null when empty. */
function readBody(text: string): unknown {
  if (text === "") return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** A JSON string with sorted keys, so two equal bodies compare equal (idempotency). */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Json)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** An issue's path joined with `.` (Axis, S1-3). */
function fieldOf(path: ReadonlyArray<PropertyKey | { key: PropertyKey }> | undefined): string {
  return (path ?? []).map((seg) => String(typeof seg === "object" ? seg.key : seg)).join(".");
}

/** Any ORPCError the handler raised, written as m1's ErrorBody (UI contract section 2). */
function toErrorBody(error: ORPCError<string, unknown>, requestId: string): ErrorBody {
  if (error.code === "BAD_REQUEST" && error.cause instanceof ValidationError) {
    const issues = error.cause.issues.map((issue) => ({
      field: fieldOf(issue.path),
      message: issue.message,
    }));
    const first = issues[0] ?? { field: "", message: error.message };
    return {
      code: "BAD_REQUEST",
      message: first.message,
      details: { field: first.field, issues },
      requestId,
    };
  }
  return {
    code: error.code,
    message: error.message,
    ...(error.data === undefined ? {} : { details: error.data as ErrorBody["details"] }),
    requestId,
  };
}

/** Route 52's opaque cursor: the last row's (createdAt, ref), encoded. */
function encodeCursor(createdAt: string, ref: string): string {
  return btoa(JSON.stringify([createdAt, ref]));
}

function decodeCursor(cursor: string): [number, string] | null {
  try {
    const value: unknown = JSON.parse(atob(cursor));
    if (!Array.isArray(value) || value.length !== 2) return null;
    const [createdAt, ref] = value as unknown[];
    if (typeof createdAt !== "string" || typeof ref !== "string") return null;
    const time = Date.parse(createdAt);
    return Number.isNaN(time) ? null : [time, ref];
  } catch {
    return null;
  }
}

/** Oldest first, by createdAt and then ref (CR-W2 6.7). */
function compareRows(a: [number, string], b: [number, string]): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
}

/** Routes 19 and 8: one page of `rows`, oldest first by createdAt and then id. */
function pageOf<T extends { id: string }>(
  rows: readonly T[],
  input: { cursor?: string | undefined; limit?: number | undefined },
  invalidCursor: () => Error,
  createdAtOf: (row: T) => string = (row) => (row as unknown as { createdAt: string }).createdAt,
): { items: T[]; nextCursor: string | null } {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const after = input.cursor === undefined ? null : decodeCursor(input.cursor);
  if (input.cursor !== undefined && after === null) throw invalidCursor();
  const listed = rows
    .map((row) => ({ row, key: [Date.parse(createdAtOf(row)), row.id] as [number, string] }))
    .sort((a, b) => compareRows(a.key, b.key))
    .filter((entry) => after === null || compareRows(entry.key, after) > 0);
  const page = listed.slice(0, limit);
  const last = page.at(-1);
  const nextCursor =
    listed.length > limit && last !== undefined
      ? encodeCursor(createdAtOf(last.row), last.row.id)
      : null;
  return { items: page.map((entry) => structuredClone(entry.row)), nextCursor };
}

export function createMock(opts: {
  contractVersion: string;
  now?: () => Date;
  /** Route 19's missions; `fixtures.step1Missions` by default, `[]` for none. */
  missions?: MissionListRowDto[];
  /**
   * Serve the control room's sample world (Fleet portal, Spring launch site, Booking fix,
   * Field app, Parts catalogue, Control room): its missions on route 19, a pending decision
   * of every kind on route 52, and every read the web's CRs added. The dev server sets it.
   */
  world?: boolean;
  /** Route 8's clients; `fixtures.step1Clients` by default, `[]` for none. */
  clients?: ClientDto[];
}): Mock {
  const now = opts.now ?? (() => new Date());
  // Read only: no route in the mock writes a mission or a client, so reset keeps them.
  const missions = structuredClone(
    opts.missions ?? (opts.world ? world.MISSION_ROWS : fixtures.step1Missions),
  );
  let worldDecisions: PendingDecisionDto[] = opts.world ? structuredClone(world.DECISIONS) : [];
  const followups = structuredClone(world.FOLLOWUPS);
  const leads = structuredClone(world.LEADS);
  const draft = structuredClone(world.TEMPLATE_DRAFT);
  const missionName = (missionId: string) => missions.find((m) => m.id === missionId)?.name ?? null;
  const clients = structuredClone(opts.clients ?? fixtures.step1Clients);
  const proposals = new Map<string, StoredProposal>();
  let factoryChanges: FactorySeed[] = [];
  let injected: Json[] = [];
  let recorded: RecordedRequest[] = [];
  const failures = new Map<MockRoute, { failure: MockFailure; remaining: number }>();
  const idempotency = new Map<
    string,
    { path: string; body: string; status: number; text: string }
  >();

  function proposal(proposalId: string): StoredProposal {
    const found = proposals.get(proposalId);
    if (found === undefined) throw new Error(`The mock's store has no proposal ${proposalId}`);
    return found;
  }

  function toProposalDto(row: StoredProposal): ProposalViewDto {
    const item = toPendingRow(row, 0, missionName) as Extract<
      PendingDecisionDto,
      { kind: "proposal" }
    >;
    return {
      ...item,
      state: row.state,
      choice: row.choice,
      choiceReason: row.choiceReason,
      resolvedBy: row.resolvedBy,
      resolvedAt: row.resolvedAt,
      supersededBy: null,
      rowVersion: row.rowVersion,
    };
  }

  /** Approving a world decision takes it off the list (it took effect). */
  function settle(ref: string) {
    worldDecisions = worldDecisions.filter((d) => d.ref !== ref);
  }

  async function* streamReply(text: string): AsyncGenerator<CanonStreamChunk> {
    const messageId = "0193b000-0000-7000-8000-000000000903";
    yield { type: "start", messageId };
    yield { type: "text-start", id: "t1" };
    for (const word of text.split(" ")) yield { type: "text-delta", id: "t1", delta: `${word} ` };
    yield { type: "text-end", id: "t1" };
    yield {
      type: "finish",
      messageMetadata: { messageId, status: "done", ttftMs: 400, totalMs: 1800 },
    };
  }

  const os = implement(contract);

  const invalidCursor =
    (errors: { BAD_REQUEST: (o: { message: string; data: unknown }) => Error }) => () =>
      errors.BAD_REQUEST({
        message: "invalid cursor",
        data: { field: "cursor", issues: [{ field: "cursor", message: "invalid cursor" }] },
      });

  const router = {
    clients: {
      list: os.clients.list.handler(({ input, errors }) =>
        pageOf(clients, input, invalidCursor(errors)),
      ),
    },

    missions: {
      list: os.missions.list.handler(({ input, errors }) =>
        pageOf(
          input.kind === undefined
            ? missions
            : missions.filter((row) =>
                input.kind === "unset" ? row.kind === null : row.kind === input.kind,
              ),
          { cursor: input.cursor, limit: input.limit },
          invalidCursor(errors),
          (row) => world.missionById(row.id)?.createdAt ?? row.lastEventAt ?? "",
        ),
      ),
      get: os.missions.get.handler(({ input, errors }) => {
        const mission = world.missionById(input.missionId);
        if (!mission) throw errors.NOT_FOUND();
        return {
          mission,
          gates: world.gatesOf(mission.id),
          onboarding: {
            session: null,
            progressPct: mission.state === "onboarding" ? 20 : 100,
            checkpoints: (["0.1", "0.2", "0.3", "0.4", "final"] as const).map((key, i) => ({
              key,
              checkpointId: null,
              state: mission.state === "onboarding" ? (i === 0 ? "draft" : "locked") : "approved",
              version: mission.state === "onboarding" && i > 0 ? null : 1,
              approvedAt: mission.state === "onboarding" ? null : mission.approvedAt,
            })),
            blockers:
              mission.kind === null
                ? [
                    {
                      kind: "question",
                      ref: `checkpoint_question:${"0193b000-0000-7000-8000-000000000501"}`,
                      text: "Client project or internal template?",
                      targetId: "0193b000-0000-7000-8000-000000000501",
                    },
                  ]
                : [],
            topics: [],
            canonSpentMicros: 1_200_000,
            operatorMinutes: 25,
          },
          checkpoints: [],
          deliveries: mission.state === "awaiting_release" ? [world.DELIVERY] : [],
        };
      }),
      listMessages: os.missions.listMessages.handler(() => ({
        items: world.CANON_MESSAGES,
        nextCursor: null,
      })),
      postMessage: os.missions.postMessage.handler(({ input }) =>
        streamReply(`Got it: ${input.text.slice(0, 80)}`),
      ),
      resumeMessage: os.missions.resumeMessage.handler(({ errors }) => {
        throw errors.STREAM_GONE();
      }),
      transcribe: os.missions.transcribe.handler(async function* () {
        yield { type: "partial", text: "Dale said the crews" };
        yield { type: "final", text: "Dale said the crews need offline sign-off. (sample call)" };
      }),
    },

    health: {
      status: os.health.status.handler(() => ({
        ...world.STATUS,
        needsYouCount:
          worldDecisions.length + [...proposals.values()].filter((p) => p.state === "open").length,
      })),
    },

    dispatches: {
      getModule: os.dispatches.getModule.handler(({ input, errors }) => {
        if (
          input.moduleRef !== world.MODULE_RUN.ref ||
          input.missionId !== world.MODULE_RUN.missionId
        )
          throw errors.NOT_FOUND();
        return world.MODULE_RUN;
      }),
      listSteps: os.dispatches.listSteps.handler(({ input }) => {
        const items = world.STEPS.filter(
          (st) => st.attemptId === input.attemptId && st.traceSeq > (input.after ?? 0),
        ).slice(0, input.limit ?? 100);
        return { items, lastSeq: items.at(-1)?.traceSeq ?? null };
      }),
    },

    receipts: {
      get: os.receipts.get.handler(async ({ input, errors }) => {
        const receipt = await world.buildReceipt();
        if (input.receiptId !== receipt.id) throw errors.NOT_FOUND();
        return input.verify
          ? { ...receipt, verified: { signature: true, checkedAt: new Date().toISOString() } }
          : receipt;
      }),
      artifact: os.receipts.artifact.handler(({ input, errors }) => {
        const text = world.ARTIFACT_FILES[input.key];
        if (text === undefined) throw errors.NOT_FOUND();
        return new File([text], `${input.key}.txt`, { type: "text/plain" });
      }),
    },

    dispatchPackage: {
      commit: os.dispatchPackage.commit.handler(({ input, errors }) => {
        const item = worldDecisions.find(
          (d) => d.kind === "dispatch_package_commit" && d.target.missionId === input.missionId,
        );
        if (item?.kind !== "dispatch_package_commit") throw errors.NOT_FOUND();
        if (item.target.packageHash !== input.packageHash)
          throw errors.STALE_VERSION({
            data: { field: "packageHash", currentVersion: item.target.packageHash, current: item },
          });
        settle(item.ref);
        return {
          missionId: input.missionId,
          packageHash: input.packageHash,
          state: "committing",
          confirmedAt: new Date().toISOString(),
        };
      }),
    },

    leads: {
      list: os.leads.list.handler(() => ({ items: leads, nextCursor: null })),
      create: os.leads.create.handler(({ input }) => {
        const now0 = new Date().toISOString();
        const lead = {
          ...(world.LEADS[0] as (typeof world.LEADS)[number]),
          id: crypto.randomUUID(),
          clientId: crypto.randomUUID(),
          clientName: input.name,
          source: input.source,
          referrerName: input.referrerName ?? null,
          notes: input.notes ?? null,
          firstContactAt: input.firstContactAt ?? now0,
          createdAt: now0,
          updatedAt: now0,
        };
        leads.push(lead);
        return lead;
      }),
      close: os.leads.close.handler(({ input, errors }) => {
        const lead = leads.find((l) => l.id === input.leadId);
        if (!lead) throw errors.NOT_FOUND();
        if (lead.rowVersion !== input.rowVersion)
          throw errors.STALE_VERSION({
            data: { field: "rowVersion", currentVersion: lead.rowVersion },
          });
        Object.assign(lead, {
          lostReason: input.lostReason,
          lostAt: new Date().toISOString(),
          stage: "lost",
          rowVersion: lead.rowVersion + 1,
        });
        return lead;
      }),
    },

    followups: {
      get: os.followups.get.handler(({ input, errors }) => {
        const f = followups.find((x) => x.id === input.followupId);
        if (!f) throw errors.NOT_FOUND();
        return f;
      }),
      send: os.followups.send.handler(({ input, errors }) => {
        const f = followups.find((x) => x.id === input.followupId);
        if (!f) throw errors.NOT_FOUND();
        if (f.draftHash !== input.draftHash)
          throw errors.STALE_VERSION({
            data: { field: "draftHash", currentVersion: f.draftHash, current: f },
          });
        if (f.unsubscribed) throw errors.CONTACT_UNSUBSCRIBED();
        Object.assign(
          f,
          input.outcome === "sent"
            ? {
                state: "sent",
                sentAt: new Date().toISOString(),
                sentBy: f.channel === "copy" ? "you" : "factory",
              }
            : { state: "skipped" },
        );
        f.rowVersion += 1;
        settle(
          worldDecisions.find(
            (d) =>
              (d.kind === "followup_send" || d.kind === "upkeep_offer") &&
              d.target.followupId === f.id,
          )?.ref ?? "",
        );
        return f;
      }),
    },

    pipeline: { get: os.pipeline.get.handler(() => world.PIPELINE) },

    skills: { results: os.skills.results.handler(() => world.SKILL_RESULTS) },

    evals: {
      getRun: os.evals.getRun.handler(({ input, errors }) => {
        if (input.runId !== world.EVAL_RUN.id) throw errors.NOT_FOUND();
        return world.EVAL_RUN;
      }),
    },

    templates: {
      source: os.templates.source.handler(({ input, errors }) => {
        if (input.missionId !== world.TEMPLATE_SOURCE.missionId) throw errors.SOURCE_NOT_SHIPPED();
        return world.TEMPLATE_SOURCE;
      }),
      getDraft: os.templates.getDraft.handler(({ input, errors }) => {
        if (input.draftId !== draft.id) throw errors.NOT_FOUND();
        return draft;
      }),
      saveDraft: os.templates.saveDraft.handler(({ input, errors }) => {
        if (
          input.draftId === draft.id &&
          input.rowVersion !== undefined &&
          input.rowVersion !== draft.rowVersion
        )
          throw errors.STALE_VERSION({
            data: { field: "rowVersion", currentVersion: draft.rowVersion },
          });
        const savedAt = new Date().toISOString();
        Object.assign(draft, {
          id: input.draftId,
          name: input.name,
          pitch: input.pitch,
          bestFor: input.bestFor ?? null,
          docs: input.docs,
          modules: input.modules,
          slug: input.slug ?? draft.slug,
          savedAt,
          updatedAt: savedAt,
          rowVersion: draft.rowVersion + 1,
        });
        return draft;
      }),
      openDraftPr: os.templates.openDraftPr.handler(({ input, errors }) => {
        if (input.draftId !== draft.id) throw errors.NOT_FOUND();
        if (draft.name === "" || draft.pitch === "" || draft.modules.length === 0)
          throw errors.TEMPLATE_DOCS_INVALID({
            data: { issues: [{ path: "name", rule: "A name and a pitch" }] },
          });
        draft.state = "pr_open";
        draft.prNumber = 150;
        return { prNumber: 150, decisionRef: "factory_change:150" };
      }),
    },

    events: {
      stream: os.events.stream.handler(async function* ({ input }) {
        for (const event of await world.sampleEvents()) {
          if (
            input.missionId === undefined ||
            event.missionId === null ||
            event.missionId === input.missionId
          )
            yield event;
        }
      }),
    },

    decisions: {
      listPending: os.decisions.listPending.handler(({ input, errors }) => {
        const limit = input.limit ?? DEFAULT_LIMIT;
        const after = input.cursor === undefined ? null : decodeCursor(input.cursor);
        if (input.cursor !== undefined && after === null) {
          throw errors.BAD_REQUEST({
            message: "invalid cursor",
            data: { field: "cursor", issues: [{ field: "cursor", message: "invalid cursor" }] },
          });
        }
        const time = now().getTime();
        const listed = [
          ...[...proposals.values()].filter(
            (row) => row.state === "open" && Date.parse(row.expiresAt) > time,
          ),
          ...factoryChanges,
        ]
          .map((row) => ({ row, key: [Date.parse(row.createdAt), refOf(row)] as [number, string] }))
          .sort((a, b) => compareRows(a.key, b.key))
          .filter((entry) => after === null || compareRows(entry.key, after) > 0);
        const page = listed.slice(0, limit);
        const last = page.at(-1);
        const nextCursor =
          listed.length > limit && last !== undefined
            ? encodeCursor(last.row.createdAt, last.key[1])
            : null;
        const mine =
          input.missionId === undefined
            ? worldDecisions
            : worldDecisions.filter((d) => d.mission?.id === input.missionId);
        const items = [
          // CR-W15: items that came back go first
          ...mine.filter((d) => d.previous?.tookEffect === false),
          ...page.map((entry) => toPendingRow(entry.row, 0, missionName)),
          ...mine.filter((d) => d.previous?.tookEffect !== false),
          ...injected,
        ];
        injected = [];
        return { items: items as PendingDecisionDto[], nextCursor };
      }),

      getProposal: os.decisions.getProposal.handler(({ input, errors }) => {
        const row = proposals.get(input.proposalId);
        if (row === undefined) throw errors.NOT_FOUND();
        return toProposalDto(row);
      }),

      // Check 1 (the schema) has run by now; the path's proposalId has won (S1-5, D48).
      decide: os.decisions.decide.handler(({ input, errors }) => {
        const row = proposals.get(input.proposalId);
        // 2. No such proposal.
        if (row === undefined) throw errors.NOT_FOUND();
        // 3. Not open, or past expiresAt. m1's schema has no `state` (UC-17 uses failNext).
        const at = now();
        if (row.state !== "open" || Date.parse(row.expiresAt) <= at.getTime()) {
          throw errors.INVALID_TRANSITION({ data: { allowed: [] } });
        }
        // 4. A stale version.
        if (input.version !== row.version) {
          throw errors.STALE_VERSION({
            data: { field: "version", currentVersion: row.version },
          });
        }
        // 5. A choice the proposal doesn't offer.
        const offered = decisionChoices(row.options)?.choices ?? [];
        if (!offered.includes(input.choice)) {
          throw errors.BAD_REQUEST({ data: { field: "choice" } });
        }
        const resolvedAt = at.toISOString();
        row.state = "resolved";
        row.choice = input.choice;
        row.choiceReason = input.reason;
        row.resolvedBy = MOCK_OPERATOR_ID;
        row.resolvedAt = resolvedAt;
        row.rowVersion += 1;
        row.updatedAt = resolvedAt;
        return toProposalDto(row);
      }),
    },
  };

  function respond(
    status: number,
    text: string,
    requestId: string,
    headers: HeadersInit = { "content-type": "application/json" },
  ): Response {
    const all = new Headers(headers);
    all.set(REQUEST_ID_HEADER, requestId);
    all.set(CONTRACT_VERSION_HEADER, opts.contractVersion);
    return new Response(status === 204 ? null : text, { status, headers: all });
  }

  function respondError(status: number, body: ErrorBody, requestId: string): Response {
    return respond(status, JSON.stringify(body), requestId);
  }

  async function serve(request: Request, requestId: string): Promise<Response> {
    // A handler per request, so its error encoder can write this request's ID.
    const handler = new OpenAPIHandler(router, {
      customErrorResponseBodyEncoder: (error) => toErrorBody(error, requestId),
    });
    const result = await handler.handle(request);
    if (!result.matched) {
      return respondError(
        404,
        { code: "NOT_FOUND", message: errorMap.NOT_FOUND.message, requestId },
        requestId,
      );
    }
    const text = await result.response.text();
    return respond(result.response.status, text, requestId, result.response.headers);
  }

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method.toUpperCase();
      const route = routeOf(method, path);
      const sentId = request.headers.get(REQUEST_ID_HEADER);
      const requestId = sentId ?? crypto.randomUUID();
      const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER);
      const bodyText = method === "GET" || method === "HEAD" ? "" : await request.clone().text();
      const body = readBody(bodyText);
      recorded.push({ route, method, path, requestId: sentId, idempotencyKey, body });

      // failNext: before any check.
      const pending = route === null ? undefined : failures.get(route);
      if (route !== null && pending !== undefined) {
        pending.remaining -= 1;
        if (pending.remaining <= 0) failures.delete(route);
        const { failure } = pending;
        if ("network" in failure) throw new TypeError("Failed to fetch");
        const raw = {
          code: failure.code,
          message: failure.message ?? failure.code,
          details: failure.data,
          requestId,
        };
        return respond(failure.status, JSON.stringify(raw), requestId);
      }

      if (path !== "/api" && !path.startsWith("/api/")) {
        return respondError(
          404,
          { code: "NOT_FOUND", message: errorMap.NOT_FOUND.message, requestId },
          requestId,
        );
      }

      if (route !== 54) return serve(request, requestId);

      // Route 54: the key first (Axis, S1-1 and S1-3), then the idempotency rules.
      if (idempotencyKey === null || idempotencyKey === "") {
        return respondError(
          400,
          {
            code: "BAD_REQUEST",
            message: "required",
            details: {
              field: IDEMPOTENCY_KEY_HEADER,
              issues: [{ field: IDEMPOTENCY_KEY_HEADER, message: "required" }],
            },
            requestId,
          },
          requestId,
        );
      }
      const bodyKey = canonical(body);
      const seen = idempotency.get(idempotencyKey);
      if (seen !== undefined) {
        if (seen.path === path && seen.body === bodyKey) {
          return respond(seen.status, seen.text, requestId);
        }
        return respondError(
          409,
          {
            code: "IDEMPOTENCY_KEY_REUSED",
            message: errorMap.IDEMPOTENCY_KEY_REUSED.message,
            requestId,
          },
          requestId,
        );
      }
      const response = await serve(request, requestId);
      const text = await response.clone().text();
      idempotency.set(idempotencyKey, { path, body: bodyKey, status: response.status, text });
      return response;
    },

    seed(rows) {
      proposals.clear();
      factoryChanges = [];
      for (const row of rows) {
        if (row.kind === "proposal") proposals.set(row.id, toStoredProposal(row));
        else factoryChanges.push({ ...row });
      }
    },

    bumpVersion(proposalId) {
      const row = proposal(proposalId);
      row.version += 1;
      row.rowVersion += 1;
      row.updatedAt = now().toISOString();
      return row.version;
    },

    resolve(proposalId) {
      const row = proposal(proposalId);
      const at = now().toISOString();
      row.state = "resolved";
      row.choice = decisionChoices(row.options)?.approve.choice ?? "approve";
      row.choiceReason = "Decided elsewhere.";
      row.resolvedBy = MOCK_OPERATOR_ID;
      row.resolvedAt = at;
      row.rowVersion += 1;
      row.updatedAt = at;
    },

    expire(proposalId) {
      const row = proposal(proposalId);
      const at = now();
      row.expiresAt = new Date(at.getTime() - 1000).toISOString();
      row.rowVersion += 1;
      row.updatedAt = at.toISOString();
    },

    remove(proposalId) {
      proposal(proposalId);
      proposals.delete(proposalId);
    },

    failNext(route, failure, failOpts) {
      failures.set(route, { failure, remaining: Math.max(1, failOpts?.times ?? 1) });
    },

    injectRawItem(item) {
      injected.push(structuredClone(item));
    },

    requests() {
      return recorded.map((entry) => ({ ...entry }));
    },

    reset() {
      proposals.clear();
      factoryChanges = [];
      injected = [];
      recorded = [];
      failures.clear();
      idempotency.clear();
    },
  };
}
