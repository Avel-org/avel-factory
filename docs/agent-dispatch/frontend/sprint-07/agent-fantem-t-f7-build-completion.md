status: done
ticket: T-F7

# T-F7 build: Fantem, attempt 2, done

## Pre-flight

| Command | Result |
| --- | --- |
| `vite build` | pass; budget test measures 354,051 B gzipped, under 358,400 B (warns over 150 KB) |
| `pnpm typecheck` | pass (`@avel/contract` and `@avel/db` built first; a fresh worktree has no `dist`) |
| `pnpm lint` | pass |
| `vitest run` | pass, 30 of 30 |
| `playwright test` | pass, 10 of 10 |
| `tsc -p tsconfig.json --noEmit` (apps/web) | pass after the fix below |

The e2e screenshot is not attached: no tool this run saved one. The boot spec passes at 1280x800.

## What changed (this attempt, on top of a1)

- `apps/web/src/control-room.d.ts`: the module name is now `*/control-room/src/main`. TypeScript doesn't resolve a relative name in an ambient declaration, so a direct `tsc -p apps/web` failed with TS7016. The root `pnpm typecheck` hid it.
- `apps/web/control-room/SOURCE.md`: "29 stylesheets" now reads 28 (main.jsx imports 28).
- Report rewritten. Nothing else; the export is untouched, and the closed-sheet change was not re-applied.

From a1, unchanged: the copy (`control-room/**`), the route `src/routes/index.tsx`, `__root.tsx` (no app.css link), the regenerated `routeTree.gen.ts`, the removal of `src/kit`, `src/modules`, `src/home` and `src/routes/_shell*`, `thinking-orbs` 0.3.2 in `apps/web/package.json` and `pnpm-lock.yaml`, the biome override (`**/control-room/**`), the superseded line in `shell-layout.md` and `kit-v1.9.md`. Export files changed, each named in SOURCE.md's "Changed for apps/web": `src/app/ControlRoom.jsx`, `src/main.jsx`, `tools/check-contract.mjs`.

## Contract to files

T-F7-01: removals. T-F7-02: SOURCE.md. T-F7-03: package.json, check-contract.mjs. T-F7-04/05: route and root. T-F7-06: lazy route. T-F7-07: `showDock` default.

## Deviations

Biome override glob is `**/control-room/**`, because `apps/web/biome.json` sets its own `files.includes`.

## Limitations

Not checked at 390 px or in night mode. No Postgres started; no web test uses it. Budget headroom is about 4 KB.

## Messages received

OSA, relaying Zero: the four a1 test-disputes are settled (a22f1ab, relocked 69fc4e3); don't re-apply the closed-sheet change; stop with needs-cr if over the 350 KB budget; name every changed export file in SOURCE.md. Followed all three: no export change, 354,051 B, all three changed files named. Earlier a1 instructions (SOURCE.md format, the console.log edit, small axe fixes only) were followed in a1.
