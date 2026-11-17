# DISPATCH: frontend/sprint-01: Foundation: apps/web runs on contract-mock, in light and night

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- Opening the control room at / shows a server-rendered page in AVEL's look, light or night, with data from contract-mock

## Done when

- control-room-handoff README, port step 1 (Foundation), the slice Javaris scoped: TanStack Start, Tailwind v4 with the handoff's tokens, shadcn/ui init, the oRPC client on contract-mock, one route, light and night
- Its end-to-end test passes the WCAG 2.2 AA check (E17) and / stays within 150 KB of JavaScript (E16)

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F1 | apps/web scaffold: TanStack Start, Tailwind v4, shadcn/ui and the oRPC client on contract-mock | standard | `t/F1-web-scaffold` | T-B0 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f1-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f1-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f1-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F1 | `apps/web/src/**`, `apps/web/vite.config.ts`, `apps/web/tsconfig.json`, `apps/web/components.json`, `apps/web/biome.json` | `apps/web/test/**`, `apps/web/e2e/**`, `apps/web/vitest.config.ts`, `apps/web/playwright.config.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F1

## Commands

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
