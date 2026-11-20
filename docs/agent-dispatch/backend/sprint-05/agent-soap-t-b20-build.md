---
doc: agent-soap-t-b20-build
ticket: T-B20
lane: backend
sprint: sprint-05
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B20-step-1-done
checkout: branch
after: [agent-rigg-t-b20-test-unit]
depends_on: [T-B17, T-B18, T-B19]
report: docs/agent-dispatch/backend/sprint-05/agent-soap-t-b20-build-completion.md
---


# T-B20 · build · Soap: Step 1's done-when tests and report (C5): each of tests 1 to 13 traced to a passing test, and the running server end to end

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-05 · Step 1 |
| Ticket | T-B20 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B20-step-1-done` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-05/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 1, 5, 8, 9, 10, 11; tests 1 to 13 and what CR-31 and CR-43 removed or moved
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 3 option A (the hand-built engine) and section 6 (spike 2's verdict: build A)
7. `docs/design/CR-44 A partition key on jobs.md`: accepted Nov 19: the partition_key column, its partial unique index, and the docs it touches
8. `docs/design/CR-43 Step 1 without the CLI.md`: tests 2, 4 and 13 on the clients routes; step-up and CLI login leave Step 1
9. `docs/design/Jobs and workers.md`: claims, check-ins, the reaper, the backoff, one live job per key, consumers and their cursors
10. `docs/design/Build rules.md`: C4, C5, E3, E5, E7, E8, E10, E12, F2, F4, G5, G7, H6, I3
11. `docs/design/Step 0 and Step 1 plan.md`: Tests that say Step 1 is done, and Not in Step 1
12. `docs/design/CR-43 Step 1 without the CLI.md`: tests 2, 4 and 13 restated on the clients routes; tests 5, 8 and 9 leave Step 1 with step-up and CLI login
13. `docs/agent-dispatch/backend`: each sprint's locks.md: the locked tests that already prove a Step 1 test, by ticket
14. `packages/server/src/server.ts`: startServer, which the end-to-end test drives on a free port
15. `packages/server/test/step-1/**`: the locked acceptance tests: they define done
16. `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b20-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** Anyone can see Step 1 is done: a report names, for each Step 1 test, the test that proves it, a check fails if a named test is missing, and one run of the real server exercises every Step 1 area.

**Refs:**
- Build rules C5 (a step's done-when tests are tickets of their own, written by the checker and owned by the lead)
- Step 0 and Step 1 plan, Tests that say Step 1 is done (1 to 13; 14 and 15 removed by CR-31), with CR-43's tests 2, 4 and 13 and test 12's Step 7 limit
- Backend modules and build plan.md, section 1 (Rigg writes the done-when tests first)

**Merged before this starts:** T-B17, T-B18, T-B19

**Notes from the lead:**
- docs/steps/step-1-done.md, the done-when report: one row per Step 1 test 1 to 13, with what it says, the test file and test ID that proves it, and the ticket that locked it. Tests moved out of Step 1 (5, 8, 9 under CR-43; 14 and 15 under CR-31) name where they went. Test 12's finalize half names Step 7. The report is the build's main output; the lead owns it (C5) and signs it in the PR
- Any source change is only what a done-when test shows is missing. If a test fails for a reason bigger than a small fix, stop with blocked and say which test; it becomes a ticket, not part of this one

## 4. Tasks

### T-B20-01: make it true: done-when.test.ts: docs/steps/step-1-done.md exists and has a row for each of Step 1's tests 1 to 13; every test file and test ID it names exists in the repo, and none of them is skipped or quarantined (fails on main: the report doesn't exist)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B20-G01: keep it true: the real server, started with startServer on a free port, signs the operator in, creates a client with an Idempotency-Key and leaves one activity row, accepts a signed factory merge on the webhook, and answers an unknown route with the contract's error body and X-Contract-Version

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `docs/steps/step-1-done.md`
- `packages/server/src/**`
- `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b20-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/step-1/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
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
| T-B17 | builds | `packages/server/src/platform/jobs/**`, `packages/db/src/**`, `packages/db/drizzle/**`, `packages/db/test/helpers/changes.ts`, `docs/generated/erd.md`, `docs/design/DATABASE.md`, `docs/design/Jobs and workers.md`, `docs/design/CR-30 Effect in the server, durable jobs and spans.md`, `docs/quarantine.md` |
| T-B17 | tests | `packages/server/test/jobs/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts` |
| T-B18 | builds | `packages/server/src/platform/jobs/**` |
| T-B18 | tests | `packages/server/test/consumers/**` |
| T-B19 | builds | `packages/server/src/server.ts`, `packages/server/src/main.ts`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/auth/**`, `packages/server/src/platform/webhooks/**`, `packages/server/src/platform/factory-repo/**`, `packages/server/src/knowledge/**`, `packages/server/src/onboarding/**` |
| T-B19 | tests | `packages/server/test/follow-ups/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B20`).
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
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b20-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B20
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B20, "Step 1's done-when tests and report (C5): each of tests 1 to 13 traced to a passing test, and the running server end to end": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b20-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B20-step-1-done`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b20-build-completion.md`, committed to the branch. Don't push.
