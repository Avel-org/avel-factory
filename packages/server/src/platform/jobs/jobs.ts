import { Context, Data, type Effect, type Scope } from "effect";
import type { Tx } from "../db/tx.ts";

/** A save made after this run's claim stopped being current: another run owns the job now. */
export class ClaimLost extends Data.TaggedError("ClaimLost")<{ readonly jobId: string }> {}

export type JobState = "queued" | "claimed" | "done" | "dead";

/** A job as the engine reports it. Times are Clock milliseconds. */
export interface JobView {
  readonly id: string;
  readonly kind: string;
  readonly key: string;
  readonly payload: unknown;
  readonly state: JobState;
  /** Runs started. */
  readonly attempts: number;
  /** Goes up by one each time the job is claimed; 1 on the first claim. */
  readonly claimNo: number;
  readonly runAfter: number;
  readonly lastError: string | null;
}

/** One run of a job, as its handler sees it. */
export interface Run {
  readonly job: JobView;
  readonly checkIn: Effect.Effect<void, ClaimLost>;
  /**
   * Runs `save` and marks the job done in one transaction, only while this run's claim is
   * current; otherwise the save rolls back and it fails with ClaimLost.
   */
  readonly finish: (save?: Effect.Effect<void, never, Tx>) => Effect.Effect<void, ClaimLost>;
}

/**
 * A job kind's handler: a pure `decide`, then an `apply` that carries out the side effects and
 * saves through `run.finish`. Methods, so a handler of any decision type fits `Handler<unknown>`.
 */
export interface Handler<D> {
  readonly kind: string;
  decide(job: JobView): D;
  apply(decision: D, run: Run): Effect.Effect<void, unknown>;
}

/** A committed event, as a consumer reads it. */
export interface ConsumedEvent {
  readonly seq: number;
  readonly kind: string;
  readonly payload: unknown;
}

export interface Worker {
  /** A graceful shutdown (a deploy): the run in flight is interrupted and handed back. */
  readonly stop: Effect.Effect<void>;
  /** The process vanishes or freezes: nothing more is claimed, checked in or released. */
  readonly kill: Effect.Effect<void>;
}

export class Jobs extends Context.Service<
  Jobs,
  {
    /** Enqueues in the caller's transaction. One live job per key: a live one is returned. */
    readonly enqueue: (
      kind: string,
      key: string,
      payload: unknown,
      options?: { readonly partition?: string },
    ) => Effect.Effect<{ readonly id: string; readonly created: boolean }, never, Tx>;
    readonly get: (id: string) => Effect.Effect<JobView | undefined>;
    readonly startWorker: (options: {
      readonly name: string;
      readonly handlers: ReadonlyArray<Handler<unknown>>;
    }) => Effect.Effect<Worker, never, Scope.Scope>;
    /** Acts on each committed event once, in seq order; copies of one name share the work. */
    readonly startConsumer: (options: {
      readonly name: string;
      readonly handle: (event: ConsumedEvent) => Effect.Effect<void, unknown>;
    }) => Effect.Effect<Worker, never, Scope.Scope>;
  }
>()("avel/Jobs") {}
