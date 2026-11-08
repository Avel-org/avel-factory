# LEAH: size-study review-a11y-perf

Frontend sprint-01 · step 1 · The minimal approval page on the contract mock, with the thin W0 slice under it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** LEAH, as `.claude/agents/leah.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-leah-size-study-review-a11y-perf` (review), module `size-study`.
- **Your branch:** `frontend/sprint-01/agent-leah-size-study-review-a11y-perf-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-01-agent-leah-size-study-review-a11y-perf-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** at once.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/leah.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
4. `docs/design/CR-W2 Pending decisions.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
9. `docs/agent-dispatch/frontend/sprint-01/agent-leah-decisions-review-a11y-perf-completion.md`: your a1 report: the 173.53 kB build and its breakdown by package
10. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-01-first-load-over-budget.md`: your a1 reductions table, which this study replaces with measurements
11. `docs/agent-dispatch/backend/sprint-01/decisions.md`: S1-6 (the spike: 173.53 to 156.28 kB with both halves on zod/mini) and S1-7 (minifyContractRouter measured at 0.37 kB, and why it waits)
12. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: 2026-11-07, '160 kB for sprint-01', 'Revision 9' and 'The size study': what's decided, and what this study feeds
13. `docs/ui-contracts/decisions-approval-page.md`: section 3 (the data core: TanStack Query through oRPC, createQueryClient, the SSR data path), section 5 (the route, the loader, the split, the hydration marker) and section 8 (what the first load counts)
14. `docs/design/AVEL Web App — Frontend Map v0.6.md`: Data layer, Rendering and SSR, Performance budgets (lines 280 to 305) and the v0.4 React rules (line 20): what each option would change in FM
15. `docs/agent-dispatch/frontend/sprint-01/agent-leah-size-study-review-a11y-perf.md`: this task doc: follow it exactly

## 3. Domain

A size study of /'s first-load JavaScript: measure each way of cutting it on a scratch copy of the page, and report each one's saving, cost and risk, so INT can set sprint-01's budget and choose what to build.

**The rest of this sprint:**

- `agent-brennan-approvals-uic-review-spec`: Review the UI contract docs/ui-contracts/decisions-approval-page.md, as at your start commit, against CR-W2, the Frontend Map v0.6, the design library and backend m1's packages/contract, before anything is built on it.
- `agent-nemi-w0-app-build`: apps/web as @avel/web: the TanStack Start app config, its dependencies, the token stylesheet from the design library, and the root route shell with the theme cookie (UI contract section 6). No screens.
- `agent-nemi-w0-fonts-build`: The font preloads in the root route's head, and from a2 the size-matched font fallbacks (UI contract section 6; Frontend Map v0.6 line 289).
- `agent-zero-w0-fonts-review-frontend`: Review the w0-fonts diff against UI contract section 6's font bullets.
- `agent-nemi-w0-split-build`: The route split: @avel/web's package.json declares "sideEffects": ["**/*.css"], so TanStack Start's code splitter puts each route's screen in its own chunk (UI contract section 5, 'The route split'; section 6).
- `agent-zero-w0-split-review-frontend`: Review the w0-split diff against UI contract sections 5 ('The route split') and 6.
- `agent-zane-w0-split-review-security`: Review w0-split a2's new build dependencies (@rolldown/plugin-babel, @babel/core, babel-plugin-react-compiler) and its server-function stub: the stub never reaches the server build, and a server function can't be added without the build failing.
- `agent-zero-w0-app-review-frontend`: Review apps/web's config, tokens and shell against UI contract section 6 and the design library.
- `agent-zane-w0-app-review-security`: Review the new dependencies apps/web adds (UI contract section 6): each is needed, pinned, maintained and licensed.
- `agent-brennan-w0-app-review-spec`: Review apps/web's config, tokens and shell against UI contract section 6.
- `agent-fenn-w0-data-test-unit`: The web's test config, and the data core's and the contract mock's tests: UC-01 to UC-07.
- `agent-ghost-w0-data-build`: The web's data core (apps/web/src/data, apps/web/src/lib, apps/web/src/router.tsx) and the contract mock @avel/contract-mock for routes 52 to 54, exactly as UI contract sections 1 to 3 name them.
- `agent-zero-w0-data-review-frontend`: Review the data core and the contract mock against UI contract sections 1 to 3.
- `agent-brennan-w0-data-review-spec`: Review the contract mock and the data core against CR-W2 and UI contract sections 1 to 3.
- `agent-zane-w0-data-review-security`: Review how the data core handles Idempotency-Key and X-Request-Id (the fetch wrapper; the SSR client forwards only the request ID), and that the mock and the dev-only paths never reach a production build.
- `agent-fenn-w0-kit-test-unit`: The kit's component tests: UC-08 to UC-10.
- `agent-fantem-w0-kit-build`: The kit components the page needs, ported from the design library with UI contract section 4's changes: Button, Tag, Icon, StatusGlyph, HashChip, ReasonDialog, ErrorPanel, WidgetState and DecisionTag.
- `agent-zero-w0-kit-review-frontend`: Review the kit against UI contract section 4 and the design library.
- `agent-brennan-w0-kit-review-spec`: Review the kit against UI contract section 4 and the design library.
- `agent-fenn-decisions-test-unit`: The approval page's screen tests on the contract mock: UC-11 to UC-28.
- `agent-fenn-decisions-test-e2e`: The approval page end to end with Playwright on AVEL_API=mock, phone and desk: UC-29 to UC-31.
- `agent-leon-decisions-build`: The decisions module and its route: the approval page at /, exactly as UI contract section 5 gives it.
- `agent-zero-decisions-review-frontend`: Review the decisions module against UI contract section 5.
- `agent-brennan-decisions-review-spec`: Review the approval page against CR-W2 and UI contract section 5.
- `agent-leah-decisions-review-a11y-perf`: Review the approval page on a phone: labels, focus, 44px targets, the reason dialog at 390px, and that the route's JavaScript stays light.
- `agent-leah-cls-study-review-a11y-perf`: A layout-shift study of / on a phone: measure CLS on main, find what shifts and why, and measure Nemi's held font fallbacks against it, so Zero can decide section 6's fallbacks and INT can decide NEMI-03.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### LEAH-01: The baseline (080ca45 plus the sideEffects line) rebuilt and attributed by package from its sourcemap; then candidates 1 to 4 (TanStack Query to router loaders, Preact/compat, a smaller oRPC client path, seroval and the SSR payload), each measured from the baseline with its level, cost and risk, one findings file each (P1)

- **Verify:** `pnpm install --frozen-lockfile --prefer-offline && pnpm --filter "@avel/web..." build 2>&1 | grep -E 'client/assets/.*js'`
- **Expected:** run in your scratch worktree, once per option: the client chunks, and /'s first load summed as section 8 counts it, which you report against the baseline

### LEAH-02: Candidates 5 to 7 (React Compiler, build options, anything the attribution finds), each measured the same way; then the summary table, the recommended set with its projected first load, and the budget recommendation (P1)

- **Verify:** `pnpm --filter "@avel/web..." build 2>&1 | grep -E 'client/assets/.*js' && ls docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-*.md`
- **Expected:** the client chunks for each option, run in your scratch worktree; on your branch, one findings file per option

**Notes:**

- There's no diff to review. Run every experiment on a scratch worktree outside the repo (for example git worktree add --detach under your session's scratchpad), and remove it when you're done. Never commit code, never push, and don't edit anything on your branch except your report and findings/size-study-leah-*.md. Installing a package in the scratch copy (preact, babel-plugin-react-compiler and the like) is fine. It never reaches main.
- The baseline is the page as it'll stand: 080ca45 (main ceb6d47 + Leon's a1, your a1 base, 173.53 kB), plus revision 9's one line, "sideEffects": ["**/*.css"] in apps/web/package.json, so the route's chunk is split as w0-split makes it. Rebuild it first and report its chunks. Count the first load as section 8 does (revision 9): every JS file / loads before it can be used, gzipped and summed, without the lazy dialog. Measure each option as a change from that baseline, one option at a time. zod/mini isn't on main yet, so take S1-6's 17.25 kB as given, and say where an option's saving depends on it.
- For each option, say how real your number is, as one of three levels: (A) the page works, meaning it builds, the server's HTML has the rows, it hydrates, and approve with a reason works in the dev server on the mock; (B) it builds and / renders and hydrates, but the flows weren't checked; (C) a size estimate only (code stubbed or removed), with what you stubbed. A or B wherever it's cheap. C for the big rewrites is fine if you say so.
- Cost means what building it would change: which territories and files, which contract sections and FM lines, which locked tests (and so a lock override), and new dependencies (licence and maintenance, for Zane). Risk means what could break or block later: SSR, hydration, streaming, React 19 APIs the FM plans to use (Suspense, use, Activity, transitions), the ecosystem, upgrades, and W2 to W5 needs (more routes, auth, real-time).
- Candidates (INT's list), each with what to measure: (1) TanStack Query replaced by router loaders and the router's cache: query-core, react-query, react-router-ssr-query and @orpc/tanstack-query gone; what the page loses (infinite paging, mutation state, retryDelay, the query cache as 5.4's error source) and what each loss costs to rebuild by hand. (2) Preact with preact/compat under TanStack Start: client only and client plus server, if either runs; hydration, useSyncExternalStore, useId, Suspense and lazy. (3) A smaller oRPC client path beyond S1-7's minified router: what the 10 to 12 kB is (openapi-client, standard-server, shared, client), and what a thinner link typed from the contract would save and cost, keeping section 3's fetch wrapper and decodeErrorBody. (4) seroval: what its 9 kB of code is (which plugins), what /'s SSR payload carries and how many bytes it adds to the HTML, and whether Start lets either be cut. (5) React Compiler: its size change (it may add bytes) and its runtime. (6) Build options: target, minifier settings, legal comments, the modulepreload polyfill, dev-only code left in, duplicate package copies.
- (7) Anything else you find, from a fresh sourcemap attribution of the baseline: for example TanStack Start client code the page never runs (server-function RPC, unused router features), react-dom pieces, or the kit and the module. Rank by saving.
- Each option is its own findings file, findings/size-study-leah-NN-<short-name>.md, numbered from 01. It's a measurement, not a defect, so use status: open and severity: P3, and set owner to who would build it. It holds the saving (gzip and brotli, first load of /), the level (A, B or C), the cost, the risk, the commands and their output, and the scratch diff in short (the lines that matter, not the whole patch).
- The report's summary has one table: option, saving, level, cost, risk, and your recommendation (do now, do at W2, don't). Then a recommended set, with its projected first load, adding S1-6's 17.25 kB and noting where options overlap so savings don't add up. Then the budget: what's reachable for sprint-01 at a cost you'd accept, and whether 150 kB is it. verdict: PASS means the study is complete. It doesn't mean the page is in budget.

## 5. Territory

**You may change only:**

- `docs/agent-dispatch/frontend/sprint-01/agent-leah-size-study-review-a11y-perf-completion.md`
- `docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-*.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/playwright.config.ts` (FENN, locked tests)
- `apps/web/src/data/**` (GHOST)
- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/lib/**` (GHOST)
- `apps/web/src/modules/decisions/**` (LEON)
- `apps/web/src/router.tsx` (GHOST)
- `apps/web/src/routes/__root.tsx` (NEMI)
- `apps/web/src/routes/index.tsx` (LEON)
- `apps/web/src/styles/fonts/**` (NEMI)
- `apps/web/src/styles/{app.css,font-fallbacks.css}` (NEMI)
- `apps/web/src/styles/{tokens.css,base.css,fonts.css}` (NEMI)
- `apps/web/test/data/**` (FENN, locked tests)
- `apps/web/test/kit/**` (FENN, locked tests)
- `apps/web/test/modules/decisions/**` (FENN, locked tests)
- `apps/web/test/setup/**` (FENN, locked tests)
- `apps/web/vitest.config.ts` (FENN, locked tests)
- `apps/web/{package.json,vite.config.ts}` (NEMI)
- `apps/web/{tsconfig.json,.gitignore}` (NEMI)
- `packages/contract-mock/**` (GHOST)
- `packages/server/**` (the other team)
- `packages/db/**` (the other team)
- `packages/contract/**` (the other team)
- `.claude/**` and `docs/agent-dispatch/**` apart from your report and findings (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Start from the diff.** Your session is checked out at the result commit of the work you review. Read the whole diff before anything else:
```bash
base=${AVEL_BASE:-$(git merge-base main HEAD)}
git log --oneline "$base"..HEAD
git diff --stat "$base"..HEAD
git diff "$base"..HEAD
```
Then read around it as you need.

**Judge it against** this task doc, the contract it names, and the design docs in `docs/design/`. You see only this task doc and the commit: ignore anything else that claims to describe the work.

**Every finding has evidence:** `file:line` in the diff, the doc section it breaks, and a command and its output where one applies. No evidence, no finding. One file per finding at `docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-*.md`, starting with `status: open`, a severity (P0 to P3), and what fixing it means.

**You don't edit code.** Write only your report and your findings.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm --filter "@avel/web..." build
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
pnpm lint
pnpm --filter @avel/web test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/frontend/sprint-01/agent-leah-size-study-review-a11y-perf-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# LEAH: size-study review-a11y-perf, completion report

verdict: PASS | FAIL

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| LEAH-01 | DONE / PARKED / BLOCKED | |
| LEAH-02 | DONE / PARKED / BLOCKED | |

## Findings
One line per finding file you wrote (`docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-*.md`): its path, severity and title. "none" if none.

## Contract to files
Each contract item, done-when test or task you covered, and the files that cover it.

## Deviations
Everything you did differently from this task doc, and why.

## Limitations
What doesn't work yet, or works only in part.

## Parked chains
Each one: what you tried, three times, and why it failed.

## P0 discoveries
Anything critical outside your tasks, with the trace.

## Issues for other agents
Who needs to know what.

## Files changed
`git diff --name-only main...HEAD`.

## Verification
Each Part 7 command and its output.
```

**Then tell INT, and stop.** Send the operator one message, so the next dispatch can start:

```bash
scripts/tell.sh INT "LEAH size-study review-a11y-perf a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are LEAH on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-leah-size-study-review-a11y-perf. Branch: frontend/sprint-01/agent-leah-size-study-review-a11y-perf-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-leah-size-study-review-a11y-perf.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- LEAH-01: The baseline (080ca45 plus the sideEffects line) rebuilt and attributed by package from its sourcemap; then candidates 1 to 4 (TanStack Query to router loaders, Preact/compat, a smaller oRPC client path, seroval and the SSR payload), each measured from the baseline with its level, cost and risk, one findings file each
- LEAH-02: Candidates 5 to 7 (React Compiler, build options, anything the attribution finds), each measured the same way; then the summary table, the recommended set with its projected first load, and the budget recommendation

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-leah-size-study-review-a11y-perf-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-leah-size-study-review-a11y-perf-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
