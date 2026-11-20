status: done
ticket: T-B17

# T-B17 build: completion report (Soap, attempt 2)

Branch `t/B17-jobs-engine`, at `960c050` before this report. Own Postgres from `scripts/pg-local.sh`.

**In short:** every verification command passes. Attempt 1 built the engine, CR-44's schema and docs, and the quarantine change. It stopped with `test-dispute` on `packages/db/test/done-when-2.count.test.ts`, whose pinned totals were stale once CR-44's index was added. Javaris upheld the dispute ("fix the count"). The amendment (#73, merged into this branch at `fbd4c8a`) put that file in this ticket's Territory and named it in CR-44's Touches table. Attempt 2 updated the totals to 89 uniques and 554 rules, then ran the whole verification.

The locked tests are byte-identical to the lock (`git diff e193d50 HEAD -- packages/server/test/jobs packages/server/test/platform-hardening/pool-timeouts.test.ts` is empty). `jobs.ts` is byte-identical to `330b6ec`. The H6 lock check passes locally: `pnpm --filter @avel/repo-checks run check-locks` reports "lock check passed: T-B17, 7 builder commit(s)".

## Pre-flight

**Starting state for attempt 2** (at `fbd4c8a`, before any change): `pnpm build` exited 0. `pnpm test` exited 1, with 88 files passed and 1 failed, and 1058 tests passed and 1 failed. The failure was `done-when-2.count.test.ts`, which expected `uniques: 88` and got 89. That's the dispute.

(Attempt 1's starting state, at `9abfdae`: 7 files failed. They were the 6 `test/jobs` files, which couldn't load `platform/jobs`, and repo-checks' `effect-check.test.ts`, which ran `check:effect` and failed on the same missing module.)

**The verification at `960c050`, in order:**

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 0: 89 files, 1059 tests |
| `pnpm --filter @avel/server test` | exit 0: 47 files, 113 tests |
| `pnpm --filter @avel/db test` | exit 0: 10 files, 653 tests |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 91 files checked, 0 errors, 10 warnings and 2 messages. None is in `src/platform/jobs` (the same as attempt 1, all in older test files) |
| `pnpm --filter @avel/docs drift` | exit 0: no drift (96 tables, 222 foreign keys, 211 relationships) |
| `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated` | exit 0 |
| `git diff --exit-code main -- packages/server/package.json pnpm-lock.yaml` | exit 0 |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0: 89 files, 1059 tests |

**The full parallel run, verbose** (`vitest run --config vitest.workspace.ts --reporter=verbose`, exit 0, 1059 tests). Each of these passes:
- T-B13-01 to T-B13-10;
- T-B17-02 and T-B17-03;
- T-B8-02, and T-B8-03 beside it.

They pass in whole-file runs, not only one at a time with `-t`.

## What changed

**Attempt 2:**

| File | Why |
| --- | --- |
| `packages/db/test/done-when-2.count.test.ts` | The pinned totals, as CR-44's Touches table now says: `uniques: 89` and a sum of 554. The title reads "554 rules … 89 unique and partial-unique indexes … and CR-44 adds 1 unique". Nothing else in the file changed |
| `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b17-build-completion.md` | This report, which replaces attempt 1's |

**Attempt 1** (commits `4210c69`, `9cf809e` and `52aeefe`, unchanged in attempt 2):

| File | Why |
| --- | --- |
| `packages/db/src/schema/platform.ts` | CR-44: `partition_key` (nullable text) and `jobs_one_claimed_per_partition_uq` on `(partition_key)`, where `state = 'claimed'` and `partition_key` is not null |
| `packages/db/drizzle/0004_cr44_partition_key.sql` | Migration 0004: the column and the index |
| `packages/db/drizzle/down/0004_cr44_partition_key.sql` | Its down file: drops the index, then the column |
| `packages/db/drizzle/meta/0004_snapshot.json`, `_journal.json` | drizzle-kit's snapshot and journal entry (see Deviations for `missions_name_ck`) |
| `packages/db/test/helpers/changes.ts` | CR-44's entry, like CR-6's: `partition_key` added, and `jobs_one_claimed_per_partition_uq` added. The db suite compares the schema with the map plus CR-44 |
| `docs/design/DATABASE.md` | `jobs` gains `partition_key?` and CR-44's comment line, word for word |
| `docs/design/Jobs and workers.md` | A job's life, step 2: CR-44's sentence, word for word |
| `docs/design/CR-30 …md` | Section 3, option A: "Nothing changes in DATABASE.md but CR-44's partition key." |
| `docs/generated/erd.md` | Regenerated: `text partition_key "optional"` on `jobs` |
| `packages/server/src/platform/jobs/jobs.ts` | T-B13's engine-neutral interface, from `git show 330b6ec:…`, byte-identical |
| `packages/server/src/platform/jobs/index.ts` | Exports `JobsLive` from the hand-built engine, plus the interface |
| `packages/server/src/platform/jobs/engine.ts` | The engine (CR-30 option A); see below |
| `docs/quarantine.md` | T-B8-02's row (#61) removed once the guard passed in the full parallel run. No other row changed |

**How the engine works** (`engine.ts`, `JobsLive: Layer<Jobs, never, Db>`):
- **Enqueue** runs in the caller's `Tx`:
  - It inserts with `on conflict (key) where state in ('queued','claimed') do nothing returning id`, so a live key never aborts the caller's transaction.
  - If nothing was inserted, it reads the live job and returns it with `created: false`. If that job finished between the two statements, it inserts again.
  - `run_after` comes from Clock, and `{ partition }` sets `partition_key`.
- **Claim** is one transaction:
  - It selects the oldest due queued job of the worker's kinds whose partition has no claimed job, with `FOR UPDATE SKIP LOCKED`.
  - It raises `claim_no` and `attempts` by 1, and sets `claimed_by`, and `claim_expires_at` to Clock + 30 s.
  - If `jobs_one_claimed_per_partition_uq` refuses the update, `Db.withTransaction` returns `AlreadyExists` naming that constraint. The claim treats that as a skip: the transaction rolls back, so no attempt and no claim number are spent, and the claim looks again. Any other broken rule there is a defect.
- **Runs:** a worker runs one job at a time and polls every 1 s (`Schedule.spaced`). A check-in fiber pushes the expiry out every 10 s, and the reaper runs every 10 s.
- **Finish** is one transaction:
  - It marks the job done, fenced on `id`, the current `claim_no` and `state = 'claimed'`.
  - It runs the save and ends with `Db.commitWithEvents`.
  - No matching row means `ClaimLost`, and the save rolls back.
  - A save that breaks a database rule is a defect, so the job fails and retries.
- **When apply ends:**
  - If it returns without finishing, the job is finished with no save.
  - If it fails with `ClaimLost`, the failure is dropped.
  - Any other failure or defect calls `fail`, fenced on `claim_no`. The job goes back to queued with `run_after` = Clock + 10 s, 30 s, 2 min or 10 min, or it's dead after the 5th failure. `last_error` gets the error's message.
- **Kill** interrupts the claim loop, the reaper and the check-ins. It leaves the run in flight, so a later save from that run is refused by finish's fence.
- **Stop** does what kill does, then interrupts the run and hands its claim back (fenced), so another worker can take it at once.
- **startConsumer** is built only as far as T-B13-10 needs (E8):
  - It creates the cursor row if it's missing, then on each 1 s poll reads the events after `last_seq`.
  - Each event gets one transaction. A compare-and-swap moves `last_seq` from the seq this copy read to the event's seq, and only the copy that won the swap runs `handle`.
  - So two copies never both act. A failing handler rolls the swap back, and the next poll tries the event again.
  - T-B18 builds the rest of item 10.

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B17-01 (T-B13-01 to 10) | `engine.ts`, `index.ts`, `jobs.ts` |
| T-B17-02 (the database refuses a second claimed job in one partition) | `platform.ts`, migration 0004 and its down file, the snapshot and the journal |
| T-B17-03 (concurrent claims in one partition skip and never fail) | `engine.ts` `claim`: the `NOT EXISTS` filter, and the index's refusal treated as a skip |
| T-B17-G01 (T-B8-02 back on, holding in the full run) | `docs/quarantine.md` (the row removed). No code change was needed |
| CR-44's Touches table (E7) | `DATABASE.md`, `Jobs and workers.md`, CR-30 section 3, `changes.ts`, `done-when-2.count.test.ts`, `erd.md`. `AVEL Database Map.html` is unchanged |
| E5 (no new dependency) | `package.json` and `pnpm-lock.yaml` are unchanged. Nothing from `platform/jobs/dbos/` came over, and no file imports `@dbos-inc` |
| F4 (TestClock, no wall-clock poll) | Every interval is a `Schedule`, and every timestamp the engine writes comes from `Clock` |

## Deviations

- **The backoff is a table of `Duration`s, not a `Schedule`** (from attempt 1). The lead's note says "every timing is a Schedule". The poll, the check-in and the reaper are Schedules. The backoff isn't a wait inside the process. It's a `run_after` written to the row from Clock, so it survives a restart, and TestClock still drives it: T-B13-06 checks each gap to the second.
- **The 0004 snapshot keeps 0003's `missions_name_ck`** (from attempt 1). drizzle-kit also wanted to drop and re-add `missions_name_ck`, because `factory.ts` says `(length(btrim(name)) > 0)`, while migration 0003, the database and `changes.ts` say `(name <> ''::text)`. That drift predates this ticket and isn't CR-44's, so 0004 leaves it alone (see Limitations).
- **Interface:** unchanged. `jobs.ts` is byte-identical to `330b6ec`.

## Limitations

- **Out-of-scope note for Axis: rule counts in docs outside the Territory.**
  - `docs/design/README.md:10` still says "migrations 0000 to 0003, 553 rules … (652 `db` tests in all)".
  - `docs/design/Project overview.md:45` and `:70` say the same (553 rules, 652 tests, migrations 0000 to 0003).
  - The db suite now has 554 rules, 653 tests and migration 0004.
  - Neither doc is in CR-44's Touches table or this Territory, and the task doc says nothing else in a design doc changes, so I didn't edit them.
- **Out-of-scope note for Axis: `missions_name_ck`.** `packages/db/src/schema/factory.ts:572` defines it as `(length(btrim(name)) > 0)`, while migration 0003 and `changes.ts` (CR-W22) have `(name <> ''::text)`. The tests pass because done-when 8 reads the live database. Any future `drizzle-kit generate` will try to rewrite that check until someone decides which form is meant.
- **A worker runs one job at a time.** No test or doc asks for more.
- **Attempts:** a stop's hand-back and the reaper's requeue don't refund the attempt the claim counted. `attempts` counts runs started, as the interface says.
- **Consumers:** the copy that wins the swap holds the cursor row's lock while `handle` runs. A crash mid-handle holds that row until the connection dies. Consumers' claim numbers, kill semantics and backoff are T-B18's.
- **Starting workers in the running server:** not done. Step 1 has no job kind yet (E8).

## Messages received

None in attempt 2. No instruction arrived from OSA or anyone else. When I finished, I tried to message OSA with this status, but `ListAgents` didn't list OSA. The only other session was a T-B19 review, which I didn't message. This report is the record.
