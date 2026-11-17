import * as z from "zod/mini";
import { MissionState } from "./value-lists.js";

/**
 * The error map (contract.md section 5, E4; D5; D21; CR-16).
 *
 * On the wire every error is `{ code, message, details?, requestId }`, and `requestId`
 * matches `X-Request-Id` (Step 1 item 2.9). In oRPC terms, `details` is the error's
 * typed `data`.
 */

/** The details of a database-constraint error: the constraint's name. */
const ConstraintDetails = z.object({ constraint: z.string() });

/**
 * `STALE_VERSION`'s details (D21): the stale body field and its current value. On a decision's
 * approve route, `current` also carries the decision's current row (a `PendingDecisionDto`),
 * so the screen shows what changed without a second read (CR-W2, CR-W15).
 */
const current = z.optional(z.json());
export const StaleVersionDetails = z.discriminatedUnion("field", [
  z.object({ field: z.literal("rowVersion"), currentVersion: z.int(), current }),
  z.object({ field: z.literal("version"), currentVersion: z.int(), current }),
  z.object({ field: z.literal("receiptHash"), currentVersion: z.string(), current }),
  z.object({ field: z.literal("headSha"), currentVersion: z.string(), current }),
  // CR-W11: a dispatch package re-rendered since it was shown
  z.object({ field: z.literal("packageHash"), currentVersion: z.string(), current }),
  // CR-W17: a follow-up draft changed after it was opened
  z.object({ field: z.literal("draftHash"), currentVersion: z.string(), current }),
]);
export type StaleVersionDetails = z.infer<typeof StaleVersionDetails>;

/** The codes every route can return: the generic seven, then the specific ones (D5). */
export const errorMap = {
  BAD_REQUEST: { status: 400, message: "Bad input" },
  UNAUTHORIZED: { status: 401, message: "Not signed in" },
  FORBIDDEN: { status: 403, message: "Wrong role or token kind" },
  NOT_FOUND: { status: 404, message: "No such row" },
  /** The fallback 409, for a conflict no other code covers. Not a stale version. */
  CONFLICT: { status: 409, message: "Conflict" },
  UNPROCESSABLE_CONTENT: { status: 422, message: "Unprocessable content" },
  TOO_MANY_REQUESTS: {
    status: 429,
    message: "Rate limited",
    data: z.object({ retryAfterMs: z.int().check(z.minimum(0)) }),
  },
  STEP_UP_REQUIRED: { status: 403, message: "A credential action with no valid grant" },
  STALE_VERSION: {
    status: 409,
    message: "The body's version isn't current",
    data: StaleVersionDetails,
  },
  IDEMPOTENCY_KEY_REUSED: { status: 409, message: "The same key, a different body" },
  IDEMPOTENCY_IN_PROGRESS: { status: 409, message: "The same key while the first still runs" },
  TOKEN_REPLAYED: {
    status: 409,
    message: "A token route replayed; the token isn't returned again",
  },
  ALREADY_EXISTS: { status: 409, message: "Already exists", data: ConstraintDetails },
  DELETE_REFUSED: { status: 409, message: "Delete refused", data: ConstraintDetails },
  INVALID_TRANSITION: {
    status: 422,
    message: "A move the state machine doesn't allow",
    /**
     * `state` is the row's state now. A decision that was resolved elsewhere also gets
     * `resolvedAt` (CR-W2 section 5; CR-W19's `DECISION_ALREADY_DECIDED` maps here).
     */
    data: z.object({
      allowed: z.array(z.string()),
      state: z.optional(z.string()),
      resolvedAt: z.optional(z.string()),
    }),
  },
  /** CR-W15: the decision was superseded by a newer version; `replacedBy` is its ref. */
  DECISION_SUPERSEDED: {
    status: 422,
    message: "A newer version replaced this decision",
    data: z.object({ replacedBy: z.string() }),
  },
  CONSTRAINT_VIOLATION: {
    status: 422,
    message: "A CHECK violation, or a missing parent",
    data: ConstraintDetails,
  },
} as const;

/** CR-16's four codes, on the three dispatch-package routes only. */
export const dispatchPackageErrorMap = {
  MISSION_NOT_FOUND: { status: 404, message: "No such mission" },
  DISPATCH_PACKAGE_NOT_RENDERED: {
    status: 404,
    message: "The mission hasn't been rendered yet",
    data: z.object({ missionState: z.enum(MissionState) }),
  },
  DISPATCH_PACKAGE_FILE_NOT_FOUND: {
    status: 404,
    message: "The path isn't in the package",
  },
  PLAN_VERSION_NOT_FOUND: { status: 404, message: "No such plan version" },
} as const;

/** CR-W11: committing the dispatch package and downloading its archive. */
export const dispatchPackageCommitErrorMap = {
  /** Gate 1 hasn't passed, or failed: no confirm and no download. */
  GATE1_NOT_PASSED: { status: 422, message: "Gate 1 hasn't passed" },
  /** The archive is still being built. */
  ARCHIVE_BUILDING: { status: 409, message: "The archive is still being built" },
} as const;

/** CR-W19: Canon's streaming routes (send, resume, transcribe). */
export const canonErrorMap = {
  MISSION_NOT_IN_SCOPING: { status: 409, message: "The mission isn't in scoping" },
  /** A reply is already streaming; the web offers Stop. */
  CANON_BUSY: { status: 409, message: "Canon is already replying" },
  MESSAGE_TOO_LONG: {
    status: 413,
    message: "The message is too long",
    data: z.object({ maxChars: z.int() }),
  },
  /** Canon's share of the mission budget is spent. */
  BUDGET_EXCEEDED: {
    status: 402,
    message: "The budget is spent",
    data: z.object({ scope: z.enum(["mission", "module", "eval"]) }),
  },
  MODEL_UNAVAILABLE: {
    status: 503,
    message: "The model is unavailable",
    data: z.object({ retryAfterMs: z.int().check(z.minimum(0)) }),
  },
  /** Resume after the message finished: read it from the list instead. */
  STREAM_GONE: { status: 410, message: "The reply has finished" },
  TRANSCRIBE_FAILED: { status: 422, message: "Nothing was heard" },
} as const;

/** CR-W21 section 1: the receipt and its proof files. */
export const receiptErrorMap = {
  /** Over 2 MB: the page shows the hash and marks the file "checked by the server only". */
  ARTIFACT_TOO_LARGE: {
    status: 413,
    message: "The proof file is too large to send",
    data: z.object({ bytes: z.int(), sha256: z.string() }),
  },
  /** A newer receipt exists for the mission. */
  RECEIPT_SUPERSEDED: {
    status: 409,
    message: "A newer receipt exists",
    data: z.object({ receiptId: z.string() }),
  },
} as const;

/** CR-W20 and CR-W21 section 3: templates and their docs. */
export const templateErrorMap = {
  TEMPLATE_DOCS_INVALID: {
    status: 422,
    message: "The template's docs aren't complete",
    data: z.object({ issues: z.array(z.object({ path: z.string(), rule: z.string() })) }),
  },
  TEMPLATE_SLUG_TAKEN: {
    status: 409,
    message: "That template slug is taken",
    data: z.object({ suggestion: z.string() }),
  },
  /** Only shipped missions can be cut into templates. */
  SOURCE_NOT_SHIPPED: { status: 409, message: "The mission hasn't shipped" },
  /** CR-W22: an internal template whose receipt is a pass, not verified. */
  TEMPLATE_SOURCE_NOT_VERIFIED: { status: 409, message: "The receipt isn't verified" },
} as const;

/** CR-W22: the mission's kind, set by Canon's first question. */
export const missionKindErrorMap = {
  /** Approving 0.1 or finalizing while Q-0.1a or Q-0.1b is open. */
  KIND_NOT_SET: {
    status: 409,
    message: "The project's kind isn't set yet",
    data: z.object({ questionRef: z.string() }),
  },
  /** A new client's name matches an archived client; the screen offers to restore it. */
  CLIENT_NAME_TAKEN: {
    status: 409,
    message: "A client with that name exists",
    data: z.object({ clientId: z.string() }),
  },
} as const;

/** CR-W16: importing a skill. */
export const skillErrorMap = {
  LICENSE_NOT_ALLOWED: {
    status: 422,
    message: "The skill's licence isn't allowed",
    data: z.object({ license: z.nullable(z.string()) }),
  },
} as const;

/** CR-W17: follow-ups and upkeep offers. */
export const pipelineErrorMap = {
  /** Sending to a contact who unsubscribed: no send button. */
  CONTACT_UNSUBSCRIBED: { status: 422, message: "This contact unsubscribed" },
} as const;

const allMaps = [
  errorMap,
  dispatchPackageErrorMap,
  dispatchPackageCommitErrorMap,
  canonErrorMap,
  receiptErrorMap,
  templateErrorMap,
  missionKindErrorMap,
  skillErrorMap,
  pipelineErrorMap,
] as const;

export type ErrorCode =
  | keyof typeof errorMap
  | keyof typeof dispatchPackageErrorMap
  | keyof typeof dispatchPackageCommitErrorMap
  | keyof typeof canonErrorMap
  | keyof typeof receiptErrorMap
  | keyof typeof templateErrorMap
  | keyof typeof missionKindErrorMap
  | keyof typeof skillErrorMap
  | keyof typeof pipelineErrorMap;

/** Every error code the contract defines, in one list (the web's error map covers each one). */
export const ErrorCode = allMaps.flatMap((m) => Object.keys(m)) as ErrorCode[];

/** Each code's HTTP status. */
export const errorStatus = Object.fromEntries(
  allMaps.flatMap((m) => Object.entries(m)).map(([code, e]) => [code, e.status]),
) as Record<ErrorCode, number>;

/** The error body on the wire (Step 1 item 2.9 and test 3). */
export const ErrorBody = z.object({
  code: z.string(),
  message: z.string(),
  details: z.optional(z.json()),
  requestId: z.string(),
});
export type ErrorBody = z.infer<typeof ErrorBody>;

/** Step 1's response headers: the request ID and the contract version. */
export const REQUEST_ID_HEADER = "X-Request-Id";
export const CONTRACT_VERSION_HEADER = "X-Contract-Version";
/** Required on every write (API routes.md, "Rules on every write"). */
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

/**
 * Decodes an error response in one place (S1-3): the `ErrorBody`, or null when the body
 * doesn't parse, in which case the caller maps by `status` alone.
 */
export function parseErrorBody(_status: number, body: unknown): ErrorBody | null {
  const parsed = ErrorBody.safeParse(body);
  return parsed.success ? parsed.data : null;
}
