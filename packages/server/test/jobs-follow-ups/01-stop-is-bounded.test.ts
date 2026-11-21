/**
 * T-B27-01 (t-b18-rigg-04 item 1; Jobs and workers.md, Settings: a 30 s claim, check-ins every
 * 10 s): a consumer whose handler never returns can't hang a deploy. `stop` waits for the event
 * in flight at most until the copy's claim would have expired, then interrupts the act. The act is
 * one transaction, so its writes roll back, the claim is handed back and a new copy acts on the
 * event once. Time is a TestClock.
 */
import { Deferred, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Jobs } from "../../src/platform/jobs/index.ts";
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
} from "../consumers/support.ts";
import { testDatabase } from "../db/support/database.ts";

const database = testDatabase("b27stop");

/** Settings: the claim's length. A stop may wait this long after the copy's last check-in. */
const CLAIM_MS = 30_000;

describe("T-B27-01 · a stop is bounded by the claim the copy holds", () => {
  it("returns within 30 s though the handler never does; its write rolls back; a new copy acts once", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const acted: string[] = [];
    let stopped = false;
    let stopTook = -1;

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const entered = yield* Deferred.make<void>();

        const a = yield* jobs.startConsumer({
          name: "stuck",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push(`a:${e.seq}`);
              yield* saveRow(`seq-${e.seq}`, "a");
              yield* Deferred.succeed(entered, undefined);
              // A handler that never returns.
              return yield* Effect.never;
            }),
          ),
        });
        yield* emit("t27.stuck", { n: 1 });
        const started = yield* until(c, () => acted.length === 1, 30_000);
        expect(started.ok, "copy a never started on the event").toBe(true);
        yield* Deferred.await(entered);

        // The copy has checked in for a while: its last check-in is some seconds behind.
        yield* advance(c, 25_000, 5_000);

        // A deploy: stop runs on its own fiber, so the test can move time while it waits.
        yield* Effect.forkChild(
          Effect.andThen(
            a.stop,
            Effect.sync(() => {
              stopped = true;
            }),
          ),
        );
        const returned = yield* until(c, () => stopped, 45_000, 1_000);
        expect(
          returned.ok,
          "stop never returned: a handler that never returns hangs a deploy",
        ).toBe(true);
        stopTook = returned.movedMs;

        // Its act was interrupted inside its transaction: nothing it wrote stayed, the cursor is where it began.
        expect(yield* Effect.promise(() => saved(c))).toEqual([]);
        expect((yield* Effect.promise(() => cursorOf(c, "stuck")))?.lastSeq).toBe(0);

        // A new copy acts on the event, once, without waiting for an expiry that already passed.
        yield* jobs.startConsumer({
          name: "stuck",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push(`b:${e.seq}`);
              yield* saveRow(`seq-${e.seq}`, "b");
            }),
          ),
        });
        const taken = yield* until(c, () => acted.some((x) => x.startsWith("b:")), 10_000);
        expect(taken.ok, "the new copy never acted on the event within 10 s of the stop").toBe(
          true,
        );
        yield* advance(c, 40_000, 5_000);
      }),
    );
    succeeds(exit);

    // At most the claim's length after the last check-in, which was at most 10 s before the stop.
    expect(stopTook).toBeLessThanOrEqual(CLAIM_MS);
    const [seq] = await seqsOf(c, "t27.stuck");
    expect(acted.filter((x) => x.startsWith("b:"))).toEqual([`b:${seq}`]);
    expect((await saved(c)).map((r) => r.note)).toEqual(["b"]);
    expect((await cursorOf(c, "stuck"))?.lastSeq).toBe(seq);
  });
});
