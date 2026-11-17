# DISPATCH: backend/sprint-01: Step 1, cycle 1: setup and dependencies, then the server shell with spike 1 folded in

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Axis · builder: Soap · checker: Rigg · Step 1

## Goals

- Every dependency both scaffolds need is installed once, and CI refuses a builder who leaves the ticket's files or edits a locked test
- The server answers GET /api/health, with X-Request-Id, X-Contract-Version and the contract's error body on every response
- Spike 1's edge checks (CR-30 section 6, checks 1, 3 and 4) pass on Effect 4.1, oRPC 1.16.2 and Hono without patches

## Done when

- Step 0 and Step 1 plan, Step 1 test 1: CI is green; the contract builds and the OpenAPI document is generated from it
- Step 0 and Step 1 plan, Step 1 test 3: a typed error returns { code, message, details?, requestId }, requestId matches X-Request-Id, and every response carries X-Contract-Version
- Build rules H6: the lock check runs on every PR

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-B0 | Setup: CODEOWNERS, the CI lock check, and every scaffold dependency installed once | standard | `t/B0-setup-deps` | — |
| T-B1 | Server shell with spike 1: health, X-Request-Id, X-Contract-Version, the error body through effectHandler | standard | `t/B1-server-shell` | T-B0 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-rigg-t-b0-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b0-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b0-review.md` | Rigg | review | sonnet |
| `agent-rigg-t-b1-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b1-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b1-review.md` | Rigg | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-B0 | `.github/CODEOWNERS`, `.github/workflows/locks.yml`, `tools/repo-checks/src/**`, `tools/repo-checks/package.json`, `tools/repo-checks/tsconfig.json`, `tools/repo-checks/vitest.config.ts`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `packages/server/package.json`, `packages/server/tsconfig.json`, `packages/server/vitest.config.ts`, `apps/web/package.json`, `docs/design/Outside sources and what we took.md` | `tools/repo-checks/test/**` |
| T-B1 | `packages/server/src/**` | `packages/server/test/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-B0
2. T-B1

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```
