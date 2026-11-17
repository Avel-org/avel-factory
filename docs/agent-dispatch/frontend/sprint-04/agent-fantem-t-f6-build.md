---
doc: agent-fantem-t-f6-build
ticket: T-F6
lane: frontend
sprint: sprint-04
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/F6-sidebar-projects
checkout: branch
after: [agent-fenn-t-f6-test-e2e]
depends_on: [T-F5]
report: docs/agent-dispatch/frontend/sprint-04/agent-fantem-t-f6-build-completion.md
---


# T-F6 · build · Fantem: The sidebar's Projects group: the All link, project rows from routes 19 and 8, and their pages

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-F6 · rigor standard |
| Dispatch | build · Fantem (builder) · model sonnet |
| Works on | `t/F6-sidebar-projects` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-04/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/shell-layout.md`: revision 3 of section 4: the Projects group; section 2: project rows (S6's label, leaving out closed and cancelled), _shell's loader; S17
6. `docs/ui-reference/control-room-prototype.html`: the prototype: the Projects group's head (.cr-nav-head), its rows (missionRow, missionDot, DOTS) and the --cr-id colours, read as data
7. `docs/ui-contracts/shell-layout.md`: revision 3 under section 4; section 2: project rows (route 19's first page in order, leaving out closed and cancelled; S6's label: '{client name} · {package}', the package key read as capitalised words, the fallbacks 'Project' and the client or package alone), _shell's loader (a failure is swallowed and that part isn't drawn)
8. `docs/ui-reference/control-room-prototype.html`: the Projects group's head (label, the All link to /missions with aria-current on All projects), the row's dot (DOTS by the project's place in the list), the --cr-id-1 to --cr-id-5 colours for light and night, and PAGES.projects' and PAGES.progress' eyebrow, title and lead
9. `packages/contract/src/routes/missions.ts`: route 19, missions.list: a Page of MissionListRowDto (state, clientId, package)
10. `packages/contract/src/routes/clients.ts`: route 8, clients.list: a Page of ClientDto (the client's name)
11. `packages/contract-mock/src/mock.ts`: createMock({ world: true }) serves routes 19 and 8 with the sample world; failNext(19) and failNext(8) for the failure cases
12. `apps/web/test/sidebar-projects/**`: the locked acceptance tests: they define done
13. `apps/web/e2e/sidebar-projects/**`: the locked acceptance tests: they define done
14. `docs/agent-dispatch/frontend/sprint-04/agent-fantem-t-f6-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The sidebar's Projects group lists every open project as '{client} · {package}' with its colour dot, and its All link and each row open their page.

**Refs:**
- shell-layout.md revision 3, section 4; section 2's project rows and S6; S17
- control-room-prototype.html: NAV's projects group, .cr-nav-head, missionRow, missionDot, DOTS, PAGES.projects and PAGES.progress

**Merged before this starts:** T-F5

**Notes from the lead:**
- No new dependency. src/data stays as it is: the shell reads routes 19 and 8 through a server function (createServerFn) in src/modules/system, so their schemas never ship to the browser and the 150 KB budget holds. If the budget breaks anyway, stop and report; don't trim other code to fit
- The seams the tests use: apps/web/src/modules/system/projects.ts exports projectRows(missions, clients): { id, label, href, dot }[] — open projects only (not closed or cancelled), in route 19's order, label by S6, href /missions/{id}, dot 'var(--cr-id-N)' with N the row's place counted from 1, repeating after 5 — and projectLabel(mission, clients) for S6 alone
- _shell's loader reads routes 19 (the first page) and 8 on the server. A failure of either is swallowed: the Projects group still draws its head, with no rows. The rows come after the head in the Projects group, which sits between the main group and the Factory group
- The Projects group's head: the 'Projects' label and an 'All' link to /missions, aria-current="page" on /missions. No + link: /missions/new doesn't exist (S17). A row: the dot (aria-hidden), the label as plain text, linked to Progress, aria-current="page" on that project's page.
- apps/web/src/styles/project-identity.css holds the prototype's --cr-id-1 to --cr-id-5 rules for light and night, word for word; app.css imports it after tokens.css and changes nothing else. tokens.css is untouched
- /missions (All projects): ScreenHeader with the prototype's eyebrow 'Projects', title 'All projects' and lead, then WidgetState 'All projects isn't built yet' (the world has projects, so the prototype's 'No projects yet' would be false). /missions/$missionId (Progress): eyebrow 'Project', the S6 label as title and crumb, the prototype's lead, then WidgetState 'Progress isn't built yet'; an id not in route 19's first page shows WidgetState 'Not found' with a link back to All projects. Titles '{title} · AVEL'
- The tests check what this ticket draws, never the absence of what later tickets add (New project, badges, project page trees, the Project tab, T-F3's sheet and More, T-F4's collapse). Count only what this ticket owns
- If a locked T-F1, T-F2 or T-F5 test conflicts with shell-layout.md revision 3, stop with test-dispute (F2); don't work around it

## 4. Tasks

### T-F6-01: make it true: unit: projectLabel follows S6: '{client} · {Package words}', the client alone with no package, the package alone with no client found, 'Project' with neither, and an unknown package key as it is

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F6-02: make it true: unit: projectRows leaves out closed and cancelled projects, keeps route 19's order, links each to /missions/{id}, and gives dots var(--cr-id-1) to var(--cr-id-5) by place, the sixth open project getting var(--cr-id-1) again

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F6-03: make it true: unit: project-identity.css, read as text, defines --cr-id-1 to --cr-id-5 for light and for night, and app.css imports it after tokens.css

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F6-04: make it true: e2e: under AVEL_API=mock at 1280x800, the server's HTML for / shows the Projects group's head with its All link, then one row per open world project in route 19's order, each with the S6 label and a dot in its --cr-id colour

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F6-05: make it true: e2e: All goes to /missions with All projects' h1 and the link aria-current; a project row goes to its Progress page with the S6 label as h1 and the row aria-current; both are client navigations

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F6-06: make it true: e2e: /missions/<an unknown id> shows Not found with a link back to All projects

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F6-07: make it true: e2e: on the dev server with no mock, the Projects group shows its head and no rows, and the rest of the shell still draws

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F6-08: make it true: e2e: WCAG 2.2 AA with no violation on /, /missions and a Progress page at 1280 and 390, in light and night, and no '$' in any page's text

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/src/kit/**`
- `apps/web/src/modules/system/**`
- `apps/web/src/routes/**`
- `apps/web/src/routeTree.gen.ts`
- `apps/web/src/styles/project-identity.css`
- `apps/web/src/styles/app.css`
- `docs/agent-dispatch/frontend/sprint-04/agent-fantem-t-f6-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/sidebar-projects/**`
- `apps/web/e2e/sidebar-projects/**`

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
- `apps/web/test/shell-rail/**`
- `apps/web/e2e/shell-rail/**`
- `apps/web/test/sidebar-pages/**`
- `apps/web/e2e/sidebar-pages/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F6`).
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

**Your report:** `docs/agent-dispatch/frontend/sprint-04/agent-fantem-t-f6-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F6
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F6, "The sidebar's Projects group: the All link, project rows from routes 19 and 8, and their pages": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-04/agent-fantem-t-f6-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F6-sidebar-projects`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-04/agent-fantem-t-f6-build-completion.md`, committed to the branch. Don't push.
