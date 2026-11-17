---
doc: agent-soap-t-b3-build
ticket: T-B3
lane: backend
sprint: sprint-02
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B3-db-errors
checkout: branch
after: [agent-rigg-t-b3-test-unit]
depends_on: [T-B2]
report: docs/agent-dispatch/backend/sprint-02/agent-soap-t-b3-build-completion.md
---


# T-B3 · build · Soap: Database errors to contract codes: unique 409, CHECK 422, foreign key 409 or 422, stale rowVersion 409

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B3 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B3-db-errors` |
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
9. `docs/design/Step 0 and Step 1 plan.md`: Step 1 item 3: which violation becomes which status, and 'constraints are never duplicated in code as the only guard'
10. `packages/contract/src/errors.ts`: the codes to map to: ALREADY_EXISTS (409), DELETE_REFUSED (409), CONSTRAINT_VIOLATION (422), STALE_VERSION (409), each with its details schema
11. `packages/server/src/platform/errors.ts`: the one table from a tagged error to a code (T-B1); new tags get rows here
12. `packages/server/src/platform/effect-handler.ts`: how a tagged failure becomes the ORPCError with its details; read only
13. `packages/db/src/schema/platform.ts`: real constraints to test against: users_email_uq, the CHECKs, the foreign keys, row_version columns
14. `packages/db/test/helpers/db.ts`: how a test makes and migrates its own database
15. `packages/server/test/db/**`: the locked acceptance tests: they define done
16. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b3-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A write that breaks a database rule comes back as the contract's 409 or 422 naming the constraint, not as a 500.

**Refs:**
- Step 0 and Step 1 plan, Step 1 item 3 and test 6
- AGENTS.md, API rules (writes) and Writing Effect rule 3
- Build rules E11

**Merged before this starts:** T-B2

**Notes from the lead:**
- errors.ts in platform/db exports one function that turns a thrown node-postgres error into a tagged error: 23505 unique to AlreadyExists, 23514 CHECK to ConstraintViolation, 23503 foreign key to DeleteRefused when a referenced row's delete or update is refused and to ConstraintViolation when the parent is missing. Each carries details { constraint } with the constraint's name from the error. Any other database error stays a defect (Writing Effect rule 3)
- Stale rowVersion is not a Postgres error: a versioned update matches no row. errors.ts also exports a helper that turns 'no row updated' into StaleVersion, with STALE_VERSION's details for field rowVersion and the current version
- Add each new tag's row to errorTable in platform/errors.ts. Nothing calls the function yet: T-B4 wires it into the Db service
- Full rigor: platform/db is a CODEOWNERS path, so Javaris merges it (G7), and the second review follows the security checklist

## 4. Tasks

### T-B3-01: make it true: harness: each test file gets its own migrated database (support file in test/db, reused by T-B4's tests)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B3-02: make it true: a real unique violation (a second user with the same email) becomes AlreadyExists, and through effectHandler a 409 ALREADY_EXISTS whose details name users_email_uq

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B3-03: make it true: a real CHECK violation becomes ConstraintViolation, and a 422 CONSTRAINT_VIOLATION naming the CHECK

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B3-04: make it true: a real foreign-key refusal on delete becomes DeleteRefused, a 409 DELETE_REFUSED; a real missing parent on insert becomes ConstraintViolation, a 422

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B3-05: make it true: a versioned update that matches no row becomes StaleVersion, a 409 STALE_VERSION with field rowVersion

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B3-06: make it true: any other database error (for example a syntax error) stays a defect: 500, never shown

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/db/errors.ts`
- `packages/server/src/platform/errors.ts`
- `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b3-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/db/**`

**Never change, whatever the task says:**
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/package.json`
- `packages/contract/**`
- `packages/db/**`
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
| T-B4 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/db/tx.ts`, `packages/server/src/platform/db/events.ts`, `packages/server/src/platform/db/index.ts` |
| T-B4 | tests | `packages/server/test/db-service/**` |
| T-B5 | builds | `tools/repo-checks/src/**` |
| T-B5 | tests | `tools/repo-checks/test/locks-merges.test.ts` |
| T-B6 | builds | `packages/contract/src/errors.ts`, `packages/contract/src/version.ts`, `docs/generated/**` |
| T-B6 | tests | `packages/contract/test/defect-code.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B3`).
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
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b3-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B3
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B3, "Database errors to contract codes: unique 409, CHECK 422, foreign key 409 or 422, stale rowVersion 409": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b3-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B3-db-errors`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b3-build-completion.md`, committed to the branch. Don't push.
