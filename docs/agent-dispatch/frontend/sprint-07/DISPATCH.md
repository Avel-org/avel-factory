# DISPATCH: frontend/sprint-07: The control room from the design export runs at /, and the old shell is gone

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- Opening the web app shows Javaris's control room design, every screen of it, in place of the shell apps/web built

## Done when

- CR-W29's done-when: / shows the export's Decisions home, and every page in its registry opens by its #/ route
- / loads at most 150 KB of JavaScript gzipped (E16); every screen passes WCAG 2.2 AA (E17); no money (E15); check-contract.mjs passes

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F7 | The control room runs at / from the design export, and the old shell is gone | standard | `t/F7-control-room-port` | T-F2 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f7-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f7-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f7-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F7 | `apps/web/control-room/**`, `apps/web/src/routes/**`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/router.tsx`, `apps/web/src/kit/**`, `apps/web/src/modules/**`, `apps/web/src/home/**`, `apps/web/src/control-room.d.ts`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/package.json`, `pnpm-lock.yaml`, `biome.json`, `docs/ui-contracts/shell-layout.md`, `docs/ui-contracts/kit-v1.9.md` | `apps/web/test/control-room/**`, `apps/web/e2e/control-room/**`, `apps/web/e2e/budget.spec.ts`, `apps/web/test/shell/**`, `apps/web/e2e/shell/**`, `apps/web/test/home-loader.test.ts`, `apps/web/test/home-loader-states.test.ts`, `apps/web/test/home-view.test.ts`, `apps/web/e2e/home.spec.ts`, `apps/web/e2e/states.spec.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F7

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
