status: test-dispute
ticket: T-F7

# T-F7 build: Fantem, stopped with test-dispute

## Pre-flight

| Command | Result |
| --- | --- |
| `vite build` | pass (client JS 354,067 B gzipped by the budget test, under the 350 KB = 358,400 B limit; warns over 150 KB) |
| `pnpm typecheck` | pass (after building `@avel/contract`, `@avel/db`; a fresh worktree has no `dist`) |
| `pnpm lint` | pass |
| `vitest run` | pass, 30 of 30 |
| `playwright test` | **9 of 10 fail** as built (the app boots, but see Disputes). With the experiment below, 5 fail and 3 of those are the disputes; the 2 other fails are axe timing (below) |
| `tsc -p tsconfig.json --noEmit` | pass (via `pnpm typecheck`) |

## Test disputes (the export can't pass these without changing Javaris's design)

1. **`booted()` in `e2e/control-room/support.ts`** uses `page.locator("nav.lib-nav[aria-label='Main']")` with `toBeVisible()`. The export renders its sidebar twice, the desktop aside and the closed phone sheet (`ControlRoomView.jsx`, `rails` in `logic.js`), each with `nav.lib-nav[aria-label="Main"]`. Strict mode fails: "resolved to 2 elements". This fails 9 tests. Only rendering the sheet when open fixes it, which loses its slide-in transition: a design change, not a React 19 or Vite 8 fix.
2. **`boot.spec.ts` "AppShell"**: expects `[data-ui="AppShell"]` count 0, but the export's own root frame is `data-ui="AppShell"` (`ControlRoomView.jsx` line 73). The test means T-F2's frame; the export has the same name.
3. **`boot.spec.ts` "29 stylesheets"**: `src/styles/` holds 28 stylesheets (the 29th entry in the folder is the `fonts` directory) and `main.jsx` imports 28. All 28 load. CR-W29's "29" is a miscount.
4. **axe `color-contrast` (flaky, not a design colour fault)**: on `.cr-done-row ... .av-tag[data-tone="verified"]` (a different row each run). The rows fade in on a stagger (`motion.css`), and the tests run axe straight after boot, so axe reads a half-faded colour. A fix means turning off the export's motion, which isn't a small fix, so I left it.

Experiment, reverted: filtering the closed sheet out of `rails` in `ControlRoomView.jsx` (one line) cleared dispute 1; with it, budget, routes (2 of 3) and prod (1 of 2) tests passed.

## What changed

- `apps/web/control-room/**`: the byte-for-byte copy (commit 5e2de7d), 114 files plus `SOURCE.md`.
- Changed in the copy, each named in `SOURCE.md`: `src/app/ControlRoom.jsx` (parameter defaults, `showDock` = `import.meta.env.DEV`), `src/main.jsx` (exports ControlRoom, no `createRoot`), `tools/check-contract.mjs` (three `console.log` to `process.stdout.write`, per OSA/Zero).
- `src/routes/index.tsx` (new): lazy client-only mount with `ssr: false` and a skeleton. `src/routes/__root.tsx`: dropped T-F1's `app.css` link so `/` loads only the export's styles. `src/routeTree.gen.ts`: regenerated.
- `src/control-room.d.ts` (new): types the route's import.
- Removed: `src/kit`, `src/modules`, `src/home`, `src/routes/_shell*`.
- `apps/web/package.json`, `pnpm-lock.yaml`: `thinking-orbs` 0.3.2, exact.
- `biome.json`: one override, `includes: ["**/control-room/**"]`, with formatter, linter and assist off. `apps/web/biome.json` (not mine) sets its own `files.includes`, so `apps/web/control-room/**` as a path didn't match; `**/control-room/**` does.
- `docs/ui-contracts/shell-layout.md`, `kit-v1.9.md`: one superseded line each (E7).

## Contract to files

T-F7-01: the removals. T-F7-02: `SOURCE.md`. T-F7-03: `package.json`, the `check-contract.mjs` edit. T-F7-04/05: the route and root. T-F7-06: the lazy route (measured 354,067 B). T-F7-07: `showDock` default.

## Deviations

- Biome override glob is `**/control-room/**`, not `apps/web/control-room/**` (reason above).
- I didn't change `ControlRoomView.jsx`, because disputes 1 and 2 need design-markup changes beyond the ticket.

## Limitations

No fix attempted for the axe timing in dispute 4. Not checked at 390 px or in night mode. I didn't start Postgres, since no web test uses it.

## Messages received

OSA relayed an instruction from Zero: (1) SOURCE.md row and "Changed" format, followed; (2) change the three `console.log` in `check-contract.mjs` to `process.stdout.write`, followed and named in SOURCE.md; (3) small axe fixes are allowed, otherwise stop `out-of-scope`: I made none, since the one axe failure is animation timing, and I stopped on `test-dispute` instead.
