/**
 * T-B4-05: commitWithEvents: under concurrent transactions, events' seq order equals commit
 * order, with no gap a reader at the last seq can miss. Nothing here waits on the wall clock:
 * transactions are ordered with Deferreds, and the reader polls in a loop until the writers end.
 */
import { users } from "@avel/db";
import { Deferred, Effect, Exit, Fiber } from "effect";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import { NotFound } from "../../src/platform/errors.ts";
import { testDatabase } from "../db/support/database.ts";
import { event, runDb } from "./support/db.ts";

const database = testDatabase("b4seq");

const insertUser = (email: string) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    yield* Effect.promise(() => tx.insert(users).values({ name: "Sq", email }));
  });

describe("T-B4-05 · seq order is commit order", () => {
  it("a transaction that appended first but commits last gets the later seq", async () => {
    const d = await database();
    const c = await d.client();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const slowAppended = yield* Deferred.make<void>();
        const release = yield* Deferred.make<void>();
        const slow = yield* Effect.forkChild(
          db.withTransaction(
            Effect.gen(function* () {
              yield* Events.append(event("test.order", { who: "slow" }));
              yield* Deferred.succeed(slowAppended, undefined);
              yield* Deferred.await(release);
              yield* db.commitWithEvents;
            }),
          ),
        );
        yield* Deferred.await(slowAppended);
        // The fast one appends after the slow one did, and commits before it.
        yield* db.withTransaction(
          Effect.gen(function* () {
            yield* Events.append(event("test.order", { who: "fast" }));
            yield* db.commitWithEvents;
          }),
        );
        yield* Deferred.succeed(release, undefined);
        yield* Fiber.join(slow);
      }),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
    const rows = await c.query(
      "select payload->>'who' as who from events where kind = 'test.order' order by seq",
    );
    expect(rows.rows.map((r) => r.who)).toEqual(["fast", "slow"]);
  });

  it("many concurrent writers, one failing: a reader that only asks for seq above its last never misses an event, and seq has no holes", async () => {
    const d = await database();
    const c = await d.client();
    const reader = await d.client();
    const WRITERS = 12;
    const PER = 3;

    let writing = true;
    const seen = new Set<number>();
    let last = 0;
    const poll = (async () => {
      do {
        const r = await reader.query("select seq from events where seq > $1 order by seq", [last]);
        for (const row of r.rows) {
          seen.add(Number(row.seq));
          last = Math.max(last, Number(row.seq));
        }
      } while (writing);
      const r = await reader.query("select seq from events where seq > $1 order by seq", [last]);
      for (const row of r.rows) seen.add(Number(row.seq));
    })();

    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const writer = (i: number) =>
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser(`sq-${i}@avel.test`);
              for (let n = 0; n < PER; n++) {
                yield* Events.append(event("test.conc", { writer: i, n }));
              }
              if (i === 5) return yield* new NotFound({ message: "gone" });
              yield* db.commitWithEvents;
            }),
          );
        yield* Effect.forEach(
          Array.from({ length: WRITERS }, (_, i) => i),
          (i) => Effect.exit(writer(i)),
          { concurrency: WRITERS },
        );
      }),
    );
    writing = false;
    await poll;
    expect(Exit.isSuccess(exit)).toBe(true);

    const all = await c.query(
      "select seq, payload from events where kind = 'test.conc' order by seq",
    );
    const seqs = all.rows.map((r) => Number(r.seq));
    expect(seqs).toHaveLength((WRITERS - 1) * PER);
    // No hole: a failed writer's events never took a seq.
    for (let i = 1; i < seqs.length; i++) expect(seqs[i]).toBe((seqs[i - 1] as number) + 1);
    // No miss: the reader saw every committed event.
    for (const s of seqs) expect(seen.has(s)).toBe(true);
    // One transaction's events are together, in append order.
    const byWriter = new Map<number, number[]>();
    for (const r of all.rows) {
      const list = byWriter.get(r.payload.writer) ?? [];
      list.push(r.payload.n);
      byWriter.set(r.payload.writer, list);
    }
    expect(byWriter.has(5)).toBe(false);
    for (const list of byWriter.values()) expect(list).toEqual([0, 1, 2]);
    const firstSeq = new Map<number, number>();
    for (const r of all.rows)
      if (!firstSeq.has(r.payload.writer)) firstSeq.set(r.payload.writer, Number(r.seq));
    for (const [w, first] of firstSeq) {
      const mine = all.rows.filter((r) => r.payload.writer === w).map((r) => Number(r.seq));
      expect(mine).toEqual([first, first + 1, first + 2]);
    }
  });
});
