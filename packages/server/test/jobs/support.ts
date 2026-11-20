/**
 * Harness for T-B13's acceptance tests (Step 1 tests 10 and 11, CR-30 spike 2 checks 1 to 8).
 * The tests use the Jobs interface and nothing else of the engine: no DBOS API, no `jobs` table,
 * so the same locked tests hold whichever engine is built under them (CR-30 section 6).
 *
 * Seams the build must provide, all inside `src/platform/jobs/**` (named here for the lead to
 * confirm before the lock). Everything is exported from `src/platform/jobs/index.ts`:
 *
 *   Jobs        an Effect service (Context.Service) with:
 *     enqueue(kind, key, payload, options?: { partition?: string })
 *                 Effect<{ id: string; created: boolean }, never, Tx>
 *                 Inserts in the caller's transaction, so it commits or rolls back with it. One live
 *                 job per key: if a job with this key is queued or claimed, nothing is added and the
 *                 result is { id: <that job's id>, created: false }; a finished (done or dead) job
 *                 doesn't block, and the result is { id: <new id>, created: true }. Jobs with the
 *                 same `partition` never run at the same time.
 *     get(id)     Effect<JobView | undefined>: undefined if no such job was ever committed.
 *     startWorker({ name, handlers })
 *                 Effect<Worker, never, Scope>: claims due jobs of its handlers' kinds and runs
 *                 them; it polls for due work at least every 1 s of Clock time, claims last 30 s,
 *                 it checks in about every 10 s, and its reaper runs every 10 s (a crashed
 *                 worker's job is back in the queue within about 40 s). It also runs the
 *                 reaper, so any live worker recovers a dead one's jobs.
 *     startConsumer({ name, handle })
 *                 Effect<Worker, never, Scope>: reads events after the consumer's cursor, in seq
 *                 order, and runs `handle(event)` on each once. Two copies of one `name` never
 *                 both act on an event. It polls at least every 1 s of Clock time.
 *   JobsLive    Layer<Jobs, never, Db>. All times (claims, run_after, backoff, polling) come from
 *               the Clock service, so TestClock drives them; no real sleeping.
 *   ClaimLost   a tagged error (`_tag: "ClaimLost"`): a save made with an out-of-date claim.
 *
 *   (types Handler, Run, JobView, Worker are exported too)
 *   JobView  { id, kind, key, payload, state: "queued" | "claimed" | "done" | "dead",
 *              attempts, claimNo, runAfter (Clock milliseconds), lastError: string | null }
 *            claimNo goes up by one each time the job is claimed (1 on the first claim).
 *            attempts counts runs started; a job that fails the 5th run is dead with attempts 5.
 *   Handler  { kind, decide(job: JobView): D (pure), apply(decision: D, run: Run):
 *              Effect<void, unknown> }  (apply needs no services: it closes over what it uses)
 *   Run      { job: JobView (as claimed),
 *              checkIn: Effect<void, ClaimLost>,
 *              finish(save?: Effect<void, never, Tx>): Effect<void, ClaimLost> }
 *            finish runs `save` and marks the job done in ONE transaction, only if this run's
 *            claim is still current; otherwise it changes nothing (the save is rolled back) and
 *            fails with ClaimLost. If apply returns without finishing, the worker finishes the
 *            job (no save). If apply fails with anything but ClaimLost, the worker fails the job:
 *            back to queued with run_after = now + 10 s, 30 s, 2 min, 10 min for failures 1 to
 *            4, and dead on the 5th. A ClaimLost from apply is dropped: the job is not touched.
 *   Worker   { stop: Effect<void>, kill: Effect<void> }
 *            stop: a graceful shutdown (a deploy): the run in flight is interrupted and its claim
 *            handed back, so another worker can take it at once. kill: the process vanishes or
 *            freezes (SIGSTOP): from now on the worker claims nothing, checks in nothing and
 *            reaps nothing, and releases nothing. A run already in flight is NOT interrupted:
 *            if its handler is let go on later, its own save goes through finish and is refused.
 *            Closing the worker's scope after a kill does nothing more.
 */
import { setImmediate as nextTurn } from "node:timers/promises";
import { sql } from "drizzle-orm";
import { ConfigProvider, Effect, Layer, type Scope } from "effect";
import { TestClock } from "effect/testing";
import type pg from "pg";
import { type Db, DbLive, Tx } from "../../src/platform/db/db.ts";
import { type Handler, type Jobs, JobsLive } from "../../src/platform/jobs/index.ts";

/** Midday on a fixed day: Clock time for every test starts here. */
export const T0 = Date.UTC(2026, 10, 18, 12, 0, 0);

/** Jobs over real Postgres at this URL, with a TestClock that Jobs and Db both read. */
export const jobsLayer = (url: string): Layer.Layer<Jobs | Db | TestClock.TestClock> =>
  Layer.orDie(
    Layer.provideMerge(
      JobsLive,
      Layer.mergeAll(
        DbLive.pipe(
          Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnvRecord({ DATABASE_URL: url }))),
        ),
        TestClock.layer(),
      ),
    ),
  );

/** Runs a program on a TestClock set to T0, over this database; scopes close at the end. */
export const runJobs = <A, E>(
  url: string,
  program: Effect.Effect<A, E, Jobs | Db | TestClock.TestClock | Scope.Scope>,
) =>
  Effect.runPromiseExit(
    Effect.scoped(
      Effect.gen(function* () {
        yield* TestClock.setTime(T0);
        return yield* program;
      }),
    ).pipe(Effect.provide(jobsLayer(url))),
  );

/**
 * Lets real I/O finish without waiting on the wall clock: round trips to the database and turns
 * of the event loop. Nothing here is a sleep; the count is what bounds it.
 */
const settle = async (c: pg.Client) => {
  for (let i = 0; i < 4; i++) {
    await c.query("select 1");
    await nextTurn();
  }
};

/**
 * Moves the TestClock forward in `stepMs` steps (1 s by default), letting real I/O settle after
 * each, until `done()` holds. It checks `done` before moving time and after every step, and
 * gives up once `maxMs` of simulated time have passed. Returns whether `done` held, and how many
 * simulated milliseconds it took.
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
      // Let work that needs no time (claims, saves) run out before asking.
      for (let i = 0; i < 25; i++) {
        yield* Effect.promise(() => settle(c));
        if (yield* Effect.promise(async () => done())) return { ok: true, movedMs: moved };
      }
      if (moved >= maxMs) return { ok: false, movedMs: moved };
      yield* TestClock.adjust(stepMs);
      moved += stepMs;
    }
  });

/** Moves the TestClock forward `ms`, in 1 s steps, letting real I/O settle after each. */
export const advance = (c: pg.Client, ms: number, stepMs = 1_000) =>
  Effect.gen(function* () {
    for (let moved = 0; moved < ms; moved += stepMs) {
      yield* Effect.promise(() => settle(c));
      yield* TestClock.adjust(stepMs);
    }
    yield* Effect.promise(() => settle(c));
  });

/** The test's own table of saved results (never part of a migration): one row per save. One database
 *  serves a whole file, so a later test finds the table there: create it if missing, then empty it. */
export const createSaved = async (c: pg.Client) => {
  await c.query(
    "create table if not exists t_b13_saved (job_id text not null, note text not null)",
  );
  await c.query("truncate t_b13_saved");
};

export const saved = async (c: pg.Client): Promise<{ job_id: string; note: string }[]> =>
  (await c.query("select job_id, note from t_b13_saved order by note, job_id")).rows;

/** A save program for `finish`: one row in t_b13_saved, in the finishing transaction. */
export const saveRow = (jobId: string, note: string) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    yield* Effect.promise(() =>
      tx.execute(sql`insert into t_b13_saved (job_id, note) values (${jobId}, ${note})`),
    );
  });

export const event = (kind: string, payload: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  kind,
  payload,
});

/**
 * A handler for kind "t13.work" whose behaviour per run is given by `onRun`: it gets the 1-based
 * count of runs so far (across every worker that uses this handler) and the Run.
 */
export const workHandler = (
  onRun: (n: number, run: Parameters<Handler<string>["apply"]>[1]) => Effect.Effect<void, unknown>,
): { handler: Handler<string>; runs: () => number } => {
  let n = 0;
  return {
    runs: () => n,
    handler: {
      kind: "t13.work",
      decide: (job) => job.id,
      apply: (_id, run) => onRun(++n, run),
    },
  };
};
