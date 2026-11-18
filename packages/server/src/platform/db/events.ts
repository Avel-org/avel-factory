import type { events } from "@avel/db";
import { Effect } from "effect";
import { type Transaction, Tx } from "./tx.ts";

/** An event as a program appends it; `seq` and `at` are the database's. */
export type NewEvent = Omit<typeof events.$inferInsert, "seq" | "at">;

/** Each open transaction's queued events, in append order. */
const queues = new WeakMap<Transaction, NewEvent[]>();

/** Hands over this transaction's queued events and empties its queue. */
export function takeQueued(tx: Transaction): NewEvent[] {
  const queued = queues.get(tx) ?? [];
  queues.delete(tx);
  return queued;
}

/** Whether this transaction has events no `Db.commitWithEvents` has written yet. */
export const hasQueued = (tx: Transaction): boolean => (queues.get(tx)?.length ?? 0) > 0;

export const Events = {
  /**
   * Queues an event in the open transaction; it writes nothing. `Db.commitWithEvents` inserts
   * the queue, so the event commits with the change or not at all.
   */
  append: (event: NewEvent): Effect.Effect<void, never, Tx> =>
    Effect.gen(function* () {
      const tx = yield* Tx;
      const queued = queues.get(tx) ?? [];
      queued.push(event);
      queues.set(tx, queued);
    }),
};
