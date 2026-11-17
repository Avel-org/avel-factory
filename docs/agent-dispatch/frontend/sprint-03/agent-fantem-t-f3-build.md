---
doc: agent-fantem-t-f3-build
ticket: T-F3
lane: frontend
sprint: sprint-03
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/F3-shell-sheet
checkout: branch
after: [agent-fenn-t-f3-test-e2e]
depends_on: [T-F2]
report: docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f3-build-completion.md
---


# T-F3 · build · Fantem: The shell's sheet: the menu button and the More tab

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-F3 · rigor standard |
| Dispatch | build · Fantem (builder) · model sonnet |
| Works on | `t/F3-shell-sheet` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
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
15. `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f3-build.md`: this document: follow it exactly

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

### T-F3-01: make it true: unit: AppShell in renderToString draws the sheet closed: role=dialog with aria-modal and aria-label 'Navigation', inert, the brand, nav "Main" and the 'Close navigation' button

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F3-02: make it true: unit: the menu button 'Open navigation' and the More tab are buttons with aria-expanded="false" and aria-controls naming the sheet; More comes after the route tabs

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F3-03: make it true: unit: kit.css, read as text: the menu button shows only from 761 to 1023px, the sheet and scrim have a reduced-motion rule, and no :hover outside @media (hover: hover) and (pointer: fine)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F3-04: make it true: e2e: at 900x800, 'Open navigation' opens the sheet: aria-expanded true, the dialog visible, focus on 'Close navigation', and Tab and Shift+Tab stay inside

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F3-05: make it true: e2e: at 900x800, each of Escape, a click on the scrim, 'Close navigation' and the Decisions link closes the sheet, sets aria-expanded false and returns focus to 'Open navigation'

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F3-06: make it true: e2e: at 390x844, More opens the same sheet, Escape closes it, and focus returns to More; More is at least 44px tall

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F3-07: make it true: e2e: at 1280x800 there is no menu button and no More, and the rail is unchanged

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F3-08: make it true: e2e: WCAG 2.2 AA with no violation at 900 and 390 with the sheet open and closed, in light and night, and no '$' in the page's text

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/src/kit/**`
- `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f3-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/shell-sheet/**`
- `apps/web/e2e/shell-sheet/**`

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

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F3`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

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

**Your report:** `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f3-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F3
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F3, "The shell's sheet: the menu button and the More tab": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f3-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F3-shell-sheet`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f3-build-completion.md`, committed to the branch. Don't push.
