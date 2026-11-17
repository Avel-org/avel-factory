# DISPATCH: frontend/sprint-05: The shell's sheet: the menu button and More

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- Below 1024px the whole sidebar is one tap away: the header's menu button on a tablet, the More tab on a phone

## Done when

- control-room-handoff README, port step 2 (Shell), second part: shell-layout.md rev 2 section 1's sheet, and section 2's tab bar More, passing flow-sheets' steps
- Every width passes the WCAG 2.2 AA check (E17) with the sheet open and closed, and / stays within 150 KB of JavaScript (E16)

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F3 | The shell's sheet: the menu button and the More tab | standard | `t/F3-shell-sheet` | T-F6 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f3-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f3-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f3-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F3 | `apps/web/src/kit/**` | `apps/web/test/shell-sheet/**`, `apps/web/e2e/shell-sheet/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F3

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
