/**
 * T-B13-10 (test 11; step 1 item 10): under concurrent transactions, seq order equals commit
 * order with no gap a reader can miss, a rolled-back transaction leaves no event, and two copies
 * of one consumer never both act on an event. Time is a TestClock.
 */
import { users } from "@avel/db";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import { NotFound } from "../../src/platform/errors.ts";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { testDatabase } from "../db/support/database.ts";
import { advance, event, runJobs, until } from "./support.ts";

const database = testDatabase("b13cons");

describe("T-B13-10 · events and consumers", () => {
  it("a consumer sees every committed event once, in seq order, and two copies never both act on one", async () => {
    const d = await database();
    const c = await d.client();
    const WRITERS = 12;
    const PER = 3;
    const FAILING = 5;
    const expected = (WRITERS - 1) * PER;

    const single: number[] = [];
    const twin: { copy: string; seq: number }[] = [];
    const rolledBack: number[] = [];
    const seen = (e: { seq: number; payload: unknown }, into: (seq: number) => void) => {
      if ((e.payload as { writer: number }).writer === FAILING) rolledBack.push(e.seq);
      into(e.seq);
    };

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        yield* jobs.startConsumer({
          name: "orderly",
          handle: (e) => Effect.sync(() => seen(e, (s) => single.push(s))),
        });
        for (const copy of ["one", "two"]) {
          yield* jobs.startConsumer({
            name: "twin",
            handle: (e) => Effect.sync(() => seen(e, (seq) => twin.push({ copy, seq }))),
          });
        }

        const writer = (i: number) =>
          db.withTransaction(
            Effect.gen(function* () {
              const tx = yield* Tx;
              yield* Effect.promise(() =>
                tx.insert(users).values({ name: "Cn", email: `cn-${i}@avel.test` }),
              );
              for (let n = 0; n < PER; n++) {
                yield* Events.append(event("t13.conc", { writer: i, n }));
              }
              if (i === FAILING) return yield* new NotFound({ message: "undo" });
              yield* db.commitWithEvents;
            }),
          );
        yield* Effect.forEach(
          Array.from({ length: WRITERS }, (_, i) => i),
          (i) => Effect.exit(writer(i)),
          { concurrency: WRITERS },
        );

        const caughtUp = yield* until(
          c,
          () => single.length >= expected && twin.length >= expected,
          120_000,
        );
        expect(caughtUp.ok, "the consumers never caught up").toBe(true);
        // Time passes with nothing new: nobody acts on an event again.
        yield* advance(c, 120_000, 5_000);
      }),
    );
    expect(exit._tag).toBe("Success");

    const all = await c.query(
      "select seq, payload from events where kind = 't13.conc' order by seq",
    );
    const seqs = all.rows.map((r) => Number(r.seq));
    expect(seqs).toHaveLength(expected);
    // Seq order is commit order, with no hole: a rolled-back writer's events took no seq.
    for (let i = 1; i < seqs.length; i++) expect(seqs[i]).toBe((seqs[i - 1] as number) + 1);
    expect(rolledBack).toEqual([]);

    // One copy of a consumer sees them all, in seq order, once.
    expect(single).toEqual(seqs);
    // Two copies of one: each event acted on exactly once between them.
    expect(twin.map((t) => t.seq).sort((a, b) => a - b)).toEqual(seqs);
    for (const copy of ["one", "two"]) {
      const mine = twin.filter((t) => t.copy === copy).map((t) => t.seq);
      expect(mine).toEqual([...mine].sort((a, b) => a - b));
    }
  });
});
