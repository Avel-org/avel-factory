# LEON: decisions build

Frontend sprint-01 · step 1 · The minimal approval page on the contract mock, with the thin W0 slice under it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** LEON, as `.claude/agents/leon.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-leon-decisions-build` (build), module `decisions`.
- **Your branch:** `frontend/sprint-01/agent-leon-decisions-build-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-01-agent-leon-decisions-build-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** once `agent-fenn-decisions-test-unit`, `agent-fenn-decisions-test-e2e` is merged and listed in `locks.md`; after `agent-ghost-w0-data-build`, `agent-fantem-w0-kit-build` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/leon.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
4. `docs/design/CR-W2 Pending decisions.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
9. `docs/ui-contracts/decisions-approval-page.md`: section 5: the route, layout, each row's props, deciding, errors and their actions, the list's states, the contract version banner and all copy
10. `docs/design/CR-W2 Pending decisions.md`: the row you render and what route 54 takes
11. `docs/design/AVEL Web App — Frontend Map v0.6.md`: What every module looks like, Data layer (writes), Rendering and SSR
12. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: the Decisions screen (its layout and copy)
13. `docs/agent-dispatch/frontend/sprint-01/agent-leah-decisions-review-a11y-perf-completion.md`: a2: Leah's review of your a1 (FAIL; on main at 3d3ccfc): her measurements, the bundle breakdown and what she couldn't check
14. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-01-first-load-over-budget.md`: a2: the first load, 173.5 kB gzip; which cuts are yours (the lazy dialog) and which aren't (zod/mini)
15. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-02-page-unstyled-targets-and-input-below-minimum.md`: a2: the sheets aren't linked; the target and input sizes, which the kit's K1 and R5 fix
16. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-03-e2e-click-before-hydration.md`: a2: the first click lost before hydration; your hydration marker
17. `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-04-mono-500-preload-unused-on-first-paint.md`: a2: Mono 500 unused until kit.css is linked
18. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: 2026-11-07, 'Revision 7' and 'Revision 9': what a2 takes from Leah's review, and what goes to Fantem, Fenn, Nemi and Ghost
19. `docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build.md`: this task doc: follow it exactly

## 3. Domain

The decisions module and its route: the approval page at /, exactly as UI contract section 5 gives it.

**The rest of this sprint:**

- `agent-brennan-approvals-uic-review-spec`: Review the UI contract docs/ui-contracts/decisions-approval-page.md, as at your start commit, against CR-W2, the Frontend Map v0.6, the design library and backend m1's packages/contract, before anything is built on it.
- `agent-nemi-w0-app-build`: apps/web as @avel/web: the TanStack Start app config, its dependencies, the token stylesheet from the design library, and the root route shell with the theme cookie (UI contract section 6). No screens.
- `agent-nemi-w0-fonts-build`: The IBM Plex Mono 500 preload in the root route's head, beside Inter Variable's (UI contract section 6; Frontend Map v0.6 line 289).
- `agent-zero-w0-fonts-review-frontend`: Review the w0-fonts diff against UI contract section 6's font bullets.
- `agent-nemi-w0-split-build`: The route split: @avel/web's package.json declares "sideEffects": ["**/*.css"], so TanStack Start's code splitter puts each route's screen in its own chunk (UI contract section 5, 'The route split'; section 6).
- `agent-zero-w0-split-review-frontend`: Review the w0-split diff against UI contract sections 5 ('The route split') and 6.
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
- `agent-zero-decisions-review-frontend`: Review the decisions module against UI contract section 5.
- `agent-brennan-decisions-review-spec`: Review the approval page against CR-W2 and UI contract section 5.
- `agent-leah-decisions-review-a11y-perf`: Review the approval page on a phone: labels, focus, 44px targets, the reason dialog at 390px, and that the route's JavaScript stays light.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### LEON-01: api.ts (route 52's infiniteOptions with parsePendingPage, route 54's mutation with the key in the client context), decisions.ts (section 5.1's row mapping), screens/DecisionsScreen.tsx, index.ts, screens.ts, and routes/index.tsx with ssr true and the loader (P0)

- **Required:** The locked UC-11, UC-12 and UC-26 pass
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/modules/decisions`
- **Expected:** typechecks; those tests pass

### LEON-02: Deciding (section 5.2), every error and list state (sections 5.3 and 5.4), and the contract version banner (5.5) (P0)

- **Required:** Every locked UC-11 to UC-31 passes; a stale version is never re-sent
- **Verify:** `pnpm --filter @avel/web exec vitest run test/modules/decisions && pnpm --filter @avel/web exec playwright test`
- **Expected:** all locked tests pass

### LEON-03: Attempt a2: the module's styles as a static stylesheet, modules/decisions/decisions.css; screens.ts exports decisionsScreenStylesheets (kitStylesheetHref and the module's ?url), linked by route /'s head; ReasonDialog loaded with React.lazy and fetched once the list has rendered (section 5, 'Styles and loading') (P0)

- **Required:** No CSS written in JS in the module; both sheets in the server's HTML of /; ReasonDialog in its own chunk, outside /'s first load (section 8); every locked test still passes
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/modules/decisions && pnpm --filter @avel/web exec playwright test && pnpm --filter @avel/web build 2>&1 | grep -E 'gzip' | tail -12`
- **Expected:** typechecks; the locked tests pass; the chunk sizes and /'s first load as section 8 counts it, which you report

### LEON-04: Attempt a2: the hydration marker, data-hydrated="true" on the DecisionsPage root once hydrated, read with useSyncExternalStore (server snapshot false), absent from the server's HTML (section 5, revision 9) (P0)

- **Required:** No hydration mismatch warning; the server's HTML of / has no data-hydrated; the hydrated page has it; Fenn's e2e a2 passes
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/modules/decisions && pnpm --filter @avel/web exec playwright test`
- **Expected:** typechecks; the locked tests pass, end to end included

**Notes:**

- Attempt a2 (2026-11-07): fix what a1 left PARTIAL, then the third and fourth tasks: the module's styles and the lazy ReasonDialog (decisions.md, 'Revision 7'), and the hydration marker (revision 9). Start after Fantem's w0-kit a2 is merged: it gives you kit.css and kitStylesheetHref. a1's Deviations 1 to 4 are accepted and now in the contract (section 5, 5.3, 5.4). Deviation 3 stays as built until Ghost's follow-up adds message to UiError.
- Leah's review of a1 (revision 9; report and findings on main at 3d3ccfc, in Context). Yours: link kit.css and decisions.css from /'s head so the server's HTML carries them (findings 02 and 04: with kit.css linked, HashChip draws in Mono 500 on first paint), the lazy ReasonDialog, and the hydration marker (finding 03). Not yours, and don't work around them in decisions.css: the 44px tap targets, the 16px input and the dialog's aria-describedby are the kit's (Fantem's w0-kit a3, section 4, K1 and R5); Fenn's end-to-end a2 waits for your marker; Nemi's w0-split makes the route split real; zod/mini is Ghost's, after Axis's S1-6.
- Your end-to-end run needs Fenn's e2e a2 and Fantem's w0-kit a3 on main, and your chunk sizes need Nemi's w0-split. INT dispatches you once they're merged. If one isn't when you reach the verify, run what you can, say which wasn't merged, and report the failures it explains under Limitations.
- The budget: report /'s first load as section 8 counts it (every JS file / loads, gzipped and summed, without the lazy dialog's chunk). Over 160 kB isn't yours to fix in a2: zod/mini is the cut that clears it.

## 5. Territory

**You may change only:**

- `apps/web/src/modules/decisions/**`
- `apps/web/src/routes/index.tsx`
- `docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/package.json` (NEMI)
- `apps/web/playwright.config.ts` (FENN, locked tests)
- `apps/web/src/data/**` (GHOST)
- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/lib/**` (GHOST)
- `apps/web/src/router.tsx` (GHOST)
- `apps/web/src/routes/__root.tsx` (NEMI)
- `apps/web/src/styles/**` (NEMI)
- `apps/web/test/data/**` (FENN, locked tests)
- `apps/web/test/kit/**` (FENN, locked tests)
- `apps/web/test/modules/decisions/**` (FENN, locked tests)
- `apps/web/test/setup/**` (FENN, locked tests)
- `apps/web/vitest.config.ts` (FENN, locked tests)
- `apps/web/{vite.config.ts,tsconfig.json,.gitignore}` (NEMI)
- `packages/contract-mock/**` (GHOST)
- `packages/server/**` (the other team)
- `packages/db/**` (the other team)
- `packages/contract/**` (the other team)
- `.claude/**` and `docs/agent-dispatch/**` apart from your report (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Before you change anything, for every chain or task:**
1. Read the vector end to end: what calls this, what it calls, what breaks if it changes.
2. Read 3 to 5 files beside the place you'll change. Match their naming, error handling, imports and signatures exactly. You match the codebase; the codebase doesn't match you.
3. Find every caller and callee of what you change. Know the blast radius first.
4. List the failure modes (empty input, concurrent access, timeouts, partial failure) and handle each one.

**While you work:**
- Keep changes surgical: the task, nothing around it. No refactors, no unassigned features, no TODO placeholders, no swallowed errors.
- Never edit a locked test. If a locked test looks wrong, stop and say so under Deviations in your report; don't change it.
- Run the build and the tests after each meaningful change.

**After each chain or task:** run every command in Part 7's verification. If one fails, fix it before you move on. If it still fails after 3 different approaches, **park** it: write what you tried under Parked chains, commit, and go to the next. Never pile up broken chains.

**A P0 you weren't asked about** (data loss, a security hole, a race, broken auth): stop, write it under P0 discoveries with the full trace, commit what you have. Don't fix anything outside your territory.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm --filter "@avel/web..." build
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
pnpm lint
pnpm --filter @avel/web test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# LEON: decisions build, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| LEON-01 | DONE / PARKED / BLOCKED | |
| LEON-02 | DONE / PARKED / BLOCKED | |
| LEON-03 | DONE / PARKED / BLOCKED | |
| LEON-04 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "LEON decisions build a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are LEON on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-leon-decisions-build. Branch: frontend/sprint-01/agent-leon-decisions-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- LEON-01: api.ts (route 52's infiniteOptions with parsePendingPage, route 54's mutation with the key in the client context), decisions.ts (section 5.1's row mapping), screens/DecisionsScreen.tsx, index.ts, screens.ts, and routes/index.tsx with ssr true and the loader
- LEON-02: Deciding (section 5.2), every error and list state (sections 5.3 and 5.4), and the contract version banner (5.5)
- LEON-03: Attempt a2: the module's styles as a static stylesheet, modules/decisions/decisions.css; screens.ts exports decisionsScreenStylesheets (kitStylesheetHref and the module's ?url), linked by route /'s head; ReasonDialog loaded with React.lazy and fetched once the list has rendered (section 5, 'Styles and loading')
- LEON-04: Attempt a2: the hydration marker, data-hydrated="true" on the DecisionsPage root once hydrated, read with useSyncExternalStore (server snapshot false), absent from the server's HTML (section 5, revision 9)

You may change only: apps/web/src/modules/decisions/**, apps/web/src/routes/index.tsx, docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
