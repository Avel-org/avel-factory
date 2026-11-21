---
doc: agent-rigg-t-b21-test-unit
ticket: T-B21
lane: backend
sprint: sprint-06
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: full
model: sonnet
branch: t/B21-attempt-credentials
checkout: branch
after: []
depends_on: [T-B27]
report: docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b21-test-unit-completion.md
---


# T-B21 · tests · Rigg: Per-attempt credentials: minted hashed, checked on every use, revoked when the attempt ends and by the reaper after a restart

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B21 · rigor full |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B21-attempt-credentials` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done. Guard tests are the exception (CR-42): accessibility, budget, standing-rule and regression checks may already pass on `main`, and your report lists them as passing.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-06/codebase-analysis.md`: the codebase in short
5. `docs/design/Backend modules and build plan.md`: section 1 (the build order and the critical path) and section 4 (compute, metering, events and factory: what each owns)
6. `docs/design/Design v0.6 Main.md`: Build order steps 2, 5, 7 and 8; Cost control (budgets, reserve before spending); API routes (four callers, the proxies are services on the host)
7. `docs/design/Sandbox - Docker now, boat or MIOSA next.md`: the trust boundaries: no model key in a room, one token per dispatch revoked on every exit, git over HTTP pushing only its own branch
8. `docs/design/DATABASE.md`: credentials, budget_reservations, price_table, attempts, missions, proposals, events and agent_traces; Ownership
9. `docs/design/API routes.md`: routes 19 to 21, 52, 53, 63, 64, 104 and 109, and the rules on every write
10. `docs/design/Build rules.md`: B7, B8, C4, E3, E5, E7, E8, E9, E10, E12, E13, F4, G5, G7, H6, I3
11. `docs/design/DATABASE.md`: Plumbing: credentials (kind dispatch, git, proxy or service; token_sha256, scope, expires_at, revoked_at; git reads the mission's branches and pushes only its own attempt branch)
12. `packages/db/src/schema/compute.ts`: the credentials table and its CHECKs (credentials_kind_ck, credentials_parent_ck): which parent each kind needs
13. `packages/db/src/schema/runner.ts`: attempts: outcome and ended_at (an ended attempt), and the dispatch it belongs to
14. `packages/server/src/platform/jobs/jobs.ts`: enqueue, startWorker and startConsumer: the reaper is a job kind and the revoke-on-end is a consumer
15. `packages/server/src/server.ts`: startServer's one Scope: where the worker and the consumer start, and close() must still release everything (T-B19)
16. `packages/contract/src/events.ts`: runner.attempt.ended, the event the consumer acts on, and its payload
17. `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b21-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** An attempt's tokens (for the model proxy, the mission repo and the egress proxy) work only for that attempt and only until it ends or its cap plus 10 minutes passes, and a token left behind by a killed attempt is revoked when the server starts again.

**Refs:**
- Design v0.6 Main, Build order step 2: the credentials table with expiry and reaper revocation; done when a token left from a killed attempt is revoked after a host restart
- Sandbox doc: tokens, one per dispatch, revoked on every exit (finish, kill, crash, or leftover)
- Backend modules and build plan, section 3: tokens last the cap plus 10 minutes, and the reaper revokes them when the attempt ends
- Jobs and workers.md: housekeeping (the reaper: tokens) and event consumers
- Step 1's consumers (T-B18): the first consumer and the first job kind the running server starts (sprint-05's note)

**Merged before this starts:** T-B27

**Notes from the lead:**
- The compute module's credentials service, in packages/server/src/compute/credentials/ with index.ts its only public entry: mint, verify and revoke. T-B22, and T-B23 and the egress proxy (sprint-07), use it through index.ts, so its shape is the ticket's main output: say it in the report
- mint takes the kind and its parent (an attempt for dispatch, git and proxy; an onboarding session for service, Canon's token for the proxy) and the scope, writes the row in the caller's Tx, and returns the token once. Only its sha256 is stored. Token bytes come from node:crypto's secure source behind a small service (a fake layer in tests): Effect's Random isn't a secure source; say so in the report
- An attempt's credentials expire at its cap plus 10 minutes: 70 minutes from minting, from Clock. A git credential's scope is the attempt's own branch, mission/<missionId>/<moduleRef>/<role>-a<n> (Port inventory, Worktree provider), worked out from the attempt's rows, never taken from the caller
- verify takes a presented token and the kind the caller accepts, and returns the credential's id, kind, scope, attempt, dispatch and mission (or session), or one refusal for unknown, revoked, expired or another kind alike, so a caller learns nothing from which it was. A token is looked up only by its hash
- Revoked on every exit: a consumer on runner.attempt.ended revokes every credential of that attempt (revoked_at from Clock) in the same transaction as its cursor move. The reaper is a job kind: it revokes credentials whose attempt has ended or whose expires_at has passed, runs once when the server starts (the host-restart case) and then on its schedule, and re-enqueues itself under one key so only one is live
- startServer starts the worker and the consumer in its Scope; close() stops them and still leaves no open database client (T-B19's guarantee and packages/server/test/entry/start.test.ts hold). They are the first job kind and consumer in the running server
- A token never appears in a row other than as its hash, in a log line, an event payload or an error (E6). Logs name the credential's id
- No route mints or reads credentials in this ticket (E8): the runner mints an attempt's tokens in Step 4. Tests mint directly, on attempts and sessions they insert

## 4. Tasks

### T-B21-01: a failing test for: mint for an attempt returns a token once and stores only its sha256; the token isn't in the row, the log lines or any event; verify of that token returns its kind, scope, attempt, dispatch and mission

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B21-02: a failing test for: verify refuses an unknown token, a revoked one, one past its expiry (TestClock 70 minutes after minting) and one of another kind, with the same refusal each time; a token minted 69 minutes ago still verifies

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B21-03: a failing test for: a git credential's scope is the attempt's own branch mission/<missionId>/<moduleRef>/<role>-a<n>, from the attempt's rows

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B21-04: a failing test for: a runner.attempt.ended event revokes every credential of that attempt (dispatch, git and proxy) and no other attempt's; with two copies of the consumer running, each credential is revoked once and the cursor moves once

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B21-05: a failing test for: with credentials left live on an attempt that ended while the server was down, startServer revokes them within the reaper's first run under TestClock, and leaves a running attempt's credentials live

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B21-06: a failing test for: a service credential minted for an onboarding session verifies as kind service with that session and its mission, and is refused once expired

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B21-07: a failing test for: close() after the worker and the consumer have run returns within 2 s and leaves no open database client from the server's pools in pg_stat_activity

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B21-G01: a guard test for: packages/server/test/entry/start.test.ts and T-B19's close() test still pass with the worker and the consumer running

- **Write:** one test, in the test paths, that holds this rule.
- **Verify:** `pnpm test` runs it. It may pass on the start commit (a guard, CR-42); report whether it passed or failed there.

## 5. Territory

**You may change** (and create):
- `packages/server/test/credentials/**`
- `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b21-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/platform/**`
- `packages/server/src/main.ts`
- `packages/server/test/entry/start.test.ts`
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
| T-B22 | builds | `packages/server/src/metering/**`, `docs/design/DATABASE.md`, `packages/db/src/owners.ts` |
| T-B22 | tests | `packages/server/test/metering/**` |
| T-B24 | builds | `packages/server/src/factory/decisions/**`, `packages/server/src/platform/status/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B24 | tests | `packages/server/test/decisions/**`, `packages/server/test/status/**` |
| T-B25 | builds | `packages/server/src/factory/missions/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B25 | tests | `packages/server/test/missions/**` |
| T-B26 | builds | `packages/server/src/events/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B26 | tests | `packages/server/test/streams/**` |
| T-B27 | builds | `packages/server/src/platform/jobs/**`, `docs/steps/step-1-done.md` |
| T-B27 | tests | `packages/server/test/jobs-follow-ups/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts`, `packages/server/test/follow-ups/05-close-releases-pools.test.ts`, `packages/server/test/jobs/retries.test.ts`, `packages/server/test/step-1/done-when.test.ts` |

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
pnpm --filter @avel/server exec vitest run test/entry/start.test.ts
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b21-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B21
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the behaviour tests failing on the start commit, and each guard test's result there (behaviour or guard, per test)
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B21: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B21, "Per-attempt credentials: minted hashed, checked on every use, revoked when the attempt ends and by the reaper after a restart": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b21-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B21-attempt-credentials`, only in the test paths in Part 5. Prove each behaviour test fails on the ticket's start commit, and paste that output into your report. Guard tests may pass there (CR-42); report each one's result too. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-rigg-t-b21-test-unit-completion.md`, committed to the branch. Don't push.
