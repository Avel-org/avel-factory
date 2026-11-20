/**
 * Harness for T-B18's acceptance tests (Step 1 item 10, test 11; t-b17-rigg-01). Builds on
 * T-B13's harness (`../jobs/support.ts`, read only): the same TestClock, the same real Postgres.
 * The tests use the Jobs interface, the `events` table, `consumer_cursors` (its `last_seq` and
 * `claim_no`) and nothing else of the engine.
 */
import { Cause, Effect, Exit } from "effect";
import type pg from "pg";
import { Db, type Tx } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import type { ConsumedEvent } from "../../src/platform/jobs/index.ts";
import { event } from "../jobs/support.ts";

export {
  advance,
  createSaved,
  event,
  runJobs,
  saved,
  saveRow,
  T0,
  until,
} from "../jobs/support.ts";

/** Commits one event of its own and returns its seq. */
export const emit = (kind: string, payload: Record<string, unknown> = {}) =>
  Effect.gen(function* () {
    const db = yield* Db;
    yield* db.withTransaction(
      Effect.gen(function* () {
        yield* Events.append(event(kind, payload));
        yield* db.commitWithEvents;
      }),
    );
  });

/**
 * A consumer's handler as a test writes it. It may use `Tx` (the engine runs it inside the
 * transaction that moves the cursor); the cast keeps these tests compiling whether the build
 * types `handle` with a `Tx` requirement or leaves it out.
 */
export const handler =
  (use: (e: ConsumedEvent) => Effect.Effect<void, unknown, Tx>) =>
  (e: ConsumedEvent): Effect.Effect<void, unknown> =>
    use(e) as unknown as Effect.Effect<void, unknown>;

export interface Cursor {
  readonly lastSeq: number;
  readonly claimNo: number;
}

/** The consumer's row in consumer_cursors, or undefined. */
export const cursorOf = async (c: pg.Client, name: string): Promise<Cursor | undefined> => {
  const r = await c.query("select last_seq, claim_no from consumer_cursors where consumer = $1", [
    name,
  ]);
  const row = r.rows[0];
  return row === undefined
    ? undefined
    : { lastSeq: Number(row.last_seq), claimNo: Number(row.claim_no) };
};

/** The seqs of this kind's committed events, in order. */
export const seqsOf = async (c: pg.Client, kind: string): Promise<number[]> =>
  (await c.query("select seq from events where kind = $1 order by seq", [kind])).rows.map((r) =>
    Number(r.seq),
  );

/** Fails the test with the program's own cause, so a failed assertion inside it shows its message. */
export const succeeds = (exit: Exit.Exit<unknown, unknown>) => {
  if (Exit.isFailure(exit)) throw new Error(Cause.pretty(exit.cause));
};
