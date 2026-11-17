# DISPATCH: frontend/sprint-04: The sidebar's Projects group: All projects and a row per project

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- The sidebar lists the open projects from the contract, each with its colour dot, and opens each one's page

## Done when

- shell-layout.md revision 3, section 4: the Projects group's head with its All link, and one row per open project from routes 19 and 8 (S6's label, the --cr-id dot), each linked to Progress
- Every new page passes the WCAG 2.2 AA check (E17), and / stays within 150 KB of JavaScript (E16)

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F6 | The sidebar's Projects group: the All link, project rows from routes 19 and 8, and their pages | standard | `t/F6-sidebar-projects` | T-F5 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f6-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f6-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f6-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F6 | `apps/web/src/kit/**`, `apps/web/src/modules/system/**`, `apps/web/src/routes/**`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/styles/project-identity.css`, `apps/web/src/styles/app.css` | `apps/web/test/sidebar-projects/**`, `apps/web/e2e/sidebar-projects/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F6

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
