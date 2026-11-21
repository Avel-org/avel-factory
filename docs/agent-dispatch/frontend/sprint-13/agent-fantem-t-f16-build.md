---
doc: agent-fantem-t-f16-build
ticket: T-F16
lane: frontend
sprint: sprint-13
agent: fantem
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/F16-decisions-live
checkout: branch
after: [agent-fenn-t-f16-test-e2e]
depends_on: [T-F12, T-F14, T-F22]
report: docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f16-build-completion.md
---


# T-F16 · build · Fantem: Decisions live: what's waiting on you, approved in one tap

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F16 · rigor full |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F16-decisions-live` |
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
9. `apps/web/control-room/src/sources/decisions.js`: the source this ticket switches to the API (T-F14)
10. `apps/web/control-room/src/app/decisions.js`: approveCallFor, rejectCallFor and describeCall: each card's contract call
11. `docs/ui-contracts/decisions-approval-page.md`: the card, Undo, the 409 stale state, the 422 allowed moves
12. `apps/web/e2e/budget.spec.ts`: / at most 235 KB
13. `apps/web/test/decisions-live/**`: the locked acceptance tests: they define done
14. `apps/web/e2e/decisions-live/**`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f16-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** Decisions shows what's waiting on you from the API; you approve a checkpoint, a plan, a package, a pass or a release in one tap with Undo for 6 seconds, a card someone else changed says so and refreshes, and no approval asks for your password.

**Refs:**
- CR-W31 part (a) (T-F22)
- handoff port order step 3 (Decisions)
- E15
- login.md section 2 (LG-06, the end-to-end check)
- C4: release and pass approval bind the receipt hash

**Merged before this starts:** T-F12, T-F14, T-F22

**Notes from the lead:**
- Reads: route 52 (the 10-kind PendingDecisionDto union), 53 (one proposal) and 104 (the waiting total, alerts and stallAfterMs). Writes, each card's own call: 54 (decide), 40 (approve a checkpoint), 44 (answer a question), 28 (finalize), 114 (confirm the package commit), 29 (pass approval) and 30 (release, with the receipt hash the row names). Every write sends an Idempotency-Key and the row's rowVersion or bound hash
- Undo: a tap holds the call for 6 seconds with Undo; Undo sends nothing. A 409 marks the card stale with the error map's sentence and refetches route 52; a 422 shows the allowed moves
- Kinds the first mission doesn't raise (factory changes, follow-ups) keep their cards and calls as the export has them, against the mock
- Budget: the client now loads on /. Move the sample JSON / imports for Decisions (pending-decisions.json, evidence-details.json) behind a lazy import in the source, so the sample world loads only when a review switch asks for it. Copy budget.spec's / figure into the report and the PR text as a number. Over 235 KB, stop with needs-cr
- Review, full rigor (G7): Fenn, then the second review against docs/review/security-checklist.md, then Javaris merges. One review round (CR-42). The full-diff rule: every file in `git diff main...HEAD --name-only` is in this build's may-change list, this ticket's locked test files, its own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1
- Size: a full session (#45)

## 4. Tasks

### T-F16-01: make it true: e2e (behaviour): Decisions lists route 52's rows from the mock, with route 104's waiting total in the top bar

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F16-02: make it true: e2e (behaviour): approving a checkpoint 0.1 card calls route 40 once after 6 seconds, the card leaves, and route 52 no longer lists it; Undo within 6 seconds sends nothing

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F16-03: make it true: e2e (behaviour): finalize, package commit, pass approval and release each send their route with an Idempotency-Key and the row's version or hash, and no approval shows a password field

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F16-04: make it true: e2e (behaviour): a 409 on approve marks the card stale with the error map's sentence and refetches; a 422 shows the allowed moves

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F16-05: make it true: e2e (behaviour): LG-06, a 401 on route 52 sends you once to /login?next=...&reason=expired with the expired notice, and no second navigation

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F16-06: make it true: e2e (behaviour): loading, empty (nothing waiting), error (500, offline) render with their words

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F16-07: make it true: e2e (guard): every Decisions state passes WCAG 2.2 AA at 390 and 1280, light and night; / stays at most 235 KB; no '$' on the page (E15)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/control-room/src/sources/decisions.js`
- `apps/web/control-room/src/app/decisions.js`
- `apps/web/control-room/src/pages/decisions/**`
- `apps/web/control-room/changes/T-F16.md`
- `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f16-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/decisions-live/**`
- `apps/web/e2e/decisions-live/**`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/**`
- `apps/web/control-room/src/app/logic.js`
- `apps/web/control-room/src/mock/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F15 | builds | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md`, `apps/web/src/routes/__root.tsx`, `apps/web/src/auth/api.ts` |
| T-F15 | tests | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**`, `apps/web/test/sign-in/origin.test.ts`, `apps/web/e2e/sign-in/sign-out-failure.spec.ts`, `apps/web/e2e/support/preview-auth.ts` |
| T-F17 | builds | `apps/web/control-room/src/sources/missions.js`, `apps/web/control-room/src/pages/project/NewProjectPage.jsx`, `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`, `apps/web/control-room/changes/T-F17.md` |
| T-F17 | tests | `apps/web/test/mission-start/**`, `apps/web/e2e/mission-start/**` |
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
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F16`).
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

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f16-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F16
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F16, "Decisions live: what's waiting on you, approved in one tap": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f16-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F16-decisions-live`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f16-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/F16-decisions-live`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
