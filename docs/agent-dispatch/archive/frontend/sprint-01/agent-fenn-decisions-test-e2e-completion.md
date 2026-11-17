# FENN: decisions test-e2e, completion report

verdict: DONE

## Summary
Attempt a4, FENN-03 only. UC-31 now waits for the reason dialog's animations to finish (`dialog.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished)))`) after the input is visible and before the first size read. Nothing else in the specs changed; the 44px and 16px bars are the same. UC-29 to UC-31 pass on both projects three runs in a row.

## Pre-flight
All Part 2 files: read (present). Branch frontend/sprint-01/agent-fenn-decisions-test-e2e-a4, start commit 81c5d99. Every Part 7 command: available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE in a1; not redone | |
| FENN-02 | DONE in a2 (29a2458); not redone | |
| FENN-03 | DONE | d6994d7 |

## Tests
- UC-31, apps/web/e2e/decisions.spec.ts (phone only): pins the contract on a built page, so it passes (3 runs: 5 passed, 1 skipped each; desk UC-31 skipped as before). It was red on 43.5 to 43.9px (w0-kit-zero-04) before the wait.
- UC-29, UC-30: unchanged, pass.

## Lock
Commit d6994d7, an override of the locked decisions-e2e: made with AVEL_LOCK_OVERRIDE="decisions-e2e a4: UC-31 measures the dialog once its open animation has finished (INT, revision 13)". Line for locks.md: `- decisions-e2e · d6994d7 · apps/web/e2e/**, apps/web/playwright.config.ts`

## Contract to files
UI contract section 7, UC-31 (revision 13): apps/web/e2e/decisions.spec.ts.

## Deviations
- The task asked for a failing-first test; this one fixes a timing read in a test that already existed, so I did not make it fail first. Before the change the finding records 43.87px; I did not re-run the old version.
- I ran `pnpm install --frozen-lockfile --offline` and `pnpm --filter @avel/contract build` in the fresh worktree.

## Limitations
The wait covers animations on the dialog and its descendants at the time it runs, after the input is visible. No fixed sleep; reducedMotion is not set.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT: move locks.md's decisions-e2e line to d6994d7 after the merge.

## Files changed
apps/web/e2e/decisions.spec.ts, docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md

## Verification
- `pnpm --filter "@avel/web..." build`: built, Done.
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: Done.
- `pnpm lint`: Checked 213 files, no fixes applied.
- `pnpm --filter @avel/web test`: 14 files, 196 tests passed.
- `for i in 1 2 3; do playwright test; done`: 5 passed, 1 skipped, three times.
- `git diff --name-only main...HEAD`: apps/web/e2e/decisions.spec.ts and this report.
