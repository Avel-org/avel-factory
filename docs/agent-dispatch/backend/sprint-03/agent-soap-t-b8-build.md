---
doc: agent-soap-t-b8-build
ticket: T-B8
lane: backend
sprint: sprint-03
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B8-platform-hardening
checkout: branch
after: [agent-rigg-t-b8-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-03/agent-soap-t-b8-build-completion.md
---


# T-B8 · build · Soap: Platform hardening and the middleware services: safe defect logs, pool timeouts, an idempotency store and rate limits

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B8 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B8-platform-hardening` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-03/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 2 (middleware order), 4 (idempotency), 5 (Better Auth), 6 (step-up), 7 (CLI login), 8 (activity log); the rate limits; tests 2, 4, 5, 7, 8, 9, 13
6. `docs/design/CR-31 Step 1 without the sample route and approval page.md`: how tests 2, 4 and 5 are proved on the CLI login routes
7. `docs/design/Backend modules and build plan.md`: section 8: auth decisions, the order inside Step 1, Breach's attacks; module table: platform owns Better Auth's tables, cli_sessions, step_up_grants, idempotency_keys; audit owns activity_log
8. `docs/design/API routes.md`: routes 1 to 5 and the rules on every write
9. `docs/design/Build rules.md`: C4 (full rigor), E5 (dependencies), E6 (no secrets), E10 (real Postgres), E12 (table owners), E13 (four tests per route), F2, H6
10. `packages/server/src/platform/db/db.ts`: T-B4's Db service: the pool, withTransaction's acquireRelease (pool.connect can't be interrupted), the defect mapping
11. `packages/server/src/platform/effect-handler.ts`: line 76 logs Cause.pretty for a defect; read only
12. `packages/server/src/platform/logger.ts`: the JSON logger that writes the cause; read only
13. `packages/server/src/platform/db/errors.ts`: the FK split reads Postgres's English message (t-b3-rigg-02); read only
14. `packages/db/src/schema/platform.ts`: idempotency_keys: (principal, key), route, body_sha256, status in_progress or completed, http_status, response, expires_at
15. `packages/contract/src/errors.ts`: IDEMPOTENCY_KEY_REUSED, IDEMPOTENCY_IN_PROGRESS, TOKEN_REPLAYED, TOO_MANY_REQUESTS
16. `docs/design/DATABASE.md`: idempotency_keys and its purge (after expires_at); a response carrying a secret or token is never stored
17. `packages/server/test/platform-hardening/**`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b8-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A database outage or a bad query can't hang a request, crash the server or put a query's values in the log, and the idempotency store and rate limiter the next routes need exist.

**Refs:**
- Axis's T-B4 second review: P2s (a) Drizzle params in the defect log, (d) pool timeouts ((e), the pool's error handler, is fixed in T-B4 a3 after t-b4-rigg-01)
- t-b4-rigg-05 (P2): a checked-out client's error still crashes the process
- t-b3-rigg-02 (lc_messages) and t-b3-rigg-03 (body.message)
- Step 0 and Step 1 plan, Step 1 items 2.4 and 4, and the rate limits section
- AGENTS.md, Writing Effect rules 4, 5 and 6

**Notes from the lead:**
- Defect log, fixed at the source in db.ts: no DrizzleQueryError leaves the Db service. An unmapped one is re-raised as a defect carrying only the pg error's code and message (or the query text without params), so effectHandler's log of the cause never holds a bound value. effect-handler.ts and logger.ts don't change
- Pool: connect timeout and statement timeout come from Config (DATABASE_CONNECT_TIMEOUT_MS, DATABASE_STATEMENT_TIMEOUT_MS) with defaults of 5 s and 30 s. A connect that times out reaches the caller as a defect (500), not a hang, and the request's interruption still ends it. (The pool's error listener for idle clients is already in from T-B4.) A client checked out inside withTransaction has no pool listener (pg-pool removes it while the client is out, t-b4-rigg-05), so withTransaction puts its own error listener on that client for as long as it holds it: a backend that dies mid-transaction ends the program as a defect, the client is destroyed rather than returned, and the process stays up
- lc_messages: the Db layer checks `show lc_messages` once when it's built and fails to build (a defect at boot) unless it is C, POSIX or starts with en, because the FK split reads English text
- Idempotency store (Step 1 item 4) as an Effect service over idempotency_keys, through Db, with time from Clock. begin(principal, key, route, bodySha256) gives one of: new (row inserted in_progress, expires in 24 hours), replay (completed with the same route and body: the stored status and response), reused (another body or route: IdempotencyKeyReused, 409), in progress (IdempotencyInProgress, 409). complete(principal, key, status, response, { sensitive }) stores the response, or for a sensitive response stores no response and marks it so a replay fails with TokenReplayed (409). An expired row counts as absent. It is wired into routes in T-B10 and T-B11, not here
- Rate limiter (item 2.4): an in-memory Effect service, a fixed window per (name, key), limits from Config with the plan's defaults (sign-in 5 a minute per email and per IP; device-login starts 5 a minute; webhook 60 a minute), time from Clock. Over the limit is TooManyRequests (429). It is applied in T-B9 and T-B10, not here
- New tagged errors get their rows in platform/errors.ts: IdempotencyKeyReused, IdempotencyInProgress, TokenReplayed, TooManyRequests
- No new dependency. No route changes, no app.ts change

## 4. Tasks

### T-B8-01: make it true: a defect thrown by a Drizzle query is logged with the request ID and the pg error's code, and the log line contains no bound value ('params:' and the inserted value are absent); the response is a 500 whose body has the contract's message (body.message equals errorMap's text) and no database text

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B8-02: make it true: with Postgres unreachable (a closed port), withTransaction fails as a defect within the configured connect timeout instead of hanging, and the request's interruption ends it

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B8-03: make it true: a statement longer than the configured statement timeout ends as a defect, and the pool client is released

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B8-04: make it true: a backend terminated (pg_terminate_backend) between two statements inside withTransaction ends the program as a defect, the process stays up, and the next withTransaction commits (t-b4-rigg-05)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B8-05: make it true: building the Db layer against a server whose lc_messages isn't English fails with a message naming lc_messages (set it per database for the test)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B8-06: make it true: idempotency: a first begin is new; after complete, the same key, route and body replays the stored status and response; another body is 409 IDEMPOTENCY_KEY_REUSED; a second begin before complete is 409 IDEMPOTENCY_IN_PROGRESS; one principal's key never answers another's

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B8-07: make it true: idempotency: a sensitive response is never stored (the row has no response) and its replay is 409 TOKEN_REPLAYED; a key older than 24 hours (TestClock) is treated as new

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B8-08: make it true: rate limit: the 6th call in a minute for one key is 429 TOO_MANY_REQUESTS; another key isn't affected; after the window (TestClock) it passes again

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/db/db.ts`
- `packages/server/src/platform/errors.ts`
- `packages/server/src/platform/idempotency.ts`
- `packages/server/src/platform/rate-limit.ts`
- `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b8-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/platform-hardening/**`

**Never change, whatever the task says:**
- `packages/server/src/platform/db/errors.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/logger.ts`
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
| T-B10 | builds | `packages/server/src/platform/step-up/**`, `packages/server/src/platform/cli/**`, `packages/server/src/audit/**`, `packages/server/src/platform/router.ts`, `packages/server/src/main.ts` |
| T-B10 | tests | `packages/server/test/cli-login/**` |
| T-B11 | builds | `packages/contract-mock/src/**`, `packages/contract/src/minified.ts`, `packages/contract/src/index.ts`, `packages/contract/scripts/**`, `packages/contract/package.json` |
| T-B11 | tests | `packages/contract-mock/test/auth.test.ts`, `packages/contract/test/minified-router.test.ts` |
| T-B9 | builds | `packages/server/src/platform/auth/**`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/effect-handler.ts`, `packages/server/src/seed.ts`, `packages/server/package.json`, `pnpm-lock.yaml` |
| T-B9 | tests | `packages/server/test/auth/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B8`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b8-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B8
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B8, "Platform hardening and the middleware services: safe defect logs, pool timeouts, an idempotency store and rate limits": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b8-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B8-platform-hardening`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b8-build-completion.md`, committed to the branch. Don't push.
