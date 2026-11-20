import type { ErrorBody, ErrorCode, StaleVersionDetails } from "@avel/contract";
import { Data } from "effect";

/**
 * The one table from a tagged error to a contract code (Writing Effect rule 3). A tag with no
 * row here doesn't compile through `effectHandler`. The code's status comes from the contract.
 */
export const errorTable = {
  BadRequest: "BAD_REQUEST",
  Unauthorized: "UNAUTHORIZED",
  NotFound: "NOT_FOUND",
  Unprocessable: "UNPROCESSABLE_CONTENT",
  AlreadyExists: "ALREADY_EXISTS",
  ConstraintViolation: "CONSTRAINT_VIOLATION",
  DeleteRefused: "DELETE_REFUSED",
  StaleVersion: "STALE_VERSION",
  IdempotencyKeyReused: "IDEMPOTENCY_KEY_REUSED",
  IdempotencyInProgress: "IDEMPOTENCY_IN_PROGRESS",
  TokenReplayed: "TOKEN_REPLAYED",
  TooManyRequests: "TOO_MANY_REQUESTS",
  PayloadTooLarge: "MESSAGE_TOO_LONG",
} as const satisfies Record<string, ErrorCode>;

export type ErrorTag = keyof typeof errorTable;

/** What a failure must look like to go through `effectHandler`. */
export interface MappedError {
  readonly _tag: ErrorTag;
  readonly message: string;
  readonly details?: ErrorBody["details"];
}

/** A request the route's schema can't judge, such as a write without its Idempotency-Key (400). */
export class BadRequest extends Data.TaggedError("BadRequest")<{
  message: string;
}> {}

/** A route for a signed-in caller, called with no live session (401). */
export class Unauthorized extends Data.TaggedError("Unauthorized")<{
  message: string;
}> {}

export class NotFound extends Data.TaggedError("NotFound")<{
  message: string;
  details?: ErrorBody["details"];
}> {}

/** The details of a database-constraint error: the constraint's name. */
type ConstraintDetails = { readonly constraint: string };

/** A unique violation (23505): 409 `ALREADY_EXISTS`. */
export class AlreadyExists extends Data.TaggedError("AlreadyExists")<{
  message: string;
  details: ConstraintDetails;
}> {}

/** A CHECK violation (23514), or a foreign key whose parent is missing (23503): 422. */
export class ConstraintViolation extends Data.TaggedError("ConstraintViolation")<{
  message: string;
  details: ConstraintDetails;
}> {}

/** A foreign key refusing the delete or update of a row still referenced (23503): 409. */
export class DeleteRefused extends Data.TaggedError("DeleteRefused")<{
  message: string;
  details: ConstraintDetails;
}> {}

/** A request the schema accepts that the route still refuses, such as a second internal client (422). */
export class Unprocessable extends Data.TaggedError("Unprocessable")<{
  message: string;
}> {}

/** A versioned write that matched no row: the body's version isn't current (409). */
export class StaleVersion extends Data.TaggedError("StaleVersion")<{
  message: string;
  details: StaleVersionDetails;
}> {}

/** An Idempotency-Key used again with another route or body (409). */
export class IdempotencyKeyReused extends Data.TaggedError("IdempotencyKeyReused")<{
  message: string;
}> {}

/** An Idempotency-Key used again while its first request still runs (409). */
export class IdempotencyInProgress extends Data.TaggedError("IdempotencyInProgress")<{
  message: string;
}> {}

/** A replay of a write whose response carried a token, which is never stored or sent again (409). */
export class TokenReplayed extends Data.TaggedError("TokenReplayed")<{
  message: string;
}> {}

/** Over a rate limit (429): how long until the window lets the next call through. */
export class TooManyRequests extends Data.TaggedError("TooManyRequests")<{
  message: string;
  details: { readonly retryAfterMs: number };
}> {}

/** A body over the route's byte limit (413), refused before it's read to the end. */
export class PayloadTooLarge extends Data.TaggedError("PayloadTooLarge")<{
  message: string;
  details: { readonly maxChars: number };
}> {}
