---
doc: agent-fenn-t-f21-review
ticket: T-F21
lane: frontend
sprint: sprint-14
agent: fenn
seat: checker
kind: review
role: review
rigor: full
model: opus
branch: t/F21-release-live
checkout: detached
after: [agent-fantem-t-f21-build]
depends_on: [T-F14, T-F24]
report: docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f21-review-completion.md
---


# T-F21 · review · Fenn: Gates, findings and the release, live

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-14 · Step 1 |
| Ticket | T-F21 · rigor full |
| Dispatch | review · Fenn (checker) · model opus |
| Works on | a detached checkout of `t/F21-release-live`'s head |
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
8. `apps/web/control-room/src/sources/release.js`: the source this ticket switches to the API (T-F14)
9. `docs/ui-reference/control-room-handoff/screens.md`: Gates, Findings, Release, Receipt: routes and states
10. `apps/web/test/release-live/**`: the locked acceptance tests: they define done
11. `apps/web/e2e/release-live/**`: the locked acceptance tests: they define done
12. `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f21-build-completion.md`: the builder's completion report
13. `docs/review/security-checklist.md`: full rigor: work through it item by item
14. `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f21-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** You see each gate and its integration commit, confirm, dismiss or accept findings with a reason, check the receipt, and release the exact commit it names, all from the API.

**Refs:**
- CR-W31 part (c), T-F24: routes 21, 29, 30, 55, 56, 58 to 61, 107
- handoff port order step 7 (Release)
- C4: gates and receipts
- CR-W21 (the receipt's proof check)

**Merged before this starts:** T-F14, T-F24

**Notes from the lead:**
- Reads: 21, 55 (gate evaluations and integration commits), 56, 58 (findings, filtered by state, route and module run), 61 (the receipt, ?verify=1 rechecks the hash), 107 (one proof file, at most 2 MB, shown as text or a download, never run). Writes: 59 (confirm or dismiss, with a reason), 60 (accept, with a reason; caps the verdict at pass), 29 (pass approval with the receipt hash), 30 (release with the receipt hash and, for a pass, the pass approval id), each with an Idempotency-Key
- Release sends only the receipt hash the page read; a 409 (a newer receipt) shows its sentence and rereads 61. Approving a pass or a release never asks for a password (E15)
- Gates, Findings and Release render through operations.js and OpsPages.jsx, which this ticket doesn't change. If a page needs a change, stop with out-of-scope
- Review, full rigor (G7): Fenn, then the second review against docs/review/security-checklist.md, then Javaris merges. One round (CR-42). The full-diff rule applies as in the other tickets: anything outside this build's may-change list, its locked tests, its reports or locks.md is a P1
- Size: a full session (#45). Run only this ticket's specs while you work

## 4. Tasks

### T-F21-01: check: e2e (behaviour): Gates lists route 55's evaluations, and opening an integration commit reads route 56

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F21-02: check: e2e (behaviour): confirming, dismissing and accepting a finding call 59 and 60 with the reason typed; accepting caps the shown verdict at pass

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F21-03: check: e2e (behaviour): the receipt reads route 61, Check calls ?verify=1 and shows the result; a proof file reads 107 and never runs

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F21-04: check: e2e (behaviour): Release calls route 30 with the receipt hash read from 61 (and the pass approval id from 29 for a pass), no password field shows, and a 409 shows its sentence and rereads the receipt

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F21-05: check: e2e (behaviour): loading, empty (no findings), error (404, 422 with the allowed moves, 500, offline) render with their words

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F21-06: check: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F21-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).
- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f21-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-14/findings/t-f21-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/sources/release.js`
- `apps/web/control-room/src/pages/operations/ReceiptPage.jsx`
- `apps/web/control-room/changes/T-F21.md`

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
| T-F20 | builds | `apps/web/control-room/src/sources/build.js`, `apps/web/control-room/src/pages/live/**`, `apps/web/control-room/src/pages/operations/ModulePage.jsx`, `apps/web/control-room/src/lib/live.js`, `apps/web/control-room/changes/T-F20.md` |
| T-F20 | tests | `apps/web/test/build-live/**`, `apps/web/e2e/build-live/**` |

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

**Your report:** `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f21-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
verdict: pass | changes | block
ticket: T-F21
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F21, "Gates, findings and the release, live": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f21-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f21-review-completion.md`, left uncommitted. Don't push.
