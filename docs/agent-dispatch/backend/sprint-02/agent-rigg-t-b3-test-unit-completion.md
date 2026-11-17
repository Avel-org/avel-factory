status: blocked
ticket: T-B3

# T-B3 tests: completion report (Rigg)

## Pre-flight
Start commit `5c135fe`. Run with `DATABASE_URL` from `scripts/pg-local.sh start`; node 24.22.2 from nvm (the shell's `pnpm` shim had no node on PATH).

| Command | Result |
| --- | --- |
| baseline `pnpm test` (before any change) | 41 files, 923 tests passed |
| `pnpm build` | pass |
| `pnpm typecheck` | **fails, expected**: 8 errors in `test/db/errors.test.ts` (TS2307 `src/platform/db/errors.ts` missing; TS2339 `AlreadyExists`, `ConstraintViolation`, `DeleteRefused`, `StaleVersion` missing from `src/platform/errors.ts`; two follow-on TS18046). They go away when the build adds the seams. |
| `pnpm lint` | pass (223 files) |
| `pnpm test` | 11 failed (all T-B3), 923 passed |
| `pnpm --filter @avel/server test` | 1 file failed, 4 passed; 11 failed, 13 passed |
| `pnpm --filter @avel/server typecheck` | fails, same 8 errors |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | stops at typecheck, same reason |

## Failing first
`pnpm exec vitest run test/db` in `packages/server` on the start commit: 11 of 11 fail.
Every test fails with `Error: Cannot find module '/src/platform/db/errors.ts'`, the module the build hasn't written. In T-B3-01 the harness part ran first: the database was created and migrated, the unique violation carried code `23505` and constraint `users_email_uq`. Only the last assertion, that `mapDbError` exists, fails.

```
× T-B3-01 makes a migrated database that is its own, and a real violation carries the fields the mapper reads
× T-B3-02 becomes AlreadyExists naming users_email_uq
× T-B3-02 is a 409 ALREADY_EXISTS through effectHandler, with the constraint and the requestId
× T-B3-03 becomes ConstraintViolation naming the CHECK
× T-B3-03 is a 422 CONSTRAINT_VIOLATION through effectHandler, with the requestId
× T-B3-04 a refused delete becomes DeleteRefused, a 409 DELETE_REFUSED
× T-B3-04 a missing parent on insert becomes ConstraintViolation, a 422 CONSTRAINT_VIOLATION
× T-B3-05 becomes StaleVersion with field rowVersion and the current version
× T-B3-05 is a 409 STALE_VERSION through effectHandler, with the requestId
× T-B3-06 is not mapped: mapDbError leaves it for a defect
× T-B3-06 is a 500 through effectHandler that never shows the database's message, and is logged with the requestId
```

## What changed
- `packages/server/test/db/support/database.ts`: T-B3-01's harness, reused by T-B4. `testDatabase(label)` makes one database per file (own name, created through `pg`, migrated by `pnpm --filter @avel/db migrate:up`) and drops it in `afterAll`.
- `packages/server/test/db/errors.test.ts`: tests T-B3-01 to 06 against real Postgres, no mocks, no clock use.

## Contract to files
- 01 harness: `database.ts`, first test.
- 02 unique: users_email_uq, 409 ALREADY_EXISTS.
- 03 CHECK: `jobs_state_ck`, 422 CONSTRAINT_VIOLATION.
- 04 foreign key: `cli_sessions_user_id_users_id_fk` (`on delete restrict`): delete refused is 409 DELETE_REFUSED; insert with a missing user is 422 CONSTRAINT_VIOLATION.
- 05 stale: a real `update ... where row_version = 2` against a row at 3 matches nothing; 409 STALE_VERSION `{ field: "rowVersion", currentVersion: 3 }`; a matching update passes through.
- 06 other: syntax error (`42601`) is not mapped and goes through `effectHandler` as a 500 that hides its text and is logged with the requestId.
- Each route-level check asserts the ErrorBody, `details`, and that `requestId` equals `X-Request-Id`.

**Seams the build must provide (names are mine; the lead confirms before the lock):**
- `src/platform/errors.ts`: tagged errors `AlreadyExists`, `ConstraintViolation`, `DeleteRefused`, `StaleVersion` (`{ message, details }`), each with a row in `errorTable`.
- `src/platform/db/errors.ts`: `mapDbError(error: unknown): AlreadyExists | ConstraintViolation | DeleteRefused | undefined` (undefined means a defect), and `requireUpdated(rows, currentVersion: number): Effect<Row, StaleVersion>`.

## Deviations
- T-B3-01 tests a support file I wrote, so it would pass before the build. I made it fail for the right reason by also requiring `mapDbError` to exist after proving the harness works.
- E13's four don't all apply: T-B3 adds no route, so there's no DTO happy path and no idempotent replay. The error-body and stale-`rowVersion` cases are covered through `effectHandler` on the health route.
- The task doc names no function signatures; the ones above are my choice. `requireUpdated` takes the current version as an argument because a no-row update can't know it.
- Typecheck fails until the build lands (see Pre-flight).

## Limitations
- Drizzle's wrapped errors (`DrizzleQueryError.cause`) aren't tested: T-B4 wires the mapper into Db and should add that case.
- Only one CHECK, one FK and one unique constraint are exercised. An FK refused on update isn't tested.
- No `TestClock`/`Ids` need arose beyond `fixedIds` for the request ID.

## Messages received
None.

## Lock line
- T-B3: packages/server/test/db/errors.test.ts packages/server/test/db/support/database.ts @ c35f386 (the commit that adds the tests; the report-only follow-up changes no test path)

## Re-dispatch: answering Soap's test-dispute (attempt 2)

Status: **blocked**, waiting for Axis's decision. I changed no test.

- Soap's build report (`1680282`) disputes T-B3-05's setup in `packages/server/test/db/errors.test.ts` (`staleUpdate()`, line 214).
- I checked it. `jobs_touch_updated_at` runs `touch_updated_at()`, which sets `NEW.row_version := OLD.row_version + 1` on every update (`packages/db/drizzle/0000_functions.sql`, `0002_hand_written.sql`). So `set row_version = 3` leaves the row at 2, the "stale" update `where row_version = 2` matches it, and the test fails in its own setup. The dispute is correct: the defect is in my test, not the build.
- The test is locked at `fbbc475` (F2, H6), and a `test-dispute` is answered only after Axis decides. No decision reached me, so I did not edit it.
- Proposed fix, for Axis to approve: insert (version 1), run one plain update such as `set last_error = null` (version 2). The stale update `where row_version = 1` matches nothing, so the current version is 2. The control `where row_version = 2` matches and leaves 3. The expected values in the test change to match. On approval I answer it in my own commit and Axis re-locks.

## Messages received
- None beyond the `/dispatch` activation.
