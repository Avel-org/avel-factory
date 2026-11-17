status: done
ticket: T-F2

# T-F2 tests: completion report (Fenn)

Attempt 2. Start commit: `b0a1561` (attempt 1 was d2efad0 on `362dc24`, main after T-F1). Baseline before I changed anything: 23 unit and 14 e2e tests green (after `pnpm build` of `@avel/contract` and `@avel/contract-mock`, which a fresh worktree needs).

## Pre-flight
| Command | Result |
| --- | --- |
| `vite build` | passes |
| `pnpm lint` | passes (Biome, 214 files) |
| `vitest run` | **3 new files fail** (missing `kit/AppShell`, `kit/kit.css`, `modules/system/nav`); T-F1's 23 tests pass |
| `playwright test` | **15 new tests fail**; T-F1's 14 still pass (run on `e2e/shell` only for the failing output) |
| `tsc -p apps/web/tsconfig.json --noEmit` | fails only on the two missing modules the tests import (expected until the build) |
| `pnpm typecheck` | fails: `tools/docs` can't find `@avel/db` (not built in this worktree; not from my files). The web part fails for the same reason as the line above |

Postgres (`scripts/pg-local.sh`) was not started: apps/web's tests use contract-mock and no database.

## Failing first
Unit (`vitest run`):
```
FAIL test/shell/app-shell.test.tsx  Error: Cannot find module '../../src/kit/AppShell'
FAIL test/shell/kit-css.test.ts     Error: ENOENT .../src/kit/kit.css
FAIL test/shell/nav.test.ts         Error: Cannot find module '../../src/modules/system/nav'
Test Files 3 failed | 6 passed   Tests 23 passed
```
E2E (`playwright test e2e/shell`): 16 failed, all because the shell isn't built, e.g.
```
Locator: locator('[data-ui="AppShell"][data-hydrated]')  Expected: attached  Error: element(s) not found
```
Failing: a11y ×6 (T-F2-10), frame ×5 (T-F2-06, -07), hydration ×4 (T-F2-08, -09); the unit files fail at import, as before.

## What changed
All new, under my territory:
- `apps/web/test/shell/support.tsx`: a `renderToString` helper around `AppShell`, with a plain-anchor `renderLink`.
- `apps/web/test/shell/app-shell.test.tsx`: T-F2-01, -02, -03.
- `apps/web/test/shell/nav.test.ts`: T-F2-04.
- `apps/web/test/shell/kit-css.test.ts`: T-F2-05 (a small brace parser, so a `:hover` is checked against its enclosing `@media`).
- `apps/web/e2e/shell/support.ts`: boxes, canvas style, progress value, spacer.
- `apps/web/e2e/shell/frame.spec.ts`: T-F2-06, -07.
- `apps/web/e2e/shell/hydration.spec.ts`: T-F2-08 (scripts-off box vs hydrated box, ≤1px), T-F2-09.
- `apps/web/e2e/shell/a11y.spec.ts`: T-F2-10 (axe at 1280, 900, 390 × light, night; no `$`).
- This report.

## Contract to files
S1 canvas → frame.spec, kit-css. S2 attributes → app-shell, frame.spec. S3, S15 brand and nav "Main" → app-shell. S4 server-drawn current row → frame.spec (no-JS). S12/S16 themes → a11y. S14 nothing on the right → not tested beyond "no menu button". S17 tab only when its route exists → frame.spec ("no Project/More/Release"). §4 nav model → nav.test. Hover gate, breakpoints → kit-css.

## Deviations
- The doc doesn't fix class names or the `navFromRoutes` input shape, so the tests pin DL's names: `.lib-rail`, `.lib-nav-item`, `.lib-topbar`, `.lib-progress` (inline `scaleX(n)`), `.lib-tabbar`, `.lib-tab`, `nav aria-label="Breadcrumb"`. `navFromRoutes` takes route objects `{ options: { staticData: { nav } }, fullPath }` and returns `{ groups, tabs }`; the real-tree check passes `Object.values(getRouter().routesById)`. If Fantem needs a different shape, that's a `test-dispute` for Zero.
- The canvas is found as the h1's first vertically scrolling ancestor, not by class, so Fantem may name it freely.
- "Tab ≥ 44px" is what T-F2-07 says; DL's own tab is 52px, and the doc's note says 52. I tested 44 as written.
- The progress tests append a 3000px spacer to `main` (the page has too little content to scroll).
- kit.css also gets two checks the doc lists as rules but not as tasks: no `--av-*` redefinition and no hard-coded colour; plus a `prefers-reduced-motion` block must exist.

## Limitations
- Vitest files fail at import, so the individual unit cases only show as failed once the modules exist; the e2e cases fail one by one.
- Layout shift under 0.02 and the 150 KB budget are left to T-F1's `budget.spec.ts` (still in force).
- Not covered (T-F3): collapse, sheet, menu button behaviour, badge, glide.
- No video/screenshot is produced by unit tests; e2e ones get both from the config plus `attachShot`.

## Attempt 2 changes
The task doc (b0a1561) now says tests check what T-F2 draws, never the absence of T-F3/T-F4 work. Four places changed, no others:
1. `e2e/shell/frame.spec.ts` (390 test): the Decisions tab is found and current; no count of tabs.
2. `frame.spec.ts`: the test "nothing the ticket leaves out" is removed (menu button, More, Project, data-rail, data-focus), and the 1280 test's "no menu button" line.
3. `test/shell/app-shell.test.tsx`: "has no data-rail and no data-focus yet" removed.
4. `test/shell/nav.test.ts`: the real tree check now finds Decisions in the Decide group (href /, icon inbox) and as a tab, and no empty group; no exact counts.

Run after the change (Node 24.22 from nvm; `pnpm install --offline`): vite build passes, `pnpm lint` passes, vitest: 3 files fail on the missing modules, 23 T-F1 tests pass; playwright `e2e/shell`: 15 failed (element(s) not found / `[data-hydrated]` not attached); T-F1's 14 pass. `tsc --noEmit` errors only in `test/shell/nav.test.ts` (missing module, then implicit any from it). `pnpm typecheck` was not re-run: `tools/docs` needs `@avel/db` built, as in attempt 1.

## Messages received
- OSA (relaying Zero), T-F2 attempt 2: change only the four places above, keep the rest, show the tests still fail, update the report, give the lock line at the branch head with comma-separated paths, commit, don't push. Followed. It narrows the task and adds no file, dependency or rigor change.

## Lock line
- T-F2: apps/web/test/shell/app-shell.test.tsx, apps/web/test/shell/kit-css.test.ts, apps/web/test/shell/nav.test.ts, apps/web/test/shell/support.tsx, apps/web/e2e/shell/a11y.spec.ts, apps/web/e2e/shell/frame.spec.ts, apps/web/e2e/shell/hydration.spec.ts, apps/web/e2e/shell/support.ts @ <branch tip; the lead fills it in after this report commit>
