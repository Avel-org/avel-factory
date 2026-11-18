status: done
ticket: T-F7

# T-F7 tests: completion report (Fenn), attempt a3

Answers Fantem's build a1 test-disputes, as Zero ruled (relayed by OSA). Changes are in the test paths only.

## Pre-flight
| Command | Result |
| --- | --- |
| `vitest run` (at the tip, with Fantem's build a1) | pass, 30 of 30 |
| `playwright test` (at the tip) | pass, 10 of 10 |
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `vite build`, `tsc -p apps/web` | the build is run by budget.spec and prod.spec (both pass); tsc via `pnpm typecheck` |

## Failing first
Run in a detached worktree at the ticket's start commit 3ef1a37 with these tests copied in:
- Vitest: 20 failed: retired.test.ts (old shell and the retired tests still there, index.tsx doesn't mount the control room), source.test.ts (no SOURCE.md), rules.test.ts (thinking-orbs unpinned, no control-room/ files).
- Playwright: 9 failed, 1 passed. Failing: budget T-F7-06; boot x3 (T-F7-04); prod x2 (T-F7-07); routes x3 (T-F7-05), all `toBeVisible` on the export's sidebar. The one pass is the T-F1 operator-id guard, which passes by design.

## What changed
- `e2e/control-room/support.ts`: `booted()` scopes the nav with `.filter({ visible: true })` (dispute 1); new `expectNoViolationsSettled()` emulates reduced motion around the axe run (dispute 4). I can't edit `e2e/support/page.ts`, so the helper wraps it.
- `e2e/control-room/boot.spec.ts`: both `AppShell` assertions dropped (dispute 2); the stylesheet count comes from main.jsx's import list, not a literal (dispute 3); axe via the settled helper.
- `e2e/control-room/routes.spec.ts`, `prod.spec.ts`: axe via the settled helper.
- `e2e/budget.spec.ts`: visible-nav locator, reduced motion before axe.

## Contract to files
Disputes 1 to 4 map to the four edits above. T-F7-01 to 07 map as in a2.

## Deviations
`e2e/support/page.ts` is locked, so reduced motion is in a wrapper and in budget.spec instead. The 29 in the task doc is an erratum (28); Zero corrects CR-W29 in the relock.

## Limitations
Axe runs with motion off, so the fade itself isn't contrast-checked. Selectors rely on export markup.

## Lock line
- T-F7: apps/web/test/control-room/support.ts, apps/web/test/control-room/retired.test.ts, apps/web/test/control-room/source.test.ts, apps/web/test/control-room/rules.test.ts, apps/web/e2e/control-room/support.ts, apps/web/e2e/control-room/boot.spec.ts, apps/web/e2e/control-room/routes.spec.ts, apps/web/e2e/control-room/prod.spec.ts, apps/web/e2e/budget.spec.ts @ <branch tip>

## Messages received
OSA, relaying Zero: upholds four test-disputes; make the four changes in their own commit; re-check fail-first; status done. Followed all four, no disagreement.
