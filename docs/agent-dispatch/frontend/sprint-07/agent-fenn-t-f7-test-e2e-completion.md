status: done
ticket: T-F7

# T-F7 tests: completion report (Fenn)

**Update (attempt a2, Nov 17):** the deletion commit now exists (a04d7a9, made by the lead, who also amended hygiene.test.ts under CR-W29) and the lock line is in locks.md at a04d7a9. The tests below are locked and unchanged; this attempt re-ran nothing (no node_modules in this worktree) and only corrects the status. Deviation 4 is resolved by that amendment.

Originally blocked on one step only: the first commit that deletes the retired locked tests (T-F7-01's setup) was refused by the session's permission classifier ("destructive or unwanted action") when I ran `git rm`. I did not retry or work around it. Everything else is written and proven failing. To finish: Zero or OSA runs, on this branch,

    git rm -r apps/web/test/shell apps/web/e2e/shell apps/web/test/home-loader.test.ts apps/web/test/home-loader-states.test.ts apps/web/test/home-view.test.ts apps/web/e2e/home.spec.ts apps/web/e2e/states.spec.ts
    git commit -m "T-F7 tests: delete the locked tests CR-W29 retires"

`test/control-room/retired.test.ts` checks that those paths are gone.

## Pre-flight
(node 24.22.2 from nvm; `pnpm install --frozen-lockfile` and a build of @avel/contract and contract-mock were needed first.)
- `vite build`: ok (old shell).
- `pnpm typecheck`: fails in tools/docs, "Cannot find module '@avel/db'": the workspace package isn't built in this worktree. Not from my files. `tsc -p apps/web/tsconfig.json --noEmit`: ok.
- `pnpm lint`: ok (biome, 230 files).
- vitest (whole): 20 failed, 45 passed; all 20 failures are my new T-F7 tests, as intended.
- playwright (my specs + budget.spec.ts): 9 failed, 1 passed. The old shell dispatch tests (e2e/shell, home, states) were not run in this pass because they're due to be deleted.
- The full `vitest && playwright` chain is therefore red on purpose.

## Failing first (start commit 3ef1a37)
Vitest (`vitest run test/control-room`): 20 failed
- rules.test.ts: thinking-orbs pin (undefined, not "0.3.2"); control-room/ holds no files
- source.test.ts: all 5 fail (no SOURCE.md)
- retired.test.ts: 13 of 14 fail ("test/shell: expected true to be false", same for the other 11 paths, and index.tsx / control-room.d.ts missing); the 14th ("what CR-W29 keeps is still there") passes, a guard that must stay true.

Playwright:
```
✘ budget.spec.ts      T-F7-06 JS / loads before Decisions is interactive <= 350 KB   (no DecisionsDashboard / FactoryPulse)
✓ budget.spec.ts      no built file contains the mock's operator id   (kept from T-F1; passes already, not a T-F7 acceptance)
✘ boot.spec.ts       T-F7-04 sidebar, header, Decisions home, no AppShell
✘ boot.spec.ts       T-F7-04 client-rendered; server HTML has data-ui="AppShell" (expected not to contain)
✘ boot.spec.ts       T-F7-04 the export's 29 stylesheets, not app.css/tokens.css
✘ prod.spec.ts       T-F7-07 no dock / viewport preview / OSA (fails at "booted": no export header)
✘ prod.spec.ts       T-F7-07 ?osa=1 shows OsaBar
✘ routes.spec.ts     T-F7-05 x3 (hash moves + back; sidebar link; direct #/library)
9 failed, 1 passed
```
Two of my first drafts passed on the old shell (the stylesheet check and the prod no-dock check); I tightened `booted()` to need the export's own markup (`nav.lib-nav`, `[data-ui="FactoryPulse"]`), then they failed. Screenshots, video and traces are in `apps/web/test-results/` (not committed).

## What changed
- `apps/web/test/control-room/support.ts`, `retired.test.ts` (T-F7-01), `source.test.ts` (T-F7-02), `rules.test.ts` (T-F7-03).
- `apps/web/e2e/control-room/support.ts`, `boot.spec.ts` (T-F7-04), `routes.spec.ts` (T-F7-05), `prod.spec.ts` (T-F7-07).
- `apps/web/e2e/budget.spec.ts` (T-F7-06): limit 350 KB, warn 150 KB, measures every script the browser fetches until Decisions is interactive; adds a floor (> 50 KB) so a stub can't pass; adds axe and a screenshot.

## Contract to files
T-F7-01 retired.test.ts; -02 source.test.ts; -03 rules.test.ts; -04 boot.spec.ts; -05 routes.spec.ts; -06 budget.spec.ts; -07 prod.spec.ts. Every e2e test runs axe (WCAG 2.2 AA), attaches a screenshot, and checks for no "$"; the config records video.

## Deviations and things Zero must decide
1. **Deletion commit not made** (above).
2. **SOURCE.md format** was unspecified. I fixed it: a row has the file's path relative to control-room/ in backticks and its 64-hex SHA-256; the "Changed for apps/web" heading section names each changed file in backticks with a reason (at least 10 characters). Tell Fantem.
3. **console.log vs byte-for-byte copy:** `tools/check-contract.mjs` in the export has three `console.log` calls (lines 130, 131, 137). T-F7-03 says none under control-room/. Fantem must change that file (e.g. `process.stdout.write`) and name it in "Changed for apps/web". I kept the test strict; if Zero wants the CLI exempt, that's a test-dispute to answer.
4. **hygiene.test.ts (locked, kept by CR-W29)** asserts `src/home/HomeView.tsx` and `src/home/load-home.ts` exist, which the ticket removes. It will fail after the build; I can't edit it (territory). Needs Zero's ruling / a CR-W29 amendment.
5. **axe on every screen in T-F7:** the export may not pass axe on Decisions, Live, Library or Settings before T-F9. I ran axe on each as my rules require. If the export fails, that's a dispute for Zero, not a loosening by me.
6. Postgres wasn't started: these tests touch no database.

## Limitations
- The export is read at `/mnt/c/Users/javar/Desktop/avel-control-room`; source.test.ts checks listed hashes against it only when it exists on the machine.
- Selectors rely on export markup (`nav.lib-nav`, `data-ui="FactoryPulse"`, `DecisionsDashboard`, `OsaBar`, `SimPanel`, `.cr-vp`) that I read from its source, not rendered.
- Mobile (390), night and `contract-mock` states aren't in T-F7's list; not covered. The route titles for Live, Library, Settings are taken from `PAGES`.

## Lock line
- T-F7: apps/web/test/control-room/support.ts, apps/web/test/control-room/retired.test.ts, apps/web/test/control-room/source.test.ts, apps/web/test/control-room/rules.test.ts, apps/web/e2e/control-room/support.ts, apps/web/e2e/control-room/boot.spec.ts, apps/web/e2e/control-room/routes.spec.ts, apps/web/e2e/control-room/prod.spec.ts, apps/web/e2e/budget.spec.ts @ a04d7a9 (locked in locks.md)

## Messages received
None.
