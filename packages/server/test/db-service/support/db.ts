/**
 * Harness for T-B4's acceptance tests. It names the seams the build must provide (listed in the
 * report for the lead to confirm before the lock):
 *
 *   src/platform/db/db.ts      Db: an Effect service { withTransaction, commitWithEvents }
 *                                withTransaction(program): runs the program in one transaction on a
 *                                  pool client it acquires and always releases. Provides Tx to the
 *                                  program (so the result's R no longer holds Tx). Commits on
 *                                  success; rolls back on a failure, a defect or an interruption.
 *                                  A database error from Tx (Drizzle wraps node-postgres's in a
 *                                  DrizzleQueryError whose `.cause` is the pg error) reaches the
 *                                  caller as T-B3's tagged error through mapDbError; any other
 *                                  database error stays a defect.
 *                                commitWithEvents: Effect<void, never, Tx>, the last step of a
 *                                  program that appended events: takes the transaction-level
 *                                  advisory lock, inserts the queued events as the last
 *                                  statement, and the transaction then commits. A program that
 *                                  queued events and ends without it dies as a defect and
 *                                  commits nothing.
 *                              Tx: Context.Service whose value is the Drizzle transaction
 *                                (NodePgTransaction), so `const tx = yield* Tx; tx.insert(...)`.
 *                              DbLive: Layer<Db, ConfigError>: DATABASE_URL read through Config
 *                                as Redacted; one pg Pool, ended in the layer's finalizer.
 *   src/platform/db/events.ts  Events.append(event): Effect<void, never, Tx> queues
 *                                { schemaVersion, kind, payload, missionId?, dispatchId?,
 *                                  attemptId? } for this transaction. It writes nothing itself.
 */
import { ConfigProvider, Effect, Layer } from "effect";
import { type Db, DbLive } from "../../../src/platform/db/db.ts";

/** DbLive reading this URL as its DATABASE_URL, the way production reads it from the environment. */
export const dbLayer = (url: string): Layer.Layer<Db, unknown> =>
  DbLive.pipe(
    Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnvRecord({ DATABASE_URL: url }))),
  );

/** Runs a program that uses Db against this database; the pool is ended when it returns. */
export const runDb = <A, E>(url: string, program: Effect.Effect<A, E, Db>) =>
  Effect.runPromiseExit(program.pipe(Effect.provide(dbLayer(url))));

export const event = (kind: string, payload: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  kind,
  payload,
});
