/**
 * T-B27-03 (t-b18-rigg-04 item 3): a copy whose 5th failure on an event lands after another copy
 * took the claim reports nothing dead. Its update changes no row, so there is no 'dead' log line,
 * the job isn't dead, and the other copy goes on. Time is a TestClock.
 *
 * Setup the test makes in its own database (never a migration): the job already carries four failed
 * tries (`attempts` = 4, as four failures with their backoffs would leave it); and a trigger refuses
 * copy a's check-ins, so its claim expires while its handler is still running, which is what a
 * copy that stalls for a minute looks like to the rest. The trigger goes once b holds the claim.
 */
import { Cause, Deferred, Effect, Logger } from "effect";
import type pg from "pg";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
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

const database = testDatabase("b27late");

const jobOf = async (c: pg.Client) =>
  (await c.query("select state, attempts, claim_no from jobs where key = 'consumer:late'"))
    .rows[0] as { state: string; attempts: number; claim_no: number };

describe("T-B27-03 · a 5th failure that lands after another copy took the claim", () => {
  it("logs no dead line, leaves the job as the other copy has it, and the other copy goes on", async () => {
    const d = await database();
    const c = await d.client();
    await createSaved(c);
    const logs: string[] = [];
    const capture = Logger.make<unknown, void>(({ logLevel, message, cause }) => {
      logs.push(
        `${String(logLevel)} ${JSON.stringify(message)} ${cause.reasons.length > 0 ? Cause.pretty(cause) : ""}`,
      );
    });
    const acted: string[] = [];
    let atFailure:
      | { dead: string[]; job: { state: string; attempts: number; claim_no: number } }
      | undefined;
    let claimB = 0;

    const exit = await runJobs(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const jobs = yield* Jobs;
        const holdA = yield* Deferred.make<void>();
        const holdB = yield* Deferred.make<void>();
        const enteredA = yield* Deferred.make<void>();
        const enteredB = yield* Deferred.make<void>();

        yield* db.withTransaction(jobs.enqueue("consumer", "consumer:late", {}));
        yield* Effect.promise(async () => {
          await c.query("update jobs set attempts = 4 where key = 'consumer:late'");
          await c.query(`create or replace function t_b27_freeze() returns trigger as $$
            begin raise exception 't_b27: check-ins are frozen'; end $$ language plpgsql`);
          await c.query("drop trigger if exists t_b27_freeze on jobs");
          await c.query(`create trigger t_b27_freeze before update on jobs for each row
            when (old.state = 'claimed' and new.state = 'claimed' and old.claim_no = new.claim_no
                  and old.claim_expires_at is distinct from new.claim_expires_at)
            execute function t_b27_freeze()`);
        });

        yield* jobs.startConsumer({
          name: "late",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push(`a:${e.seq}`);
              yield* saveRow(`seq-${e.seq}`, "a");
              yield* Deferred.succeed(enteredA, undefined);
              yield* Deferred.await(holdA);
              // The 5th failure on this event.
              return yield* Effect.fail(new Error("a-fails"));
            }),
          ),
        });
        yield* emit("t27.late", { n: 1 });
        const started = yield* until(c, () => acted.length === 1, 30_000);
        expect(started.ok, "copy a never started on the event").toBe(true);
        yield* Deferred.await(enteredA);

        // a's claim goes unrenewed and expires; b takes it and is inside its handler.
        yield* jobs.startConsumer({
          name: "late",
          handle: handler((e) =>
            Effect.gen(function* () {
              acted.push(`b:${e.seq}`);
              yield* saveRow(`seq-${e.seq}`, "b");
              yield* Deferred.succeed(enteredB, undefined);
              yield* Deferred.await(holdB);
            }),
          ),
        });
        const took = yield* until(c, () => acted.some((x) => x.startsWith("b:")), 90_000);
        expect(took.ok, "copy b never took the claim").toBe(true);
        yield* Deferred.await(enteredB);
        yield* Effect.promise(() => c.query("drop trigger if exists t_b27_freeze on jobs"));
        claimB = (yield* Effect.promise(() => cursorOf(c, "late")))?.claimNo ?? 0;

        // a's handler fails now: its 5th failure, after b took the claim.
        yield* Deferred.succeed(holdA, undefined);
        yield* advance(c, 5_000, 1_000);
        atFailure = {
          dead: logs.filter((l) => /dead/i.test(l)),
          job: yield* Effect.promise(() => jobOf(c)),
        };

        // b goes on: its move commits, and the next event is acted on.
        yield* Deferred.succeed(holdB, undefined);
        const [first] = yield* Effect.promise(() => seqsOf(c, "t27.late"));
        const moved = yield* until(
          c,
          async () => (await cursorOf(c, "late"))?.lastSeq === first,
          30_000,
        );
        expect(moved.ok, "b's move never committed").toBe(true);
        yield* emit("t27.late", { n: 2 });
        const next = yield* until(
          c,
          () => acted.filter((x) => x.startsWith("b:")).length === 2,
          30_000,
        );
        expect(next.ok, "b never went on to the next event").toBe(true);
        yield* advance(c, 30_000, 5_000);
      }).pipe(Effect.provide(Logger.layer([capture]))),
    );
    succeeds(exit);

    // Right after a's late failure: nothing said dead, and the job is as b has it.
    expect(atFailure?.dead, "a logged a death that didn't happen").toEqual([]);
    expect(atFailure?.job.state, "a's late failure changed the job").toBe("claimed");
    expect(atFailure?.job.attempts).toBe(4);
    expect(atFailure?.job.claim_no).toBe(claimB);

    expect(logs.filter((l) => /dead/i.test(l))).toEqual([]);
    const [one, two] = await seqsOf(c, "t27.late");
    expect(acted.filter((x) => x.startsWith("b:"))).toEqual([`b:${one}`, `b:${two}`]);
    expect((await saved(c)).map((r) => r.note)).toEqual(["b", "b"]);
    expect((await cursorOf(c, "late"))?.lastSeq).toBe(two);
    expect((await jobOf(c)).state).not.toBe("dead");
  });
});
