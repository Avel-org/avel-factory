---
doc: agent-rigg-t-b6-test-unit
ticket: T-B6
lane: backend
sprint: sprint-02
agent: rigg
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/B6-defect-code
checkout: branch
after: []
depends_on: []
report: docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-test-unit-completion.md
---


# T-B6 · tests · Rigg: The contract's defect code: INTERNAL_SERVER_ERROR, 500, no details; contract 1.0.1 (CR-38)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B6 · rigor standard |
| Dispatch | test-unit · Rigg (checker) · model sonnet |
| Works on | `t/B6-defect-code` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-02/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 3 (database errors) and 10 (events and seq), and test 6
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 2 (the Db service: withTransaction, Tx, Events.append, commitWithEvents) and section 6 (spike 1 check 2)
7. `docs/design/CR-39 Effect's language service on TypeScript 7.md`: the accepted change: @effect/tsgo 0.64.1 replaces @effect/language-service, run in the editor and CI
8. `docs/design/Build rules.md`: C4 (full rigor), E5 (one lockfile change per cycle), E9 (spike 2 before the jobs engine), E10 (real Postgres), F2 (locked tests), H6 (the lock check)
9. `docs/design/CR-38 A contract error code for defects.md`: the change, word for word
10. `packages/contract/src/errors.ts`: errorMap: the generic codes, where the new one goes
11. `packages/contract/src/version.ts`: CONTRACT_VERSION 1.0.0 to 1.0.1
12. `packages/server/src/platform/effect-handler.ts`: already answers a defect with INTERNAL_SERVER_ERROR; read only, it shouldn't need a change
13. `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** A defect's 500 carries a code from the contract's catalog, so the web can show it like any other error.

**Refs:**
- CR-38 (accepted Nov 17; Zero signed off, I3)
- AGENTS.md, Writing Effect rule 3
- Build rules I3

**Labels:** contract · implements CR-38

**Notes from the lead:**
- Add INTERNAL_SERVER_ERROR { status: 500, message: 'Something went wrong' } to errorMap's generic codes, with no data, and change the comment 'the generic seven' to 'the generic eight'. Bump CONTRACT_VERSION to 1.0.1. Regenerate docs/generated with pnpm --filter @avel/docs generate and commit it
- The server already sends INTERNAL_SERVER_ERROR for a defect (T-B1), so no server file changes. If a server test or typecheck fails because of the new code, stop with out-of-scope rather than editing the server

## 4. Tasks

### T-B6-01: a failing test for: errorMap has INTERNAL_SERVER_ERROR with status 500, message 'Something went wrong' and no data schema

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B6-02: a failing test for: CONTRACT_VERSION is 1.0.1

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

### T-B6-03: a failing test for: the generated OpenAPI document lists INTERNAL_SERVER_ERROR as a 500 error code

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `packages/contract/test/defect-code.test.ts`
- `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `packages/contract/src/routes/**`
- `packages/contract/src/dto/**`
- `packages/contract-mock/**`
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
| T-B2 | builds | `packages/server/package.json`, `packages/server/tsconfig.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml`, `docs/design/Outside sources and what we took.md` |
| T-B2 | tests | `tools/repo-checks/test/dependencies.test.ts`, `tools/repo-checks/test/effect-check.test.ts`, `tools/repo-checks/test/fixtures/effect/**` |
| T-B3 | builds | `packages/server/src/platform/db/errors.ts`, `packages/server/src/platform/errors.ts` |
| T-B3 | tests | `packages/server/test/db/**` |
| T-B4 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/db/tx.ts`, `packages/server/src/platform/db/events.ts`, `packages/server/src/platform/db/index.ts` |
| T-B4 | tests | `packages/server/test/db-service/**` |
| T-B5 | builds | `tools/repo-checks/src/**` |
| T-B5 | tests | `tools/repo-checks/test/locks-merges.test.ts` |

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
pnpm --filter @avel/contract test
pnpm --filter @avel/docs generate && git diff --exit-code docs/generated
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B6
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-B6: <test paths> @ <your last commit>`

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B6, "The contract's defect code: INTERNAL_SERVER_ERROR, 500, no details; contract 1.0.1 (CR-38)": the tests dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/B6-defect-code`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-test-unit-completion.md`, committed to the branch. Don't push.
