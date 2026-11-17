---
doc: agent-fenn-t-f3-review
ticket: T-F3
lane: frontend
sprint: sprint-03
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F3-shell-sheet
checkout: detached
after: [agent-fantem-t-f3-build]
depends_on: [T-F2]
report: docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-review-completion.md
---


# T-F3 · review · Fenn: The shell's sheet: the menu button and the More tab

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-F3 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F3-shell-sheet`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

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
13. `apps/web/test/shell-sheet/**`: the locked acceptance tests: they define done
14. `apps/web/e2e/shell-sheet/**`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f3-build-completion.md`: the builder's completion report
16. `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-review.md`: this document: follow it exactly

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
- If a locked T-F1 or T-F2 test conflicts with shell-layout.md's sheet or More (for example a test that fixes the tab bar to one tab), stop with test-dispute (F2); don't work around it

## 4. Tasks

### T-F3-01: check: unit: AppShell in renderToString draws the sheet closed: role=dialog with aria-modal and aria-label 'Navigation', inert, the brand, nav "Main" and the 'Close navigation' button

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-02: check: unit: the menu button 'Open navigation' and the More tab are buttons with aria-expanded="false" and aria-controls naming the sheet; More comes after the route tabs

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-03: check: unit: kit.css, read as text: the menu button shows only from 761 to 1023px, the sheet and scrim have a reduced-motion rule, and no :hover outside @media (hover: hover) and (pointer: fine)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-04: check: e2e: at 900x800, 'Open navigation' opens the sheet: aria-expanded true, the dialog visible, focus on 'Close navigation', and Tab and Shift+Tab stay inside

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-05: check: e2e: at 900x800, each of Escape, a click on the scrim, 'Close navigation' and the Decisions link closes the sheet, sets aria-expanded false and returns focus to 'Open navigation'

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-06: check: e2e: at 390x844, More opens the same sheet, Escape closes it, and focus returns to More; More is at least 44px tall

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-07: check: e2e: at 1280x800 there is no menu button and no More, and the rail is unchanged

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-08: check: e2e: WCAG 2.2 AA with no violation at 900 and 390 with the sheet open and closed, in light and night, and no '$' in the page's text

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F3-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-03/findings/t-f3-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/src/kit/**`

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
pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F3
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F3, "The shell's sheet: the menu button and the More tab": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f3-review-completion.md`, left uncommitted. Don't push.
