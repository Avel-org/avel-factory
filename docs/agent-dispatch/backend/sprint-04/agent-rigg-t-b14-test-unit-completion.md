status: done
ticket: T-B14

# T-B14 tests: completion report (Rigg)

Branch `t/B14-clients-routes`, start commit `b20bf58`. Nothing pushed.

## Pre-flight

Run with a local Postgres (`scripts/pg-local.sh start`). I ran `pnpm test` after writing the tests, not before, so the starting state is read from the run's own count: the 25 existing server test files pass (65 tests, 1 skipped, the quarantined T-B8-02 test) and only my 7 new files fail.

| Command | Result |
| --- | --- |
| `pnpm build` | passes (contract, db built) |
| `pnpm typecheck` | **fails**: `test/clients/support.ts(25,28): TS2307 Cannot find module '../../src/platform/router.ts'` (the missing seam, expected before the build) |
| `pnpm lint` | passes (2 existing warnings, in web) |
| `pnpm test` / `pnpm --filter @avel/server test` | **fails**: 7 files fail (the new ones), 25 pass |
| `pnpm --filter @avel/server typecheck` | fails, same TS2307 |
| `pnpm --filter @avel/server check:effect` | 0 errors, 6 warnings (existing style) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | stops at typecheck, same error |

## Failing first

All seven files fail on the start commit:

```
FAIL  test/clients/{activity,dto,list,not-found,replay,unauthenticated,update}.test.ts
Error: Cannot find module '../../src/platform/router.ts' imported from .../test/clients/support.ts
Test Files  7 failed | 25 passed (32)
Tests       65 passed | 1 skipped (66)
```

Honest limit (B2): the reason is the missing `makeRouter` seam, so every file fails at import. The assertions behind it have never run, because I may not write product code (not even a stub). They are checked by reading only. The lead should treat the first green run after the build as the real proof, and expect small corrections to be disputes (`test-dispute`), not silent edits.

## What changed

All new, under `packages/server/test/clients/`:

- `support.ts`: the harness. It names the seam, builds the real app (`createApp({ router: makeRouter({ databaseUrl }), auth })`), signs the seeded operator in through Better Auth, and has request/error/SQL helpers. Reuses `test/auth/support.ts` and `test/db/support/database.ts` (read only).
- `dto.test.ts` (T-B14-01): route 9 output keys equal `ClientDto`'s exactly and parse against it; route 10 returns the same object. Includes the 201 status, `X-Request-Id`, `X-Contract-Version`.
- `replay.test.ts` (T-B14-02): same key and body returns the first answer and makes one client; another body is 409 `IDEMPOTENCY_KEY_REUSED`; a duplicate while the first runs is 409 `IDEMPOTENCY_IN_PROGRESS`. The in-progress case is deterministic: a second connection holds `lock table clients`, the test waits (`vi.waitFor` on the `idempotency_keys` row, no sleep), sends the duplicate, then releases and checks the first finished with one client.
- `not-found.test.ts` (T-B14-03): routes 10 and 11 give 404 `NOT_FOUND` with the request's own `X-Request-Id` as `requestId`.
- `update.test.ts` (T-B14-04): edit bumps `rowVersion`; archive and restore keep `archivedAt` in step; stale `rowVersion` is 409 `STALE_VERSION` with `{ field: "rowVersion", currentVersion }`; route 11 replay and key reuse; a CHECK refusal is 422 `CONSTRAINT_VIOLATION` naming the constraint, rolled back.
- `list.test.ts` (T-B14-05): cursor paging of route 8; internal client hidden by default and listed alone with `?kind=internal`; route 9 with `kind: "internal"` is refused (4xx, no second internal row, no activity).
- `unauthenticated.test.ts` (T-B14-06): routes 8 to 11 with no cookie and with a bad cookie are 401 `UNAUTHORIZED`, ErrorBody with `requestId`, nothing written.
- `activity.test.ts` (T-B14-07): create and edit each leave exactly one `activity_log` row (`actor_kind` user, `user_id` the operator, an action that differs between create and edit, a target containing the client id); replays and reads leave none; refused writes (stale, unknown, invalid, unauthenticated) leave none.

## Contract to files

- Step 1 test 2: dto. Test 4: replay (and the replay case in update). Test 3: not-found. Test 6: update. Test 13: activity. CR-13 and CR-W22: list. E13's four per route: happy path with DTO (dto, update, list), error body with `requestId` (not-found, unauthenticated, update), replay (replay, update), stale `rowVersion` (update).

## Deviations

- **The seam is mine to name.** Part 3 says `platform/router.ts` composes the routers, but not its shape. `createApp`'s `layer` is `Layer<Ids>` and `app.ts` may not change, so the router must carry its own Db, Idempotency and audit layers. I assumed `makeRouter({ databaseUrl })`. If Axis wants another shape, only `support.ts` changes (a lock-relevant edit; ask before the lock).
- **The CHECK test adds a constraint.** No contract-valid route 11 input breaks a shipped CHECK (`clients_archived_at_ck` is set by the build; names are trimmed by the contract). So `update.test.ts` adds `clients_test_name_ck` to its own throwaway test database and edits to the refused name. It proves the route lets the database refuse and maps it to 422, which is the rule (AGENTS.md: never only a duplicated CHECK). It does not touch `packages/db`.
- **No TestClock.** Nothing here depends on time passing, so none is used; keys and ids come from the server and throwaway values from `randomUUID`.
- **Internal-client refusal is not pinned to one code.** The docs say route 9 can't create one but not which error. The test requires a 4xx ErrorBody with no row and no activity. If Axis rules on a code (422 `UNPROCESSABLE_CONTENT` seems likeliest), tighten it before the lock.
- **Action names are not pinned**: only that they are non-empty and that create differs from edit; the target only has to contain the client id. Not specified anywhere in the docs.
- **Fixed assumptions to confirm:** create is 201 (contract `route()`); invalid body (blank name) is 400.

## Limitations

- Assertions are unrun (see Failing first). Real Postgres is used throughout, so they should run as is once `makeRouter` exists.
- The in-progress test relies on the build claiming the idempotency key before its insert into `clients`, and on `clients` being written in the same request; an order the lead may want to confirm.
- Rate limits, `Idempotency-Key` missing on a write, and the audit module's own function signature are not tested (not in the task list).
- No migration or doc drift check was needed (no schema touched).

## Lock line

- T-B14: packages/server/test/clients/support.ts, packages/server/test/clients/dto.test.ts, packages/server/test/clients/replay.test.ts, packages/server/test/clients/not-found.test.ts, packages/server/test/clients/update.test.ts, packages/server/test/clients/list.test.ts, packages/server/test/clients/unauthenticated.test.ts, packages/server/test/clients/activity.test.ts @ <branch tip>

## Messages received

None.
