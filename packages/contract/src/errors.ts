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

/** `STALE_VERSION`'s details (D21): the stale body field and its current value. */
export const StaleVersionDetails = z.discriminatedUnion("field", [
  z.object({ field: z.literal("rowVersion"), currentVersion: z.int() }),
  z.object({ field: z.literal("version"), currentVersion: z.int() }),
  z.object({ field: z.literal("receiptHash"), currentVersion: z.string() }),
  z.object({ field: z.literal("headSha"), currentVersion: z.string() }),
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
    data: z.object({ allowed: z.array(z.string()) }),
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

/** Every error code the contract defines (20). */
export const ErrorCode = [
  ...(Object.keys(errorMap) as (keyof typeof errorMap)[]),
  ...(Object.keys(dispatchPackageErrorMap) as (keyof typeof dispatchPackageErrorMap)[]),
] as const;
export type ErrorCode = keyof typeof errorMap | keyof typeof dispatchPackageErrorMap;

/** Each code's HTTP status. */
export const errorStatus = Object.fromEntries(
  [...Object.entries(errorMap), ...Object.entries(dispatchPackageErrorMap)].map(([code, e]) => [
    code,
    e.status,
  ]),
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
