status: done
ticket: T-F23

# T-F23 tests a2: report (Fenn)

Attempt a2 is the F2 amendment (Nov 21, Zero's ruling A): one test in `world.test.ts` changes. The locked `mission-streams.test.ts` is untouched (tests 01 to 05 stay as locked).

## Pre-flight
Branch `t/F23-mock-streams` (build `bd89dd0`). No Postgres: the mock is in memory. Node came from `~/.nvm` v24.22.2 (the shell's `node` was missing); `pnpm install --offline --frozen-lockfile` first.

- `pnpm build`: exit 0
- `pnpm typecheck`: exit 0
- `pnpm lint`: exit 0; the same 6 warnings, all in `apps/web`
- `pnpm --filter @avel/web exec vitest run`: exit 0 (8 files pass)
- `pnpm --filter @avel/web exec playwright test`: **not run**. This attempt changes no web or end-to-end file; the build's report records 303 passed, 1 skipped on this branch, and CI runs it.
- `pnpm --filter @avel/contract-mock test`: exit 0, 5 files, 64 passed (on the build, the new test passes 3 runs in a row)

## Failing first
The rewritten test, run against the seed's `src` (`git checkout bd89dd0^ -- packages/contract-mock/src`, restored after):

```
 FAIL  test/world.test.ts > the mock serves the new routes > GET /api/events/stream replays the events the routes made, then waits, and stops on abort
AssertionError: expected ': \n\nevent: message\ndata: {"seq":10…' to match /^id: ?1$/m
 Tests  1 failed | 11 passed (12)
```
The seed's route 63 sends the sample catalog (seq 10…, no SSE ids), not the events route 20 made from seq 1. The other 11 pass, including "has one sample of every kind".

## What changed
- `packages/contract-mock/test/world.test.ts`: I **rewrote** "GET /api/events/stream yields one event of every kind" (it read route 63 to its end and expected the sample catalog) to what route 63 now does. The new test (T-F23-06) makes a mission through route 20, opens route 63 with an abort signal, and checks that: it replays that move's events from seq 1 (`id: 1`, each an `EventDto`, `missions.mission.created` and `onboarding.decision.opened`), without the whole catalog; the stream then stays open (the next read is still pending after 20 event-loop turns, no wall clock); and aborting the request ends it. I rewrote instead of removing so the live-stream behaviour (replay, wait, stop on abort) has its own check next to the route-63 reads; T-F23-03 covers the move-by-move events. Every other test in the file is unchanged, including "has one sample of every kind".
- This report.

## Contract to files
- T-F23-06: `world.test.ts`'s rewritten route 63 test.

## Deviations
- Playwright not run (above).
- The test reads two events from route 20 (`created`, `decision.opened`), as the build's report lists them. If the build's event set for route 20 changes, this test needs the same change.

## Limitations
- The "waits" check is by event-loop turns, not a proof of an infinite wait.

## Lock line
- T-F23: packages/contract-mock/test/mission-streams.test.ts, packages/contract-mock/test/world.test.ts @ <branch tip>

## Messages received
None.
