---
doc: agent-fantem-t-f17-build
ticket: T-F17
lane: frontend
sprint: sprint-13
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: opus
branch: t/F17-mission-start-live
checkout: branch
after: [agent-fenn-t-f17-test-e2e]
depends_on: [T-F12, T-F14, T-F22]
report: docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f17-build-completion.md
---


# T-F17 · build · Fantem: A mission starts: clients, projects and the overview, live

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F17 · rigor standard |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F17-mission-start-live` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-13/codebase-analysis.md`: the codebase in short
5. `docs/ui-reference/control-room-handoff/screens.md`: every screen: its routes by number, its states and their words
6. `docs/ui-reference/control-room-handoff/README.md`: the rules that aren't obvious: Decisions is home, approvals never ask for a password, no money, nothing polls
7. `docs/design/API routes.md`: each route by number
8. `docs/ui-contracts/decisions-approval-page.md`: the decision card, Undo and the stale state
9. `apps/web/control-room/src/sources/missions.js`: the source this ticket switches to the API (T-F14)
10. `docs/ui-reference/control-room-handoff/screens.md`: Clients, All projects, New project, Progress: routes and states
11. `apps/web/test/mission-start/**`: the locked acceptance tests: they define done
12. `apps/web/e2e/mission-start/**`: the locked acceptance tests: they define done
13. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f17-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** You add a client, start a project for it, and find it in All projects and on its overview with the gate strip and its modules, all from the API.

**Refs:**
- CR-W31 part (a) (T-F22)
- handoff port order step 4 (Projects) and 9 (Clients)
- CR-43 (the clients routes in Step 1)

**Merged before this starts:** T-F12, T-F14, T-F22

**Notes from the lead:**
- Reads: route 8 (clients; AVEL itself only with ?kind=internal), 10 (one client), 19 (missions), 21 (one mission: state, gate strip, onboarding progress), 108 (a module run row). Writes: 9 (create a client) and 20 (create a mission with {name, clientId?}; no kind, Canon's first question decides it), each with an Idempotency-Key
- Leads, follow-ups, repo connections and proof consent (routes 11 to 17, 117 to 122) keep the sample world: the first mission doesn't need them
- Review: one round (CR-42); the full-diff rule applies as in T-F16
- Size: a full session (#45)

## 4. Tasks

### T-F17-01: make it true: e2e (behaviour): adding a client calls route 9 once and the client shows in Clients; a replayed create changes nothing

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F17-02: make it true: e2e (behaviour): New project for that client calls route 20 and opens the new mission's overview, read from route 21

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F17-03: make it true: e2e (behaviour): All projects lists route 19's rows, and the internal kind shows only under its filter

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F17-04: make it true: e2e (behaviour): the overview shows route 21's gate strip and route 108's module rows; an unknown mission id shows not found

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F17-05: make it true: e2e (behaviour): loading, empty (no clients, no projects) and error (422 on create with its field message, 500, offline) render with their words

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F17-06: make it true: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/control-room/src/sources/missions.js`
- `apps/web/control-room/src/pages/project/NewProjectPage.jsx`
- `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`
- `apps/web/control-room/changes/T-F17.md`
- `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f17-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/mission-start/**`
- `apps/web/e2e/mission-start/**`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/**`
- `apps/web/control-room/src/app/**`
- `apps/web/control-room/src/mock/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F15 | builds | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md`, `apps/web/src/routes/__root.tsx`, `apps/web/src/auth/api.ts` |
| T-F15 | tests | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**`, `apps/web/test/sign-in/origin.test.ts`, `apps/web/e2e/sign-in/sign-out-failure.spec.ts`, `apps/web/e2e/support/preview-auth.ts` |
| T-F16 | builds | `apps/web/control-room/src/sources/decisions.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/pages/decisions/**`, `apps/web/control-room/changes/T-F16.md` |
| T-F16 | tests | `apps/web/test/decisions-live/**`, `apps/web/e2e/decisions-live/**` |
| T-F23 | builds | `packages/contract-mock/src/**` |
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts`, `packages/contract-mock/test/world.test.ts` |
| T-F24 | builds | `packages/contract-mock/src/**` |
| T-F24 | tests | `packages/contract-mock/test/mission-reads.test.ts` |
| T-F25 | builds | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/uploads.js`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/changes/T-F25.md` |
| T-F25 | tests | `apps/web/e2e/home-headroom/**`, `apps/web/test/sources/samples.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F17`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f17-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F17
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F17, "A mission starts: clients, projects and the overview, live": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f17-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F17-mission-start-live`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f17-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/F17-mission-start-live`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
