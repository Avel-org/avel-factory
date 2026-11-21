# DISPATCH: frontend/sprint-13: Your approvals and a mission's start, live on contract-mock

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- What's waiting on you comes from the API, and approving moves the mission on
- You add a client, start a project, and see it on its overview
- CI's end-to-end tests run against the build you ship
- / loads only what Decisions shows, with room again under the 225 KB warning
- contract-mock streams Canon, events and traces, and serves the rest of the mission's routes

## Done when

- Each ticket's states (loading, empty, error with the error map's sentence, offline, not found, ready) render against contract-mock under AVEL_API=mock, and each passes WCAG 2.2 AA at 390 and 1280, light and night (E17)
- / stays at most 235 KB gzipped (CR-W29 decision 6, second amendment); every other route at most 150 KB (E16)
- T-F7-05 is back from quarantine and passes 10 runs in a row against the production build

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F15 | The end-to-end suite runs against the build you ship | full | `t/F15-e2e-production-build` | T-F12 |
| T-F16 | Decisions live: what's waiting on you, approved in one tap | full | `t/F16-decisions-live` | T-F12, T-F14, T-F22 |
| T-F17 | A mission starts: clients, projects and the overview, live | standard | `t/F17-mission-start-live` | T-F12, T-F14, T-F22 |
| T-F23 | contract-mock streams Canon, events and traces (CR-W31 part b) | standard | `t/F23-mock-streams` | T-F22 |
| T-F24 | contract-mock serves the rest of the mission: checkpoints, plan, package, gates, findings and receipt (CR-W31 part c) | standard | `t/F24-mock-mission-reads` | T-F23 |
| T-F25 | / loads only what Decisions shows | standard | `t/F25-home-headroom` | T-F12, T-F14 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f15-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f15-build.md` | Fantem | build | opus |
| `agent-fenn-t-f15-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f16-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f16-build.md` | Fantem | build | opus |
| `agent-fenn-t-f16-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f17-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f17-build.md` | Fantem | build | opus |
| `agent-fenn-t-f17-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f23-test-unit.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f23-build.md` | Fantem | build | opus |
| `agent-fenn-t-f23-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f24-test-unit.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f24-build.md` | Fantem | build | opus |
| `agent-fenn-t-f24-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f25-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f25-build.md` | Fantem | build | opus |
| `agent-fenn-t-f25-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F15 | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md`, `apps/web/src/routes/__root.tsx`, `apps/web/src/auth/api.ts` | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**`, `apps/web/test/sign-in/origin.test.ts`, `apps/web/e2e/sign-in/sign-out-failure.spec.ts`, `apps/web/e2e/support/preview-auth.ts` |
| T-F16 | `apps/web/control-room/src/sources/decisions.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/pages/decisions/**`, `apps/web/control-room/changes/T-F16.md` | `apps/web/test/decisions-live/**`, `apps/web/e2e/decisions-live/**` |
| T-F17 | `apps/web/control-room/src/sources/missions.js`, `apps/web/control-room/src/pages/project/NewProjectPage.jsx`, `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`, `apps/web/control-room/changes/T-F17.md` | `apps/web/test/mission-start/**`, `apps/web/e2e/mission-start/**` |
| T-F23 | `packages/contract-mock/src/**` | `packages/contract-mock/test/mission-streams.test.ts`, `packages/contract-mock/test/world.test.ts` |
| T-F24 | `packages/contract-mock/src/**` | `packages/contract-mock/test/mission-reads.test.ts` |
| T-F25 | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/uploads.js`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/changes/T-F25.md` | `apps/web/e2e/home-headroom/**`, `apps/web/test/sources/samples.test.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F15
2. T-F16
3. T-F17
4. T-F23
5. T-F24
6. T-F25

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
