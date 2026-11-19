---
doc: agent-rigg-t-b14-review
ticket: T-B14
lane: backend
sprint: sprint-04
agent: rigg
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/B14-clients-routes
checkout: detached
after: [agent-soap-t-b14-build]
depends_on: [T-B9]
report: docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-review-completion.md
---


# T-B14 · review · Rigg: The clients routes (8 to 11) and the activity log, carrying Step 1's DTO, idempotency and activity tests

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B14 · rigor standard |
| Dispatch | review · Rigg (checker) · model sonnet |
| Works on | a detached checkout of `t/B14-clients-routes`'s head |
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
11. `packages/contract/src/routes/clients.ts`: routes 8 to 11: inputs, outputs, ClientDto, the rowVersion on update
12. `docs/design/API routes.md`: routes 8 to 11 (the internal client only with ?kind=internal) and the rules on every write
13. `packages/db/src/schema`: clients (kind, the one internal client, CR-13) and activity_log
14. `docs/design/DATABASE.md`: clients and activity_log: who, what, on which target and why
15. `packages/server/src/platform/idempotency.ts`: T-B8's store: every write takes an Idempotency-Key; read only
16. `packages/server/src/platform/auth`: T-B9's Caller and the request scope's Idempotency-Key header; read only
17. `packages/server/test/clients/**`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b14-build-completion.md`: the builder's completion report
19. `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-review.md`: this document: follow it exactly

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

### T-B14-01: check: route 9 creates a client whose output has exactly ClientDto's fields and no internal column, checked against the contract (test 2)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B14-02: check: route 9 replays: the same key and body return the first response and make one client; another body is 409 IDEMPOTENCY_KEY_REUSED; a duplicate sent while the first runs is 409 IDEMPOTENCY_IN_PROGRESS (test 4)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B14-03: check: routes 10 and 11: an unknown client is 404 with the contract's body and the request's requestId (test 3)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B14-04: check: route 11 edits a client; a stale rowVersion is 409; a value the database's CHECK refuses is 422 (test 6)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B14-05: check: route 8 pages clients and leaves out the internal client unless ?kind=internal; route 9 can't create an internal client

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B14-06: check: every route without a session is 401 with the contract's body

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B14-07: check: each write (routes 9 and 11) leaves exactly one activity_log row naming the operator, the action and the client, and a refused write leaves none (test 13)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B14-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-review-completion.md`
- `docs/agent-dispatch/backend/sprint-04/findings/t-b14-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `packages/server/src/onboarding/**`
- `packages/server/src/audit/**`
- `packages/server/src/platform/router.ts`
- `packages/server/src/main.ts`

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

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B14
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B14, "The clients routes (8 to 11) and the activity log, carrying Step 1's DTO, idempotency and activity tests": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b14-review-completion.md`, left uncommitted. Don't push.
