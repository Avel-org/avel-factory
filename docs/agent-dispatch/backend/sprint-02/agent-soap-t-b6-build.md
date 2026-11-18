---
doc: agent-soap-t-b6-build
ticket: T-B6
lane: backend
sprint: sprint-02
agent: soap
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/B6-defect-code
checkout: branch
after: [agent-rigg-t-b6-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-02/agent-soap-t-b6-build-completion.md
---


# T-B6 · build · Soap: The contract's defect code: INTERNAL_SERVER_ERROR, 500, no details; contract 1.0.1 (CR-38)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B6 · rigor standard |
| Dispatch | build · Soap (builder) · model sonnet |
| Works on | `t/B6-defect-code` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
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
13. `packages/contract/test/defect-code.test.ts`: the locked acceptance tests: they define done
14. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b6-build.md`: this document: follow it exactly

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

### T-B6-01: make it true: errorMap has INTERNAL_SERVER_ERROR with status 500, message 'Something went wrong' and no data schema

- **Verify:** its locked test passes: `pnpm --filter @avel/contract test`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B6-02: make it true: CONTRACT_VERSION is 1.0.1

- **Verify:** its locked test passes: `pnpm --filter @avel/contract test`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B6-03: make it true: the generated OpenAPI document lists INTERNAL_SERVER_ERROR as a 500 error code

- **Verify:** its locked test passes: `pnpm --filter @avel/contract test`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/contract/src/errors.ts`
- `packages/contract/src/version.ts`
- `docs/generated/**`
- `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b6-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/contract/test/defect-code.test.ts`

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
| T-B7 | builds | `tools/repo-checks/src/**` |
| T-B7 | tests | `tools/repo-checks/test/locks-tests-report.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B6`).
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
pnpm --filter @avel/contract test
pnpm --filter @avel/docs generate && git diff --exit-code docs/generated
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b6-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B6
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B6, "The contract's defect code: INTERNAL_SERVER_ERROR, 500, no details; contract 1.0.1 (CR-38)": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b6-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B6-defect-code`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b6-build-completion.md`, committed to the branch. Don't push.
