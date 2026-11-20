/**
 * T-B13-02, 03, 04, 09 (test 10; CR-30 checks 2, 5, 8): a killed worker's job is recovered and
 * its work done once; a crash between a side effect and its save leaves a retry that finds the
 * effect done; a late save from a frozen worker is refused; a stopped worker's work is resumed.
 * Time is a TestClock; the "remote" side effect is an in-memory set the handler reads and writes.
 */
import { Clock, Deferred, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { testDatabase } from "../db/support/database.ts";
import { createSaved, runJobs, saved, saveRow, until, workHandler } from "./support.ts";

const database = testDatabase("b13rec");

const enqueueOne = (key: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const jobs = yield* Jobs;
    return yield* db.withTransaction(jobs.enqueue("t13.work", key, { key }));
  });

describe("T-B13-02 · a killed worker", () => {
  it("its job is picked up by another worker within a minute and does its work once", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const starts: { at: number; claimNo: number }[] = [];
    let killedAt = 0;

    const work = workHandler((n, run) =>
      Effect.gen(function* () {
        starts.push({ at: yield* Clock.currentTimeMillis, claimNo: run.job.claimNo });
        // The first run is the one whose worker is killed, before it saves.
        if (n === 1) return yield* Effect.never;
        yield* run.finish(saveRow(run.job.id, `run-${n}`));
      }),
    );

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const a = yield* jobs.startWorker({ name: "a", handlers: [work.handler] });
        const made = yield* enqueueOne("kill:1");
        const claimed = yield* until(c, () => starts.length === 1, 30_000);
        expect(claimed.ok, "worker a never started the job").toBe(true);
        yield* jobs.startWorker({ name: "b", handlers: [work.handler] });
        yield* a.kill;
        killedAt = yield* Clock.currentTimeMillis;
        const recovered = yield* until(c, async () => (await saved(c)).length >= 1, 60_000);
        expect(recovered.ok, "no worker finished the job within a minute").toBe(true);
        expect((yield* jobs.get(made.id))?.state).toBe("done");
      }),
    );
    expect(exit._tag).toBe("Success");
    expect(work.runs()).toBe(2);
    expect((starts[1]?.at ?? 0) - killedAt).toBeLessThanOrEqual(60_000);
    expect(starts[1]?.claimNo).toBeGreaterThan(starts[0]?.claimNo ?? 0);
    expect((await saved(c)).map((r) => r.note)).toEqual(["run-2"]);
  });
});

describe("T-B13-03 · killed after the side effect, before the save", () => {
  it("the retry finds the effect done, records it, and doesn't repeat it", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const remote = new Set<string>();
    let pushes = 0;

    const work = workHandler((n, run) =>
      Effect.gen(function* () {
        const key = `branch:${run.job.key}`;
        const already = remote.has(key);
        if (!already) {
          pushes += 1;
          remote.add(key);
        }
        // Killed right after the effect and before the save.
        if (n === 1) return yield* Effect.never;
        yield* run.finish(saveRow(run.job.id, already ? "found-done" : "pushed"));
      }),
    );

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const a = yield* jobs.startWorker({ name: "a", handlers: [work.handler] });
        const made = yield* enqueueOne("effect:1");
        expect((yield* until(c, () => pushes === 1, 30_000)).ok).toBe(true);
        yield* jobs.startWorker({ name: "b", handlers: [work.handler] });
        yield* a.kill;
        const done = yield* until(c, async () => (await saved(c)).length >= 1, 120_000);
        expect(done.ok, "the retry never saved").toBe(true);
        expect((yield* jobs.get(made.id))?.state).toBe("done");
      }),
    );
    expect(exit._tag).toBe("Success");
    expect(pushes).toBe(1);
    expect(work.runs()).toBe(2);
    expect((await saved(c)).map((r) => r.note)).toEqual(["found-done"]);
  });
});

describe("T-B13-04 · a frozen worker's late save", () => {
  it("is refused, and changes nothing", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const wake = Deferred.makeUnsafe<void>();
    let lateExit: unknown;

    const work = workHandler((n, run) =>
      Effect.gen(function* () {
        if (n === 1) {
          // Frozen here (SIGSTOP); it wakes after another worker has recovered and finished.
          yield* Deferred.await(wake);
          lateExit = yield* Effect.exit(run.finish(saveRow(run.job.id, "late")));
          return;
        }
        yield* run.finish(saveRow(run.job.id, "recovered"));
      }),
    );

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const a = yield* jobs.startWorker({ name: "a", handlers: [work.handler] });
        const made = yield* enqueueOne("late:1");
        expect((yield* until(c, () => work.runs() === 1, 30_000)).ok).toBe(true);
        yield* jobs.startWorker({ name: "b", handlers: [work.handler] });
        yield* a.kill;
        const done = yield* until(c, async () => (await saved(c)).length >= 1, 120_000);
        expect(done.ok, "the job was never recovered").toBe(true);
        // Now the frozen process wakes up and tries to save.
        yield* Deferred.succeed(wake, undefined);
        expect((yield* until(c, () => lateExit !== undefined, 5_000)).ok).toBe(true);
        expect((yield* jobs.get(made.id))?.state).toBe("done");
      }),
    );
    expect(exit._tag).toBe("Success");
    const late = lateExit as { _tag: string; cause?: { reasons: { error?: { _tag: string } }[] } };
    expect(late._tag).toBe("Failure");
    expect(late.cause?.reasons.map((r) => r.error?._tag)).toEqual(["ClaimLost"]);
    expect((await saved(c)).map((r) => r.note)).toEqual(["recovered"]);
  });
});

describe("T-B13-09 · a deploy with work in flight", () => {
  it("a worker stopped mid-run is replaced by one that finishes the work, once", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const remote = new Set<string>();
    let pushes = 0;

    const work = workHandler((n, run) =>
      Effect.gen(function* () {
        if (!remote.has(run.job.key)) {
          pushes += 1;
          remote.add(run.job.key);
        }
        // The old version is stopped while it is in here.
        if (n === 1) return yield* Effect.never;
        yield* run.finish(saveRow(run.job.id, "resumed"));
      }),
    );

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const old = yield* jobs.startWorker({ name: "old", handlers: [work.handler] });
        const made = yield* enqueueOne("deploy:1");
        expect((yield* until(c, () => work.runs() === 1, 30_000)).ok).toBe(true);
        yield* old.stop;
        yield* jobs.startWorker({ name: "new", handlers: [work.handler] });
        const done = yield* until(c, async () => (await saved(c)).length >= 1, 60_000);
        expect(done.ok, "the new worker never finished the stopped worker's job").toBe(true);
        expect((yield* jobs.get(made.id))?.state).toBe("done");
      }),
    );
    expect(exit._tag).toBe("Success");
    expect(pushes).toBe(1);
    expect((await saved(c)).map((r) => r.note)).toEqual(["resumed"]);
  });
});
