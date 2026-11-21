/**
 * T-B27-05 (t-b18-rigg-04 item 4): a check-in that loses its claim removes its fiber from what the
 * copy holds, as letGo does. The engine exposes nothing of its fibers, so this counts the live
 * fibers of the process (v8.queryObjects on the fiber class, after a forced collection): a finished
 * check-in fiber that the copy still holds stays counted, one that it dropped is collected. A copy
 * that loses its claim three times and takes it again each time must hold no more fibers than
 * after its first claim. Time is a TestClock.
 */
import v8 from "node:v8";
import vm from "node:vm";
import { Effect } from "effect";
import type pg from "pg";
import { describe, expect, it } from "vitest";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { advance, handler, runJobs, succeeds, until } from "../consumers/support.ts";
import { testDatabase } from "../db/support/database.ts";

const database = testDatabase("b27fibers");

v8.setFlagsFromString("--expose-gc");
const collect = vm.runInNewContext("gc") as () => void;
const Fiber = Effect.runFork(Effect.void).constructor as new (...a: never[]) => object;

/** Live fibers after a full collection (a few rounds: a finalizer may free what another held). */
const liveFibers = async () => {
  for (let i = 0; i < 4; i++) {
    collect();
    await new Promise((r) => setImmediate(r));
  }
  return Number(v8.queryObjects(Fiber, { format: "count" }));
};

const claimNo = async (c: pg.Client) =>
  Number(
    (await c.query("select claim_no from jobs where key = 'consumer:leaky'")).rows[0]?.claim_no,
  );

describe("T-B27-05 · a copy that loses its claim keeps no finished check-in fibers", () => {
  it("after three lost claims, each taken again, the live fibers are no more than after the first", async () => {
    const d = await database();
    const c = await d.client();
    let afterFirst = -1;
    let afterThree = -1;

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        yield* jobs.startConsumer({ name: "leaky", handle: handler(() => Effect.void) });
        const first = yield* until(c, async () => (await claimNo(c)) === 1, 30_000);
        expect(first.ok, "the copy never took its first claim").toBe(true);
        yield* advance(c, 2_000, 1_000);
        afterFirst = yield* Effect.promise(liveFibers);

        for (let lost = 1; lost <= 3; lost++) {
          // What a reaper and another copy would do: the claim number moves on and the job is free.
          const before = yield* Effect.promise(() => claimNo(c));
          yield* Effect.promise(() =>
            c.query(
              `update jobs set state = 'queued', claim_no = claim_no + 1, claimed_by = null,
                      claim_expires_at = null where key = 'consumer:leaky'`,
            ),
          );
          // The copy's next check-in finds the claim gone, and it takes the consumer again.
          const again = yield* until(c, async () => (await claimNo(c)) >= before + 2, 40_000);
          expect(again.ok, `the copy never took its claim again after loss ${lost}`).toBe(true);
          yield* advance(c, 2_000, 1_000);
        }
        // Let the last lost check-in be seen too: one more check-in's worth of time.
        yield* advance(c, 12_000, 2_000);
        afterThree = yield* Effect.promise(liveFibers);
      }),
    );
    succeeds(exit);

    expect(afterFirst).toBeGreaterThan(0);
    expect(
      afterThree,
      `live fibers grew from ${afterFirst} to ${afterThree}: finished check-in fibers are still held`,
    ).toBeLessThanOrEqual(afterFirst);
  });
});
