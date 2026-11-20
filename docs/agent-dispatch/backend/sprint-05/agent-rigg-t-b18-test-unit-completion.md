status: blocked
ticket: T-B18

# T-B18 · tests · Rigg: completion report (attempt a2, F2 harness fix)

Attempt a2 fixes the locked tests' harness (F2, Javaris: "Rigg fixes the harness"), assertions unchanged. Both fixes are in. The 10-run proof is **not** green: 5 of 10 runs fail, always at the same assertion of T-B18-07, which is not one of the fixed waits. I stop with `blocked` rather than loosen that assertion. Details below. The a1 report is kept further down.

## a2: Pre-flight (engine at `2cf9e88` on the branch)

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 1: 1084 of 1085 pass; the one failure is T-B18-07 (below). An earlier run failed 76 because my Postgres container had stopped (ECONNREFUSED); restarted and rerun |
| `pnpm --filter @avel/server test` | 10 runs, see below |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0 |

## a2: What changed

- `packages/server/test/consumers/support.ts`: `advance` and `until` are now defined here instead of re-exported from `../jobs/support.ts` (T-B17's, read only). Their `settle` no longer counts cheap `select 1` round trips alone: it keeps going until no other connection of the test database has had a statement active (not waiting on a lock) for 4 checks in a row, bounded at 400 rounds. A test's own held lock (the blip) and a handler held open mid-way (T-B18-02) don't count as work in flight. No wall-clock sleep.
- `database-blip.test.ts` (T-B18-07): the three reads of committed state now first `until()` on the committed fact: `saved()` has `fresh-finished`, `saved()` has `reaped-and-rerun`, and `cursorOf` reaches `consumed[1]`. Assertions unchanged.
- `many-events.test.ts` (T-B18-06): waits for alpha's cursor to reach the 4th seq before reading `stuck`.

## a2: Proof runs (10 in a row, one vitest at a time, `pnpm --filter @avel/server test`)

| Run | Result |
| --- | --- |
| 1 | 1 failed, 137 passed |
| 2 | 138 passed |
| 3 | 1 failed, 137 passed |
| 4 | 138 passed |
| 5 | 138 passed |
| 6 | 1 failed, 137 passed |
| 7 | 138 passed |
| 8 | 138 passed |
| 9 | 1 failed, 137 passed |
| 10 | 1 failed, 137 passed |

Every failure is T-B18-07 at `database-blip.test.ts:163`: `expected 2 to be 1` (`starts.long`). The other 137 tests, including T-B18-02 and T-B18-06, passed in all 10 runs, so the two named flakes (simulated time outrunning a commit; reads before commit) are gone. Alone (`vitest run test/consumers/database-blip`) it failed 1 in 3, 1 in 12 and 1 in 11 runs with the same line.

## a2: What the remaining failure is

The long run's claim is lost: its claim expiry stays at the claim time + 30 s, never pushed out after the blip, until the reaper takes it and the job starts again (`claim_no` 2). Probes (since removed):
- In a failing run the logged defects after the blip were the claim loop, the consume pass and the reaper only. The run's check-in and the consumer's check-in were **not** logged, in 3 of 3 captured failing runs (a passing run logs five lines, per Soap).
- So the two check-in loops neither hit a defect nor wrote again: they did not run after the blip. A check-in due during the 12 s the tables are locked is either never started or never finishes.
- That is not a read-before-commit and not simulated time outrunning an engine commit (the probe saw check-ins missing for 16+ simulated seconds with the engine otherwise quiet), so I don't think more harness waiting fixes it. I could not tell from the tests alone whether the engine's check-in turn can hang (for example waiting for a pool connection while the other loops' blocked statements hold them) or whether `Effect.schedule` with `Schedule.fixed` skips a tick that fell due while a turn was blocked. That is `engine.ts` (T-B17/T-B18 build territory), not mine to change.

Ask for Axis: decide whether this is a build defect for Soap (my read: the "a run's check-in carries on after a blip" requirement of T-B18-07 is what fails, which is the ticket's point) or a test change.

## a2: Lock line

Not ready to relock: the proof is not green. The files changed are the same set as the a1 lock line below.

## a2: Messages received

None.

---

# a1 report (kept)


# T-B18 · tests · Rigg: completion report

Start commit: `709aeb7` (main with T-B17 merged). Seven acceptance tests, one per task, all failing there.

## Pre-flight

Run on `709aeb7` before any change, with `DATABASE_URL` from `scripts/pg-local.sh start`:

| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass |
| `pnpm test` | pass: 97 files, 1077 tests |

After the tests were added (the seven new tests fail by design, so the suite fails on them only):

| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (warnings only, none new from these files after `biome --write`) |
| `pnpm --filter @avel/server typecheck` | pass |
| `pnpm --filter @avel/server check:effect` | pass: 0 errors |
| `pnpm test` / `pnpm --filter @avel/server test` | fail on the seven new tests only; the other 1077 pass. One full run showed T-B18-04 passing because its timing check raced real I/O; I fixed it (see Deviations) and it now fails on all of 3 reruns |

## Failing first

`pnpm exec vitest run test/consumers` on `709aeb7`: 4 files failed, 7 tests failed, 0 passed. The first line of each failure, with the reason it is the right one:

| Task | Failure | Why it's the right reason |
| --- | --- | --- |
| T-B18-01 | `expected 0 to be greater than or equal to 1` (cursor `claim_no`) | The consumer holds no claim: `claim_no` stays 0. Resume itself already works (T-B17); the claim is the new part |
| T-B18-02 | `database error 57014 in query: insert into "consumer_cursors" ... on conflict do nothing` | Copy b can't even start while copy a sits mid-handle: a's open transaction holds the cursor row, so b's insert waits until the statement timeout. No claim, no expiry, no takeover |
| T-B18-03 | `expected [ { seq: 1, ...}, ...(4) ] to have a length of 1 but got 5` | 4 s after the first failure the handler has already run 5 times: it retries on the 1 s poll, not the 10 s backoff |
| T-B18-04 | `expected 0 to be greater than or equal to 1` (claim_no), and on the timing check `expected 2 to be 1` (the failed event is retried after 1 s) | No claim number; no backoff |
| T-B18-05 | `expected 0 to be greater than or equal to 1` (cursor `claim_no`) | Ordering and once-only already hold (T-B13-10 covers them); the claim number is what's missing |
| T-B18-06 | `expected 3 to be 1` (beta's cursor while it fails; earlier run: `4 to be 1`) | Beta retried after 1 s and moved on, instead of waiting out the 10 s backoff at its failing event |
| T-B18-07 | `a job enqueued after the blip was never claimed: expected false to be true` | A defect ended the worker's claim loop for good, with no log. This is t-b17-rigg-01 |

Full output: `vitest run test/consumers`, final lines:

```
 Test Files  4 failed (4)
      Tests  7 failed (7)
```

## What changed

- `packages/server/test/consumers/support.ts`: harness on top of T-B13's `../jobs/support.ts` (read only): `emit` (commits one event), `handler` (types a handler that uses `Tx`, so the tests compile whether or not the build adds `Tx` to `handle`'s type), `cursorOf` (`consumer_cursors` `last_seq` and `claim_no`), `seqsOf`, `succeeds` (shows a program's cause when an assertion inside it fails).
- `packages/server/test/consumers/resume-and-takeover.test.ts`: T-B18-01, T-B18-02.
- `packages/server/test/consumers/failing-handler.test.ts`: T-B18-03, T-B18-04.
- `packages/server/test/consumers/many-events.test.ts`: T-B18-05, T-B18-06.
- `packages/server/test/consumers/database-blip.test.ts`: T-B18-07.
- This report.

Each test file makes its own database (`testDatabase`), so cursors start at 0.

## Contract to files

| Requirement | Test |
| --- | --- |
| Resumes at n + 1 from `consumer_cursors`, nothing twice (T-B18-01) | `resume-and-takeover.test.ts` |
| Killed copy's claim expires, taken over within a minute, once; late move refused (T-B18-02) | `resume-and-takeover.test.ts` |
| Failing handler: cursor stays, same event retried after 10 s (then 30 s), nothing overtakes it (T-B18-03) | `failing-handler.test.ts` |
| Tx writes, follow-up job and cursor move commit together or not at all (T-B18-04) | `failing-handler.test.ts` |
| 20 concurrent writers, some rolled back: exactly the committed events, once, in order (T-B18-05, test 11) | `many-events.test.ts` |
| Two names: each sees all, own cursor (T-B18-06) | `many-events.test.ts` |
| One blip under a worker and consumer; claim, reap, check-ins, consume survive; each defect logged once with no values (T-B18-07, t-b17-rigg-01) | `database-blip.test.ts` |

How T-B18-07 makes the blip bite: it takes `ACCESS EXCLUSIVE` on `jobs`, `consumer_cursors` and `events` from the test's own connection, so every loop (claim, reaper, check-in, consume pass) has a statement in flight. It then ends every other backend with `pg_terminate_backend` and rolls back. Without that, idle pooled connections are dropped quietly and no loop sees a defect. It asserts the following. A job enqueued afterwards is claimed and finished within 10 s. The doomed worker's job is reaped and rerun within 60 s. A new event is consumed within 10 s. A run that was in flight is never rerun and finishes after 90 s (its check-ins went on). At least 1 and at most 6 warn-or-worse log lines appear, with no more after the blip. No log line contains the sentinel carried in job keys, payloads, event payloads and worker names.

## Deviations

- The test paths are `packages/server/test/consumers/**` only. Nothing else is touched.
- Tests read `consumer_cursors.claim_no` and `last_seq`, and T-B18-04 counts `jobs` rows by kind with one SQL query. The brief doesn't say how a consumer's claim is stored beyond "its own claim_no and expiry". I assert only the cursor row's `claim_no` (in the schema, DATABASE.md and CR-6) and never the claim's expiry column, so the build may keep the claim in `jobs` or on the cursor.
- T-B18-04 first passed once on `709aeb7` because its "no early retry" check raced real I/O. I added the `claim_no` assertion and widened the wait to 8 s (backoff is 10 s). It fails on 3 of 3 reruns.
- T-B18-02 and T-B18-07 use `Worker.kill` on a consumer as the "process vanishes" case. T-B17's `kill` for a consumer currently interrupts the fiber. The tests are written to hold either way: if the build leaves the in-flight handler running after `kill`, its late write must roll back; if it interrupts it, nothing runs late.
- T-B18-02 also requires that copy a, still alive and checking in, keeps copy b out for 45 s (past one 30 s claim).
- The 5th failure: see Limitations. No test, since none is in the task list.

## Limitations

- **After the 5th failure.** Jobs and workers.md, a job's life 7 and Settings: a job that keeps failing is marked `dead` after 5 tries "and you get an alert". Consumers are claimed jobs (Step 1 item 10), so a consumer whose handler fails 5 times is `dead`, stops, and the cursor stays at the failing event; the operator sees the `dead` state and the alert (the contract has a `system.alert.raised` event kind). I read the design as covering this and didn't stop with needs-cr. What it doesn't say, and I did not test: who raises the alert for a dead consumer in Step 1 (no alert producer exists yet), and how a dead consumer is restarted. If Axis reads that as a gap in the design, that is a needs-cr, not something I chose.
- No consumer kind is registered in the running server (E8). T-B13's tests are untouched and still pass.
- T-B18-07's log checks are by level (warn or worse) and by a sentinel string, since the build's log wording isn't fixed. The cap of 6 lines is: claim loop, reaper, one check-in, the consumer, plus 2 slack.
- Real I/O is let to settle with T-B13's `until` and `advance`; no wall-clock sleeps (F4).
- The E13 four per route doesn't apply: T-B18 adds no route.
- Not reached: the build itself. These tests are only shown failing, never passing.

## Lock line

- T-B18: packages/server/test/consumers/support.ts, packages/server/test/consumers/resume-and-takeover.test.ts, packages/server/test/consumers/failing-handler.test.ts, packages/server/test/consumers/many-events.test.ts, packages/server/test/consumers/database-blip.test.ts @ <branch tip>

## Messages received

None.
