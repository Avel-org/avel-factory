# DISPATCH: frontend/sprint-03: The sidebar's pages: Live, Business, Clients, Library, Agents and Settings

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- Every entry in the sidebar's main and Factory groups opens its page, titled as in the prototype

## Done when

- shell-layout.md revision 3, section 4: the unlabelled main group and the small Factory group, each entry with its placeholder page
- Every new page passes the WCAG 2.2 AA check (E17), carries no money (E15), and / stays within 150 KB of JavaScript (E16)

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F5 | The sidebar's main and Factory groups, with placeholder pages from the prototype | standard | `t/F5-sidebar-pages` | T-F2 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f5-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f5-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f5-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F5 | `apps/web/src/kit/**`, `apps/web/src/components/ui/empty.tsx`, `apps/web/src/modules/system/**`, `apps/web/src/routes/**`, `apps/web/src/routeTree.gen.ts`, `apps/web/package.json`, `pnpm-lock.yaml` | `apps/web/test/sidebar-pages/**`, `apps/web/e2e/sidebar-pages/**`, `apps/web/test/shell/nav.test.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F5

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
