/**
 * T-B18-03 and T-B18-04 (Step 1 item 10; Jobs and workers.md, a job's life 7): a handler that
 * fails leaves the cursor where it was and the same event is retried on the backoff (10 s, then
 * 30 s), never skipped and never overtaken; a handler that writes through Tx and enqueues a
 * follow-up job commits both with the cursor move, or none of the three. Time is a TestClock.
 */
import { Clock, Effect } from "effect";
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

const retryDb = testDatabase("b18retry");
const atomicDb = testDatabase("b18atomic");

describe("T-B18-03 · a failing handler", () => {
  it("leaves the cursor, retries the same event after 10 s then 30 s, and nothing after it runs first", async () => {
    const d = await retryDb();
    const c = await d.client();
    await createSaved(c);
    const tries: { seq: number; at: number; ok: boolean }[] = [];
    const cursorWhileFailing: (number | undefined)[] = [];

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        yield* emit("t18.fail", { n: 1 });
        yield* emit("t18.fail", { n: 2 });
        yield* emit("t18.fail", { n: 3 });
        const [first] = yield* Effect.promise(() => seqsOf(c, "t18.fail"));
        yield* jobs.startConsumer({
          name: "flaky",
          handle: handler((e) =>
            Effect.gen(function* () {
              const at = yield* Clock.currentTimeMillis;
              const onFirst = e.seq === first;
              const failures = tries.filter((t) => !t.ok).length;
              // The first event fails twice (after writing through Tx), then works.
              const fails = onFirst && failures < 2;
              tries.push({ seq: e.seq, at, ok: !fails });
              yield* saveRow(`seq-${e.seq}`, `try-${tries.length}`);
              if (fails) return yield* Effect.fail(new Error("boom"));
            }),
          ),
        });

        const failed = yield* until(c, () => tries.length >= 1, 30_000);
        expect(failed.ok, "the handler never ran").toBe(true);
        yield* advance(c, 5_000);
        cursorWhileFailing.push((yield* Effect.promise(() => cursorOf(c, "flaky")))?.lastSeq);
        // 9 s after the failure it is still waiting: the backoff is 10 s, not the poll.
        yield* advance(c, 4_000);
        expect(tries).toHaveLength(1);

        const done = yield* until(c, () => tries.filter((t) => t.ok).length >= 3, 120_000);
        expect(done.ok, "the consumer never got past the failing event").toBe(true);
        yield* advance(c, 60_000, 5_000);
      }),
    );
    succeeds(exit);

    const seqs = await seqsOf(c, "t18.fail");
    // The same event three times (two failures, then success), then the rest in order.
    expect(tries.map((t) => t.seq)).toEqual([seqs[0], seqs[0], seqs[0], seqs[1], seqs[2]]);
    expect(tries.map((t) => t.ok)).toEqual([false, false, true, true, true]);
    // While it was failing the cursor stayed where it began, before the first event.
    expect(cursorWhileFailing).toEqual([0]);
    const [t1, t2, t3] = tries;
    expect((t2?.at ?? 0) - (t1?.at ?? 0)).toBeGreaterThanOrEqual(10_000);
    expect((t2?.at ?? 0) - (t1?.at ?? 0)).toBeLessThan(15_000);
    expect((t3?.at ?? 0) - (t2?.at ?? 0)).toBeGreaterThanOrEqual(30_000);
    expect((t3?.at ?? 0) - (t2?.at ?? 0)).toBeLessThan(35_000);
    // Failed tries wrote nothing that stayed: one saved row per acted-on event.
    expect((await saved(c)).map((r) => r.note).sort()).toEqual(["try-3", "try-4", "try-5"]);
    expect((await cursorOf(c, "flaky"))?.lastSeq).toBe(seqs[2]);
  });
});

describe("T-B18-04 · a handler's writes, its follow-up job and the cursor move", () => {
  it("commit together, or none of them does", async () => {
    const d = await atomicDb();
    const c = await d.client();
    await createSaved(c);
    const jobIds = new Map<number, string[]>();
    let attemptsOnSecond = 0;

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        yield* emit("t18.atomic", { n: 1 });
        yield* emit("t18.atomic", { n: 2 });
        const [one, two] = yield* Effect.promise(() => seqsOf(c, "t18.atomic"));
        yield* jobs.startConsumer({
          name: "atomic",
          handle: handler((e) =>
            Effect.gen(function* () {
              if (e.seq === two) attemptsOnSecond += 1;
              yield* saveRow(`seq-${e.seq}`, `event-${e.seq}`);
              const made = yield* jobs.enqueue(
                "t18.follow",
                `t18:follow:${e.seq}:${attemptsOnSecond}`,
                {
                  seq: e.seq,
                },
              );
              jobIds.set(e.seq, [...(jobIds.get(e.seq) ?? []), made.id]);
              // The second event's first try fails after both writes.
              if (e.seq === two && attemptsOnSecond === 1)
                return yield* Effect.fail(new Error("late"));
            }),
          ),
        });

        const firstDone = yield* until(
          c,
          async () => (await cursorOf(c, "atomic"))?.lastSeq === one,
          30_000,
        );
        expect(firstDone.ok, "the first event never completed").toBe(true);
        expect((yield* jobs.get(jobIds.get(one as number)?.[0] ?? ""))?.kind).toBe("t18.follow");
        expect((yield* Effect.promise(() => saved(c))).map((r) => r.note)).toContain(
          `event-${one}`,
        );

        // The consumer holds a claim of its own.
        expect(
          (yield* Effect.promise(() => cursorOf(c, "atomic")))?.claimNo,
        ).toBeGreaterThanOrEqual(1);

        // The second event failed after writing and enqueueing: neither stayed, the cursor didn't move.
        const failed = yield* until(c, () => attemptsOnSecond >= 1, 30_000);
        expect(failed.ok, "the second event was never tried").toBe(true);
        yield* advance(c, 8_000);
        expect(attemptsOnSecond, "retried before the 10 s backoff").toBe(1);
        expect((yield* Effect.promise(() => cursorOf(c, "atomic")))?.lastSeq).toBe(one);
        expect((yield* Effect.promise(() => saved(c))).map((r) => r.note)).toEqual([
          `event-${one}`,
        ]);
        expect(yield* jobs.get(jobIds.get(two as number)?.[0] ?? "")).toBeUndefined();

        // The retry commits all three.
        const retried = yield* until(
          c,
          async () => (await cursorOf(c, "atomic"))?.lastSeq === two,
          60_000,
        );
        expect(retried.ok, "the retry never committed").toBe(true);
        expect((yield* Effect.promise(() => saved(c))).map((r) => r.note).sort()).toEqual(
          [`event-${one}`, `event-${two}`].sort(),
        );
        const [, retryId] = jobIds.get(two as number) ?? [];
        expect((yield* jobs.get(retryId ?? ""))?.state).toBe("queued");
        yield* advance(c, 30_000, 5_000);
        expect(attemptsOnSecond).toBe(2);
      }),
    );
    succeeds(exit);
    const follow = await c.query("select count(*)::int as n from jobs where kind = 't18.follow'");
    // One follow-up for the first event and one for the retry of the second; none from the failed try.
    expect(follow.rows[0]?.n).toBe(2);
  });
});
