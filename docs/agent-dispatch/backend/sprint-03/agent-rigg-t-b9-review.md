---
doc: agent-rigg-t-b9-review
ticket: T-B9
lane: backend
sprint: sprint-03
agent: rigg
seat: checker
kind: review
role: review
rigor: full
model: opus
branch: t/B9-sign-in
checkout: detached
after: [agent-soap-t-b9-build]
depends_on: [T-B8]
report: docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-review-completion.md
---


# T-B9 · review · Rigg: Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B9 · rigor full |
| Dispatch | review · Rigg (checker) · model opus |
| Works on | a detached checkout of `t/B9-sign-in`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
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
18. `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b9-build-completion.md`: the builder's completion report
19. `docs/review/security-checklist.md`: full rigor: work through it item by item
20. `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-review.md`: this document: follow it exactly

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

### T-B9-01: check: the seeded operator signs in with the right password and gets a session cookie; a wrong password is refused with no session

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-02: check: sign-up is refused, and no route or a second seed run creates a second user (users count stays 1)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-03: check: the 11th failed sign-in within 15 minutes is locked out even with the right password, and it unlocks after 15 minutes

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-04: check: the 6th sign-in attempt in a minute for one email is 429, and so is the 6th from one IP

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-05: check: a procedure run with the session cookie sees Caller with the operator's user id; without it there is no Caller; a procedure can read the request's Idempotency-Key header and client IP

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-06: check: the session id after sign-in differs from any session id the client presented before it (no fixation)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-07: check: the seed is idempotent: run twice, one operator and one internal client

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-08: check: a defect in a procedure answers 500 whose body.message equals errorMap.INTERNAL_SERVER_ERROR.message and whose requestId is the request's

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B9-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).
- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-review-completion.md`
- `docs/agent-dispatch/backend/sprint-03/findings/t-b9-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `packages/server/src/platform/auth/**`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/seed.ts`
- `packages/server/package.json`
- `pnpm-lock.yaml`

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

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B9
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B9, "Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b9-review-completion.md`, left uncommitted. Don't push.
