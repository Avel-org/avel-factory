import { errorMap } from "@avel/contract";
import { AlreadyExists } from "../errors.ts";

/** The fields of a node-postgres error the mapper reads. */
interface PgError {
  readonly code: string;
  readonly constraint: string;
}

const isPgError = (error: unknown): error is PgError =>
  typeof error === "object" &&
  error !== null &&
  typeof (error as { code?: unknown }).code === "string" &&
  typeof (error as { constraint?: unknown }).constraint === "string";

/**
 * Turns a database rule's violation, as node-postgres throws it, into its tagged error naming the
 * constraint (Step 1 item 3). Anything else is `undefined`: not ours to map, so the caller keeps
 * it a defect (Writing Effect rule 3). The database's own message is never passed on.
 */
export function mapDbError(error: unknown): AlreadyExists | undefined {
  if (!isPgError(error)) return undefined;
  const details = { constraint: error.constraint };
  switch (error.code) {
    case "23505":
      return new AlreadyExists({ message: errorMap.ALREADY_EXISTS.message, details });
    default:
      return undefined;
  }
}
