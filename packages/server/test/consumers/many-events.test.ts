/**
 * T-B18-05 and T-B18-06 (Step 1 test 11; item 10): under concurrent writers, some rolled back, a
 * consumer started before them acts on exactly the committed events, once each, in seq order;
 * consumers of different names each see every event and keep their own cursor and claim number.
 * Time is a TestClock.
 */
import { users } from "@avel/db";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import { NotFound } from "../../src/platform/errors.ts";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { testDatabase } from "../db/support/database.ts";
import {
  advance,
  createSaved,
  cursorOf,
  emit,
  event,
  handler,
  runJobs,
  saved,
  saveRow,
  seqsOf,
  succeeds,
  until,
} from "./support.ts";

const concurrentDb = testDatabase("b18conc");
const twoNamesDb = testDatabase("b18names");

describe("T-B18-05 · 20 concurrent writers, some rolled back", () => {
  it("the consumer acts on exactly the committed events, once each, in seq order", async () => {
    const d = await concurrentDb();
    const c = await d.client();
    await createSaved(c);
    const WRITERS = 20;
    const PER = 2;
    const rolledBack = (i: number) => i % 4 === 3;
    const expected = (WRITERS - WRITERS / 4) * PER;
    const seen: { seq: number; writer: number }[] = [];

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        yield* jobs.startConsumer({
          name: "witness",
          handle: handler((e) =>
            Effect.gen(function* () {
              seen.push({ seq: e.seq, writer: (e.payload as { writer: number }).writer });
              yield* saveRow(`seq-${e.seq}`, "acted");
            }),
          ),
        });
        const writer = (i: number) =>
          db.withTransaction(
            Effect.gen(function* () {
              const tx = yield* Tx;
              yield* Effect.promise(() =>
                tx.insert(users).values({ name: "Cw", email: `cw-${i}@avel.test` }),
              );
              for (let n = 0; n < PER; n++) {
                yield* Events.append(event("t18.conc", { writer: i, n }));
              }
              if (rolledBack(i)) return yield* new NotFound({ message: "undo" });
              yield* db.commitWithEvents;
            }),
          );
        yield* Effect.forEach(
          Array.from({ length: WRITERS }, (_, i) => i),
          (i) => Effect.exit(writer(i)),
          { concurrency: WRITERS },
        );
        const caughtUp = yield* until(c, () => seen.length >= expected, 120_000);
        expect(caughtUp.ok, "the consumer never caught up").toBe(true);
        yield* advance(c, 60_000, 5_000);
      }),
    );
    succeeds(exit);

    const seqs = await seqsOf(c, "t18.conc");
    expect(seqs).toHaveLength(expected);
    for (let i = 1; i < seqs.length; i++) expect(seqs[i]).toBe((seqs[i - 1] as number) + 1);
    expect(seen.map((s) => s.seq)).toEqual(seqs);
    expect(seen.filter((s) => rolledBack(s.writer))).toEqual([]);
    // Acted on once: one write through Tx per event, none doubled.
    expect(await saved(c)).toHaveLength(expected);
    const cursor = await cursorOf(c, "witness");
    expect(cursor?.lastSeq).toBe(seqs.at(-1));
    expect(cursor?.claimNo).toBeGreaterThanOrEqual(1);
  });
});

describe("T-B18-06 · two consumers with different names", () => {
  it("each sees every event and keeps its own cursor and claim", async () => {
    const d = await twoNamesDb();
    const c = await d.client();
    const alpha: number[] = [];
    const beta: number[] = [];
    let betaFailed = false;
    const stuck: { alpha: number | undefined; beta: number | undefined }[] = [];

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        yield* jobs.startConsumer({
          name: "alpha",
          handle: handler((e) => Effect.sync(() => void alpha.push(e.seq))),
        });
        yield* jobs.startConsumer({
          name: "beta",
          handle: handler((e) =>
            Effect.gen(function* () {
              // Beta fails once on its second event; alpha is unaffected.
              if (beta.length === 1 && !betaFailed) {
                betaFailed = true;
                return yield* Effect.fail(new Error("beta only"));
              }
              beta.push(e.seq);
            }),
          ),
        });
        for (let n = 1; n <= 4; n++) yield* emit("t18.names", { n });
        const alphaDone = yield* until(c, () => alpha.length >= 4, 30_000);
        expect(alphaDone.ok, "alpha never saw its events").toBe(true);
        // Beta is held at its failing event while alpha is at the end: separate cursors.
        stuck.push({
          alpha: (yield* Effect.promise(() => cursorOf(c, "alpha")))?.lastSeq,
          beta: (yield* Effect.promise(() => cursorOf(c, "beta")))?.lastSeq,
        });
        const betaDone = yield* until(c, () => beta.length >= 4, 60_000);
        expect(betaDone.ok, "beta never saw its events").toBe(true);
        yield* advance(c, 30_000, 5_000);
      }),
    );
    succeeds(exit);

    const seqs = await seqsOf(c, "t18.names");
    expect(seqs).toHaveLength(4);
    expect(alpha).toEqual(seqs);
    expect(beta).toEqual(seqs);
    expect(stuck[0]?.alpha).toBe(seqs[3]);
    expect(stuck[0]?.beta).toBe(seqs[0]);
    const a = await cursorOf(c, "alpha");
    const b = await cursorOf(c, "beta");
    expect(a?.lastSeq).toBe(seqs[3]);
    expect(b?.lastSeq).toBe(seqs[3]);
    // Each name holds a claim of its own.
    expect(a?.claimNo).toBeGreaterThanOrEqual(1);
    expect(b?.claimNo).toBeGreaterThanOrEqual(1);
  });
});
