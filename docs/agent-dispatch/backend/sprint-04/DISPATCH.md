# DISPATCH: backend/sprint-04: Step 1, cycle 4: jobs on trial, clients, and the factory repo

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Axis · builder: Soap · checker: Rigg · Step 1

## Goals

- We know from our own tests on real Postgres whether DBOS keeps every jobs guarantee, before the engine is built
- The operator can create, list, read and edit clients, and every client write replays safely and leaves one activity row
- A merged factory-repo PR shows up as a factory version, and a merge by anyone but the factory's GitHub App raises an alert and can't be pinned
- The running server signs the operator in, and a failure inside sign-in never prints a token

## Done when

- Step 0 and Step 1 plan, Step 1 tests 10 and 11, written against the Jobs interface: they run, and T-B13's review gives spike 2's verdict against CR-30 section 6
- Step 1 test 2 (CR-43): a client's output has exactly ClientDto's fields and no internal column
- Step 1 test 4 (CR-43): creating a client replays with the same key and body; another body is 409; a duplicate sent while the first runs is 409
- Step 1 test 12: the loader reads factory.yaml at a given SHA; an unmerged change has no effect; a merge by anyone but the factory's GitHub App isn't selectable and raises an alert; a replayed webhook delivery is ignored
- Step 1 test 13, for this sprint's writes: each leaves exactly one activity row

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-B13 | Spike 2: Step 1's jobs and events tests against a small Jobs interface, run over DBOS | full | `t/B13-jobs-spike-dbos` | — |
| T-B14 | The clients routes (8 to 11) and the activity log, carrying Step 1's DTO, idempotency and activity tests | standard | `t/B14-clients-routes` | T-B9 |
| T-B15 | The factory repo loader and the GitHub webhook: factory.yaml by commit, merges as factory versions, alerts on a merge the App didn't make | full | `t/B15-factory-repo-webhook` | T-B9 |
| T-B16 | Sign-in in the real server: main.ts mounts Better Auth from Config, with its resources scoped and its failures value-free | full | `t/B16-sign-in-in-production` | T-B14 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-rigg-t-b13-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b13-build.md` | Soap | build | opus |
| `agent-rigg-t-b13-review.md` | Rigg | review | opus |
| `agent-rigg-t-b14-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b14-build.md` | Soap | build | opus |
| `agent-rigg-t-b14-review.md` | Rigg | review | sonnet |
| `agent-rigg-t-b15-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b15-build.md` | Soap | build | opus |
| `agent-rigg-t-b15-review.md` | Rigg | review | opus |
| `agent-rigg-t-b16-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b16-build.md` | Soap | build | opus |
| `agent-rigg-t-b16-review.md` | Rigg | review | opus |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-B13 | `packages/server/src/platform/jobs/**`, `packages/server/package.json`, `pnpm-lock.yaml`, `docs/quarantine.md` | `packages/server/test/jobs/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts` |
| T-B14 | `packages/server/src/onboarding/**`, `packages/server/src/audit/**`, `packages/server/src/platform/router.ts`, `packages/server/src/main.ts` | `packages/server/test/clients/**` |
| T-B15 | `packages/server/src/platform/webhooks/**`, `packages/server/src/platform/factory-repo/**`, `packages/server/src/knowledge/**`, `packages/server/src/platform/app.ts` | `packages/server/test/factory-repo/**` |
| T-B16 | `packages/server/src/platform/auth/**`, `packages/server/src/main.ts`, `packages/server/src/server.ts` | `packages/server/test/server/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-B13
2. T-B14
3. T-B15
4. T-B16

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```
