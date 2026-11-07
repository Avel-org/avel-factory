# FANTEM: w0-kit build

Frontend sprint-01 · step 1 · The minimal approval page on the contract mock, with the thin W0 slice under it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** FANTEM, as `.claude/agents/fantem.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-fantem-w0-kit-build` (build), module `w0-kit`.
- **Your branch:** `frontend/sprint-01/agent-fantem-w0-kit-build-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-01-agent-fantem-w0-kit-build-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** once `agent-fenn-w0-kit-test-unit` is merged and listed in `locks.md`; after `agent-nemi-w0-app-build` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/fantem.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
4. `docs/design/CR-W2 Pending decisions.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
9. `docs/ui-contracts/decisions-approval-page.md`: section 0's value rule, and section 4: the components, the props ported and left out, and changes R1 to R4, E1, W1 and D1 to D14
10. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: each component's source, states and copy (search its data-ui name), and the tokens
11. `docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build.md`: this task doc: follow it exactly

## 3. Domain

The kit components the page needs, ported from the design library with UI contract section 4's changes: Button, Tag, Icon, StatusGlyph, HashChip, ReasonDialog, ErrorPanel, WidgetState and DecisionTag.

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
- `agent-zero-w0-kit-review-frontend`: Review the kit against UI contract section 4 and the design library.
- `agent-brennan-w0-kit-review-spec`: Review the kit against UI contract section 4 and the design library.
- `agent-fenn-decisions-test-unit`: The approval page's screen tests on the contract mock: UC-11 to UC-28.
- `agent-fenn-decisions-test-e2e`: The approval page end to end with Playwright on AVEL_API=mock, phone and desk: UC-29 to UC-31.
- `agent-leon-decisions-build`: The decisions module and its route: the approval page at /, exactly as UI contract section 5 gives it.
- `agent-zero-decisions-review-frontend`: Review the decisions module against UI contract section 5.
- `agent-brennan-decisions-review-spec`: Review the approval page against CR-W2 and UI contract section 5.
- `agent-leah-decisions-review-a11y-perf`: Review the approval page on a phone: labels, focus, 44px targets, the reason dialog at 390px, and that the route's JavaScript stays light.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### FANTEM-01: Button, Tag, Icon, StatusGlyph, HashChip, ReasonDialog (R1 to R4), ErrorPanel (E1), WidgetState (W1): DL's, with section 4's props, exported by name from apps/web/src/kit/index.ts (P0)

- **Required:** The locked UC-09 and UC-10 pass; every value is a token or DL's own literal for that element (section 0)
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/kit`
- **Expected:** typechecks; UC-08 passes

### FANTEM-02: DecisionTag with DecisionTagProps exactly as section 4 gives them, and changes D1 to D14 from the library (P0)

- **Required:** The locked UC-08 passes; the stamp uses --av-d-punch, and the hole fill isn't animated under reduced motion (D12)
- **Verify:** `pnpm --filter @avel/web exec vitest run test/kit`
- **Expected:** the locked tests pass

### FANTEM-03: Attempt a2: the kit's styles as one static stylesheet, apps/web/src/kit/kit.css, exported as kitStylesheetHref from kit/index.ts; KitStyles.tsx and every CSS string and style object moved there, with the same values; inline style only for per-render values and the values the locked tests read (D11's grid, D6's strike) (P0)

- **Required:** No CSS written in JS and no <style> rendered by the kit; values unchanged (section 0); the locked UC-08 to UC-10 pass unchanged
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/kit && test -f apps/web/src/kit/kit.css && ! grep -rlE '<style|KitStyles|dangerouslySetInnerHTML' apps/web/src/kit && pnpm --filter @avel/web build 2>&1 | grep -E 'gzip' | tail -12`
- **Expected:** typechecks; the locked kit tests pass; kit.css exists; no file listed; the chunk sizes, which you report against INT's split (Button 5.2 kB, DecisionTag 5.3 kB gzip)

### FANTEM-04: Attempt a3: K1 in kit.css under @media (max-width: 899px), Button at least var(--av-touch-min) tall, HashChip's copy and the dialog's Close button with a tap area of at least var(--av-touch-min) square and their drawn size unchanged, ReasonDialog's textarea at var(--av-phone-body); R5, the Dialog frame's aria-describedby naming its description when there is one (P1)

- **Required:** No new literal values (section 0); nothing changes at 900px and over; no CSS in JS; the locked UC-08 to UC-10 pass unchanged
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/kit && grep -n 'max-width: 899px\|--av-touch-min\|--av-phone-body' apps/web/src/kit/kit.css && grep -n 'aria-describedby' apps/web/src/kit/Dialog.tsx && ! grep -rlE '<style|dangerouslySetInnerHTML' apps/web/src/kit`
- **Expected:** typechecks; the locked kit tests pass; the K1 rules listed; Dialog's aria-describedby listed; no file listed; the measurements, which you report

**Notes:**

- The library's components are bundled in its HTML: find each by its data-ui name. Port them to TypeScript with Tailwind classes or style objects that read --av-* tokens only.
- Attempt a2 (2026-11-07, INT's build split of Leon's branch): the first two tasks are merged (a1). Do only the third, the kit's styles moved to apps/web/src/kit/kit.css (UI contract section 4, 'The kit's styles'; decisions.md, 'Revision 7'). Button's and DecisionTag's style strings are most of their gzipped size. Keep every value; change where it lives. The locked kit tests must still pass unchanged. If one can't without CSS in JS, stop and report it under Deviations.
- Attempt a3 (2026-11-07, revision 9; Leah's decisions a11y-perf a1, finding 02, on main at 3d3ccfc): a1 and a2 are merged. Do only the fourth task, K1 and R5 in section 4. Values come from DL's tokens only: --av-touch-min (44px) and --av-phone-body (16px), under @media (max-width: 899px). DL sets them through [data-density="phone"], which nothing in sprint-01 sets, and the dialog draws in a portal on body, so a page attribute wouldn't reach it. Don't add a data-density attribute.
- For the copy and Close buttons, the tap area grows and the drawn size doesn't: a row or chip that gets taller is a defect. Say in your report how you made the area and how you measured it (for example document.elementFromPoint at 21px from the button's centre, at 390x844).

## 5. Territory

**You may change only:**

- `apps/web/src/kit/**`
- `docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/package.json` (NEMI)
- `apps/web/playwright.config.ts` (FENN, locked tests)
- `apps/web/src/data/**` (GHOST)
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

**Report.** Write `docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# FANTEM: w0-kit build, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FANTEM-01 | DONE / PARKED / BLOCKED | |
| FANTEM-02 | DONE / PARKED / BLOCKED | |
| FANTEM-03 | DONE / PARKED / BLOCKED | |
| FANTEM-04 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "FANTEM w0-kit build a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are FANTEM on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-fantem-w0-kit-build. Branch: frontend/sprint-01/agent-fantem-w0-kit-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FANTEM-01: Button, Tag, Icon, StatusGlyph, HashChip, ReasonDialog (R1 to R4), ErrorPanel (E1), WidgetState (W1): DL's, with section 4's props, exported by name from apps/web/src/kit/index.ts
- FANTEM-02: DecisionTag with DecisionTagProps exactly as section 4 gives them, and changes D1 to D14 from the library
- FANTEM-03: Attempt a2: the kit's styles as one static stylesheet, apps/web/src/kit/kit.css, exported as kitStylesheetHref from kit/index.ts; KitStyles.tsx and every CSS string and style object moved there, with the same values; inline style only for per-render values and the values the locked tests read (D11's grid, D6's strike)
- FANTEM-04: Attempt a3: K1 in kit.css under @media (max-width: 899px), Button at least var(--av-touch-min) tall, HashChip's copy and the dialog's Close button with a tap area of at least var(--av-touch-min) square and their drawn size unchanged, ReasonDialog's textarea at var(--av-phone-body); R5, the Dialog frame's aria-describedby naming its description when there is one

You may change only: apps/web/src/kit/**, docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
