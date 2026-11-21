/**
 * T-B13-06 (test 10; CR-30 check 6): a job that keeps failing retries after exactly 10 s, 30 s,
 * 2 min and 10 min, and is dead after 5 tries. Time is a TestClock.
 */
import { Clock, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { until as untilSettled } from "../consumers/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { advance, runJobs, workHandler } from "./support.ts";

const database = testDatabase("b13retry");

const BACKOFF = [10_000, 30_000, 120_000, 600_000];
/** Workers look for due work at least every second, so a retry starts at most this late. */
const POLL_SLACK_MS = 2_000;

describe("T-B13-06 · retries and dead", () => {
  it("fails 5 times, waits 10 s, 30 s, 2 min, 10 min between them, and ends dead", async () => {
    const d = await database();
    const c = await d.client();
    const starts: number[] = [];

    const work = workHandler(() =>
      Effect.gen(function* () {
        starts.push(yield* Clock.currentTimeMillis);
        return yield* Effect.fail(new Error("boom"));
      }),
    );

    let id = "";
    let after: { state: string; attempts: number; lastError: string | null } | undefined;
    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        yield* jobs.startWorker({ name: "w", handlers: [work.handler] });
        id = (yield* db.withTransaction(jobs.enqueue("t13.work", "retry:1", {}))).id;
        // Each try is waited for on the facts it reads (T-B27, t-b18-rigg-03): the failure is committed
        // (the job is back in the queue with its run_after), time moves to a few seconds before that
        // run_after, and then in 1 s steps, each one after the engine has no statement in flight, until
        // the next try has started. Time never gets ahead of the poll that claims the job, so a try's
        // start is read at the Clock time it was due at, however loaded the machine is.
        const first = yield* untilSettled(c, () => starts.length === 1, 30_000);
        expect(first.ok, "the job never made its 1st try").toBe(true);
        for (let tries = 1; tries < 5; tries++) {
          const queued = yield* untilSettled(
            c,
            async () => {
              const view = await Effect.runPromise(jobs.get(id));
              return view?.state === "queued" && view.attempts === tries;
            },
            30_000,
          );
          expect(queued.ok, `try ${tries}'s failure was never saved`).toBe(true);
          const due = (yield* jobs.get(id))?.runAfter ?? 0;
          const now = yield* Clock.currentTimeMillis;
          const hop = Math.floor((due - now - 3_000) / 10_000) * 10_000;
          if (hop > 0) yield* advance(c, hop, 10_000);
          const next = yield* untilSettled(c, () => starts.length === tries + 1, 20_000);
          expect(next.ok, `the job never made try ${tries + 1}`).toBe(true);
        }
        // The 5th failure is saved; then nothing more is ever run.
        yield* advance(c, 20 * 60_000, 5_000);
        const view = yield* jobs.get(id);
        after = view && { state: view.state, attempts: view.attempts, lastError: view.lastError };
      }),
    );
    expect(exit._tag).toBe("Success");
    expect(starts).toHaveLength(5);
    for (const [i, delay] of BACKOFF.entries()) {
      const gap = (starts[i + 1] ?? 0) - (starts[i] ?? 0);
      expect(gap, `gap before try ${i + 2}`).toBeGreaterThanOrEqual(delay);
      expect(gap, `gap before try ${i + 2}`).toBeLessThanOrEqual(delay + POLL_SLACK_MS);
    }
    expect(after?.state).toBe("dead");
    expect(after?.attempts).toBe(5);
    expect(after?.lastError).toContain("boom");
  });
});
