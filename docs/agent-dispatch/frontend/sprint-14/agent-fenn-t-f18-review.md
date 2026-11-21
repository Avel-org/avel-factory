---
doc: agent-fenn-t-f18-review
ticket: T-F18
lane: frontend
sprint: sprint-14
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F18-canon-live
checkout: detached
after: [agent-fantem-t-f18-build]
depends_on: [T-F14, T-F23, T-F24, T-F25]
report: docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f18-review-completion.md
---


# T-F18 · review · Fenn: Canon onboarding live

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-14 · Step 1 |
| Ticket | T-F18 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F18-canon-live`'s head |
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
8. `apps/web/control-room/src/sources/canon.js`: the source this ticket switches to the API (T-F14)
9. `apps/web/control-room/src/app/canon.js`: the onboarding journey, checkpoints and question deck
10. `docs/ui-reference/control-room-handoff/screens.md`: Onboarding: routes and states
11. `apps/web/test/canon-live/**`: the locked acceptance tests: they define done
12. `apps/web/e2e/canon-live/**`: the locked acceptance tests: they define done
13. `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f18-build-completion.md`: the builder's completion report
14. `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f18-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** You talk to Canon and its reply streams in as plain text, you answer the question deck, and you edit, generate, approve, ask for changes on or reopen each checkpoint, all from the API.

**Refs:**
- CR-W31 parts (b) and (c), T-F23 and T-F24: routes 33, 34, 105, 38 to 43
- handoff port order step 6 (Canon onboarding)
- CR-W19 (streaming replies, the question deck)
- J3 and E15 (untrusted text renders as text)

**Merged before this starts:** T-F14, T-F23, T-F24, T-F25

**Notes from the lead:**
- Reads: 21 (the onboarding journey and checkpoints), 33 (the chat history), 105 (re-attach to a reply still streaming; STREAM_GONE once it's finished). Writes: 34 (your turn; Canon's CanonStreamChunk reply renders as it arrives, and leaving the page aborts the request), 44 (answer: an option, or other in your own words), 38 to 42 (edit a section, generate, approve, ask for changes, reopen), 43 (confirm or reject a fact), each with an Idempotency-Key and the rowVersion
- Canon's text, and anything a client wrote, renders as plain text: markdown with HTML off, links shown as text unless they're http(s), and nothing executes
- Voice (106) and uploads (35 to 37, CR-34) keep the sample world
- CR-W32 (proposed Nov 21): a draft mission's first turn on route 34 starts onboarding (T-F24 builds it in the mock). Onboarding on a fresh draft is the empty state with the composer open, and the first send starts the interview. If Javaris doesn't accept CR-W32, this note and its behaviour come out before the tests start
- Review: one round (CR-42). The full-diff rule: every file in `git diff main...HEAD --name-only` is in this build's may-change list, this ticket's locked test files, its own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1
- Size: a full session (#45). Run only this ticket's specs while you work

## 4. Tasks

### T-F18-01: check: e2e (behaviour): sending a message calls route 34, and Canon's reply streams in chunk by chunk; a reload while it streams re-attaches through route 105

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F18-02: check: e2e (behaviour): a reply holding <b>, <script> and a javascript: link renders as its literal text, and nothing executes

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F18-03: check: e2e (behaviour): answering a question with an option and with other calls route 44, and the deck moves to the next question

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F18-04: check: e2e (behaviour): approving checkpoint 0.1 calls route 40 and the journey shows 0.2; asking for changes and reopening call 41 and 42; a stale rowVersion shows the 409 sentence

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F18-05: check: e2e (behaviour): loading, empty (a fresh draft), error (500, offline, STREAM_GONE) render with their words

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F18-06: check: e2e (behaviour, CR-W32): on a fresh draft, sending your first message starts the interview: route 34 is called, the mission shows as onboarding, and checkpoint 0.1 appears, read again from route 21

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F18-07: check: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F18-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f18-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-14/findings/t-f18-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/sources/canon.js`
- `apps/web/control-room/src/app/canon.js`
- `apps/web/control-room/src/pages/project/CanonPage.jsx`
- `apps/web/control-room/src/pages/project/CanonDock.jsx`
- `apps/web/control-room/changes/T-F18.md`

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
| T-F19 | builds | `apps/web/control-room/src/sources/plan.js`, `apps/web/control-room/changes/T-F19.md` |
| T-F19 | tests | `apps/web/test/plan-dispatch-live/**`, `apps/web/e2e/plan-dispatch-live/**` |
| T-F20 | builds | `apps/web/control-room/src/sources/build.js`, `apps/web/control-room/src/pages/live/**`, `apps/web/control-room/src/pages/operations/ModulePage.jsx`, `apps/web/control-room/src/lib/live.js`, `apps/web/control-room/changes/T-F20.md` |
| T-F20 | tests | `apps/web/test/build-live/**`, `apps/web/e2e/build-live/**` |
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

**Your report:** `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f18-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
verdict: pass | changes | block
ticket: T-F18
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F18, "Canon onboarding live": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f18-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-14/agent-fenn-t-f18-review-completion.md`, left uncommitted. Don't push.
