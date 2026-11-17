---
doc: agent-fantem-t-f1-build
ticket: T-F1
lane: frontend
sprint: sprint-01
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/F1-web-scaffold
checkout: branch
after: [agent-fenn-t-f1-test-e2e]
depends_on: [T-B0]
report: docs/agent-dispatch/frontend/sprint-01/agent-fantem-t-f1-build-completion.md
---


# T-F1 · build · Fantem: apps/web scaffold: TanStack Start, Tailwind v4, shadcn/ui and the oRPC client on contract-mock

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-01 · Step 1 |
| Ticket | T-F1 · rigor standard |
| Dispatch | build · Fantem (builder) · model sonnet |
| Works on | `t/F1-web-scaffold` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the codebase in short
5. `docs/ui-reference/control-room-handoff/README.md`: the port order (E14) and the control room's rules
6. `docs/design/Build rules.md`: E14 to E18, the frontend's rules
7. `docs/ui-reference/control-room-handoff/README.md`: port step 1 and the rules that aren't obvious from the screens
8. `docs/ui-reference/control-room-handoff/tokens.css`: copied byte for byte to apps/web/src/styles/tokens.css
9. `docs/ui-reference/control-room-handoff/screens.md`: the Decisions section: route /, 'Nothing needs you', server-rendered, under 150 KB
10. `docs/ui-contracts/shell-layout.md`: section 2's __root lines only: data-theme from the avel-theme cookie (light or night, light by default), data-depth="glass"
11. `docs/ui-contracts/decisions-approval-page.md`: section 6 only for package.json's sideEffects and __root's data-theme; section 3 only for zod/mini. Fonts, font fallbacks and the React Compiler aren't this ticket
12. `packages/contract-mock/src/mock.ts`: createMock({ contractVersion, world }) and its fetch, which the dev server mounts under /api
13. `packages/contract/src/routes/decisions.ts`: route 52, decisions.listPending: a Page of PendingDecisionDto
14. `packages/contract/src/version.ts`: CONTRACT_VERSION, passed to createMock
15. `apps/web/test/**`: the locked acceptance tests: they define done
16. `apps/web/e2e/**`: the locked acceptance tests: they define done
17. `apps/web/vitest.config.ts`: the locked acceptance tests: they define done
18. `apps/web/playwright.config.ts`: the locked acceptance tests: they define done
19. `apps/web/.gitignore`: the locked acceptance tests: they define done
20. `docs/agent-dispatch/frontend/sprint-01/agent-fantem-t-f1-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** Opening / shows a server-rendered page in AVEL's light or night look that says how many decisions are waiting, read from contract-mock through the oRPC client.

**Refs:**
- control-room-handoff README, port step 1 (Foundation)
- screens.md, Decisions (route /, its clear state and the 150 KB budget)
- shell-layout.md section 2 (__root and the avel-theme cookie)

**Merged before this starts:** T-B0

**Notes from the lead:**
- apps/web/package.json is T-B0's and locked here: its dependencies, sideEffects ["**/*.css"] and scripts (dev: vite dev, preview: vite preview, test: vitest run, e2e: playwright test) are what T-F1 builds on. No build or typecheck script: verify runs vite build and tsc through pnpm exec, and the next cycle's dependency ticket adds both scripts so root build and typecheck cover apps/web. A missing package or script is needs-dependency (L1)
- The seams the tests use: apps/web/src/data/client.ts exports createClient({ baseUrl, fetch? }), a ContractRouterClient over @avel/contract through OpenAPILink. apps/web/src/home/load-home.ts exports loadHome(client), resolving to { kind: 'ready', count, more } | { kind: 'empty' } | { kind: 'error' }, from route 52's first page (more is nextCursor !== null). apps/web/src/home/HomeView.tsx exports HomeView({ state, onRetry }) and HomeLoading(). HomeView is a pure view: no hooks, and the Try again button (onClick calls onRetry) is in the element tree HomeView itself returns, not inside a child component
- The page's states. Ready: an h1 'Decisions' and '{count} waiting' ('{count}+ waiting' when more). Empty: the h1 and 'Nothing needs you'. Error: the h1, role=alert 'Couldn't load your decisions.' and a 'Try again' button that re-runs the loader. Loading: role=status 'Loading…', the route's pending view. The document title is 'Decisions · AVEL'
- __root reads the avel-theme cookie on the server onto <html data-theme> (night, else light), with lang="en" and data-depth="glass". No theme switch in this ticket: Settings owns it
- Styles: src/styles/tokens.css is the handoff's file unchanged, and it already has @import "tailwindcss" (its line 4). So src/styles/app.css imports ./tokens.css and never imports tailwindcss itself: Tailwind is imported exactly once. app.css maps shadcn's variables (background, foreground, primary, border, ring and the rest init writes) to the --av-* values, so light and night both follow data-theme
- shadcn/ui init means components.json (Tailwind v4, css src/styles/app.css, alias @/ to src/) and src/lib/utils.ts's cn() on clsx and tailwind-merge, as init writes them. Write them by hand or run init without installing anything: no component is added, and no package
- The dev server mounts createMock({ contractVersion: CONTRACT_VERSION, world: true }).fetch under /api only when AVEL_API=mock, from a Vite plugin with apply 'serve' and a dynamic import, so the mock is never in a production build
- How the tests run the app: Fenn's playwright.config.ts starts `vite dev` with AVEL_API=mock on a port taken from the worktree (D5, never a fixed 3000), and a second `vite dev` with no mock, where route 52 fails, for the error state in a browser. The budget test runs its own `vite build` then `vite preview`. The app must work under all three

## 4. Tasks

### T-F1-01: make it true: unit: createClient over createMock({ world: true }).fetch lists route 52, and loadHome gives ready with the world's count

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-02: make it true: unit: loadHome gives empty when route 52 has no rows, and error when createMock's failNext(52) fails it, without throwing

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-03: make it true: unit: HomeView renders each state's copy and role (ready with and without '+', empty, error with its Try again button) and HomeLoading renders role=status, through react-dom/server

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-04: make it true: unit: src/styles/tokens.css is byte for byte the handoff's tokens.css, components.json points at src/styles/app.css, app.css imports ./tokens.css and has no @import of tailwindcss of its own (tokens.css brings it in, so it loads once), and cn() merges conflicting Tailwind classes

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-05: make it true: unit: no file under apps/web/src uses dangerouslySetInnerHTML or sets innerHTML, and none imports classic zod

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-06: make it true: e2e: / under AVEL_API=mock is server-rendered: the HTML before hydration has the h1 'Decisions' and the waiting count, and the title is 'Decisions · AVEL'

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-07: make it true: e2e: with no avel-theme cookie, <html data-theme> is light; with avel-theme=night it is night in the server's HTML, and the page background differs between the two

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-08: make it true: e2e: / passes axe-core's WCAG 2.2 AA rules (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) with no violation, in light and night, at 390x844 and 1440x900

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-09: make it true: e2e: the page's text has no '$'

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-10: make it true: hygiene: apps/web/.gitignore ignores what the tests write (test-results/, playwright-report/), so a run leaves git status clean

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

### T-F1-11: make it true: budget: on the production build, the JavaScript the server's HTML for / loads or preloads is at most 150 KB gzipped in total, where KB is 1024 bytes (a warning over 130 KB), and no built file contains the mock's operator id 0193a000-0000-7000-8000-000000000001

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/src/**`
- `apps/web/vite.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/components.json`
- `apps/web/biome.json`
- `docs/agent-dispatch/frontend/sprint-01/agent-fantem-t-f1-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/**`
- `apps/web/e2e/**`
- `apps/web/vitest.config.ts`
- `apps/web/playwright.config.ts`
- `apps/web/.gitignore`

**Never change, whatever the task says:**
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `package.json`
- `biome.json`
- `tsconfig.base.json`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F1`).
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

**Your report:** `docs/agent-dispatch/frontend/sprint-01/agent-fantem-t-f1-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F1
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F1, "apps/web scaffold: TanStack Start, Tailwind v4, shadcn/ui and the oRPC client on contract-mock": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-01/agent-fantem-t-f1-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F1-web-scaffold`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-01/agent-fantem-t-f1-build-completion.md`, committed to the branch. Don't push.
