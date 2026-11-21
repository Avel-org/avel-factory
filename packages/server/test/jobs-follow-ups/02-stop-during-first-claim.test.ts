/**
 * T-B27-02 (t-b18-rigg-04 item 2, t-b18-zero-01): a stop that lands while a pass is inside its
 * first claim leaves no claim the copy doesn't know it holds. Either the stop waits for the claim
 * and hands it back, or the claim never happens; a new copy then acts on the first event within
 * 10 s, not after the claim's 30 s expiry.
 *
 * The moment is made on purpose, not raced for: a deferred constraint trigger this test creates in
 * its own database (never a migration) makes the copy's claim wait at COMMIT on an advisory lock this
 * test holds, so the claim is committed after the stop began and before the copy could record it.
 * The stop is called while the commit waits; then the lock is let go.
 */
import { setImmediate as nextTurn } from "node:timers/promises";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Jobs } from "../../src/platform/jobs/index.ts";
import {
  createSaved,
  emit,
  handler,
  runJobs,
  saved,
  saveRow,
  succeeds,
  until,
} from "../consumers/support.ts";
import { testDatabase } from "../db/support/database.ts";

const database = testDatabase("b27firstclaim");

describe("T-B27-02 · a stop during a copy's first claim", () => {
  it("leaves no claim the copy doesn't hold: a new copy acts on the first event within 10 s", async () => {
    const d = await database();
    const c = await d.client();
    const locker = await d.client();
    await createSaved(c);
    const acted: string[] = [];
    let stopped = false;
    let waited = 0;

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        yield* Effect.promise(async () => {
          await c.query(`create or replace function t_b27_slow_commit() returns trigger as $$
            begin perform pg_advisory_xact_lock(2727); return null; end $$ language plpgsql`);
          await c.query("drop trigger if exists t_b27_slow_commit on jobs");
          await c.query(`create constraint trigger t_b27_slow_commit after update on jobs
            deferrable initially deferred for each row
            when (new.state = 'claimed' and new.claimed_by = 'racer')
            execute function t_b27_slow_commit()`);
          await locker.query("select pg_advisory_lock(2727)");
        });

        const first = yield* jobs.startConsumer({
          name: "racer",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push(`first:${e.seq}`);
              yield* saveRow(`seq-${e.seq}`, "first");
            }),
          ),
        });

        // Wait, in turns of the event loop, until the copy's claim is waiting on the lock.
        yield* Effect.promise(async () => {
          for (let i = 0; i < 20_000 && waited === 0; i++) {
            const r = await c.query(
              `select count(*)::int as n from pg_stat_activity
                where datname = current_database() and wait_event_type = 'Lock' and pid <> pg_backend_pid()`,
            );
            waited = r.rows[0].n;
            if (waited === 0) await nextTurn();
          }
        });
        expect(waited, "the copy's claim's commit never waited on the lock").toBeGreaterThan(0);

        // The deploy begins while the claim is in flight, and the lock is let go while it runs.
        yield* Effect.forkChild(
          Effect.andThen(
            first.stop,
            Effect.sync(() => {
              stopped = true;
            }),
          ),
        );
        yield* Effect.promise(() => nextTurn());
        yield* Effect.promise(() => locker.query("select pg_advisory_unlock(2727)"));
        const returned = yield* until(c, () => stopped, 40_000, 1_000);
        expect(returned.ok, "stop never returned").toBe(true);

        // A new copy, and the first event ever.
        yield* emit("t27.first", { n: 1 });
        yield* jobs.startConsumer({
          name: "racer",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push(`second:${e.seq}`);
              yield* saveRow(`seq-${e.seq}`, "second");
            }),
          ),
        });
        const took = yield* until(c, () => acted.some((x) => x.startsWith("second:")), 40_000);
        expect(took.ok, "the new copy never acted on the first event").toBe(true);
        expect(
          took.movedMs,
          "the new copy waited for a claim's expiry: the stopped copy left a claim it didn't know it held",
        ).toBeLessThanOrEqual(10_000);
        yield* until(c, () => false, 5_000, 1_000);
        yield* Effect.promise(() => c.query("drop trigger if exists t_b27_slow_commit on jobs"));
      }),
    );
    succeeds(exit);

    expect(acted.filter((x) => x.startsWith("first:"))).toEqual([]);
    expect(acted.filter((x) => x.startsWith("second:"))).toHaveLength(1);
    expect((await saved(c)).map((r) => r.note)).toEqual(["second"]);
  });
});
