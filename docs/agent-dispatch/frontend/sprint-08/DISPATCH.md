# DISPATCH: frontend/sprint-08: The control room loads each page's code when it opens, and / holds to 220 KB of JavaScript

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- Opening the web app shows Javaris's control room design, every screen of it, in place of the shell apps/web built

## Done when

- CR-W29's done-when: / shows the export's Decisions home, and every page in its registry opens by its #/ route
- / loads at most 220 KB of JavaScript gzipped (E16, CR-W29 decision 6 as amended; 150 KB returns with the wiring); every screen passes WCAG 2.2 AA (E17); no money (E15); check-contract.mjs passes

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F8 | The control room loads each page's code when it opens, and / holds to 220 KB of JavaScript | standard | `t/F8-control-room-budget` | T-F7 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f8-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f8-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f8-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F8 | `apps/web/control-room/src/**`, `apps/web/control-room/SOURCE.md`, `apps/web/src/routes/**`, `apps/web/src/control-room.d.ts`, `apps/web/vite.config.ts` | `apps/web/e2e/control-room-budget/**`, `apps/web/e2e/budget.spec.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F8

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
