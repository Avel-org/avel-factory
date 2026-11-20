---
doc: agent-fenn-t-f20-review
ticket: T-F20
lane: frontend
sprint: sprint-14
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F20-build-live
checkout: detached
after: [agent-fantem-t-f20-build]
depends_on: [T-F14, T-F23, T-F24]
report: docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f20-review-completion.md
---


# T-F20 · review · Fenn: Watch the build, live from the streams

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-14 · Step 1 |
| Ticket | T-F20 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F20-build-live`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-14/codebase-analysis.md`: the codebase in short
5. `docs/ui-reference/control-room-handoff/screens.md`: every screen: its routes by number, its states and their words
6. `docs/ui-reference/control-room-handoff/README.md`: the rules that aren't obvious: untrusted text, nothing polls, motion
7. `docs/design/API routes.md`: each route by number
8. `apps/web/control-room/src/sources/build.js`: the source this ticket switches to the API (T-F14)
9. `apps/web/control-room/src/lib/stream.js`: T-F14's route 63 reader, with resume and the stall check
10. `docs/ui-reference/control-room-handoff/screens.md`: Live, Watch the work, Module: routes and states
11. `apps/web/test/build-live/**`: the locked acceptance tests: they define done
12. `apps/web/e2e/build-live/**`: the locked acceptance tests: they define done
13. `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f20-build-completion.md`: the builder's completion report
14. `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f20-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** The factory floor and the module page stay live from the event and trace streams: the retry ladder, cost against its cap, each agent step and each landing, with nothing polling but the stall check.

**Refs:**
- CR-W31 parts (b) and (c), T-F23 and T-F24: routes 49, 56, 63, 64, 104, 108, 109
- handoff port order step 5 (Live)
- README: nothing polls except the stall check
- CR-W20 section 3 (AI cost only against its cap)

**Merged before this starts:** T-F14, T-F23, T-F24

**Notes from the lead:**
- Reads: 104 (slots, stallAfterMs), 49 (dispatches), 108 (a module run: ladder, cost against its cap, attempts, findings), 109 (an attempt's steps, to backfill), 56 (an integration commit). Streams: 63 (events, through lib/stream.js) and 64 (traces, view=steps, one per open terminal, closed when it closes), each resuming with Last-Event-ID
- Cost shows only as used against its cap, or a percent: no '$' (E15). Agent step text renders as plain text
- The stall check is the only timer: no event within stallAfterMs shows the still amber dot
- Review: one round (CR-42). The full-diff rule: every file in `git diff main...HEAD --name-only` is in this build's may-change list, this ticket's locked test files, its own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1
- Size: a full session (#45). Run only this ticket's specs while you work

## 4. Tasks

### T-F20-01: check: e2e (behaviour): an event on route 63 updates the factory floor and the module page without a reload, and a dropped stream resumes with Last-Event-ID and misses nothing

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F20-02: check: e2e (behaviour): the module page shows route 108's ladder and cost against its cap, backfills steps from 109, then follows route 64's live steps

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F20-03: check: e2e (behaviour): with no event within stallAfterMs the stalled state shows, and the next event clears it; no other request repeats on a timer

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F20-04: check: e2e (behaviour): agent step text holding <script> renders as text

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F20-05: check: e2e (behaviour): loading, empty (nothing running), error (500, offline, a stream that won't reconnect) render with their words

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F20-06: check: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F20-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f20-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-14/findings/t-f20-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/sources/build.js`
- `apps/web/control-room/src/pages/live/**`
- `apps/web/control-room/src/pages/operations/ModulePage.jsx`
- `apps/web/control-room/src/lib/live.js`
- `apps/web/control-room/changes/T-F20.md`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/**`
- `apps/web/control-room/src/app/logic.js`
- `apps/web/control-room/src/app/operations.js`
- `apps/web/control-room/src/mock/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F18 | builds | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/pages/project/CanonPage.jsx`, `apps/web/control-room/src/pages/project/CanonDock.jsx`, `apps/web/control-room/changes/T-F18.md` |
| T-F18 | tests | `apps/web/test/canon-live/**`, `apps/web/e2e/canon-live/**` |
| T-F19 | builds | `apps/web/control-room/src/sources/plan.js`, `apps/web/control-room/changes/T-F19.md` |
| T-F19 | tests | `apps/web/test/plan-dispatch-live/**`, `apps/web/e2e/plan-dispatch-live/**` |
| T-F21 | builds | `apps/web/control-room/src/sources/release.js`, `apps/web/control-room/src/pages/operations/ReceiptPage.jsx`, `apps/web/control-room/changes/T-F21.md` |
| T-F21 | tests | `apps/web/test/release-live/**`, `apps/web/e2e/release-live/**` |

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

**Your report:** `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f20-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F20
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F20, "Watch the build, live from the streams": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f20-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f20-review-completion.md`, left uncommitted. Don't push.
