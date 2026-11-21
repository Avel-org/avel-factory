# CR-49: How many runs a worker holds, and what a database blip costs

Nov 21, 2026 · drafted by Axis for Javaris · **accepted Nov 21 by Javaris, via OSA** ("approve 1 to 3 with your recommendations, worker limit at 4"). It comes out of T-B18's two reviews (#88): t-b18-rigg-02, t-b18-zero-02 and the doc half of t-b18-rigg-05. The design makes none of these choices, so no ticket could make them (E3). No contract or schema change. No sprint-06 ticket waits on it.

## 1. A worker holds a bounded number of runs

- **Today:** `Jobs and workers.md` says how a job is claimed (a job's life 2), but not how many runs one worker may hold. T-B18 made the worker run its claimed jobs side by side, because T-B18-07 needs at least two at once. It set no limit, since the design names none (Writing Effect rule 7). `drain` claims every due job in one poll.
- **The problem** (t-b18-rigg-02): the runs, their check-ins, the claim loop and the reaper share one pool of 10 clients (node-postgres's default; `platform/db/db.ts` sets no `max`).
  - With more due jobs than clients, check-ins wait for a client, and a wait past the 5 s connect timeout kills that check-in. Three missed in a row let a claim expire while its run is still working.
  - The reaper requeues the job, and a second run starts. Fencing refuses the first run's save, so nothing is saved twice, but the work is done twice and counts toward the 5 tries.
  - One worker process also takes the whole queue, and a second process gets nothing.
  - Step 1 registers no job kind in the server (E8), so this is latent today. Step 2's reaper and credentials consumer (T-B21) are the first in the running server.
- **Proposed**, added to Settings:
  - "A worker runs at most **4** claimed jobs at once. Its claim loop doesn't claim while it's full."
  - "Each worker process's database pool has at least the run limit plus 4 clients (one each for check-ins, the claim loop, the reaper and a consumer), so a check-in always finds a client."
  - Javaris set the limit at 4 (Nov 21). It stays well under the pool's 10.
- **Kept:** the database rules. The limit sits beside the claim's `FOR UPDATE SKIP LOCKED`, the partition index and `claim_no` and never replaces them (Writing Effect rule 7).

## 2. A database blip isn't a failed try

- **Today:** a failure inside a run counts toward its 5 tries, whatever caused it. That includes a lost connection, a backend ended by the server, or a statement cut off at the pool. It holds for a worker's run (`runOne` → `fail`) and for a consumer's act (t-b18-zero-02). Five blips on one event across the backoff (about 13 minutes) make the consumer `dead` until the next deploy.
- **The problem:** t-b17-rigg-01 made every engine loop survive a blip, and T-B18-07 proves it. But a blip landing inside a handler's transaction still costs the job one of its 5 tries. A Postgres restart during busy work can mark healthy jobs and consumers dead.
- **Proposed**, added to a job's life 7:
  - "A connection failure (SQLSTATE class 08, or 57P01 to 57P03) during a run or a consumer's act doesn't count toward the 5 tries. The claim is handed back and the job is due again after the first backoff step (10 s), with `attempts` unchanged. Each such failure is logged once, with no values."
  - Every other failure, including the handler's own errors and constraint violations that aren't mapped, counts as today.
- **Why it stops:** a database that never comes back stops all work anyway. The alert for that belongs to the database's health check, not to a job's tries.

## 3. Event consumers, as built

`Jobs and workers.md`, The jobs, "Event consumers" gets the engine's shape, which T-B18 built and its report documents (t-b18-rigg-05, doc half):
- A consumer is a job of kind `consumer` with key `consumer:<name>`, claimed, checked in and reaped like any job. Its cursor row in `consumer_cursors` is created on its first claim.
- Its `attempts` counts failed tries on the event at its cursor and goes back to 0 when the cursor moves.
- On the 5th failure in a row on one event, it's `dead` and its cursor stays put. The next `startConsumer` for that name (a deploy after the fix) enqueues a fresh job, which retries that event.
- A graceful stop waits for the event in flight, at most until its claim would expire, then hands the claim back (T-B27).

## Touches

| Doc or code | Change |
| --- | --- |
| `Jobs and workers.md`, Settings | Section 1's two lines |
| `Jobs and workers.md`, A job's life 7 | Section 2's rule |
| `Jobs and workers.md`, The jobs, Event consumers | Section 3 |
| `packages/server/src/platform/jobs/**`, `packages/server/src/platform/db/db.ts` | The run limit, the pool's minimum size, and the blip rule (a backend ticket in sprint-07, after acceptance, with tests that fail first) |

**Owner:** `platform` (it owns `jobs` and `consumer_cursors`). **Where it's built:** backend sprint-07, one ticket, after T-B27 merges.

## If it's rejected

- **Section 1:** a worker keeps claiming every due job. Step 2's tickets live with the churn above, and each sizes its own load.
- **Section 2:** blips keep counting as tries. Then T-B21's credentials consumer, the first in the running server, can die after a Postgres restart and needs a deploy to recover.
- **Section 3:** the consumer's shape stays documented only in `jobs.ts` and T-B18's report.
