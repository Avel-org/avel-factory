/**
 * T-B17-02, 03 (CR-44): the database refuses a second claimed job in one partition, and the
 * engine's claim treats that refusal as "skip", never as a failure. Time is a TestClock.
 */
import { Deferred, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { testDatabase } from "../db/support/database.ts";

const database = testDatabase("b17part");

// Loaded inside T-B17-03, so T-B17-02 (raw SQL against the schema) runs and fails by itself on a
// checkout where the engine isn't built yet.
const engine = async () => ({
  ...(await import("../../src/platform/jobs/index.ts")),
  ...(await import("./support.ts")),
});

describe("T-B17-02 · jobs_one_claimed_per_partition_uq", () => {
  it("refuses a second claimed job in one partition; another partition and no partition both claim", async () => {
    const d = await database();
    const c = await d.client();
    await c.query("delete from jobs");
    const add = async (key: string, partition: string | null) =>
      (
        await c.query(
          "insert into jobs (kind, key, partition_key) values ('t17.raw', $1, $2) returning id",
          [key, partition],
        )
      ).rows[0].id as string;
    const claim = (id: string) =>
      c.query(
        `update jobs set state = 'claimed', claim_no = claim_no + 1, claimed_by = 'raw',
           claim_expires_at = now() + interval '30 seconds' where id = $1`,
        [id],
      );

    const a1 = await add("raw:a1", "mission-a");
    const a2 = await add("raw:a2", "mission-a");
    const b1 = await add("raw:b1", "mission-b");
    const n1 = await add("raw:n1", null);
    const n2 = await add("raw:n2", null);

    await claim(a1);
    // The second claim in mission-a is refused by the database: unique violation, by this index.
    const refused = await claim(a2).then(
      () => undefined,
      (e: { code?: string; constraint?: string }) => e,
    );
    expect(refused?.code, "the second claim in one partition wasn't refused").toBe("23505");
    expect(refused?.constraint).toBe("jobs_one_claimed_per_partition_uq");
    expect(
      (await c.query("select state from jobs where id = $1", [a2])).rows[0].state,
      "the refused job stays queued",
    ).toBe("queued");

    // Another partition, and jobs with no partition, are not held back.
    await claim(b1);
    await claim(n1);
    await claim(n2);
    expect(
      (await c.query("select count(*)::int as n from jobs where state = 'claimed'")).rows[0].n,
    ).toBe(4);

    // Once the holder is done, the partition is free again.
    await c.query(
      "update jobs set state = 'done', finished_at = now(), claimed_by = null, claim_expires_at = null where id = $1",
      [a1],
    );
    await claim(a2);
    expect((await c.query("select state from jobs where id = $1", [a2])).rows[0].state).toBe(
      "claimed",
    );
  });
});

describe("T-B17-03 · concurrent claims in one partition", () => {
  it("never fail a claim: one worker holds the partition, the others skip to other work or find none", async () => {
    const { Jobs, advance, createSaved, runJobs, saved, saveRow, until, workHandler } =
      await engine();
    const d = await database();
    const c = await d.client();
    await c.query("delete from jobs");
    await createSaved(c);
    const gate = Deferred.makeUnsafe<void>();
    const inFlight = new Map<string, number>();
    const maxByPartition = new Map<string, number>();
    const runsByJob = new Map<string, number>();

    const work = workHandler((_n, run) =>
      Effect.gen(function* () {
        const partition = (run.job.payload as { partition: string }).partition;
        runsByJob.set(run.job.id, (runsByJob.get(run.job.id) ?? 0) + 1);
        const now = (inFlight.get(partition) ?? 0) + 1;
        inFlight.set(partition, now);
        maxByPartition.set(partition, Math.max(maxByPartition.get(partition) ?? 0, now));
        yield* Deferred.await(gate);
        inFlight.set(partition, (inFlight.get(partition) ?? 1) - 1);
        yield* run.finish(saveRow(run.job.id, partition));
      }),
    );
    const ids: string[] = [];

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        // Mission A has many jobs and only B has one besides: workers meet on A's partition.
        yield* db.withTransaction(
          Effect.gen(function* () {
            for (let i = 0; i < 5; i++) {
              const made = yield* jobs.enqueue(
                "t13.work",
                `pi:A:${i}`,
                { partition: "A" },
                { partition: "A" },
              );
              ids.push(made.id);
            }
            const b = yield* jobs.enqueue(
              "t13.work",
              "pi:B:0",
              { partition: "B" },
              { partition: "B" },
            );
            ids.push(b.id);
          }),
        );
        yield* Effect.forEach(
          ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8"],
          (name) => jobs.startWorker({ name, handlers: [work.handler] }),
          { concurrency: 8 },
        );
        const both = yield* until(
          c,
          () => inFlight.get("A") === 1 && inFlight.get("B") === 1,
          30_000,
        );
        expect(both.ok, "A's holder and B's job didn't both start").toBe(true);
        // Seconds of polling with A held: every other worker keeps skipping, none fails.
        yield* advance(c, 10_000);
        expect(inFlight.get("A")).toBe(1);
        expect(runsByJob.size).toBe(2);

        yield* Deferred.succeed(gate, undefined);
        const done = yield* until(c, async () => (await saved(c)).length === 6, 120_000);
        expect(done.ok, "the queued jobs never ran").toBe(true);
        yield* advance(c, 60_000);
      }),
    );
    expect(exit._tag, "a claim failed with a defect").toBe("Success");
    expect(maxByPartition.get("A")).toBe(1);
    expect(maxByPartition.get("B")).toBe(1);
    // A refused claim is a skip: it costs no attempt and burns no claim number.
    const rows = (
      await c.query("select state, attempts, claim_no, last_error from jobs order by key")
    ).rows;
    expect(rows).toHaveLength(6);
    for (const r of rows) {
      expect(r).toEqual({ state: "done", attempts: 1, claim_no: 1, last_error: null });
    }
    expect([...runsByJob.values()].every((n) => n === 1)).toBe(true);
    expect(runsByJob.size).toBe(6);
  });
});
