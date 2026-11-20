import { activityLog } from "@avel/db";
import { Effect } from "effect";
import { Tx } from "../platform/db/db.ts";
import { Ids } from "../platform/ids.ts";

/** One operator action: who did it, what, on which row, and why when the route takes a reason. */
export interface Activity {
  /** The operator's `users.id`. */
  readonly userId: string;
  /** What was done, e.g. `clients.create`. */
  readonly action: string;
  /** The row it was done to, as `<table>/<id>` (`activity_log.target` names any row). */
  readonly target: string;
  readonly reason?: string;
}

/**
 * Records an operator's action in `activity_log` (Step 1 item 8). It needs `Tx`, so it runs in
 * the same transaction as the change it records: a write that rolls back leaves no row.
 */
export const recordActivity = (activity: Activity) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    const ids = yield* Ids;
    const id = yield* ids.uuidv7;
    yield* Effect.promise(() =>
      tx.insert(activityLog).values({
        id,
        actorKind: "user",
        userId: activity.userId,
        action: activity.action,
        target: activity.target,
        reason: activity.reason ?? null,
      }),
    );
  });
