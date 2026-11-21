# DISPATCH: backend/sprint-06: The jobs engine's follow-ups, then Step 2's credentials and model proxy, beside the first-mission routes: status, Decisions, missions and the live streams

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Axis · builder: Soap · checker: Rigg · Step 2

## Goals

- An attempt's tokens work only for that attempt, die when it ends, and are revoked after a restart if they were left behind
- Every model call goes through the proxy, which holds the only key, reserves each request's maximum cost first and refuses a request past the $4 attempt cap or the module or mission budget
- A consumer never hangs a deploy or sits on a claim it doesn't know it holds, and the suite stays green on a loaded machine
- The top bar, Decisions, the missions list, a mission's page and the live feed read real routes, not the mock

## Done when

- T-B18's review findings rigg-01, -03 and -04 and zero-01: each has a locked test, and T-B8-02, T-B19-05 and T-B13-06 pass 5 runs in a row under CPU load
- Design v0.6 Main, Build order step 2: a token left from a killed attempt is revoked after a host restart
- Design v0.6 Main, Build order step 2: the model proxy holds the key and is the meter of record (the main service starts without it)
- Design v0.6 Main, Build order step 8, brought forward to the proxy (decision 1): a reservation the budget can't cover is refused; parallel requests can't overspend; a request past the $4 cap is refused as the cap and one past a budget as the budget; a lost attempt's and an ended Canon session's reservations are released
- Design v0.6 Main, Build order step 5: a reconnect to the live stream resumes with no missing sequence numbers
- Build rules E13 on routes 19, 20, 21, 52, 53, 63, 64, 104 and 109: the happy path against the contract, the error body with its requestId, and the replay on route 20

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-B27 | Jobs engine follow-ups: a consumer's stop and failure edges, the claim number proved, and the timing tests that go red under load | full | `t/B27-jobs-engine-follow-ups` | — |
| T-B21 | Per-attempt credentials: minted hashed, checked on every use, revoked when the attempt ends and by the reaper after a restart | full | `t/B21-attempt-credentials` | T-B27 |
| T-B22 | The model proxy, the meter of record: the only model key, a reservation before each request, and the $4 attempt cap | full | `t/B22-model-proxy` | T-B21 |
| T-B24 | The top bar and Decisions, from real rows: routes 104, 52 and 53 | standard | `t/B24-status-and-decisions` | — |
| T-B25 | Missions: create a draft, list them and open one (routes 19, 20 and 21) | standard | `t/B25-missions` | T-B24 |
| T-B26 | The live streams: the event stream (63) and the trace stream (64) that resume from Last-Event-ID, and an attempt's steps (109) | full | `t/B26-live-streams` | T-B25 |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-rigg-t-b27-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b27-build.md` | Soap | build | opus |
| `agent-rigg-t-b27-review.md` | Rigg | review | opus |
| `agent-rigg-t-b21-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b21-build.md` | Soap | build | opus |
| `agent-rigg-t-b21-review.md` | Rigg | review | opus |
| `agent-rigg-t-b22-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b22-build.md` | Soap | build | opus |
| `agent-rigg-t-b22-review.md` | Rigg | review | opus |
| `agent-rigg-t-b24-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b24-build.md` | Soap | build | opus |
| `agent-rigg-t-b24-review.md` | Rigg | review | sonnet |
| `agent-rigg-t-b25-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b25-build.md` | Soap | build | opus |
| `agent-rigg-t-b25-review.md` | Rigg | review | sonnet |
| `agent-rigg-t-b26-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b26-build.md` | Soap | build | opus |
| `agent-rigg-t-b26-review.md` | Rigg | review | opus |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-B27 | `packages/server/src/platform/jobs/**`, `docs/steps/step-1-done.md` | `packages/server/test/jobs-follow-ups/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts`, `packages/server/test/follow-ups/05-close-releases-pools.test.ts`, `packages/server/test/jobs/retries.test.ts`, `packages/server/test/step-1/done-when.test.ts` |
| T-B21 | `packages/server/src/compute/credentials/**`, `packages/server/src/server.ts` | `packages/server/test/credentials/**` |
| T-B22 | `packages/server/src/metering/**` | `packages/server/test/metering/**` |
| T-B24 | `packages/server/src/factory/decisions/**`, `packages/server/src/platform/status/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` | `packages/server/test/decisions/**`, `packages/server/test/status/**` |
| T-B25 | `packages/server/src/factory/missions/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` | `packages/server/test/missions/**` |
| T-B26 | `packages/server/src/events/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` | `packages/server/test/streams/**` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-B27
2. T-B21
3. T-B22
4. T-B24
5. T-B25
6. T-B26

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```
