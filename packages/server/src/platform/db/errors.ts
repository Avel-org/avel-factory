import { errorMap } from "@avel/contract";
import { AlreadyExists, ConstraintViolation, DeleteRefused } from "../errors.ts";

/** The fields of a node-postgres error the mapper reads. */
interface PgError {
  readonly code: string;
  readonly constraint: string;
  readonly message: string;
}

const isPgError = (error: unknown): error is PgError =>
  typeof error === "object" &&
  error !== null &&
  typeof (error as { code?: unknown }).code === "string" &&
  typeof (error as { constraint?: unknown }).constraint === "string" &&
  typeof (error as { message?: unknown }).message === "string";

/**
 * A foreign key's two failures share code 23503 and every field but the message: Postgres says
 * "update or delete on table ..." when the referenced row is refused, and "insert or update on
 * table ..." when the parent is missing.
 */
const refusesReferencedRow = (error: PgError) => error.message.startsWith("update or delete on");

/**
 * Turns a database rule's violation, as node-postgres throws it, into its tagged error naming the
 * constraint (Step 1 item 3). Anything else is `undefined`: not ours to map, so the caller keeps
 * it a defect (Writing Effect rule 3). The database's own message is never passed on.
 */
export function mapDbError(
  error: unknown,
): AlreadyExists | ConstraintViolation | DeleteRefused | undefined {
  if (!isPgError(error)) return undefined;
  const details = { constraint: error.constraint };
  switch (error.code) {
    case "23505":
      return new AlreadyExists({ message: errorMap.ALREADY_EXISTS.message, details });
    case "23514":
      return new ConstraintViolation({ message: errorMap.CONSTRAINT_VIOLATION.message, details });
    case "23503":
      return refusesReferencedRow(error)
        ? new DeleteRefused({ message: errorMap.DELETE_REFUSED.message, details })
        : new ConstraintViolation({ message: errorMap.CONSTRAINT_VIOLATION.message, details });
    default:
      return undefined;
  }
}
