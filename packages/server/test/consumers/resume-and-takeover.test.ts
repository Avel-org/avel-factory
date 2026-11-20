/**
 * T-B18-01 and T-B18-02 (Step 1 item 10; Jobs and workers.md, Event consumers): a consumer that is
 * stopped and started again resumes after its last event; a copy that dies mid-handle loses its
 * claim to a new copy within a minute, and the dead copy's late cursor move is refused. A consumer
 * is a claimed job, so its cursor row carries a claim number that goes up with each claim.
 * Time is a TestClock.
 */
import { Clock, Deferred, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Jobs } from "../../src/platform/jobs/index.ts";
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
  seqsOf,
  succeeds,
  until,
} from "./support.ts";

const resumeDb = testDatabase("b18resume");
const takeoverDb = testDatabase("b18take");

describe("T-B18-01 · a consumer started again resumes", () => {
  it("the new copy acts on event n + 1 and nothing twice, from consumer_cursors", async () => {
    const d = await resumeDb();
    const c = await d.client();
    const handled: { copy: string; seq: number }[] = [];
    const mine = (copy: string) =>
      handler((e) => Effect.sync(() => void handled.push({ copy, seq: e.seq })));

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const first = yield* jobs.startConsumer({ name: "resumer", handle: mine("first") });
        for (let n = 1; n <= 3; n++) yield* emit("t18.resume", { n });
        const one = yield* until(c, () => handled.length >= 3, 30_000);
        expect(one.ok, "the first copy never saw its three events").toBe(true);
        yield* first.stop;

        const afterFirst = yield* Effect.promise(() => cursorOf(c, "resumer"));
        expect(afterFirst?.lastSeq).toBe(handled[2]?.seq);
        // The consumer was claimed: its claim number is its own and is at least 1.
        expect(afterFirst?.claimNo).toBeGreaterThanOrEqual(1);

        // Events committed while no copy runs.
        for (let n = 4; n <= 5; n++) yield* emit("t18.resume", { n });
        const restartedAt = yield* Clock.currentTimeMillis;
        yield* jobs.startConsumer({ name: "resumer", handle: mine("second") });
        const two = yield* until(c, () => handled.length >= 5, 30_000);
        expect(two.ok, "the new copy never caught up").toBe(true);
        // A stopped copy hands its claim back: the new copy needn't wait for an expiry.
        expect((yield* Clock.currentTimeMillis) - restartedAt).toBeLessThanOrEqual(10_000);
        yield* advance(c, 60_000, 5_000);

        const afterSecond = yield* Effect.promise(() => cursorOf(c, "resumer"));
        expect(afterSecond?.lastSeq).toBe(handled[4]?.seq);
        // A second claim, taken by the second copy.
        expect(afterSecond?.claimNo).toBeGreaterThan(afterFirst?.claimNo ?? 0);
      }),
    );
    succeeds(exit);

    const seqs = await seqsOf(c, "t18.resume");
    expect(seqs).toHaveLength(5);
    expect(handled.map((h) => h.seq)).toEqual(seqs);
    expect(handled.filter((h) => h.copy === "first").map((h) => h.seq)).toEqual(seqs.slice(0, 3));
    expect(handled.filter((h) => h.copy === "second").map((h) => h.seq)).toEqual(seqs.slice(3));
  });
});

describe("T-B18-02 · a consumer copy killed mid-handle", () => {
  it("its claim expires and is taken over within a minute; the dead copy's late move is refused", async () => {
    const d = await takeoverDb();
    const c = await d.client();
    await createSaved(c);
    const acted: { copy: string; seq: number; at: number }[] = [];
    let killedAt = 0;
    let claimBefore = 0;

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const hold = yield* Deferred.make<void>();
        const entered = yield* Deferred.make<void>();

        // Copy "a" writes through Tx for its event, then hangs inside the handler.
        const a = yield* jobs.startConsumer({
          name: "mortal",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push({ copy: "a", seq: e.seq, at: yield* Clock.currentTimeMillis });
              yield* saveRow(`seq-${e.seq}`, "a");
              yield* Deferred.succeed(entered, undefined);
              yield* Deferred.await(hold);
            }),
          ),
        });
        yield* emit("t18.take", { n: 1 });
        const started = yield* until(c, () => acted.length === 1, 30_000);
        expect(started.ok, "copy a never started on the event").toBe(true);
        yield* Deferred.await(entered);

        yield* jobs.startConsumer({
          name: "mortal",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push({ copy: "b", seq: e.seq, at: yield* Clock.currentTimeMillis });
              yield* saveRow(`seq-${e.seq}`, "b");
            }),
          ),
        });

        // While a lives (it checks in), b takes nothing: well past 30 s with no expiry.
        yield* advance(c, 45_000, 5_000);
        expect(acted.filter((x) => x.copy === "b")).toEqual([]);
        claimBefore = (yield* Effect.promise(() => cursorOf(c, "mortal")))?.claimNo ?? 0;
        expect(claimBefore).toBeGreaterThanOrEqual(1);

        yield* a.kill;
        killedAt = yield* Clock.currentTimeMillis;
        const taken = yield* until(c, () => acted.some((x) => x.copy === "b"), 60_000);
        expect(taken.ok, "copy b never took over within a minute").toBe(true);

        // The dead copy wakes up late: its handler goes on, and its cursor move is refused.
        yield* Deferred.succeed(hold, undefined);
        yield* advance(c, 30_000, 5_000);
      }),
    );
    succeeds(exit);

    const [seq] = await seqsOf(c, "t18.take");
    const byB = acted.filter((x) => x.copy === "b");
    expect(byB.map((x) => x.seq)).toEqual([seq]);
    expect((byB[0]?.at ?? 0) - killedAt).toBeLessThanOrEqual(60_000);
    // The event was acted on once: the dead copy's write rolled back with its refused move.
    expect((await saved(c)).map((r) => r.note)).toEqual(["b"]);
    const cursor = await cursorOf(c, "mortal");
    expect(cursor?.lastSeq).toBe(seq);
    expect(cursor?.claimNo).toBeGreaterThan(claimBefore);
  });
});
