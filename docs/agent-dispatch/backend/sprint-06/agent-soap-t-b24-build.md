---
doc: agent-soap-t-b24-build
ticket: T-B24
lane: backend
sprint: sprint-06
agent: soap
seat: builder
kind: build
role: build
rigor: standard
model: opus
branch: t/B24-status-and-decisions
checkout: branch
after: [agent-rigg-t-b24-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-06/agent-soap-t-b24-build-completion.md
---


# T-B24 · build · Soap: The top bar and Decisions, from real rows: routes 104, 52 and 53

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B24 · rigor standard |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B24-status-and-decisions` |
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
11. `packages/contract/src/dto/decisions.ts`: PendingDecisionDto's ten kinds, the shared base (ref, owner, asOfSeq, plain, evidence, reasonRequired, rejectable, unlocks, previous), the order, and ProposalViewDto
12. `packages/contract/src/dto/health.ts`: StatusDto and AlertDto: slots, needsYouCount, alerts, stallAfterMs, lastSeq
13. `packages/contract/src/plain-templates.ts`: the plain words each kind carries, written by the server
14. `docs/design/CR-W2 Pending decisions.md`: what each kind is, where its row comes from, and the ordering
15. `docs/design/CR-W5 Mission summary and status.md`: the status read: slots, what needs you, alerts
16. `packages/server/src/onboarding/clients`: the route pattern to follow: the mapper, the router entry, the 401 through errors.ts
17. `packages/server/src/platform/router.ts`: where a module's routes join the contract's tree
18. `packages/server/test/decisions/**`: the locked acceptance tests: they define done
19. `packages/server/test/status/**`: the locked acceptance tests: they define done
20. `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b24-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The control room's top bar shows real slots, alerts and how many things need the operator, and Decisions lists every item waiting on the operator from the factory's own tables, in the server's order, each with its plain words.

**Refs:**
- API routes.md: route 104 (GET /api/status, CR-W5), route 52 (GET /api/pending-decisions, the 10-kind union, CR-W2) and route 53 (GET /api/proposals/{proposalId})
- CR-W5 Mission summary and status: the status read, its slots, needs-you count and alerts
- CR-W2 Pending decisions: the union, its ref, its ordering
- Design v0.6 Main, Build order step 5: the avel watch header reads this status (the CLI itself waits, Nov 18)
- Build rules E13: four tests per route

**Notes from the lead:**
- The pending-decisions query lives in packages/server/src/factory/decisions/ and is exported from its index.ts with a per-mission count, because T-B25's mission rows (needsYouCount, displayState) use it. It only reads: proposals, checkpoints, plans, questions, receipts and pass approvals, the dispatch package's commit, follow-ups. It writes nothing
- Route 52 serves nine kinds from the factory's tables. factory_change isn't served: open factory PRs live on GitHub, not in a table (the contract's dto/factory.ts), and come with routes 72 and 73. Say so in the report. A kind whose row the docs don't place, or whose fields no column holds, is a needs-cr, not a guess (E3)
- Ordering and paging as the contract says: items that came back first, then expiring soonest, then deadline risk, then oldest; the contract's cursor and limit. asOfSeq is the latest event seq the item reflects
- Route 104: slots.total is 6 (Design v0.6 Main: up to 6 dispatches at once) as one named constant citing it, until the scheduler reads it from factory.yaml (9b); slots.busy counts the dispatches running now. needsYouCount is route 52's count. alerts are the system.alert.raised events with no later system.alert.cleared for the same key. lastSeq is the latest committed seq. No money
- Agent, client and Canon text goes out as plain text, never HTML (AGENTS.md)
- The 401 without a session and the 404 for an unknown proposal go through errors.ts's table, with the contract's body and requestId (Writing Effect rule 3)

## 4. Tasks

### T-B24-01: make it true: route 52 returns one row for each open item it serves (an open proposal, a checkpoint waiting for approval, a plan waiting to be finalized, an unanswered question, a pass approval and a release due, a dispatch package commit due, a follow-up and an upkeep offer, inserted as rows), each valid against PendingDecisionDto, with a resolved or expired item absent

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B24-02: make it true: route 52 orders items that came back first, then expiring soonest, then oldest, and pages with the contract's cursor and limit without repeating or skipping a row

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B24-03: make it true: route 53 returns a proposal's ProposalViewDto, valid against the contract; an unknown proposal id is 404 with the contract's body and the request's requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B24-04: make it true: route 104 returns slots { busy, total: 6 }, needsYouCount equal to route 52's count, the raised alerts that weren't cleared (a cleared one is absent), and lastSeq equal to the latest committed event's seq, valid against StatusDto

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B24-05: make it true: routes 52, 53 and 104 without a session are 401 with the contract's body and requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B24-06: make it true: a proposal's text holding <script> comes back as the same plain characters

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B24-07: make it true: the per-mission count exported from factory/decisions counts only that mission's open items

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/factory/decisions/**`
- `packages/server/src/platform/status/**`
- `packages/server/src/platform/router.ts`
- `packages/server/src/platform/errors.ts`
- `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b24-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/decisions/**`
- `packages/server/test/status/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/server.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/jobs/**`
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
| T-B21 | builds | `packages/server/src/compute/credentials/**`, `packages/server/src/server.ts` |
| T-B21 | tests | `packages/server/test/credentials/**` |
| T-B22 | builds | `packages/server/src/metering/**`, `docs/design/DATABASE.md`, `packages/db/src/owners.ts` |
| T-B22 | tests | `packages/server/test/metering/**` |
| T-B25 | builds | `packages/server/src/factory/missions/**`, `packages/contract/src/routes/missions.ts`, `packages/contract/src/version.ts`, `packages/contract/package.json`, `docs/generated/openapi.json`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B25 | tests | `packages/server/test/missions/**`, `packages/contract/test/cr-w32.test.ts` |
| T-B26 | builds | `packages/server/src/events/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B26 | tests | `packages/server/test/streams/**` |
| T-B27 | builds | `packages/server/src/platform/jobs/**`, `docs/steps/step-1-done.md` |
| T-B27 | tests | `packages/server/test/jobs-follow-ups/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts`, `packages/server/test/follow-ups/05-close-releases-pools.test.ts`, `packages/server/test/jobs/retries.test.ts`, `packages/server/test/step-1/done-when.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B24`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b24-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B24
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B24, "The top bar and Decisions, from real rows: routes 104, 52 and 53": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b24-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B24-status-and-decisions`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b24-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/B24-status-and-decisions`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
