/**
 * The hand-built jobs engine (CR-30 section 3, option A) over the `jobs` and `consumer_cursors`
 * tables, exactly as Jobs and workers.md says: a claim takes a due job with FOR UPDATE SKIP
 * LOCKED, raises its claim_no and sets claim_expires_at; every save is conditional on that
 * claim_no; workers check in, a reaper puts expired claims back in the queue, and a failing job
 * retries on the backoff until it is dead. Time comes from Clock, and every interval is a
 * Schedule, so TestClock drives all of it.
 */
import { consumerCursors, events, jobs } from "@avel/db";
import { and, asc, eq, gt, inArray, lt, lte, sql } from "drizzle-orm";
import { Cause, Clock, Duration, Effect, Exit, Fiber, Layer, Schedule } from "effect";
import { Db, type DbError, Tx } from "../db/db.ts";
import type { Transaction } from "../db/tx.ts";
import {
  ClaimLost,
  type ConsumedEvent,
  type Handler,
  type JobState,
  Jobs,
  type JobView,
  type Run,
  type Worker,
} from "./jobs.ts";

/** Jobs and workers.md, Settings (decided Nov 2). */
const CLAIM = Duration.seconds(30);
const CHECK_IN = Schedule.spaced("10 seconds");
const REAP = Schedule.spaced("10 seconds");
/** How often an idle worker or consumer looks for due work. */
const POLL = Schedule.spaced("1 second");
/** The wait after failures 1 to 4; the 5th failure is dead. */
const BACKOFF = [
  Duration.seconds(10),
  Duration.seconds(30),
  Duration.minutes(2),
  Duration.minutes(10),
];
const TRIES = 5;
/** How many events a consumer reads at a time. */
const EVENT_BATCH = 100;

/** CR-44: the index that refuses a second claimed job in one partition. */
const ONE_CLAIMED_PER_PARTITION = "jobs_one_claimed_per_partition_uq";

type JobRow = typeof jobs.$inferSelect;

/** The engine writes only these states; `failed` is in the schema's list but never used here. */
const STATES: ReadonlySet<string> = new Set<JobState>(["queued", "claimed", "done", "dead"]);

const viewOf = (row: JobRow): JobView => {
  if (!STATES.has(row.state)) throw new Error(`job ${row.id} is in state ${row.state}`);
  return {
    id: row.id,
    kind: row.kind,
    key: row.key,
    payload: row.payload,
    state: row.state as JobState,
    attempts: row.attempts,
    claimNo: row.claimNo,
    runAfter: row.runAfter.getTime(),
    lastError: row.lastError,
  };
};

/** The job's row while this run's claim is the current one. */
const stillClaimed = (job: JobView) =>
  and(eq(jobs.id, job.id), eq(jobs.claimNo, job.claimNo), eq(jobs.state, "claimed"));

/** A queued job whose partition, if it has one, has no claimed job (CR-44). */
const partitionFree = sql`(${jobs.partitionKey} is null or not exists (
  select 1 from jobs held where held.partition_key = ${jobs.partitionKey} and held.state = 'claimed'))`;

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * A run's save, or its job's own statements, breaking a database rule is a defect, which fails
 * the run; only a lost claim is the caller's to handle.
 */
const onlyClaimLost = (e: ClaimLost | DbError) =>
  e instanceof ClaimLost ? Effect.fail(e) : Effect.die(e);

export const JobsLive = Layer.effect(
  Jobs,
  Effect.gen(function* () {
    const db = yield* Db;

    /** One statement in a transaction of its own; the engine's statements break no rule. */
    const query = <A>(use: (tx: Transaction) => Promise<A>) =>
      Effect.orDie(
        db.withTransaction(
          Effect.gen(function* () {
            const tx = yield* Tx;
            return yield* Effect.promise(() => use(tx));
          }),
        ),
      );

    const enqueue = (
      kind: string,
      key: string,
      payload: unknown,
      options?: { readonly partition?: string },
    ) =>
      Effect.gen(function* () {
        const tx = yield* Tx;
        const runAfter = new Date(yield* Clock.currentTimeMillis);
        // A live job with this key makes the insert do nothing instead of failing, so the
        // caller's transaction is never aborted. If that job finishes before the read, try again.
        for (;;) {
          const [made] = yield* Effect.promise(() =>
            tx
              .insert(jobs)
              .values({ kind, key, payload, runAfter, partitionKey: options?.partition })
              .onConflictDoNothing({
                target: jobs.key,
                where: sql`state in ('queued', 'claimed')`,
              })
              .returning({ id: jobs.id }),
          );
          if (made !== undefined) return { id: made.id, created: true };
          const [live] = yield* Effect.promise(() =>
            tx
              .select({ id: jobs.id })
              .from(jobs)
              .where(and(eq(jobs.key, key), inArray(jobs.state, ["queued", "claimed"]))),
          );
          if (live !== undefined) return { id: live.id, created: false };
        }
      });

    const get = (id: string) =>
      Effect.map(
        query((tx) => tx.select().from(jobs).where(eq(jobs.id, id))),
        ([row]) => (row === undefined ? undefined : viewOf(row)),
      );

    /**
     * Claims the oldest due job of these kinds, or finds none. Another worker claiming in the
     * same partition at the same moment makes the index refuse this one (CR-44): that's a skip,
     * rolled back with nothing spent, and the claim looks again.
     */
    const claim = (name: string, kinds: ReadonlyArray<string>) =>
      Effect.gen(function* () {
        for (;;) {
          const now = yield* Clock.currentTimeMillis;
          const claimed = yield* db
            .withTransaction(
              Effect.gen(function* () {
                const tx = yield* Tx;
                const [next] = yield* Effect.promise(() =>
                  tx
                    .select({ id: jobs.id })
                    .from(jobs)
                    .where(
                      and(
                        eq(jobs.state, "queued"),
                        lte(jobs.runAfter, new Date(now)),
                        inArray(jobs.kind, [...kinds]),
                        partitionFree,
                      ),
                    )
                    .orderBy(asc(jobs.runAfter), asc(jobs.id))
                    .limit(1)
                    .for("update", { skipLocked: true }),
                );
                if (next === undefined) return undefined;
                const [row] = yield* Effect.promise(() =>
                  tx
                    .update(jobs)
                    .set({
                      state: "claimed",
                      claimNo: sql`${jobs.claimNo} + 1`,
                      attempts: sql`${jobs.attempts} + 1`,
                      claimedBy: name,
                      claimExpiresAt: new Date(now + Duration.toMillis(CLAIM)),
                    })
                    .where(eq(jobs.id, next.id))
                    .returning(),
                );
                return row === undefined ? undefined : viewOf(row);
              }),
            )
            .pipe(
              Effect.catchTag("AlreadyExists", (e) =>
                e.details.constraint === ONE_CLAIMED_PER_PARTITION
                  ? Effect.succeed("skip" as const)
                  : Effect.die(e),
              ),
              Effect.orDie,
            );
          if (claimed !== "skip") return claimed;
        }
      });

    /** Pushes this run's claim expiry out, while its claim is current. */
    const checkIn = (job: JobView) =>
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis;
        const rows = yield* query((tx) =>
          tx
            .update(jobs)
            .set({ claimExpiresAt: new Date(now + Duration.toMillis(CLAIM)) })
            .where(stillClaimed(job))
            .returning({ id: jobs.id }),
        );
        if (rows.length === 0) return yield* new ClaimLost({ jobId: job.id });
      });

    /** Marks the job done and runs `save` in one transaction, while this run's claim is current. */
    const finish = (job: JobView, save?: Effect.Effect<void, never, Tx>) =>
      Effect.gen(function* () {
        const now = new Date(yield* Clock.currentTimeMillis);
        yield* Effect.catch(
          db.withTransaction(
            Effect.gen(function* () {
              const tx = yield* Tx;
              const marked = yield* Effect.promise(() =>
                tx
                  .update(jobs)
                  .set({ state: "done", finishedAt: now, claimedBy: null, claimExpiresAt: null })
                  .where(stillClaimed(job))
                  .returning({ id: jobs.id }),
              );
              if (marked.length === 0) return yield* new ClaimLost({ jobId: job.id });
              if (save !== undefined) yield* save;
              yield* db.commitWithEvents;
            }),
          ),
          onlyClaimLost,
        );
      });

    /** A failed run: back in the queue after its backoff, or dead after the 5th try. */
    const fail = (job: JobView, error: string) =>
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis;
        const delay = BACKOFF[job.attempts - 1];
        const next =
          job.attempts >= TRIES || delay === undefined
            ? { state: "dead", finishedAt: new Date(now) }
            : { state: "queued", runAfter: new Date(now + Duration.toMillis(delay)) };
        yield* query((tx) =>
          tx
            .update(jobs)
            .set({ ...next, claimedBy: null, claimExpiresAt: null, lastError: error })
            .where(stillClaimed(job)),
        );
      });

    /** Hands a claim back to the queue at once (a graceful stop). */
    const release = (job: JobView) =>
      query((tx) =>
        tx
          .update(jobs)
          .set({ state: "queued", claimedBy: null, claimExpiresAt: null })
          .where(stillClaimed(job)),
      );

    /** Puts every job whose claim has expired back in the queue. */
    const reap = Effect.gen(function* () {
      const now = new Date(yield* Clock.currentTimeMillis);
      yield* query((tx) =>
        tx
          .update(jobs)
          .set({ state: "queued", claimedBy: null, claimExpiresAt: null })
          .where(and(eq(jobs.state, "claimed"), lt(jobs.claimExpiresAt, now))),
      );
    });

    const startWorker = (options: {
      readonly name: string;
      readonly handlers: ReadonlyArray<Handler<unknown>>;
    }) =>
      Effect.gen(function* () {
        const scope = yield* Effect.scope;
        const handlers = new Map(options.handlers.map((h) => [h.kind, h]));
        const kinds = [...handlers.keys()];
        /** What a kill ends: the claim loop, the reaper and the check-ins. */
        const own = new Set<Fiber.Fiber<unknown, unknown>>();
        /** The run in flight, which a kill leaves running and a stop interrupts. */
        const runs = new Map<Fiber.Fiber<void, never>, JobView>();

        const runOne = (handler: Handler<unknown>, job: JobView) =>
          Effect.gen(function* () {
            let finished = false;
            const run: Run = {
              job,
              checkIn: checkIn(job),
              finish: (save) =>
                Effect.tap(
                  finish(job, save),
                  Effect.sync(() => {
                    finished = true;
                  }),
                ),
            };
            const beat = yield* Effect.forkIn(
              Effect.ignore(Effect.schedule(run.checkIn, CHECK_IN)),
              scope,
            );
            own.add(beat);
            const exit = yield* Effect.exit(
              Effect.suspend(() => handler.apply(handler.decide(job), run)),
            );
            own.delete(beat);
            yield* Fiber.interrupt(beat);
            if (Exit.isSuccess(exit)) {
              // A handler that returns without finishing is finished with no save.
              if (!finished) yield* Effect.ignore(run.finish());
              return;
            }
            if (Cause.hasInterruptsOnly(exit.cause)) return;
            const error = Cause.squash(exit.cause);
            // Another run owns the job now: this one leaves it alone.
            if (error instanceof ClaimLost) return;
            yield* fail(job, errorText(error));
          });

        /** Claims and runs one job at a time until none is due. */
        const drain = Effect.gen(function* () {
          for (;;) {
            const job = yield* claim(options.name, kinds);
            const handler = job && handlers.get(job.kind);
            if (job === undefined || handler === undefined) return;
            const fiber = yield* Effect.forkIn(runOne(handler, job), scope);
            runs.set(fiber, job);
            yield* Fiber.await(fiber);
            runs.delete(fiber);
          }
        });

        own.add(yield* Effect.forkIn(Effect.repeat(drain, POLL), scope));
        own.add(yield* Effect.forkIn(Effect.repeat(reap, REAP), scope));

        const kill = Effect.suspend(() => Fiber.interruptAll([...own]));
        const stop = Effect.gen(function* () {
          yield* kill;
          const inFlight = [...runs];
          runs.clear();
          yield* Fiber.interruptAll(inFlight.map(([fiber]) => fiber));
          yield* Effect.forEach(inFlight, ([, job]) => release(job), { discard: true });
        });
        return { stop, kill } satisfies Worker;
      });

    /**
     * Each event after the consumer's cursor, in seq order: the cursor moves by compare-and-swap
     * from the seq this copy read, and the event is handled in that same transaction, so a copy
     * that lost the swap acts on nothing, and a handler that fails leaves the cursor where it was.
     */
    const consume = (
      name: string,
      handle: (event: ConsumedEvent) => Effect.Effect<void, unknown>,
    ) =>
      Effect.gen(function* () {
        const [cursor] = yield* query((tx) =>
          tx
            .select({ lastSeq: consumerCursors.lastSeq })
            .from(consumerCursors)
            .where(eq(consumerCursors.consumer, name)),
        );
        let at = cursor?.lastSeq ?? 0;
        const next = yield* query((tx) =>
          tx
            .select({ seq: events.seq, kind: events.kind, payload: events.payload })
            .from(events)
            .where(gt(events.seq, at))
            .orderBy(asc(events.seq))
            .limit(EVENT_BATCH),
        );
        for (const event of next) {
          const from = at;
          const moved = yield* Effect.exit(
            db.withTransaction(
              Effect.gen(function* () {
                const tx = yield* Tx;
                const swapped = yield* Effect.promise(() =>
                  tx
                    .update(consumerCursors)
                    .set({ lastSeq: event.seq })
                    .where(
                      and(eq(consumerCursors.consumer, name), eq(consumerCursors.lastSeq, from)),
                    )
                    .returning({ consumer: consumerCursors.consumer }),
                );
                if (swapped.length === 0) return false;
                yield* handle(event);
                return true;
              }),
            ),
          );
          if (Exit.isFailure(moved)) {
            yield* Effect.logWarning(
              `consumer ${name} failed on event ${event.seq}; it is tried again`,
            );
            return;
          }
          if (!moved.value) return;
          at = event.seq;
        }
      });

    const startConsumer = (options: {
      readonly name: string;
      readonly handle: (event: ConsumedEvent) => Effect.Effect<void, unknown>;
    }) =>
      Effect.gen(function* () {
        yield* query((tx) =>
          tx.insert(consumerCursors).values({ consumer: options.name }).onConflictDoNothing(),
        );
        const fiber = yield* Effect.forkScoped(
          Effect.repeat(consume(options.name, options.handle), POLL),
        );
        const end = Fiber.interrupt(fiber);
        return { stop: end, kill: end } satisfies Worker;
      });

    return { enqueue, get, startWorker, startConsumer };
  }),
);
