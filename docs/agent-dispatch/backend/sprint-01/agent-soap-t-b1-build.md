---
doc: agent-soap-t-b1-build
ticket: T-B1
lane: backend
sprint: sprint-01
agent: soap
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/B1-server-shell
checkout: branch
after: [agent-rigg-t-b1-test-unit]
depends_on: [T-B0]
report: docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build-completion.md
---


# T-B1 · build · Soap: Server shell with spike 1: health, X-Request-Id, X-Contract-Version, the error body through effectHandler

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-01 · Step 1 |
| Ticket | T-B1 · rigor standard |
| Dispatch | build · Soap (builder) · model sonnet |
| Works on | `t/B1-server-shell` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-01/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 item 1, middleware items 2.1, 2.3 and 2.9, and tests 1 and 3
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: spike 1 (section 6) and its pass and fail rules
7. `docs/design/Build rules.md`: C4 (full-rigor areas), E5 (dependencies), H6 (the lock check)
8. `AGENTS.md`: API rules (the error body, the two headers) and Writing Effect rules 1 to 4 and 8
9. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 2 (what Effect is used for), section 6 spike 1 and its pass and fail rules
10. `packages/contract/src/errors.ts`: errorMap, ErrorBody, REQUEST_ID_HEADER and CONTRACT_VERSION_HEADER: the table the tagged errors map to
11. `packages/contract/src/version.ts`: CONTRACT_VERSION, the X-Contract-Version value
12. `packages/contract/src/routes/health.ts`: route 6, GET /api/health, and HealthDto
13. `packages/contract-mock/src/mock.ts`: how this repo already serves the contract through OpenAPIHandler
14. `docs/design/Port inventory.md`: the clock, ids and logger port 'with changes' as Effect services (CR-30)
15. `docs/design/Step 0 and Step 1 plan.md`: the middleware order in item 2; only 2.1, 2.2, 2.3, 2.7 and 2.9 are in this ticket
16. `packages/server/test/**`: the locked acceptance tests: they define done
17. `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** GET /api/health answers 200, every response carries X-Request-Id and X-Contract-Version, and a tagged Effect failure comes back as the contract's error body with its requestId.

**Refs:**
- Step 0 and Step 1 plan, Step 1 item 1, items 2.1, 2.3 and 2.9, tests 1 and 3
- CR-30, section 6, spike 1 checks 1, 3 and 4
- API routes.md, route 6

**Merged before this starts:** T-B0

**Notes from the lead:**
- Spike 1, folded in (Javaris, Nov 16; recorded in CR-30): checks 1, 3 and 4 here. The completion report gives pass or fail for each of checks 1, 3 and 4, with its evidence, so Javaris can decide on Effect; checks 2 and 5 need the Db service and move to next cycle's Db ticket. If any of 1, 3 or 4 needs a beta package, a fork or a patch, stop with needs-cr: CR-30 says Javaris then decides whether Effect stays inside modules or goes, and the next tickets are re-planned (Build rules, 'The first cycle')
- Only route 6 is implemented. Every other contract route answers through the same error path; no other procedure, no sample route (CR-31)
- Out of scope: the Db service, database errors, idempotency, auth, rate limits
- Request IDs come from an Ids service (UUIDv7) and time from Clock, never crypto.randomUUID() or Date.now() in server code (Writing Effect rule 4). Programs run only in the effectHandler adapter and the dev entry point (rule 2)
- The contract's catalog has no 500 code; CR-38 (proposed) adds one next cycle. Until then a defect's body keeps ErrorBody's shape with oRPC's INTERNAL_SERVER_ERROR as the code, and the test checks the status, shape and requestId, not the code. Don't add a code to the contract

## 4. Tasks

### T-B1-01: make it true: GET /api/health returns 200 with a body that parses as HealthDto

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-02: make it true: every response, success or error, carries X-Contract-Version equal to the contract's CONTRACT_VERSION

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-03: make it true: a valid incoming X-Request-Id is echoed; a missing or malformed one is replaced by a new UUIDv7 from the Ids service

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-04: make it true: an unknown /api route returns 404 with the contract's ErrorBody, whose requestId equals the X-Request-Id header

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-05: make it true: spike 1.1: a procedure served through effectHandler that fails with a tagged error returns that error's contract code and status, as ErrorBody with the requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-06: make it true: spike 1.1: a tagged error with no entry in the error table fails to compile (a type-level test)

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-07: make it true: an unexpected defect returns 500 as ErrorBody with the requestId, never shows the defect's message, and is logged with the requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-08: make it true: spike 1.3: a request aborted mid-program interrupts it and runs its finalizers (a fake reservation from acquireRelease is released)

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B1-09: make it true: spike 1.4: the logger writes one JSON line per log call carrying the request ID, through Effect's logger slot

- **Verify:** its locked test passes: `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/**`
- `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `packages/server/tsconfig.json`
- `packages/server/vitest.config.ts`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `packages/contract/**`
- `packages/db/**`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B0 | builds | `.github/CODEOWNERS`, `.github/workflows/locks.yml`, `tools/repo-checks/src/**`, `tools/repo-checks/package.json`, `tools/repo-checks/tsconfig.json`, `tools/repo-checks/vitest.config.ts`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `packages/server/package.json`, `packages/server/tsconfig.json`, `packages/server/vitest.config.ts`, `apps/web/package.json`, `docs/design/Outside sources and what we took.md` |
| T-B0 | tests | `tools/repo-checks/test/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B1`).
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
pnpm --filter @avel/server typecheck
pnpm --filter @avel/server test
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B1
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B1, "Server shell with spike 1: health, X-Request-Id, X-Contract-Version, the error body through effectHandler": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B1-server-shell`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build-completion.md`, committed to the branch. Don't push.
