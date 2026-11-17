---
doc: agent-fenn-t-f4-test-e2e
ticket: T-F4
lane: frontend
sprint: sprint-04
agent: fenn
seat: checker
kind: tests
role: test-e2e
rigor: standard
model: sonnet
branch: t/F4-shell-rail
checkout: branch
after: []
depends_on: [T-F3]
report: docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f4-test-e2e-completion.md
---


# T-F4 · tests · Fenn: The shell's rail: collapse with its button or ⌘B, remembered in avel-rail, and the Decisions badge

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-F4 · rigor standard |
| Dispatch | test-e2e · Fenn (checker) · model sonnet |
| Works on | `t/F4-shell-rail` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-04/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/shell-layout.md`: the shell's UI contract, rev 2: data-rail, the collapse, the badges and the cookies
6. `docs/design/AVEL Shell Layout brief v1.9.md`: the 64px icon rail, the tooltip, the remembered choice, the badge from route 52
7. `docs/ui-reference/control-room-handoff/README.md`: port step 2 and flow-keyboard; focus, motion and targets
8. `docs/ui-contracts/shell-layout.md`: section 1: data-rail="collapsed" on the AppShell element in the server's HTML; section 2: Collapsed (the DL's .lib-rail[data-collapsed] rules, ⌘B and Ctrl+B, the toggle, the 240ms transition only on a toggle, the tooltip from the item's rect), Counts (Decisions: route 52's loaded rows, then + while nextCursor isn't null, labelled '{text} waiting'; no badge for 0, no data or an error), _shell's loader and cookies; section 3: AppShellProps' collapsed and onCollapsedChange; S10
9. `docs/design/AVEL Shell Layout brief v1.9.md`: the 64px icon rail, the tooltip to the right, the remembered choice, the amber count badge
10. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: the toggle (.lib-rail-toggle: aria-label 'Collapse sidebar' or 'Expand sidebar', aria-expanded, the panel-left icon), .lib-rail[data-collapsed], .lib-rail-tip and .lib-tip, .lib-nav-badge and the tab badge (final cascade) for kit.css, and the panel-left Lucide node
11. `apps/web/src/kit/AppShell.tsx`: AppShell after T-F3, which gains collapsed, onCollapsedChange, the toggle, the tooltip and badges
12. `apps/web/src/routes/_shell.tsx`: the layout route, whose loader gains the avel-rail cookie and route 52
13. `apps/web/src/home/load-home.ts`: loadHome(client): the badge's count and more come from it, unchanged
14. `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f4-test-e2e.md`: this document: follow it exactly

## 3. Domain

**Goal:** On a desk the sidebar folds to a 64px icon rail with its button, ⌘B or Ctrl+B, shows each name in a tooltip, and stays folded after a reload; the Decisions entry and tab show how many decisions are waiting.

**Refs:**
- shell-layout.md rev 2, section 1 (data-rail on the AppShell element) and section 2 (Collapsed, the counts, _shell's loader and its cookies)
- control-room-handoff README, port step 2, flow-keyboard

**Merged before this starts:** T-F3

**Notes from the lead:**
- No new dependency. The panel-left icon comes from the DL's Lucide nodes into Icon.tsx, as before. The badge reuses loadHome and createClient as they are: src/home and src/data don't change
- The seams the tests use: AppShell gains collapsed: boolean and onCollapsedChange(next: boolean) (section 3), and ShellItem's badge?: { text, label } and the tabs' badge. apps/web/src/modules/system/badge.ts exports decisionsBadge(state: HomeState): { text, label } | undefined: ready gives text '{count}' or '{count}+' with label '{text} waiting'; empty and error give undefined
- _shell's loader (ssr: true) reads the avel-rail cookie on the server (collapsed, else open) and awaits route 52 through loadHome. A failure gives no badge and is swallowed: the shell still draws. Route 52 is read by _shell and by / on the same load; that's accepted until the data core's cache
- In the server's HTML, the AppShell element has data-rail="collapsed" when avel-rail=collapsed, and the rail draws collapsed then, so a reload paints it folded with nothing moving. The client writes avel-rail on each toggle with path=/; max-age=31536000; samesite=lax
- The toggle: beside the brand in the rail (1024px and wider), .lib-rail-toggle with aria-label 'Collapse sidebar' when open and 'Expand sidebar' when collapsed, aria-expanded true when open, and the panel-left icon. ⌘B on macOS and Ctrl+B elsewhere toggle it too, at 1024px and wider, and not while a text field has focus. No other shortcut (S14). The sheet keeps its 'Close navigation' button in the toggle's place
- Collapsed: icons only (64px rail), each row's name in .lib-rail-tip to the right, positioned from that row's rect when it's hovered or focused, and gone on leave or blur. The row keeps its accessible name. The 240ms grid transition runs only on a toggle, never on load, and not under prefers-reduced-motion
- The Decisions badge on its nav row (.lib-nav-badge) and on its tab: the text from decisionsBadge, the label '{text} waiting' on the nav row, and on the tab the sr-only word 'waiting' after the number (S10). No badge for 0, no data or an error
- If a locked T-F1, T-F2 or T-F3 test conflicts with shell-layout.md here (for example one that requires no data-rail, or a badge-free row), stop with test-dispute (F2); don't work around it

## 4. Tasks

### T-F4-01: a failing test for: unit: decisionsBadge gives '{count}' and '{count}+' with the label '{text} waiting' for ready, and nothing for empty or error

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-02: a failing test for: unit: AppShell in renderToString with collapsed = true has data-rail="collapsed" and the toggle 'Expand sidebar' with aria-expanded="false"; with collapsed = false, no data-rail and 'Collapse sidebar' with aria-expanded="true"

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-03: a failing test for: unit: AppShell draws a nav badge's text with its label, and a tab badge with the sr-only 'waiting'; no badge element when an item has none

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-04: a failing test for: unit: kit.css, read as text: the collapsed rail at 64px under [data-rail="collapsed"], the transition only under a toggling state and off under prefers-reduced-motion, and no :hover outside @media (hover: hover) and (pointer: fine)

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-05: a failing test for: e2e: at 1280x800 with no cookie, the rail is open; the toggle collapses it, writes avel-rail=collapsed, and after a reload the server's HTML has data-rail="collapsed" and the rail's and h1's boxes don't move at hydration

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-06: a failing test for: e2e: at 1280x800, Control+B (and Meta+B) toggles the rail and its aria-expanded, but not while focus is in a text field; the key does nothing at 900x800

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-07: a failing test for: e2e: collapsed at 1280x800, hovering and focusing the Decisions row shows a tooltip reading 'Decisions' beside it, and leaving or blurring hides it

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-08: a failing test for: e2e: under AVEL_API=mock the Decisions row and tab show the world's count in the server's HTML, with the row's accessible text '{count} waiting'; on the dev server with no mock, the shell draws with no badge and the page shows its error state

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F4-09: a failing test for: e2e: WCAG 2.2 AA with no violation at 1280 with the rail open and collapsed, and at 390 with the badge, in light and night, and no '$' in the page's text

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `apps/web/test/shell-rail/**`
- `apps/web/e2e/shell-rail/**`
- `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f4-test-e2e-completion.md` (your report)

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/styles/tokens.css`
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
- `apps/web/test/shell-sheet/**`
- `apps/web/e2e/shell-sheet/**`
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

**Your report:** `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f4-test-e2e-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F4
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F4: <test paths> @ <your last commit>`

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F4, "The shell's rail: collapse with its button or ⌘B, remembered in avel-rail, and the Decisions badge": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f4-test-e2e.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F4-shell-rail`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f4-test-e2e-completion.md`, committed to the branch. Don't push.
