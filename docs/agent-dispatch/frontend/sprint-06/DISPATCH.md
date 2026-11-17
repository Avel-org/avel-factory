# DISPATCH: frontend/sprint-06: The shell's rail: collapse it and remember it, and see what's waiting

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- On a desk the sidebar folds to an icon rail and stays that way after a reload, and the Decisions entry shows how many are waiting

## Done when

- control-room-handoff README, port step 2 (Shell), third part: shell-layout.md rev 2 section 2's collapse and counts, and section 1's data-rail, passing flow-keyboard's ⌘B step
- Every width passes the WCAG 2.2 AA check (E17) with the rail open and collapsed, / stays within 150 KB of JavaScript (E16), and nothing moves at hydration

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F4 | The shell's rail: collapse with its button or ⌘B, remembered in avel-rail, and the Decisions badge | standard | `t/F4-shell-rail` | T-F3 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f4-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f4-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f4-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F4 | `apps/web/src/kit/**`, `apps/web/src/modules/system/**`, `apps/web/src/routes/**`, `apps/web/src/routeTree.gen.ts` | `apps/web/test/shell-rail/**`, `apps/web/e2e/shell-rail/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F4

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
