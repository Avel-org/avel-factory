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
 *
 * CR-W31 part (a): routes 9, 10, 20, 21, 28 to 30, 40, 44, 104, 108 and 114 over the missions
 * the routes make and move (`world.ts`, its mission state module), and routes 8, 19 and 52 read the same world.
 */

/** The operator the mock records as `resolvedBy`: a fixed UUIDv7 (INT). */
export const MOCK_OPERATOR_ID = fixtures.operator.id;

/** The routes the mock names by number (API routes.md), for `failNext` and `requests()`. */
export type MockRoute =
  | 8
  | 9
  | 10
  | 19
  | 20
  | 21
  | 28
  | 29
  | 30
  | 40
  | 44
  | 52
  | 53
  | 54
  | 104
  | 108
  | 114;

/** The writes that require an `Idempotency-Key` and replay their first response. */
const KEYED_WRITES: ReadonlySet<MockRoute> = new Set<MockRoute>([
  9, 20, 28, 29, 30, 40, 44, 54, 114,
]);

export type { MissionStage } from "#world";

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
  /**
   * Puts the world's one internal client (AVEL) and one mission at `stage`, replacing the
   * mission an earlier call seeded. Every move after that goes through the routes.
   */
  seedMission(stage: world.MissionStage): { missionId: string; clientId: string };
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
  /** The same log as `requests()`: auth requests carry route null and the password as "[redacted]". */
  recorded(): RecordedRequest[];
  /**
   * Clears failure counts and lockouts, the seeded rows, and the clients and missions the
   * routes made, and keeps sessions.
   */
  reset(): void;
  /** `reset()`, and forgets every session. */
  resetAuth(): void;
}

/** seedMission's mission: one ID, so a second seed replaces the first. */
const SEEDED_MISSION_ID = "0193c000-0000-7000-8000-000000000000";

/**
 * Routes 52, 19 and 8 serve this many rows when the request sends no `limit` (provisional:
 * finding 25).
 */
const DEFAULT_LIMIT = 50;

type Json = Record<string, unknown>;

/** The auth mock's rules (login.md section 5). */
const AUTH_PREFIX = "/api/auth/";
const SESSION_COOKIE = "better-auth.session_token";
const SESSION_MS = 12 * 60 * 60_000;
const LOCKOUT_MS = 15 * 60_000;
const MAX_FAILURES = 10;
const COOKIE_ATTRS = "Path=/; HttpOnly; SameSite=Lax";

/** The session token in a request's `cookie` header, or null. */
function sessionTokenOf(request: Request): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=");
  }
  return null;
}

/** The body as logged: an auth request's password never leaves the handler. */
function redacted(body: unknown): unknown {
  if (body === null || typeof body !== "object" || !("password" in body)) return body;
  return { ...(body as Json), password: "[redacted]" };
}

/** Each named route's method and path, as API routes.md numbers them. */
const ROUTES: ReadonlyArray<[MockRoute, string, RegExp]> = [
  [8, "GET", /^\/api\/clients$/],
  [9, "POST", /^\/api\/clients$/],
  [10, "GET", /^\/api\/clients\/[^/]+$/],
  [19, "GET", /^\/api\/missions$/],
  [20, "POST", /^\/api\/missions$/],
  [21, "GET", /^\/api\/missions\/[^/]+$/],
  [28, "POST", /^\/api\/missions\/[^/]+\/finalizations$/],
  [29, "POST", /^\/api\/missions\/[^/]+\/pass-approvals$/],
  [30, "POST", /^\/api\/missions\/[^/]+\/releases$/],
  [40, "POST", /^\/api\/checkpoints\/[^/]+\/approvals$/],
  [44, "POST", /^\/api\/questions\/[^/]+\/answers$/],
  [52, "GET", /^\/api\/pending-decisions$/],
  [53, "GET", /^\/api\/proposals\/[^/]+$/],
  [54, "POST", /^\/api\/proposals\/[^/]+\/decisions$/],
  [104, "GET", /^\/api\/status$/],
  [108, "GET", /^\/api\/missions\/[^/]+\/modules\/[^/]+$/],
  [114, "POST", /^\/api\/missions\/[^/]+\/dispatch-package\/commits$/],
];

/** The route a request is for, by method and path; null for anything else. */
function routeOf(method: string, path: string): MockRoute | null {
  return ROUTES.find(([, m, pattern]) => m === method && pattern.test(path))?.[0] ?? null;
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
  // The sample missions are read only; route 20's and seedMission's are in `liveMissions`.
  const missions = structuredClone(
    opts.missions ?? (opts.world ? world.MISSION_ROWS : fixtures.step1Missions),
  );
  let worldDecisions: PendingDecisionDto[] = opts.world ? structuredClone(world.DECISIONS) : [];
  const followups = structuredClone(world.FOLLOWUPS);
  const leads = structuredClone(world.LEADS);
  const draft = structuredClone(world.TEMPLATE_DRAFT);
  const missionName = (missionId: string) =>
    liveMissions.get(missionId)?.mission.name ??
    missions.find((m) => m.id === missionId)?.name ??
    null;
  const initialClients = opts.clients ?? fixtures.step1Clients;
  let clients = structuredClone(initialClients);
  /** The missions route 20 and seedMission made, by ID (CR-W31 part a). */
  const liveMissions = new Map<string, world.LiveMission>();
  let idCount = 0;
  /** UUIDv7-shaped IDs, in the order the mock makes them. */
  const nextId = () => `0193c000-0000-7000-8000-${String(++idCount).padStart(12, "0")}`;
  const ctx = (): world.Ctx => ({ ids: nextId, at: now().toISOString() });
  const proposals = new Map<string, StoredProposal>();
  let factoryChanges: FactorySeed[] = [];
  let injected: Json[] = [];
  let recorded: RecordedRequest[] = [];
  const failures = new Map<MockRoute, { failure: MockFailure; remaining: number }>();
  const sessions = new Map<string, { id: string; expiresAt: number }>();
  const signInState = new Map<string, { failures: number[]; lockedUntil: number }>();
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

  /** Route 52's proposals: open and not past expiresAt. */
  function openProposals(): StoredProposal[] {
    const time = now().getTime();
    return [...proposals.values()].filter(
      (row) => row.state === "open" && Date.parse(row.expiresAt) > time,
    );
  }

  /** The live missions' route 52 rows, for one mission or all. */
  function liveRows(missionId?: string): PendingDecisionDto[] {
    return [...liveMissions.values()]
      .filter((m) => missionId === undefined || m.mission.id === missionId)
      .flatMap(world.pendingRows);
  }

  function checkpointById(checkpointId: string) {
    for (const m of liveMissions.values()) {
      const cp = m.checkpoints.find((c) => c.id === checkpointId);
      if (cp) return { m, cp };
    }
    return undefined;
  }

  const questionOf = (questionId: string) =>
    [...liveMissions.values()].find((m) => m.question.id === questionId);

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
      // The internal client only with ?kind=internal (CR-W22).
      list: os.clients.list.handler(({ input, errors }) =>
        pageOf(
          clients.filter((c) => c.kind === (input.kind ?? "client")),
          input,
          invalidCursor(errors),
        ),
      ),
      create: os.clients.create.handler(({ input }) => {
        const at = now().toISOString();
        const client: ClientDto = {
          id: nextId(),
          name: input.name,
          contacts: input.contacts ?? [],
          status: "active",
          archivedAt: null,
          kind: input.kind,
          proofConsentAt: null,
          createdAt: at,
          rowVersion: 1,
          updatedAt: at,
        };
        clients.push(client);
        return structuredClone(client);
      }),
      get: os.clients.get.handler(({ input, errors }) => {
        const client = clients.find((c) => c.id === input.clientId);
        if (!client) throw errors.NOT_FOUND();
        return structuredClone(client);
      }),
    },

    missions: {
      list: os.missions.list.handler(({ input, errors }) => {
        const rows = [...missions, ...[...liveMissions.values()].map(world.listRow)];
        return pageOf(
          input.kind === undefined
            ? rows
            : rows.filter((row) =>
                input.kind === "unset" ? row.kind === null : row.kind === input.kind,
              ),
          { cursor: input.cursor, limit: input.limit },
          invalidCursor(errors),
          (row) =>
            liveMissions.get(row.id)?.mission.createdAt ??
            world.missionById(row.id)?.createdAt ??
            row.lastEventAt ??
            "",
        );
      }),
      create: os.missions.create.handler(({ input }) => {
        const client = clients.find((c) => c.id === input.clientId);
        const m = world.newMission(ctx(), {
          name: input.name,
          startedFrom: client ? { id: client.id, name: client.name } : null,
        });
        liveMissions.set(m.mission.id, m);
        return world.missionDto(m);
      }),
      get: os.missions.get.handler(({ input, errors }) => {
        const made = liveMissions.get(input.missionId);
        if (made) return world.detail(made);
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

      // Route 28, approval #1: only once 0.4 is approved, at the plan's version.
      finalize: os.missions.finalize.handler(({ input, errors }) => {
        const m = liveMissions.get(input.missionId);
        if (!m) throw errors.NOT_FOUND();
        if (!world.canFinalize(m))
          throw errors.INVALID_TRANSITION({
            data: { state: m.mission.state, allowed: world.allowedMoves(m) },
          });
        if (input.version !== m.plan.version)
          throw errors.STALE_VERSION({
            data: {
              field: "version",
              currentVersion: m.plan.version,
              current: world.rowOf(m, "plan_finalize"),
            },
          });
        return world.finalize(m, ctx());
      }),

      // Route 29: a pass at Gate 5, bound to its receipt's hash, with a reason.
      approvePass: os.missions.approvePass.handler(({ input, errors }) => {
        const m = liveMissions.get(input.missionId);
        if (!m) throw errors.NOT_FOUND();
        const item = world.rowOf(m, "pass_approval");
        if (!item)
          throw errors.INVALID_TRANSITION({
            data: { state: m.mission.state, allowed: world.allowedMoves(m) },
          });
        if (input.receiptHash !== item.target.receiptHash)
          throw errors.STALE_VERSION({
            data: { field: "receiptHash", currentVersion: item.target.receiptHash, current: item },
          });
        return world.approvePass(m, ctx(), input.reason, MOCK_OPERATOR_ID);
      }),

      // Route 30, approval #2: bound to the receipt's hash and, for a pass, its pass approval.
      release: os.missions.release.handler(({ input, errors }) => {
        const m = liveMissions.get(input.missionId);
        if (!m) throw errors.NOT_FOUND();
        const item = world.rowOf(m, "release");
        if (!item)
          throw errors.INVALID_TRANSITION({
            data: { state: m.mission.state, allowed: world.allowedMoves(m) },
          });
        if (input.receiptHash !== item.target.receiptHash)
          throw errors.STALE_VERSION({
            data: { field: "receiptHash", currentVersion: item.target.receiptHash, current: item },
          });
        if ((input.passApprovalId ?? null) !== item.target.passApprovalId)
          throw errors.BAD_REQUEST({ data: { field: "passApprovalId" } });
        return world.release(m, ctx(), MOCK_OPERATOR_ID);
      }),
    },

    gate0: {
      // Route 40: the one draft checkpoint, at the rowVersion you saw.
      approveCheckpoint: os.gate0.approveCheckpoint.handler(({ input, errors }) => {
        const found = checkpointById(input.checkpointId);
        if (!found) throw errors.NOT_FOUND();
        const { m, cp } = found;
        if (world.openCheckpoint(m) !== cp)
          throw errors.INVALID_TRANSITION({ data: { state: cp.state, allowed: [] } });
        if (input.rowVersion !== cp.rowVersion)
          throw errors.STALE_VERSION({
            data: {
              field: "rowVersion",
              currentVersion: cp.rowVersion,
              current: world.rowOf(m, "checkpoint"),
            },
          });
        return world.approveCheckpoint(m, ctx(), cp, MOCK_OPERATOR_ID);
      }),

      // Route 44: Q-0.1a, once, with one of its options or `other` in your own words.
      answerQuestion: os.gate0.answerQuestion.handler(({ input, errors }) => {
        const m = questionOf(input.questionId);
        if (!m) throw errors.NOT_FOUND();
        const q = m.question;
        // Answered once: a question has no state column, so the details carry no `state`.
        if (q.answeredAt !== null) throw errors.INVALID_TRANSITION({ data: { allowed: [] } });
        if (input.rowVersion !== q.rowVersion)
          throw errors.STALE_VERSION({
            data: {
              field: "rowVersion",
              currentVersion: q.rowVersion,
              current: world.rowOf(m, "checkpoint_question"),
            },
          });
        if (input.choice !== "other" && !world.KIND_OPTIONS.some((o) => o.id === input.choice))
          throw errors.BAD_REQUEST({ data: { field: "choice" } });
        return world.answerQuestion(m, ctx(), input.choice, input.answer);
      }),
    },

    health: {
      // What needs you is what route 52 lists.
      status: os.health.status.handler(() => ({
        ...world.STATUS,
        needsYouCount:
          worldDecisions.length +
          openProposals().length +
          factoryChanges.length +
          liveRows().length,
      })),
    },

    dispatches: {
      getModule: os.dispatches.getModule.handler(({ input, errors }) => {
        const made = liveMissions.get(input.missionId);
        if (made) {
          const run = world.moduleRun(made, input.moduleRef);
          if (!run) throw errors.NOT_FOUND();
          return run;
        }
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
        const made = liveMissions.get(input.missionId);
        if (made) {
          if (made.mission.renderedAt === null) throw errors.GATE1_NOT_PASSED();
          const row = world.rowOf(made, "dispatch_package_commit");
          if (!row)
            throw errors.INVALID_TRANSITION({
              data: { state: made.packageCommit?.state ?? made.mission.state, allowed: [] },
            });
          if (input.packageHash !== row.target.packageHash)
            throw errors.STALE_VERSION({
              data: { field: "packageHash", currentVersion: row.target.packageHash, current: row },
            });
          return world.commitPackage(made, ctx());
        }
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
        const listed = [...openProposals(), ...factoryChanges]
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
          ...liveRows(input.missionId),
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

  function json(status: number, body: unknown, requestId: string, extra: HeadersInit = {}) {
    return respond(status, JSON.stringify(body), requestId, {
      "content-type": "application/json",
      ...extra,
    });
  }

  /** Better Auth's three endpoints (login.md section 5); every other /api/auth/* path is 404. */
  function serveAuth(
    request: Request,
    method: string,
    path: string,
    body: unknown,
    requestId: string,
  ): Response {
    const at = now().getTime();
    const operator = fixtures.operator;

    if (method === "POST" && path === `${AUTH_PREFIX}sign-in/email`) {
      const { email, password } = (body ?? {}) as Json;
      const key = typeof email === "string" ? email : "";
      const state = signInState.get(key) ?? { failures: [], lockedUntil: 0 };
      signInState.set(key, state);
      if (state.lockedUntil > at) {
        return json(429, { code: "TOO_MANY_ATTEMPTS", message: "Too many attempts" }, requestId, {
          "x-retry-after": String(Math.ceil((state.lockedUntil - at) / 1000)),
        });
      }
      if (state.lockedUntil !== 0) state.failures = [];
      state.lockedUntil = 0;
      state.failures = state.failures.filter((t) => t > at - LOCKOUT_MS);
      if (email !== operator.email || password !== operator.password) {
        state.failures.push(at);
        if (state.failures.length >= MAX_FAILURES) state.lockedUntil = at + LOCKOUT_MS;
        return json(
          401,
          { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" },
          requestId,
        );
      }
      const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
      sessions.set(token, { id: crypto.randomUUID(), expiresAt: at + SESSION_MS });
      return json(
        200,
        {
          redirect: false,
          token,
          user: { id: operator.id, email: operator.email, name: operator.name },
        },
        requestId,
        { "set-cookie": `${SESSION_COOKIE}=${token}; ${COOKIE_ATTRS}` },
      );
    }

    if (method === "GET" && path === `${AUTH_PREFIX}get-session`) {
      const token = sessionTokenOf(request);
      const session = token === null ? undefined : sessions.get(token);
      if (token === null || session === undefined || session.expiresAt <= at) {
        return json(200, null, requestId);
      }
      return json(
        200,
        {
          session: {
            id: session.id,
            userId: operator.id,
            expiresAt: new Date(session.expiresAt).toISOString(),
            token,
            ipAddress: null,
          },
          user: { id: operator.id, email: operator.email, name: operator.name },
        },
        requestId,
      );
    }

    if (method === "POST" && path === `${AUTH_PREFIX}sign-out`) {
      const token = sessionTokenOf(request);
      if (token !== null) sessions.delete(token);
      return json(200, { success: true }, requestId, {
        "set-cookie": `${SESSION_COOKIE}=; ${COOKIE_ATTRS}; Max-Age=0`,
      });
    }

    return respondError(
      404,
      { code: "NOT_FOUND", message: errorMap.NOT_FOUND.message, requestId },
      requestId,
    );
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

  function reset() {
    signInState.clear();
    clients = structuredClone(initialClients);
    liveMissions.clear();
    proposals.clear();
    factoryChanges = [];
    injected = [];
    recorded = [];
    failures.clear();
    idempotency.clear();
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
      const isAuth = path.startsWith(AUTH_PREFIX);
      recorded.push({
        route,
        method,
        path,
        requestId: sentId,
        idempotencyKey,
        body: isAuth ? redacted(body) : body,
      });

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

      if (isAuth) return serveAuth(request, method, path, body, requestId);

      if (path !== "/api" && !path.startsWith("/api/")) {
        return respondError(
          404,
          { code: "NOT_FOUND", message: errorMap.NOT_FOUND.message, requestId },
          requestId,
        );
      }

      if (route === null || !KEYED_WRITES.has(route)) return serve(request, requestId);

      // A write: the key first (Axis, S1-1 and S1-3), then the idempotency rules.
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

    seedMission(stage) {
      const avel = world.CLIENTS.avel;
      if (!clients.some((c) => c.id === avel.id)) clients.push(structuredClone(avel));
      const m = world.seedMission(ctx(), SEEDED_MISSION_ID, stage, MOCK_OPERATOR_ID);
      liveMissions.set(m.mission.id, m);
      return { missionId: m.mission.id, clientId: avel.id };
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

    recorded() {
      return recorded.map((entry) => ({ ...entry }));
    },

    resetAuth() {
      reset();
      sessions.clear();
    },

    reset,
  };
}
