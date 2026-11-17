status: done
ticket: T-F7

# T-F7 tests: completion report (Fenn), attempt a2

Worked from branch tip 6738a64. a04d7a9 holds the deletion of the retired locked tests (test/shell, e2e/shell, home-loader, home-loader-states, home-view, home.spec, states.spec) and the two-line hygiene.test.ts edit (CR-W29 amendment, Nov 17). Zero's lock is in 6738a64. No test file was changed in this attempt.

## Pre-flight
(node from nvm; `pnpm install --frozen-lockfile`; @avel/contract built.)
- Product code (apps/web/src) is unchanged since the start commit 3ef1a37, so the tip is the start state for these tests.
- The full `vitest && playwright` chain is red on purpose: the build isn't done. Typecheck, lint and build were run in the first attempt (vite build ok, lint ok, `tsc -p apps/web` ok); I did not re-run them this attempt because no file changed.

## Failing first (re-run at the tip, product code as at 3ef1a37)
Vitest: 13 failed, 17 passed (6 files). Failing: source.test.ts x5 (no SOURCE.md), retired.test.ts x6 (src/kit, src/modules/system, src/home, _shell.tsx, _shell still there; index.tsx doesn't mount the control room), rules.test.ts x2 (thinking-orbs not pinned; no control-room/ files). The 17 passes are the existing foundation, gitignore and hygiene tests plus guards.

Playwright: 9 failed, 1 passed.
```
x budget.spec.ts T-F7-06 JS / loads before Decisions is interactive <= 350 KB (expect(locator).toBeVisible failed)
v budget.spec.ts no built file contains the mock's operator id (T-F1 guard, passes by design)
x boot.spec.ts   T-F7-04 x3 (sidebar/header/Decisions home; client-rendered skeleton; 29 stylesheets)
x prod.spec.ts   T-F7-07 x2 (no dock/OSA; ?osa=1 shows OSA)
x routes.spec.ts T-F7-05 x3 (hash routes + back; sidebar link; direct #/library)
```

## What changed
- `apps/web/test/control-room/support.ts`, `retired.test.ts` (T-F7-01), `source.test.ts` (T-F7-02), `rules.test.ts` (T-F7-03).
- `apps/web/e2e/control-room/support.ts`, `boot.spec.ts` (T-F7-04), `routes.spec.ts` (T-F7-05), `prod.spec.ts` (T-F7-07).
- `apps/web/e2e/budget.spec.ts` (T-F7-06): limit 350 KB, warn 150 KB, measures every script the browser fetches until Decisions is interactive; adds a floor (> 50 KB) so a stub can't pass; adds axe and a screenshot.

## Contract to files
T-F7-01 retired.test.ts; -02 source.test.ts; -03 rules.test.ts; -04 boot.spec.ts; -05 routes.spec.ts; -06 budget.spec.ts; -07 prod.spec.ts. Every e2e test runs axe (WCAG 2.2 AA), attaches a screenshot, and checks for no "$"; the config records video.

## Deviations
None from the task doc in this attempt. Zero's rulings (OSA message): SOURCE.md format accepted; T-F7-03 stays strict, so Fantem changes the three console.log calls in tools/check-contract.mjs and names the file in "Changed for apps/web"; axe stays on all four pages. The hygiene.test.ts conflict is resolved by the amendment in a04d7a9.

## Limitations
- The export is read at /mnt/c/Users/javar/Desktop/avel-control-room; source.test.ts checks hashes against it only when it exists on the machine.
- Selectors rely on export markup (nav.lib-nav, data-ui="FactoryPulse", DecisionsDashboard, OsaBar, SimPanel, .cr-vp) read from source, not rendered.
- Mobile (390), night and contract-mock states aren't in T-F7's list and aren't covered.
- No Postgres: these tests touch no database.

## Lock line
- T-F7: apps/web/test/control-room/support.ts, apps/web/test/control-room/retired.test.ts, apps/web/test/control-room/source.test.ts, apps/web/test/control-room/rules.test.ts, apps/web/e2e/control-room/support.ts, apps/web/e2e/control-room/boot.spec.ts, apps/web/e2e/control-room/routes.spec.ts, apps/web/e2e/control-room/prod.spec.ts, apps/web/e2e/budget.spec.ts @ a04d7a9

## Messages received
- OSA, relaying Zero (CR-37): work from 6738a64; confirm a04d7a9; re-run fail-first; rewrite the report as done with the lock line at a04d7a9; change no test file. Followed all of it (confirmed a04d7a9, re-ran, no test changed). It also told me Zero accepted the SOURCE.md format, kept T-F7-03 strict and kept axe on four pages; recorded above.
