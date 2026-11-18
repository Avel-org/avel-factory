import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgTransaction } from "drizzle-orm/node-postgres";
import { Context } from "effect";

/** A Drizzle transaction on one pool client, opened by `Db.withTransaction`. */
export type Transaction = NodePgTransaction<
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

/**
 * The open transaction. Only `Db.withTransaction` provides it, so anything that needs it, such
 * as `Events.append`, can't run outside a transaction.
 */
export class Tx extends Context.Service<Tx, Transaction>()("avel/Tx") {}
