# DISPATCH: frontend/sprint-11: The control room keeps the rules that don't bend

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
| T-F10 | The control room keeps the rules that don't bend | standard | `t/F10-control-room-rules` | T-F11 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f10-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f10-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f10-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F10 | `apps/web/control-room/src/**`, `apps/web/control-room/SOURCE.md`, `apps/web/package.json` | `apps/web/test/control-room-rules/**`, `apps/web/e2e/control-room-rules/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F10

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
