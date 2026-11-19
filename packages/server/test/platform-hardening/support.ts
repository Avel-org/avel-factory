/**
 * Harness for T-B8's acceptance tests. It names the seams the build must provide (listed in the
 * report for the lead to confirm before the lock):
 *
 *   src/platform/db/db.ts       DbLive also reads, through Config (strings in the environment):
 *                                 DATABASE_CONNECT_TIMEOUT_MS   default 5000
 *                                 DATABASE_STATEMENT_TIMEOUT_MS default 30000
 *                               and fails to build (a defect whose message names `lc_messages`)
 *                               unless `show lc_messages` is C, POSIX or starts with `en`.
 *   src/platform/errors.ts      IdempotencyKeyReused, IdempotencyInProgress, TokenReplayed,
 *                               TooManyRequests: tagged errors with rows in errorTable
 *                               (IDEMPOTENCY_KEY_REUSED, IDEMPOTENCY_IN_PROGRESS, TOKEN_REPLAYED,
 *                               TOO_MANY_REQUESTS). TooManyRequests.details is { retryAfterMs }.
 *   src/platform/idempotency.ts Idempotency: an Effect service { begin, complete }
 *                                 begin(principal, key, route, bodySha256):
 *                                   Effect<{ _tag: "New" } | { _tag: "Replay", status, response },
 *                                          IdempotencyKeyReused | IdempotencyInProgress | TokenReplayed>
 *                                 complete(principal, key, status, response, { sensitive }):
 *                                   Effect<void>
 *                               IdempotencyLive: Layer<Idempotency, never, Db>. Time from Clock.
 *   src/platform/rate-limit.ts  RateLimit: an Effect service { check(name, key): Effect<void,
 *                               TooManyRequests> }; RateLimitLive: Layer<RateLimit, ConfigError>,
 *                               a fixed window per (name, key), time from Clock. Names with plan
 *                               defaults: "device-login" 5 a minute, "webhook" 60 a minute.
 *                               The window is one minute; retryAfterMs is what is left of it.
 */
import { ConfigProvider, Effect, Layer } from "effect";
import { type Db, DbLive } from "../../src/platform/db/db.ts";

/** DbLive reading this URL (and any other settings) as the environment, as production does. */
export const dbLayer = (
  url: string,
  env: Record<string, string> = {},
): Layer.Layer<Db, Layer.Error<typeof DbLive>> =>
  DbLive.pipe(
    Layer.provide(
      ConfigProvider.layer(ConfigProvider.fromEnvRecord({ DATABASE_URL: url, ...env })),
    ),
  );

export const runDb = <A, E>(
  url: string,
  env: Record<string, string>,
  program: Effect.Effect<A, E, Db>,
) => Effect.runPromiseExit(program.pipe(Effect.provide(dbLayer(url, env))));

export const hasDie = (cause: { readonly reasons: readonly { readonly _tag: string }[] }) =>
  cause.reasons.some((r) => r._tag === "Die");
