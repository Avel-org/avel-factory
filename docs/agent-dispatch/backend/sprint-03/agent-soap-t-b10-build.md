---
doc: agent-soap-t-b10-build
ticket: T-B10
lane: backend
sprint: sprint-03
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B10-step-up-cli-login
checkout: branch
after: [agent-rigg-t-b10-test-unit]
depends_on: [T-B9]
report: docs/agent-dispatch/backend/sprint-03/agent-soap-t-b10-build-completion.md
---


# T-B10 · build · Soap: Step-up grants and CLI login: start a device login, approve it with step-up, poll for the session (routes 1 to 3)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-B10 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B10-step-up-cli-login` |
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
10. `packages/contract/src/routes/auth.ts`: routes 1 to 3, their inputs, outputs and the stepUp meta
11. `docs/design/API routes.md`: routes 1 to 3; route 3 is never replayable and never returns the token twice
12. `packages/db/src/schema`: step_up_grants, device_logins, cli_sessions (token stored as a hash), activity_log
13. `packages/server/src/platform/idempotency.ts`: T-B8's store: every write takes an Idempotency-Key; route 3's response is sensitive
14. `packages/server/src/platform/rate-limit.ts`: T-B8's limiter: 5 device-login starts a minute (the name device-login); read only
15. `packages/server/src/platform/auth`: T-B9's Caller and the password check step-up repeats
16. `packages/server/test/cli-login/**`: the locked acceptance tests: they define done
17. `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b10-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The CLI logs in with a device code the operator approves in the web app with their password again, and gets its session exactly once.

**Refs:**
- Step 0 and Step 1 plan, Step 1 items 6 and 7, tests 5, 8 and 9; the rate limits section (CLI login)
- API routes.md, routes 1 to 3 and the rules on every write
- CR-31 (test 5 on route 1)

**Merged before this starts:** T-B9

**Notes from the lead:**
- Step-up (item 6): the operator's password again, for one action on one target, bound to the session; single-use, 5 minutes (Clock), consumed in one atomic update. Only credential actions ask; in this step that's route 2. How the web obtains a grant and how route 2 presents it: follow the contract's stepUp meta and API routes.md; if they don't say, stop with needs-cr
- Route 1 (start): makes a device code and a short user code, rate-limited at 5 a minute (429). Route 2 (approve): needs the Caller and a valid step-up grant for this user code. Route 3 (poll): returns the session token once after approval, stores only its hash, polling faster than every 5 seconds is 429
- The 5-second poll interval isn't T-B8's per-minute limiter: route 3 enforces it in platform/cli/** per device code, from the Clock (the last poll's time, in memory), and answers 429 TOO_MANY_REQUESTS with retryAfterMs. rate-limit.ts doesn't change (t-b8-rigg-03, Axis's ruling Nov 18)
- Idempotency on every write through T-B8's store. Routes 1 and 3 have no session yet: their principal is the device login's id (Javaris, Nov 17: approved). Route 3's response carries a token, so it's never stored and a replay is 409 TOKEN_REPLAYED
- Activity log (item 8, audit module): every write in this ticket leaves exactly one activity_log row (who, what, target), in the same transaction as the change
- DTOs through one mapper per object; outputs are validated against the contract (AGENTS.md API rules)
- Routing: platform/router.ts composes the health router and routes 1 to 3; main.ts passes it to createApp. app.ts doesn't change
- E13: each route gets its happy path with the DTO checked, the error body with requestId, and the idempotent replay

## 4. Tasks

### T-B10-01: make it true: route 1: a start returns a device code and user code matching the DTO; the 6th start in a minute is 429 with the error body and requestId (Step 1 test 5)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B10-02: make it true: step-up: a wrong password gets no grant; a grant works once; reused, used for another action or another target, from another session, or after 5 minutes (TestClock) it is 403 STEP_UP_REQUIRED (Step 1 test 8)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B10-03: make it true: route 2: approval without a grant is 403 STEP_UP_REQUIRED; with one it approves the device login; two concurrent approvals of one user code approve once

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B10-04: make it true: route 3: before approval it says pending; after approval it returns the session token once, and cli_sessions stores only its hash; a replayed poll is 409 TOKEN_REPLAYED and never returns the token; polling faster than every 5 seconds is 429 (Step 1 test 9)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B10-05: make it true: routes 1 to 3: a replay with the same key and body returns the first response (except route 3), a different body is 409 IDEMPOTENCY_KEY_REUSED

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B10-06: make it true: each write leaves exactly one activity_log row naming the action and target, and a failed write leaves none (Step 1 test 13)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/step-up/**`
- `packages/server/src/platform/cli/**`
- `packages/server/src/audit/**`
- `packages/server/src/platform/router.ts`
- `packages/server/src/main.ts`
- `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b10-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/cli-login/**`

**Never change, whatever the task says:**
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/idempotency.ts`
- `packages/server/src/platform/rate-limit.ts`
- `packages/server/src/platform/auth/**`
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
| T-B11 | builds | `packages/contract-mock/src/**`, `packages/contract/src/minified.ts`, `packages/contract/src/index.ts`, `packages/contract/scripts/**`, `packages/contract/package.json` |
| T-B11 | tests | `packages/contract-mock/test/auth.test.ts`, `packages/contract/test/minified-router.test.ts` |
| T-B8 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/rate-limit.ts` |
| T-B8 | tests | `packages/server/test/platform-hardening/**` |
| T-B9 | builds | `packages/server/src/platform/auth/**`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/effect-handler.ts`, `packages/server/src/seed.ts`, `packages/server/package.json`, `pnpm-lock.yaml` |
| T-B9 | tests | `packages/server/test/auth/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B10`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b10-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B10
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B10, "Step-up grants and CLI login: start a device login, approve it with step-up, poll for the session (routes 1 to 3)": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b10-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B10-step-up-cli-login`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-03/agent-soap-t-b10-build-completion.md`, committed to the branch. Don't push.
