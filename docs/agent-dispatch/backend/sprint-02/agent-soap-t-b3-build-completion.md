status: test-dispute
ticket: T-B3

# T-B3 · build · Soap: completion report

Five of the six tasks pass. T-B3-05's first test fails in its own setup, before it calls any build
code, because of the `row_version` trigger in `packages/db`. A locked test can't be changed by the
builder (A3, F2), so I stopped with `test-dispute`. The build code for T-B3-05 is in and its
second test (the 409 through `effectHandler`) passes.

## The dispute (T-B3-05, "becomes StaleVersion with field rowVersion and the current version")

`packages/server/test/db/errors.test.ts`, `staleUpdate()`:

```sql
insert into jobs (kind, key) values ('k', 'stale-1') on conflict do nothing;  -- row_version 1
update jobs set row_version = 3 where key = 'stale-1';                        -- expects 3
update jobs set ... where key = 'stale-1' and row_version = 2 returning id;   -- expects 0 rows
```

`jobs_touch_updated_at` (`packages/db/drizzle/0002_hand_written.sql:67`) runs `touch_updated_at()`
(`0000_functions.sql:28`): `NEW.row_version := OLD.row_version + 1` on every update. So
`set row_version = 3` leaves the row at **2**, the "stale" update `where row_version = 2` matches
the row, and `expect(rows).toHaveLength(0)` fails at line 224. I confirmed this on a freshly
migrated database: row_version is 1 after the insert and 2 after `set row_version = 3`. The
control later in the test (`where row_version = 3`) would also match nothing.

The trigger is the design working as intended (DATABASE.md Q4: row_version moves on every update),
so the test's setup is what's wrong, not the schema or the build.

**A setup that would work with the trigger, for Rigg to decide:** insert (version 1), then one
plain update such as `set last_error = null` (version 2). The stale update `where row_version = 1`
matches nothing, with current version 2: `requireUpdated(rows, 2)`. The control
`where row_version = 2` matches and leaves version 3: `requireUpdated(matched.rows, 3)`.

## Pre-flight

Postgres from `scripts/pg-local.sh start` (postgres:17-alpine). Run after `pnpm build`. Before
the build, the `@avel/docs` suites fail only because they read built output.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 (Biome: 224 files, no fixes) |
| `pnpm test` | exit 1: 41 of 42 files, 933 of 934 tests pass; the one failure is the disputed T-B3-05 test |
| `pnpm --filter @avel/server test` | exit 1: 23 of 24 pass; same single failure |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 1 at `pnpm test` (same failure) |

Per task:
- T-B3-01 harness: pass. The harness (`test/db/support/database.ts`) came with the locked tests;
  the build supplies `mapDbError`.
- T-B3-02 unique → `AlreadyExists`, 409 `ALREADY_EXISTS` `{ constraint: "users_email_uq" }`: pass (2/2).
- T-B3-03 CHECK → `ConstraintViolation`, 422 `{ constraint: "jobs_state_ck" }`: pass (2/2).
- T-B3-04 foreign key: refused delete → `DeleteRefused` 409, missing parent → `ConstraintViolation`
  422, both `{ constraint: "cli_sessions_user_id_users_id_fk" }`: pass (2/2).
- T-B3-05 stale rowVersion: the 409 `STALE_VERSION` through `effectHandler` passes; the mapper
  test fails in its setup (see the dispute above).
- T-B3-06 another database error stays a defect: pass (2/2). It's a 500 that never shows the
  database's text, and the log line carries the request ID.

All six tests failed before the build: `src/platform/db/errors.ts` didn't exist.

## What changed

- `packages/server/src/platform/errors.ts`: four tagged errors, each `{ message, details }`, with
  rows in `errorTable`. `AlreadyExists` maps to `ALREADY_EXISTS`, `ConstraintViolation` to
  `CONSTRAINT_VIOLATION`, `DeleteRefused` to `DELETE_REFUSED` and `StaleVersion` to
  `STALE_VERSION`. The first three carry `{ constraint }`. `StaleVersion` carries the contract's
  `StaleVersionDetails`.
- `packages/server/src/platform/db/errors.ts` (new):
  - `mapDbError(error: unknown)` reads a node-postgres error's `code` and `constraint`. It maps
    23505 to `AlreadyExists` and 23514 to `ConstraintViolation`. For 23503 it returns
    `DeleteRefused` when Postgres reports "update or delete on …" (a referenced row is refused),
    and `ConstraintViolation` otherwise (the parent is missing). Anything else, including a
    non-error or an error with no constraint, gives `undefined`, so the caller keeps it a defect.
  - `requireUpdated(rows, currentVersion)` returns the updated row, or fails with `StaleVersion`
    `{ field: "rowVersion", currentVersion }`.
  - Messages come from the contract's `errorMap`. The database's own message is never passed on.
- This report.

Commits: `6d2a73f` (unique), `6c5e689` (CHECK and foreign key), `60bd568` (stale version), then
this report. All carry `Refs: T-B3`.

## Contract to files

| Requirement | Where |
| --- | --- |
| Step 1 item 3: unique → 409 | `db/errors.ts` 23505, `errors.ts` `AlreadyExists` row |
| Step 1 item 3: CHECK → 422 | `db/errors.ts` 23514, `errors.ts` `ConstraintViolation` row |
| Step 1 item 3: FK refusal 409, missing parent 422 | `db/errors.ts` 23503 branch, `DeleteRefused` row |
| Step 1 item 3: stale rowVersion → 409 | `db/errors.ts` `requireUpdated`, `StaleVersion` row |
| Writing Effect rule 3: one table, others are defects | `errorTable` rows; `mapDbError` returns `undefined` |
| Contract error details (`ConstraintDetails`, `StaleVersionDetails`) | the tagged errors' `details` types |

## Deviations

- None from the task doc's territory: I changed only the two files Part 5 allows, plus this report.
- I stopped with `test-dispute` before T-B3-05 was fully green, as the stop rules require.
- Environment: the `pnpm` first on PATH is a Windows shim with no `node`, so I ran everything with
  `~/.nvm/versions/node/v24.22.2/bin` first on PATH. This touches nothing in the repo.

## Limitations

- Telling a refused delete from a missing parent depends on Postgres's English message prefix:
  23503's code, table, constraint and routine are the same for both. A server with a translated
  `lc_messages` would map a refused delete to 422 instead of 409. Postgres has no
  locale-independent field for this. The local and CI images use the default English messages.
- Nothing calls `mapDbError` or `requireUpdated` yet: T-B4 wires them into the `Db` service.
- I couldn't message OSA from this session: no messaging tool was available. This report and my
  final reply carry the status.

## Messages received

- None beyond the `/dispatch` activation for this task doc.
