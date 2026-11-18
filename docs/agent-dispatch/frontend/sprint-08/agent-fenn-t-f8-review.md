---
doc: agent-fenn-t-f8-review
ticket: T-F8
lane: frontend
sprint: sprint-08
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F8-control-room-budget
checkout: detached
after: [agent-fantem-t-f8-build]
depends_on: [T-F7]
report: docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-review-completion.md
---


# T-F8 · review · Fenn: The control room loads each page's code when it opens, and / holds to 220 KB of JavaScript

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-08 · Step 1 |
| Ticket | T-F8 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F8-control-room-budget`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-08/codebase-analysis.md`: the codebase in short
5. `docs/design/CR-W29 The control room from the design export.md`: what this sprint does, and which rules change for how long
6. `docs/ui-reference/control-room-handoff/README.md`: the export's own handoff: port order, the rules that aren't obvious, what's mock and what's contract
7. `docs/ui-reference/control-room-handoff/screens.md`: every screen, its route and its states
8. `apps/web/control-room/src/app/logic.js`: its static imports pull every page's values and the whole sample world into the first load
9. `apps/web/control-room/src/app/ControlRoomView.jsx`: which page shows, the seam for loading each page's view on demand
10. `apps/web/control-room/src/main.jsx`: since T-F7 it exports ControlRoom for src/routes/index.tsx to mount, and imports the 28 stylesheets (CSS, not JavaScript)
11. `apps/web/control-room/SOURCE.md`: what T-F7 already changed in the export, and where this ticket names its own changes
12. `apps/web/e2e/budget.spec.ts`: the measurement T-F7 set, now held to 220 KB. T-F7's build measured 354,051 B gzipped for /; attempt 1 measured the floor with every other page on demand at about 205 to 215 KB
13. `apps/web/e2e/control-room-budget/**`: the locked acceptance tests: they define done
14. `apps/web/e2e/budget.spec.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-08/agent-fantem-t-f8-build-completion.md`: the builder's completion report
16. `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** The Decisions home loads faster on a phone: / fetches at most 220 KB of JavaScript, gzipped, before it's interactive (down from about 355 KB), and every other page loads its own code when it opens.

**Refs:**
- E16; CR-W29 decision 6, as amended Nov 17: 220 KB from T-F8, only ever lowered; 150 KB returns as the wiring's done-when

**Merged before this starts:** T-F7

**Notes from the lead:**
- Every export file this ticket changes gets a line, with its reason, in SOURCE.md's "Changed for apps/web" section; its listed SHA-256 stays the one copied (T-F7-02)
- Split by page: each page's view, its values module (knowledge, operations, uploads, canon, history, crew) and its mock JSON load with a dynamic import when its #/ route first opens, and Decisions' stays in the first load. A page that's loading shows the export's PageSkeleton
- Don't change what any page shows or how it behaves; T-F7's tests and every earlier locked test must still pass
- Don't split logic.js's class or restructure it: the wiring moves each screen's values out of it (CR-W29 decision 6, as amended). Move imports behind dynamic imports, and move the values it computes per page only where that's a move, not a rewrite. If / can't reach 220 KB that way, stop with needs-cr and report what the first load holds, by module and size
- Attempt 1 (needs-cr, Fantem's report 2131a61) measured the first load by module; start from its breakdown

## 4. Tasks

### T-F8-01: check: e2e (budget.spec.ts, changed under CR-W29): everything / loads before the Decisions home is interactive is at most 220 KB gzipped, with a warning over 200 KB (CR-W29 decision 6, as amended)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F8-02: check: e2e: opening Library, Live and a project's Progress each fetches that page's own script the first time, and the page renders the same text as before the split

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F8-03: check: e2e: on a 390x844 phone with a slow-4G profile, the Decisions home's first decision card is visible within the first load (the same 220 KB)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F8-04: check: Attempt 2, under F2 and CR-W29 decision 6 as amended: in your own commit, change LIMIT to 220 × 1024 and the warning to 200 × 1024 in e2e/budget.spec.ts and e2e/control-room-budget/budget.spec.ts, and change nothing else in attempt 1's tests. If you think anything else in them is wrong, stop with test-dispute

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F8-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-08/findings/t-f8-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/**`
- `apps/web/control-room/SOURCE.md`
- `apps/web/src/routes/**`
- `apps/web/src/control-room.d.ts`
- `apps/web/vite.config.ts`

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/control-room/contract/**`
- `apps/web/control-room/tools/**`
- `apps/web/src/data/**`
- `apps/web/src/styles/**`
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
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F8
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F8, "The control room loads each page's code when it opens, and / holds to 220 KB of JavaScript": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-08/agent-fenn-t-f8-review-completion.md`, left uncommitted. Don't push.
