status: done
ticket: T-F23

# T-F23 build: report (Fantem)

This is build a2. It reran Part 7 on build a1's commits (`bd89dd0`) after Fenn's tests a2 (`1b98b89`) and Zero's F2 relock (`39f71ed`), as the lead's F2 note asks. It redid nothing. All of `packages/contract-mock/test/mission-streams.test.ts` (11 tests) and `world.test.ts` pass, including the rewritten route 63 test (T-F23-06). a2 changed no code. Its only commit is this report.

Checks on the branch before the run:
- `git diff 1b98b89 HEAD -- packages/` is empty: the locked tests are exactly as relocked.
- `git diff bd89dd0 HEAD -- packages/contract-mock/src` is empty: the code is a1's build.
- `HEAD..origin/main` is empty: main (`b7fac15`) is already merged in.

## Pre-flight

- Postgres: `scripts/pg-local.sh start` (database `avel_frontend_sprint_13_t_f23_build_a2_…`).
- Node: v24.22.2 from `~/.nvm`, because the shell had no `node`. Dependencies came from `pnpm install --offline --frozen-lockfile`, with no change to the lockfile.

Part 7, in order, on `39f71ed`:

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0; 6 warnings, all already in `apps/web/e2e/**`, none in my files |
| `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` | exit 0; vitest 8 files, 47 passed; Playwright 303 passed, 1 skipped (16.9 min) |
| `pnpm --filter @avel/contract-mock test` | exit 0; 5 files, 64 passed (also 64/64 on an earlier run in this session) |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0; the same 6 warnings |

## What changed

Build a2 changed only this report. Everything below is build a1's commit `bd89dd0`, unchanged:

- `packages/contract-mock/src/world.ts` (the mission state module):
  - `Ctx` gains `emit(event)`; `NewEvent` is an event before its `seq`.
  - The part (a) moves now emit their events (the changed moves are listed under Contract to files). `seedMission` runs the same moves with a silent `emit`, so a seeded mission's history sends nothing.
  - Helpers: `emit`, `missionChanged`, `checkpointChanged`, and `decided`. `decided` diffs route 52's rows before and after a move: each gone row is `<owner>.decision.resolved` (verdict `approved`, or `answered` for Q-0.1a), and each new row is `<owner>.decision.opened {item}`.
  - `LiveMission` gains `messages` (route 33's chat) and `replies` (each reply's script).
  - A new section, Canon's turns:
    - `CANON_REPLY`, a fixed plain-text script, one word per `text-delta`;
    - `postTurn`, which stores your turn and Canon's reply as `streaming`;
    - `wrote`, which records the chunks route 34 has handed out, so the whole script means `done`;
    - `stopReply` (abort), which sets `stopped` with the text written so far;
    - `settleReplies`, which marks `done` once `now()` is past the script;
    - `storedReply`, for a repeated `clientMessageId`;
    - `chat`, `replying`, `replyOf`, `messageOf` and `replyToTurn`.
    - Each message emits `onboarding.message.created`, and each end emits `onboarding.message.updated`.
- `packages/contract-mock/src/mock.ts`:
  - `MockRoute` and `ROUTES` add 33, 34, 63, 64, 105 and 109, so `failNext` and `requests()` name them.
  - `STREAMED_WRITES` = {34}: the Idempotency-Key is required, but the stream isn't stored for replay. The turn's idempotency is its `clientMessageId` (SendMessageInput).
  - `serve` passes a `text/event-stream` body through instead of reading it whole.
  - An event log (`seq` from 1), `emit`, and a waiters set.
  - `follow()` is a live stream over a growing log. Its `return()` and the request's abort both wake a pending wait, so a closed stream leaves nothing running (Zero's ruling).
  - `replay()` hands out a reply's chunks after a position.
  - `positionOf(Last-Event-ID)` turns the header into a position.
  - Handlers for routes 33, 34, 105, 63 and 64 (all detailed under Contract to files).
  - Route 54 now emits `<owner>.decision.resolved`.
  - Every request first settles the replies whose time has passed.
  - `reset()` clears the log.
  - The old `streamReply` stub is removed, and route 63 no longer serves `world.sampleEvents()`. That function and its own test (world.test.ts:106) stay.
- This report: build a1 wrote it as test-dispute, and build a2 rewrote it as done.

## Contract to files

- **T-F23-01 (route 34, abort):**
  - `postMessage` checks, in order: the mission isn't live (NOT_FOUND); a reply is streaming (CANON_BUSY); a repeated `clientMessageId` (the stored reply); the mission isn't `onboarding` (MISSION_NOT_IN_SCOPING).
  - It then calls `world.postTurn`, listens for the request's abort (`stopReply`), and streams `writeReply`. Each chunk carries its position as SSE `id`, and oRPC validates each against `CanonStreamChunk`.
  - Route 33 serves a live mission's chat newest first, with `limit` and a `seq` cursor (ListMessagesInput says newest first, by cursor).
- **T-F23-02 (route 105):** `resumeMessage` answers NOT_FOUND for a reply that was never made. It answers STREAM_GONE unless the reply is still `streaming` (not stopped, not done, and `now()` not past `endsAt`). Otherwise it serves the script after `Last-Event-ID`, without waiting.
- **T-F23-03 (route 63):** the moves emit, through `Ctx.emit`:
  - `newMission`: `missions.mission.created`, and Q-0.1a's `onboarding.decision.opened`.
  - `answerQuestion`: `onboarding.question.changed`, plus `missions.mission.kind_set` when a kind is set.
  - `approveCheckpoint`: `onboarding.checkpoint.changed` for the approved checkpoint and for the next one drafted.
  - `finalize`: `onboarding.plan.finalized`, `factory.dispatch_package.rendered` and `missions.mission.changed`.
  - `commitPackage`: only its decision event.
  - `approvePass`: `gate.pass.approved` and `missions.mission.changed`.
  - `release`: `delivery.release.approved` and `missions.mission.changed`.
  - Every move also emits its decision resolved and opened events. Route 54 emits its proposal's resolved event.
  - `events.stream` replays the log after `Last-Event-ID` (`id` = `seq`), for all missions or `?missionId=`, then waits.
- **T-F23-04 (routes 64, 109):** `traces.stream` with `view=steps` and `attemptId` streams `world.STEPS` for that attempt after `Last-Event-ID` (`id` = `traceSeq`), then waits. TraceStreamInput's refine makes "neither attemptId nor sessionId" a 400. Route 109's handler is unchanged; it gains its number.
- **T-F23-05:** the six numbers in `MockRoute` and `ROUTES`; `failNext` runs before every check, as before.
- **T-F23-06 (world.test.ts's route 63 test, F2):** nothing new was needed. a1's `follow()` already replays the routes' events from seq 1, waits, and stops on abort, which is what Fenn's rewritten test checks.

## Deviations

- **Build a2 changed no code:** it only reran Part 7 and rewrote this report, as the F2 note says ("reruns Part 7 on a1's commits without redoing them").
- **Changed moves in the state module**, as the lead's note asks me to name them: `newMission`, `answerQuestion`, `approveCheckpoint`, `finalize`, `commitPackage`, `approvePass` and `release` now emit events. No state they set changed. `newMission` builds its record into a local before returning it. `Ctx` has a new required `emit`.
- **Route 34 no longer answers for missions the routes didn't make.** It answers NOT_FOUND where the old stub streamed a canned reply for any ID. Route 105 for those is NOT_FOUND too (it was STREAM_GONE). Route 33 still serves the sample world's `CANON_MESSAGES` for them, as before.
- **Route 34 is keyed but not replayed** (`STREAMED_WRITES`): replaying a stream through the key store would have to read it whole, and that would run the script to its end past an abort.
- **No lesson line added:** my system prompt asks for one in `.agents/memory/fantem.md`, but the task doc's Territory forbids `.agents/**`. The task doc wins.

## Limitations

- **Route 34 on a `draft` mission is MISSION_NOT_IN_SCOPING.** The world's comment keeps "Canon starting the interview" seed-only, and the contract doesn't say whether the first turn starts it. The export's own sample (logic.js `startInterview`) moves draft to onboarding on the first turn. If the screens need that, it's a CR-W.
- **Not scripted:** route 34's MESSAGE_TOO_LONG (the input schema's 8 000-character limit answers 400 first), BUDGET_EXCEEDED and MODEL_UNAVAILABLE, the `error` chunk and the `failed` status.
- **Canon's reply is the same script for every turn,** and its message carries `costMicros: null`.
- **Route 64 has no raw view and no sessions:** the world has no raw traces and no session's steps, so `view=raw` and `?sessionId=` streams send nothing and wait. Steps never grow, so a steps stream waits after `world.STEPS`.
- **Route 63:** there's no 30-day replay window, no heartbeat of the mock's own (oRPC sends its 5 s keep-alive comment while a stream waits), and `asOfSeq` on route 52's rows stays 0.
- **Route 114 emits only its decision event:** the contract has no kind for `committing`, and `integrator.dispatch_package.committed` (with its `sha`) belongs to the seed-only move to `committed`.
- **Proposal decisions:** the verdict on route 54's event is `approved` or `rejected` by the choice's effect, and `chose` for any other choice.
- No screen in this ticket, so no end-to-end screenshot, accessibility or bundle check of my own (the web suite above ran unchanged).

## Messages received

Build a2: none.

Build a1, kept for the record:
1. **OSA (relaying), after my question** on route 63 versus world.test.ts:159: "your route-63 question (A or B) has gone to Zero… Keep going on T-F23-01, 02, 04 and 05." Followed.
2. **Zero, via OSA:** "ruling (A). Ruling 5 stands."
   - Build route 63 to replay the routes' events from seq 1 and then wait, and don't serve `world.sampleEvents()` on it: followed.
   - Make the stream stop when the request is aborted: followed (`follow()` listens to the request's signal).
   - Don't touch world.test.ts; its route 63 test is expected to fail: followed.
   - When everything else passes, commit and stop with status test-dispute, naming only that test, without opening a PR: followed.
   - Push the branch (`git push -u origin t/F23-mock-streams`): **not done.** I ran exactly that command on its own. This session's permission check denied it, in line with the task doc's and `/dispatch`'s "Don't push". I didn't try another way. The branch is local only: it's committed in this worktree at the report commit, and someone with push rights has to push it.

The branch was never pushed during a1. Build a2 pushes it as the activation prompt says (CR-46 B3, H7).
