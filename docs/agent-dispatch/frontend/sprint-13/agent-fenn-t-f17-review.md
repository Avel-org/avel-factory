---
doc: agent-fenn-t-f17-review
ticket: T-F17
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F17-mission-start-live
checkout: detached
after: [agent-fantem-t-f17-build]
depends_on: [T-F12, T-F14, T-F22]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f17-review-completion.md
---


# T-F17 · review · Fenn: A mission starts: clients, projects and the overview, live

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F17 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F17-mission-start-live`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
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
13. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f17-build-completion.md`: the builder's completion report
14. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f17-review.md`: this document: follow it exactly

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

### T-F17-01: check: e2e (behaviour): adding a client calls route 9 once and the client shows in Clients; a replayed create changes nothing

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F17-02: check: e2e (behaviour): New project for that client calls route 20 and opens the new mission's overview, read from route 21

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F17-03: check: e2e (behaviour): All projects lists route 19's rows, and the internal kind shows only under its filter

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F17-04: check: e2e (behaviour): the overview shows route 21's gate strip and route 108's module rows; an unknown mission id shows not found

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F17-05: check: e2e (behaviour): loading, empty (no clients, no projects) and error (422 on create with its field message, 500, offline) render with their words

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F17-06: check: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F17-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f17-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-13/findings/t-f17-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/sources/missions.js`
- `apps/web/control-room/src/pages/project/NewProjectPage.jsx`
- `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`
- `apps/web/control-room/changes/T-F17.md`

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
| T-F15 | builds | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md` |
| T-F15 | tests | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**` |
| T-F16 | builds | `apps/web/control-room/src/sources/decisions.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/pages/decisions/**`, `apps/web/control-room/changes/T-F16.md` |
| T-F16 | tests | `apps/web/test/decisions-live/**`, `apps/web/e2e/decisions-live/**` |
| T-F23 | builds | `packages/contract-mock/src/**` |
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts` |
| T-F24 | builds | `packages/contract-mock/src/**` |
| T-F24 | tests | `packages/contract-mock/test/mission-reads.test.ts` |

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
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f17-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F17
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F17, "A mission starts: clients, projects and the overview, live": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f17-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f17-review-completion.md`, left uncommitted. Don't push.
