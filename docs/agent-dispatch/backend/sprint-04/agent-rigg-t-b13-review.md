---
doc: agent-rigg-t-b13-review
ticket: T-B13
lane: backend
sprint: sprint-04
agent: rigg
seat: checker
kind: review
role: review
rigor: full
model: opus
branch: t/B13-jobs-spike-dbos
checkout: detached
after: [agent-soap-t-b13-build]
depends_on: []
report: docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-review-completion.md
---


# T-B13 · review · Rigg: Spike 2: Step 1's jobs and events tests against a small Jobs interface, run over DBOS

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B13 · rigor full |
| Dispatch | review · Rigg (checker) · model opus |
| Works on | a detached checkout of `t/B13-jobs-spike-dbos`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

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
16. `packages/server/test/jobs/**`: the locked acceptance tests: they define done
17. `packages/server/test/platform-hardening/pool-timeouts.test.ts`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b13-build-completion.md`: the builder's completion report
19. `docs/review/security-checklist.md`: full rigor: work through it item by item
20. `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-review.md`: this document: follow it exactly

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

### T-B13-01: check: a job enqueued in a transaction that rolls back never runs, and leaves no event and no job (test 11)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-02: check: a job whose worker is killed mid-run is picked up by another worker within a minute (TestClock) and does its work once (test 10)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-03: check: a worker killed after its side effect but before its save leaves a retry that finds the effect done, records it and doesn't repeat it (test 10; CR-30 check 8)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-04: check: a paused worker whose job was recovered elsewhere has its late save refused (test 10's out-of-date claim; CR-30 check 2)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-05: check: two workers never claim the same job, under concurrent claims (test 10)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-06: check: a job that keeps failing retries after 10 s, 30 s, 2 min and 10 min, and ends dead after 5 tries (TestClock; test 10; CR-30 check 6)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-07: check: one live job per key: a second enqueue with the same key while the first is queued or running is refused or returns the first; after it finishes, a new one runs (CR-30 check 3)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-08: check: jobs with the same partition key (a mission) never run two at once, while other partitions run in parallel (CR-30 check 4)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-09: check: a worker stopped with work in flight and replaced by a new one finishes or safely resumes that work (CR-30 check 5)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-10: check: under concurrent transactions, events' seq order equals commit order with no gaps a reader can miss, and two copies of one consumer never both act on an event (test 11)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B13-G01: check: T-B8-02 (pool-timeouts.test.ts) is back on (#61) and holds in a full parallel run: the connect timeout leaves headroom inside the 4 s guard, or the proxy counts attempts where it listens, so CPU load can't beat the proxy's accept

- Does a locked guard test hold it after the build? Cite the test.

### T-B13-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).
- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-review-completion.md`
- `docs/agent-dispatch/backend/sprint-04/findings/t-b13-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `packages/server/src/platform/jobs/**`
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `docs/quarantine.md`

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

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

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

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B13
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B13, "Spike 2: Step 1's jobs and events tests against a small Jobs interface, run over DBOS": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b13-review-completion.md`, left uncommitted. Don't push.
