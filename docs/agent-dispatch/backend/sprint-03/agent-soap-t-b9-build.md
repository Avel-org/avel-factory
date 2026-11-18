---
doc: agent-soap-t-b9-build
ticket: T-B9
lane: backend
sprint: sprint-03
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B9-sign-in
checkout: branch
after: [agent-rigg-t-b9-test-unit]
depends_on: [T-B8]
report: docs/agent-dispatch/backend/sprint-03/agent-soap-t-b9-build-completion.md
---


# T-B9 · build · Soap: Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B9 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B9-sign-in` |
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
10. `docs/design/Backend modules and build plan.md`: section 8: one operator, password sign-in and step-up, passkeys later, the password never in the repo; Breach's attacks
11. `packages/db/src/schema`: users and the auth_* tables Better Auth uses through the Drizzle adapter (the names need a mapping: Step 1 plan, risks)
12. `packages/server/src/platform/rate-limit.ts`: T-B8's limiter: sign-in is 5 a minute per email and per IP
13. `docs/ui-contracts/login.md`: section 1: the wire the web reads (sign-in, get-session, sign-out; INVALID_EMAIL_OR_PASSWORD; 429 with X-Retry-After for lockout and rate limit). The real server answers it the same way the mock does
14. `packages/server/src/platform/app.ts`: where /api/auth/* mounts, outside the contract, in the middleware order
15. `packages/server/src/platform/effect-handler.ts`: where the caller joins the request's services
16. `docs/design/DATABASE.md`: users, auth_sessions, auth_accounts, auth_verifications; clients.kind and the one internal client (CR-13)
17. `packages/server/test/auth/**`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b9-build.md`: this document: follow it exactly

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
- The caller: a Caller service (the operator's user id and the session) resolved from the web session cookie, provided to every procedure through the request scope. No session means no Caller; routes that need one arrive in T-B10
- The request scope also carries the client IP (for the sign-in limit) and the request's Idempotency-Key header, as services a procedure can read, so T-B10 needs no change to app.ts or effect-handler.ts
- Cookies: httpOnly, Secure outside tests, SameSite=Lax; the session id rotates at sign-in (session fixation, Breach)
- A defect's 500 carries the contract's message: effect-handler.ts throws INTERNAL_SERVER_ERROR with errorMap's text ("Something went wrong"), not its own "Internal server error" (t-b3-rigg-03; moved here from T-B8 by Axis, Nov 18, because this ticket owns effect-handler.ts)

## 4. Tasks

### T-B9-01: make it true: the seeded operator signs in with the right password and gets a session cookie; a wrong password is refused with no session

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B9-02: make it true: sign-up is refused, and no route or a second seed run creates a second user (users count stays 1)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B9-03: make it true: the 11th failed sign-in within 15 minutes is locked out even with the right password, and it unlocks after 15 minutes

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B9-04: make it true: the 6th sign-in attempt in a minute for one email is 429, and so is the 6th from one IP

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B9-05: make it true: a procedure run with the session cookie sees Caller with the operator's user id; without it there is no Caller; a procedure can read the request's Idempotency-Key header and client IP

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B9-06: make it true: the session id after sign-in differs from any session id the client presented before it (no fixation)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B9-07: make it true: the seed is idempotent: run twice, one operator and one internal client

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B9-08: make it true: a defect in a procedure answers 500 whose body.message equals errorMap.INTERNAL_SERVER_ERROR.message and whose requestId is the request's

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/auth/**`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/seed.ts`
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b9-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/auth/**`

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
| T-B10 | builds | `packages/server/src/platform/step-up/**`, `packages/server/src/platform/cli/**`, `packages/server/src/audit/**`, `packages/server/src/platform/router.ts`, `packages/server/src/main.ts` |
| T-B10 | tests | `packages/server/test/cli-login/**` |
| T-B11 | builds | `packages/contract-mock/src/**`, `packages/contract/src/minified.ts`, `packages/contract/src/index.ts`, `packages/contract/scripts/**` |
| T-B11 | tests | `packages/contract-mock/test/auth.test.ts`, `packages/contract/test/minified-router.test.ts` |
| T-B8 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/rate-limit.ts` |
| T-B8 | tests | `packages/server/test/platform-hardening/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B9`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b9-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B9
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B9, "Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b9-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B9-sign-in`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b9-build-completion.md`, committed to the branch. Don't push.
