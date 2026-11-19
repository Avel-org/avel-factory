---
doc: agent-soap-t-b13-build
ticket: T-B13
lane: backend
sprint: sprint-04
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B13-jobs-spike-dbos
checkout: branch
after: [agent-rigg-t-b13-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-04/agent-soap-t-b13-build-completion.md
---


# T-B13 · build · Soap: Spike 2: Step 1's jobs and events tests against a small Jobs interface, run over DBOS

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B13 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B13-jobs-spike-dbos` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
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
16. `packages/server/test/jobs/**`: the locked acceptance tests: they define done
17. `packages/server/test/platform-hardening/pool-timeouts.test.ts`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b13-build.md`: this document: follow it exactly

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

### T-B13-01: make it true: a job enqueued in a transaction that rolls back never runs, and leaves no event and no job (test 11)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-02: make it true: a job whose worker is killed mid-run is picked up by another worker within a minute (TestClock) and does its work once (test 10)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-03: make it true: a worker killed after its side effect but before its save leaves a retry that finds the effect done, records it and doesn't repeat it (test 10; CR-30 check 8)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-04: make it true: a paused worker whose job was recovered elsewhere has its late save refused (test 10's out-of-date claim; CR-30 check 2)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-05: make it true: two workers never claim the same job, under concurrent claims (test 10)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-06: make it true: a job that keeps failing retries after 10 s, 30 s, 2 min and 10 min, and ends dead after 5 tries (TestClock; test 10; CR-30 check 6)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-07: make it true: one live job per key: a second enqueue with the same key while the first is queued or running is refused or returns the first; after it finishes, a new one runs (CR-30 check 3)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-08: make it true: jobs with the same partition key (a mission) never run two at once, while other partitions run in parallel (CR-30 check 4)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-09: make it true: a worker stopped with work in flight and replaced by a new one finishes or safely resumes that work (CR-30 check 5)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-10: make it true: under concurrent transactions, events' seq order equals commit order with no gaps a reader can miss, and two copies of one consumer never both act on an event (test 11)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B13-G01: keep it true: T-B8-02 (pool-timeouts.test.ts) is back on (#61) and holds in a full parallel run: the connect timeout leaves headroom inside the 4 s guard, or the proxy counts attempts where it listens, so CPU load can't beat the proxy's accept

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/jobs/**`
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `docs/quarantine.md`
- `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b13-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/jobs/**`
- `packages/server/test/platform-hardening/pool-timeouts.test.ts`

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

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B13`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

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

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b13-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B13
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B13, "Spike 2: Step 1's jobs and events tests against a small Jobs interface, run over DBOS": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b13-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B13-jobs-spike-dbos`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b13-build-completion.md`, committed to the branch. Don't push.
