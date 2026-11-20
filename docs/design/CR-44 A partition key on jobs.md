# CR-44: A partition key on jobs

Nov 19, 2026 · drafted by Axis for Javaris · **accepted Nov 19 by Javaris, via OSA** ("Accept CR-44"). It's a schema change (I3), so it's built in a `schema` ticket. No contract change, so it doesn't need Zero's sign-off.

- **What:** `jobs` gets a nullable `partition_key` text column, plus a partial unique index `jobs_one_claimed_per_partition_uq` on `(partition_key)` where `state = 'claimed'` and `partition_key` is not null. A job enqueued with a partition key (a mission ID) never runs while another job with the same key is claimed. Jobs without a key behave exactly as they do today.
- **Why:**
  - **A locked test needs it.** Spike 2's tests are written against the engine-neutral `Jobs` interface and locked on `t/B13-jobs-spike-dbos` (T-B13, relocked at `330b6ec`). T-B13-08 enqueues with `{ partition }` and checks that jobs with one partition never run two at once, while other partitions run in parallel (CR-30 check 4). Sprint-04's plan promised that the engine that won would be built under those tests unchanged (CR-30 section 6: "nothing is written twice"). DBOS lost, so option A, the hand-built engine, is built. Option A's table has nowhere to keep a partition.
  - **The integrator needs it** (Step 9). Jobs and workers, The jobs: "One integration commit at a time per mission". One live job per key can't do this safely on its own. Say the integrator's key is per mission (`integrate:<mission>`). A commit queued while that job is finishing gets the live job back (`created: false`). Then the job marks itself `done` without seeing the commit, because the commit's transaction hadn't committed yet. That commit has no job. With a partition key, each commit gets its own job (`integrate:<integration commit id>`), and the database runs them one at a time.
  - **The database enforces it** (AGENTS.md, The database enforces its rules; Writing Effect rule 7). Two workers claiming at once can't both hold a claim in one partition, because the index refuses the second. The engine's claim skips a partition that already has a claimed job, and treats the index's refusal as "skip", never as a 500.
- **Not changed:** claims, `claim_no`, the reaper, the backoff, one live job per key, `consumer_cursors`, the events, and the contract. Partition keys are internal: no route or event shows them.

## Touches

| Doc or code | Change |
| --- | --- |
| `DATABASE.md`, Plumbing, `jobs` | Add `partition_key?`. Add a comment line: "at most one claimed job per partition_key (a mission): the integrator runs one integration commit at a time (CR-44)" |
| `packages/db/src/schema/platform.ts` | The column and the index |
| `packages/db/drizzle/` | Migration 0004 and its down file, with the meta snapshot and journal |
| `packages/db/test/helpers/changes.ts` | A CR-44 entry, like CR-6's, so the done-when tests still compare the schema against the database map plus the accepted changes. `AVEL Database Map.html` doesn't change (CR-6's precedent) |
| `docs/generated/erd.md` | Regenerated |
| `Jobs and workers.md` | A job's life, step 2: "A job with a partition (a mission) isn't claimed while another job in that partition is claimed." The settings don't change |
| `CR-30`, section 3, option A | "Nothing changes in DATABASE.md" now reads "Nothing changes in DATABASE.md but CR-44's partition key" |

**Owner:** `platform` (it owns `jobs`; `Backend modules and build plan.md` section 4).
**Where it's built:** backend sprint-05, T-B17 (the jobs engine), labelled `schema`, with `cr = "CR-44"`.

## If it's rejected

T-B13-08 leaves the engine's tests: Rigg drops it before the lock, and T-B17's territory loses `packages/db/**`. The integrator's one-at-a-time rule then has to be designed in Step 9 around the race above. That would be its own CR.
