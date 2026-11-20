status: done
ticket: T-B16

# T-B16 tests: completion report (Rigg)

## Pre-flight
Start commit `63b4b8c`. Postgres from `scripts/pg-local.sh`.

| Command | Result |
| --- | --- |
| `pnpm test` before any change, with no `pnpm build` first | 35 files failed: `@avel/db` was not built, so imports failed. That is the environment, not the code |
| `pnpm build`, then `pnpm test` | 72 files passed, 1009 tests passed, 1 skipped (already in `main`) |
| After my tests: `pnpm build` | 0 |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 (2 existing warnings) |
| `pnpm --filter @avel/server typecheck` | 0 |
| `pnpm --filter @avel/server check:effect` | 0 errors, 6 warnings (all existing) |
| `pnpm test` / `pnpm --filter @avel/server test` | 8 tests in the 6 new files fail, as intended. The other 72 files pass |

The final `pnpm build && pnpm typecheck && pnpm lint && pnpm test` chain is red only because of the 8 new tests.

## Failing first
`pnpm --filter @avel/server exec vitest run test/server` on `63b4b8c`. All 8 tests fail with the same error, which is the right reason: `src/server.ts` doesn't exist yet.

```
× T-B16-01 sign-in.test.ts   POST /api/auth/sign-in/email sets a Secure session cookie, and get-session names the operator
× T-B16-02 config.test.ts    a missing AVEL_AUTH_SECRET stops startup, and the error names the variable
× T-B16-02 config.test.ts    a secret of 31 characters stops startup; the error names the variable and not the value
× T-B16-02 config.test.ts    a secret of 32 characters starts
× T-B16-03 rate-limit.test.ts the 6th sign-in in a minute is 429 TOO_MANY_REQUESTS, whatever X-Forwarded-For says
× T-B16-04 database-failure.test.ts answers 500 with the contract's body and requestId, and prints no query params
× T-B16-05 lockout.test.ts   ten wrong passwords are 401 responses; the 11th, with the right one, is 429 TOO_MANY_ATTEMPTS
× T-B16-06 close.test.ts     after close(), no connection from the server's pool is left on the database
Error: Cannot find module '.../packages/server/src/server.ts' imported from .../test/server/support.ts   (x8)
Test Files  6 failed (6)   Tests  8 failed (8)
```

## What changed
All under `packages/server/test/server/`:
- `support.ts`: the harness. It loads `src/server.ts` lazily, so each test fails on its own, and it calls the server over real HTTP on `127.0.0.1`.
- `sign-in.test.ts` (T-B16-01): signs in against an https origin. The cookie is Secure, HttpOnly and SameSite=Lax. `get-session` names the operator.
- `config.test.ts` (T-B16-02): a missing secret and a 31-character secret both fail, and the error names `AVEL_AUTH_SECRET` and never the value. A 32-character secret starts (the boundary).
- `rate-limit.test.ts` (T-B16-03): five sign-ins with different emails and different X-Forwarded-For values are 401, and the 6th is 429 `TOO_MANY_REQUESTS`. After `TestClock` advances 61 s, the window is open again.
- `database-failure.test.ts` (T-B16-04): with `auth_sessions` renamed, sign-in answers 500 `{code, message, requestId}`, and `requestId` equals the `X-Request-Id` header. A log line carries it. Nothing in `console.error`, `console.log`, `process.stderr` or `logLine` contains the password, the email, `params:` or `Failed query`.
- `lockout.test.ts` (T-B16-05): ten wrong passwords are 401 `INVALID_EMAIL_OR_PASSWORD` with no cookie. The 11th, with the right password, is 429 `TOO_MANY_ATTEMPTS` with `X-Retry-After`.
- `close.test.ts` (T-B16-06): `pg_stat_activity` for the test database shows more connections after sign-in than before. After `close()` the count returns to the baseline, and the port stops answering.

## Contract to files
T-B16-01 to 06 map to the six files above, one per task.

**The seam for the lead to confirm before the lock.** The briefing doesn't fix the signature, so I chose:
```
src/server.ts: startServer(env, deps?) -> Promise<{ port: number; close(): Promise<void> }>
  env: a plain record of variable names to values: DATABASE_URL, PORT ("0" = free port), AVEL_AUTH_SECRET, AVEL_WEB_ORIGIN
  deps: { clock?: Clock.Clock; logLine?: (line: string) => void }   (the same seams createApp has)
```
A missing or short `AVEL_AUTH_SECRET` rejects with a message that names the variable.

## Deviations
- The briefing says "startServer(config)" without naming a type. I used the plain env record above. If Axis wants an Effect `ConfigProvider` instead, the lead should say so, and I'll change `support.ts` in a `test-dispute`-free commit before the lock.
- E13's four tests apply to contract routes. `/api/auth/*` is outside the contract, so I wrote the six tests the task doc lists, plus the 31/32-character boundary. No idempotent replay or `rowVersion` test applies to sign-in.

## Limitations
- I couldn't run the tests against a working build, so a flaw in a test that only shows on a correct implementation (for example in the T-B16-04 assertions) can't be ruled out. Soap's run will show it.
- T-B16-04 can't know the real session token, so it checks the password, the email, `params:` and `Failed query` instead. The email and password are bound params of the failing queries.
- T-B16-06 uses `vi.waitFor` (up to 10 s) because Postgres backends exit asynchronously after `pool.end()`. It polls an external system and doesn't sleep on the clock.
- The Secure flag for plain-http origins isn't tested, as the task lists only the https case.

## Lock line
- T-B16: packages/server/test/server/support.ts, packages/server/test/server/sign-in.test.ts, packages/server/test/server/config.test.ts, packages/server/test/server/rate-limit.test.ts, packages/server/test/server/database-failure.test.ts, packages/server/test/server/lockout.test.ts, packages/server/test/server/close.test.ts @ <branch tip>

## Messages received
None.
