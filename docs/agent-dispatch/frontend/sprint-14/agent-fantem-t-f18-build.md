---
doc: agent-fantem-t-f18-build
ticket: T-F18
lane: frontend
sprint: sprint-14
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: opus
branch: t/F18-canon-live
checkout: branch
after: [agent-fenn-t-f18-test-e2e]
depends_on: [T-F14, T-F23, T-F24, T-F25]
report: docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f18-build-completion.md
---


# T-F18 · build · Fantem: Canon onboarding live

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-14 · Step 1 |
| Ticket | T-F18 · rigor standard |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F18-canon-live` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
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
13. `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f18-build.md`: this document: follow it exactly

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

### T-F18-01: make it true: e2e (behaviour): sending a message calls route 34, and Canon's reply streams in chunk by chunk; a reload while it streams re-attaches through route 105

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F18-02: make it true: e2e (behaviour): a reply holding <b>, <script> and a javascript: link renders as its literal text, and nothing executes

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F18-03: make it true: e2e (behaviour): answering a question with an option and with other calls route 44, and the deck moves to the next question

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F18-04: make it true: e2e (behaviour): approving checkpoint 0.1 calls route 40 and the journey shows 0.2; asking for changes and reopening call 41 and 42; a stale rowVersion shows the 409 sentence

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F18-05: make it true: e2e (behaviour): loading, empty (a fresh draft), error (500, offline, STREAM_GONE) render with their words

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F18-06: make it true: e2e (behaviour, CR-W32): on a fresh draft, sending your first message starts the interview: route 34 is called, the mission shows as onboarding, and checkpoint 0.1 appears, read again from route 21

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F18-07: make it true: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/control-room/src/sources/canon.js`
- `apps/web/control-room/src/app/canon.js`
- `apps/web/control-room/src/pages/project/CanonPage.jsx`
- `apps/web/control-room/src/pages/project/CanonDock.jsx`
- `apps/web/control-room/changes/T-F18.md`
- `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f18-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/canon-live/**`
- `apps/web/e2e/canon-live/**`

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

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F18`).
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

**Your report:** `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f18-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F18
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F18, "Canon onboarding live": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f18-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F18-canon-live`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f18-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/F18-canon-live`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
