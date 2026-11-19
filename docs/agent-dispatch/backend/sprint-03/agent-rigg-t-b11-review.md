---
doc: agent-rigg-t-b11-review
ticket: T-B11
lane: backend
sprint: sprint-03
agent: rigg
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/B11-auth-mock-minified-router
checkout: detached
after: [agent-soap-t-b11-build]
depends_on: []
report: docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-review-completion.md
---


# T-B11 · review · Rigg: The web's auth mock and a minified router (CR-W30 A and D)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B11 · rigor standard |
| Dispatch | review · Rigg (checker) · model sonnet |
| Works on | a detached checkout of `t/B11-auth-mock-minified-router`'s head |
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
17. `packages/contract-mock/test/auth.test.ts`: the locked acceptance tests: they define done
18. `packages/contract/test/minified-router.test.ts`: the locked acceptance tests: they define done
19. `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b11-build-completion.md`: the builder's completion report
20. `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-review.md`: this document: follow it exactly

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

### T-B11-01: check: sign-in with the operator's mock password: 200 with { redirect: false, token, user } and the session cookie as section 5 writes it; a wrong email or password: 401 INVALID_EMAIL_OR_PASSWORD

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B11-02: check: the 11th sign-in for one email within 15 minutes of the mock's now() is 429 TOO_MANY_ATTEMPTS with X-Retry-After, even with the right password, until 15 minutes after the 10th failure

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B11-03: check: get-session with the cookie gives Better Auth's raw shape with expiresAt 12 hours after sign-in; without it, null; after sign-out, null and the cookie expired

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B11-04: check: sign-up and any other /api/auth/* path is 404; reset() keeps sessions and clears failures; resetAuth() drops sessions; recorded() lists auth requests with the password as [redacted]

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B11-05: check: the minified router has one entry per route in the contract's router, each with the same method, path, route number, write and stepUp, and none carries a schema; regenerating it from the router gives the committed file

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B11-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-review-completion.md`
- `docs/agent-dispatch/backend/sprint-03/findings/t-b11-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `packages/contract-mock/src/**`
- `packages/contract/src/minified.ts`
- `packages/contract/src/index.ts`
- `packages/contract/scripts/**`
- `packages/contract/package.json`

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
pnpm --filter @avel/contract-mock test
pnpm --filter @avel/contract test
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B11
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B11, "The web's auth mock and a minified router (CR-W30 A and D)": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-rigg-t-b11-review-completion.md`, left uncommitted. Don't push.
