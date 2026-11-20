/**
 * T-B18-07 (t-b17-rigg-01): every loop of the engine survives a database defect. A blip ends the
 * connections of a running worker and consumer while their statements are in flight; afterwards a
 * new job is claimed and finished, an expired claim is still reaped, a run's check-ins carry on,
 * and the consumer acts on a new event, all inside T-B13's budgets under TestClock. Each defect is
 * logged once, with no values. Time is a TestClock.
 */
import { Cause, Clock, Deferred, Effect, Logger } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { type Handler, Jobs } from "../../src/platform/jobs/index.ts";
import { testDatabase } from "../db/support/database.ts";
import {
  advance,
  createSaved,
  cursorOf,
  emit,
  handler,
  runJobs,
  saved,
  saveRow,
  succeeds,
  until,
} from "./support.ts";

const database = testDatabase("b18blip");

/** Values that must never reach a log line. */
const SECRET = "sentinel-6e1f";

describe("T-B18-07 · one database blip under a running worker and consumer", () => {
  it("claims, reaps, checks in and consumes again after it, logging each defect once with no values", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const logs: { level: string; text: string }[] = [];
    const capture = Logger.make<unknown, void>(({ logLevel, message, cause }) => {
      logs.push({
        level: String(logLevel),
        text: `${JSON.stringify(message)} ${cause.reasons.length > 0 ? Cause.pretty(cause) : ""}`,
      });
    });

    const starts: Record<string, number> = { doomed: 0, long: 0, fresh: 0 };
    const gate: { open: Deferred.Deferred<void> | undefined } = { open: undefined };
    const consumed: number[] = [];

    const kinds = (live: boolean): Handler<string>[] => {
      const make = (kind: string, run: Handler<string>["apply"]): Handler<string> => ({
        kind,
        decide: (job) => job.id,
        apply: run,
      });
      return [
        make("t18.doomed", (_id, run) =>
          Effect.gen(function* () {
            starts.doomed = (starts.doomed ?? 0) + 1;
            // The doomed worker's run never ends; the live worker's retry of it does.
            if (!live) return yield* Effect.never;
            yield* run.finish(saveRow(run.job.id, "reaped-and-rerun"));
          }),
        ),
        make("t18.long", (_id, run) =>
          Effect.gen(function* () {
            starts.long = (starts.long ?? 0) + 1;
            if (gate.open !== undefined) yield* Deferred.await(gate.open);
            yield* run.finish(saveRow(run.job.id, "long-finished"));
          }),
        ),
        make("t18.fresh", (_id, run) =>
          Effect.gen(function* () {
            starts.fresh = (starts.fresh ?? 0) + 1;
            yield* run.finish(saveRow(run.job.id, "fresh-finished"));
          }),
        ),
      ];
    };

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        gate.open = yield* Deferred.make<void>();
        const enqueue = (kind: string, key: string) =>
          db.withTransaction(jobs.enqueue(kind, `${SECRET}:${key}`, { secret: SECRET }));

        // A worker that will die holding a claim, so the live worker has something to reap later.
        // Only the doomed kind: if it could claim t18.long too, it would sometimes take the long run and die
        // holding it, and the reaper's rerun would be correct but fail starts.long (F2, Nov 20).
        const doomed = yield* jobs.startWorker({
          name: `${SECRET}-doomed`,
          handlers: kinds(false).filter((h) => h.kind === "t18.doomed"),
        });
        const doomedJob = yield* enqueue("t18.doomed", "doomed");
        expect((yield* until(c, () => starts.doomed === 1, 30_000)).ok).toBe(true);

        yield* jobs.startWorker({ name: `${SECRET}-live`, handlers: kinds(true) });
        yield* jobs.startConsumer({
          name: "blipper",
          handle: handler((e) => Effect.sync(() => void consumed.push(e.seq))),
        });
        // A run in flight whose check-ins must carry on past the blip.
        const longJob = yield* enqueue("t18.long", "long");
        expect((yield* until(c, () => starts.long === 1, 30_000)).ok).toBe(true);
        yield* emit("t18.blip", { secret: SECRET, n: 0 });
        expect((yield* until(c, () => consumed.length === 1, 30_000)).ok).toBe(true);

        // The blip: hold the engine's tables so every loop has a statement in flight, let each
        // loop reach one (a poll, the reaper's and the check-in's 10 s), then end their connections.
        yield* Effect.promise(async () => {
          await c.query("begin");
          await c.query("lock table jobs, consumer_cursors, events in access exclusive mode");
        });
        yield* doomed.kill;
        yield* advance(c, 12_000);
        const mark = logs.length;
        yield* Effect.promise(async () => {
          await c.query(
            "select pg_terminate_backend(pid) from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid()",
          );
          await c.query("rollback");
        });
        yield* advance(c, 3_000);
        const defectLogs = logs.slice(mark).filter((l) => /warn|error|fatal/i.test(l.level));
        const afterBlip = yield* Clock.currentTimeMillis;

        // 1. A job enqueued after the blip is claimed and finished.
        const fresh = yield* enqueue("t18.fresh", "fresh");
        const claimed = yield* until(c, () => (starts.fresh ?? 0) >= 1, 10_000);
        expect(claimed.ok, "a job enqueued after the blip was never claimed").toBe(true);
        const freshDone = yield* until(
          c,
          async () => (await saved(c)).some((r) => r.note === "fresh-finished"),
          10_000,
        );
        expect(freshDone.ok, "the fresh job never finished").toBe(true);
        expect((yield* jobs.get(fresh.id))?.state).toBe("done");

        // 2. The doomed worker's expired claim is reaped, and the job runs again.
        const reaped = yield* until(c, () => (starts.doomed ?? 0) >= 2, 60_000);
        expect(reaped.ok, "the expired claim was never reaped after the blip").toBe(true);
        const doomedDone = yield* until(
          c,
          async () => (await saved(c)).some((r) => r.note === "reaped-and-rerun"),
          10_000,
        );
        expect(doomedDone.ok, "the rerun never finished").toBe(true);
        expect((yield* jobs.get(doomedJob.id))?.state).toBe("done");

        // 3. The consumer acts on a new event.
        yield* emit("t18.blip", { secret: SECRET, n: 1 });
        const next = yield* until(c, () => consumed.length === 2, 10_000);
        expect(next.ok, "the consumer never acted on an event after the blip").toBe(true);
        const cursorMoved = yield* until(
          c,
          async () => (await cursorOf(c, "blipper"))?.lastSeq === consumed[1],
          10_000,
        );
        expect(cursorMoved.ok, "the cursor never moved to the new event").toBe(true);
        expect((yield* Effect.promise(() => cursorOf(c, "blipper")))?.lastSeq).toBe(consumed[1]);

        // 4. The long run kept checking in: well past one claim's 30 s it is still the same run.
        yield* advance(c, 90_000, 5_000);
        expect(starts.long).toBe(1);
        expect((yield* jobs.get(longJob.id))?.state).toBe("claimed");
        yield* Deferred.succeed(gate.open, undefined);
        const longDone = yield* until(
          c,
          async () => (await Effect.runPromise(jobs.get(longJob.id)))?.state === "done",
          10_000,
        );
        expect(longDone.ok, "the long run could not finish: its claim was lost").toBe(true);
        expect(starts.long).toBe(1);

        // Each defect was logged once with no values: some were logged, none repeats, none has a value.
        expect(afterBlip).toBeGreaterThan(0);
        yield* advance(c, 120_000, 10_000);
        const allDefects = logs.slice(mark).filter((l) => /warn|error|fatal/i.test(l.level));
        expect(allDefects.length, "no defect was logged").toBeGreaterThanOrEqual(1);
        expect(allDefects.length, "a defect was logged again after the blip").toBe(
          defectLogs.length,
        );
        // The loops: claim, reap, one check-in, the consumer: at most one log line each, with slack of two.
        expect(allDefects.length).toBeLessThanOrEqual(6);
        for (const l of logs) expect(l.text).not.toContain(SECRET);
      }).pipe(Effect.provide(Logger.layer([capture]))),
    );
    succeeds(exit);

    const notes = (await saved(c)).map((r) => r.note).sort();
    expect(notes).toEqual(["fresh-finished", "long-finished", "reaped-and-rerun"]);
  });
});
