status: done
ticket: T-F22

# T-F22 tests: completion report (Fenn)

Start commit: `45000c9bf81d59b40c6dfaafc13a666f9ed68117` (branch `t/F22-mock-mission-world`). Tests only; no product code touched.

## Pre-flight

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 (the new tests typecheck against today's mock: they reach the unbuilt API through local casts) |
| `pnpm lint` | exit 0, 6 warnings, all there before my files |
| `pnpm --filter @avel/web exec vitest run` | 8 files, 47 tests passed |
| `pnpm --filter @avel/web exec playwright test` | ran green as far as I watched (tail only; the run was capped at 300 s) |
| `pnpm --filter @avel/contract-mock test` before my files | 2 files, 19 passed |
| `pnpm --filter @avel/contract-mock test` with my files | 34 failed, 19 passed (below) |

`pnpm --filter @avel/contract-mock test` needs `pnpm build` first: `@avel/contract` resolves to `dist`.
I didn't start Postgres: this ticket's tests are mock-only and use no database.

## Failing first

Run on the start commit, `pnpm --filter @avel/contract-mock test`: `Tests  34 failed | 19 passed (53)`. All 34 failures are mine; the 19 passes are the existing `auth.test.ts` and `world.test.ts`. The failures by cause:

- 24 tests stop at `Error: mock.seedMission("<stage>") is not built: the world can't be seeded` (stages draft, 0.1, 0.2, 0.4, finalized, building, gate5, awaiting_release).
- Route 9, 20 and the reads that depend on them stop at `AssertionError: expected 404 to be 201` (the routes aren't served).
- Route 9 and the 104 and 108 failures: `AssertionError: route 9: expected 404 to be 503` (failNext keys 9, 10, 20 and so on aren't routed).
- Network failure: `AssertionError: promise resolved "{ status: 404, …(3) }" instead of rejecting`.
- Recorded routes: `AssertionError: expected [ Array(30) ] to deeply equal [ 8, 9, 10, 19, 20, 21, 28, 29, …(22) ]` (route is null for 9, 10, 20, 21, 28 to 30, 40, 44, 104, 108, 114).
- Missing key on a write: `AssertionError: expected 404 to be 400`.

Failing test names and first errors, from `/tmp/fenn/start.txt`:

```
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > an error on a part (a) route is the contract's body with the same two headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 10 answers 200, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 104 answers 200, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 108 answers 200, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 114 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 19 answers 200, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 20 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 21 answers 200, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 28 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 29 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 30 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 40 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 44 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 52 answers 200, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 8 answers 200, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-02: each part (a) route answers with a body its contract output accepts > route 9 answers 201, validated, with its headers
 FAIL  test/mission-routes.test.ts > T-F22-04: the state machine, stale versions and replay > a move the state machine doesn't allow is 422 INVALID_TRANSITION with the allowed moves
 FAIL  test/mission-routes.test.ts > T-F22-04: the state machine, stale versions and replay > a replayed Idempotency-Key returns the first response and moves nothing twice
 FAIL  test/mission-routes.test.ts > T-F22-04: the state machine, stale versions and replay > a stale receipt hash is 409 STALE_VERSION on receiptHash, and a stale package hash on packageHash
 FAIL  test/mission-routes.test.ts > T-F22-04: the state machine, stale versions and replay > a stale rowVersion is 409 STALE_VERSION naming rowVersion and its current value
 FAIL  test/mission-routes.test.ts > T-F22-04: the state machine, stale versions and replay > the same key with a different body is 409 IDEMPOTENCY_KEY_REUSED, and a write with no key is 400
 FAIL  test/mission-routes.test.ts > T-F22-05: MockFailure and the recorded requests > fails every part (a) route with a network failure that rejects with a TypeError
 FAIL  test/mission-routes.test.ts > T-F22-05: MockFailure and the recorded requests > fails the next call to every part (a) route with any status and code, and only that call
 FAIL  test/mission-routes.test.ts > T-F22-05: MockFailure and the recorded requests > records each request with its route number, the failed ones and the network failures too
 FAIL  test/mission-world.test.ts > T-F22-01: reads follow writes > a client made on route 9 is listed by route 8 and read by route 10
 FAIL  test/mission-world.test.ts > T-F22-01: reads follow writes > a mission made on route 20 is listed by route 19 and read by route 21, as a draft
 FAIL  test/mission-world.test.ts > T-F22-01: reads follow writes > an approval on route 28 removes the plan_finalize row from route 52
 FAIL  test/mission-world.test.ts > T-F22-01: reads follow writes > an approval on route 29 removes the pass_approval row from route 52
 FAIL  test/mission-world.test.ts > T-F22-01: reads follow writes > an approval on route 30 removes the release row from route 52
 FAIL  test/mission-world.test.ts > T-F22-01: reads follow writes > an approval on route 40 removes the checkpoint's row from route 52
 FAIL  test/mission-world.test.ts > T-F22-01: reads follow writes > an approval on route 44 removes the question's row from route 52, and leaves the other missions' rows
 FAIL  test/mission-world.test.ts > T-F22-03: a mission walks from checkpoint 0.1 to release, only by the routes > holds a seeded mission still: no clock or read moves it, and route 104 counts what route 52 lists
 FAIL  test/mission-world.test.ts > T-F22-03: a mission walks from checkpoint 0.1 to release, only by the routes > moves 0.1, 0.2, 0.3, 0.4, finalization and the package commit, one route at a time
 FAIL  test/mission-world.test.ts > T-F22-03: a mission walks from checkpoint 0.1 to release, only by the routes > moves Gate 5 to a pass approval, then a release, and the mission is delivered
AssertionError: expected 400 to be 200 // Object.is equality
AssertionError: expected 404 to be 200 // Object.is equality
AssertionError: expected 404 to be 201 // Object.is equality
AssertionError: expected 404 to be 400 // Object.is equality
AssertionError: expected 404 to be 409 // Object.is equality
AssertionError: expected [ Array(30) ] to deeply equal [ 8, 9, 10, 19, 20, 21, 28, 29, …(22) ]
AssertionError: promise resolved "{ status: 404, …(3) }" instead of rejecting
AssertionError: route 9: expected 404 to be 503 // Object.is equality
Error: mock.seedMission("0.1") is not built: the world can't be seeded
Error: mock.seedMission("0.2") is not built: the world can't be seeded
Error: mock.seedMission("0.4") is not built: the world can't be seeded
Error: mock.seedMission("awaiting_release") is not built: the world can't be seeded
Error: mock.seedMission("building") is not built: the world can't be seeded
Error: mock.seedMission("draft") is not built: the world can't be seeded
Error: mock.seedMission("finalized") is not built: the world can't be seeded
Error: mock.seedMission("gate5") is not built: the world can't be seeded
```

Routes 8, 19 and 52 are served today, so each of their tests also needs the new behaviour (a client made on 9, a mission made on 20, a seeded mission's rows) and fails on it. I checked: none of the 34 passed.

## What changed

- `packages/contract-mock/test/mission-world.test.ts`: T-F22-01 (7 tests: 9 to 8 and 10, 20 to 19 and 21, and the removal from route 52 for 44, 40, 28, 29 and 30) and T-F22-03 (3 tests: 0.1 to 0.4, finalization and the package commit; Gate 5 to pass approval, release and delivered; nothing moves by a read or the clock, and route 104's needsYouCount follows route 52).
- `packages/contract-mock/test/mission-routes.test.ts`: T-F22-02 (15 route cases and an error-body test: each route's body against the contract's own output schema, with X-Request-Id and X-Contract-Version), T-F22-04 (5 tests: 422 with `allowed`, 409 on rowVersion, receiptHash and packageHash, key replay, key reuse and no key) and T-F22-05 (3 tests: any status and code, `times`, a network failure, and recorded route numbers on all 15 routes).
- This report.

## Contract to files

| Task | Where |
| --- | --- |
| T-F22-01 | `mission-world.test.ts`, describe "T-F22-01" |
| T-F22-02 | `mission-routes.test.ts`, describe "T-F22-02" |
| T-F22-03 | `mission-world.test.ts`, describe "T-F22-03" |
| T-F22-04 | `mission-routes.test.ts`, describe "T-F22-04" |
| T-F22-05 | `mission-routes.test.ts`, describe "T-F22-05" |

## Deviations

1. **The tests live in `packages/contract-mock/test/`, not `apps/web/test`.** Part 5 names only those two files, and Part 4's verify command (`@avel/web` vitest and playwright) doesn't run them. They run under `pnpm --filter @avel/contract-mock test`, which Part 7 lists. The lead should add that command to the lock check for T-F22.
2. **No end-to-end test, no screenshot or video, no axe check.** The ticket's scope is the mock's routes; it has no screen, and Part 5 gives no e2e path. The loading, empty, error and ready states of a screen belong to sprint-13.
3. **The ticket doesn't name a way to seed the world "at a state a test picks".** I asked for one, and the lead should rule on it at the lock: `mock.seedMission(stage)` returns `{ missionId, clientId }`, with stages `draft | 0.1 | 0.2 | 0.3 | 0.4 | finalized | building | gate5 | awaiting_release | delivered`. Tests then act only through HTTP routes. If Zero prefers another seam (a `createMock` option, say), this is a `test-dispute` on the name only.
4. **`MockRoute` and `failNext` need the new numbers.** The tests cast `failNext` and `requests()[n].route` to plain numbers 9, 10, 20, 21, 28, 29, 30, 40, 44, 104, 108 and 114.

## Limitations

Behaviour I asserted that the contract implies but doesn't spell out. Each is a guess the lead may strike or Axis may correct at fidelity review; none is a loosened check:

- A draft mission has one pending `checkpoint_question` row (Canon's first question, as the world's Field app has).
- Checkpoint rows appear one at a time, 0.1 to 0.4; after 0.4, `plan_finalize`; after finalizing, `dispatch_package_commit` (Gate 1 passed at render) and nothing else.
- Mission states seen on route 21: draft; `onboarding` through 0.4; `approved` or `rendered` after finalizing; `reviewing` or `deciding` at Gate 5; `awaiting_release` after a pass approval; `delivering` or `delivered` after release. Two of these are written as either-or because the contract's value list doesn't pick.
- 422 `INVALID_TRANSITION` carries `details.allowed` as an array and `details.state` as the mission's state; I don't assert which moves are allowed (the contract doesn't list them for these routes).
- Seeding at `gate5` gives a pass verdict, so the release row appears only after route 29, with `passApprovalId` set.
- Route 108 is asked with `world.MODULE_RUN.ref` against the seeded mission's ID.
- No test covers the streams (34, 63, 64), step-up, plain-text rendering or a password prompt: this ticket has no screen, and no route in it takes a credential.
- The web's playwright run was capped; I read only its tail.

## Lock line

- T-F22: packages/contract-mock/test/mission-world.test.ts, packages/contract-mock/test/mission-routes.test.ts @ <branch tip>

## Messages received

None.
