status: done
ticket: T-B7

## Pre-flight
- `pnpm build`, `pnpm typecheck`, `pnpm lint`: pass (lint: 2 existing warnings, none in my file).
- `pnpm test`: 42 files, 937 tests pass.
- `pnpm --filter @avel/repo-checks test`: 7 files, 30 tests pass (6 T-B7 tests failed before the change, passed after).
- `pnpm build && pnpm typecheck && pnpm lint && pnpm test`: pass.

## What changed
- `tools/repo-checks/src/check-locks.ts`:
  - `testsReport()` reads the build doc's `after:`, finds the `kind: tests` doc and takes its `report:`. That one path is dropped from each commit's files before the Territory and lock checks.
  - `baseRef()` finds `origin/$GITHUB_BASE_REF`, else local `main`. If neither exists the check fails and says so.
  - The commit range is now `lock..HEAD ^base` with `--topo-order`, replacing `--first-parent`. Side-branch commits are checked and main's own commits are not. The `diff-tree -c` merge-result check is unchanged.
- This report.

## Contract to files
- T-B7-01 and T-B7-02 (tests report exempt after the lock, with or without a relock): `testsReport()` and the file filter.
- T-B7-03 (a checker commit before the relock that touches another file still fails): unchanged Territory rule, now only the tests report is removed.
- T-B7-04 and T-B7-05 (other reports and locked tests still fail): only the exact tests-report path is exempt.
- T-B7-06 (side branches): the new range and `baseRef()`.

## Deviations
None.

## Limitations
- CI can't tell who changed the tests report; the reviewer checks its history (F2).
- The `GITHUB_BASE_REF` path is untested here, because scratch repos have no origin. It falls back to local `main`.
- A locks.md-only commit on a side branch is still read as a possible relock line.

## Messages received
None
