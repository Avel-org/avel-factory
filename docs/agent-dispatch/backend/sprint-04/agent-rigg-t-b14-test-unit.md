---
doc: agent-rigg-t-b14-test-unit
ticket: T-B14
lane: backend
sprint: sprint-04
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/B14-clients-routes
checkout: branch
after: []
depends_on: [T-B9]
report: docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-test-unit-completion.md
---


# T-B14 · tests · Rigg: The clients routes (8 to 11) and the activity log, carrying Step 1's DTO, idempotency and activity tests

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B14 · rigor standard |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B14-clients-routes` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

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
11. `packages/contract/src/routes/clients.ts`: routes 8 to 11: inputs, outputs, ClientDto, the rowVersion on update
12. `docs/design/API routes.md`: routes 8 to 11 (the internal client only with ?kind=internal) and the rules on every write
13. `packages/db/src/schema`: clients (kind, the one internal client, CR-13) and activity_log
14. `docs/design/DATABASE.md`: clients and activity_log: who, what, on which target and why
15. `packages/server/src/platform/idempotency.ts`: T-B8's store: every write takes an Idempotency-Key; read only
16. `packages/server/src/platform/auth`: T-B9's Caller and the request scope's Idempotency-Key header; read only
17. `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** The operator can create, list, read and edit clients through the API, a retried write never makes a second client, and every client write leaves one activity row.

**Refs:**
- CR-43 (accepted Nov 18): Step 1 tests 2, 4 and 13 on the clients routes
- Step 0 and Step 1 plan, Step 1 item 8 (activity log), tests 2, 4, 6 and 13
- API routes.md, routes 8 to 11 and the rules on every write
- Build rules E12 (onboarding owns clients, audit owns activity_log) and E13

**Merged before this starts:** T-B9

**Notes from the lead:**
- Routes 8 to 11 in the onboarding module (src/onboarding/clients/), which owns the clients table (E12). Every route needs the Caller; with no session it's 401 with the contract's body
- One mapper, toClientDto; outputs are validated against the contract, and no internal column leaves it (AGENTS.md API rules: DTOs)
- Writes (routes 9 and 11) go through T-B8's Idempotency store with the Caller's user id as the principal. Route 11 checks rowVersion: stale is 409. Database violations come back through the Db service's mapping (409 or 422); never a duplicated CHECK as the only guard
- The internal client (CR-13) can't be created through route 9: the seed makes it. Route 8 lists it only with ?kind=internal
- Activity log (item 8): an audit module (src/audit/) with one call that records who, what, on which target and why, in the same transaction as the change. Each write leaves exactly one row, and a failed write leaves none
- Routing: platform/router.ts composes the health router and routes 8 to 11; main.ts passes it to createApp. app.ts doesn't change. Don't mount sign-in in main.ts: that's T-B16, which follows this ticket
- E13: each route gets its happy path with the DTO checked, the error body with requestId, the idempotent replay for writes, and the stale rowVersion for route 11

## 4. Tasks

### T-B14-01: a failing test for: route 9 creates a client whose output has exactly ClientDto's fields and no internal column, checked against the contract (test 2)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B14-02: a failing test for: route 9 replays: the same key and body return the first response and make one client; another body is 409 IDEMPOTENCY_KEY_REUSED; a duplicate sent while the first runs is 409 IDEMPOTENCY_IN_PROGRESS (test 4)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B14-03: a failing test for: routes 10 and 11: an unknown client is 404 with the contract's body and the request's requestId (test 3)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B14-04: a failing test for: route 11 edits a client; a stale rowVersion is 409; a value the database's CHECK refuses is 422 (test 6)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B14-05: a failing test for: route 8 pages clients and leaves out the internal client unless ?kind=internal; route 9 can't create an internal client

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B14-06: a failing test for: every route without a session is 401 with the contract's body

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B14-07: a failing test for: each write (routes 9 and 11) leaves exactly one activity_log row naming the operator, the action and the client, and a refused write leaves none (test 13)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/server/test/clients/**`
- `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/idempotency.ts`
- `packages/server/src/platform/rate-limit.ts`
- `packages/server/src/platform/auth/**`
- `packages/server/package.json`
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
| T-B13 | builds | `packages/server/src/platform/jobs/**`, `packages/server/package.json`, `pnpm-lock.yaml`, `docs/quarantine.md` |
| T-B13 | tests | `packages/server/test/jobs/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts` |
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

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B14
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B14: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B14, "The clients routes (8 to 11) and the activity log, carrying Step 1's DTO, idempotency and activity tests": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B14-clients-routes`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-test-unit-completion.md`, committed to the branch. Don't push.
