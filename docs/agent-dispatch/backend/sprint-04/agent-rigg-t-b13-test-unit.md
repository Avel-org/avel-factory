---
doc: agent-rigg-t-b13-test-unit
ticket: T-B13
lane: backend
sprint: sprint-04
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: full
model: sonnet
branch: t/B13-jobs-spike-dbos
checkout: branch
after: []
depends_on: []
report: docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-test-unit-completion.md
---


# T-B13 · tests · Rigg: Spike 2: Step 1's jobs and events tests against a small Jobs interface, run over DBOS

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B13 · rigor full |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B13-jobs-spike-dbos` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done. Guard tests are the exception (CR-42): accessibility, budget, standing-rule and regression checks may already pass on `main`, and your report lists them as passing.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-04/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 1 (the webhook), 8 (activity log), 9 (jobs), 10 (events), 11 (the factory repo); the rate limits (webhook); tests 2, 4, 10, 11, 12, 13
6. `docs/design/CR-43 Step 1 without the CLI.md`: accepted Nov 18: tests 2, 4 and 13 on the clients routes; step-up and CLI login leave Step 1
7. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 3 (hand-built or DBOS) and section 6 (spike 2's eight checks, its pass and fail rules)
8. `docs/design/Jobs and workers.md`: the jobs design the tests hold either engine to: claims, the reaper, retries, one live job per key, consumers
9. `docs/design/Backend modules and build plan.md`: section 4: onboarding owns clients, audit owns activity_log, knowledge owns factory_versions, platform owns jobs and webhook_deliveries; the loader is a platform utility with no table
10. `docs/design/Build rules.md`: C4 (full rigor), E5 (dependencies), E8 (nothing built for later), E10 (real Postgres), E12 (table owners), E13 (four tests per route), F2, H6
11. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 3's DBOS feature table and open questions; section 6's eight checks and the pass rule (1 to 8 hold, and clearly less code to own than the hand-built engine)
12. `docs/design/Jobs and workers.md`: the guarantees the tests hold DBOS to: claims for 30 s, check-ins about every 10 s, the reaper, backoff 10 s, 30 s, 2 min, 10 min, then dead after 5 tries, one live job per key, consumers
13. `packages/server/src/platform/db/db.ts`: Db.withTransaction and commitWithEvents: an enqueue inside a transaction must commit or roll back with it, and seq stays the last statement; read only
14. `packages/server/src/platform/db/events.ts`: Events.append needs Tx; read only
15. `packages/db/src/schema/platform.ts`: jobs and consumer_cursors as the hand-built engine would use them; DBOS doesn't write them
16. `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** We know, from our own tests on real Postgres, whether DBOS keeps every jobs guarantee AVEL's receipts depend on, before anyone builds the engine.

**Refs:**
- CR-30 section 3 (option B) and section 6 (spike 2, checks 1 to 8, the pass and fail rules); decision 2
- Step 0 and Step 1 plan, Step 1 items 9 and 10, tests 10 and 11
- Jobs and workers.md
- Build rules E5 (@dbos-inc/dbos-sdk, approved in this plan)

**Notes from the lead:**
- The Jobs interface, in platform/jobs/jobs.ts, as an Effect service: enqueue(kind, key, payload) inside Tx (it commits or rolls back with the caller's writes); a worker that claims and runs a handler; checkIn, finish and fail for the running job; and a consumer that reads events after its cursor and acts on each once. Handlers are a pure decide and an apply. Keep the interface as small as tests 10 and 11 need: nothing for later (E8)
- Spike 2 builds that interface over DBOS Transact (option B), in platform/jobs/dbos/**. DBOS's tables live in their own Postgres schema, in our database, outside the Drizzle migrations, and never hold a record a receipt depends on (CR-30 check 7). Pin an exact version at least two weeks old and report its version and installed size
- Time from Clock and the timings as Schedules. Where DBOS reads the wall clock and TestClock can't drive it, say so in the report: that's a finding against DBOS, not a reason to sleep in a test (F4)
- If a check can't pass over DBOS, don't work around it. Finish the rest, and report which check failed and why. A failed check is a valid result for a spike
- The report ends with the spike's evidence: each of CR-30's checks 1 to 8 with its test and result, and the lines of code the DBOS layer needs against the hand-built engine's size as Jobs and workers.md describes it
- docs/quarantine.md: once the locked guard for T-B8-02 passes, remove its row (#61). Nothing else in that file changes
- If DBOS loses, this PR doesn't merge. Sprint-05's engine ticket takes these locked tests unchanged and builds the hand-built engine under them, so nothing is written twice (CR-30 section 6). If DBOS wins, Javaris decides it, with the DATABASE.md change request CR-30 section 7 asks for, before this merges

## 4. Tasks

### T-B13-01: a failing test for: a job enqueued in a transaction that rolls back never runs, and leaves no event and no job (test 11)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-02: a failing test for: a job whose worker is killed mid-run is picked up by another worker within a minute (TestClock) and does its work once (test 10)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-03: a failing test for: a worker killed after its side effect but before its save leaves a retry that finds the effect done, records it and doesn't repeat it (test 10; CR-30 check 8)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-04: a failing test for: a paused worker whose job was recovered elsewhere has its late save refused (test 10's out-of-date claim; CR-30 check 2)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-05: a failing test for: two workers never claim the same job, under concurrent claims (test 10)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-06: a failing test for: a job that keeps failing retries after 10 s, 30 s, 2 min and 10 min, and ends dead after 5 tries (TestClock; test 10; CR-30 check 6)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-07: a failing test for: one live job per key: a second enqueue with the same key while the first is queued or running is refused or returns the first; after it finishes, a new one runs (CR-30 check 3)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-08: a failing test for: jobs with the same partition key (a mission) never run two at once, while other partitions run in parallel (CR-30 check 4)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-09: a failing test for: a worker stopped with work in flight and replaced by a new one finishes or safely resumes that work (CR-30 check 5)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-10: a failing test for: under concurrent transactions, events' seq order equals commit order with no gaps a reader can miss, and two copies of one consumer never both act on an event (test 11)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B13-G01: a guard test for: T-B8-02 (pool-timeouts.test.ts) is back on (#61) and holds in a full parallel run: the connect timeout leaves headroom inside the 4 s guard, or the proxy counts attempts where it listens, so CPU load can't beat the proxy's accept

- **Write:** one test, in the test paths, that holds this rule.
- **Verify:** `pnpm test` runs it. It may pass on the start commit (a guard, CR-42); report whether it passed or failed there.

## 5. Territory

**You may change** (and create):
- `packages/server/test/jobs/**`
- `packages/server/test/platform-hardening/pool-timeouts.test.ts`
- `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/db/**`
- `packages/contract/**`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B14 | builds | `packages/server/src/onboarding/**`, `packages/server/src/audit/**`, `packages/server/src/platform/router.ts`, `packages/server/src/main.ts` |
| T-B14 | tests | `packages/server/test/clients/**` |
| T-B15 | builds | `packages/server/src/platform/webhooks/**`, `packages/server/src/platform/factory-repo/**`, `packages/server/src/knowledge/**`, `packages/server/src/platform/app.ts` |
| T-B15 | tests | `packages/server/test/factory-repo/**` |
| T-B16 | builds | `packages/server/src/platform/auth/**`, `packages/server/src/main.ts`, `packages/server/src/server.ts` |
| T-B16 | tests | `packages/server/test/server/**` |

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
pnpm --filter @avel/server typecheck
pnpm --filter @avel/server check:effect
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B13
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the behaviour tests failing on the start commit, and each guard test's result there (behaviour or guard, per test)
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B13: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B13, "Spike 2: Step 1's jobs and events tests against a small Jobs interface, run over DBOS": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B13-jobs-spike-dbos`, only in the test paths in Part 5. Prove each behaviour test fails on the ticket's start commit, and paste that output into your report. Guard tests may pass there (CR-42); report each one's result too. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-test-unit-completion.md`, committed to the branch. Don't push.
