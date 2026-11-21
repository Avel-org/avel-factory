---
doc: agent-fenn-t-f16-review
ticket: T-F16
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: review
role: review
rigor: full
model: opus
branch: t/F16-decisions-live
checkout: detached
after: [agent-fantem-t-f16-build]
depends_on: [T-F12, T-F14, T-F22]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f16-review-completion.md
---


# T-F16 · review · Fenn: Decisions live: what's waiting on you, approved in one tap

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F16 · rigor full |
| Dispatch | review · Fenn (checker) · model opus |
| Works on | a detached checkout of `t/F16-decisions-live`'s head |
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
9. `apps/web/control-room/src/sources/decisions.js`: the source this ticket switches to the API (T-F14)
10. `apps/web/control-room/src/app/decisions.js`: approveCallFor, rejectCallFor and describeCall: each card's contract call
11. `docs/ui-contracts/decisions-approval-page.md`: the card, Undo, the 409 stale state, the 422 allowed moves
12. `apps/web/e2e/budget.spec.ts`: / at most 235 KB
13. `apps/web/test/decisions-live/**`: the locked acceptance tests: they define done
14. `apps/web/e2e/decisions-live/**`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f16-build-completion.md`: the builder's completion report
16. `docs/review/security-checklist.md`: full rigor: work through it item by item
17. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f16-review.md`: this document: follow it exactly

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

### T-F16-01: check: e2e (behaviour): Decisions lists route 52's rows from the mock, with route 104's waiting total in the top bar

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F16-02: check: e2e (behaviour): approving a checkpoint 0.1 card calls route 40 once after 6 seconds, the card leaves, and route 52 no longer lists it; Undo within 6 seconds sends nothing

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F16-03: check: e2e (behaviour): finalize, package commit, pass approval and release each send their route with an Idempotency-Key and the row's version or hash, and no approval shows a password field

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F16-04: check: e2e (behaviour): a 409 on approve marks the card stale with the error map's sentence and refetches; a 422 shows the allowed moves

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F16-05: check: e2e (behaviour): LG-06, a 401 on route 52 sends you once to /login?next=...&reason=expired with the expired notice, and no second navigation

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F16-06: check: e2e (behaviour): loading, empty (nothing waiting), error (500, offline) render with their words

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F16-07: check: e2e (guard): every Decisions state passes WCAG 2.2 AA at 390 and 1280, light and night; / stays at most 235 KB; no '$' on the page (E15)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F16-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).
- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f16-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-13/findings/t-f16-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/sources/decisions.js`
- `apps/web/control-room/src/app/decisions.js`
- `apps/web/control-room/src/pages/decisions/**`
- `apps/web/control-room/changes/T-F16.md`

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
| T-F15 | builds | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md` |
| T-F15 | tests | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**` |
| T-F17 | builds | `apps/web/control-room/src/sources/missions.js`, `apps/web/control-room/src/pages/project/NewProjectPage.jsx`, `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`, `apps/web/control-room/changes/T-F17.md` |
| T-F17 | tests | `apps/web/test/mission-start/**`, `apps/web/e2e/mission-start/**` |
| T-F23 | builds | `packages/contract-mock/src/**` |
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts`, `packages/contract-mock/test/world.test.ts` |
| T-F24 | builds | `packages/contract-mock/src/**` |
| T-F24 | tests | `packages/contract-mock/test/mission-reads.test.ts` |
| T-F25 | builds | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/uploads.js`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/changes/T-F25.md` |
| T-F25 | tests | `apps/web/e2e/home-headroom/**`, `apps/web/test/sources/samples.test.ts` |

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

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f16-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
verdict: pass | changes | block
ticket: T-F16
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F16, "Decisions live: what's waiting on you, approved in one tap": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f16-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f16-review-completion.md`, left uncommitted. Don't push.
