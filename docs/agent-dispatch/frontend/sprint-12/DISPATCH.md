# DISPATCH: frontend/sprint-12: The ground the first mission's screens stand on

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- contract-mock walks one mission from draft to release, so the first screens run against it
- Signed out, every path lands on Sign in. Signing in returns you where you were going, and Settings signs you out
- Every contract route has a typed call and every error code a plain sentence, and nothing on screen changes yet

## Done when

- T-F14: no screen of the control room imports fetch or the client; each screen's data comes through its source module, and every screen renders as it does on main
- Step 0 and Step 1 plan, test 7 as the web shows it (the 11th failed sign-in is refused, against the mock), and login.md's LG scenarios that this ticket owns pass under AVEL_API=mock

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F12 | Sign-in, the session guard and sign-out | full | `t/F12-sign-in` | T-F10 |
| T-F14 | The data layer, and one source per screen group | full | `t/F14-data-layer-seam` | T-F10 |
| T-F22 | contract-mock walks a mission from draft to release (CR-W31 part a) | standard | `t/F22-mock-mission-world` | — |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f12-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f12-build.md` | Fantem | build | opus |
| `agent-fenn-t-f12-review.md` | Fenn | review | opus |
| `agent-fenn-t-f14-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f14-build.md` | Fantem | build | opus |
| `agent-fenn-t-f14-review.md` | Fenn | review | opus |
| `agent-fenn-t-f22-test-unit.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f22-build.md` | Fantem | build | opus |
| `agent-fenn-t-f22-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F12 | `apps/web/src/auth/**`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/login.tsx`, `apps/web/src/routeTree.gen.ts`, `apps/web/control-room/src/pages/settings/SettingsPage.jsx`, `apps/web/control-room/SOURCE.md`, `apps/web/vite.config.ts` | `apps/web/test/sign-in/**`, `apps/web/e2e/sign-in/**`, `apps/web/e2e/support/auth.setup.ts`, `apps/web/playwright.config.ts`, `apps/web/e2e/budget.spec.ts`, `apps/web/e2e/control-room/prod.spec.ts`, `apps/web/e2e/control-room-budget/**`, `apps/web/e2e/support/preview-auth.ts` |
| T-F14 | `apps/web/src/data/**`, `apps/web/control-room/src/lib/api.js`, `apps/web/control-room/src/lib/stream.js`, `apps/web/control-room/src/sources/**`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/operations.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/changes/T-F14.md` | `apps/web/test/data/**`, `apps/web/test/sources/**`, `apps/web/e2e/sources/**` |
| T-F22 | `packages/contract-mock/src/**` | `packages/contract-mock/test/mission-world.test.ts`, `packages/contract-mock/test/mission-routes.test.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F12
2. T-F14
3. T-F22

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
