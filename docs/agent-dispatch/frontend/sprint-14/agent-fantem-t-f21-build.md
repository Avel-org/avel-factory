---
doc: agent-fantem-t-f21-build
ticket: T-F21
lane: frontend
sprint: sprint-14
agent: fantem
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/F21-release-live
checkout: branch
after: [agent-fenn-t-f21-test-e2e]
depends_on: [T-F14, T-F24]
report: docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f21-build-completion.md
---


# T-F21 · build · Fantem: Gates, findings and the release, live

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-14 · Step 1 |
| Ticket | T-F21 · rigor full |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F21-release-live` |
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
8. `apps/web/control-room/src/sources/release.js`: the source this ticket switches to the API (T-F14)
9. `docs/ui-reference/control-room-handoff/screens.md`: Gates, Findings, Release, Receipt: routes and states
10. `apps/web/test/release-live/**`: the locked acceptance tests: they define done
11. `apps/web/e2e/release-live/**`: the locked acceptance tests: they define done
12. `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f21-build.md`: this document: follow it exactly

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

### T-F21-01: make it true: e2e (behaviour): Gates lists route 55's evaluations, and opening an integration commit reads route 56

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F21-02: make it true: e2e (behaviour): confirming, dismissing and accepting a finding call 59 and 60 with the reason typed; accepting caps the shown verdict at pass

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F21-03: make it true: e2e (behaviour): the receipt reads route 61, Check calls ?verify=1 and shows the result; a proof file reads 107 and never runs

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F21-04: make it true: e2e (behaviour): Release calls route 30 with the receipt hash read from 61 (and the pass approval id from 29 for a pass), no password field shows, and a 409 shows its sentence and rereads the receipt

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F21-05: make it true: e2e (behaviour): loading, empty (no findings), error (404, 422 with the allowed moves, 500, offline) render with their words

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F21-06: make it true: e2e (guard): every state passes WCAG 2.2 AA at 390 and 1280, light and night; each route at most 150 KB; no '$' (E15)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/control-room/src/sources/release.js`
- `apps/web/control-room/src/pages/operations/ReceiptPage.jsx`
- `apps/web/control-room/changes/T-F21.md`
- `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f21-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/release-live/**`
- `apps/web/e2e/release-live/**`

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

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F21`).
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

**Your report:** `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f21-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F21
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F21, "Gates, findings and the release, live": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f21-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F21-release-live`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-14/agent-fantem-t-f21-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/F21-release-live`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
