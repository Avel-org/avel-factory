status: done
ticket: T-B3

# T-B3 · build · Soap: completion report (attempt 3)

All eleven locked T-B3 tests pass against real Postgres, T-B3-05 included. Attempt 1 stopped with
`test-dispute` on T-B3-05's setup. Axis upheld it, and Rigg fixed the setup (`214be76`). Axis's
A4 fix (`4f3db8d`) gave the server's tests a 60 s timeout. The branch was rebuilt with one lock
at `4f3db8d`, and attempt 1's build commits were re-applied unchanged. Attempt 2 was killed by a
machine crash before it did any work. This attempt changes no build code. It confirms the
tests are green and replaces attempt 1's report with this one.

## Pre-flight

Postgres came from `scripts/pg-local.sh start` (postgres:17-alpine), and dependencies from
`pnpm install --frozen-lockfile`. Everything ran with `~/.nvm/versions/node/v24.22.2/bin` first
on PATH. I ran Part 7's commands in order.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 (Biome: 224 files, no fixes) |
| `pnpm test` | exit 1: 933 of 934 pass. The one failure is `@avel/contract` `routes.test.ts` "done-when 5: `pnpm --filter @avel/contract build` exits 0", which timed out at vitest's default 5 s (see Limitations) |
| `pnpm --filter @avel/server test` | exit 0: 5 files, 24 of 24 |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | build, typecheck and lint exit 0. `pnpm test` exits 1 with 931 of 934 passing. The 3 failures are all `@avel/contract` tests that spawn `tsc` and time out at 5 s: done-when 5 above, and two type tests in `events.test.ts` (done-when 7) |
| lock check (`GITHUB_HEAD_REF=t/B3-db-errors pnpm --filter @avel/repo-checks check-locks`) | "lock check passed: T-B3, 5 builder commit(s)" |

Every T-B3 test passes (`vitest run test/db --reporter=verbose` in `packages/server`):

| Test | Result |
| --- | --- |
| T-B3-01 harness: its own migrated database, and a real violation's `code` and `constraint` | pass (8.9 s, inside the new 60 s timeout) |
| T-B3-02 unique → `AlreadyExists` `{ constraint: "users_email_uq" }` | pass |
| T-B3-02 409 `ALREADY_EXISTS` through `effectHandler`, with the requestId | pass |
| T-B3-03 CHECK → `ConstraintViolation` `{ constraint: "jobs_state_ck" }` | pass |
| T-B3-03 422 `CONSTRAINT_VIOLATION` through `effectHandler` | pass |
| T-B3-04 refused delete → `DeleteRefused`, 409 `DELETE_REFUSED` `{ constraint: "cli_sessions_user_id_users_id_fk" }` | pass |
| T-B3-04 missing parent → `ConstraintViolation`, 422 | pass |
| T-B3-05 no row updated → `StaleVersion` `{ field: "rowVersion", currentVersion: 2 }`; the matching control passes through | pass |
| T-B3-05 409 `STALE_VERSION` through `effectHandler` | pass |
| T-B3-06 syntax error (42601), a plain `Error` and `undefined` aren't mapped | pass |
| T-B3-06 500 through `effectHandler`, the database's text never shown, logged with the requestId | pass |

Failing first: Rigg's tests report records all 11 failing on `5c135fe` with
`Cannot find module '/src/platform/db/errors.ts'`. The fixed T-B3-05 failed the same way on a
clean checkout.

## What changed

The build commits are attempt 1's, re-applied unchanged: `da80860` (unique), `8c76c4a` (CHECK
and foreign key) and `56db281` (stale version). Each carries `Refs: T-B3`.

- `packages/server/src/platform/errors.ts`: four tagged errors, each `{ message, details }`, each
  with a row in `errorTable`:
  - `AlreadyExists` → `ALREADY_EXISTS`
  - `ConstraintViolation` → `CONSTRAINT_VIOLATION`
  - `DeleteRefused` → `DELETE_REFUSED`
  - `StaleVersion` → `STALE_VERSION`

  The first three carry `{ constraint }`. `StaleVersion` carries the contract's `StaleVersionDetails`.
- `packages/server/src/platform/db/errors.ts` (new):
  - `mapDbError(error: unknown)` maps 23505 to `AlreadyExists` and 23514 to
    `ConstraintViolation`. For 23503 it returns `DeleteRefused` when Postgres reports "update or
    delete on …" (a referenced row is refused), and `ConstraintViolation` otherwise (the parent
    is missing).
  - It returns `undefined` for anything else, including a non-database error or an error with no
    constraint. The caller then keeps it a defect.
  - `requireUpdated(rows, currentVersion)` returns the updated row. If there is none, it fails
    with `StaleVersion` `{ field: "rowVersion", currentVersion }`.
  - Messages come from the contract's `errorMap`. The database's own message is never passed on.
- This report replaces attempt 1's (commit `793a50c`).

## Contract to files

| Requirement | Where |
| --- | --- |
| Step 1 item 3: unique → 409 | `db/errors.ts` 23505; `errors.ts` `AlreadyExists` row |
| Step 1 item 3: CHECK → 422 | `db/errors.ts` 23514; `errors.ts` `ConstraintViolation` row |
| Step 1 item 3: FK refusal 409, missing parent 422 | `db/errors.ts` 23503 branch; `DeleteRefused` row |
| Step 1 item 3: stale rowVersion → 409 | `db/errors.ts` `requireUpdated`; `StaleVersion` row |
| Writing Effect rule 3: one table, anything else a defect | `errorTable` rows; `mapDbError` returns `undefined` |
| Contract error details (`ConstraintDetails`, `StaleVersionDetails`) | the tagged errors' `details` types |

## Deviations

- None in territory: the builder's commits touch only the two files Part 5 allows, plus this
  report (the lock check agrees).
- No build code changed in this attempt. The tests attempt 1 disputed now pass as they are.

## Limitations

- **`pnpm test` isn't green locally, and the cause is outside T-B3.**
  - What failed: three `@avel/contract` tests that spawn `tsc` (the contract build, and two
    type tests). Each hit vitest's default 5 s timeout while the machine's load average was 10,
    with other sessions' Postgres containers running.
  - Why it isn't this branch: nothing here touches `packages/contract`, which is outside my
    territory. Run alone, "done-when 5" passed twice, in 3.6 s and 4.3 s.
  - What follows: it's a timing flake close to the limit, not a regression. If CI hits it, the
    contract package's tests need a timeout like the one `4f3db8d` gave the server. That would be
    a contract ticket, not this one.
- **The foreign-key split reads Postgres's English message.** A refused delete and a missing
  parent share 23503's code, table, constraint and routine, so the message prefix is the only
  difference. A server with a translated `lc_messages` would map a refused delete to 422. The
  local and CI images use English.
- **Nothing calls `mapDbError` or `requireUpdated` yet.** T-B4 wires them into the `Db` service.
  Drizzle's wrapped errors (`DrizzleQueryError.cause`) aren't covered here, as Rigg's report notes.

## Messages received

- OSA, relaying Axis (CR-37), for T-B3 build a3:
  - What it said:
    - a2 was killed by a machine crash, so ignore any a2 report.
    - The a1 test-dispute was upheld; Rigg's `214be76` fixes only T-B3-05's setup.
    - Axis's A4 fix `4f3db8d` sets a 60 s timeout.
    - The branch was rebuilt with the a1 build commits unchanged, and no build-code change is
      expected: confirm T-B3-05 is green.
    - Put the nvm node first on PATH.
  - What I did: confirmed it, ran everything with that PATH, and changed no build code. The
    message narrows the task and widens nothing.
