---
doc: agent-rigg-t-b22-test-unit
ticket: T-B22
lane: backend
sprint: sprint-06
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: full
model: sonnet
branch: t/B22-model-proxy
checkout: branch
after: []
depends_on: [T-B21]
report: docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b22-test-unit-completion.md
---


# T-B22 · tests · Rigg: The model proxy, the meter of record: the only model key, a reservation before each request, and the $4 attempt cap

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B22 · rigor full |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B22-model-proxy` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-06/codebase-analysis.md`: the codebase in short
5. `docs/design/Backend modules and build plan.md`: section 1 (the build order and the critical path) and section 4 (compute, metering, events and factory: what each owns)
6. `docs/design/Design v0.6 Main.md`: Build order steps 2, 5, 7 and 8; Cost control (budgets, reserve before spending); API routes (four callers, the proxies are services on the host)
7. `docs/design/Sandbox - Docker now, boat or MIOSA next.md`: the trust boundaries: no model key in a room, one token per dispatch revoked on every exit, git over HTTP pushing only its own branch
8. `docs/design/DATABASE.md`: credentials, budget_reservations, price_table, attempts, missions, proposals, events and agent_traces; Ownership
9. `docs/design/API routes.md`: routes 19 to 21, 52, 53, 63, 64, 104 and 109, and the rules on every write
10. `docs/design/Build rules.md`: B7, B8, C4, E3, E5, E7, E8, E9, E10, E12, E13, F4, G5, G7, H6, I3
11. `docs/design/Design v0.6 Main.md`: Cost control: the price table, the cache-write split, reserve before spending, the per-request ceiling, capped against budget_parked, and the 80% warning (not in this ticket)
12. `docs/design/DATABASE.md`: Cost and time: budget_reservations (kind expected or request, one per proxy call, a retried request can't reserve twice, the reaper releases held rows) and price_table; Ownership
13. `packages/db/src/schema/metering.ts`: budget_reservations and price_table, and their CHECKs (settled never above reserved)
14. `packages/db/src/schema/runner.ts`: attempts: cap_micros, reserved_micros, cost_micros and attempts_cap_ck, which refuses a reservation past the cap
15. `packages/db/src/schema/factory.ts`: missions and module_runs: budget_micros, reserved_micros, spent_micros and the CHECKs that refuse an overspend
16. `packages/server/src/compute/credentials/index.ts`: T-B21's verify: a dispatch token (an attempt) or a service token (Canon's session); read only
17. `docs/design/CR-22 Rooms on MIOSA and room hooks.md`: items 3 and the --max-budget-usd note: what the harness in a room sends, and that the proxy stays the meter of record
18. `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b22-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** Every model call goes through one proxy that holds the only key, reserves the request's maximum cost against the attempt's $4 cap and the module and mission budgets before sending, refuses what they can't cover, and records exactly what each call cost.

**Refs:**
- Design v0.6 Main, Build order step 2 (the model proxy: key and meter) and step 8 (the proxy's per-request reservations and the $4 attempt cap), brought forward together (decision 1)
- Design v0.6 Main, Cost control: budgets in dollars enforced at the model proxy; reserve before spending; capped and budget_parked
- Sandbox doc: the model key stays on the host; the proxy adds it, allows only the messages endpoint and requires the dispatch's token
- CR-22 item 3: ANTHROPIC_BASE_URL points at the proxy and ANTHROPIC_AUTH_TOKEN is the attempt's dispatch token
- Port inventory: token usage and prices with changes (split 5-minute and 1-hour cache writes; the proxy is the meter of record)
- CR-48 (accepted Nov 21, decision 5): metering writes attempts.cost_micros as well as the reserved and spent columns

**Merged before this starts:** T-B21

**Labels:** schema · implements CR-48

**Notes from the lead:**
- CR-48 is accepted (docs/design/CR-48 Metering writes an attempt's cost.md). Make its two Touches edits and nothing more: DATABASE.md's Ownership sentence and owners.ts's header comment. No table, column, CHECK or migration changes
- The proxy is its own Hono app and its own process (Design v0.6 Main: the model proxy and the egress proxy are separate services on the host): startModelProxy(env) in packages/server/src/metering/proxy/, with its own entry file beside it, its own port and its own pools in one Scope (Writing Effect rule 6). The main service never reads the model key: the key is Config.Redacted, read only by startModelProxy, which refuses to start without it, naming the variable and never the value
- Callers: a room's harness with its attempt's dispatch token, and Canon with a session's service token (T-B21's verify). It allows only POST /v1/messages; anything else, and any request without a valid token, is refused before any vendor call. It strips the caller's credentials and adds the factory's key. The vendor is a layer over fetch with a timeout (rule 5); tests provide a fake vendor layer (E10)
- Reserve before sending, in one transaction: a budget_reservations row of kind request for the attempt (or the session) with its request_id, and the same amount added to the attempt's reserved_micros, its module run's and its mission's (a session's: the mission's only). The amount is the request's maximum cost: its input tokens priced at the highest of the input and cache-write prices, plus max_tokens at the output price, from the price_table row valid now (Clock) for the vendor and model. Input is counted before sending through the vendor layer's token count, with no tokenizer package (E5). A request with no valid price is refused
- The database enforces the ceilings (attempts_cap_ck and the module and mission CHECKs). A refusal from the attempt's CHECK is the cap (the attempt will end capped); one from the module's or the mission's is the budget (budget_parked). Map each by constraint name, never by re-checking in code alone (AGENTS.md: the database enforces its rules). Answer the harness in the vendor's error shape with the reason, and send nothing. Ending the attempt is the runner's (Step 4): this ticket writes no attempts.outcome (E8, E12)
- Settle once the vendor's stream ends: price the usage it reported (input, output, cache reads, cache writes at 5 minutes and at 1 hour, each from price_table), set settled_micros, move the attempt's reserved into cost_micros and the module's and mission's reserved into spent_micros, and append metering.spend.updated (usage.recorded), in one transaction. The response streams through to the caller as it arrives; output is never clamped
- Never undercount: if the stream fails, times out or the caller aborts before the vendor's final usage, settle what the vendor reported so far if that's all it will report, and otherwise keep the full reservation as spent. The reservation is a resource with acquireRelease, so an interrupted request never leaves a held row. A retry of the reservation write with the same request_id reserves once (the unique index)
- Housekeeping in the proxy's process: a reaper job kind releases held reservations of ended attempts and ended onboarding sessions (DATABASE.md: the reaper releases held rows), at startup and on its schedule
- Money stays in micro-dollars, as integers. No money goes on a web-facing route or event beyond AI cost against its cap (AGENTS.md). The key, a token or a prompt's text never appears in a log line, a row or an event
- List the proxy's settings by name in the report (its port, the vendor's base URL, ANTHROPIC_API_KEY, DATABASE_URL): Javaris adds them to .env.example

## 4. Tasks

### T-B22-01: a failing test for: a request with a running attempt's dispatch token reaches the fake vendor with the factory's key and without the caller's token, and its streamed reply reaches the caller unchanged

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-02: a failing test for: after the reply, the reservation is settled at the usage's price from price_table (input, output, cache read, 5-minute and 1-hour cache writes each at their own price), and the attempt's cost_micros and the module's and mission's spent_micros rise by exactly that amount, with one metering.spend.updated event in the same transaction and nothing left reserved

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-03: a failing test for: a request to any path but POST /v1/messages, or with a missing, revoked, expired or non-dispatch, non-service token, is refused and the fake vendor sees no call

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-04: a failing test for: a request whose maximum cost the attempt's $4 cap can't cover is refused with the cap's reason and never sent; one the module's or the mission's budget can't cover is refused with the budget's reason and never sent; the two reasons differ

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-05: a failing test for: 20 concurrent requests on one attempt never take reserved plus cost past its cap, and concurrent requests across a module's attempts never take it past its budget; every request that reached the vendor had its reservation first

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-06: a failing test for: a request for a model with no price_table row valid at the TestClock's now is refused and never sent

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-07: a failing test for: a reply that fails or is aborted before the vendor's final usage leaves no held reservation and settles no less than the usage the vendor reported

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-08: a failing test for: a Canon request with a session's service token reserves and settles against the mission's budget only, with the session's id and no attempt

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-09: a failing test for: the reaper releases the held reservations of an ended attempt and of an ended onboarding session, and leaves a running attempt's

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B22-10: a failing test for: startModelProxy refuses to start without ANTHROPIC_API_KEY, naming the variable and never a value; startServer starts without it; no log line or row holds the key or a token

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/server/test/metering/**`
- `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b22-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/server.ts`
- `packages/server/src/main.ts`
- `packages/server/src/platform/**`
- `packages/server/src/compute/**`
- `packages/db/src/schema/**`
- `packages/db/drizzle/**`
- `packages/db/test/**`
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
| T-B24 | builds | `packages/server/src/factory/decisions/**`, `packages/server/src/platform/status/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B24 | tests | `packages/server/test/decisions/**`, `packages/server/test/status/**` |
| T-B25 | builds | `packages/server/src/factory/missions/**`, `packages/contract/src/routes/missions.ts`, `packages/contract/src/version.ts`, `packages/contract/package.json`, `docs/generated/openapi.json`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B25 | tests | `packages/server/test/missions/**`, `packages/contract/test/cr-w32.test.ts` |
| T-B26 | builds | `packages/server/src/events/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B26 | tests | `packages/server/test/streams/**` |
| T-B27 | builds | `packages/server/src/platform/jobs/**`, `docs/steps/step-1-done.md` |
| T-B27 | tests | `packages/server/test/jobs-follow-ups/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts`, `packages/server/test/follow-ups/05-close-releases-pools.test.ts`, `packages/server/test/jobs/retries.test.ts`, `packages/server/test/step-1/done-when.test.ts` |

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
git diff --exit-code main -- packages/server/package.json pnpm-lock.yaml
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b22-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B22
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B22: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B22, "The model proxy, the meter of record: the only model key, a reservation before each request, and the $4 attempt cap": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b22-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B22-model-proxy`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b22-test-unit-completion.md`, committed to the branch. Don't push.
