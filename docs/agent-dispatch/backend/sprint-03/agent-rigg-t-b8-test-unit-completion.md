status: needs-cr
ticket: T-B8

All eight behaviours have a test and every one fails on the start commit (`01066e4`) for the right reason. One assertion in T-B8-01 can't be built inside T-B8's territory, so the lead has to rule on it before the lock (see Deviations, item 1). Nothing was loosened.

## Pre-flight

Run on the start commit plus my tests. The new tests fail, so the failures below are expected.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 1: only `idempotency.test.ts` and `rate-limit.test.ts` fail. `idempotency.ts` and `rate-limit.ts` don't exist yet (TS2307), and the other errors are `unknown` types cascading from that. Every other file typechecks clean. |
| `pnpm lint` | exit 0 (2 existing warnings) |
| `pnpm test` | exit 1: 7 failed, 960 passed. The 7 are my tests (T-B8-01 has two). Before my tests: 44 passed in the server. |
| `pnpm --filter @avel/server test` | exit 1: the same 7 failures |
| `pnpm --filter @avel/server typecheck` | exit 1: the same two files as above |
| `pnpm --filter @avel/server check:effect` | exit 1: two `missingEffectContext` errors in `idempotency.test.ts`, from the missing import. The 5 warnings are older. |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | stops at typecheck, exit 1, as above |

`pnpm build` has to run before the server tests: `@avel/contract` has no `dist` until it does. No `.skip`, `.only` or `todo` anywhere.

## Failing first

From `pnpm --filter @avel/server exec vitest run test/platform-hardening`:

```
 × T-B8-04 ends as a defect, the process stays up, and the next withTransaction commits
     AssertionError: expected [ …(1) ] to deeply equal []        (backend-death.test.ts:77, an uncaughtException from the dead client)
 × T-B8-01 logs the requestId and the pg code, never 'params:' or the value; answers 500 with no database text
     AssertionError: expected 0 to be greater than or equal to 1  (defect-log.test.ts:60, no log line holds code 23502)
 × T-B8-01 the 500's message is the contract's text (t-b3-rigg-03)
     AssertionError: expected 'Internal server error' to be 'Something went wrong'
 × T-B8-05 fails to build when lc_messages isn't C, POSIX or en*, and the failure names lc_messages
     AssertionError: expected false to be true                    (the layer builds against lc_messages = de_DE.UTF-8)
 × T-B8-02 withTransaction fails as a defect within the connect timeout, and an interruption ends it
     AssertionError: withTransaction hung past the guard: expected 'hung' not to be 'hung'
 × T-B8-03 ends as a defect and the pool client is released (11 runs, more than the pool holds)
     AssertionError: expected [ false, false, … ] to deeply equal [ true, true, … ]   (pg_sleep(1) is never cut off)
 FAIL idempotency.test.ts  Error: Cannot find module '../../src/platform/idempotency.ts'   (T-B8-06, T-B8-07)
 FAIL rate-limit.test.ts   Error: Cannot find module '../../src/platform/rate-limit.ts'    (T-B8-08, plus its 429 test)
```

## What changed

All in `packages/server/test/platform-hardening/`:

- `support.ts`: the harness. It names the seams (below) and has `dbLayer(url, env)`, which feeds the settings through `ConfigProvider.fromEnvRecord`, and `hasDie`.
- `defect-log.test.ts`: T-B8-01. A NOT NULL violation (23502) stays a defect. The first test checks the log and the 500; the second checks the message text.
- `pool-timeouts.test.ts`: T-B8-02 and T-B8-03.
- `backend-death.test.ts`: T-B8-04.
- `lc-messages.test.ts`: T-B8-05.
- `idempotency.test.ts`: T-B8-06 (plus the 409 over HTTP) and T-B8-07.
- `rate-limit.test.ts`: T-B8-08 (plus the 429 over HTTP).

## Contract to files

| Requirement | Test |
| --- | --- |
| T-B8-01: the defect log has the requestId and the pg code, with no params or bound value; 500 has no database text; the message is the contract's | `defect-log.test.ts` |
| T-B8-02: an unanswered connect ends as a defect within the timeout; interruption ends a pending connect | `pool-timeouts.test.ts` |
| T-B8-03: a statement past the timeout is a defect and the client is released (11 runs, more than the pool's 10; none left idle in a transaction; the next transaction commits) | `pool-timeouts.test.ts` |
| T-B8-04: a killed backend is a defect, no uncaught exception, and the next transaction commits | `backend-death.test.ts` |
| T-B8-05: a non-English lc_messages fails the build and names lc_messages; `C`, `POSIX` and `en_GB.UTF-8` build | `lc-messages.test.ts` |
| T-B8-06, T-B8-07: the idempotency behaviours, plus the 24 hour expiry on `expires_at` | `idempotency.test.ts` |
| T-B8-08: the 6th call, key isolation, the next window, `retryAfterMs` | `rate-limit.test.ts` |

## Seams for the lead to confirm before the lock

These are names and shapes I chose, because the task doc doesn't fix them. Also in `support.ts`.

- `DbLive` reads `DATABASE_CONNECT_TIMEOUT_MS` (default 5000) and `DATABASE_STATEMENT_TIMEOUT_MS` (default 30000) as strings through Config. A bad `lc_messages` makes the build die with a message naming `lc_messages`.
- `src/platform/errors.ts` gets `IdempotencyKeyReused`, `IdempotencyInProgress`, `TokenReplayed` and `TooManyRequests`, with table rows `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENCY_IN_PROGRESS`, `TOKEN_REPLAYED` and `TOO_MANY_REQUESTS`. `TooManyRequests.details` is `{ retryAfterMs }`, because the contract's 429 data requires it.
- `src/platform/idempotency.ts` exports `Idempotency`, an Effect service with `begin(principal, key, route, bodySha256)` and `complete(principal, key, status, response, { sensitive })`. `begin` returns `{ _tag: "New" }` or `{ _tag: "Replay", status, response }`. `IdempotencyLive` is `Layer<Idempotency, never, Db>`. Both methods have no requirements.
- `src/platform/rate-limit.ts` exports `RateLimit` with `check(name, key): Effect<void, TooManyRequests>`, and `RateLimitLive`, which reads Config. A window is one minute. `retryAfterMs` is what is left of it, so the 6th call 10 s into a window gives 50000. The tests start the clock on a whole minute so a window that starts at the first call and an aligned one agree. Names with defaults: `"device-login"` 5 and `"webhook"` 60. T-B9's names `sign-in-email` and `sign-in-ip` are my guess. The test only uses `"sign-in-ip"` as another name that must be a separate window.

## Deviations

1. **T-B8-01 can't be fully built inside T-B8's territory.** The task wants `body.message` to equal errorMap's text, which is "Something went wrong". Today `effect-handler.ts` hardcodes `"Internal server error"` in the ORPCError, and app.ts copies it into the body. T-B8's notes say effect-handler.ts doesn't change, and it is in my "never change" list and Soap's `must_not_change`. I wrote the assertion as its own test (`the 500's message is the contract's text`) so the rest of T-B8-01 stays independent. **The lead needs to either let T-B8 change that one string in `effect-handler.ts`** (T-B9 owns the file later and builds after T-B8, so there's no clash), **or drop the assertion with a change request.** I did not loosen it. That is why the status is `needs-cr`.
2. **T-B8-02 uses a socket that accepts and never answers, not a closed port.** A closed port is refused at once, which fails as a defect today, so the test would pass before the build (B2). The black-hole socket hangs today and the timeout test has to catch it. The test also covers interruption of a pending connect.
3. The pool tests use the real clock, with a 4 s guard around real sockets. Everything with time in it (idempotency, rate limit) uses TestClock.
4. T-B8-04 detects "the process stays up" by listening for `uncaughtException` in the test and asserting none arrives, since vitest would otherwise only report an unhandled error.
5. E13's four per route doesn't apply: T-B8 adds no routes. I covered the error body with `requestId` over HTTP for 429 and IDEMPOTENCY_KEY_REUSED and for the defect 500. The happy path, replay and stale `rowVersion` are in T-B10 and T-B11.

## Limitations

- The pool tests wait on real sockets. They finish well inside the 60 s limit, but T-B8-03 takes about 12 s on the start commit.
- `lc_messages` is set to a locale the container may not have. Postgres on alpine accepts any name, so the test only reads the setting. It couldn't be run against a Postgres that rejects unknown locales.
- Whether the connect timeout in `DbLive` can also cover the `withTransaction` path through `Effect.timeout`, which a TestClock suite would never fire, is left to the build.
- `check:effect` can't be clean until the missing modules exist.

## Lock line

- T-B8: packages/server/test/platform-hardening/support.ts, packages/server/test/platform-hardening/defect-log.test.ts, packages/server/test/platform-hardening/pool-timeouts.test.ts, packages/server/test/platform-hardening/backend-death.test.ts, packages/server/test/platform-hardening/lc-messages.test.ts, packages/server/test/platform-hardening/idempotency.test.ts, packages/server/test/platform-hardening/rate-limit.test.ts @ <branch tip>

## Messages received

None.
