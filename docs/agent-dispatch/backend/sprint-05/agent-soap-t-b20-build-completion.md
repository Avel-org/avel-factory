status: done
ticket: T-B20

# T-B20 · build · Soap: completion report

## Pre-flight

Run in order on `t/B20-step-1-done` at 9de215f, against this worktree's own Postgres from `scripts/pg-local.sh`:

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 0: 106 test files, 1127 tests passed |
| `pnpm --filter @avel/server test` | exit 0: 61 test files, 144 tests passed |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0: 106 test files, 1127 tests passed |

The locked tests on their own (`pnpm --filter @avel/server exec vitest run test/step-1`): 2 files and 6 tests pass. T-B20-01 fails on main, because `docs/steps/step-1-done.md` didn't exist there.

## What changed

- `docs/steps/step-1-done.md` (new): the Step 1 done-when report (C5). It's a five-cell table with one row for each of tests 1 to 15, in the format `done-when.test.ts` reads. Each row still in Step 1 gives:
  - what the test says;
  - the locked test files and test IDs that prove it;
  - the ticket whose `locks.md` line locks them.

  Rows 5, 8 and 9 say "moved" and name CR-43. Rows 14 and 15 say "moved" and name CR-31. Row 12 names Step 7 for the finalize half. The tickets come from the backend sprints' `locks.md` lines (sprint-01 to sprint-05). The test IDs come from the describe titles in those files.
- `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b20-build-completion.md`: this report.
- No source change. `running-server.test.ts` (T-B20-G01) already passed against `startServer` as merged by T-B16 and T-B19. The plan's second note allows source changes only where a done-when test shows something missing, and none did.

## Contract to files

| Requirement | File |
| --- | --- |
| T-B20-01: the report exists, has rows 1 to 15, and names real, unskipped, unquarantined test files and IDs with a locking ticket | `docs/steps/step-1-done.md` |
| T-B20-G01: the real server signs in, creates a client idempotently with one activity row, takes a signed merge, and answers an unknown route with the contract's error body | none needed (it already passes) |
| C5 and Part 3's first note: the report is the build's main output, and the lead signs it in the PR | `docs/steps/step-1-done.md` |

## Deviations

- **Row 5 says "moved", but CR-43 restates test 5 rather than moving it out.** CR-43's table restates test 5 on sign-in ("the 6th sign-in in a minute … is 429. T-B9 already has this test"). The locked test and Axis's ruling both treat row 5 as moved under CR-43. The row does that:
  - its file cell says the device-login form moved to Step 5 with route 1 (CR-43);
  - it also names the tests that prove the sign-in restatement, T-B9-04 (`auth/rate-limit.test.ts`) and T-B16-03 (`server/rate-limit.test.ts`), so the proof isn't lost.

  The lead should confirm that reading when signing the report.
- **Push.** The task doc's activation prompt says "Don't push". `soap.md` and CR-46 B3 say a builder pushes its branch and opens its PR once its report says done. I followed the task doc and did not push. I asked OSA to confirm whether I should push and open the PR.

## Limitations

- **Row 1's contract and OpenAPI halves aren't backed by a backend lock line.** Those halves ("the contract builds and the OpenAPI document is generated") are proved by Step 0's done-when 5 tests:
  - `packages/contract/test/routes.test.ts`;
  - `tools/docs/test/openapi.test.ts`.

  Both were committed with the seed (59b0105), before `locks.md` lines began. Row 1's own Step 1 lock is T-B1, whose glob `packages/server/test/**` covers `health.test.ts` (T-B1-01). "CI is green" is shown by CI itself, not by any one test.
- **Row 10 names T-B13's test IDs but ticket T-B17.** The `jobs/` tests carry T-B13's IDs, but the `locks.md` line that locks them is T-B17's (sprint-05). Row 10 names T-B17 and explains why.
- The check proves that each named file and ID exists and isn't skipped. Whether each named test really proves its row is for the lead to judge when signing (C5).

## Messages received

- **From OSA, relaying Axis (lead), a ruling within T-B20:**
  - Soap writes `docs/steps/step-1-done.md`, and the lead owns it and signs it in the PR (C5).
  - Use the header's five-cell table for rows 1 to 15, with 5, 8 and 9 moved under CR-43, 14 and 15 moved under CR-31, and 12 naming Step 7.
  - Take files, IDs and tickets from the backend `locks.md` files.
  - Change source only where a done-when test shows something missing.
  - Stop with `blocked` if a Step 1 test has no locked test.

  **Followed.** It narrows the task and widens nothing. Every row still in Step 1 names a locked test, so no `blocked` was needed. Row 1's Step 0 halves are noted under Limitations.
