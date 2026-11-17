# DISPATCH: frontend/sprint-02: The shell's frame: rail, header and tab bar around Decisions

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- The control room opens inside its shell at every width: the sidebar on a desk, the header on a tablet, the tab bar on a phone

## Done when

- control-room-handoff README, port step 2 (Shell), first half: the frame, the rail, the header and the tab bar from shell-layout.md rev 2 sections 1, 2 and 4, for the routes that exist
- Every width passes the WCAG 2.2 AA check (E17), / stays within 150 KB of JavaScript (E16), and nothing moves at hydration

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F2 | The shell's frame: rail, header and tab bar, from the route tree | standard | `t/F2-shell-frame` | T-F1 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f2-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f2-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f2-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F2 | `apps/web/src/kit/**`, `apps/web/src/modules/system/**`, `apps/web/src/routes/**`, `apps/web/src/routeTree.gen.ts` | `apps/web/test/shell/**`, `apps/web/e2e/shell/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F2

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
