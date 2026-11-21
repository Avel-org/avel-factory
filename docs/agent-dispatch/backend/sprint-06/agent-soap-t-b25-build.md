---
doc: agent-soap-t-b25-build
ticket: T-B25
lane: backend
sprint: sprint-06
agent: soap
seat: builder
kind: build
role: build
rigor: standard
model: opus
branch: t/B25-missions
checkout: branch
after: [agent-rigg-t-b25-test-unit]
depends_on: [T-B24]
report: docs/agent-dispatch/backend/sprint-06/agent-soap-t-b25-build-completion.md
---


# T-B25 · build · Soap: Missions: create a draft, list them and open one (routes 19, 20 and 21)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B25 · rigor standard |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B25-missions` |
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
11. `packages/contract/src/dto/missions.ts`: MissionDto (displayState, plain, deadline, clientMain), GateStripItem, MissionListRowDto, ListMissionsInput, CreateMissionInput, OnboardingJourneyDto and MissionDetailDto
12. `packages/contract/src/routes/missions.ts`: routes 19, 20 and 21: inputs, outputs and declared errors
13. `packages/db/src/schema/factory.ts`: missions: its state CHECK, kind, budget columns and row_version; mission_pauses for displayState
14. `packages/server/src/factory/decisions/index.ts`: T-B24's per-mission count: needsYouCount and blocked_on_you; read only
15. `packages/server/src/onboarding/clients`: the route pattern: idempotent write, the activity row and its event in one transaction, the mapper
16. `packages/server/src/audit/activity.ts`: the activity row an operator write leaves
17. `docs/design/Canon onboarding v0.5.md`: the journey's stages and progress, which route 21 computes from onboarding's rows; the opener is Canon's (Step 7), not route 20's
18. `packages/server/test/missions/**`: the locked acceptance tests: they define done
19. `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b25-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A new mission made in the control room is saved as a draft, shows up in the missions list with its strip and counts, and opens on its own page with its onboarding journey, checkpoints and deliveries, all from real rows.

**Refs:**
- API routes.md: route 19 (MissionListRowDto, ?kind=), route 20 (a draft with a name and an optional client, CR-W22) and route 21 (MissionDetailDto)
- Contract response to CR-W1 to W22: route 19's row, route 20's input and route 21's shape
- CR-W5 Mission summary and status: the list's strip, counts and needs-you
- Design v0.6 Main, Build order step 7: a mission is a draft before Canon's first question (Canon himself is Step 7's)
- Build rules E13: four tests per route

**Merged before this starts:** T-B24

**Notes from the lead:**
- The factory module owns missions (packages/db/src/owners.ts); its routes live in packages/server/src/factory/missions/. One mapper per DTO (toMissionDto, toMissionListRowDto); no Drizzle row leaves the server
- Route 20 writes the mission as a draft with its name and optional client (kind unset: Canon's first question sets it, CR-W22), its activity row and missions.mission.created, in one transaction through the idempotency store. Its budget comes from the design's $150 mission budget as one named constant citing Design v0.6 Main, until finalize pins factory.yaml's (Step 7). It writes nothing of onboarding's: the session and the opener are Canon's (Step 7). An unknown clientId is the database's refusal mapped to 422, not a check in code alone
- Route 19 pages missions by the contract's cursor with ?kind= (unset lists missions whose kind isn't set) and ?clientId=. Each row's gates, modules, runningDispatches and lastEventAt come from their tables (gate evaluations, module runs, dispatches, events), and needsYouCount from T-B24's count. A draft has its strip at its first state and zero counts. No money on the row (CR-W5)
- Route 21 returns MissionDetailDto: the mission, its strip, the onboarding journey computed from onboarding's rows (empty session and zeros for a draft), checkpoints and deliveries. displayState follows the contract's rule (an open operator pause is paused; an open proposal or budget pause is blocked_on_you). Reading other modules' tables is allowed; writing them isn't (E12)
- Plain words come from the contract's plain templates. Client and agent text goes out as plain text
- Anything route 21's shape needs that no column holds is a needs-cr, not a placeholder of our own (E3)

## 4. Tasks

### T-B25-01: make it true: route 20 with a name (and with a client) returns the draft mission valid against MissionDto, writes one missions row, one activity row and one missions.mission.created event in the same transaction

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B25-02: make it true: route 20 replayed with the same Idempotency-Key and body returns the first response and writes nothing more; the same key with another body is 409

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B25-03: make it true: route 20 with an unknown clientId is 422 with the contract's body and requestId, and writes nothing; without an Idempotency-Key it's 400

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B25-04: make it true: route 19 lists the drafts as rows valid against MissionListRowDto, filters by ?kind=unset and ?clientId=, and pages by cursor without repeating or skipping a mission

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B25-05: make it true: a mission with an open proposal shows needsYouCount 1 and displayState blocked_on_you on route 19 and route 21; one with an open operator pause shows paused

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B25-06: make it true: route 21 returns MissionDetailDto for a draft (an empty journey, no checkpoints, no deliveries), valid against the contract; an unknown missionId is 404 with the contract's body and requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B25-07: make it true: routes 19, 20 and 21 without a session are 401 with the contract's body and requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/factory/missions/**`
- `packages/server/src/platform/router.ts`
- `packages/server/src/platform/errors.ts`
- `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b25-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/missions/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/factory/decisions/**`
- `packages/server/src/onboarding/**`
- `packages/server/src/server.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/db/**`
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
| T-B22 | builds | `packages/server/src/metering/**` |
| T-B22 | tests | `packages/server/test/metering/**` |
| T-B24 | builds | `packages/server/src/factory/decisions/**`, `packages/server/src/platform/status/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B24 | tests | `packages/server/test/decisions/**`, `packages/server/test/status/**` |
| T-B26 | builds | `packages/server/src/events/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B26 | tests | `packages/server/test/streams/**` |
| T-B27 | builds | `packages/server/src/platform/jobs/**`, `docs/steps/step-1-done.md` |
| T-B27 | tests | `packages/server/test/jobs-follow-ups/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts`, `packages/server/test/follow-ups/05-close-releases-pools.test.ts`, `packages/server/test/jobs/retries.test.ts`, `packages/server/test/step-1/done-when.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B25`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b25-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B25
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B25, "Missions: create a draft, list them and open one (routes 19, 20 and 21)": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b25-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B25-missions`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b25-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/B25-missions`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
