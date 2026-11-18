---
doc: agent-fenn-t-f6-review
ticket: T-F6
lane: frontend
sprint: sprint-04
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F6-sidebar-projects
checkout: detached
after: [agent-fantem-t-f6-build]
depends_on: [T-F5]
report: docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f6-review-completion.md
---


# T-F6 · review · Fenn: The sidebar's Projects group: the All link, project rows from routes 19 and 8, and their pages

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-F6 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F6-sidebar-projects`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
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
14. `docs/agent-dispatch/frontend/sprint-04/agent-fantem-t-f6-build-completion.md`: the builder's completion report
15. `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f6-review.md`: this document: follow it exactly

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
- Every empty state here is ReUI's Empty (Javaris, Nov 17), through T-F5's WidgetState, which composes apps/web/src/components/ui/empty.tsx. Use WidgetState; don't install, copy or restyle Empty. Not found's link back goes in EmptyContent: WidgetState may gain an optional children prop rendered there, nothing more. The tests check [data-slot=empty] on /missions, Progress and Not found
- The tests check what this ticket draws, never the absence of what later tickets add (New project, badges, project page trees, the Project tab, T-F3's sheet and More, T-F4's collapse). Count only what this ticket owns
- If a locked T-F1, T-F2 or T-F5 test conflicts with shell-layout.md revision 3, stop with test-dispute (F2); don't work around it

## 4. Tasks

### T-F6-01: check: unit: projectLabel follows S6: '{client} · {Package words}', the client alone with no package, the package alone with no client found, 'Project' with neither, and an unknown package key as it is

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-02: check: unit: projectRows leaves out closed and cancelled projects, keeps route 19's order, links each to /missions/{id}, and gives dots var(--cr-id-1) to var(--cr-id-5) by place, the sixth open project getting var(--cr-id-1) again

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-03: check: unit: project-identity.css, read as text, defines --cr-id-1 to --cr-id-5 for light and for night, and app.css imports it after tokens.css

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-04: check: e2e: under AVEL_API=mock at 1280x800, the server's HTML for / shows the Projects group's head with its All link, then one row per open world project in route 19's order, each with the S6 label and a dot in its --cr-id colour

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-05: check: e2e: All goes to /missions with All projects' h1 and the link aria-current; a project row goes to its Progress page with the S6 label as h1 and the row aria-current; both are client navigations

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-06: check: e2e: /missions/<an unknown id> shows Not found with a link back to All projects

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-07: check: e2e: on the dev server with no mock, the Projects group shows its head and no rows, and the rest of the shell still draws

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-08: check: e2e: WCAG 2.2 AA with no violation on /, /missions and a Progress page at 1280 and 390, in light and night, and no '$' in any page's text

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F6-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f6-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-04/findings/t-f6-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/src/kit/**`
- `apps/web/src/modules/system/**`
- `apps/web/src/routes/**`
- `apps/web/src/routeTree.gen.ts`
- `apps/web/src/styles/project-identity.css`
- `apps/web/src/styles/app.css`

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

**Your report:** `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f6-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F6
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F6, "The sidebar's Projects group: the All link, project rows from routes 19 and 8, and their pages": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f6-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-04/agent-fenn-t-f6-review-completion.md`, left uncommitted. Don't push.
