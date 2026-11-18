# DISPATCH: backend/sprint-02: Step 1, cycle 2: Effect's language service, the Db service with spike 1 check 2, database errors, a harder lock check

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Axis · builder: Soap · checker: Rigg · Step 1

## Goals

- Effect's language service runs in the editor and in CI on TypeScript 7, so Writing Effect rule 9 holds
- A unique, CHECK or foreign-key violation from Postgres comes back as the contract's 409 or 422 with the constraint's name, never as a 500
- A state change and its events commit together or not at all, and seq follows commit order (spike 1 check 2)
- A builder can't slip a change past the lock check inside a merge commit

## Done when

- AGENTS.md, Writing Effect rule 9: Effect's language service runs in the editor and CI
- Step 0 and Step 1 plan, Step 1 test 6: fed real Postgres errors through the Db service, a unique violation is 409, a CHECK violation is 422 and a stale rowVersion update is 409
- CR-30 section 6, spike 1 check 2: a rolled-back program leaves no event, and Events.append outside a transaction doesn't compile
- Build rules H6: the lock check can't be skipped by a merge commit

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-B2 | The cycle's dependencies: @effect/tsgo in place of @effect/language-service (CR-39), and the database packages for the server | standard | `t/B2-effect-tsgo` | — |
| T-B3 | Database errors to contract codes: unique 409, CHECK 422, foreign key 409 or 422, stale rowVersion 409 | full | `t/B3-db-errors` | T-B2 |
| T-B4 | The Db service: withTransaction, Tx, Events.append and commitWithEvents (spike 1 check 2) | full | `t/B4-db-service` | T-B3 |
| T-B5 | Lock check: merge commits are checked, the build doc is found by the PR's branch, and an F2 relock line is honoured | standard | `t/B5-lock-check-merges` | — |
| T-B6 | The contract's defect code: INTERNAL_SERVER_ERROR, 500, no details; contract 1.0.1 (CR-38) | standard | `t/B6-defect-code` | — |
| T-B7 | Lock check: the tests report may change after the lock, and a merged side branch's commits are checked | standard | `t/B7-lock-check-tests-report` | T-B5 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-rigg-t-b2-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b2-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b2-review.md` | Rigg | review | sonnet |
| `agent-rigg-t-b3-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b3-build.md` | Soap | build | opus |
| `agent-rigg-t-b3-review.md` | Rigg | review | opus |
| `agent-rigg-t-b4-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b4-build.md` | Soap | build | opus |
| `agent-rigg-t-b4-review.md` | Rigg | review | opus |
| `agent-rigg-t-b5-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b5-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b5-review.md` | Rigg | review | sonnet |
| `agent-rigg-t-b6-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b6-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b6-review.md` | Rigg | review | sonnet |
| `agent-rigg-t-b7-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b7-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b7-review.md` | Rigg | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-B2 | `packages/server/package.json`, `packages/server/tsconfig.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml`, `docs/design/Outside sources and what we took.md` | `tools/repo-checks/test/dependencies.test.ts`, `tools/repo-checks/test/effect-check.test.ts`, `tools/repo-checks/test/fixtures/effect/**` |
| T-B3 | `packages/server/src/platform/db/errors.ts`, `packages/server/src/platform/errors.ts` | `packages/server/test/db/**` |
| T-B4 | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/db/tx.ts`, `packages/server/src/platform/db/events.ts`, `packages/server/src/platform/db/index.ts` | `packages/server/test/db-service/**` |
| T-B5 | `tools/repo-checks/src/**` | `tools/repo-checks/test/locks-merges.test.ts` |
| T-B6 | `packages/contract/src/errors.ts`, `packages/contract/src/version.ts`, `docs/generated/**` | `packages/contract/test/defect-code.test.ts` |
| T-B7 | `tools/repo-checks/src/**` | `tools/repo-checks/test/locks-tests-report.test.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-B2
2. T-B3
3. T-B4
4. T-B5
5. T-B6
6. T-B7

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```
