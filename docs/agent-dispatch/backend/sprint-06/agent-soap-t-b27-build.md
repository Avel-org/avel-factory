---
doc: agent-soap-t-b27-build
ticket: T-B27
lane: backend
sprint: sprint-06
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B27-jobs-engine-follow-ups
checkout: branch
after: [agent-rigg-t-b27-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-06/agent-soap-t-b27-build-completion.md
---


# T-B27 · build · Soap: Jobs engine follow-ups: a consumer's stop and failure edges, the claim number proved, and the timing tests that go red under load

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B27 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B27-jobs-engine-follow-ups` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-06/codebase-analysis.md`: the codebase in short
5. `docs/design/Backend modules and build plan.md`: section 1 (the build order and the critical path) and section 4 (compute, metering, events and factory: what each owns)
6. `docs/design/Design v0.6 Main.md`: Build order steps 2, 5, 7 and 8; Cost control (budgets, reserve before spending); API routes (four callers, the proxies are services on the host)
7. `docs/design/Sandbox - Docker now, boat or MIOSA next.md`: the trust boundaries: no model key in a room, one token per dispatch revoked on every exit, git over HTTP pushing only its own branch
8. `docs/design/DATABASE.md`: credentials, budget_reservations, price_table, attempts, missions, proposals, events and agent_traces; Ownership
9. `docs/design/API routes.md`: routes 19 to 21, 52, 53, 63, 64, 104 and 109, and the rules on every write
10. `docs/design/Build rules.md`: B7, B8, C4, E3, E5, E7, E8, E9, E10, E12, E13, F4, G5, G7, H6, I3
11. `packages/server/src/platform/jobs/engine.ts`: startConsumer's pass, act, fail and stop (about lines 460 to 560): held, own, inFlight, and the swap's where clause
12. `packages/server/src/platform/jobs/jobs.ts`: the Jobs interface's doc comments: JobView.attempts (:16), Worker.stop (:53) and startConsumer (:74-82)
13. `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build-completion.md`: T-B18's deviations: runs side by side, CHECK_IN as Schedule.fixed, a consumer job's attempts counted per event
14. `packages/server/test/consumers/resume-and-takeover.test.ts`: T-B18-02: how a takeover is set up, and why copy b's swap commits before a's late one (rigg-01)
15. `docs/design/Jobs and workers.md`: a job's life 5 to 7, Event consumers and Settings; read only
16. `packages/server/test/jobs-follow-ups/**`: the locked acceptance tests: they define done
17. `packages/server/test/platform-hardening/pool-timeouts.test.ts`: the locked acceptance tests: they define done
18. `packages/server/test/follow-ups/05-close-releases-pools.test.ts`: the locked acceptance tests: they define done
19. `packages/server/test/jobs/retries.test.ts`: the locked acceptance tests: they define done
20. `packages/server/test/step-1/done-when.test.ts`: the locked acceptance tests: they define done
21. `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b27-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A deploy never hangs on a consumer, a stopped or out-raced copy never sits on a claim it holds or logs a death that didn't happen, a locked test fails if the cursor's swap ignores the claim number, Step 1's report proves test 5 in its cells, and the suite stays green on a loaded machine.

**Refs:**
- t-b18-rigg-01 (P2): no locked test proves the claim-number half of the cursor's compare-and-swap (engine.ts:478-488); deleting it leaves test/consumers and test/jobs green
- t-b18-rigg-03 (P2, F5): T-B8-02 (test/platform-hardening/pool-timeouts.test.ts:147) goes red under CPU load, on T-B18 and on its merge base 45000c9; T-B19-05 (test/follow-ups/05-close-releases-pools.test.ts:46) flaked once in T-B18's build proof
- T-B13-06 (test/jobs/retries.test.ts) flaked once under full-suite load in a MIOSA sandbox: a gap of 603000 ms where at most 602000 is allowed; 3 of 3 alone (OSA, Nov 21)
- t-b18-rigg-04 (P3): a consumer's stop waits on the event in flight with no bound; a stop during a claim can leave it held until expiry; the dead log can be wrong after another copy took the claim; a lost check-in stays in own
- t-b18-zero-01 (P3): a stop while a pass is inside claimConsumer leaves a claim the copy doesn't know it holds (the same family as rigg-04 item 2)
- t-b18-rigg-05 (P3), the code half: jobs.ts:16 (JobView.attempts) and jobs.ts:53 (Worker.stop) are wrong for a consumer
- t-b20-rigg-01 (P2): done-when.test.ts lists test 5 as moved, so row 5 of docs/steps/step-1-done.md carries its proof in prose the check never verifies. CR-43 restates test 5 on sign-in (T-B9-04, T-B16-03); it doesn't move it (Axis's C5 sign-off on #89; Javaris, Nov 21: into T-B27)
- Jobs and workers.md: a job's life 5 to 7, Event consumers, and Settings (a 30 s claim, check-ins every 10 s)

**Notes from the lead:**
- T-B20 merged (#89) and Step 1 is closed, so nothing in sprint-05 holds this ticket. Merge main into the branch before the build starts
- Row 5 (t-b20-rigg-01): the builder rewrites only row 5 of docs/steps/step-1-done.md. It stays in Step 1, restated by CR-43 on sign-in, with T-B9-04 (packages/server/test/auth/rate-limit.test.ts, T-B9) and T-B16-03 (packages/server/test/server/rate-limit.test.ts, T-B16) in its cells. The other rows don't change
- Stop is bounded by the claim it holds: a consumer's stop waits for the event in flight at most until that copy's claim would expire (the 30 s claim, Settings), then interrupts the act. The act is one transaction, so its writes roll back and the next copy acts on the event once. No new setting: the bound is the claim's length (E3, E8)
- No claim the copy doesn't know about: the claim and the copy's record of it (held) are set without a yield between them, or the pair is uninterruptible, so a stop or kill at any point either releases the claim or never took it (rigg-04 item 2, zero-01)
- fail reports dead only when its update changed the row; a copy whose 5th failure lands after its claim was taken logs no dead line and leaves the job as the other copy has it (rigg-04 item 3)
- A check-in that loses its claim removes its fiber from own, as letGo does (rigg-04 item 4)
- Fix jobs.ts's comments for a consumer: attempts counts failed tries on the event at the cursor and goes back to 0 when it moves; a consumer's stop waits for the event in flight (bounded as above), then hands the claim back (rigg-05, code half). The Jobs and workers.md half goes to CR-49 (see the header), not this ticket
- Not in this ticket: a bound on how many runs one worker holds (t-b18-rigg-02) and whether a database defect inside act counts as a failed try (t-b18-zero-02). The design names neither, so both wait for CR-49 (E3)
- The timing fixes are Rigg's, in the tests dispatch, with assertions unchanged: each test waits on the fact it reads (until() on committed state, or on the connection count settling) instead of on how fast this process is scheduled. No wall-clock sleeps (F4). The builder can't change them (F2); they join this ticket's lock line
- The load proof, in the tests dispatch: after the timing fixes, T-B8-02, T-B19-05 and T-B13-06 pass on 5 runs in a row of pnpm --filter @avel/server test with one CPU burner per core beside it (node busy loops, no new dependency, never in the test suite). Rigg reports the 5 runs and the load average; the build reruns it in its own verification. The T-B13, T-B17 and T-B18 tests keep passing unchanged
- Never run more than one vitest at a time; for the load proof, load comes from CPU burners beside the run, not a second vitest (Nov 20's out-of-memory crashes)

## 4. Tasks

### T-B27-01: make it true: a consumer whose handler never returns: under TestClock, stop returns once the copy's claim would have expired (within 30 s of the claim's last check-in), the handler's writes are rolled back, and a new copy acts on the event once (rigg-04 item 1)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B27-02: make it true: a copy stopped right after its first claim commits, before its first event: a new copy acts on that first event within 10 s, not after the claim's expiry (rigg-04 item 2, zero-01)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B27-03: make it true: a copy whose 5th failure on an event lands after another copy took its claim: no 'dead' log line, the job isn't dead, and the other copy goes on (rigg-04 item 3)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B27-04: make it true: done-when.test.ts no longer lists test 5 as moved: row 5 must name its files and test IDs, and the check verifies them like any other row (fails on main: row 5 says moved, with none in its cells; t-b20-rigg-01)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B27-05: make it true: a copy that loses its claim three times keeps no finished check-in fibers: the copy's held fibers don't grow with lost claims (rigg-04 item 4; through whatever the engine exposes to tests, or by stop returning promptly with none left)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B27-G01: keep it true: T-B18-02's variant (rigg-01): copy b's handler, like a's, waits on its own Deferred; a's late hold is released first, and a's write isn't saved and the cursor doesn't move; then b is released, the cursor moves once and only b's write stays. It passes on main (the code has the check); Rigg shows it fails with engine.ts's claim_no condition deleted, in a scratch worktree, and reports the run

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/jobs/**`
- `docs/steps/step-1-done.md`
- `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b27-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/jobs-follow-ups/**`
- `packages/server/test/platform-hardening/pool-timeouts.test.ts`
- `packages/server/test/follow-ups/05-close-releases-pools.test.ts`
- `packages/server/test/jobs/retries.test.ts`
- `packages/server/test/step-1/done-when.test.ts`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/platform/db/**`
- `packages/server/src/server.ts`
- `packages/server/src/main.ts`
- `packages/db/**`
- `packages/contract/**`
- `docs/design/**`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B21 | builds | `packages/server/src/compute/credentials/**`, `packages/server/src/server.ts` |
| T-B21 | tests | `packages/server/test/credentials/**` |
| T-B22 | builds | `packages/server/src/metering/**`, `docs/design/DATABASE.md`, `packages/db/src/owners.ts` |
| T-B22 | tests | `packages/server/test/metering/**` |
| T-B24 | builds | `packages/server/src/factory/decisions/**`, `packages/server/src/platform/status/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B24 | tests | `packages/server/test/decisions/**`, `packages/server/test/status/**` |
| T-B25 | builds | `packages/server/src/factory/missions/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B25 | tests | `packages/server/test/missions/**` |
| T-B26 | builds | `packages/server/src/events/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B26 | tests | `packages/server/test/streams/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B27`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b27-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B27
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B27, "Jobs engine follow-ups: a consumer's stop and failure edges, the claim number proved, and the timing tests that go red under load": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b27-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B27-jobs-engine-follow-ups`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b27-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/B27-jobs-engine-follow-ups`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
