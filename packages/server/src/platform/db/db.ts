import { events } from "@avel/db";
import { DrizzleQueryError, sql } from "drizzle-orm";
import { NodePgSession, NodePgTransaction } from "drizzle-orm/node-postgres";
import { PgDialect } from "drizzle-orm/pg-core";
import { Clock, Config, Context, Effect, Exit, Layer, Redacted, type Scope } from "effect";
import pg from "pg";
import type { AlreadyExists, ConstraintViolation, DeleteRefused } from "../errors.ts";
import { stdoutLogLine } from "../logger.ts";
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
     *
     * Make it the program's last step. Anything after it still runs while this transaction
     * holds the one global event lock, so every other event-writing transaction waits on it
     * until this one commits. Seq order stays correct either way.
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

/** A checked-out client, and the error its connection raised while it was held, if any. */
interface Held {
  client?: pg.PoolClient;
  broken?: Error;
  readonly onError: (error: Error) => void;
}

/**
 * Hands a held client back. One whose connection broke, or whose rollback failed, is destroyed
 * instead of reused; after a failure, a defect or an interruption it is rolled back first.
 */
const checkIn = (held: Held, client: pg.PoolClient, exit: Exit.Exit<unknown, unknown>) =>
  Effect.promise(async () => {
    let error = held.broken;
    if (error === undefined && Exit.isFailure(exit)) {
      error = await client.query("rollback").then(
        () => undefined,
        (rollbackError: Error) => rollbackError,
      );
    }
    client.off("error", held.onError);
    client.release(error);
  });

/**
 * Checks a client out of the pool for the scope (Writing Effect rule 6). The pool's connect
 * gives up after its connect timeout, and an interruption ends the wait at once: a client that
 * arrives after it is destroyed, never leaked. While held, the client has our error listener,
 * because pg-pool takes its own off a checked-out client (t-b4-rigg-05): a backend that dies
 * then marks it broken instead of ending the process, and its next query fails as a defect.
 */
const checkOut = (pool: pg.Pool): Effect.Effect<pg.PoolClient, never, Scope.Scope> =>
  Effect.gen(function* () {
    const held: Held = {
      onError: (error) => {
        held.broken = error;
      },
    };
    yield* Effect.addFinalizer((exit) =>
      held.client === undefined ? Effect.void : checkIn(held, held.client, exit),
    );
    return yield* Effect.callback<pg.PoolClient>((resume) => {
      let abandoned = false;
      pool.connect().then(
        (client) => {
          if (abandoned) return client.release(true);
          client.on("error", held.onError);
          held.client = client;
          resume(Effect.succeed(client));
        },
        (error: unknown) => {
          if (!abandoned) resume(Effect.die(error));
        },
      );
      return Effect.sync(() => {
        abandoned = true;
      });
    });
  });

/** The fields of a node-postgres error that name where it happened, and never a value. */
const whereIn = (error: pg.DatabaseError) =>
  (["table", "column", "constraint"] as const)
    .filter((field) => error[field] !== undefined)
    .map((field) => `${field} ${error[field]}`)
    .join(", ");

/**
 * A database defect without its values. A DrizzleQueryError's message is the query and its
 * params, and Postgres's own message and detail can quote a bound value or the failing row, so
 * neither leaves the Db service: the defect keeps only the pg code, where it happened and the
 * query text (its placeholders, not their values). Anything else passes through unchanged.
 */
const withoutValues = (defect: unknown): unknown => {
  const query = defect instanceof DrizzleQueryError ? defect.query : undefined;
  const cause = defect instanceof DrizzleQueryError ? defect.cause : defect;
  if (query === undefined && !(cause instanceof pg.DatabaseError)) return defect;
  const pgError = cause instanceof pg.DatabaseError ? cause : undefined;
  const where = pgError === undefined ? "" : whereIn(pgError);
  return new Error(
    [
      `database error ${pgError?.code ?? "with no code"}`,
      where === "" ? "" : ` (${where})`,
      query === undefined ? "" : ` in query: ${query}`,
    ].join(""),
  );
};

/** The FK split reads Postgres's English message (t-b3-rigg-02), so other languages are refused. */
const isEnglish = (lcMessages: string) =>
  lcMessages === "C" || lcMessages === "POSIX" || lcMessages.startsWith("en");

const commitWithEvents = Effect.gen(function* () {
  const tx = yield* Tx;
  const queued = takeQueued(tx);
  if (queued.length === 0) return;
  yield* Effect.promise(() =>
    tx.execute(sql`select pg_advisory_xact_lock(hashtext('avel.events.seq'))`),
  );
  yield* Effect.promise(() => tx.insert(events).values(queued));
});

/**
 * Logs an idle client's error (a terminated backend, a dropped connection) as one JSON line,
 * with only the error's code and message, and never throws. The pool drops that client itself;
 * without a listener, Node would treat the pool's `error` event as fatal.
 */
const idleClientErrorLogger =
  (clock: Clock.Clock) =>
  (error: Error & { code?: string }): void => {
    stdoutLogLine(
      JSON.stringify({
        level: "Error",
        time: new Date(clock.currentTimeMillisUnsafe()).toISOString(),
        message: "idle database client error",
        code: error.code,
        error: error.message,
      }),
    );
  };

/** How long past the statement timeout node-postgres waits before it gives up on a query. */
const QUERY_TIMEOUT_MARGIN_MS = 5_000;

/**
 * Db on one node-postgres Pool, from DATABASE_URL; the pool ends with the layer. A connect gives
 * up after DATABASE_CONNECT_TIMEOUT_MS and a statement after DATABASE_STATEMENT_TIMEOUT_MS (the
 * client stops waiting 5 s later). The build fails unless the database's lc_messages is English.
 */
export const DbLive = Layer.effect(
  Db,
  Effect.gen(function* () {
    const url = yield* Config.Redacted("DATABASE_URL");
    const connectTimeoutMs = yield* Config.Int("DATABASE_CONNECT_TIMEOUT_MS").pipe(
      Config.withDefault(5_000),
    );
    const statementTimeoutMs = yield* Config.Int("DATABASE_STATEMENT_TIMEOUT_MS").pipe(
      Config.withDefault(30_000),
    );
    const onIdleClientError = idleClientErrorLogger(yield* Clock.Clock);
    const pool = yield* Effect.acquireRelease(
      Effect.sync(() =>
        new pg.Pool({
          connectionString: Redacted.value(url),
          connectionTimeoutMillis: connectTimeoutMs,
          statement_timeout: statementTimeoutMs,
          // Client-side, a little past the server's: a connection that stops answering mid-query
          // ends the query too, and checkIn destroys the client (t-b8-rigg-04).
          query_timeout: statementTimeoutMs + QUERY_TIMEOUT_MARGIN_MS,
        }).on("error", onIdleClientError),
      ),
      (pool) =>
        Effect.promise(() => pool.end().finally(() => pool.off("error", onIdleClientError))),
    );

    const lcMessages = yield* Effect.scoped(
      Effect.gen(function* () {
        const client = yield* checkOut(pool);
        const result = yield* Effect.promise(() =>
          client.query<{ lc_messages: string }>("show lc_messages"),
        );
        return result.rows[0]?.lc_messages ?? "";
      }),
    );
    if (!isEnglish(lcMessages)) {
      return yield* Effect.die(
        new Error(
          `lc_messages is '${lcMessages}': it must be C, POSIX or en*, because database errors are told apart by Postgres's English messages`,
        ),
      );
    }

    const withTransaction = <A, E, R>(program: Effect.Effect<A, E, R>) =>
      Effect.scoped(
        Effect.gen(function* () {
          const client = yield* checkOut(pool);
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
          return error === undefined ? Effect.die(withoutValues(defect)) : Effect.fail(error);
        }),
      );

    return { withTransaction, commitWithEvents };
  }),
);
