/**
 * T-B13-01 (test 11): a job enqueued in a transaction that rolls back never runs, and leaves no
 * job and no event. The same key is free again afterwards, and a committed enqueue does run.
 */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import { NotFound } from "../../src/platform/errors.ts";
import { Jobs } from "../../src/platform/jobs/index.ts";
import { testDatabase } from "../db/support/database.ts";
import { advance, createSaved, event, runJobs, saved, saveRow, until } from "./support.ts";

const database = testDatabase("b13roll");

describe("T-B13-01 · a rolled-back enqueue", () => {
  it("never runs, leaves no job and no event; a committed one with the same key runs once", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    let calls = 0;
    let rolledId = "";
    let committedId = "";

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        yield* jobs.startWorker({
          name: "w1",
          handlers: [
            {
              kind: "t13.roll",
              decide: (job) => job.id,
              apply: (_decision, run) =>
                Effect.gen(function* () {
                  calls += 1;
                  yield* run.finish(saveRow(run.job.id, "ran"));
                }),
            },
          ],
        });

        const rolled = yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              const made = yield* jobs.enqueue("t13.roll", "roll:1", { n: 1 });
              rolledId = made.id;
              yield* Events.append(event("t13.rolled"));
              yield* db.commitWithEvents;
              return yield* new NotFound({ message: "undo" });
            }),
          ),
        );
        expect(rolled._tag).toBe("Failure");

        // Two simulated minutes: far past any claim, poll or reaper interval.
        yield* advance(c, 120_000);
        expect(yield* jobs.get(rolledId)).toBeUndefined();

        // The key is free: nothing live was left behind by the rollback.
        const made = yield* db.withTransaction(
          Effect.gen(function* () {
            const r = yield* jobs.enqueue("t13.roll", "roll:1", { n: 2 });
            yield* Events.append(event("t13.committed"));
            yield* db.commitWithEvents;
            return r;
          }),
        );
        committedId = made.id;
        expect(made.created).toBe(true);
        expect(made.id).not.toBe(rolledId);
        const finished = yield* until(c, async () => (await saved(c)).length === 1, 60_000);
        expect(finished.ok, "the committed job never ran within a minute").toBe(true);
        yield* advance(c, 60_000);
      }),
    );
    expect(exit._tag).toBe("Success");

    expect(calls).toBe(1);
    expect(await saved(c)).toEqual([{ job_id: committedId, note: "ran" }]);
    const ev = await c.query("select kind from events where kind like 't13.%' order by seq");
    expect(ev.rows.map((r) => r.kind)).toEqual(["t13.committed"]);
  });
});
