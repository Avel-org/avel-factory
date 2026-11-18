status: done
ticket: T-B8

All eight tasks pass on `43c5cc6`: T-B8-01 to T-B8-08. CI's commands are green.

This is attempt a2. It changed no code: the a1 build (`dd4b38e`, `9f82ebd`, `3c9d6cc`) stands, as Axis ruled.

**a1's dispute is resolved.** a1 ended `test-dispute` on T-B8-02 alone. T-B8-02 built DbLive against a socket that never answers, so the lc_messages boot check (T-B8-05) failed the build before `withTransaction` could run.
- Axis ruled that the boot check stays.
- Rigg fixed the test under F2 (`7734ab3`). It now builds DbLive through a proxy to the real Postgres, then makes the proxy hang every new connect.
- Axis relocked it (`43c5cc6`).

The runtime connect path a1 built passes the fixed test with no change.

## Pre-flight

The Postgres came from `scripts/pg-local.sh start`. The worktree was fresh, so I first ran `pnpm install --frozen-lockfile`. It added no dependency and left `pnpm-lock.yaml` unchanged.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. 2 warnings, both already there and outside this ticket: `apps/web/e2e/control-room-budget/budget.spec.ts` 73 and 89, `useDomNodeTextContent` |
| `pnpm test` | exit 0: 971 passed in 55 files |
| `pnpm --filter @avel/server test` | exit 0: 54 passed in 17 files |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors. 6 warnings and 2 messages, all in test files: 3 in the locked `idempotency.test.ts`, 3 in the locked `rate-limit.test.ts` and 2 in `test/db/errors.test.ts`. None are in `src`. |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0: 971 passed in 55 files |

Per task (`vitest run test/platform-hardening`: 10 passed):

| Task | Test | Result |
| --- | --- | --- |
| T-B8-01 | `defect-log.test.ts` | pass |
| T-B8-02 | `pool-timeouts.test.ts`, "Postgres that stops answering after the layer is built" (the F2 version) | pass |
| T-B8-03 | `pool-timeouts.test.ts`, "a statement past the statement timeout" (11 runs) | pass |
| T-B8-04 | `backend-death.test.ts` | pass |
| T-B8-05 | `lc-messages.test.ts` | pass |
| T-B8-06 | `idempotency.test.ts`: begin and complete, and the 409 over HTTP | pass |
| T-B8-07 | `idempotency.test.ts`: sensitive responses and expiry | pass |
| T-B8-08 | `rate-limit.test.ts`: the window, and the 429 over HTTP | pass |

No locked test and no lock line changed: `git diff 43c5cc6` is empty for `packages/server/test/platform-hardening/**` and for `locks.md`.

## What changed

All the code is from a1's three commits after the lock (`368b458`), each with `Refs: T-B8`. a2 adds only this report.

- **`packages/server/src/platform/db/db.ts`**
  - **Safe defects:** an unmapped database defect never leaves the service as a DrizzleQueryError or a pg error. `withoutValues` re-raises it as an `Error` holding only:
    - the pg code;
    - the table, column and constraint, when pg gives them;
    - the query text with its placeholders, never the params.

    Neither pg's message nor its detail is used, because both can quote a bound value or the failing row.
  - **Pool timeouts:** both settings are read with `Config.Int`.
    - `DATABASE_CONNECT_TIMEOUT_MS` (default 5000) becomes the pool's `connectionTimeoutMillis`.
    - `DATABASE_STATEMENT_TIMEOUT_MS` (default 30000) becomes Postgres's `statement_timeout` on every connection.
  - **`checkOut`:** replaces the `acquireRelease` around `pool.connect()`, which couldn't be interrupted.
    - The finalizer is registered first, and the connect is an `Effect.callback`, so an interruption ends the wait at once.
    - A client that arrives after the interruption is destroyed (`release(true)`), never leaked.
    - While the client is held it carries its own `error` listener, because pg-pool takes its listener off checked-out clients (t-b4-rigg-05). A backend that dies marks the client broken instead of ending the process, and its next query fails as a defect.
  - **`checkIn`:**
    - A broken client is destroyed without a rollback.
    - After a failure, a defect or an interruption, the client is rolled back, then returned. If the rollback fails, it is destroyed instead. This is also what leaves a client clean after a statement timeout.
    - The listener comes off just before the client goes back to the pool.
  - **Boot check:** the build takes one connection through `checkOut`, runs `show lc_messages` and gives the connection back. Unless the value is C, POSIX or en*, the build dies with a message naming `lc_messages`.
- **`packages/server/src/platform/errors.ts`:** adds `IdempotencyKeyReused`, `IdempotencyInProgress`, `TokenReplayed` and `TooManyRequests` (details `{ retryAfterMs }`), each with its `errorTable` row. Each message is errorMap's text.
- **`packages/server/src/platform/idempotency.ts`** (new): the `Idempotency` service and `IdempotencyLive: Layer<Idempotency, never, Db>`. It runs through `Db.withTransaction` and takes time from `Clock`.
  - **`begin`** upserts the (principal, key) row with `ON CONFLICT DO UPDATE ... WHERE expires_at <= now`.
    - An absent or expired key is claimed as `in_progress` for 24 hours: New.
    - A live row is left alone but locked, then read in the same transaction:
      - another route or body is `IdempotencyKeyReused`;
      - a request still running is `IdempotencyInProgress`;
      - a completed row with no stored response is `TokenReplayed`;
      - anything else is a `Replay` of the stored status and response.
  - **`complete`** stores `completed`, the HTTP status and the response as jsonb. A sensitive response stores SQL NULL. A stored response is always cast to jsonb, so a JSON `null` can't pass for a sensitive one.
- **`packages/server/src/platform/rate-limit.ts`** (new): `RateLimit.check(name, key)` and `RateLimitLive`.
  - **Limits:** read from Config as `RATE_LIMIT_<NAME>_PER_MINUTE`, with the plan's defaults: `sign-in-email` 5, `sign-in-ip` 5, `device-login` 5, `webhook` 60.
  - **Window:** a fixed one-minute window per (name, key), on the Clock's minute. Only the current minute's counts are kept in memory.
  - **Over the limit:** `TooManyRequests`, with `retryAfterMs` set to the time left in the window.
- **`docs/agent-dispatch/backend/sprint-03/agent-soap-t-b8-build-completion.md`:** this report. It replaces a1's `test-dispute` report.

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B8-01: the defect log has the request ID and the pg code, with no params or value; the 500 has no database text | `db.ts` `withoutValues`, used by `withTransaction`'s `catchDefect` |
| T-B8-02: once built, a connect that hangs gives up within the connect timeout, and an interruption ends a pending connect | `db.ts`: the pool's `connectionTimeoutMillis`, and `checkOut`'s interruptible callback |
| T-B8-03: a statement past the timeout is a defect, and the client is released | `db.ts`: the pool's `statement_timeout`, and `checkIn` (rollback, then release) |
| T-B8-04: a backend killed mid-transaction is a defect, the process stays up, and the next transaction commits | `db.ts`: `checkOut`'s held-client listener, and `checkIn`'s destroy |
| T-B8-05: a non-English lc_messages fails the build | `db.ts`: the boot check, `isEnglish` |
| T-B8-06 and T-B8-07: New, Replay, reused, in progress, principal isolation, sensitive responses and TokenReplayed, 24-hour expiry by the Clock | `idempotency.ts`, `errors.ts` |
| T-B8-08: the 6th call is 429, keys and names are separate, the next window passes | `rate-limit.ts`, `errors.ts` |
| AGENTS.md, Writing Effect rules 4 to 6: Clock for time, a timeout on the database call, the pool client in a scope | `idempotency.ts`, `rate-limit.ts`, `db.ts` |

## Deviations

1. **`RateLimitLive`'s error type is `never`, not the `ConfigError` that `support.ts` names.** Axis accepted this (Messages received).
   - **Why:** the locked 429 test provides `RateLimitLive` straight into an `effectHandler` program, and every failure there must be a `MappedError`. With `ConfigError` in the layer, `rate-limit.test.ts:58` doesn't compile.
   - **Effect:** a limit setting that isn't an integer is a defect at boot (`Effect.orDie`). `Layer<RateLimit, never>` still fits anywhere a `Layer<RateLimit, ConfigError>` is expected.
2. **The defect keeps the pg code and the query text, not pg's message.** This follows Axis's a1 ruling. The task doc allowed either.
3. **The rate-limit window is aligned to the Clock's minute,** not started at the first call. The test allows either, and the aligned window bounds memory to one minute of keys.
4. **a2 ran `pnpm install --frozen-lockfile`** before the checks, because the worktree had no `node_modules`. No file changed.

## Limitations

- **`.env.example` doesn't list the new settings:** `DATABASE_CONNECT_TIMEOUT_MS`, `DATABASE_STATEMENT_TIMEOUT_MS` and the four `RATE_LIMIT_*_PER_MINUTE`. `.env*` is outside my territory, so the lead may want them added.
- **One file on the reading list doesn't exist:** `docs/agent-dispatch/backend/sprint-02/findings/t-b3-rigg-01.md` (item 10). There is no `findings/` folder in sprint-02. I worked from the task doc's summary: a DrizzleQueryError's message is the query and its params.
- **Neither service is wired into a route.** The idempotency store goes in with T-B10 and T-B11, and the rate limiter with T-B9 and T-B10, as the task doc says.
- **A non-English lc_messages is a defect at boot.** Whether `main.ts` reports it well isn't tested here, because `main.ts` belongs to T-B10.

## Messages received

1. **From OSA, relaying Axis (lead), a2:**
   - The a1 build stands. T-B8-02 was rewritten under F2 and relocked at `43c5cc6`.
   - Change no code unless a verify command fails; if one does, fix it inside the territory and say so.
   - Run the verify commands on the tip, and write the report with status `done`.
   - Note that a1's test-dispute was resolved by Axis's ruling and Rigg's F2 fix, and that Axis accepted `RateLimitLive`'s `never` error type.
   - Don't touch `locks.md` or any test.

   **Followed.** Every command passed, so no code changed. The instruction narrowed the task doc and widened nothing.
2. **a1's two instructions** (Axis's build seams, and the ruling on T-B8-02 against T-B8-05) are recorded in a1's report at `18054a6`. Both were followed then, and the ruling is now carried out by the F2 fix.
