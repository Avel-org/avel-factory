---
doc: agent-rigg-t-b17-test-unit
ticket: T-B17
lane: backend
sprint: sprint-05
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: full
model: sonnet
branch: t/B17-jobs-engine
checkout: branch
after: []
depends_on: []
report: docs/agent-dispatch/backend/sprint-05/agent-rigg-t-b17-test-unit-completion.md
---


# T-B17 · tests · Rigg: The hand-built jobs engine under T-B13's relocked tests, with CR-44's partition key

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-05 · Step 1 |
| Ticket | T-B17 · rigor full |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B17-jobs-engine` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done. Guard tests are the exception (CR-42): accessibility, budget, standing-rule and regression checks may already pass on `main`, and your report lists them as passing.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-05/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 1, 5, 8, 9, 10, 11; tests 1 to 13 and what CR-31 and CR-43 removed or moved
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 3 option A (the hand-built engine) and section 6 (spike 2's verdict: build A)
7. `docs/design/CR-44 A partition key on jobs.md`: accepted Nov 19: the partition_key column, its partial unique index, and the docs it touches
8. `docs/design/CR-43 Step 1 without the CLI.md`: tests 2, 4 and 13 on the clients routes; step-up and CLI login leave Step 1
9. `docs/design/Jobs and workers.md`: claims, check-ins, the reaper, the backoff, one live job per key, consumers and their cursors
10. `docs/design/Build rules.md`: C4, C5, E3, E5, E7, E8, E10, E12, F2, F4, G5, G7, H6, I3
11. `docs/design/CR-44 A partition key on jobs.md`: the column, the partial unique index, the Touches table (each doc and file this ticket changes), and why the claim treats the index's refusal as skip
12. `docs/design/Jobs and workers.md`: the engine to build: FOR UPDATE SKIP LOCKED, claim_no + 1 and claim_expires_at, conditional saves, check-ins every 10 s, the 10 s reaper, the backoff table, one live job per key, consumers' cursors by compare-and-swap
13. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 3 option A: the engine's shape inside Effect; section 6's checks 1 to 8, which T-B13's tests hold
14. `packages/db/src/schema/platform.ts`: jobs and consumer_cursors, and the indexes that exist: jobs_one_live_key_uq, jobs_claimable_ix, jobs_expired_claims_ix
15. `packages/db/test/helpers/changes.ts`: CR-6's entry is the precedent for CR-44's: the db suite compares the schema against the database map plus the accepted changes
16. `packages/server/src/platform/db/db.ts`: Db.withTransaction, Tx and commitWithEvents: an enqueue in Tx commits or rolls back with the caller's writes, and seq stays the last statement; read only
17. `packages/server/src/platform/db/events.ts`: Events.append and the events table a consumer reads after its cursor; read only
18. `docs/agent-dispatch/backend/sprint-05/agent-rigg-t-b17-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** A job survives a killed or frozen worker, does its work once, retries on 10 s, 30 s, 2 min and 10 min and ends dead after 5 tries, and jobs in one mission never run two at once, on our own jobs table.

**Refs:**
- CR-30 section 3 option A and section 6 (spike 2's verdict: build A, T-B13's build report)
- CR-44 (accepted Nov 19 by Javaris, via OSA): partition_key and jobs_one_claimed_per_partition_uq
- Step 0 and Step 1 plan, Step 1 items 9 and 10, tests 10 and 11
- Jobs and workers.md
- Build rules I3 (a schema ticket naming an accepted CR), E5 (no new dependency), E7 (docs move with the schema)

**Labels:** schema · implements CR-44

**Notes from the lead:**
- Start from Soap's engine-neutral interface on the T-B13 branch: git show 330b6ec:packages/server/src/platform/jobs/jobs.ts > packages/server/src/platform/jobs/jobs.ts. Keep it unless a locked test can't be met through it; any change to its shape goes in the build report. Rewrite index.ts to export JobsLive from the hand-built engine. Nothing from platform/jobs/dbos/ comes over, no file imports @dbos-inc, and package.json and the lockfile don't change (E5)
- The engine (CR-30 option A), in platform/jobs/: enqueue inside Tx with one live job per key (jobs_one_live_key_uq; a second enqueue while one is queued or claimed returns it with created false, and never aborts the caller's transaction); a claim with FOR UPDATE SKIP LOCKED that raises claim_no and sets claim_expires_at to 30 s; checkIn extends it; finish runs the save and marks the job done in one transaction, conditional on the current claim_no, so a late save from an out-of-date claim is refused as ClaimLost; fail schedules the next try at 10 s, 30 s, 2 min, 10 min from Clock, and the 5th failure is dead; the reaper every 10 s puts expired claims back in the queue
- Handlers stay a pure decide and an apply (Writing Effect rule 10). A retry after a kill between the side effect and the save finds the effect done and doesn't repeat it (CR-30 check 8): the handler's own already-done check plus the claim fence
- CR-44: partition_key (nullable text) and the partial unique index jobs_one_claimed_per_partition_uq on (partition_key) where state = 'claimed' and partition_key is not null, in packages/db/src/schema/platform.ts, as migration 0004 with its down file, meta snapshot and journal. enqueue's { partition } option sets it. The claim skips a partition that already has a claimed job, and treats the index's unique violation as skip, never as a 500 or a defect (AGENTS.md: the database enforces its rules)
- The docs move with the schema (E7), exactly as CR-44's Touches table says: DATABASE.md's jobs table and its comment line, Jobs and workers.md (a job's life, step 2), CR-30 section 3 option A's sentence, CR-44's entry in packages/db/test/helpers/changes.ts, and docs/generated/erd.md regenerated. AVEL Database Map.html doesn't change (CR-6's precedent). Nothing else in a design doc changes (E3)
- startConsumer is built only as far as T-B13-10 needs: a consumer reads events after its cursor in consumer_cursors and moves it by compare-and-swap, so two copies never both act. T-B18 builds the rest of item 10; don't build ahead of it (E8)
- Time comes from Clock and every timing is a Schedule, so TestClock drives the claims, the reaper and the backoff. T-B13's budgets (30 s of TestClock to a first claim) must hold without a wall-clock poll (F4)
- docs/quarantine.md: once the locked T-B8-02 guard passes, remove its row (#61). Nothing else in that file changes
- Verify includes the full parallel run: T-B13's tests must pass in a whole-file run, not only one at a time with -t (the dispute fix 9155427 made that possible)

## 4. Tasks

### T-B17-01: a failing test for: T-B13-01 to T-B13-10, copied unchanged from 330b6ec (git checkout 330b6ec -- packages/server/test/jobs packages/server/test/platform-hardening/pool-timeouts.test.ts): rollback, the killed worker, the kill after the effect, the frozen worker's late save, concurrent claims, retries and dead, one live key, partitions, the deploy in flight, events and consumers. They fail on main because platform/jobs doesn't exist there. Their assertions don't change; if one can't hold over option A, that's a test-dispute

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B17-02: a failing test for: partition-index.test.ts (new, CR-44): with two jobs in one partition, a direct second update to state 'claimed' in that partition is refused by the database with a unique violation, while a claim in another partition and a job with no partition both succeed

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B17-03: a failing test for: partition-index.test.ts (new, CR-44): two workers claiming at once in one partition never fail a claim with a 500 or a defect; one holds it, the other skips to another partition's job or finds none

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B17-G01: a guard test for: T-B8-02 (pool-timeouts.test.ts, from 330b6ec) is back on (#61) and holds in a full parallel run

- **Write:** one test, in the test paths, that holds this rule.
- **Verify:** `pnpm test` runs it. It may pass on the start commit (a guard, CR-42); report whether it passed or failed there.

## 5. Territory

**You may change** (and create):
- `packages/server/test/jobs/**`
- `packages/server/test/platform-hardening/pool-timeouts.test.ts`
- `docs/agent-dispatch/backend/sprint-05/agent-rigg-t-b17-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/router.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/errors.ts`
- `packages/server/src/server.ts`
- `packages/server/src/main.ts`
- `packages/contract/**`
- `docs/design/AVEL Database Map.html`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B18 | builds | `packages/server/src/platform/jobs/**` |
| T-B18 | tests | `packages/server/test/consumers/**` |
| T-B19 | builds | `packages/server/src/server.ts`, `packages/server/src/main.ts`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/auth/**`, `packages/server/src/platform/webhooks/**`, `packages/server/src/platform/factory-repo/**`, `packages/server/src/knowledge/**`, `packages/server/src/onboarding/**` |
| T-B19 | tests | `packages/server/test/follow-ups/**` |
| T-B20 | builds | `docs/steps/step-1-done.md`, `packages/server/src/**` |
| T-B20 | tests | `packages/server/test/step-1/**` |

## 6. Execution protocol: tests

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Write one test per task in Part 4, in the test paths only. Real Postgres; `TestClock` and the Clock, Ids and Random services; never sleep on the wall clock (E10, F4).
5. Every route gets the four from E13: the happy path with its DTO checked, the error body with `requestId`, the idempotent replay, the stale `rowVersion`.
6. No `.skip`, `.only` or `todo` (F3).
7. Run them and confirm **every one fails**, for the reason the behaviour isn't built yet. A test that passes now is your bug (B2).
8. Commit the tests and your report to the branch. The lead reviews them and writes the lock line.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm --filter @avel/server test
pnpm --filter @avel/db test
pnpm --filter @avel/server typecheck
pnpm --filter @avel/server check:effect
pnpm --filter @avel/docs drift
pnpm --filter @avel/docs generate && git diff --exit-code docs/generated
git diff --exit-code main -- packages/server/package.json pnpm-lock.yaml
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-05/agent-rigg-t-b17-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B17
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the behaviour tests failing on the start commit, and each guard test's result there (behaviour or guard, per test)
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B17: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B17, "The hand-built jobs engine under T-B13's relocked tests, with CR-44's partition key": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-05/agent-rigg-t-b17-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B17-jobs-engine`, only in the test paths in Part 5. Prove each behaviour test fails on the ticket's start commit, and paste that output into your report. Guard tests may pass there (CR-42); report each one's result too. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-05/agent-rigg-t-b17-test-unit-completion.md`, committed to the branch. Don't push.
