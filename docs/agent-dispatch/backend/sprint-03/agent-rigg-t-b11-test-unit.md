---
doc: agent-rigg-t-b11-test-unit
ticket: T-B11
lane: backend
sprint: sprint-03
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/B11-auth-mock-minified-router
checkout: branch
after: []
depends_on: []
report: docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-test-unit-completion.md
---


# T-B11 · tests · Rigg: The web's auth mock and a minified router (CR-W30 A and D)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B11 · rigor standard |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B11-auth-mock-minified-router` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-03/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 2 (middleware order), 4 (idempotency), 5 (Better Auth), 6 (step-up), 7 (CLI login), 8 (activity log); the rate limits; tests 2, 4, 5, 7, 8, 9, 13
6. `docs/design/CR-31 Step 1 without the sample route and approval page.md`: no sample route and no approval page in Step 1
7. `docs/design/CR-43 Step 1 without the CLI.md`: proposed: step-up moves to Step 4 and CLI login to Step 5; test 5 is sign-in's limit
8. `docs/design/Backend modules and build plan.md`: section 8: auth decisions, the order inside Step 1, Breach's attacks; module table: platform owns Better Auth's tables, cli_sessions, step_up_grants, idempotency_keys; audit owns activity_log
9. `docs/design/API routes.md`: routes 1 to 5 and the rules on every write
10. `docs/design/Build rules.md`: C4 (full rigor), E5 (dependencies), E6 (no secrets), E10 (real Postgres), E12 (table owners), E13 (four tests per route), F2, H6
11. `docs/ui-contracts/login.md`: section 5: what the auth mock serves, word for word (the operator fixture, sign-in, the lockout, get-session's raw shape, sign-out, reset, resetAuth, recorded with the password redacted); section 1: the wire
12. `packages/contract-mock/src/mock.ts`: the mock's fetch, where the three auth endpoints go beside the contract routes
13. `packages/contract-mock/src/world.ts`: the mock's world and now(), for the lockout's 15 minutes
14. `packages/contract-mock/src/fixtures.ts`: where fixtures.operator goes
15. `packages/contract/src/routes/route.ts`: each route's meta: routeNo, write, stepUp, caller; its method and path
16. `packages/contract/src/index.ts`: the package's exports; the minified router is one more
17. `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** The web can sign in, read its session and sign out against contract-mock, and its API client imports a router with no schemas, about a third of today's size.

**Refs:**
- CR-W30 (accepted Nov 17 by Javaris), items A and D; B and C follow T-B10's step-up
- docs/ui-contracts/login.md, sections 1 and 5
- Build rules I3 (contract changes: Zero signs off), E16 (the data layer from the minified contract)

**Labels:** contract · implements CR-W30

**Notes from the lead:**
- A (the auth mock): build login.md section 5 as written. The operator's password there is a mock-only test value, never a real one. The 5-a-minute rate limit isn't simulated. Contract routes don't check the session
- D (the minified router): packages/contract/src/minified.ts exports, for every route in the router, its key path, method, path, route number, write and stepUp, and no schema. A script in packages/contract/scripts writes it from the router; the file is committed. It's exported from the package's index. This changes no route and no wire, so CONTRACT_VERSION stays 1.0.1 and docs/generated doesn't change
- If the minified router needs a package.json export of its own, or apps/web can't import it from the index without pulling the schemas in, stop with out-of-scope and say why
- Zero signs off on the PR (I3, CR-W30)
- Standard rigor, not C4: this is the mock's auth, with a mock-only password and no real credential, session or token. The real sign-in is T-B9 (full)

## 4. Tasks

### T-B11-01: a failing test for: sign-in with the operator's mock password: 200 with { redirect: false, token, user } and the session cookie as section 5 writes it; a wrong email or password: 401 INVALID_EMAIL_OR_PASSWORD

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B11-02: a failing test for: the 11th sign-in for one email within 15 minutes of the mock's now() is 429 TOO_MANY_ATTEMPTS with X-Retry-After, even with the right password, until 15 minutes after the 10th failure

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B11-03: a failing test for: get-session with the cookie gives Better Auth's raw shape with expiresAt 12 hours after sign-in; without it, null; after sign-out, null and the cookie expired

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B11-04: a failing test for: sign-up and any other /api/auth/* path is 404; reset() keeps sessions and clears failures; resetAuth() drops sessions; recorded() lists auth requests with the password as [redacted]

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B11-05: a failing test for: the minified router has one entry per route in the contract's router, each with the same method, path, route number, write and stepUp, and none carries a schema; regenerating it from the router gives the committed file

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/contract-mock/test/auth.test.ts`
- `packages/contract/test/minified-router.test.ts`
- `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/contract/src/routes/**`
- `packages/contract/src/dto/**`
- `packages/contract/src/errors.ts`
- `packages/contract/src/version.ts`
- `packages/contract-mock/package.json`
- `packages/server/**`
- `apps/web/**`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B8 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/rate-limit.ts` |
| T-B8 | tests | `packages/server/test/platform-hardening/**` |
| T-B9 | builds | `packages/server/src/platform/auth/**`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/effect-handler.ts`, `packages/server/src/seed.ts`, `packages/server/package.json`, `pnpm-lock.yaml` |
| T-B9 | tests | `packages/server/test/auth/**` |

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
pnpm --filter @avel/contract-mock test
pnpm --filter @avel/contract test
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B11
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B11: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B11, "The web's auth mock and a minified router (CR-W30 A and D)": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B11-auth-mock-minified-router`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-test-unit-completion.md`, committed to the branch. Don't push.
