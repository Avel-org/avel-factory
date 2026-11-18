# DISPATCH: frontend/sprint-10: The web's end-to-end tests run in CI

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Zero · builder: Fantem · checker: Fenn · Step 1

## Goals

- Every pull request runs apps/web's Playwright suite in CI, and a red budget, axe or route test blocks the merge like any other check

## Done when

- H4's web checks (the bundle budget, accessibility and end-to-end tests) and F6's screenshot and video run in CI on every pull request and on main

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-F11 | The web's end-to-end tests run in CI | standard | `t/F11-web-e2e-ci` | T-F9 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-fenn-t-f11-test-unit.md` | Fenn | tests | sonnet |
| `agent-fantem-t-f11-build.md` | Fantem | build | sonnet |
| `agent-fenn-t-f11-review.md` | Fenn | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-F11 | `.github/workflows/ci.yml` | `tools/repo-checks/test/web-e2e-ci.test.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-F11

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test
```
