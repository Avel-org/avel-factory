# ZERO: w0-app review-frontend

Frontend sprint-01 · step 1 · The minimal approval page on the contract mock, with the thin W0 slice under it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** ZERO, as `.claude/agents/zero.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-zero-w0-app-review-frontend` (review), module `w0-app`.
- **Your branch:** `frontend/sprint-01/agent-zero-w0-app-review-frontend-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-01-agent-zero-w0-app-review-frontend-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** once `agent-nemi-w0-app-build` has its completion report, checked out at its result commit.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/zero.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
4. `docs/design/CR-W2 Pending decisions.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
9. `docs/ui-contracts/decisions-approval-page.md`: section 6
10. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: the token stylesheet
11. `docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend.md`: this task doc: follow it exactly

## 3. Domain

Review apps/web's config, tokens and shell against UI contract section 6 and the design library.

**The rest of this sprint:**

- `agent-brennan-approvals-uic-review-spec`: Review the UI contract docs/ui-contracts/decisions-approval-page.md, as at your start commit, against CR-W2, the Frontend Map v0.6, the design library and backend m1's packages/contract, before anything is built on it.
- `agent-nemi-w0-app-build`: apps/web as @avel/web: the TanStack Start app config, its dependencies, the token stylesheet from the design library, and the root route shell with the theme cookie (UI contract section 6). No screens.
- `agent-nemi-w0-fonts-build`: The IBM Plex Mono 500 preload in the root route's head, beside Inter Variable's (UI contract section 6; Frontend Map v0.6 line 289).
- `agent-zero-w0-fonts-review-frontend`: Review the w0-fonts diff against UI contract section 6's font bullets.
- `agent-nemi-w0-split-build`: The route split: @avel/web's package.json declares "sideEffects": ["**/*.css"], so TanStack Start's code splitter puts each route's screen in its own chunk (UI contract section 5, 'The route split'; section 6).
- `agent-zero-w0-split-review-frontend`: Review the w0-split diff against UI contract sections 5 ('The route split') and 6.
- `agent-zane-w0-split-review-security`: Review w0-split a2's new build dependencies (@rolldown/plugin-babel, @babel/core, babel-plugin-react-compiler) and its server-function stub: the stub never reaches the server build, and a server function can't be added without the build failing.
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

### ZERO-01: Review the w0-app diff: the dependency list is exactly section 6's, tokens are the library's, the theme cookie is read on the server, nothing outside the territory (P1)

- **Verify:** `pnpm install && pnpm --filter @avel/web build && python3 -I -c "import re,glob,sys;c=re.search(r'<style[^>]*>(.*?)</style>',open('docs/design/AVEL Enclosure Grid · Design library v1.1.html',encoding='utf-8').read(),re.S).group(1);c=c[c.index('Theme-independent AVEL tokens'):c.index('Base element defaults')];p=lambda t:{(k,' '.join(v.split())) for k,v in re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+);',re.sub(r'/\*.*?\*/','',t,flags=re.S))};L=p('/*'+c);W=set().union(set(),*[p(open(f).read()) for f in glob.glob('apps/web/src/styles/**/*.css',recursive=True)]);m=sorted(L-W);print(len(L),'library tokens,',len(m),'missing',m[:5]);sys.exit(1 if m else 0)"`
- **Expected:** builds; 533 library tokens, 0 missing []

## 5. Territory

**You may change only:**

- `docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md`
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zero-*.md`

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
- `apps/web/src/styles/**` (NEMI)
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

**Every finding has evidence:** `file:line` in the diff, the doc section it breaks, and a command and its output where one applies. No evidence, no finding. One file per finding at `docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zero-*.md`, starting with `status: open`, a severity (P0 to P3), and what fixing it means.

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

**Report.** Write `docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# ZERO: w0-app review-frontend, completion report

verdict: PASS | FAIL

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE / PARKED / BLOCKED | |

## Findings
One line per finding file you wrote (`docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zero-*.md`): its path, severity and title. "none" if none.

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
scripts/tell.sh INT "ZERO w0-app review-frontend a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are ZERO on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zero-w0-app-review-frontend. Branch: frontend/sprint-01/agent-zero-w0-app-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: Review the w0-app diff: the dependency list is exactly section 6's, tokens are the library's, the theme cookie is read on the server, nothing outside the territory

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
