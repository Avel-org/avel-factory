---
doc: agent-soap-t-b2-build
ticket: T-B2
lane: backend
sprint: sprint-02
agent: soap
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/B2-effect-tsgo
checkout: branch
after: [agent-rigg-t-b2-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-02/agent-soap-t-b2-build-completion.md
---


# T-B2 · build · Soap: The cycle's dependencies: @effect/tsgo in place of @effect/language-service (CR-39), and the database packages for the server

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B2 · rigor standard |
| Dispatch | build · Soap (builder) · model sonnet |
| Works on | `t/B2-effect-tsgo` |
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
9. `docs/design/CR-39 Effect's language service on TypeScript 7.md`: what changes where, and the stop rule
10. `AGENTS.md`: Writing Effect, rule 9, and the rules the language service catches
11. `packages/server/package.json`: the manifest T-B0 made: the pin to replace and the scripts to add to
12. `packages/db/package.json`: the exact versions of drizzle-orm, pg and @types/pg the server must match
13. `packages/server/tsconfig.json`: where an editor plugin entry goes, if @effect/tsgo needs one
14. `.github/workflows/ci.yml`: the main CI job the new step joins
15. `tools/repo-checks/test/dependencies.test.ts`: T-B0-08, the locked pin test this ticket's tests change
16. `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build-completion.md`: the needs-cr stop: the exact error @effect/language-service gives on TypeScript 7.0.2
17. `tools/repo-checks/test/dependencies.test.ts`: the locked acceptance tests: they define done
18. `tools/repo-checks/test/effect-check.test.ts`: the locked acceptance tests: they define done
19. `tools/repo-checks/test/fixtures/effect/**`: the locked acceptance tests: they define done
20. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b2-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A common Effect mistake in packages/server, such as an Effect that is created and never run, fails CI, and the server can import @avel/db.

**Refs:**
- CR-39 decisions 1 and 2 (accepted Nov 17)
- AGENTS.md, Writing Effect rule 9
- Build rules E5

**Notes from the lead:**
- New dependency, approved by Javaris with CR-39 (Nov 17, E5): dev only in packages/server, @effect/tsgo 0.64.1 (MIT; published Nov 2, 2026, the newest version at least two weeks old on Nov 17; about 11.3 MB plus one platform binary from its optional dependencies; bin effect-tsgo). Remove @effect/language-service 0.87.5: `pnpm why @effect/language-service` must print nothing
- Not new, already in the lockfile through packages/db, so no E5 approval is needed: add to packages/server's dependencies @avel/db workspace:*, drizzle-orm 0.45.4 and pg 8.23.1, and to devDependencies @types/pg 8.23.1, the same versions packages/db pins. T-B3 and T-B4 need them. This ticket is the cycle's one lockfile change
- The script check:effect in packages/server/package.json runs effect-tsgo and exits non-zero on any Effect diagnostic, naming the file. With no arguments it checks the server's src and test; given paths (after --), it checks those instead, which is how the tests point it at their fixtures. Read the package's README for the command line, and state in the report the exact command and any tsconfig plugin entry you added
- CI: add a step to the main job in .github/workflows/ci.yml, after typecheck, that runs pnpm --filter @avel/server run check:effect. .github/** is a CODEOWNERS path, so Javaris merges this PR
- Outside sources and what we took.md: the Effect entry names @effect/tsgo as the language service (CR-39)
- Stop rule (CR-39 section 3): if effect-tsgo can't run on TypeScript 7.0.2, or can't be run from the command line for CI, stop with needs-cr. Don't pin an older TypeScript or an older package

## 4. Tasks

### T-B2-01: make it true: dependencies (T-B0-08, changed in the checker's own commit, F2): packages/server pins @effect/tsgo 0.64.1 and no longer lists @effect/language-service

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/server run check:effect`, `pnpm --filter @avel/repo-checks test`, `pnpm why @effect/language-service`

### T-B2-02: make it true: dependencies: packages/server lists @avel/db workspace:*, drizzle-orm and pg at exactly the versions packages/db pins, and @types/pg likewise

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/server run check:effect`, `pnpm --filter @avel/repo-checks test`, `pnpm why @effect/language-service`

### T-B2-03: make it true: effect check: packages/server's check:effect, given a fixture with an Effect that is created and never run, exits non-zero and names the file

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/server run check:effect`, `pnpm --filter @avel/repo-checks test`, `pnpm why @effect/language-service`

### T-B2-04: make it true: effect check: the same script exits 0 on a clean fixture, and with no arguments on the server as it stands

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/server run check:effect`, `pnpm --filter @avel/repo-checks test`, `pnpm why @effect/language-service`

### T-B2-05: make it true: ci: .github/workflows/ci.yml runs pnpm --filter @avel/server run check:effect

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/server run check:effect`, `pnpm --filter @avel/repo-checks test`, `pnpm why @effect/language-service`

## 5. Territory

**You may change** (and create):
- `packages/server/package.json`
- `packages/server/tsconfig.json`
- `pnpm-lock.yaml`
- `.github/workflows/ci.yml`
- `docs/design/Outside sources and what we took.md`
- `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b2-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `tools/repo-checks/test/dependencies.test.ts`
- `tools/repo-checks/test/effect-check.test.ts`
- `tools/repo-checks/test/fixtures/effect/**`

**Never change, whatever the task says:**
- `packages/server/src/**`
- `packages/contract/**`
- `packages/db/**`
- `pnpm-workspace.yaml`
- `.github/CODEOWNERS`
- `.github/workflows/locks.yml`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B3 | builds | `packages/server/src/platform/db/errors.ts`, `packages/server/src/platform/errors.ts` |
| T-B3 | tests | `packages/server/test/db/**` |
| T-B4 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/db/tx.ts`, `packages/server/src/platform/db/events.ts`, `packages/server/src/platform/db/index.ts` |
| T-B4 | tests | `packages/server/test/db-service/**` |
| T-B5 | builds | `tools/repo-checks/src/**` |
| T-B5 | tests | `tools/repo-checks/test/locks-merges.test.ts` |
| T-B6 | builds | `packages/contract/src/errors.ts`, `packages/contract/src/version.ts`, `docs/generated/**` |
| T-B6 | tests | `packages/contract/test/defect-code.test.ts` |
| T-B7 | builds | `tools/repo-checks/src/**` |
| T-B7 | tests | `tools/repo-checks/test/locks-tests-report.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B2`).
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
pnpm install --frozen-lockfile
pnpm build && pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @avel/server run check:effect
pnpm --filter @avel/repo-checks test
pnpm why @effect/language-service
```

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b2-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B2
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B2, "The cycle's dependencies: @effect/tsgo in place of @effect/language-service (CR-39), and the database packages for the server": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b2-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B2-effect-tsgo`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b2-build-completion.md`, committed to the branch. Don't push.
