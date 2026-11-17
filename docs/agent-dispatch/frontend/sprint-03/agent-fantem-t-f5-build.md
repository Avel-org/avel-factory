---
doc: agent-fantem-t-f5-build
ticket: T-F5
lane: frontend
sprint: sprint-03
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/F5-sidebar-pages
checkout: branch
after: [agent-fenn-t-f5-test-e2e]
depends_on: [T-F2]
report: docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f5-build-completion.md
---


# T-F5 · build · Fantem: The sidebar's main and Factory groups, with placeholder pages from the prototype

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-03 · Step 1 |
| Ticket | T-F5 · rigor standard |
| Dispatch | build · Fantem (builder) · model sonnet |
| Works on | `t/F5-sidebar-pages` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
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
12. `apps/web/test/sidebar-pages/**`: the locked acceptance tests: they define done
13. `apps/web/e2e/sidebar-pages/**`: the locked acceptance tests: they define done
14. `apps/web/test/shell/nav.test.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f5-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The sidebar shows the prototype's main group (Decisions, Live, Business, Clients) and its small Factory group (Library, Agents, Settings), and each entry opens a page titled as in the prototype that says plainly what's there.

**Refs:**
- shell-layout.md revision 3, section 4; S17
- control-room-prototype.html: NAV, NAV_LABEL, PAGES (live, business, clients, library, roster, settings)

**Merged before this starts:** T-F2

**Notes from the lead:**
- No new dependency and no API call: the six pages read nothing. Icons are inline Lucide nodes in Icon.tsx, from the DL's registry or, for bot and settings-2, the prototype's, with Lucide's ISC notice kept
- The seams the tests use: apps/web/src/kit/ScreenHeader.tsx exports ScreenHeader({ eyebrow?, title, lead? }) with the title as the page's h1 (section 3). apps/web/src/kit/WidgetState.tsx exports WidgetState({ icon, title, message? }), the DL's empty state, its icon aria-hidden. staticData.nav gains group: '' for the unlabelled main group and size: 'sm' for the Factory group's rows; navFromRoutes keeps groups in section 4 revision 3's order and draws no label for ''
- The routes, all under _shell, ssr: true, each with staticData.nav = { group, order, label, icon } and the document title '{title} · AVEL'. Main group (group ''): Decisions / (order 1, moved from Decide), Live /live (2, label 'Live', icon activity, title 'Factory live', eyebrow 'Watch'), Business /business (3, wallet), Clients /clients (4, building). Factory group (group 'Factory', size sm): Library /library/skills (1, swatch-book), Agents /roster (2, bot), Settings /settings (3, settings-2)
- Each page is ScreenHeader then WidgetState. Live, Library and Agents use the prototype's eyebrow, title, lead and empty state word for word (Library's {kind} is 'skills'), without the empty state's actions, whose targets don't exist. Clients and Settings use the prototype's eyebrow, title and lead, and WidgetState '{title} isn't built yet': the mock has clients, so 'No clients yet' would be false, and Settings has no empty state. Business uses eyebrow 'Business' and title 'Business', no lead, and WidgetState 'Business isn't built yet': the prototype's lead and empty state are about margin and dollars, which E15 forbids
- The sidebar: the main group has no label; the Factory group's rows are the prototype's small rows (15px icons). The current row has aria-current="page" on every page, and the crumb is the page's title. Moving between pages is a client navigation (no reload)
- The tests check what this ticket draws, never the absence of what T-F6, T-F3 and T-F4 add (the Projects group, /missions, project rows, the sheet, More, the collapse, badges) or of routes later tickets add. Count only what this ticket owns
- If a locked T-F1 or T-F2 test conflicts with shell-layout.md revision 3 (other than T-F2's nav.test.ts, which Fenn updates in this ticket), stop with test-dispute (F2); don't work around it

## 4. Tasks

### T-F5-01: make it true: unit (T-F2's nav.test.ts, updated): with the real route tree, the first group is unlabelled and holds Decisions at / with inbox, Live, Business and Clients in that order with their icons, and Decisions is still a tab

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F5-02: make it true: unit: navFromRoutes gives a Factory group with Library, Agents and Settings in that order, each marked small, after the main group; a group label '' draws no label

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F5-03: make it true: unit: ScreenHeader renders the eyebrow, the title as the only h1, and the lead; WidgetState renders its icon aria-hidden, its title and its message

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F5-04: make it true: e2e: at 1280x800, each of /live, /business, /clients, /library/skills, /roster and /settings is server-rendered inside the shell with its row aria-current, its h1, eyebrow and lead as the plan's table says, its state's title, and the document title '{title} · AVEL'

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F5-05: make it true: e2e: clicking each main and Factory row from / reaches its page with no full reload, and the current row follows

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F5-06: make it true: e2e: no page has '$' in its text, and /business has none of the words margin, revenue, payment or price

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F5-07: make it true: e2e: the Factory group's rows are shorter than the main group's rows, and the main group shows no group label

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F5-08: make it true: e2e: WCAG 2.2 AA with no violation on all six pages at 1280 and 390, in light and night

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/src/kit/**`
- `apps/web/src/modules/system/**`
- `apps/web/src/routes/**`
- `apps/web/src/routeTree.gen.ts`
- `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f5-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/sidebar-pages/**`
- `apps/web/e2e/sidebar-pages/**`
- `apps/web/test/shell/nav.test.ts`

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

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F5`).
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

**Your report:** `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f5-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F5
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F5, "The sidebar's main and Factory groups, with placeholder pages from the prototype": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f5-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F5-sidebar-pages`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-03/agent-fantem-t-f5-build-completion.md`, committed to the branch. Don't push.
