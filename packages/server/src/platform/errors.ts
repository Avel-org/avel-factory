import type { ErrorBody, ErrorCode } from "@avel/contract";
import { Data } from "effect";

/**
 * The one table from a tagged error to a contract code (Writing Effect rule 3). A tag with no
 * row here doesn't compile through `effectHandler`. The code's status comes from the contract.
 */
export const errorTable = {
  NotFound: "NOT_FOUND",
  AlreadyExists: "ALREADY_EXISTS",
  ConstraintViolation: "CONSTRAINT_VIOLATION",
  DeleteRefused: "DELETE_REFUSED",
} as const satisfies Record<string, ErrorCode>;

export type ErrorTag = keyof typeof errorTable;

/** What a failure must look like to go through `effectHandler`. */
export interface MappedError {
  readonly _tag: ErrorTag;
  readonly message: string;
  readonly details?: ErrorBody["details"];
}

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
