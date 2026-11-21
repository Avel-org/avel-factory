/**
 * Harness for T-B18's acceptance tests (Step 1 item 10, test 11; t-b17-rigg-01). Builds on
 * T-B13's harness (`../jobs/support.ts`, read only): the same TestClock, the same real Postgres.
 * The tests use the Jobs interface, the `events` table, `consumer_cursors` (its `last_seq` and
 * `claim_no`) and nothing else of the engine.
 */
import { setImmediate as nextTurn } from "node:timers/promises";
import { Cause, Effect, Exit } from "effect";
import { TestClock } from "effect/testing";
import type pg from "pg";
import { Db, type Tx } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import type { ConsumedEvent } from "../../src/platform/jobs/index.ts";
import { event } from "../jobs/support.ts";

export { createSaved, event, runJobs, saved, saveRow, T0 } from "../jobs/support.ts";

/**
 * True while another connection of this database is executing a statement that is not waiting
 * on a lock: the engine has work in flight (a commit, a claim). A test's own held lock (the
 * blip) or open transaction (a handler held mid-way) is not work in flight, so it never counts.
 */
const engineBusy = async (c: pg.Client): Promise<boolean> => {
  const r = await c.query(
    `select 1 from pg_stat_activity
      where datname = current_database() and pid <> pg_backend_pid()
        and state = 'active' and coalesce(wait_event_type, '') <> 'Lock' limit 1`,
  );
  return r.rowCount !== 0;
};

/**
 * Lets real I/O finish without waiting on the wall clock: turns of the event loop and round
 * trips, until the engine has had no statement in flight for several checks in a row (F2: under
 * a parallel run a commit can take far longer than a `select 1`, and simulated time must not
 * outrun it). The round count bounds it; nothing here is a sleep.
 */
const settle = async (c: pg.Client) => {
  let quiet = 0;
  for (let i = 0; i < 400 && quiet < 4; i++) {
    await c.query("select 1");
    await nextTurn();
    quiet = (await engineBusy(c)) ? 0 : quiet + 1;
  }
};

/**
 * Moves the TestClock forward in `stepMs` steps (1 s by default), letting the engine's work
 * settle before and after each, until `done()` holds. It checks `done` before moving time and
 * after every step, and gives up once `maxMs` of simulated time have passed. Returns whether
 * `done` held, and how many simulated milliseconds it took.
 */
export const until = (
  c: pg.Client,
  done: () => boolean | Promise<boolean>,
  maxMs: number,
  stepMs = 1_000,
) =>
  Effect.gen(function* () {
    let moved = 0;
    for (;;) {
      for (let i = 0; i < 25; i++) {
        yield* Effect.promise(() => settle(c));
        if (yield* Effect.promise(async () => done())) return { ok: true, movedMs: moved };
      }
      if (moved >= maxMs) return { ok: false, movedMs: moved };
      yield* TestClock.adjust(stepMs);
      moved += stepMs;
    }
  });

/** Moves the TestClock forward `ms`, in 1 s steps, letting the engine's work settle around each. */
export const advance = (c: pg.Client, ms: number, stepMs = 1_000) =>
  Effect.gen(function* () {
    for (let moved = 0; moved < ms; moved += stepMs) {
      yield* Effect.promise(() => settle(c));
      yield* TestClock.adjust(stepMs);
    }
    yield* Effect.promise(() => settle(c));
  });

/** Commits one event of its own and returns its seq. */
export const emit = (kind: string, payload: Record<string, unknown> = {}) =>
  Effect.gen(function* () {
    const db = yield* Db;
    yield* db.withTransaction(
      Effect.gen(function* () {
        yield* Events.append(event(kind, payload));
        yield* db.commitWithEvents;
      }),
    );
  });

/**
 * A consumer's handler as a test writes it. It may use `Tx` (the engine runs it inside the
 * transaction that moves the cursor); the cast keeps these tests compiling whether the build
 * types `handle` with a `Tx` requirement or leaves it out.
 */
export const handler =
  (use: (e: ConsumedEvent) => Effect.Effect<void, unknown, Tx>) =>
  (e: ConsumedEvent): Effect.Effect<void, unknown> =>
    use(e) as unknown as Effect.Effect<void, unknown>;

export interface Cursor {
  readonly lastSeq: number;
  readonly claimNo: number;
}

/** The consumer's row in consumer_cursors, or undefined. */
export const cursorOf = async (c: pg.Client, name: string): Promise<Cursor | undefined> => {
  const r = await c.query("select last_seq, claim_no from consumer_cursors where consumer = $1", [
    name,
  ]);
  const row = r.rows[0];
  return row === undefined
    ? undefined
    : { lastSeq: Number(row.last_seq), claimNo: Number(row.claim_no) };
};

/** The seqs of this kind's committed events, in order. */
export const seqsOf = async (c: pg.Client, kind: string): Promise<number[]> =>
  (await c.query("select seq from events where kind = $1 order by seq", [kind])).rows.map((r) =>
    Number(r.seq),
  );

/** Fails the test with the program's own cause, so a failed assertion inside it shows its message. */
export const succeeds = (exit: Exit.Exit<unknown, unknown>) => {
  if (Exit.isFailure(exit)) throw new Error(Cause.pretty(exit.cause));
};
