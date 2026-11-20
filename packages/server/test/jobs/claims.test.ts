/**
 * T-B13-05, 07, 08 (test 10; CR-30 checks 3 and 4): two workers never claim the same job; one
 * live job per key; jobs in one partition (a mission) never run two at once while other
 * partitions run in parallel. Time is a TestClock.
 */
import { Deferred, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { testDatabase } from "../db/support/database.ts";
import { advance, createSaved, runJobs, saved, saveRow, until, workHandler } from "./support.ts";

const database = testDatabase("b13claim");

describe("T-B13-05 · concurrent claims", () => {
  it("two workers never claim the same job", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const JOBS = 30;
    const runsByJob = new Map<string, number>();

    const work = workHandler((_n, run) =>
      Effect.gen(function* () {
        runsByJob.set(run.job.id, (runsByJob.get(run.job.id) ?? 0) + 1);
        expect(run.job.claimNo).toBe(1);
        yield* run.finish(saveRow(run.job.id, "ran"));
      }),
    );

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        // Enqueue first, so every worker finds a full queue the moment it starts.
        yield* db.withTransaction(
          Effect.forEach(
            Array.from({ length: JOBS }, (_, i) => i),
            (i) => jobs.enqueue("t13.work", `claims:${i}`, { i }),
          ),
        );
        yield* Effect.forEach(
          ["w1", "w2", "w3", "w4"],
          (name) => jobs.startWorker({ name, handlers: [work.handler] }),
          { concurrency: 4 },
        );
        const done = yield* until(c, async () => (await saved(c)).length >= JOBS, 120_000);
        expect(done.ok, "not every job ran").toBe(true);
        yield* advance(c, 60_000);
      }),
    );
    expect(exit._tag).toBe("Success");
    expect(runsByJob.size).toBe(JOBS);
    expect([...runsByJob.values()].every((n) => n === 1)).toBe(true);
    expect(work.runs()).toBe(JOBS);
    expect(await saved(c)).toHaveLength(JOBS);
  });
});

describe("T-B13-07 · one live job per key", () => {
  it("a second enqueue while the first is queued or running returns the first; after it finishes, a new one runs", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const release = Deferred.makeUnsafe<void>();

    const work = workHandler((_n, run) =>
      Effect.gen(function* () {
        yield* Deferred.await(release);
        yield* run.finish(saveRow(run.job.id, "ran"));
      }),
    );

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        const enqueue = () => db.withTransaction(jobs.enqueue("t13.work", "live:1", {}));

        const first = yield* enqueue();
        expect(first.created).toBe(true);
        // Still queued: no worker yet.
        const whileQueued = yield* enqueue();
        expect(whileQueued).toEqual({ id: first.id, created: false });

        yield* jobs.startWorker({ name: "w", handlers: [work.handler] });
        expect((yield* until(c, () => work.runs() === 1, 30_000)).ok).toBe(true);
        expect((yield* jobs.get(first.id))?.state).toBe("claimed");
        const whileRunning = yield* enqueue();
        expect(whileRunning).toEqual({ id: first.id, created: false });

        yield* Deferred.succeed(release, undefined);
        expect((yield* until(c, async () => (await saved(c)).length === 1, 30_000)).ok).toBe(true);
        expect((yield* jobs.get(first.id))?.state).toBe("done");

        const next = yield* enqueue();
        expect(next.created).toBe(true);
        expect(next.id).not.toBe(first.id);
        expect((yield* until(c, async () => (await saved(c)).length === 2, 30_000)).ok).toBe(true);
        expect((yield* jobs.get(next.id))?.state).toBe("done");
      }),
    );
    expect(exit._tag).toBe("Success");
    expect(work.runs()).toBe(2);
  });
});

describe("T-B13-08 · partitions", () => {
  it("jobs with one partition key never run two at once, while other partitions run in parallel", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const gate = Deferred.makeUnsafe<void>();
    const inFlight = new Map<string, number>();
    let maxInFlight = 0;
    const maxByPartition = new Map<string, number>();
    const started: string[] = [];

    const work = workHandler((_n, run) =>
      Effect.gen(function* () {
        const partition = (run.job.payload as { partition: string }).partition;
        started.push(partition);
        const now = (inFlight.get(partition) ?? 0) + 1;
        inFlight.set(partition, now);
        maxByPartition.set(partition, Math.max(maxByPartition.get(partition) ?? 0, now));
        maxInFlight = Math.max(
          maxInFlight,
          [...inFlight.values()].reduce((a, b) => a + b, 0),
        );
        yield* Deferred.await(gate);
        inFlight.set(partition, (inFlight.get(partition) ?? 1) - 1);
        yield* run.finish(saveRow(run.job.id, partition));
      }),
    );

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        yield* db.withTransaction(
          Effect.gen(function* () {
            for (const partition of ["A", "B"]) {
              for (let i = 0; i < 3; i++) {
                yield* jobs.enqueue(
                  "t13.work",
                  `part:${partition}:${i}`,
                  { partition },
                  { partition },
                );
              }
            }
          }),
        );
        // Plenty of workers: only the partition rule can keep two of one mission apart.
        yield* Effect.forEach(["w1", "w2", "w3", "w4", "w5", "w6"], (name) =>
          jobs.startWorker({ name, handlers: [work.handler] }),
        );
        // Both partitions are running at once, one job each, while the rest wait.
        const both = yield* until(c, () => started.includes("A") && started.includes("B"), 30_000);
        expect(both.ok, "the two partitions never ran in parallel").toBe(true);
        yield* advance(c, 5_000);
        expect(started).toHaveLength(2);
        expect(inFlight.get("A")).toBe(1);
        expect(inFlight.get("B")).toBe(1);

        yield* Deferred.succeed(gate, undefined);
        const done = yield* until(c, async () => (await saved(c)).length === 6, 120_000);
        expect(done.ok, "the queued jobs never ran").toBe(true);
      }),
    );
    expect(exit._tag).toBe("Success");
    expect(maxByPartition.get("A")).toBe(1);
    expect(maxByPartition.get("B")).toBe(1);
    expect(maxInFlight).toBe(2);
  });
});
