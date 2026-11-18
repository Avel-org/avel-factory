---
doc: agent-soap-t-b11-build
ticket: T-B11
lane: backend
sprint: sprint-03
agent: soap
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/B11-auth-mock-minified-router
checkout: branch
after: [agent-rigg-t-b11-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-03/agent-soap-t-b11-build-completion.md
---


# T-B11 · build · Soap: The web's auth mock and a minified router (CR-W30 A and D)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B11 · rigor standard |
| Dispatch | build · Soap (builder) · model sonnet |
| Works on | `t/B11-auth-mock-minified-router` |
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
10. `docs/ui-contracts/login.md`: section 5: what the auth mock serves, word for word (the operator fixture, sign-in, the lockout, get-session's raw shape, sign-out, reset, resetAuth, recorded with the password redacted); section 1: the wire
11. `packages/contract-mock/src/mock.ts`: the mock's fetch, where the three auth endpoints go beside the contract routes
12. `packages/contract-mock/src/world.ts`: the mock's world and now(), for the lockout's 15 minutes
13. `packages/contract-mock/src/fixtures.ts`: where fixtures.operator goes
14. `packages/contract/src/routes/route.ts`: each route's meta: routeNo, write, stepUp, caller; its method and path
15. `packages/contract/src/index.ts`: the package's exports; the minified router is one more
16. `packages/contract-mock/test/auth.test.ts`: the locked acceptance tests: they define done
17. `packages/contract/test/minified-router.test.ts`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b11-build.md`: this document: follow it exactly

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

### T-B11-01: make it true: sign-in with the operator's mock password: 200 with { redirect: false, token, user } and the session cookie as section 5 writes it; a wrong email or password: 401 INVALID_EMAIL_OR_PASSWORD

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm --filter @avel/contract test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B11-02: make it true: the 11th sign-in for one email within 15 minutes of the mock's now() is 429 TOO_MANY_ATTEMPTS with X-Retry-After, even with the right password, until 15 minutes after the 10th failure

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm --filter @avel/contract test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B11-03: make it true: get-session with the cookie gives Better Auth's raw shape with expiresAt 12 hours after sign-in; without it, null; after sign-out, null and the cookie expired

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm --filter @avel/contract test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B11-04: make it true: sign-up and any other /api/auth/* path is 404; reset() keeps sessions and clears failures; resetAuth() drops sessions; recorded() lists auth requests with the password as [redacted]

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm --filter @avel/contract test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B11-05: make it true: the minified router has one entry per route in the contract's router, each with the same method, path, route number, write and stepUp, and none carries a schema; regenerating it from the router gives the committed file

- **Verify:** its locked test passes: `pnpm --filter @avel/contract-mock test`, `pnpm --filter @avel/contract test`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/contract-mock/src/**`
- `packages/contract/src/minified.ts`
- `packages/contract/src/index.ts`
- `packages/contract/scripts/**`
- `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b11-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/contract-mock/test/auth.test.ts`
- `packages/contract/test/minified-router.test.ts`

**Never change, whatever the task says:**
- `packages/contract/src/routes/**`
- `packages/contract/src/dto/**`
- `packages/contract/src/errors.ts`
- `packages/contract/src/version.ts`
- `packages/contract/package.json`
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
| T-B10 | builds | `packages/server/src/platform/step-up/**`, `packages/server/src/platform/cli/**`, `packages/server/src/audit/**`, `packages/server/src/platform/router.ts`, `packages/server/src/main.ts` |
| T-B10 | tests | `packages/server/test/cli-login/**` |
| T-B8 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/rate-limit.ts` |
| T-B8 | tests | `packages/server/test/platform-hardening/**` |
| T-B9 | builds | `packages/server/src/platform/auth/**`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/effect-handler.ts`, `packages/server/src/seed.ts`, `packages/server/package.json`, `pnpm-lock.yaml` |
| T-B9 | tests | `packages/server/test/auth/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B11`).
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
pnpm --filter @avel/contract-mock test
pnpm --filter @avel/contract test
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b11-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B11
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B11, "The web's auth mock and a minified router (CR-W30 A and D)": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b11-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B11-auth-mock-minified-router`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b11-build-completion.md`, committed to the branch. Don't push.
