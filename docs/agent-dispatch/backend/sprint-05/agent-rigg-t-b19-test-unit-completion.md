status: done
ticket: T-B19

# T-B19 tests · Rigg: completion report

Start commit: `90e0d6c` (main with T-B15, T-B16 and #68 merged). Eight test files under
`packages/server/test/follow-ups/`, one per task, plus `support.ts`.

## Pre-flight
Run on the start commit with my tests added; own Postgres from `scripts/pg-local.sh`.
Before my tests: `pnpm --filter @avel/server test` was 41 files, 100 passed, 1 skipped (after `pnpm build`; the contract must be built first).

| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (6 warnings, none in my files) |
| `pnpm test` | **13 failed**, 1050 passed, 1 skipped: only the new tests fail (by design) |
| `pnpm --filter @avel/server test` | same 13 failures, nothing else |
| `pnpm --filter @avel/server typecheck` | pass |
| `pnpm --filter @avel/server check:effect` | pass (0 errors) |
| `vitest run test/entry/start.test.ts` | pass (1 test) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | fails at `pnpm test`, on the 13 new tests only |

## Failing first
Every task's file fails on the start commit, for the reason the behaviour isn't built:

- **01** (3 failing): the delivery to the running server is `404 … to be less than 300` (not mounted); a missing and an empty `GITHUB_WEBHOOK_SECRET` both start: `the server started without a webhook secret`.
- **02** (3 failing, the 1 MiB control passes): `expected 401 to be 413` for the oversized body, the declared length and the chunked stream (the webhook reads the whole body, then checks the signature).
- **03** (2 failing, 3 controls pass): `a direct push to main raised no alert: expected [] to have a length of 1`; `an unparseable merge raised no alert`.
- **04**: body is `{"code":"FAILED_TO_GET_SESSION","message":"Failed to get session"}`, not the contract's 500 with `requestId`.
- **05**: after `close()`, `expected 1 to be +0`: the router's pool is still open in `pg_stat_activity`.
- **06**: `the key is still held by the write that died: expected 409 to be 201`.
- **07**: `expected 409 to be 422` (the seed's row hits the unique index; without it, a second internal client is made).
- **08**: `no tag in errorTable maps to UNAUTHORIZED: expected 0 to be greater than 0`. The second test (wire answers unchanged) **passes by design**: the task says those answers must not change.

## What changed
- `test/follow-ups/support.ts`: the seams, `webhookEnv`, HTTP helpers (login, signed delivery, `expectErrorBody`).
- `01-webhook-mounted.test.ts` … `08-error-table.test.ts`: T-B19-01 to 08.
- This report. No product file, no locked test, no `.env*`.

## Contract to files
| Task | File | Ref |
| --- | --- | --- |
| 01 | 01-webhook-mounted | t-b15-rigg-03 |
| 02 | 02-webhook-body-limit | t-b15-rigg-01 |
| 03 | 03-webhook-alerts | t-b15-rigg-02 |
| 04 | 04-get-session-failure | t-b16-rigg-02 |
| 05 | 05-close-releases-pools | t-b16-rigg-03 |
| 06 | 06-defect-releases-key | t-b14-rigg-02 |
| 07 | 07-internal-client-guard | t-b14-rigg-03 |
| 08 | 08-error-table | t-b14-rigg-01 |

Real Postgres throughout; the TestClock drives 03 (the app's clock). 01, 04–08 run `startServer` over real HTTP, so they use the live clock; none sleeps. 05 times `close()` with `performance.now()` (the 2 s budget is wall time by its nature).

## Deviations
- E13's four per route don't all apply: the webhook has no rowVersion (as in T-B15's tests); 01–08 are follow-ups on existing routes whose four are locked in T-B14's tests.
- T-B19-08 can't name the new tags (the brief doesn't), so it checks that `errorTable` has rows for `UNAUTHORIZED` and `BAD_REQUEST` with the contract's statuses, plus the unchanged wire.

## Limitations, and what Axis must confirm before the lock
1. **Variable names (support.ts, one place).** The brief fixes only `GITHUB_WEBHOOK_SECRET`. I assumed `FACTORY_REPO`, `FACTORY_APP_LOGIN`, `FACTORY_MIRROR_PATH`. The build must use these, or the harness changes before the lock.
2. **start.test.ts conflict.** `test/entry/start.test.ts` (read only, must keep passing) spawns `main.ts` with no `GITHUB_WEBHOOK_SECRET`. Once startup refuses a missing secret, it fails unless the process env has one. This needs Axis's ruling (a CR or an unlock of that test); I did not touch it.
3. **413 code.** The contract's catalog has no generic 413 row. Test 02 pins status 413 and the ErrorBody shape, not the code; the build may need a CR for a code.
4. **Limit.** Tests assume GitHub's documented 25 MiB cap: over 25 MiB is 413, 1 MiB is accepted; a chunked stream may be read at most 25 MiB + 8 MiB.
5. **Push alert.** "Not the App's merge" is read as: a push to `refs/heads/main` of the factory repo whose sender isn't the App raises one alert (its SHA is carried in the payload and refused by the loader); an App push after its own merged PR raises none. The alert's kind and key aren't pinned beyond `payload.alert` containing the SHA. An unparseable merge alert is pinned only to one alert and a delivery row.
6. Not tested: the router and webhook honouring the timeouts from `env` rather than `process.env` (T-B17 owns `pool-timeouts.test.ts`); SIGTERM end to end (05 tests `close()`).
7. Tests 02 and 03 use `createApp`'s `webhook` option (T-B15's seam); only 01, 04–08 go through `startServer`.

## Lock line
- T-B19: packages/server/test/follow-ups/support.ts, packages/server/test/follow-ups/01-webhook-mounted.test.ts, packages/server/test/follow-ups/02-webhook-body-limit.test.ts, packages/server/test/follow-ups/03-webhook-alerts.test.ts, packages/server/test/follow-ups/04-get-session-failure.test.ts, packages/server/test/follow-ups/05-close-releases-pools.test.ts, packages/server/test/follow-ups/06-defect-releases-key.test.ts, packages/server/test/follow-ups/07-internal-client-guard.test.ts, packages/server/test/follow-ups/08-error-table.test.ts @ <branch tip>

## Messages received
None.
