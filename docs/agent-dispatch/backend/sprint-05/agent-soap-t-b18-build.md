---
doc: agent-soap-t-b18-build
ticket: T-B18
lane: backend
sprint: sprint-05
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B18-event-consumers
checkout: branch
after: [agent-rigg-t-b18-test-unit]
depends_on: [T-B17]
report: docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build-completion.md
---


# T-B18 · build · Soap: Event consumers: claimed, resumable, compare-and-swap cursors that act on each committed event once

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-05 · Step 1 |
| Ticket | T-B18 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B18-event-consumers` |
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
11. `docs/design/Jobs and workers.md`: Event consumers: what a consumer reacts to, its cursor and its claim number
12. `packages/server/src/platform/jobs/jobs.ts`: T-B17's Jobs interface: startConsumer and ConsumedEvent
13. `packages/db/src/schema/platform.ts`: consumer_cursors: one row per consumer, its last seq and its claim number
14. `packages/server/src/platform/db/db.ts`: commitWithEvents takes seq under the advisory lock as the last statement; why a reader can't miss a gap; read only
15. `packages/server/test/jobs/consumers.test.ts`: T-B13-10, which T-B17 already passes; these tests go beyond it and must not repeat it; read only
16. `packages/server/test/consumers/**`: the locked acceptance tests: they define done
17. `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A consumer acts on every committed event once and in order, keeps its place across a crash, a restart or a failing handler, and a consumer that outlived its claim can't move the cursor.

**Refs:**
- Step 0 and Step 1 plan, Step 1 item 10 (consumers are claimed jobs that move their cursor only by compare-and-swap) and test 11
- Jobs and workers.md, Event consumers: a cursor moved only by compare-and-swap, and a claim number of its own
- AGENTS.md, Architecture rules (durable work: a state change, its event and any follow-up job in one transaction)

**Merged before this starts:** T-B17

**Notes from the lead:**
- A consumer is a claimed job (item 10): one claim per consumer name, with its own claim_no and expiry, checked in and reaped like any job. A copy whose claim was taken over can't move the cursor: the compare-and-swap is on the cursor's seq and the claim number together
- The handler's act and the cursor's move commit in one transaction when the handler writes through Tx, so an event is acted on once. A handler that fails leaves the cursor where it was; the same event is retried on T-B17's backoff and never skipped. Say in the report what happens after the 5th failure (dead, and the consumer stops) and how the operator would see it; if the design doesn't say, stop with needs-cr rather than choose (E3)
- A consumer that enqueues a follow-up job does it in the same transaction as its cursor move, so a crash leaves both or neither
- Under concurrent writers, including one that rolls back, the consumer sees every committed seq once, in order, with none skipped and none repeated
- No consumer kind is registered in the running server: Step 1 has none (E8). Keep T-B13's tests passing unchanged

## 4. Tasks

### T-B18-01: make it true: a consumer stopped after acting on event n and started again (a new copy, same name) resumes at n + 1 from consumer_cursors, and acts on nothing twice

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B18-02: make it true: a consumer copy killed mid-handle has its claim expire and taken over within a minute (TestClock); the new copy handles that event once, and the dead copy's late cursor move is refused

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B18-03: make it true: a handler that fails leaves the cursor unchanged; the same event is retried after 10 s (TestClock) and the events after it aren't acted on first

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B18-04: make it true: a handler that writes through Tx and enqueues a follow-up job commits both with the cursor move; a failure in the same transaction leaves no write, no job and the cursor where it was

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B18-05: make it true: with 20 concurrent writer transactions, some rolled back, a consumer started before them acts on exactly the committed events, once each, in seq order (test 11)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B18-06: make it true: two consumers with different names each see every event, and each keeps its own cursor

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/jobs/**`
- `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/consumers/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/app.ts`
- `packages/server/src/server.ts`
- `packages/server/src/main.ts`
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
| T-B17 | builds | `packages/server/src/platform/jobs/**`, `packages/db/src/**`, `packages/db/drizzle/**`, `packages/db/test/helpers/changes.ts`, `packages/db/test/done-when-2.count.test.ts`, `docs/generated/erd.md`, `docs/design/DATABASE.md`, `docs/design/Jobs and workers.md`, `docs/design/CR-30 Effect in the server, durable jobs and spans.md`, `docs/quarantine.md` |
| T-B17 | tests | `packages/server/test/jobs/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts` |
| T-B19 | builds | `packages/server/src/server.ts`, `packages/server/src/main.ts`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/auth/**`, `packages/server/src/platform/webhooks/**`, `packages/server/src/platform/factory-repo/**`, `packages/server/src/knowledge/**`, `packages/server/src/onboarding/**` |
| T-B19 | tests | `packages/server/test/follow-ups/**` |
| T-B20 | builds | `docs/steps/step-1-done.md`, `packages/server/src/**` |
| T-B20 | tests | `packages/server/test/step-1/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B18`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B18
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B18, "Event consumers: claimed, resumable, compare-and-swap cursors that act on each committed event once": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B18-event-consumers`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b18-build-completion.md`, committed to the branch. Don't push.
