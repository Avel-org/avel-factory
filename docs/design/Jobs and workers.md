# Jobs and workers

Nov 1–2, 2026 · @javaris

How the factory does its background work. This explains the design (with CR-6 applied); it doesn't change it. Plain terms are used throughout, with the schema's names in brackets.

## Terms

| Plain term | What it means | Schema name |
| --- | --- | --- |
| Job | A to-do row in Postgres | `jobs` |
| Worker | A loop inside the main service that does jobs | — |
| Claim | A worker's hold on a job while it works on it | `state = 'claimed'`, `claimed_by` |
| Claim expiry | When the claim runs out unless the worker checks in | `claim_expires_at` |
| Check in | The worker extends its claim while it's still working | — |
| Claim number | Goes up by one every time the job is claimed; only the current number can save | `claim_no` |
| Reaper | The sweeper that finds expired claims and puts those jobs back in the queue | reaper |

The schema renames (from `lease_epoch`, `lease_until` and `'leased'`) land in Step 0 (CR-6, decided Nov 2).

## The idea

A **job** is a to-do row in Postgres, such as "render this plan" or "run Gate 2 on this integration commit". **Workers** pick up jobs and do them. Because the work lives in the database and not in memory, a restart or a crash loses nothing.

## A job's life

1. **Born in a transaction.** A state change, its numbered event and the job row are saved together, or not at all.
2. **Claimed.** A worker takes the oldest queued job that's due. Postgres gives each row to one worker only (`FOR UPDATE SKIP LOCKED`). Claiming raises the job's claim number and sets its claim expiry.
3. **Worked.** The worker checks in while it works, which pushes the claim expiry out. Every save it makes is conditional: "only if my claim number is still current".
4. **Finished.** One transaction records the result, its event and any follow-up job, and marks the job `done`.
5. **Recovered.** If a worker crashes, it stops checking in and its claim expires. The reaper puts the job back in the queue, and the next worker claims it with a higher claim number.
6. **Fenced.** If a stuck worker wakes up late, its claim number is out of date, so its save is refused and the work isn't done twice.
7. **Dead.** A job that keeps failing retries later (`run_after`, `attempts`). After the retry limit it's marked `dead`, and you get an alert.

## The three rules

1. **Every job has a key**, like `gate2:<integration commit id>`. The database allows one live job per key (`jobs_one_live_key_uq`), so a cause that fires twice still creates one job. A finished job doesn't block the next one with the same key.
2. **Handlers are idempotent.** Running a job twice gives the same result as running it once. The claim number stops the obvious double-run, and the database's unique rules catch the rest. For example, an integration commit can record only one Gate 2 result.
3. **Nothing happens outside a transaction.** A state change, its event and its follow-up job are saved together, or not at all.

## Decide, then apply

Each handler has two parts:

- **Decide:** a pure, deterministic function reads the current state and returns what should happen. The same inputs always give the same answer.
- **Apply:** the handler carries out the side effects (starts a room, runs tests, pushes a commit), then saves the result, its event and any follow-up job in one transaction.

The decide functions are tested with fixture tables, without a database, rooms or network. The apply side is tested against real Postgres for the crash and replay cases.

## The jobs

| Job | What it does | Deterministic part | What can vary |
| --- | --- | --- | --- |
| Render | Finalize (approval #1) queues it with the plan. It renders DISPATCH.md and the task docs, then hands off to Gate 1. | All of it: the same plan and factory commit give byte-identical documents | Nothing |
| Scheduler tick | Runs every few seconds and after relevant events. Starts every ready module, reserves cost first, fills up to 6 slots. | Readiness, order (dependency depth, then module ref), slot count | When earlier work finishes |
| Integrator | One integration commit at a time per mission. Tests it, and moves the mission branch only if it's green. | The merge plan (the ported path-overlay planner) and the green-only rule | Test results (flakiness is handled by the 3-run lock check and quarantines) |
| Gates 2, 3, 5 | Gate 3 after an attempt, Gate 2 per integration commit, Gate 5 once every module has landed | `decide()` is a pure function; no inference in the gate | The test runs and checks that feed it |
| Event consumers | Read events in order and react (the notifier, scheduler triggers). Each keeps a cursor that moves only by compare-and-swap, and holds a claim number of its own. | The order of events | — |
| Housekeeping | The reaper (expired claims, leftover reservations, tokens and rooms) and the purges (idempotency keys, traces, finished jobs) | All of it | — |

## Where models appear

Models never sit in the control path ("A model never picks agents or work"). They appear only in these slots:

- **Canon at Gate 0:** it drafts, and you approve each checkpoint.
- **Agents inside rooms:** test writers, builders and reviewers. Code judges their output at Gate 3. Reviewer findings are model output, but code routes them, and each one must cite evidence that code checks.

## Settings (decided Nov 2)

- A claim lasts **30 seconds**; workers check in about every **10 seconds**.
- The reaper runs every **10 seconds**, so a crashed worker's job is back in the queue within about 40 seconds.
- A failing job retries with backoff (10 s, 30 s, 2 min, 10 min) and is marked `dead` after **5 tries**.
