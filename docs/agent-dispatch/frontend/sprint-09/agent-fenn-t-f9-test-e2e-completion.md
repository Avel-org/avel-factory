status: blocked
ticket: T-F9

Blocked on B2: T-F9-01 and T-F9-03 pass on the start commit, and T-F9-02 fails only on `#/roster`. T-F7 already built most of what T-F9 asks for. I did not loosen or invent anything to make them fail. The lead decides what to do with the tests that pass (see Deviations).

## Pre-flight
Run on the start commit `cf6cc4a`. Node 24.22.2 from nvm. `pnpm install --frozen-lockfile`, then `@avel/contract` and `@avel/contract-mock` built so vite could load its config.
- `vite build`: ok.
- `pnpm typecheck`: fails in `tools/docs` (`Cannot find module '@avel/db'`, an unbuilt workspace package). This is not in my files and was not fixed.
- `pnpm lint`: ok after `biome check --write` on my two files (`Checked 205 files`, no errors).
- `vitest run`: 6 files, 30 tests passed.
- `playwright test e2e/control-room-screens`: 189 tests, 185 passed, 4 failed (8.5 min).
- The full `vitest && playwright` chain, and the other E2E specs, were not re-run. Their time budget did not fit. Only my directory was run.

## Failing first
Only 4 of 189 fail, all T-F9-02, all `#/roster`, at 1280 and 390, light and night. Output (same in all four):
```
axe-core WCAG 2.2 AA violations
id: "label-content-name-mismatch", impact: "serious"
nodes: a[href$="#/roster/canon"], a[href$="#/roster/nemi"], a[href$="#/roster/atlas"] ...
```
A real defect (WCAG 2.5.3) for T-F9's build to fix, in the export's own roster page.
Passing on the start commit: every T-F9-01 test (62), every T-F9-03 test (3), and the other T-F9-02 tests (120).

## What changed
- `apps/web/e2e/control-room-screens/routes.ts`: the 31 routes from the registry (PAGES) with sample ids from the sample world, the viewports (1280x800, 390x844) and the themes.
- `apps/web/e2e/control-room-screens/screens.spec.ts`: T-F9-01 (each route shows its title, no skeleton, no page or console error); T-F9-02 (T-F7's `expectNoViolationsSettled`, light and night, both viewports; theme set through `localStorage["avel-cr"]`, asserted on `html[data-theme]`); T-F9-03 (three unknown `#/` routes show "Not found"). Every test attaches a screenshot; the config records video.
- This report.

## Contract to files
T-F9-01, 02 and 03 map to the three describe blocks in `screens.spec.ts`. Titles wait on `[data-ui="Skeleton"]` being gone, so they hold before and after T-F8. No wall-clock waits, `.skip`, `.only` or `todo`.

## Deviations
- B2 not met for T-F9-01, T-F9-03 and most of T-F9-02 (see status). Options for the lead: accept them as regression locks with only the roster failing, or take the ticket to a CR, because T-F7 already delivered most of it.
- No states test per screen (loading/empty/error): the export runs on its sample world and screens.md names no contract-mock wiring this sprint.
- Project pages (any tab of a mission) show the mission name in h1, so those titles say nothing about which tab opened. I did not add tab assertions.
- Each route is a separate test, not literally "one test" per task.

## Limitations
- Not covered: the export's filtered or popover states (`?status=`, the filter bar, the phone sheet), which its audit script exercises. No plain-text or no-money checks (T-F10's).
- The suite takes ~8.5 min at one worker (video on).
- The sample ids are copied from the world files; if the export changes, they need updating.

## Lock line
- T-F9: apps/web/e2e/control-room-screens/routes.ts, apps/web/e2e/control-room-screens/screens.spec.ts @ <branch tip>

## Messages received
None.
