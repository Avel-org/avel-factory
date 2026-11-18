status: test-dispute
ticket: T-B8

Seven of the eight tasks pass: T-B8-01, 03, 04, 05, 06, 07 and 08. Typecheck, lint and `check:effect` are clean.

T-B8-02 fails, and no build can pass it alongside T-B8-05 as locked. Axis ruled through OSA that the test at fault is T-B8-02 and that the boot check stays (Messages received, item 2). So this attempt ends `test-dispute` on T-B8-02 only, as the ruling says. Rigg's F2 fix and Axis's relock come next.

The runtime path T-B8-02 is meant to prove is built in full: a connect timeout, and an interruptible pending connect. I checked it with a throwaway test after a good boot (Limitations).

## The dispute: T-B8-02 against T-B8-05

- **What T-B8-05 and the task doc's note require:** DbLive takes a connection when it is built, runs `show lc_messages`, and fails the build unless the value is C, POSIX or en*.
- **What T-B8-02 does:** it builds DbLive against a socket that accepts and never answers. Then it expects the build to succeed and `withTransaction` to die.
- **Why the two can't both pass:**
  - With the boot check, subtest 1 (400 ms connect timeout) fails the build within the timeout as a defect. The test then unwraps an outer `Exit.Success` that isn't there (`pool-timeouts.test.ts:83`).
  - Subtest 2 (20 s timeout under a 4 s guard) would wait the full connect timeout at boot.
- **Axis's ruling:** build the boot check as the note says, with the same `DATABASE_CONNECT_TIMEOUT_MS` and no new timeout, and build the runtime path in full. T-B8-02's fixed version will test the runtime path after a good build.
- **The failure, as it stands:**

```
 × T-B8-02 · Postgres that never answers > withTransaction fails as a defect within the connect timeout, and an interruption ends it 419ms
   AssertionError: expected undefined to be true   (pool-timeouts.test.ts:83: the build died within the 400 ms connect timeout)
```

## Pre-flight

The Postgres came from `scripts/pg-local.sh start`. Before I changed anything, the server suite had 6 failing files, all of them the locked platform-hardening tests; the other 11 passed.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. 2 warnings, both already there, in `apps/web/e2e/control-room-budget/budget.spec.ts` (73 and 89, `useDomNodeTextContent`) |
| `pnpm test` | exit 1: 970 passed, 1 failed (T-B8-02, the dispute); 54 of 55 files passed |
| `pnpm --filter @avel/server test` | exit 1: 53 passed, 1 failed (T-B8-02); 16 of 17 files passed |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors. 6 warnings and 2 messages, all in test files: `unstableApiUsage` and `multipleEffectProvide` in the locked tests, and `unnecessaryFailYieldableError` in `test/db/errors.test.ts`. None are in `src`. |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 1 at `pnpm test`, the same single failure |

Per task:

| Task | Test | Result |
| --- | --- | --- |
| T-B8-01 | `defect-log.test.ts` | pass |
| T-B8-02 | `pool-timeouts.test.ts` (T-B8-02) | **fail: test-dispute** (above) |
| T-B8-03 | `pool-timeouts.test.ts` (T-B8-03) | pass |
| T-B8-04 | `backend-death.test.ts` | pass |
| T-B8-05 | `lc-messages.test.ts` | pass |
| T-B8-06 | `idempotency.test.ts` (T-B8-06, and the 409 over HTTP) | pass |
| T-B8-07 | `idempotency.test.ts` (T-B8-07) | pass |
| T-B8-08 | `rate-limit.test.ts` (T-B8-08, and the 429 over HTTP) | pass |

## What changed

There are three commits on `t/B8-platform-hardening` after the lock (`368b458`), each with `Refs: T-B8`, plus this report.

- **`packages/server/src/platform/db/db.ts`**
  - **Safe defects:** an unmapped database defect never leaves the service as a DrizzleQueryError or a pg error. `withoutValues` re-raises it as an `Error` holding only:
    - the pg code;
    - the table, column and constraint, when pg gives them;
    - the query text with its placeholders, and never the params.

    Neither pg's message nor its detail is used, because they can quote a bound value or the failing row.
  - **Pool timeouts:** `DATABASE_CONNECT_TIMEOUT_MS` (default 5000) becomes the pool's `connectionTimeoutMillis`. `DATABASE_STATEMENT_TIMEOUT_MS` (default 30000) becomes Postgres's `statement_timeout` on every connection. Both are read with `Config.Int`.
  - **`checkOut`:** replaces the uninterruptible `acquireRelease` around `pool.connect()`.
    - The finalizer is registered first, and the connect is an `Effect.callback`, so an interruption ends the wait at once.
    - A client that arrives after the interruption is destroyed (`release(true)`), never leaked.
    - While the client is held it carries its own `error` listener, which pg-pool takes off checked-out clients (t-b4-rigg-05). A backend that dies marks the client broken instead of ending the process, and its next query fails as a defect.
  - **`checkIn`:**
    - A broken client is destroyed without a rollback.
    - After a failure, a defect or an interruption, the client is rolled back, then returned. If the rollback fails, it is destroyed instead.
    - The listener comes off just before the client goes back to the pool, which puts its own listener back.

    After a statement timeout, the rollback leaves the client clean before it's reused.
  - **Boot check:** the build takes one connection through `checkOut`, runs `show lc_messages` and gives the connection back. Unless the value is C, POSIX or en*, the build dies with a message naming `lc_messages`.
- **`packages/server/src/platform/errors.ts`:** adds `IdempotencyKeyReused`, `IdempotencyInProgress`, `TokenReplayed` and `TooManyRequests` (details `{ retryAfterMs }`), with their `errorTable` rows. Each message is errorMap's text.
- **`packages/server/src/platform/idempotency.ts`** (new): the `Idempotency` service and `IdempotencyLive: Layer<Idempotency, never, Db>`, built through `Db.withTransaction`, with time from `Clock`.
  - **`begin`** upserts the (principal, key) row: `ON CONFLICT DO UPDATE ... WHERE expires_at <= now`. That claims an absent or expired key as `in_progress` for 24 hours (New), and leaves a live row alone but locked. The live row is then read in the same transaction and sorted out:
    - another route or body is `IdempotencyKeyReused`;
    - still running is `IdempotencyInProgress`;
    - completed with no stored response is `TokenReplayed`;
    - anything else is a `Replay` of the stored status and response.
  - **`complete`** stores `completed`, the HTTP status, and the response as jsonb. A sensitive response stores SQL NULL. A stored response is always cast to jsonb, so a JSON `null` can't look like a sensitive one.
- **`packages/server/src/platform/rate-limit.ts`** (new): `RateLimit.check(name, key)` and `RateLimitLive`.
  - **Limits:** read from Config as `RATE_LIMIT_<NAME>_PER_MINUTE`, with the plan's defaults: `sign-in-email` 5, `sign-in-ip` 5, `device-login` 5, `webhook` 60.
  - **Window:** a fixed one-minute window per (name, key), on the Clock's minute. Only the current minute's counts are kept in memory.
  - **Over the limit:** `TooManyRequests` with `retryAfterMs`, the time left in the window.

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B8-01: the defect log has the request ID and the pg code, with no params or value; the 500 has no database text | `db.ts` `withoutValues`, used by `withTransaction`'s `catchDefect` |
| T-B8-02: the connect gives up within the connect timeout, and an interruption ends a pending connect | `db.ts` pool `connectionTimeoutMillis` and `checkOut` (built; the locked test is disputed) |
| T-B8-03: a statement past the timeout is a defect, and the client is released | `db.ts` pool `statement_timeout` and `checkIn` (rollback, then release) |
| T-B8-04: a backend killed mid-transaction is a defect, the process stays up, and the next transaction commits | `db.ts` `checkOut`'s held-client listener and `checkIn`'s destroy |
| T-B8-05: a non-English lc_messages fails the build | `db.ts` boot check, `isEnglish` |
| T-B8-06 and 07: New, Replay, reused, in progress, principal isolation, sensitive responses and TokenReplayed, 24 hour expiry by the Clock | `idempotency.ts`, `errors.ts` |
| T-B8-08: the 6th call is 429, keys and names are separate, the next window passes | `rate-limit.ts`, `errors.ts` |
| AGENTS.md, Writing Effect rules 4 to 6: Clock for time, a timeout on the database call, the pool client in a scope | `idempotency.ts`, `rate-limit.ts`, `db.ts` |

## Deviations

1. **T-B8-02 doesn't pass.** That's the dispute above, ruled by Axis. No test was changed.
2. **`RateLimitLive`'s error type is `never`, not the `ConfigError` the `support.ts` seam names.** The locked 429 test provides `RateLimitLive` straight into an `effectHandler` program, whose failures must all be `MappedError`. With `ConfigError` in the layer, `rate-limit.test.ts:58` doesn't compile. So a limit setting that isn't an integer is a defect at boot (`Effect.orDie`). `Layer<RateLimit, never>` still fits anywhere a `Layer<RateLimit, ConfigError>` is expected.
3. **The defect keeps the pg code and the query text, not pg's message,** per Axis's ruling (Messages received, item 1). The task doc allowed either.
4. **The rate-limit window is aligned to the Clock's minute** rather than starting at the first call. The test allows either, and it bounds memory to one minute of keys.

## Limitations

- **The runtime connect path has no locked test yet,** because T-B8-02 builds the layer against the black hole. I checked it with a throwaway test, never committed and deleted after the run. A TCP proxy forwarded the boot connection to the real Postgres, then cut it and black-holed every later connect. Both cases passed:
  - a 400 ms connect timeout ended `withTransaction` as a defect;
  - with a 20 s timeout, interrupting the fiber during the pending connect ended it in well under 3 s.

  Rigg's fixed T-B8-02 is the record.
- **`.env.example` doesn't list the new settings:** `DATABASE_CONNECT_TIMEOUT_MS`, `DATABASE_STATEMENT_TIMEOUT_MS` and the four `RATE_LIMIT_*_PER_MINUTE`. `.env*` is outside my territory (my read of it was also denied), so the lead may want them added.
- **One file on the reading list doesn't exist:** `docs/agent-dispatch/backend/sprint-02/findings/t-b3-rigg-01.md` (item 10). There is no `findings/` folder in sprint-02. I worked from the task doc's summary of it: a DrizzleQueryError's message is the query and its params.
- **Neither service is wired into a route.** The idempotency store goes in with T-B10 and T-B11, and the rate limiter with T-B9 and T-B10, as the task doc says.
- **A non-English lc_messages is a defect at boot,** whatever text the error carries. Whether `main.ts` reports it well isn't tested here, because `main.ts` is T-B10's file.

## Messages received

1. **From OSA, relaying Axis (lead):** build to the seams in `support.ts`. Re-raise defects with the pg code, the query text without params, and the table, column and constraint, but not pg's message. Don't touch `effect-handler.ts`, since `body.message` moved to T-B9. The connect timeout from `DATABASE_CONNECT_TIMEOUT_MS`, with a pending connect that ends on interruption, and the statement timeout from `DATABASE_STATEMENT_TIMEOUT_MS` as Postgres's `statement_timeout`. A held-client error listener, removed on release. No schema change for idempotency: a sensitive response stores null and its replay is TokenReplayed. Rate limits from Config with the stated defaults, wired into no route.
   **Followed.** This narrowed the task doc and widened nothing. There's one divergence from the seams: `RateLimitLive`'s error type (Deviation 2), forced by the locked test's types.
2. **From OSA, relaying Axis's ruling on my question** about T-B8-02 against T-B8-05: build the boot check as the note says, through one pool connection under the same connect timeout and with no new timeout. Build the runtime path in full. Finish T-B8-01, 03 to 08 and the checks. End `test-dispute` on T-B8-02 only, and change no test.
   **Followed.**
