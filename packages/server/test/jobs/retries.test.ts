/**
 * T-B13-06 (test 10; CR-30 check 6): a job that keeps failing retries after exactly 10 s, 30 s,
 * 2 min and 10 min, and is dead after 5 tries. Time is a TestClock.
 */
import { Clock, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { testDatabase } from "../db/support/database.ts";
import { advance, runJobs, until, workHandler } from "./support.ts";

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
        const all = yield* until(c, () => starts.length === 5, 900_000);
        expect(all.ok, "the job didn't reach its 5th try within 15 simulated minutes").toBe(true);
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
