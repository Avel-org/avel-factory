---
doc: agent-fenn-t-f3-test-e2e
ticket: T-F3
lane: frontend
sprint: sprint-03
agent: fenn
seat: checker
kind: tests
role: test-e2e
rigor: standard
model: sonnet
branch: t/F3-shell-sheet
checkout: branch
after: []
depends_on: [T-F2]
report: docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-test-e2e-completion.md
---


# T-F3 · tests · Fenn: The shell's sheet: the menu button and the More tab

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-F3 · rigor standard |
| Dispatch | test-e2e · Fenn (checker) · model sonnet |
| Works on | `t/F3-shell-sheet` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-03/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/shell-layout.md`: the shell's UI contract, rev 2: section 1's frame table, the sheet; S17
6. `docs/design/AVEL Shell Layout brief v1.9.md`: the sheet: from the left, 320px or 88%, over a dimmed page, with a close button
7. `docs/ui-reference/control-room-handoff/README.md`: port step 2 and flow-sheets; focus, motion and phone targets
8. `docs/ui-contracts/shell-layout.md`: section 1: the frame table (menu button 761 to 1023px, More at 760px and narrower), the sheet's rules; section 2: More is a button that opens the sheet
9. `docs/design/AVEL Shell Layout brief v1.9.md`: the sheet from the left, 320px or 88% of a narrow screen, over a dimmed page, with a close button
10. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: the DL's sheet, scrim, .lib-rail-close and menu button rules (final cascade) for kit.css, and the Lucide nodes for menu, x and more-horizontal in its icon registry
11. `docs/ui-reference/control-room-handoff/README.md`: focus rings for the keyboard only, motion off under reduced motion, 44px primary targets
12. `apps/web/src/kit/AppShell.tsx`: T-F2's AppShell, which gains the menu button, More and the sheet
13. `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-test-e2e.md`: this document: follow it exactly

## 3. Domain

**Goal:** On a tablet the header's menu button, and on a phone the More tab, open the whole sidebar as a sheet over a dimmed page, which closes with Escape, the scrim, its close button or any link, and hands focus back.

**Refs:**
- shell-layout.md rev 2, section 1 (the frame table and the sheet) and section 2 (the tab bar's More); S17
- control-room-handoff README, port step 2, flow-sheets

**Merged before this starts:** T-F2

**Notes from the lead:**
- No new dependency, and no dialog library: the sheet, its focus trap and its focus return are the kit's own code (useDialogFocus in apps/web/src/kit). New icons (menu, x, more-horizontal) come from the DL's Lucide nodes into Icon.tsx, as T-F2's did
- The seams the tests use: apps/web/src/kit/AppShell.tsx draws the sheet as a dialog with aria-modal="true" and aria-label="Navigation", inert and hidden while closed. The sheet holds the same brand and nav "Main" as the rail, with .lib-rail-close's 'Close navigation' button where the collapse toggle would be
- The menu button: in the header, labelled 'Open navigation', with aria-expanded and aria-controls naming the sheet; shown by kit.css alone from 761 to 1023px. Not drawn in the rail's place on a desk
- More: the tab bar's last tab, a button (not a link) labelled 'More', with aria-expanded, at least 52px tall like the other tabs. It opens the same sheet. S17 is now met for More, so the tab bar is the route tabs then More
- Opening focuses the sheet's close button and traps Tab and Shift+Tab inside. Escape, a click on the scrim, the close button and any link in the sheet close it, and focus returns to whichever button opened it. The page behind is inert while it's open. No scroll jump on open or close
- Motion: the sheet slides in from the left and the scrim fades, with the DL's durations and easing; under prefers-reduced-motion neither moves. Nothing in the server's HTML changes, so nothing moves at hydration
- The tests check what this ticket draws, never the absence of what T-F4 adds (the collapse toggle, data-rail, badges) or of routes later tickets add. Count only what this ticket owns. A test pinning their absence would need a test-dispute on each later ticket
- If a locked T-F1 or T-F2 test conflicts with shell-layout.md's sheet or More (for example a test that fixes the tab bar to one tab), stop with test-dispute (F2); don't work around it

## 4. Tasks

### T-F3-01: a failing test for: unit: AppShell in renderToString draws the sheet closed: role=dialog with aria-modal and aria-label 'Navigation', inert, the brand, nav "Main" and the 'Close navigation' button

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F3-02: a failing test for: unit: the menu button 'Open navigation' and the More tab are buttons with aria-expanded="false" and aria-controls naming the sheet; More comes after the route tabs

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F3-03: a failing test for: unit: kit.css, read as text: the menu button shows only from 761 to 1023px, the sheet and scrim have a reduced-motion rule, and no :hover outside @media (hover: hover) and (pointer: fine)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F3-04: a failing test for: e2e: at 900x800, 'Open navigation' opens the sheet: aria-expanded true, the dialog visible, focus on 'Close navigation', and Tab and Shift+Tab stay inside

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F3-05: a failing test for: e2e: at 900x800, each of Escape, a click on the scrim, 'Close navigation' and the Decisions link closes the sheet, sets aria-expanded false and returns focus to 'Open navigation'

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F3-06: a failing test for: e2e: at 390x844, More opens the same sheet, Escape closes it, and focus returns to More; More is at least 44px tall

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F3-07: a failing test for: e2e: at 1280x800 there is no menu button and no More, and the rail is unchanged

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F3-08: a failing test for: e2e: WCAG 2.2 AA with no violation at 900 and 390 with the sheet open and closed, in light and night, and no '$' in the page's text

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `apps/web/test/shell-sheet/**`
- `apps/web/e2e/shell-sheet/**`
- `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-test-e2e-completion.md` (your report)

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/styles/tokens.css`
- `apps/web/src/routes/**`
- `apps/web/src/modules/**`
- `apps/web/src/home/**`
- `apps/web/src/data/**`
- `apps/web/test/foundation.test.ts`
- `apps/web/test/gitignore.test.ts`
- `apps/web/test/home-loader.test.ts`
- `apps/web/test/home-loader-states.test.ts`
- `apps/web/test/home-view.test.ts`
- `apps/web/test/hygiene.test.ts`
- `apps/web/e2e/budget.spec.ts`
- `apps/web/e2e/home.spec.ts`
- `apps/web/e2e/states.spec.ts`
- `apps/web/e2e/support/page.ts`
- `apps/web/e2e/support/ports.ts`
- `apps/web/vitest.config.ts`
- `apps/web/playwright.config.ts`
- `apps/web/test/shell/**`
- `apps/web/e2e/shell/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

## 6. Execution protocol: tests

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Write one test per task in Part 4, in the test paths only. Real Postgres; `TestClock` and the Clock, Ids and Random services; never sleep on the wall clock (E10, F4).
5. Cover every state the screen names (loading, empty, error, ready) against `contract-mock`. Every end-to-end test runs the WCAG 2.2 AA check and records a screenshot (E17, F6).
6. No `.skip`, `.only` or `todo` (F3).
7. Run them and confirm **every one fails**, for the reason the behaviour isn't built yet. A test that passes now is your bug (B2).
8. Commit the tests and your report to the branch. The lead reviews them and writes the lock line.

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
pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-test-e2e-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F3
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F3: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F3, "The shell's sheet: the menu button and the More tab": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-test-e2e.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F3-shell-sheet`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-test-e2e-completion.md`, committed to the branch. Don't push.
