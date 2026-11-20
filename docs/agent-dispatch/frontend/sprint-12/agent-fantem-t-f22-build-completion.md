status: done
ticket: T-F22

# T-F22 · build · Fantem: contract-mock walks a mission from draft to release (CR-W31 part a)

Branch `t/F22-mock-mission-world`, on the lock commit `ef3ac6d`. Two build commits: `7c1547e` (the routes and the state module) and `7afb166` (the state module moved into `world.ts` so Node's loader finds it). Not pushed.

## Pre-flight

**Before any change** (D3, Part 6 step 3): `pnpm --filter @avel/contract-mock test` failed to resolve `@avel/contract` until `pnpm build` had run. After the build it showed 34 failed and 19 passed: every locked T-F22 test failed, and the existing `world.test.ts` and `auth.test.ts` passed. The web suite passed: vitest 47 of 47, Playwright 303 of 303.

**Verification**, Part 7's commands in order, on `7afb166`, with my own Postgres (`scripts/pg-local.sh start`):

| # | Command | Result |
| --- | --- | --- |
| 1 | `pnpm build` | exit 0 |
| 2 | `pnpm typecheck` | exit 0 |
| 3 | `pnpm lint` | exit 0: 308 files checked, 6 warnings, all in `apps/web/e2e/**` (they were there before; none in this ticket's files) |
| 4 | `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` | exit 0: vitest 8 files, 47 passed; Playwright 303 passed (12.8 min) |
| 5 | `pnpm --filter @avel/contract-mock test` | exit 0: 4 files, 53 passed (the 34 locked T-F22 tests and the 19 that were there) |
| 6 | `pnpm build` | exit 0 |
| 7 | `pnpm typecheck` | exit 0 |
| 8 | `pnpm lint` | exit 0: the same 6 warnings in `apps/web/e2e/**` |

The first run of command 4, on `7c1547e`, failed: Playwright's dev server couldn't start (`ERR_MODULE_NOT_FOUND` for `src/mission-world.js`). `7afb166` fixes it (see Deviations). Every other command passed on that first run too.

## What changed

- **`packages/contract-mock/src/world.ts`**
  - Q-0.1a's three answers are now one exported `KIND_OPTIONS`, used by the sample world's question and the new missions' question.
  - New section, **the mission state module**: a `LiveMission` record per mission that route 20 or `seedMission` makes.
    - `newMission` makes a route 20 draft.
    - `seedMission(ctx, id, stage, operatorId)` makes the same draft, then walks it with the moves the routes make, up to `stage`.
    - The moves: `answerQuestion`, `approveCheckpoint`, `finalize`, `commitPackage`, `approvePass` and `release`. The four with no part (a) route are made only by the seed: Canon starting the interview, the build starting, Gate 5's receipt, and the delivery.
    - The reads are computed from the record, so a read never changes it: `missionDto`, `listRow`, `detail`, `moduleRun`, `pendingRows`, `rowOf`, `canFinalize`, `openCheckpoint` and `allowedMoves`.
- **`packages/contract-mock/src/mock.ts`**
  - `MockRoute` now names 8, 9, 10, 19, 20, 21, 28, 29, 30, 40, 44, 52, 53, 54, 104, 108 and 114, and one route table maps method and path to them. `failNext` and `requests()` take and record those numbers.
  - Every part (a) write (9, 20, 28, 29, 30, 40, 44 and 114, with 54 as before) requires an `Idempotency-Key`, replays its first response, and answers a reused key with a different body with 409 `IDEMPOTENCY_KEY_REUSED`.
  - New handlers, all through `implement(contract)`:
    - `clients.create` (9) and `clients.get` (10).
    - `missions.create` (20), `finalize` (28), `approvePass` (29) and `release` (30).
    - `gate0.approveCheckpoint` (40) and `gate0.answerQuestion` (44).
  - Changed handlers:
    - Route 8 lists only `?kind=` (`client` by default), as its contract summary and CR-W22 say.
    - Route 19 lists the live missions too, and route 21 serves them.
    - Route 52 adds the live missions' rows, under the same `missionId` filter.
    - Route 104's `needsYouCount` counts what route 52 lists: world rows, open unexpired proposals, factory changes and live rows.
    - Route 108 serves the sample module M3 on a live mission once its plan exists.
    - Route 114 checks a live mission first: `GATE1_NOT_PASSED` before the render, 422 once it's committed, 409 on a stale `packageHash`. Then it falls back to the sample world, as before.
  - `mock.seedMission(stage)` puts AVEL's internal client into route 8's store, seeds the one mission (a fixed ID, so a second seed replaces the first) and returns `{ missionId, clientId }`.
  - `reset()` also clears the clients and missions the routes made.
- **`packages/contract-mock/src/index.ts`**: exports `MissionStage`, and its header names part (a).
- **This report.**

## Contract to files

| Requirement | Where |
| --- | --- |
| T-F22-01: a client from route 9 shows on 8 and 10, and a mission from route 20 shows on 19 and 21 as a draft | `mock.ts` (`clients.create` and `get`, `missions.create`, `list` and `get`); `world.ts` `newMission`, `listRow`, `detail` |
| T-F22-01: an approval on 28, 29, 30, 40 or 44 removes its row from 52, and other missions' rows stay | `world.ts` `pendingRows` (rows computed from the record); `mock.ts` `liveRows` in `listPending` |
| T-F22-02: each route's body passes its contract output schema, with `X-Request-Id` and `X-Contract-Version` | all handlers go through `implement(contract)` and OpenAPIHandler (output validation); `respond()` sets both headers |
| T-F22-03: 0.1 → 0.4 → finalize → package commit; Gate 5 → pass approval → release → `delivering`; reads and the clock move nothing; 104 counts 52 | `world.ts` moves and `seedMission`; `mock.ts` `health.status` |
| T-F22-04: 422 `INVALID_TRANSITION` with `state` and `allowed`; 409 `STALE_VERSION` on `rowVersion`, `version`, `receiptHash` and `packageHash`; replay; key reuse; no key is 400 | `mock.ts` handlers' checks and the `KEYED_WRITES` block; `world.ts` `allowedMoves`, `canFinalize`, `rowOf` |
| T-F22-05: MockFailure on every part (a) route, network failures included; recorded requests name the route by number | `mock.ts` `MockRoute`, `ROUTES`, `routeOf` (failNext runs before any check, as before) |
| E2 / CR-W31 Axis condition 1: stays `implement(contract)` with output validation | every new route is an `os.<group>.<name>.handler` |
| CR-W31 condition 2: moves follow the contract's value lists | states from `MissionState`, `CheckpointState`, `PackageCommitState`, `JourneyStepState`; codes only from `errorMap` and `dispatchPackageCommitErrorMap` |

## Deviations

1. **One build commit, not one per task.** Part 6 asks for a checkpoint after each task. All five tasks rest on the same state module and the same handlers, so the build landed in one commit (`7c1547e`). Each task's verify command was then run, and all five pass.
2. **The state module lives in `world.ts`, not a file of its own** (`7afb166`). I first wrote it as `src/mission-world.ts`, imported as `./mission-world.js`. Vitest and tsc resolve that to the `.ts` file, but Node's own loader doesn't. `apps/web/vite.config.ts` loads the mock through Node's loader, so Playwright's dev server failed to start. The package's `imports` map (`#world` and the rest) is the only path Node resolves to `.ts` here. Adding `#mission-world` would mean changing `packages/contract-mock/package.json`, which this ticket may not touch. So the module moved, unchanged, into `world.ts` (`#world`), under its own heading. Its gate strip is named `missionGatesOf`, so it doesn't clash with the sample world's `gatesOf`. For Axis's fidelity read: the section starts at "the mission state module" in `world.ts`.
3. **Territory wording.** Part 5 lists `packages/contract-mock/src/**` under "may change" and `packages/**` under "never change". I read the specific grant as the ticket's (CR-W31 lets the frontend lane change `packages/contract-mock/src/**` for T-F22). Nothing outside `packages/contract-mock/src/**` and this report changed. `package.json`, the contract and the locked tests are untouched.

## Limitations

**What the contract didn't say, and what I chose.** These are choices inside the contract's value lists. Axis's fidelity check should read them.
- `INVALID_TRANSITION.details.allowed` is the mission states the mission can move to now by a part (a) route:
  - `["approved"]` once 0.4 is approved;
  - `["awaiting_release"]` while a pass waits on its approval;
  - `["delivering"]` while a release waits;
  - otherwise `[]`, as CR-W2 gives for a decided proposal.

  On routes 40 and 114, `state` is the checkpoint's or the package commit's state. On route 44 it's left out, because a question has no state column.
- **The stages:**
  - `draft` is state `draft`, kind unset, with Q-0.1a open.
  - `0.1` to `0.4` are `onboarding`, with kind `internal` and AVEL as the client.
  - `finalized` is `rendered` (finalize answers `rendered`: the render and Gate 1 run at once in the mock).
  - `building` is `running`.
  - `gate5` is `deciding` with a pass receipt.
  - `awaiting_release` has a verified receipt.
  - `delivered`.
- **Moves no part (a) route makes:**
  - Answering Q-0.1a on a draft sets the kind but leaves the mission in `draft`. Canon starting the interview is route 34, part (b).
  - The package commit (114) answers `committing` and leaves the mission `rendered`.
  - Release leaves it `delivering`.
  - Only `seedMission` reaches `running` and `delivered`.
- **Q-0.1a's answers:**
  - "Client project" sets the kind only when route 20 was given a known `clientId`. Otherwise it waits for Q-0.1b, which isn't in part (a).
  - A `clientId` route 20 doesn't know is ignored rather than refused.
- On route 30, a `passApprovalId` that doesn't match the pass approval is 400 `BAD_REQUEST` with `details.field: "passApprovalId"`, because `StaleVersionDetails` has no such field. It isn't tested.

**Not covered:**
- The sample world's own rows (Control room's checkpoint and plan, Field app's question, Booking fix's pass, Spring's release) aren't approvable on 28, 29, 30, 40 or 44: those answer 404. Route 114 still settles Fleet portal's row, as before.
- Route 21 returns `deliveries: []` and `onboarding.session: null` for the live missions. Deliveries are part (c).
- Route 108 serves the sample module M3, with its attempt IDs, on the live mission.
- No route 52 row expires, and `asOfSeq` is 0.

**Other:**
- No end-to-end screenshot: this ticket changes no screen (the dev world at `/` is unchanged, because nothing is seeded by default), and its tests are unit tests.
- The 6 lint warnings are in `apps/web/e2e/**`, outside this ticket. They were there before.

## Messages received

None.
