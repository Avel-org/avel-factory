import { Clock, Context, Data, Effect, Layer } from "effect";

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;
const LOCK_MS = 15 * 60_000;

/** A sign-in for a locked account: how long until it opens. */
export class Locked extends Data.TaggedError("Locked")<{ readonly retryAfterMs: number }> {}

/**
 * The sign-in lockout (Step 1 item 5), in memory and per email: 10 failed sign-ins within 15
 * minutes lock the account for 15 minutes, whatever password comes next. Time is the Clock's.
 */
export class Lockout extends Context.Service<
  Lockout,
  {
    /** `Locked` while the email's account is locked. */
    readonly check: (email: string) => Effect.Effect<void, Locked>;
    /** Counts a failed sign-in; the 10th within 15 minutes locks the account. */
    readonly recordFailure: (email: string) => Effect.Effect<void>;
  }
>()("avel/Lockout") {}

export const LockoutLive = Layer.sync(Lockout)(() => {
  const failures = new Map<string, number[]>();
  const lockedUntil = new Map<string, number>();

  const check = (email: string) =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;
      const until = lockedUntil.get(email);
      if (until === undefined) return;
      if (now >= until) {
        lockedUntil.delete(email);
        return;
      }
      return yield* new Locked({ retryAfterMs: until - now });
    });

  const recordFailure = (email: string) =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;
      const recent = (failures.get(email) ?? []).filter((at) => now - at < WINDOW_MS);
      recent.push(now);
      if (recent.length < MAX_FAILURES) {
        failures.set(email, recent);
        return;
      }
      failures.delete(email);
      lockedUntil.set(email, now + LOCK_MS);
    });

  return { check, recordFailure };
});
