# NEMI: w0-app build

Frontend sprint-01 · step 1 · The minimal approval page on the contract mock, with the thin W0 slice under it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** NEMI, as `.claude/agents/nemi.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-nemi-w0-app-build` (build), module `w0-app`.
- **Your branch:** `frontend/sprint-01/agent-nemi-w0-app-build-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-01-agent-nemi-w0-app-build-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** at once (no test dispatch in this module); after `agent-brennan-approvals-uic-review-spec`, `backend/sprint-00/agent-axis-m1-contract-api-contract` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/nemi.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
4. `docs/design/CR-W2 Pending decisions.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
9. `docs/ui-contracts/decisions-approval-page.md`: section 6: the package, its dependencies, the tokens, the shell and vite.config
10. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: the token stylesheet (between 'Theme-independent AVEL tokens' and 'Base element defaults'), fonts, Light and Night
11. `docs/design/AVEL Web App — Frontend Map v0.6.md`: Rendering and SSR (one origin, the theme cookie, selective SSR), Folder layout
12. `pnpm-lock.yaml`: the exact @orpc/contract and zod versions packages/contract pins (backend D36's merge note)
13. `docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build.md`: this task doc: follow it exactly

## 3. Domain

apps/web as @avel/web: the TanStack Start app config, its dependencies, the token stylesheet from the design library, and the root route shell with the theme cookie (UI contract section 6). No screens.

**The rest of this sprint:**

- `agent-brennan-approvals-uic-review-spec`: Review the UI contract docs/ui-contracts/decisions-approval-page.md, as at your start commit, against CR-W2, the Frontend Map v0.6, the design library and backend m1's packages/contract, before anything is built on it.
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
- `agent-leah-size-study-review-a11y-perf`: A size study of /'s first-load JavaScript: measure each way of cutting it on a scratch copy of the page, and report each one's saving, cost and risk, so INT can set sprint-01's budget and choose what to build.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### NEMI-01: apps/web/package.json (@avel/web) with exactly section 6's dependencies at pinned versions (oRPC and zod at packages/contract's exact versions), tsconfig.json extending tsconfig.base.json for a DOM and JSX app, vite.config.ts with TanStack Start, Tailwind v4, __AVEL_CONTRACT_VERSION__ and the AVEL_API=mock dev middleware (/api and /__mock), and .gitignore for the generated route tree (P0)

- **Required:** pnpm install resolves; the route tree is generated before typecheck and build; no dependency outside section 6
- **Verify:** `pnpm install && pnpm --filter @avel/web typecheck && pnpm --filter @avel/web build`
- **Expected:** each exits 0

### NEMI-02: apps/web/src/styles/tokens.css: the design library's token stylesheet, every declaration under the same selectors with the same value, plus the Tailwind @theme mapping that reads them (P0)

- **Required:** Every name and value pair in the library's token section is in apps/web/src/styles; nothing invented
- **Verify:** `python3 -I -c "import re,glob,sys;c=re.search(r'<style[^>]*>(.*?)</style>',open('docs/design/AVEL Enclosure Grid · Design library v1.1.html',encoding='utf-8').read(),re.S).group(1);c=c[c.index('Theme-independent AVEL tokens'):c.index('Base element defaults')];p=lambda t:{(k,' '.join(v.split())) for k,v in re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+);',re.sub(r'/\*.*?\*/','',t,flags=re.S))};L=p('/*'+c);W=set().union(set(),*[p(open(f).read()) for f in glob.glob('apps/web/src/styles/**/*.css',recursive=True)]);m=sorted(L-W);print(len(L),'library tokens,',len(m),'missing',m[:5]);sys.exit(1 if m else 0)"`
- **Expected:** 533 library tokens, 0 missing []

### NEMI-03: apps/web/src/routes/__root.tsx: the html shell, data-theme from the avel-theme cookie on the server before first paint (default light), the two fonts, the QueryClient from the router context, and an Outlet (P1)

- **Required:** No theme flash: the server's HTML already carries data-theme
- **Verify:** `pnpm --filter @avel/web build && grep -rl 'data-theme' apps/web/src/routes/__root.tsx`
- **Expected:** builds; the file is listed

**Notes:**

- The package scripts are build, typecheck (generate the route tree first) and test (vitest run). Fenn owns apps/web/vitest.config.ts and apps/web/playwright.config.ts; don't create them.
- Ghost owns apps/web/src/router.tsx and imports your vite config's route tree; Leon owns apps/web/src/routes/index.tsx.
- pnpm-lock.yaml isn't in your territory (escalation 01): run pnpm install so your commands work, but don't commit the lockfile. List the dependencies you added, with their resolved versions, under Contract to files.

## 5. Territory

**You may change only:**

- `apps/web/{tsconfig.json,.gitignore}`
- `apps/web/src/styles/{tokens.css,base.css,fonts.css}`
- `apps/web/src/styles/fonts/**`
- `docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md`

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
- `apps/web/src/styles/{app.css,font-fallbacks.css}` (NEMI)
- `apps/web/test/data/**` (FENN, locked tests)
- `apps/web/test/kit/**` (FENN, locked tests)
- `apps/web/test/modules/decisions/**` (FENN, locked tests)
- `apps/web/test/setup/**` (FENN, locked tests)
- `apps/web/vitest.config.ts` (FENN, locked tests)
- `apps/web/{package.json,vite.config.ts}` (NEMI)
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

**Report.** Write `docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# NEMI: w0-app build, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| NEMI-01 | DONE / PARKED / BLOCKED | |
| NEMI-02 | DONE / PARKED / BLOCKED | |
| NEMI-03 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "NEMI w0-app build a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are NEMI on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-nemi-w0-app-build. Branch: frontend/sprint-01/agent-nemi-w0-app-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- NEMI-01: apps/web/package.json (@avel/web) with exactly section 6's dependencies at pinned versions (oRPC and zod at packages/contract's exact versions), tsconfig.json extending tsconfig.base.json for a DOM and JSX app, vite.config.ts with TanStack Start, Tailwind v4, __AVEL_CONTRACT_VERSION__ and the AVEL_API=mock dev middleware (/api and /__mock), and .gitignore for the generated route tree
- NEMI-02: apps/web/src/styles/tokens.css: the design library's token stylesheet, every declaration under the same selectors with the same value, plus the Tailwind @theme mapping that reads them
- NEMI-03: apps/web/src/routes/__root.tsx: the html shell, data-theme from the avel-theme cookie on the server before first paint (default light), the two fonts, the QueryClient from the router context, and an Outlet

You may change only: apps/web/{tsconfig.json,.gitignore}, apps/web/src/styles/{tokens.css,base.css,fonts.css}, apps/web/src/styles/fonts/**, docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
