---
doc: agent-rigg-t-b1-test-unit
ticket: T-B1
lane: backend
sprint: sprint-01
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/B1-server-shell
checkout: branch
after: []
depends_on: [T-B0]
report: docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b1-test-unit-completion.md
---


# T-B1 · tests · Rigg: Server shell with spike 1: health, X-Request-Id, X-Contract-Version, the error body through effectHandler

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-01 · Step 1 |
| Ticket | T-B1 · rigor standard |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B1-server-shell` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
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
16. `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b1-test-unit.md`: this document: follow it exactly

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

### T-B1-01: a failing test for: GET /api/health returns 200 with a body that parses as HealthDto

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-02: a failing test for: every response, success or error, carries X-Contract-Version equal to the contract's CONTRACT_VERSION

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-03: a failing test for: a valid incoming X-Request-Id is echoed; a missing or malformed one is replaced by a new UUIDv7 from the Ids service

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-04: a failing test for: an unknown /api route returns 404 with the contract's ErrorBody, whose requestId equals the X-Request-Id header

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-05: a failing test for: spike 1.1: a procedure served through effectHandler that fails with a tagged error returns that error's contract code and status, as ErrorBody with the requestId

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-06: a failing test for: spike 1.1: a tagged error with no entry in the error table fails to compile (a type-level test)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-07: a failing test for: an unexpected defect returns 500 as ErrorBody with the requestId, never shows the defect's message, and is logged with the requestId

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-08: a failing test for: spike 1.3: a request aborted mid-program interrupts it and runs its finalizers (a fake reservation from acquireRelease is released)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B1-09: a failing test for: spike 1.4: the logger writes one JSON line per log call carrying the request ID, through Effect's logger slot

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/server/test/**`
- `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b1-test-unit-completion.md` (your report)

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
pnpm --filter @avel/server typecheck
pnpm --filter @avel/server test
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b1-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B1
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B1: <test paths> @ <your last commit>`

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B1, "Server shell with spike 1: health, X-Request-Id, X-Contract-Version, the error body through effectHandler": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b1-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B1-server-shell`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b1-test-unit-completion.md`, committed to the branch. Don't push.
