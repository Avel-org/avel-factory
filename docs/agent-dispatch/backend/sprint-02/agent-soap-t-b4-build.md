---
doc: agent-soap-t-b4-build
ticket: T-B4
lane: backend
sprint: sprint-02
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B4-db-service
checkout: branch
after: [agent-rigg-t-b4-test-unit]
depends_on: [T-B3]
report: docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build-completion.md
---


# T-B4 · build · Soap: The Db service: withTransaction, Tx, Events.append and commitWithEvents (spike 1 check 2)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B4 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B4-db-service` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-02/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 3 (database errors) and 10 (events and seq), and test 6
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 2 (the Db service: withTransaction, Tx, Events.append, commitWithEvents) and section 6 (spike 1 check 2)
7. `docs/design/CR-39 Effect's language service on TypeScript 7.md`: the accepted change: @effect/tsgo 0.64.1 replaces @effect/language-service, run in the editor and CI
8. `docs/design/Build rules.md`: C4 (full rigor), E5 (one lockfile change per cycle), E9 (spike 2 before the jobs engine), E10 (real Postgres), F2 (locked tests), H6 (the lock check)
9. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 2: withTransaction takes a pool client as a scoped resource, provides Tx, commits or rolls back; Events.append needs Tx; commitWithEvents takes the advisory lock and assigns seq last
10. `docs/design/Step 0 and Step 1 plan.md`: Step 1 item 10 (one transaction for a change, its event and its job; seq under the advisory lock as the last statement) and test 6
11. `packages/db/src/schema/events.ts`: the events table: seq, and 'taken under an advisory lock as the last statement before commit'
12. `packages/server/src/platform/db/errors.ts`: T-B3's mapper: every database error inside withTransaction goes through it
13. `packages/server/src/platform/ids.ts`: the pattern for an Effect service and its Layer (T-B1)
14. `packages/server/test/db`: T-B3's harness, which this ticket's tests reuse
15. `packages/server/test/db-service/**`: the locked acceptance tests: they define done
16. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A state change and its events commit together or not at all, events get seq in commit order, and Events.append outside a transaction doesn't compile.

**Refs:**
- CR-30 section 2 (the Db service) and section 6, spike 1 check 2
- Step 0 and Step 1 plan, Step 1 item 10 and test 6
- AGENTS.md, Writing Effect rules 6 and 8, and the Events.append rule

**Merged before this starts:** T-B3

**Notes from the lead:**
- Db is an Effect service with a Layer built from DATABASE_URL read through Config as Redacted, holding one node-postgres Pool released in the layer's finalizer. No route uses it yet: wiring it into app.ts comes with the first route that writes
- withTransaction(program): acquireRelease a pool client, BEGIN, provide Tx (the Drizzle transaction), COMMIT on success, ROLLBACK on failure, defect or interruption, and always release the client (Writing Effect rule 6). Database errors are mapped through T-B3's function, so a program sees tagged errors, never pg's
- Events.append(event) requires Tx in its type, so it can't be called outside withTransaction. It only queues the event for this transaction
- commitWithEvents: the one way to commit when events are queued. It takes the transaction-level advisory lock, inserts the queued events as the last statement (so seq follows commit order), then commits. If events are queued and the program ends without it, the transaction fails as a defect rather than dropping them. No other code takes the lock
- Spike 1 check 2: the report gives pass or fail, with evidence, and says whether anything needed a beta package, a fork or a patch (Javaris's Effect decision, CR-30 decision 1). A fail stops with needs-cr
- Full rigor (C4: events and seq): Javaris merges it, and the second review follows the security checklist

## 4. Tasks

### T-B4-01: make it true: withTransaction commits a program that succeeds: its rows are there afterwards

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B4-02: make it true: a program that fails with a tagged error, dies, or is interrupted is rolled back, and the pool client is released each time

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B4-03: make it true: spike 1 check 2: a program that appends an event and then fails leaves no event and no row

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B4-04: make it true: spike 1 check 2: Events.append outside withTransaction fails to compile (a type-level test, checked by the server typecheck)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B4-05: make it true: commitWithEvents: under concurrent transactions, events' seq order equals commit order, with no gap a reader at the last seq can miss

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B4-06: make it true: test 6 through the Db service: a unique violation inside withTransaction reaches the caller as AlreadyExists (409), a CHECK violation as ConstraintViolation (422), and a stale rowVersion update as StaleVersion (409)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/db/db.ts`
- `packages/server/src/platform/db/tx.ts`
- `packages/server/src/platform/db/events.ts`
- `packages/server/src/platform/db/index.ts`
- `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/db-service/**`

**Never change, whatever the task says:**
- `packages/server/src/platform/db/errors.ts`
- `packages/server/src/platform/errors.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/app.ts`
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
| T-B2 | builds | `packages/server/package.json`, `packages/server/tsconfig.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml`, `docs/design/Outside sources and what we took.md` |
| T-B2 | tests | `tools/repo-checks/test/dependencies.test.ts`, `tools/repo-checks/test/effect-check.test.ts`, `tools/repo-checks/test/fixtures/effect/**` |
| T-B3 | builds | `packages/server/src/platform/db/errors.ts`, `packages/server/src/platform/errors.ts` |
| T-B3 | tests | `packages/server/test/db/**` |
| T-B5 | builds | `tools/repo-checks/src/**` |
| T-B5 | tests | `tools/repo-checks/test/locks-merges.test.ts` |
| T-B6 | builds | `packages/contract/src/errors.ts`, `packages/contract/src/version.ts`, `docs/generated/**` |
| T-B6 | tests | `packages/contract/test/defect-code.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B4`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B4
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B4, "The Db service: withTransaction, Tx, Events.append and commitWithEvents (spike 1 check 2)": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B4-db-service`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build-completion.md`, committed to the branch. Don't push.
