# DISPATCH: frontend/sprint-14: The rest of the first mission, live on contract-mock: Canon, the plan, the build and the release

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- You onboard a mission with Canon, read its plan and package, watch it build, and release the commit its receipt names, all against contract-mock

## Done when

- Each ticket's states (loading, empty, error with the error map's sentence, offline, not found, ready) render against contract-mock under AVEL_API=mock, and each passes WCAG 2.2 AA at 390 and 1280, light and night (E17)
- Every route at most 150 KB of JavaScript gzipped (E16), / at most 235 KB; no money (E15); untrusted text as text

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F18 | Canon onboarding live | standard | `t/F18-canon-live` | T-F14, T-F23, T-F24, T-F25 |
| T-F19 | Plan and dispatch live | standard | `t/F19-plan-dispatch-live` | T-F14, T-F24 |
| T-F20 | Watch the build, live from the streams | standard | `t/F20-build-live` | T-F14, T-F23, T-F24 |
| T-F21 | Gates, findings and the release, live | full | `t/F21-release-live` | T-F14, T-F24 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f18-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f18-build.md` | Fantem | build | opus |
| `agent-fenn-t-f18-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f19-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f19-build.md` | Fantem | build | opus |
| `agent-fenn-t-f19-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f20-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f20-build.md` | Fantem | build | opus |
| `agent-fenn-t-f20-review.md` | Fenn | review | sonnet |
| `agent-fenn-t-f21-test-e2e.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f21-build.md` | Fantem | build | opus |
| `agent-fenn-t-f21-review.md` | Fenn | review | opus |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F18 | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/pages/project/CanonPage.jsx`, `apps/web/control-room/src/pages/project/CanonDock.jsx`, `apps/web/control-room/changes/T-F18.md` | `apps/web/test/canon-live/**`, `apps/web/e2e/canon-live/**` |
| T-F19 | `apps/web/control-room/src/sources/plan.js`, `apps/web/control-room/changes/T-F19.md` | `apps/web/test/plan-dispatch-live/**`, `apps/web/e2e/plan-dispatch-live/**` |
| T-F20 | `apps/web/control-room/src/sources/build.js`, `apps/web/control-room/src/pages/live/**`, `apps/web/control-room/src/pages/operations/ModulePage.jsx`, `apps/web/control-room/src/lib/live.js`, `apps/web/control-room/changes/T-F20.md` | `apps/web/test/build-live/**`, `apps/web/e2e/build-live/**` |
| T-F21 | `apps/web/control-room/src/sources/release.js`, `apps/web/control-room/src/pages/operations/ReceiptPage.jsx`, `apps/web/control-room/changes/T-F21.md` | `apps/web/test/release-live/**`, `apps/web/e2e/release-live/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F18
2. T-F19
3. T-F20
4. T-F21

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
```
