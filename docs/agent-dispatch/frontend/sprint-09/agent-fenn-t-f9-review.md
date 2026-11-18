---
doc: agent-fenn-t-f9-review
ticket: T-F9
lane: frontend
sprint: sprint-09
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F9-control-room-every-screen
checkout: detached
after: [agent-fantem-t-f9-build]
depends_on: [T-F7]
report: docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-review-completion.md
---


# T-F9 · review · Fenn: Every screen of the control room opens and passes WCAG 2.2 AA

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-09 · Step 1 |
| Ticket | T-F9 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F9-control-room-every-screen`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-09/codebase-analysis.md`: the codebase in short
5. `docs/design/CR-W29 The control room from the design export.md`: what this sprint does, and which rules change for how long
6. `docs/ui-reference/control-room-handoff/README.md`: the export's own handoff: port order, the rules that aren't obvious, what's mock and what's contract
7. `docs/ui-reference/control-room-handoff/screens.md`: every screen, its route and its states
8. `docs/ui-reference/control-room-handoff/screens.md`: the 25 screens, their routes and their states
9. `/mnt/c/Users/javar/Desktop/avel-control-room/tests/e2e/flow-smoke-every-page.cjs`: the export's own every-page check, to port (read as data)
10. `/mnt/c/Users/javar/Desktop/avel-control-room/tests/e2e/audit-axe-routes.cjs`: the export's axe audit, to port (read as data)
11. `apps/web/e2e/control-room-screens/**`: the locked acceptance tests: they define done
12. `docs/agent-dispatch/frontend/sprint-09/agent-fantem-t-f9-build-completion.md`: the builder's completion report
13. `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** Every page in the export's registry opens at its route in light and night, on desktop and phone, with no error and no accessibility violation.

**Refs:**
- E17; control-room-handoff/screens.md; the export's flow-smoke-every-page and audit-axe-routes

**Merged before this starts:** T-F7

**Notes from the lead:**
- Javaris (Nov 17): T-F9's tests run while T-F8 is built, so depends_on names T-F7 and not T-F8. T-F9's build starts only after T-F8 has merged and the lead has rebuilt t/F9 on that main, with the lock line after every tests-phase commit (F2). OSA starts the build by hand at that point
- T-F8 makes every page but Decisions load its code when its #/ route first opens, behind the export's PageSkeleton (data-ui="Skeleton"). The tests wait for each page's title and for no skeleton, never for a synchronous render, so they hold before and after T-F8
- Every export file this ticket changes gets a line, with its reason, in SOURCE.md's "Changed for apps/web" section; its listed SHA-256 stays the one copied (T-F7-02)
- Fix only what the tests find, in the export's own files, each fix small and named in the report. A fix that would change the design (a colour, a size, a layout) beyond what WCAG 2.2 AA needs: stop with out-of-scope and name it

## 4. Tasks

### T-F9-01: check: e2e: every route in the export's page registry (PAGES, with a sample id for each $param from the sample world) renders its page's title, with no page error and no console error, at 1280x800 and 390x844

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F9-02: check: e2e: axe, through T-F7's expectNoViolationsSettled (reduced motion), finds no WCAG 2.2 AA violation on every one of those routes at 1280 and 390, in light and night (E17)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F9-03: check: e2e: an unknown #/ route shows the export's Not found page

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F9-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-09/findings/t-f9-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/**`
- `apps/web/control-room/SOURCE.md`

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/control-room/contract/**`
- `apps/web/control-room/tools/**`
- `apps/web/src/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F9
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F9, "Every screen of the control room opens and passes WCAG 2.2 AA": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-09/agent-fenn-t-f9-review-completion.md`, left uncommitted. Don't push.
