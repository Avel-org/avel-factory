import type { ErrorBody, ErrorCode } from "@avel/contract";
import { Data } from "effect";

/**
 * The one table from a tagged error to a contract code (Writing Effect rule 3). A tag with no
 * row here doesn't compile through `effectHandler`. The code's status comes from the contract.
 */
export const errorTable = {
  NotFound: "NOT_FOUND",
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
