status: done
ticket: T-F23

# T-F23 tests: report (Fenn)

## Pre-flight
Start commit `1052f02` (T-F22 merged), branch `t/F23-mock-streams`. I did not start Postgres: nothing in this ticket touches the database (the mock is in memory).

- `pnpm build`: ok
- `pnpm typecheck`: ok (with the test file)
- `pnpm lint`: ok; 6 warnings, all in `apps/web` already, none in my file
- `pnpm --filter @avel/web exec vitest run`: 8 files, 47 tests pass
- `pnpm --filter @avel/web exec playwright test`: only listed (304 tests in 9 files), not run. This ticket adds no web or end-to-end test, and the browser run is CI's.
- `pnpm --filter @avel/contract-mock test`: 4 files pass (53 tests); the new file fails 11 of 11, as it should (below)

## Failing first
`pnpm --filter @avel/contract-mock test` on the start commit with only my test file added: **11 failed**, the 53 older tests pass. Every failure is a missing behaviour:

```
 FAIL  test/mission-streams.test.ts > T-F23-01: route 34 streams Canon's scripted reply, and an abort stops it > streams CanonStreamChunk values from start to finish, and stores the reply for route 33
AssertionError: route 33 lists the reply the stream started: expected undefined to be defined
 FAIL  test/mission-streams.test.ts > T-F23-01: route 34 streams Canon's scripted reply, and an abort stops it > an aborted request stops the script: the reply is kept as stopped, with what was written
AssertionError: the stopped reply is in the history: expected undefined to be defined
 FAIL  test/mission-streams.test.ts > T-F23-02: route 105 re-attaches to a reply still streaming, and answers STREAM_GONE once it's finished > resumes after Last-Event-ID, so the two halves are the whole script
AssertionError: every chunk carries an SSE id to resume from: expected null not to be null
 FAIL  test/mission-streams.test.ts > T-F23-02: route 105 re-attaches to a reply still streaming, and answers STREAM_GONE once it's finished > a reply that was never made is NOT_FOUND, not a stream
AssertionError: expected 410 to be 404 // Object.is equality
 FAIL  test/mission-streams.test.ts > T-F23-03: route 63 sends an event for each state move, and resumes from Last-Event-ID > each move is an event of a contract kind, in seq order, and a mission's stream holds only its own
AssertionError: expected [ null, null, null, null, null, …(82) ] to deeply equal [ '1001', '1002', '1003', …(84) ]
 FAIL  test/mission-streams.test.ts > T-F23-03: route 63 sends an event for each state move, and resumes from Last-Event-ID > a reconnect with Last-Event-ID sends only what came after it
AssertionError: expected [ { id: null, data: { …(8) } }, …(12) ] to deeply equal [ { id: null, data: { …(8) } }, …(73) ]
 FAIL  test/mission-streams.test.ts > T-F23-04: route 64 with view=steps streams an attempt's steps, and route 109 returns them oldest first > route 64 streams the same steps as route 109, and resumes after Last-Event-ID
AssertionError: a stream answers 200 or 201: expected [ 200, 201 ] to include 404
 FAIL  test/mission-streams.test.ts > T-F23-04: route 64 with view=steps streams an attempt's steps, and route 109 returns them oldest first > route 64 wants exactly one of attemptId and sessionId
AssertionError: expected 404 to be 400 // Object.is equality
 FAIL  test/mission-streams.test.ts > T-F23-05: MockFailure works on every part (b) route, and requests are named by number > fails the next call to each route with any status and code, and only that call
AssertionError: route 33: expected 200 to be 503 // Object.is equality
 FAIL  test/mission-streams.test.ts > T-F23-05: MockFailure works on every part (b) route, and requests are named by number > fails each route with a network failure that rejects with a TypeError
AssertionError: promise resolved "{ status: 200, …(2) }" instead of rejecting
 FAIL  test/mission-streams.test.ts > T-F23-05: MockFailure works on every part (b) route, and requests are named by number > records each request with its route number, the failed ones and the network failures too
AssertionError: expected [ null, null, null, null, null, null ] to deeply equal [ 33, 34, 105, 63, 64, 109 ]
```

The reasons, by task:
- 01: route 33 doesn't list the reply route 34 streamed (the stub's fixed message ID, nothing stored), nor a stopped one after an abort.
- 02: chunks carry no SSE `id`; an unknown reply gives 410, not 404.
- 03: events carry no `id`; no event for the moves made (the stub replays the fixed sample events); a reconnect replays the lot.
- 04: route 64 answers 404, since it isn't served.
- 05: `failNext` on routes 33, 34, 105, 63, 64 and 109 does nothing; `requests()` names none of them.

Route 109 is already served, so a test of it alone passed on the start commit (B2). I folded its checks into the route 64 test, which fails; the route 109 half is a check on the way through.

## What changed
- `packages/contract-mock/test/mission-streams.test.ts` (new): 11 tests in five groups, T-F23-01 to 05, over `createMock({ world: true, now })`. A mutable clock stands in for `now()`; the only waits are a few `setImmediate` turns for an abort to land.
- This report.

## Contract to files
- T-F23-01: route 34 chunks validate as `CanonStreamChunk`, start to finish, and the reply and the operator's turn are on route 33; an abort keeps a `stopped` partial.
- T-F23-02: route 105 resumes after `Last-Event-ID`, both halves equal one clean run; `STREAM_GONE` (410) once `now()` is past the script.
- T-F23-03: route 63 events validate as `EventDto`, in `seq` order with `id` = `seq`; route 20 gives `missions.mission.created`, route 40 gives `onboarding.checkpoint.changed`; `?missionId=` holds only that mission's; a reconnect sends only what came after.
- T-F23-04: route 109 (oldest first, `?after=`, `lastSeq`) and route 64 `view=steps` give the same `AgentStepDto`s, with `id` = `traceSeq`; route 64 with neither `attemptId` nor `sessionId` is 400.
- T-F23-05: `failNext` (an error and a network failure) and `requests()[n].route` for 33, 34, 105, 63, 64 and 109.

## Deviations
- The ticket names no interface, so the file's header states what it asks of the build, as T-F22's did. **Zero rules on these at the lock:**
  1. each chunk and event has an SSE `id` (route 34 and 105: the chunk's position; 63: `seq`; 64: `traceSeq`), resumed by the `Last-Event-ID` header;
  2. a reply is "still streaming" from its POST until `now()` is past its script, and the stream hands out chunks without waiting;
  3. route 34 stores both messages, and an abort stores `stopped` with the partial text;
  4. route 105 for an unknown message is 404 NOT_FOUND (the contract's catalog has it; a stopped reply is STREAM_GONE);
  5. route 63 replays what the routes made, then waits; the tests stop reading once they have what they came for.
- A POST stream (route 34) answers 201 under the contract, so the helper accepts 200 or 201.
- I did not add the four-step "attach while the clock moves" case for route 64: its steps are `world.STEPS`, a fixed list with no timing in the contract.

## Limitations
- No end-to-end test and no accessibility, screenshot or video run: this ticket has no screen (E17 and F6 don't apply).
- No test of Canon text as plain text beyond `text` staying a string; the `CanonStreamChunk` `error` chunk and `failed` status aren't scripted by the ticket, so they're not covered.
- Pacing by `now()` is tested only through route 105's "streaming, then gone" switch.
- Route 63's 30-day replay window isn't tested; no contract value says what the mock should drop.

## Lock line
- T-F23: packages/contract-mock/test/mission-streams.test.ts @ <branch tip>

## Messages received
None.
