---
doc: agent-fenn-t-f2-review
ticket: T-F2
lane: frontend
sprint: sprint-02
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F2-shell-frame
checkout: detached
after: [agent-fantem-t-f2-build]
depends_on: [T-F1]
report: docs/agent-dispatch/frontend/sprint-02/agent-fenn-t-f2-review-completion.md
---


# T-F2 · review · Fenn: The shell's frame: rail, header and tab bar, from the route tree

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-F2 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F2-shell-frame`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-02/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/shell-layout.md`: the shell's UI contract, rev 2: the frame, the parts, the nav model
6. `docs/design/AVEL Shell Layout brief v1.9.md`: what the shell is for, and what the app drops from the design library
7. `docs/ui-reference/control-room-handoff/README.md`: port step 2, and the rules on focus, motion and phone targets
8. `docs/ui-contracts/shell-layout.md`: sections 1 (the frame), 2 (sidebar, header, tab bar), 3 (the kit's AppShellProps) and 4 (the nav model), and section 7's departures; S17 is this ticket's
9. `docs/design/AVEL Shell Layout brief v1.9.md`: the shell in words, and what the app drops from the design library
10. `docs/design/AVEL Enclosure Grid · Design library v1.9.html`: the DL: the .lib-app, .lib-rail, .lib-nav, .lib-head and tab bar rules (final cascade) for kit.css, the brand mark, and the Lucide icon nodes (its icon registry, e.g. inbox) to copy
11. `docs/ui-reference/control-room-handoff/README.md`: focus rings (keyboard only), motion off under reduced motion, 44px primary targets, 24px others
12. `docs/ui-reference/control-room-handoff/tokens.css`: the --av-* values kit.css uses; never redefined in kit.css
13. `apps/web/src/routes/index.tsx`: T-F1's / route, which moves under _shell
14. `apps/web/src/routes/__root.tsx`: T-F1's root: data-theme, data-depth and lang stay as they are
15. `apps/web/test/shell/**`: the locked acceptance tests: they define done
16. `apps/web/e2e/shell/**`: the locked acceptance tests: they define done
17. `docs/agent-dispatch/frontend/sprint-02/agent-fantem-t-f2-build-completion.md`: the builder's completion report
18. `docs/agent-dispatch/frontend/sprint-02/agent-fenn-t-f2-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** Opening / shows Decisions inside the app's shell: the sidebar with the brand and the nav on a desk, the header with the breadcrumb at every width, and the tab bar on a phone, all in the server's HTML.

**Refs:**
- shell-layout.md rev 2, sections 1, 2 and 4, and S1, S2, S3, S12, S14, S15, S16
- control-room-handoff README, port step 2

**Merged before this starts:** T-F1

**Notes from the lead:**
- No new dependency. Icons: apps/web/src/kit/Icon.tsx draws Lucide's icons from inline SVG nodes copied from the DL's icon registry, as the DL itself does, with Lucide's ISC notice in the file's header comment. Only the icons this ticket draws (inbox, and the brand mark). No lucide-react
- The seams the tests use: apps/web/src/kit/AppShell.tsx exports AppShell with shell-layout.md section 3's props, minus what T-F3 adds (collapsed, onCollapsedChange, focus): { groups, tabs, currentId, crumbs, renderLink, children }. apps/web/src/kit/kit.css holds the shell's DL rules. apps/web/src/modules/system/nav.ts exports navFromRoutes(routes), which reads each route's staticData.nav = { group, order, label, icon } into section 4's groups and the tabs, in order, leaving out empty groups
- Routes: apps/web/src/routes/_shell.tsx is the layout (ssr: true): it renders AppShell from navFromRoutes and links kit.css. / moves from routes/index.tsx to routes/_shell/index.tsx with staticData.nav = { group: 'Decide', order: 1, label: 'Decisions', icon: 'inbox' }, and keeps T-F1's loader, view and title. Regenerate routeTree.gen.ts
- In the server's HTML, the AppShell element carries data-ui="AppShell" and data-tabbar (S2); data-hydrated is set in a commit after hydration, for the tests only. No data-rail or data-focus yet: they come with T-F3
- The rail (1024px and wider): the brand link to / with the 32px mark and 'AVEL' and no sub line (S3), then nav "Main" (S15) with the Decide group's Decisions row, aria-current="page" on the current row, and the current row drawn with .lib-nav-indicator's look in the server's HTML (S4, no glide). No collapse button yet
- The header, at every width: the breadcrumb (a top-level page is [label], so 'Decisions') and the progress line, 0 in the server's HTML, then following the scroller. Nothing on the right (S14). No menu button yet
- The tab bar (760px and narrower): one tab per route with staticData.nav that the bar lists (Decisions), current with aria-current, each at least 52px tall, and main's bottom padding under [data-tabbar]. S17: a tab is drawn only once its route exists, as S8 says for Release, so Project waits for /missions and More waits for T-F3's sheet
- The rounded canvas at 1024px and wider (S1): the page column takes margin var(--canvas-inset) except on the sidebar's side, border-radius var(--radius-dialog), background var(--av-page-bg) and box-shadow 0 0 0 1px var(--av-hairline). It's the scroller, with overscroll-behavior contain and scroll-padding-top 76px. Below 1024px the window scrolls
- kit.css: every hover rule under @media (hover: hover) and (pointer: fine); widths as media queries only (no matchMedia, no measuring); keyboard focus rings only; nothing moves under prefers-reduced-motion
- The document title stays '{last crumb} · AVEL', so / is still 'Decisions · AVEL'. T-F1's locked tests stay green: the h1, the count, the theme cookie, the axe check and the 150 KB budget

## 4. Tasks

### T-F2-01: check: unit: AppShell in renderToString draws the brand link to / with 'AVEL', nav "Main" with each group's label and its items in order, aria-current="page" on currentId's row only, and the crumbs

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-02: check: unit: AppShell's server markup has data-ui="AppShell" and data-tabbar, and no data-hydrated

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-03: check: unit: AppShell draws the tab bar's tabs in order with the current one marked, and leaves out a group with no items

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-04: check: unit: navFromRoutes reads staticData.nav into groups and tabs in section 4's order and skips routes without it; with T-F2's route tree it gives the Decide group with Decisions at / and the inbox icon, and nothing else

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-05: check: unit: kit.css, read as text: the 1024px and 760px breakpoints, the canvas rule (radius, inset, scroller), and no :hover outside @media (hover: hover) and (pointer: fine)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-06: check: e2e: at 1280x800, / is server-rendered inside the shell: the rail with the Decisions row current, the rounded canvas, the header's 'Decisions' crumb, no tab bar, and T-F1's h1 and count inside the canvas

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-07: check: e2e: at 900x800, there is no rail and no tab bar, and the header and the page show; at 390x844, the tab bar shows with Decisions current, every tab at least 44px tall, main padded above the bar, and no sideways scroll

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-08: check: e2e: data-hydrated appears after hydration, and nothing moves at hydration: at 1280 the Decisions row, the header and the h1, and at 390 the header, the tab bar and the h1, keep their boxes within 1px between the server's paint (scripts off) and the hydrated page

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-09: check: e2e: the progress line is 0 before any scroll and grows when the canvas (1280) or the window (390) scrolls

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-10: check: e2e: WCAG 2.2 AA with no violation at 1280, 900 and 390, in light and night, and no '$' in the page's text

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F2-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-02/agent-fenn-t-f2-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-02/findings/t-f2-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/src/kit/**`
- `apps/web/src/modules/system/**`
- `apps/web/src/routes/**`
- `apps/web/src/routeTree.gen.ts`

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

**Your report:** `docs/agent-dispatch/frontend/sprint-02/agent-fenn-t-f2-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F2
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F2, "The shell's frame: rail, header and tab bar, from the route tree": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-02/agent-fenn-t-f2-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-02/agent-fenn-t-f2-review-completion.md`, left uncommitted. Don't push.
