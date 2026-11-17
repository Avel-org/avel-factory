# FENN: decisions test-e2e

Frontend sprint-01 · step 1 · The minimal approval page on the contract mock, with the thin W0 slice under it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** FENN, as `.claude/agents/fenn.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-fenn-decisions-test-e2e` (test), module `decisions`.
- **Your branch:** `frontend/sprint-01/agent-fenn-decisions-test-e2e-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-01-agent-fenn-decisions-test-e2e-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** first; after `agent-fenn-w0-data-test-unit` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/fenn.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
4. `docs/design/CR-W2 Pending decisions.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
9. `docs/ui-contracts/decisions-approval-page.md`: sections 5 and 7 (UC-29 to UC-31), section 2's dev-only bump and reset paths, section 3's one data path for development, and D11 (the phone actions)
10. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-03-e2e-click-before-hydration.md`: a2: why the first click is lost (on main at 3d3ccfc)
11. `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-04-uc31-reads-confirm-during-dialog-animation.md`: the UC-31 attempt: the confirm button read during av-dialog-in's scale (revision 13)
12. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-e2e-zero-01-phone-tests-flake-after-dev-server-start.md`: the flake attempt (a5): 4 of 14 runs on main fail, all on the phone project, with the failing lines and outputs
13. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-fenn-01-hydrated-marker-precedes-phone-layout.md`: a6: your a5 cause, filed for Leon, and INT's ruling (Leon's a3 moves the marker; you run FENN-04 again)
14. `docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-01-desk-to-phone-switch-at-hydration.md`: a7: the shift UC-32 checks for, with its sources
15. `docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e.md`: this task doc: follow it exactly

## 3. Domain

The approval page end to end with Playwright on AVEL_API=mock, phone and desk: UC-29 to UC-31.

**The rest of this sprint:**

- `agent-brennan-approvals-uic-review-spec`: Review the UI contract docs/ui-contracts/decisions-approval-page.md, as at your start commit, against CR-W2, the Frontend Map v0.6, the design library and backend m1's packages/contract, before anything is built on it.
- `agent-nemi-w0-app-build`: apps/web as @avel/web: the TanStack Start app config, its dependencies, the token stylesheet from the design library, and the root route shell with the theme cookie (UI contract section 6). No screens.
- `agent-nemi-w0-fonts-build`: The font preloads in the root route's head, and from a2 the size-matched font fallbacks (UI contract section 6; Frontend Map v0.6 line 289).
- `agent-zero-w0-fonts-review-frontend`: Review the w0-fonts diff against UI contract section 6's font bullets.
- `agent-nemi-w0-split-build`: The route split: @avel/web's package.json declares "sideEffects": ["**/*.css"], so TanStack Start's code splitter puts each route's screen in its own chunk (UI contract section 5, 'The route split'; section 6).
- `agent-zero-w0-split-review-frontend`: Review the w0-split diff against UI contract sections 5 ('The route split') and 6.
- `agent-zane-w0-split-review-security`: Review w0-split a2's new build dependencies (@rolldown/plugin-babel, @babel/core, babel-plugin-react-compiler) and its server-function stub: the stub never reaches the server build, and a server function can't be added without the build failing.
- `agent-zero-w0-app-review-frontend`: Review apps/web's config, tokens and shell against UI contract section 6 and the design library.
- `agent-zane-w0-app-review-security`: Review the new dependencies apps/web adds (UI contract section 6): each is needed, pinned, maintained and licensed.
- `agent-brennan-w0-app-review-spec`: Review apps/web's config, tokens and shell against UI contract section 6.
- `agent-fenn-w0-data-test-unit`: The web's test config, and the data core's and the contract mock's tests: UC-01 to UC-07.
- `agent-ghost-w0-data-build`: The web's data core (apps/web/src/data, apps/web/src/lib, apps/web/src/router.tsx) and the contract mock @avel/contract-mock for routes 52 to 54, exactly as UI contract sections 1 to 3 name them.
- `agent-zero-w0-data-review-frontend`: Review the data core and the contract mock against UI contract sections 1 to 3.
- `agent-brennan-w0-data-review-spec`: Review the contract mock and the data core against CR-W2 and UI contract sections 1 to 3.
- `agent-zane-w0-data-review-security`: Review how the data core handles Idempotency-Key and X-Request-Id (the fetch wrapper; the SSR client forwards only the request ID), and that the mock and the dev-only paths never reach a production build.
- `agent-fenn-w0-kit-test-unit`: The kit's component tests: UC-08 to UC-10.
- `agent-fantem-w0-kit-build`: The kit components the page needs, ported from the design library with UI contract section 4's changes: Button, Tag, Icon, StatusGlyph, HashChip, ReasonDialog, ErrorPanel, WidgetState and DecisionTag.
- `agent-zero-w0-kit-review-frontend`: Review the kit against UI contract section 4 and the design library.
- `agent-brennan-w0-kit-review-spec`: Review the kit against UI contract section 4 and the design library.
- `agent-fenn-decisions-test-unit`: The approval page's screen tests on the contract mock: UC-11 to UC-28.
- `agent-leon-decisions-build`: The decisions module and its route: the approval page at /, exactly as UI contract section 5 gives it.
- `agent-zero-decisions-review-frontend`: Review the decisions module against UI contract section 5.
- `agent-brennan-decisions-review-spec`: Review the approval page against CR-W2 and UI contract section 5.
- `agent-leah-decisions-review-a11y-perf`: Review the approval page on a phone: labels, focus, 44px targets, the reason dialog at 390px, and that the route's JavaScript stays light.
- `agent-leah-size-study-review-a11y-perf`: A size study of /'s first-load JavaScript: measure each way of cutting it on a scratch copy of the page, and report each one's saving, cost and risk, so INT can set sprint-01's budget and choose what to build.
- `agent-leah-cls-study-review-a11y-perf`: A layout-shift study of / on a phone: measure CLS on main, find what shifts and why, and measure Nemi's held font fallbacks against it, so Zero can decide section 6's fallbacks and INT can decide NEMI-03.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### FENN-01: apps/web/playwright.config.ts (the dev server with AVEL_API=mock; 390x844 and 1280x800 projects; workers 1, each test starting with POST /__mock/reset) and UC-29 to UC-31 (P0)

- **Required:** Each carries its UC ID and fails first with an assertion
- **Verify:** `pnpm --filter @avel/web exec playwright test 2>&1 | tail -15`
- **Expected:** the UC-29 to UC-31 tests fail on assertions

### FENN-02: Attempt a2: in each of UC-29 to UC-31, after its SSR checks and before its first click, wait for [data-ui="DecisionsPage"][data-hydrated="true"] (UI contract section 7, revision 9); nothing else in the specs changes (P0)

- **Required:** The SSR assertions still run on the server's HTML before the wait; one commit, made with AVEL_LOCK_OVERRIDE set (INT's decision); each test fails first on the wait, since the marker isn't built yet
- **Verify:** `grep -c 'data-hydrated' apps/web/e2e/*.spec.ts && pnpm --filter @avel/web exec playwright test 2>&1 | tail -15 && git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** one wait per test; the tests fail waiting for the marker (or later, on an assertion); only apps/web/e2e changed

### FENN-03: The UC-31 attempt: UC-31 reads the reason dialog's sizes once its open animation has finished (section 7, UC-31; revision 13); nothing else in the specs changes (P1)

- **Required:** One commit, made with AVEL_LOCK_OVERRIDE set (INT's decision); the 44px and 16px bars unchanged; no fixed sleep and no reducedMotion; on main (Fantem's w0-kit a4 merged), UC-29 to UC-31 pass on both projects, three runs in a row
- **Verify:** `for i in 1 2 3; do pnpm --filter @avel/web exec playwright test 2>&1 | tail -6; done; git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** every test passes three times (UC-31 desk skipped as before); only apps/web/e2e changed

### FENN-04: The flake attempt: UC-29 to UC-31 pass on the phone project right after Playwright starts the dev server (decisions-e2e-zero-01); find the cause first and fix it in the tests or the Playwright config (P1)

- **Required:** One commit, made with AVEL_LOCK_OVERRIDE set (INT's decision); the cause named, with evidence; retries 0, every assertion and bar unchanged, no fixed sleep and no reducedMotion; on main, 10 runs in a row green, each starting its own dev server (reuseExistingServer stays false)
- **Verify:** `for i in $(seq 1 10); do pnpm --filter @avel/web exec playwright test 2>&1 | grep -E 'passed|failed|flaky'; done; git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** 10 lines of "5 passed" with UC-31 desk skipped as before, and no failed or flaky line; only apps/web/e2e/** or apps/web/playwright.config.ts changed

### FENN-05: The UC-32 attempt (a7): UC-32, on a phone nothing moves at hydration (section 7, revision 15); then FENN-04's bar again with UC-32 in the suite (P1)

- **Required:** One commit, made with AVEL_LOCK_OVERRIDE set (INT's decision); UC-32 fails on a scratch copy of 1dca02d and passes on main; no other test changes; retries 0, no fixed sleep, no reducedMotion; 10 runs in a row green on main, each with its own dev server
- **Verify:** `for i in $(seq 1 10); do pnpm --filter @avel/web exec playwright test 2>&1 | grep -E 'passed|failed|flaky'; done; git diff "$(git merge-base main HEAD)"..HEAD --stat`
- **Expected:** 10 lines of "6 passed" (UC-31 and UC-32 desk skipped) and no failed or flaky line; only apps/web/e2e/** changed; and UC-32's failure on the 1dca02d copy, which you report

**Notes:**

- Attempt a2 (2026-11-07, revision 9; INT's decision 2): a1 is merged and locked (locks.md, decisions-e2e). Do only the second task. It changes a locked test, which INT decided: make the commit with AVEL_LOCK_OVERRIDE="decisions-e2e a2: wait for the hydration marker before the first click (INT, revision 9)" so check_locks.py logs it as lock.overridden. After the merge, INT moves locks.md's decisions-e2e line to your commit.
- The marker is section 5's data-hydrated="true" on the DecisionsPage root, added by Leon's decisions a2. It isn't on main yet, so the specs wait and time out first. Use Playwright's own wait (for example expect(locator).toBeVisible() or toHaveAttribute), with no fixed sleep.
- The UC-31 attempt (revision 13; INT, w0-kit-zero-04): the attempt after your hydration-marker one, which INT ran as a3, so a4 unless INT says otherwise. INT dispatches it in the same round as your w0-kit tests R7 attempt. Do only the third task. It changes a locked test: make the commit with AVEL_LOCK_OVERRIDE="decisions-e2e a4: UC-31 measures the dialog once its open animation has finished (INT, revision 13)". After the merge, INT moves locks.md's decisions-e2e line.
- Wait with dialog.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished))) on the role=dialog element, after it's visible and before the first box read. No fixed sleep, and don't set reducedMotion: UC-31 checks the page as a phone user gets it. The >= 44 bars and every other assertion stay as they are.
- The flake attempt (2026-11-07; INT, decisions-e2e-zero-01): a5. Do only the fourth task. The UC-31 attempt (a4) is merged, and the e2e tests are locked at d6994d7. It changes locked files: make the commit with AVEL_LOCK_OVERRIDE="decisions-e2e a5: the phone tests pass after a fresh dev server start (INT, decisions-e2e-zero-01)". After the merge, INT moves locks.md's decisions-e2e line.
- Find the cause before you change anything, and report it with evidence: a trace, the dev server's output, or a log of what the page did. The finding has the failures so far, at decisions.spec.ts:34, :73 and :162. In each one, the hydration marker or the open dialog wasn't there when the test expected it. How to fix it is your call, within apps/web/e2e/** and apps/web/playwright.config.ts. Keep retries at 0, change no assertion or bar (the hydration wait, 44px, 16px), and add no fixed sleep and no reducedMotion. A longer timeout is acceptable only if your evidence shows the wait really is the dev server's first compile, and you say so in the report.
- If the cause is in the app (for example, the page drops the dialog or the click after data-hydrated is set), don't work around it in the tests. Stop, and report it under Deviations with the evidence. It becomes a finding for the module that owns it.
- Attempt a6 (2026-11-07; INT, decisions-fenn-01): FENN-04 again, after Leon's decisions build a3 is merged. a3 sets data-hydrated only once every tag has its final layout, which was your a5 cause. Do only the fourth task, with its bar as written: 10 runs in a row green on main, each with its own dev server. No test change is expected. If it passes unchanged, your commit is only the report, with no lock override and no lock move. If a test change still turns out to be needed, the a5 rules hold: find the cause first, and use AVEL_LOCK_OVERRIDE="decisions-e2e a6: <what> (INT, decisions-fenn-01)". If the cause is in the app again, stop and report it as in a5.
- Not in a6: the 0.13 layout shift on / (cls-study-leah-01). The desk-to-phone switch still happens in Leon's a3, only before the marker. It's INT's option (a), planned after this.
- Attempt a7 (revision 15; INT, option (a)): after Leon's decisions build a4 is merged. Do only the fifth task. It adds UC-32 to the locked suite: make the commit with AVEL_LOCK_OVERRIDE="decisions-e2e a7: UC-32, nothing moves at hydration (INT, revision 15)". After the merge, INT moves locks.md's decisions-e2e line.
- UC-32 (section 7): a second browser context with javaScriptEnabled false reads the server's HTML at 390x844, and the test's own page reads the same elements after data-hydrated. Compare boundingBox() within 1px. No fixed sleep, no reducedMotion. Show it fails first: run it against a scratch copy (git archive) of 1dca02d, before D16 and Leon's a4, and report the failing line.

## 5. Territory

**You may change only:**

- `apps/web/e2e/**`
- `apps/web/playwright.config.ts`
- `docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md`

**You may not change:**

- `apps/web/src/data/**` (GHOST)
- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/lib/**` (GHOST)
- `apps/web/src/modules/decisions/**` (LEON)
- `apps/web/src/router.tsx` (GHOST)
- `apps/web/src/routes/__root.tsx` (NEMI)
- `apps/web/src/routes/index.tsx` (LEON)
- `apps/web/src/styles/fonts/**` (NEMI)
- `apps/web/src/styles/{app.css,font-fallbacks.css}` (NEMI)
- `apps/web/src/styles/{tokens.css,base.css,fonts.css}` (NEMI)
- `apps/web/test/data/**` (FENN, locked tests)
- `apps/web/test/kit/**` (FENN, locked tests)
- `apps/web/test/modules/decisions/**` (FENN, locked tests)
- `apps/web/test/setup/**` (FENN, locked tests)
- `apps/web/vitest.config.ts` (FENN, locked tests)
- `apps/web/{package.json,vite.config.ts}` (NEMI)
- `apps/web/{tsconfig.json,.gitignore}` (NEMI)
- `packages/contract-mock/**` (GHOST)
- `packages/server/**` (the other team)
- `packages/db/**` (the other team)
- `packages/contract/**` (the other team)
- `.claude/**` and `docs/agent-dispatch/**` apart from your report (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Fail first, then lock.** A test counts only if:
1. it carries one scenario ID (the done-when number or the task ID) in its name;
2. it fails with an assertion, not a syntax, import or setup error;
3. it fails the same way 3 runs in a row.
A test that pins behaviour that already exists must pass instead, and says so in its name.

**While you work:**
- Write tests only, inside your territory. Never write application code to make a test pass or compile; stub through the test helpers instead.
- Test against real Postgres (`scripts/pg-local.sh`), never mocks of the database.
- Match the test patterns already in the repo: helpers, fixtures, naming.

**When the tests are written:** run them 3 times and keep the output. Commit them in one commit, and put its sha in your report: the operator locks your paths at that commit (`locks.md`) before the builder starts. After the lock, the paths are frozen for everyone, you included.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm --filter "@avel/web..." build
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
pnpm lint
pnpm --filter @avel/web test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# FENN: decisions test-e2e, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE / PARKED / BLOCKED | |
| FENN-02 | DONE / PARKED / BLOCKED | |
| FENN-03 | DONE / PARKED / BLOCKED | |
| FENN-04 | DONE / PARKED / BLOCKED | |
| FENN-05 | DONE / PARKED / BLOCKED | |

## Tests
Each test: its scenario ID, its file and name, and its failure line (or "pins existing behaviour: passes").

## Lock
The tests commit, and the line for `locks.md`: `- decisions · <sha> · <your test paths>`.

## Contract to files
Each contract item, done-when test or task you covered, and the files that cover it.

## Deviations
Everything you did differently from this task doc, and why.

## Limitations
What doesn't work yet, or works only in part.

## Parked chains
Each one: what you tried, three times, and why it failed.

## P0 discoveries
Anything critical outside your tasks, with the trace.

## Issues for other agents
Who needs to know what.

## Files changed
`git diff --name-only main...HEAD`.

## Verification
Each Part 7 command and its output.
```

**Then tell INT, and stop.** Send the operator one message, so the next dispatch can start:

```bash
scripts/tell.sh INT "FENN decisions test-e2e a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are FENN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-fenn-decisions-test-e2e. Branch: frontend/sprint-01/agent-fenn-decisions-test-e2e-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: apps/web/playwright.config.ts (the dev server with AVEL_API=mock; 390x844 and 1280x800 projects; workers 1, each test starting with POST /__mock/reset) and UC-29 to UC-31
- FENN-02: Attempt a2: in each of UC-29 to UC-31, after its SSR checks and before its first click, wait for [data-ui="DecisionsPage"][data-hydrated="true"] (UI contract section 7, revision 9); nothing else in the specs changes
- FENN-03: The UC-31 attempt: UC-31 reads the reason dialog's sizes once its open animation has finished (section 7, UC-31; revision 13); nothing else in the specs changes
- FENN-04: The flake attempt: UC-29 to UC-31 pass on the phone project right after Playwright starts the dev server (decisions-e2e-zero-01); find the cause first and fix it in the tests or the Playwright config
- FENN-05: The UC-32 attempt (a7): UC-32, on a phone nothing moves at hydration (section 7, revision 15); then FENN-04's bar again with UC-32 in the suite

You may change only: apps/web/e2e/**, apps/web/playwright.config.ts, docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
