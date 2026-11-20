status: test-dispute
ticket: T-B18

# T-B18 · build · Soap: completion report (attempt a2)

Branch `t/B18-event-consumers`, on top of the F2 relock `683766b`. The engine is unchanged from a1's checkpoint `2cf9e88`, and this attempt commits only this report. Nothing is pushed. The a1 report is kept below.

**In short:** Rigg's harness fix (tests a2) works. The one failure left, T-B18-07 at `database-blip.test.ts:163` (`expected 2 to be 1`, `starts.long`), isn't an engine defect. It's a race in the test itself: two claim loops race for the long job. It fails whenever the **doomed** worker, not the live one, claims the `t18.long` job. That worker is killed at the blip, so the run it holds stops checking in and is reaped and rerun. The design requires exactly that. Across 30 probed runs, all 4 failures had the doomed worker holding the long job, and all 26 passes had the live worker. No engine can avoid this without an arbitrary rule (below), so I've stopped with `test-dispute` (F2) instead of bending the engine.

## Test dispute: T-B18-07, which worker claims `t18.long`

**The lines:**
- `database-blip.test.ts:91`: the doomed worker is started with `handlers: kinds(false)`, so it has handlers for `t18.doomed`, `t18.long` and `t18.fresh`.
- Line 96: the live worker is started with `kinds(true)`.
- Line 102: `t18.long` is enqueued while both workers' claim loops poll every 1 s.

**What goes wrong:** both claim loops wake on the same 1 s tick of the TestClock, and whichever claims first gets the job.

When the doomed worker wins:
1. Line 113: `doomed.kill` ends its check-ins. That is `Worker.kill`'s contract: "nothing more is claimed, checked in or released".
2. The claim expires 30 s after the claim (t0 + 31 s).
3. The live worker's reaper puts the job back at t0 + 34 s, and the live worker runs it again.
4. `starts.long` becomes 2, and line 163 fails.

This is Jobs and workers.md, A job's life 5 ("Recovered") working as designed.

**Why the engine can't settle it:**
- Item 1 (lines 126–136) needs the live worker to claim and finish `t18.fresh` while its long run is still in flight (held on `gate` until step 4). So a worker must claim more jobs while one of its runs is in flight.
- At line 102, the doomed worker is in the same state as the live worker will be: one run in flight (`Effect.never` versus the gated run), nothing else.
- The two states are the same, so no engine rule can let the live worker claim a second job while refusing the doomed one. Any rule that did would be built around this test: a per-worker limit, a preference for one worker over another, or a delay. The design names none (E3, E8; AGENTS.md Writing Effect rule 7).

**Evidence:**
- **Method:** a temporary probe in `engine.ts` (removed, never committed; `engine.ts` matches `2cf9e88` byte for byte) recorded each claim with its TestClock time and which worker made it, and each check-in's start and end.
- **Correlation:** 30 runs of `vitest run test/consumers/database-blip`, one at a time:

  | Claimed `t18.long` | Runs | Passed | Failed at line 163 |
  | --- | --- | --- | --- |
  | live worker | 26 | 26 | 0 |
  | doomed worker | 4 | 0 | 4 |

- **A failing run's timeline:**
  - `t18.long` is claimed by the doomed worker at T0 + 1 s.
  - No check-in for it ever starts. The doomed worker's check-in fiber is killed with the worker at the blip.
  - The consumer's check-in starts at T0 + 10 s, is blocked by the test's lock, and logs its defect at T0 + 14 s.
  - The live worker claims `t18.long` again (claim 2) at T0 + 34 s.
  - From then on, the live worker's check-ins for claim 2 succeed every 10 s.
- **Passing runs:** the long run's check-in starts at T0 + 11 s, waits on the lock, and carries on every 10 s.
- **Rigg's note:** his a2 report saw the run's check-in missing from the defect log in every captured failure. This is why: the check-in belonged to the killed worker.
- **The full suite:** the combined chain below failed once on this same line, and the separate `pnpm test` passed. That matches a race lost about 1 run in 7.

**Proposed fix (Rigg's call, assertions unchanged):** only the doomed worker should be able to claim `t18.doomed`, and it should never claim `t18.long`. For example, at line 91:

```ts
handlers: kinds(false).filter((h) => h.kind === "t18.doomed"),
```

The live worker keeps all three kinds, so its rerun of the reaped doomed job is unchanged, and so are item 1 and the long run's check-ins. `t18.fresh` already can't go to the doomed worker, because it's enqueued after the kill.

## Pre-flight

`DATABASE_URL` from `scripts/pg-local.sh start`. Engine at `2cf9e88` (unchanged), tests at `683766b` (F2 relock). Each command was run one at a time, never two vitests at once.

| Command | Result |
| --- | --- |
| `pnpm build` (before any change, with `pnpm test`) | exit 0. `pnpm test` exit 0: 101 files, 1085 tests |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. 6 warnings, all in `apps/web/e2e/**` and already on `main` |
| `pnpm test` | exit 0: 101 files, 1085 tests (the live worker won the race) |
| `pnpm --filter @avel/server test` | exit 0: 59 files, 138 tests |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors, 13 warnings and 3 messages, none in `src/platform/jobs/**` |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 1: build, typecheck and lint pass. `pnpm test`: 1084 of 1085 pass. The one failure is T-B18-07 at `database-blip.test.ts:163`, `expected 2 to be 1` (the disputed race) |

Before this attempt, Rigg's 10 proof runs on the same engine failed 5 times, all at this line (his a2 report). T-B18-01 to -06, T-B13 and T-B17 passed in every run seen here and in his.

## What changed

- `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build-completion.md`: this report, with the a1 report kept below it.
- No code: `packages/server/src/platform/jobs/engine.ts` and `jobs.ts` are as a1 committed them (`2cf9e88`). The only change I made was the temporary probe, and it has been removed.

## Contract to files

As in a1 (below): every task maps to `engine.ts` and `jobs.ts` at `2cf9e88`. T-B18-07's item 4 ("a run's check-ins carry on") holds whenever the run belongs to the live worker, which is what that assertion means to test.

## Deviations

- None this attempt. a1's deviations stand (below): the worker runs its claimed jobs side by side, which item 1 requires; `CHECK_IN` uses `Schedule.fixed`; and a consumer job's `attempts` counts failures at its cursor.

## Limitations

- T-B18-07 fails about 1 run in 7 until the doomed worker can't claim `t18.long`. I couldn't run the 10-run proof green on this engine for that reason.
- I didn't edit the locked test, not even to try the proposed fix (F2). The evidence is the probe's correlation, not a patched run.
- The 5th failure (dead, and the consumer stops) and how the operator sees it: unchanged from a1, see "What happens after the 5th failure" below.

## Messages received

None.

I couldn't send the CR-37 status message to OSA: SendMessage found no agent named OSA, and ListAgents showed no other session running on this machine. This report is the record.

---

# a1 report (kept)


# T-B18 · build · Soap: completion report

Branch `t/B18-event-consumers`. The engine checkpoint is `2cf9e88`; this report is committed on top of it. Nothing is pushed.

**In short:** the engine now does what the ticket asks: claimed consumers, a compare-and-swap cursor on `(last_seq, claim_no)`, the backoff and death, and loops that survive a database blip. 6 of the 7 locked tests pass, and T-B13 and T-B17 stay green. T-B18-07 fails nearly every run, and T-B18-06 fails now and then. The cause is four assertions in the locked tests that read committed database state as soon as a handler *starts*, while its transaction is still open. No engine can pass those reliably, so I've stopped with `test-dispute` (F2) rather than bend the engine around them. The disputed lines and a proposed fix for each are under **Test dispute** below.

## Test dispute

Each of these assertions waits on a flag that the handler sets inside its own transaction, before that transaction commits, and then reads the committed state at once. The task requires the commit to come after the handler: "The handler's act and the cursor's move commit in one transaction", and `Run.finish` commits after `apply` calls it. So the read races the commit for any engine. T-B13's own tests avoid this: they wait on a committed result (`saved(c)`) before they check a job's state.

| Test | Line | Waits on | Then reads | Why it races |
| --- | --- | --- | --- | --- |
| T-B18-07 | 128–130 | `starts.fresh >= 1` (set at the start of `apply`) | `jobs.get(fresh.id).state === "done"` | `finish` still needs begin, update, save and commit, about 3 ms measured. `until` returns about 3.5 ms after the handler starts, so the read often comes first |
| T-B18-07 | 133–135 | `starts.doomed >= 2` | `jobs.get(doomedJob.id).state === "done"` | The same |
| T-B18-07 | 140–141 | `consumed.length === 2` (pushed inside the handler) | `cursorOf(...).lastSeq === consumed[1]` | The cursor's move and the commit come after the handler |
| T-B18-06 | 135–146 | `alpha.length >= 4` | `stuck[0].alpha === seqs[3]` | The same |

**Measured:** T-B18-07 failed on its own 4 times in 4 runs. In 5 runs of `test/consumers` and `test/jobs` on `2cf9e88`, it failed all 5 times: 3 at line 130, 1 at line 135 and 1 at line 141. T-B18-06 failed once, at line 146. In every run where those lines happened to pass, the rest of T-B18-07 passed too, including the defect-logging checks. A temporary timing probe (removed, never committed) showed the fresh job's handler start at t, its job row marked at t + 2.2 ms, and the test read the state at t + 3.5 ms, before the commit.

**Proposed fix (Rigg's call):** wait on the committed fact, the way T-B13 does:
- T-B18-07, line 128: `until(c, async () => (await saved(c)).some((r) => r.note === "fresh-finished"), 10_000)`
- T-B18-07, line 133: the same with `"reaped-and-rerun"`
- T-B18-07, line 140: `until(c, async () => (await cursorOf(c, "blipper"))?.lastSeq === consumed[1], 10_000)`, or both conditions together
- T-B18-06: wait for `cursorOf(c, "alpha").lastSeq === seqs[3]` before reading `stuck`

**A second, softer observation (harness load sensitivity, not part of the dispute):** under heavy parallel load, the harness can move simulated time 20 s or more while one engine commit is still in flight. `settle` measures progress in cheap `select 1` round trips, and the engine's commits (with fsync) are much slower than those when many files run at once. A claim that checks in every 10 s can then expire. I saw this twice:
- T-B18-02 line 123: once in the full `pnpm --filter @avel/server test` run.
- T-B18-07 line 145: once, before the check-in change below.

It didn't happen in 5 runs of the consumer and jobs suites after that change. The engine change I made to soften this is under Deviations.

## Pre-flight

`DATABASE_URL` from `scripts/pg-local.sh start`. Results on `2cf9e88`:

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. 6 warnings, all in `apps/web/e2e/**` and there on `main` already; none in this ticket's files |
| `pnpm test` | exit 1: 1083 of 1084 pass. 1 failure: T-B18-07, `database-blip.test.ts:130` (disputed) |
| `pnpm --filter @avel/server test` | exit 1: 136 of 138 pass. Failures: T-B18-07 line 130 (disputed) and T-B18-02 line 123 (the load observation above) |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors. 13 warnings and 3 messages, none in `src/platform/jobs/**` |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | stops at `pnpm test`, as above |

**Before any change:** 7 of the T-B18 tests failed and T-B13's 12 passed.

**After the change,** across the runs above:
- Every run: T-B18-01, -03, -04 and -05, T-B13-01 to -10 and T-B17-03.
- Most runs: T-B18-02 (failed once, the load observation) and T-B18-06 (failed once, at disputed line 146).
- T-B18-07 fails only at the disputed lines.

## What changed

- **`packages/server/src/platform/jobs/jobs.ts`:** `startConsumer`'s `handle` now has the type `Effect<void, unknown, Tx>`. The handler runs inside the cursor's transaction, so its writes, its `Jobs.enqueue` and its `Events.append` commit with the move. Its doc says what a consumer is: a claimed job, one claim per name, compare-and-swap on seq and claim number, and failures counted in `attempts` until the 5th makes it dead.
- **`packages/server/src/platform/jobs/engine.ts`:**
  - **Consumers are claimed jobs (item 10).**
    - **Its job:** `startConsumer` enqueues (in its own transaction) the consumer's job: kind `consumer`, key `consumer:<name>`. One live job per key means one claim per name.
    - **Claiming:** `claimConsumer` takes that job when it's queued and due, or when its claim has expired. It sets `claim_no + 1` and a 30 s expiry, and in the same transaction raises `consumer_cursors.claim_no`. The upsert creates the cursor row on the first claim.
    - **Check-ins:** the copy checks in on the job like any run. A lost check-in drops the copy's claim.
  - **Act once:** `act` runs one event in one transaction, in this order:
    1. the handler;
    2. after earlier failures, `attempts` back to 0;
    3. the compare-and-swap `update consumer_cursors set last_seq = seq where consumer = name and last_seq = at and claim_no = mine`;
    4. `commitWithEvents` last.

    A refused swap fails with `ClaimLost`, so the handler's writes roll back. The swap comes after the handler so a copy hung inside its handler holds no lock on the cursor row. A new copy can take over, and the hung copy's late move is refused (T-B18-02).
  - **Failures:** a failed handler leaves the cursor where it was. Through `fail`, the consumer's job goes back to `queued` with `run_after` on T-B17's backoff (10 s, 30 s, 2 min, 10 min), and the 5th failure in a row makes it dead. `fail` now takes the try count and says whether the job is dead. For a worker's job that count is `attempts`, unchanged.
  - **Stop and kill:**
    - `stop` ends the loop and the check-ins, waits for the event in flight to commit (its handler has already acted), then hands the claim back so the next copy starts at once (T-B18-01).
    - `kill` ends the loop and the check-ins and leaves the event in flight running, like a worker's kill.
  - **t-b17-rigg-01:**
    - `survive(loop, turn)` wraps each loop's turn: the claim loop, each run, the reaper, each run's check-in, each consume pass and each consumer's check-in.
    - A defect is logged once as `jobs engine: <loop> hit a defect; it runs again on its schedule`, with its cause. Db's `withoutValues` has already stripped the values; the line names only the loop, never a worker name, job key or payload.
    - The loop then runs again on its schedule. `ClaimLost` still ends a check-in loop, as before.
    - In T-B18-07 the blip logged exactly five lines (claim loop, reaper, a run's check-in, the consumer's check-in, the consume pass), and none of them contained the test's sentinel.
  - **Workers run their claimed jobs side by side.** `drain` claims every due job and forks its run instead of waiting for each, so a long run doesn't hold up the jobs behind it. T-B18-07 needs this: a job enqueued after the blip has to be claimed while the long run is in flight. `runs` is now keyed by job and cleaned up with `ensuring`, and `stop` still interrupts and releases every run in flight.
  - **`CHECK_IN` is `Schedule.fixed("10 seconds")`** instead of `spaced`: see Deviations.

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B18-01: resume at n + 1 and act on nothing twice | `engine.ts`: `stop` waits for the event in flight and releases the claim; `claimConsumer` returns the cursor's `last_seq` |
| T-B18-02: takeover within a minute, and the dead copy's late move refused | `engine.ts`: `claimConsumer` (takes an expired claim, raises the cursor's `claim_no`) and `act` (swap after the handler, on `last_seq` and `claim_no`) |
| T-B18-03: a failure leaves the cursor; retries after 10 s, then 30 s | `engine.ts`: `pass` (on failure, `fail` with the try count, then `letGo`) and `fail` |
| T-B18-04: writes, follow-up job and cursor move together, or none | `engine.ts`: `act` in one `withTransaction`; `jobs.ts`: `handle` gets `Tx` |
| T-B18-05: concurrent writers, some rolled back; each committed event once, in order | `engine.ts`: `eventsAfter` (seq order) and `act` (one move per event); seq order comes from `commitWithEvents` in db.ts (read only) |
| T-B18-06: separate names, separate cursors and claims | `engine.ts`: per-name job key, cursor row and claim |
| T-B18-07 / t-b17-rigg-01: loops survive a blip and log once, with no values | `engine.ts`: `survive` on every loop; `drain` runs jobs side by side; `CHECK_IN` |
| T-B13's tests unchanged and passing | `engine.ts`: the worker semantics kept: kill and stop, claim fencing, the backoff, partitions |

## What happens after the 5th failure, and how the operator sees it

The lead asked for this (E3). The design says it: Jobs and workers.md, "A job's life" 7: a job that keeps failing "is marked `dead`, and you get an alert". Item 10 adds that consumers are claimed jobs. So:
- **Dead:** on the 5th failure in a row on one event, the consumer's job `consumer:<name>` is marked `dead`, with `finished_at` and `last_error` (the handler error's message, as for any job).
- **Stopped:** the cursor stays on the event before the failing one. No copy can claim a dead job, so the consumer acts on nothing more. The copy logs one error line: `consumer <name> is dead after 5 failures on event <seq>; it acts on nothing more`. Each earlier failure logs a warning.
- **What the operator sees:**
  - the `jobs` row in state `dead`, with its `last_error`;
  - `consumer_cursors.last_seq` held at the event before the failing one;
  - the error log line.

  The "alert" the design names isn't built for any dead job yet; T-B17's dead jobs don't raise one either. That's a gap for whichever step builds alerts, not something this ticket adds (E8).
- **Restart:** the next `startConsumer` for that name, such as a deploy after the fix, enqueues a fresh job (a dead job doesn't block its key). The consumer then retries the same event from its cursor.

## Deviations

- **The worker runs jobs side by side** (T-B17 ran one at a time). T-B18-07 requires it, and the T-B13 interface doc doesn't say "one at a time". No in-process limit is set, because the design names no number (AGENTS.md rule 7: a Semaphore never replaces a database rule). Partition and key rules stay with the database.
- **`CHECK_IN` is `Schedule.fixed` instead of `spaced`,** still every 10 s (Jobs and workers.md, Settings).
  - **Why:** with `spaced`, a check-in that's slow or blocked (the blip holds one for 12 s) pushes every later check-in back by that much.
  - **Effect:** with `fixed`, the next one runs on the 10 s grid, or at once if it's overdue.
  - **Evidence:** after this change I no longer saw T-B18-07's long run lose its claim (line 145) in the consumer and jobs suite runs.
- **A consumer job's `attempts` counts failed tries on the event at its cursor** (reset to 0 when the cursor moves), not claims.
  - **Why:** counting claims would add one on every restart or takeover, and a few deploys would then make one later failure fatal.
  - **For workers:** `attempts` still means runs started.
- **The cursor row is created on the consumer's first claim** (an upsert), not when it starts.

## Limitations

- **T-B18-07 and T-B18-06** can't pass reliably until the disputed lines change (above).
- **T-B18-02 (and T-B18-07 line 145, seen once before the check-in change)** can still fail under heavy parallel load. The harness can move simulated time further than the 30 s claim while one engine commit is in flight. The engine can't control commit latency; the harness could settle on engine work rather than on `select 1`.
- **No alert on a dead job or a dead consumer:** none exists in the engine yet (see above).
- **No concurrency limit per worker:** see Deviations.
- **No consumer kind is registered in the running server:** Step 1 has none (E8). `main.ts`, `server.ts` and `app.ts` are untouched.
- **`docs/design/Jobs and workers.md`** isn't in this ticket's territory. Its text still holds: a consumer is a claimed job whose cursor moves only by compare-and-swap, with a claim number of its own. The consumer job's kind and key (`consumer`, `consumer:<name>`) are documented only in `jobs.ts`.

## Messages received

None.

I couldn't send the CR-37 status message to OSA: SendMessage found no agent named OSA, and ListAgents showed no other session running on this machine. This report is the record.
