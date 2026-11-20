# DISPATCH: backend/sprint-05: Step 1, cycle 5: the jobs engine, event consumers, the review follow-ups, and Step 1 done

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Axis · builder: Soap · checker: Rigg · Step 1

## Goals

- A job survives a killed or frozen worker, retries on the planned backoff and ends dead after 5 tries, on our own engine and tables
- Jobs in one mission run one at a time, and the database refuses a second claim in the same mission
- A consumer acts on every committed event once, in order, and picks up where it left off after a crash or a restart
- The running server serves the webhook, answers every sign-in failure with the contract's body, and shuts down without a stuck pool
- Every Step 1 done-when test has a passing test behind it, and the report says so

## Done when

- Step 0 and Step 1 plan, Step 1 test 10 (jobs), held by T-B13's locked tests over the hand-built engine (CR-30 option A)
- Step 1 test 11 (events): seq order equals commit order with no gaps a reader can miss; a rolled-back transaction leaves no event and no job; two copies of one consumer never both act on an event
- CR-44: at most one claimed job per partition key, enforced by the database
- Step 1 test 3 (errors) and test 12 (factory repo) hold in the running server, not only in createApp
- C5: Step 1's done-when report maps each of tests 1 to 13 (2, 4 and 13 as CR-43 restates them) to a passing test

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-B17 | The hand-built jobs engine under T-B13's relocked tests, with CR-44's partition key | full | `t/B17-jobs-engine` | — |
| T-B18 | Event consumers: claimed, resumable, compare-and-swap cursors that act on each committed event once | full | `t/B18-event-consumers` | T-B17 |
| T-B19 | Platform follow-ups: the P2s from T-B14, T-B15 and T-B16's reviews, with the webhook mounted in the running server | full | `t/B19-platform-follow-ups` | T-B15, T-B16 |
| T-B20 | Step 1's done-when tests and report (C5): each of tests 1 to 13 traced to a passing test, and the running server end to end | full | `t/B20-step-1-done` | T-B17, T-B18, T-B19 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-rigg-t-b17-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b17-build.md` | Soap | build | opus |
| `agent-rigg-t-b17-review.md` | Rigg | review | opus |
| `agent-rigg-t-b18-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b18-build.md` | Soap | build | opus |
| `agent-rigg-t-b18-review.md` | Rigg | review | opus |
| `agent-rigg-t-b19-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b19-build.md` | Soap | build | opus |
| `agent-rigg-t-b19-review.md` | Rigg | review | opus |
| `agent-rigg-t-b20-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b20-build.md` | Soap | build | opus |
| `agent-rigg-t-b20-review.md` | Rigg | review | opus |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-B17 | `packages/server/src/platform/jobs/**`, `packages/db/src/**`, `packages/db/drizzle/**`, `packages/db/test/helpers/changes.ts`, `docs/generated/erd.md`, `docs/design/DATABASE.md`, `docs/design/Jobs and workers.md`, `docs/design/CR-30 Effect in the server, durable jobs and spans.md`, `docs/quarantine.md` | `packages/server/test/jobs/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts` |
| T-B18 | `packages/server/src/platform/jobs/**` | `packages/server/test/consumers/**` |
| T-B19 | `packages/server/src/server.ts`, `packages/server/src/main.ts`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/auth/**`, `packages/server/src/platform/webhooks/**`, `packages/server/src/platform/factory-repo/**`, `packages/server/src/knowledge/**`, `packages/server/src/onboarding/**` | `packages/server/test/follow-ups/**` |
| T-B20 | `docs/steps/step-1-done.md`, `packages/server/src/**` | `packages/server/test/step-1/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-B17
2. T-B18
3. T-B19
4. T-B20

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```
