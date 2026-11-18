---
doc: agent-fenn-t-f5-test-e2e
ticket: T-F5
lane: frontend
sprint: sprint-03
agent: fenn
seat: checker
kind: tests
role: test-e2e
rigor: standard
model: sonnet
branch: t/F5-sidebar-pages
checkout: branch
after: []
depends_on: [T-F2]
report: docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f5-test-e2e-completion.md
---


# T-F5 · tests · Fenn: The sidebar's main and Factory groups, with placeholder pages from the prototype

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-F5 · rigor standard |
| Dispatch | test-e2e · Fenn (checker) · model sonnet |
| Works on | `t/F5-sidebar-pages` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-03/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/shell-layout.md`: revision 3 of section 4: the prototype's groups, the placeholders, S17
6. `docs/ui-reference/control-room-prototype.html`: the prototype (a bundler page): NAV, NAV_LABEL and PAGES in its template, read as data
7. `docs/ui-contracts/shell-layout.md`: revision 3 under section 4: the groups, entries, labels, icons, placeholders and titles; section 3's ScreenHeader; S17
8. `docs/ui-reference/control-room-prototype.html`: PAGES' eyebrow, title, lead and empty state for live, business, clients, library, roster and settings; NAV's small Factory rows; its .cr-nav and .scr-head and widget-state rules; its Lucide nodes for bot and settings-2
9. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: ScreenHeader (.scr-head, its ea function), WidgetState (OT) and the Lucide nodes it has (activity, wallet, building, swatch-book, radio, blocks)
10. `apps/web/src/modules/system/nav.ts`: navFromRoutes, which gains unlabelled and small groups
11. `apps/web/src/routes/_shell/index.tsx`: Decisions' staticData.nav moves from the Decide group to the unlabelled main group
12. `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f5-test-e2e.md`: this document: follow it exactly

## 3. Domain

**Goal:** The sidebar shows the prototype's main group (Decisions, Live, Business, Clients) and its small Factory group (Library, Agents, Settings), and each entry opens a page titled as in the prototype that says plainly what's there.

**Refs:**
- shell-layout.md revision 3, section 4; S17
- control-room-prototype.html: NAV, NAV_LABEL, PAGES (live, business, clients, library, roster, settings)

**Merged before this starts:** T-F2

**Notes from the lead:**
- One new dependency, approved in this ticket list (E5): class-variance-authority 0.7.1 (Apache-2.0; its one dependency, clsx, is already in apps/web), pinned exactly (no ^), added to apps/web's dependencies by `pnpm --filter @avel/web add class-variance-authority@0.7.1`; the lockfile changes only for it. clsx and tailwind-merge are already there. No API call: the six pages read nothing. Icons are inline Lucide nodes in Icon.tsx, from the DL's registry or, for bot and settings-2, the prototype's, with Lucide's ISC notice kept; no icon package
- The empty state is ReUI's Empty (Javaris, Nov 17): run `pnpm --filter @avel/web exec shadcn@latest add empty` (or `npx shadcn@latest add empty` in apps/web) with the existing components.json, which writes apps/web/src/components/ui/empty.tsx. Keep its markup, classes and data-slot attributes as installed; only Biome's formatting and the import fixes strict TypeScript needs may change it. Its colours come from app.css's shadcn variables, already mapped to AVEL tokens by T-F1: don't edit app.css, tokens.css or components.json, and add no CSS variables. If the CLI wants to change any of those or add another package, stop with needs-dependency
- The seams the tests use: apps/web/src/kit/ScreenHeader.tsx exports ScreenHeader({ eyebrow?, title, lead? }) with the title as the page's h1 (section 3). apps/web/src/kit/WidgetState.tsx exports WidgetState({ icon, title, message? }), now composed from ReUI's Empty: Empty > EmptyHeader > EmptyMedia variant="icon" (the Icon, aria-hidden) + EmptyTitle (holding an h2, so the heading order stays valid) + EmptyDescription (the message). kit.css carries no .widget-state rules; Empty's own classes style it. staticData.nav gains group: '' for the unlabelled main group and size: 'sm' for the Factory group's rows; navFromRoutes keeps groups in section 4 revision 3's order and draws no label for ''
- The routes, all under _shell, ssr: true, each with staticData.nav = { group, order, label, icon } and the document title '{title} · AVEL'. Main group (group ''): Decisions / (order 1, moved from Decide), Live /live (2, label 'Live', icon activity, title 'Factory live', eyebrow 'Watch'), Business /business (3, wallet), Clients /clients (4, building). Factory group (group 'Factory', size sm): Library /library/skills (1, swatch-book), Agents /roster (2, bot), Settings /settings (3, settings-2)
- Each page is ScreenHeader then WidgetState. Live, Library and Agents use the prototype's eyebrow, title, lead and empty state word for word (Library's {kind} is 'skills'), without the empty state's actions, whose targets don't exist. Clients and Settings use the prototype's eyebrow, title and lead, and WidgetState '{title} isn't built yet': the mock has clients, so 'No clients yet' would be false, and Settings has no empty state. Business uses eyebrow 'Business' and title 'Business', no lead, and WidgetState 'Business isn't built yet': the prototype's lead and empty state are about margin and dollars, which E15 forbids
- The sidebar: the main group has no label; the Factory group's rows are the prototype's small rows (15px icons). The current row has aria-current="page" on every page, and the crumb is the page's title. Moving between pages is a client navigation (no reload)
- The tests check what this ticket draws, never the absence of what T-F6, T-F3 and T-F4 add (the Projects group, /missions, project rows, the sheet, More, the collapse, badges) or of routes later tickets add. Count only what this ticket owns
- If a locked T-F1 or T-F2 test conflicts with shell-layout.md revision 3 (other than T-F2's nav.test.ts, which Fenn updates in this ticket), stop with test-dispute (F2); don't work around it

## 4. Tasks

### T-F5-01: a failing test for: unit (T-F2's nav.test.ts, updated): with the real route tree, the first group is unlabelled and holds Decisions at / with inbox, Live, Business and Clients in that order with their icons, and Decisions is still a tab

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-02: a failing test for: unit: navFromRoutes gives a Factory group with Library, Agents and Settings in that order, each marked small, after the main group; a group label '' draws no label

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-03: a failing test for: unit: ScreenHeader renders the eyebrow, the title as the only h1, and the lead; WidgetState renders ReUI's Empty (data-slot empty, empty-header, empty-icon with data-variant icon, empty-title holding an h2, empty-description), its icon aria-hidden, its title and its message

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-04: a failing test for: e2e: at 1280x800, each of /live, /business, /clients, /library/skills, /roster and /settings is server-rendered inside the shell with its row aria-current, its h1, eyebrow and lead as the plan's table says, its state's title, and the document title '{title} · AVEL'

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-05: a failing test for: e2e: clicking each main and Factory row from / reaches its page with no full reload, and the current row follows

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-06: a failing test for: e2e: no page has '$' in its text, and /business has none of the words margin, revenue, payment or price

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-07: a failing test for: e2e: the Factory group's rows are shorter than the main group's rows, and the main group shows no group label

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-08: a failing test for: e2e: WCAG 2.2 AA with no violation on all six pages at 1280 and 390, in light and night

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-09: a failing test for: unit: apps/web/src/components/ui/empty.tsx exports Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription and EmptyContent; apps/web/package.json pins class-variance-authority to exactly 0.7.1

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-10: a failing test for: e2e: each page's main region holds exactly one [data-slot=empty], after the h1, holding the state's title

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F5-11: a failing test for: Attempt 1's test-dispute (F2), fixed in this dispatch's own commit: in rows.spec.ts, `has:` locators are relative to the section (`a.lib-nav-item[href=...]`, no `.lib-rail` prefix); in pages.spec.ts, order is checked by element (the eyebrow's node, then the h1, then the lead, then the empty state, by DOM position), never by indexOf of text, so equal eyebrow and title pass. If you think either test was right as written, don't change it: stop with test-dispute and say why. Then the lead adds the F2 relock line in locks.md

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `apps/web/test/sidebar-pages/**`
- `apps/web/e2e/sidebar-pages/**`
- `apps/web/test/shell/nav.test.ts`
- `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f5-test-e2e-completion.md` (your report)

**Never change, whatever the task says:**
- `apps/web/src/styles/tokens.css`
- `apps/web/src/styles/app.css`
- `apps/web/components.json`
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
- `apps/web/test/shell/app-shell.test.tsx`
- `apps/web/test/shell/kit-css.test.ts`
- `apps/web/test/shell/support.tsx`
- `apps/web/e2e/shell/a11y.spec.ts`
- `apps/web/e2e/shell/frame.spec.ts`
- `apps/web/e2e/shell/hydration.spec.ts`
- `apps/web/e2e/shell/support.ts`
- `apps/web/test/shell-sheet/**`
- `apps/web/e2e/shell-sheet/**`
- `apps/web/test/shell-rail/**`
- `apps/web/e2e/shell-rail/**`
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

**Your report:** `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f5-test-e2e-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F5
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F5: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F5, "The sidebar's main and Factory groups, with placeholder pages from the prototype": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f5-test-e2e.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F5-sidebar-pages`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-03/agent-fenn-t-f5-test-e2e-completion.md`, committed to the branch. Don't push.
