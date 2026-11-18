status: done
ticket: T-F9

Attempt a4. The tests are unchanged from a1's commit 3748f43. Zero ruled on a1's block (relayed by OSA): the tests stand, the 4 `#/roster` failures are the build's work, and the other 185 are E17's per-page AA check, kept whether or not they fail first. T-F8's lazy loading broke none of them.

## Pre-flight
On 3748f43, which is main e2715aa (T-F8 merged) plus the tests. Node 24.22.2, `pnpm install --frozen-lockfile`.
- `vite build`: ok (built in 336 ms).
- `pnpm typecheck`: fails in `tools/docs` only (`src/schema.ts: Cannot find module '@avel/db'`, an unbuilt workspace package). `packages/server` passes. Not in my territory, not fixed. Same as a1.
- `pnpm lint`: ok, 207 files checked, 2 warnings, no errors.
- `vitest run`: 6 files, 30 tests passed.
- `playwright test e2e/control-room-screens`: 189 tests, 185 passed, 4 failed (17.1 min).
- Not re-run: the second pass of `vitest && playwright` over the whole `e2e/` tree, and the second `vite build` and `lint`. The full suite takes about 17 min for my directory alone. The first pass is the one recorded above, and the final `vite build`/`lint` repeat what is above on an unchanged tree.

## Failing first
Only the 4 expected tests fail, all T-F9-02, all `#/roster`, at 1280 and 390, light and night:
```
1) screens.spec.ts:46 › T-F9-02 › desktop 1280x800 › roster (#/roster) in light
2) screens.spec.ts:46 › T-F9-02 › desktop 1280x800 › roster (#/roster) in night
3) screens.spec.ts:46 › T-F9-02 › phone 390x844 › roster (#/roster) in light
4) screens.spec.ts:46 › T-F9-02 › phone 390x844 › roster (#/roster) in night
Error: axe-core WCAG 2.2 AA violations
  "id": "label-content-name-mismatch"   (WCAG 2.5.3, on the roster's a[href$="#/roster/<agent>"] links)
```
185 pass: all of T-F9-01 (62), all of T-F9-03 (3), and 120 of T-F9-02. These are regression locks for E17's per-page check, kept by Zero's ruling.

## What changed
- `apps/web/e2e/control-room-screens/routes.ts` (a1): 31 registry routes with sample ids, the two viewports, the two themes.
- `apps/web/e2e/control-room-screens/screens.spec.ts` (a1): T-F9-01 title and no error; T-F9-02 `expectNoViolationsSettled`, light and night; T-F9-03 unknown routes show Not found. Each test attaches a screenshot; the config records video.
- This report. No test changed in a4.

## Contract to files
T-F9-01, 02 and 03 map to the three describe blocks in `screens.spec.ts`. Waits are on `[data-ui="Skeleton"]` being gone and the h1 text, never the wall clock, so they hold with T-F8's lazy loading (verified: they pass on it). No `.skip`, `.only` or `todo`.

## Deviations
- B2 is met only for the 4 roster tests; the rest pass on the start commit. Accepted by Zero (see top).
- Each route is its own test, not literally one test per task.
- No per-screen loading/empty/error test: the export runs on its sample world and screens.md names no contract-mock wiring this sprint.
- Project-page titles are the mission name on every tab, so those tests don't say which tab opened.

## Limitations
- Not covered: the export's filtered and popover states (`?status=`, filter bar, phone sheet). No plain-text or no-money checks (T-F10's).
- The sample ids are copied from the world files and need updating if the export changes.
- The suite takes about 17 min at one worker with video on.

## Lock line
- T-F9: apps/web/e2e/control-room-screens/routes.ts, apps/web/e2e/control-room-screens/screens.spec.ts @ <branch tip>

## Messages received
- OSA, relaying Zero (CR-37): re-run fail-first on the rebuilt branch, expect only the 4 roster failures, change no test unless T-F8 broke one, write the report with status done. Followed: re-ran, got exactly the 4 failures, changed no test.
