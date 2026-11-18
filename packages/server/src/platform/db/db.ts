import { events } from "@avel/db";
import { DrizzleQueryError, sql } from "drizzle-orm";
import { NodePgSession, NodePgTransaction } from "drizzle-orm/node-postgres";
import { PgDialect } from "drizzle-orm/pg-core";
import { Config, Context, Effect, Exit, Layer, Redacted } from "effect";
import pg from "pg";
import type { AlreadyExists, ConstraintViolation, DeleteRefused } from "../errors.ts";
import { mapDbError } from "./errors.ts";
import { hasQueued, takeQueued } from "./events.ts";
import { type Transaction, Tx } from "./tx.ts";

export { Tx } from "./tx.ts";

/** The tagged errors a database rule's violation becomes (Step 1 item 3). */
export type DbError = AlreadyExists | ConstraintViolation | DeleteRefused;

export class Db extends Context.Service<
  Db,
  {
    /**
     * Runs the program in one transaction on its own pool client, always released. Commits on
     * success; rolls back on a failure, a defect or an interruption. A database rule's
     * violation reaches the caller as its tagged error; any other database error is a defect.
     */
    readonly withTransaction: <A, E, R>(
      program: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | DbError, Exclude<R, Tx>>;
    /**
     * The one way to commit queued events: takes the transaction-level advisory lock, then
     * inserts the queued events, so their `seq` follows commit order. No other code takes it.
     */
    readonly commitWithEvents: Effect.Effect<void, never, Tx>;
  }
>()("avel/Db") {}

/** A Drizzle transaction over a client that is already inside `begin`. */
const transactionOn = (client: pg.PoolClient): Transaction => {
  const dialect = new PgDialect();
  return new NodePgTransaction(dialect, new NodePgSession(client, dialect, undefined), undefined);
};

/** Drizzle wraps node-postgres's error in a DrizzleQueryError; T-B3's mapper reads the pg one. */
const toDbError = (defect: unknown) =>
  mapDbError(defect instanceof DrizzleQueryError ? defect.cause : defect);

/** Hands a client back; one whose rollback failed is destroyed instead of reused. */
const rollbackAndRelease = (client: pg.PoolClient) =>
  Effect.promise(() =>
    client.query("rollback").then(
      () => client.release(),
      (error: Error) => client.release(error),
    ),
  );

const commitWithEvents = Effect.gen(function* () {
  const tx = yield* Tx;
  const queued = takeQueued(tx);
  if (queued.length === 0) return;
  yield* Effect.promise(() =>
    tx.execute(sql`select pg_advisory_xact_lock(hashtext('avel.events.seq'))`),
  );
  yield* Effect.promise(() => tx.insert(events).values(queued));
});

/** Db on one node-postgres Pool, from DATABASE_URL; the pool ends with the layer. */
export const DbLive = Layer.effect(
  Db,
  Effect.gen(function* () {
    const url = yield* Config.Redacted("DATABASE_URL");
    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => new pg.Pool({ connectionString: Redacted.value(url) })),
      (pool) => Effect.promise(() => pool.end()),
    );

    const withTransaction = <A, E, R>(program: Effect.Effect<A, E, R>) =>
      Effect.scoped(
        Effect.gen(function* () {
          const client = yield* Effect.acquireRelease(
            Effect.promise(() => pool.connect()),
            (client, exit) =>
              Exit.isSuccess(exit)
                ? Effect.sync(() => client.release())
                : rollbackAndRelease(client),
          );
          yield* Effect.promise(() => client.query("begin"));
          const tx = transactionOn(client);
          const result = yield* Effect.provideService(program, Tx, tx);
          if (hasQueued(tx)) {
            return yield* Effect.die(
              new Error(
                "events were queued but never written: end the program with commitWithEvents",
              ),
            );
          }
          yield* Effect.promise(() => client.query("commit"));
          return result;
        }),
      ).pipe(
        Effect.catchDefect((defect) => {
          const error = toDbError(defect);
          return error === undefined ? Effect.die(defect) : Effect.fail(error);
        }),
      );

    return { withTransaction, commitWithEvents };
  }),
);
