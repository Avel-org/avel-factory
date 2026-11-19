---
doc: agent-rigg-t-b9-test-unit
ticket: T-B9
lane: backend
sprint: sprint-03
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: full
model: sonnet
branch: t/B9-sign-in
checkout: branch
after: []
depends_on: [T-B8]
report: docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-test-unit-completion.md
---


# T-B9 · tests · Rigg: Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B9 · rigor full |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B9-sign-in` |
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
7. `docs/design/CR-43 Step 1 without the CLI.md`: accepted Nov 18: step-up moves to Step 4 and CLI login to Step 5; test 5 is sign-in's limit
8. `docs/design/Backend modules and build plan.md`: section 8: auth decisions, the order inside Step 1, Breach's attacks; module table: platform owns Better Auth's tables, cli_sessions, step_up_grants, idempotency_keys; audit owns activity_log
9. `docs/design/API routes.md`: routes 1 to 5 and the rules on every write
10. `docs/design/Build rules.md`: C4 (full rigor), E5 (dependencies), E6 (no secrets), E10 (real Postgres), E12 (table owners), E13 (four tests per route), F2, H6
11. `docs/design/Backend modules and build plan.md`: section 8: one operator, password sign-in and step-up, passkeys later, the password never in the repo; Breach's attacks
12. `packages/db/src/schema`: users and the auth_* tables Better Auth uses through the Drizzle adapter (the names need a mapping: Step 1 plan, risks)
13. `packages/server/src/platform/rate-limit.ts`: T-B8's limiter: sign-in is 5 a minute per email and per IP
14. `docs/ui-contracts/login.md`: section 1: the wire the web reads (sign-in, get-session, sign-out; INVALID_EMAIL_OR_PASSWORD; 429 with X-Retry-After for lockout and rate limit). The real server answers it the same way the mock does
15. `packages/server/src/platform/app.ts`: where /api/auth/* mounts, outside the contract, in the middleware order
16. `packages/server/src/platform/effect-handler.ts`: where the caller joins the request's services
17. `docs/design/DATABASE.md`: users, auth_sessions, auth_accounts, auth_verifications; clients.kind and the one internal client (CR-13)
18. `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** The operator signs in with email and password; sign-up is off, a second user can't be made, brute force locks out, and every procedure knows who is calling.

**Refs:**
- Step 0 and Step 1 plan, Step 1 item 5 and test 7; the rate limits section (sign-in)
- Backend modules and build plan, section 8 (auth decisions, Breach's attacks)
- Build rules E5 (better-auth, approved in this plan) and E6

**Merged before this starts:** T-B8

**Notes from the lead:**
- New dependency, approved in this plan (E5): better-auth, MIT. Pin an exact version at least two weeks old, and report its version and installed size. The lockfile changes only in this ticket
- Email and password only. Sign-up is off. No GitHub sign-in, no passkeys (their table stays unused). Better Auth's tables are the schema's users and auth_* through the Drizzle adapter's name mapping; no schema change. If the schema can't hold what Better Auth needs, stop with needs-cr
- Lockout: 10 failed sign-ins in 15 minutes locks the account for 15 minutes. Sign-in is also rate-limited at 5 a minute per email and per IP through T-B8's limiter
- The seed (packages/server/src/seed.ts, run by hand on the host) creates the operator from AVEL_OPERATOR_EMAIL and AVEL_OPERATOR_PASSWORD and AVEL's internal client (CR-13), and is safe to run twice. The password is never in the repo; tests make a throwaway one. List the two variable names in the build report; Axis adds them to .env.example
- The caller: a Caller service (the operator's user id and the session) resolved from the web session cookie, provided to every procedure through the request scope. No session means no Caller; routes that need one arrive in T-B14 (the clients routes, sprint-04)
- The request scope also carries the client IP (for the sign-in limit) and the request's Idempotency-Key header, as services a procedure can read, so T-B14 needs no change to app.ts or effect-handler.ts
- Cookies: httpOnly, Secure outside tests, SameSite=Lax; the session id rotates at sign-in (session fixation, Breach)
- A defect's 500 carries the contract's message: effect-handler.ts throws INTERNAL_SERVER_ERROR with errorMap's text ("Something went wrong"), not its own "Internal server error" (t-b3-rigg-03; moved here from T-B8 by Axis, Nov 18, because this ticket owns effect-handler.ts)
- The client IP for the sign-in-ip limit is the socket's peer address, or the first trusted proxy's when one is configured, never a raw X-Forwarded-For a client can set (T-B8 G7 P2)
- Review (Build rules G5, Javaris Nov 18): one review, no round 2. Only a P0 or P1 sends the PR back, and the checker then confirms only those fixes. Every P2 goes to a later ticket or the backlog, named in the PR text

## 4. Tasks

### T-B9-01: a failing test for: the seeded operator signs in with the right password and gets a session cookie; a wrong password is refused with no session

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B9-02: a failing test for: sign-up is refused, and no route or a second seed run creates a second user (users count stays 1)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B9-03: a failing test for: the 11th failed sign-in within 15 minutes is locked out even with the right password, and it unlocks after 15 minutes

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B9-04: a failing test for: the 6th sign-in attempt in a minute for one email is 429, and so is the 6th from one IP

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B9-05: a failing test for: a procedure run with the session cookie sees Caller with the operator's user id; without it there is no Caller; a procedure can read the request's Idempotency-Key header and client IP

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B9-06: a failing test for: the session id after sign-in differs from any session id the client presented before it (no fixation)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B9-07: a failing test for: the seed is idempotent: run twice, one operator and one internal client

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B9-08: a failing test for: a defect in a procedure answers 500 whose body.message equals errorMap.INTERNAL_SERVER_ERROR.message and whose requestId is the request's

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/server/test/auth/**`
- `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/idempotency.ts`
- `packages/server/src/platform/rate-limit.ts`
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
| T-B11 | builds | `packages/contract-mock/src/**`, `packages/contract/src/minified.ts`, `packages/contract/src/index.ts`, `packages/contract/scripts/**`, `packages/contract/package.json` |
| T-B11 | tests | `packages/contract-mock/test/auth.test.ts`, `packages/contract/test/minified-router.test.ts` |
| T-B8 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/rate-limit.ts` |
| T-B8 | tests | `packages/server/test/platform-hardening/**` |

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

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B9
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B9: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B9, "Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B9-sign-in`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-test-unit-completion.md`, committed to the branch. Don't push.
