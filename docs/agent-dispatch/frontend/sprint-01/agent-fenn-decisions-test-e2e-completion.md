# FENN: decisions test-e2e, completion report

verdict: DONE

## Summary
Attempt a2, FENN-02 only. UC-29, UC-30 and UC-31 each wait for `[data-ui="DecisionsPage"][data-hydrated="true"]` after their SSR checks and before their first click. Nothing else in the specs changed. The marker isn't built yet, and the page isn't either on this branch, so the tests fail earlier on assertions and never reach the wait; I couldn't show a failure on the wait itself.

## Pre-flight
All Part 2 files: read (present). Branch frontend/sprint-01/agent-fenn-decisions-test-e2e-a3, start commit 9b25f09. Every Part 7 command: available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE in a1 (locked, 7fcb967); not redone | |
| FENN-02 | DONE | 29a2458 |

## Tests
- UC-29, apps/web/e2e/decisions.spec.ts "UC-29: / is server-rendered...": one wait after the row/count checks, before the Approve click. Fails on an earlier assertion (page has no DecisionsPage root: route not built).
- UC-30, same file: wait after the "Binds to Version" check, before the Approve click. Fails at `expect(row).toBeVisible()` (no rows).
- UC-31 (phone only): wait after the grid/size checks, before `approve.click()`. Fails earlier on an assertion (phone project; desk skips).
Run result: 5 failed, 1 skipped (as a1).

## Lock
Commit 29a2458, an override of the locked decisions-e2e: made with AVEL_LOCK_OVERRIDE (INT's decision 2). Line for locks.md: `- decisions-e2e · 29a2458 · apps/web/e2e/**, apps/web/playwright.config.ts`

## Contract to files
UI contract section 7 "End to end", revision 9 wait: apps/web/e2e/decisions.spec.ts.

## Deviations
- grep -c data-hydrated counts 3 lines in decisions.spec.ts (one per test); the glob is the one file.
- The stock `playwright test` never reached the tests here: the dev server answers 404 at / (route not built) and the config's `url` check treats 404 as not ready, so it times out at 120 s. For the failing output I ran a throwaway copy of the config with `wait: { stdout: /Local:/ }` instead of `url` (deleted, not committed). playwright.config.ts is unchanged.
- I ran `pnpm install --frozen-lockfile --offline` and `pnpm --filter @avel/contract build` in the fresh worktree (build output is untracked).

## Limitations
The waits are unproven against a built marker until Leon's decisions a2 lands; re-run then. Because of the `url` check above, a stock run fails on a server timeout, not on assertions, until the route exists.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT: move locks.md's decisions-e2e line to 29a2458 after the merge.
- INT/Leon: after decisions a2, re-run `playwright test`; consider whether the config's `url` should accept a 404 root (GHOST/INT's call; it is a locked file).

## Files changed
apps/web/e2e/decisions.spec.ts, docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md

## Verification
- `pnpm --filter "@avel/web..." build`: built, Done.
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: all Done.
- `pnpm lint`: Checked 198 files, no fixes applied.
- `pnpm --filter @avel/web test`: 37 failed | 153 passed (190); the failures are the unbuilt decisions module's screen tests (UC-11 to UC-28), not mine.
- `git diff --name-only main...HEAD`: only apps/web/e2e/decisions.spec.ts and this report.
