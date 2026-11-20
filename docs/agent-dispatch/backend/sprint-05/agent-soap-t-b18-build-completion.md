status: done
ticket: T-B18

# T-B18 · build · Soap: completion report (attempt a3)

Branch `t/B18-event-consumers`. The tests are at the F2 relock `38b80c1`, which locks `058f5d3`. The engine is a1's checkpoint `2cf9e88`, unchanged. This attempt commits only this report. Nothing is pushed.

**In short:** all seven T-B18 tests pass, and T-B13's and T-B17's tests still pass unchanged.
- **The 10-run proof:** 10 runs in a row of `pnpm --filter @avel/server test`, one vitest at a time. The T-B18 tests passed in all 10. One run failed on a test from another ticket, T-B19-05 (details under Limitations).
- **The verification:** every command in Part 7 exits 0.

The earlier attempts stopped with `test-dispute`. a1 found the waits that read committed state too early. a2 found that both workers could claim `t18.long`. Rigg fixed both on the branch with the assertions unchanged (`5a6c7a2`, `058f5d3`), and the lead relocked. Their reports are in the history (`4ecc8e0`, `3cdea72`).

## Pre-flight

Postgres from `scripts/pg-local.sh start` (D5). Every command ran one at a time.

**Before any change**, on `38b80c1`: `pnpm build` exited 0, and `pnpm test` exited 0 (101 files, 1085 tests).

**The 10-run proof** (F2 note, Nov 20): `pnpm --filter @avel/server test` 10 times in a row on `2cf9e88` plus the relocked tests. vitest's own workers supplied the parallel load.

| Run | Exit | Time | Tests |
| --- | --- | --- | --- |
| 1 | 0 | 68 s | 138 passed |
| 2 | 0 | 69 s | 138 passed |
| 3 | 0 | 71 s | 138 passed |
| 4 | 0 | 69 s | 138 passed |
| 5 | 0 | 71 s | 138 passed |
| 6 | 0 | 70 s | 138 passed |
| 7 | 0 | 71 s | 138 passed |
| 8 | 0 | 74 s | 138 passed |
| 9 | 1 | 72 s | 137 passed, 1 failed: **T-B19-05** (`follow-ups/05-close-releases-pools.test.ts:46`, `expected +0 to be 1`). Not a T-B18 test (see Limitations) |
| 10 | 0 | 72 s | 138 passed |

All seven T-B18 tests passed in all 10 runs.

**The verification (Part 7)**, in order, on a fresh Postgres container. The first try's container was OOM-killed (see Limitations), so it was run again:

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0: 311 files checked. 6 warnings, all in `apps/web/e2e/**` and already on `main` |
| `pnpm test` | exit 0: 101 files, 1085 tests passed |
| `pnpm --filter @avel/server test` | exit 0: 59 files, 138 tests passed |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors, 13 warnings and 3 messages, none in `src/platform/jobs/**` |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0: 101 files, 1085 tests passed |

## What changed

Against `main`, this ticket's build changes two files, both from a1's commit `2cf9e88`, and adds this report.

- **`packages/server/src/platform/jobs/jobs.ts`:**
  - `startConsumer`'s `handle` now has the type `Effect<void, unknown, Tx>`. The handler runs inside the transaction that moves the cursor, so its writes, its `Jobs.enqueue` and its `Events.append` commit with the move or not at all.
  - The doc comment says what a consumer is: a claimed job of kind `consumer` and key `consumer:<name>`, with a compare-and-swap on the seq and the claim number, and failures counted in `attempts` until the 5th makes it dead.
- **`packages/server/src/platform/jobs/engine.ts`:**
  - **Consumers are claimed jobs (item 10).**
    - **Its job:** `startConsumer` enqueues the consumer's job in its own transaction. One live job per key means one claim per name.
    - **Claiming:** `claimConsumer` takes that job when it's queued and due, or when its claim has expired. It sets `claim_no + 1` and a 30 s expiry. In the same transaction it raises `consumer_cursors.claim_no`; the upsert creates the cursor row on the first claim.
    - **Check-ins:** the copy checks in on its job like any run. A refused check-in drops the copy's claim.
  - **Act once:** `act` handles one event in one transaction, in this order:
    1. the handler;
    2. after earlier failures, the job's `attempts` goes back to 0;
    3. the compare-and-swap: `update consumer_cursors set last_seq = seq where consumer = name and last_seq = at and claim_no = mine`;
    4. `commitWithEvents`, last.

    A refused swap fails with `ClaimLost`, so the handler's writes roll back. The swap comes after the handler, so a copy hung inside its handler holds no lock on the cursor row. A new copy can take over, and the hung copy's late move is refused.
  - **Failures:** a failed handler leaves the cursor where it was. Through `fail`, the consumer's job goes back to `queued`, with `run_after` on T-B17's backoff (10 s, 30 s, 2 min, 10 min). The 5th failure in a row makes it dead. `fail` takes the try count and says whether the job is dead. For a worker's job, that count is `attempts`, as before.
  - **Stop and kill:**
    - `stop` ends the loop and the check-ins, waits for the event in flight to commit, then hands the claim back so the next copy starts at once.
    - `kill` ends the loop and the check-ins and leaves the event in flight alone, like a worker's kill.
  - **t-b17-rigg-01:**
    - `survive(loop, turn)` wraps each loop's turn: the claim loop, each run, the reaper, each run's check-in, each consume pass and each consumer's check-in.
    - A defect is logged once as `jobs engine: <loop> hit a defect; it runs again on its schedule`, with its cause. Db's `withoutValues` has already taken the values out, and the line names only the loop.
    - The loop then runs again on its schedule. `ClaimLost` still ends a check-in loop.
  - **Workers run their claimed jobs side by side.** `drain` claims every due job and forks its run, so a long run doesn't hold up the jobs behind it. T-B18-07 needs this. `runs` is keyed by job and cleaned up with `ensuring`, and `stop` still interrupts and releases every run in flight.
  - **`CHECK_IN` is `Schedule.fixed("10 seconds")`** instead of `spaced` (see Deviations).
- **`docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build-completion.md`:** this report.

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B18-01: resume at n + 1, nothing acted on twice | `engine.ts`: `stop` waits for the event in flight and releases the claim; `claimConsumer` returns the cursor's `last_seq` |
| T-B18-02: takeover within a minute; the dead copy's late move refused | `engine.ts`: `claimConsumer` takes an expired claim and raises the cursor's `claim_no`; `act` swaps after the handler, on `last_seq` and `claim_no` |
| T-B18-03: a failure leaves the cursor; retried after 10 s, then 30 s; nothing after it runs first | `engine.ts`: `pass` (on failure, `fail` with the try count, then `letGo`, then stop the pass) and `fail` |
| T-B18-04: writes, follow-up job and cursor move together, or none | `engine.ts`: `act` in one `withTransaction`; `jobs.ts`: `handle` gets `Tx` |
| T-B18-05: concurrent writers, some rolled back; each committed event once, in order | `engine.ts`: `eventsAfter` (seq order) and `act` (one move per event). Seq order comes from `commitWithEvents` in `db.ts` (read only) |
| T-B18-06: separate names keep separate cursors and claims | `engine.ts`: a job key, cursor row and claim per name |
| T-B18-07 / t-b17-rigg-01: every loop survives a blip and logs once, with no values | `engine.ts`: `survive` on every loop; `drain` runs jobs side by side; `CHECK_IN` |
| No consumer kind in the running server (E8); T-B13's tests unchanged | `main.ts`, `server.ts` and `app.ts` are untouched. The worker's rules are kept: kill and stop, claim fencing, the backoff, partitions |

## What happens after the 5th failure, and how the operator sees it

The design says it (E3), so I didn't need a CR:
- Jobs and workers.md, "A job's life" 7: a job that keeps failing "is marked `dead`, and you get an alert".
- Settings: dead "after **5 tries**".
- Step 1 item 10: consumers are claimed jobs.

So:
- **Dead:** on the 5th failure in a row on one event, the consumer's job `consumer:<name>` is marked `dead`, with `finished_at` and `last_error` (the handler error's message, as for any job).
- **Stopped:** the cursor stays on the event before the failing one. No copy can claim a dead job, so the consumer acts on nothing more. The copy logs one error line: `consumer <name> is dead after 5 failures on event <seq>; it acts on nothing more`. Each earlier failure logs a warning.
- **What the operator sees:**
  - the `jobs` row in state `dead`, with its `last_error`;
  - `consumer_cursors.last_seq` held at the event before the failing one;
  - the error log line.

  The alert the design names isn't built for any dead job yet. T-B17's dead jobs don't raise one either. That belongs to whichever step builds alerts (E8).
- **Restart:** the next `startConsumer` for that name (a deploy after the fix) enqueues a fresh job, since a dead job doesn't block its key. It retries the same event from the cursor.

## Deviations

- **The worker runs claimed jobs side by side** (T-B17 ran one at a time). T-B18-07 requires it, and the Jobs interface doesn't say "one at a time". No in-process limit is set, because the design names no number (AGENTS.md, Writing Effect rule 7). The partition and key rules stay with the database.
- **`CHECK_IN` is `Schedule.fixed` instead of `spaced`,** still every 10 s (Jobs and workers.md, Settings). With `spaced`, a check-in that's slow or blocked (the blip holds one for 12 s) pushes every later check-in back by that much. With `fixed`, the next check-in stays on the 10 s grid, or runs at once if it's overdue.
- **A consumer job's `attempts` counts failed tries on the event at its cursor** (back to 0 when the cursor moves), not claims. Counting claims would add one on every restart or takeover, so a few deploys would make one later failure fatal. For a worker's job, `attempts` still means runs started.
- **The cursor row is created on the consumer's first claim** (an upsert), not when it starts.
- **This attempt:** no code change. The engine at `2cf9e88` passes the relocked tests as they stand.

## Limitations

- **T-B19-05 failed once in the 10 runs (run 9).** It isn't a T-B18 test, and it doesn't touch the jobs engine: `server.ts`, `main.ts`, `app.ts` and `router.ts` don't import it.
  - **The failure:** the test counts this database's other connections before it starts the server (`before`, here 1). After `close()` it expects the same count, and got 0.
  - **The likely cause:** a connection that `seed()` had just closed still showed in `pg_stat_activity` when `before` was read. The count then fell below `before`.
  - **What I did:** it's T-B19's locked file and outside my Territory, so I left it alone. Flagged for Axis and Rigg (likely a P2 or backlog item: wait for `seed`'s connections to go before reading `before`).
- **The first try at the Part 7 verification lost its Postgres:**
  - **What happened:** after 12 back-to-back suite runs on one container, the container hit its 512 MB cap and was OOM-killed partway through `pnpm test` (`CONSTRAINT_MEMCG` in `dmesg`; the WSL host wasn't short of memory). Every test file makes its own database on the container's tmpfs, and the tmpfs counts against the cap (`scripts/pg-local.sh`). The failures in that try were all `ECONNREFUSED` or a migration that couldn't connect.
  - **The rerun:** a fresh container, and every command passed (above).
  - **The proof is unaffected:** all 10 proof runs finished before the kill.
  - **For the next proof:** start a fresh container after about 10 suite runs.
- **No alert on a dead job or a dead consumer** (above).
- **No concurrency limit per worker** (see Deviations).
- **No consumer kind is registered in the running server:** Step 1 has none (E8).
- **`docs/design/Jobs and workers.md` isn't in this ticket's Territory.** Its text still holds. The consumer job's kind and key (`consumer`, `consumer:<name>`) are documented only in `jobs.ts`.

## Messages received

None.

I couldn't send the CR-37 status message to OSA: ListAgents showed no other session on this machine. This report is the record.
