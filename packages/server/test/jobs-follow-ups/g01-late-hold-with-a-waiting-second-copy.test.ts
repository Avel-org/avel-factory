/**
 * T-B27-G01 (a guard, CR-42; t-b18-rigg-01): T-B18-02's variant. Copy b's handler, like a's, waits
 * on its own Deferred. a's late hold is released first: a's write isn't saved and the cursor
 * doesn't move, because the cursor's swap carries the claim number and b's claim is the newer one.
 * Then b is released: the cursor moves once, and only b's write stays. Without the swap's
 * claim_no condition a's late move would succeed (the cursor is still at the seq a read) and a's
 * write would stay. Time is a TestClock.
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

const database = testDatabase("b27claimno");

describe("T-B27-G01 · the cursor's swap carries the claim number", () => {
  it("a late hold released first is refused while b waits; then b's move is the only one", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const acted: { copy: string; seq: number }[] = [];
    let claimA = 0;
    let claimB = 0;

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        const holdA = yield* Deferred.make<void>();
        const holdB = yield* Deferred.make<void>();
        const enteredA = yield* Deferred.make<void>();
        const enteredB = yield* Deferred.make<void>();

        const a = yield* jobs.startConsumer({
          name: "twice",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push({ copy: "a", seq: e.seq });
              yield* saveRow(`seq-${e.seq}`, "a");
              yield* Deferred.succeed(enteredA, undefined);
              yield* Deferred.await(holdA);
            }),
          ),
        });
        yield* emit("t27.claimno", { n: 1 });
        const started = yield* until(c, () => acted.length === 1, 30_000);
        expect(started.ok, "copy a never started on the event").toBe(true);
        yield* Deferred.await(enteredA);
        claimA = (yield* Effect.promise(() => cursorOf(c, "twice")))?.claimNo ?? 0;

        // a vanishes mid-handle (its handler is left running); its claim expires; b takes over.
        yield* a.kill;
        yield* jobs.startConsumer({
          name: "twice",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push({ copy: "b", seq: e.seq });
              yield* saveRow(`seq-${e.seq}`, "b");
              yield* Deferred.succeed(enteredB, undefined);
              yield* Deferred.await(holdB);
            }),
          ),
        });
        const took = yield* until(c, () => acted.some((x) => x.copy === "b"), 90_000);
        expect(took.ok, "copy b never took over").toBe(true);
        yield* Deferred.await(enteredB);
        claimB = (yield* Effect.promise(() => cursorOf(c, "twice")))?.claimNo ?? 0;
        expect(claimB, "b's claim is the newer one").toBeGreaterThan(claimA);

        // a wakes first, while b is still inside its handler: its move must be refused.
        yield* Deferred.succeed(holdA, undefined);
        yield* advance(c, 5_000, 1_000);
        expect(
          (yield* Effect.promise(() => cursorOf(c, "twice")))?.lastSeq,
          "a moved the cursor",
        ).toBe(0);
        expect(
          (yield* Effect.promise(() => saved(c))).map((r) => r.note),
          "a's write was saved",
        ).toEqual([]);

        // Then b is released: it moves the cursor once and its write stays.
        yield* Deferred.succeed(holdB, undefined);
        const [seq] = yield* Effect.promise(() => seqsOf(c, "t27.claimno"));
        const moved = yield* until(
          c,
          async () => (await cursorOf(c, "twice"))?.lastSeq === seq,
          30_000,
        );
        expect(moved.ok, "b's move never committed").toBe(true);
        yield* advance(c, 30_000, 5_000);
      }),
    );
    succeeds(exit);

    const [seq] = await seqsOf(c, "t27.claimno");
    expect((await saved(c)).map((r) => r.note)).toEqual(["b"]);
    expect(acted.filter((x) => x.copy === "b").map((x) => x.seq)).toEqual([seq]);
    expect((await cursorOf(c, "twice"))?.lastSeq).toBe(seq);
    expect((await cursorOf(c, "twice"))?.claimNo).toBe(claimB);
  });
});
