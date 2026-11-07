# GHOST: w0-data build

Frontend sprint-01 · step 1 · The minimal approval page on the contract mock, with the thin W0 slice under it

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** GHOST, as `.claude/agents/ghost.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-ghost-w0-data-build` (build), module `w0-data`.
- **Your branch:** `frontend/sprint-01/agent-ghost-w0-data-build-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/frontend-sprint-01-agent-ghost-w0-data-build-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** once `agent-fenn-w0-data-test-unit` is merged and listed in `locks.md`; after `agent-nemi-w0-app-build`, `backend/sprint-00/agent-axis-m1-contract-api-contract` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/ghost.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/ui-contracts/decisions-approval-page.md`: this sprint's source
4. `docs/design/CR-W2 Pending decisions.md`: this sprint's source
5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: this sprint's source
6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: this sprint's source
7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: this sprint's source
8. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
9. `docs/ui-contracts/decisions-approval-page.md`: sections 1 to 3: the interim row schema, the mock's surface and rules, the data core's exports and UiError
10. `docs/design/CR-W2 Pending decisions.md`: sections 1 to 6: ref, the row, ProposalOptions, route 54's checks in order, the list order
11. `packages/contract/src/routes/decisions.ts`: routes 52 to 54 as m1 defines them
12. `packages/contract/src/errors.ts`: the error map and each code's data
13. `docs/design/AVEL Web App — Frontend Map v0.6.md`: Data layer (the client, writes, errors by code) and Rendering and SSR (getRouter)
14. `docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build.md`: this task doc: follow it exactly

## 3. Domain

The web's data core (apps/web/src/data, apps/web/src/lib, apps/web/src/router.tsx) and the contract mock @avel/contract-mock for routes 52 to 54, exactly as UI contract sections 1 to 3 name them.

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

### GHOST-01: packages/contract-mock: createMock with the exact surface in section 2 (failNext written raw with times, remove, MOCK_OPERATOR_ID), routes 52 to 54 through the contract (route 54 answers 201), every error as m1's ErrorBody (BAD_REQUEST details { field, issues }, S1-3), both response headers, the idempotency rules, route 54's checks in CR-W2's order (check 1 the schema check only; the path's proposalId wins, S1-5), every request recorded (failed ones too), the dev-only bump and reset paths, and fixtures empty, step1 and many (P0)

- **Required:** The locked UC-01 to UC-03 pass
- **Verify:** `pnpm --filter @avel/contract-mock typecheck && pnpm --filter @avel/web exec vitest run test/data`
- **Expected:** typechecks; the locked tests pass

### GHOST-02: apps/web/src/data and lib: createApiClient with its fetch wrapper (X-Request-Id, Idempotency-Key, NetworkError, the browser-only X-Contract-Version check) and decodeErrorBody as OpenAPILink's customErrorResponseBodyDecoder, createApi, bindApi, apiFor and useApi, BUILT_CONTRACT_VERSION and useContractMismatch, newIdempotencyKey, ApiError, NetworkError and toUiError's four branches (section 3, 'Reading an error') with section 3's UiError, createQueryClient with retryDelay, the CR-W2 row schemas, parsePendingPage (one page) and selectPendingPages (route 52's infinite select), formatAgo and formatClock; apps/web/src/router.tsx with getRouter (per request on the server, forwarding the incoming X-Request-Id) (P0)

- **Required:** The locked UC-01 and UC-04 to UC-07 pass, including UC-04's round trip: STALE_VERSION through createApiClient is stale, never conflict
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/data`
- **Expected:** typechecks; the locked tests pass

### GHOST-03: Attempt a2: no classic zod in apps/web/src (UI contract section 3, 'Which zod the web may import'). data/pending-decisions.ts written in zod/mini with the same fields, parse results and issue paths; client.ts's type import from zod/mini; decodeErrorBody keeps ErrorBody from @avel/contract/errors (P0)

- **Required:** No runtime or type import of "zod" or "zod/v4" under apps/web/src; the locked w0-data tests pass unchanged; the first load of / (every JS file it loads, gzipped and summed, section 8) is lower than before, by the amount you report
- **Verify:** `! grep -rnE "from ['\"]zod(/v4)?['\"]" apps/web/src && pnpm --filter "@avel/web..." typecheck && pnpm --filter @avel/web exec vitest run test/data && pnpm --filter "@avel/web..." build 2>&1 | grep -E 'client/assets/.*js'`
- **Expected:** no line listed; typechecks; the locked tests pass; the client chunks, with /'s first load before and after (measure main's build first), which you report

### GHOST-04: Attempt a2 (Zane's w0-data 03): router.tsx's getRouter() forwards the incoming X-Request-Id only if it's a UUID or matches ^[A-Za-z0-9-]{1,64}$; otherwise no requestId, so the fetch wrapper makes a new one (section 3, 'On the server') (P2)

- **Required:** A valid incoming ID is still forwarded as before; an empty, 65-character, or control-character value isn't; the locked w0-data tests pass unchanged
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/data && grep -n 'A-Za-z0-9-' apps/web/src/router.tsx`
- **Expected:** typechecks; the locked tests pass; the check listed, with how you exercised a forged value, which you report

### GHOST-05: Attempt a2: UiError's stale member carries message: string, the ErrorBody's message, or "" when the body isn't an ErrorBody (section 3's UiError table) (P2)

- **Required:** toUiError sets it on every stale; nothing else in UiError changes; the locked w0-data tests pass unchanged
- **Verify:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/data && pnpm --filter @avel/web exec vitest run test/modules/decisions`
- **Expected:** typechecks; the locked w0-data tests pass; the decisions tests are as they were before your change (report any that changed)

**Notes:**

- The mock serves the contract through oRPC's OpenAPI handler over @avel/contract, so a mistake shows up as a type error, not drift.
- packages/contract-mock has its own package.json and tsconfig.json (yours). Its dependencies: @avel/contract and @orpc/server and @orpc/openapi at the contract's oRPC version, and zod at the contract's.
- pnpm-lock.yaml isn't in your territory (escalation 01): run pnpm install so your commands work, but don't commit the lockfile. List the dependencies you added, with their resolved versions, under Contract to files.
- Two things to confirm once installed, each a stop-and-report under Deviations if it doesn't hold: OpenAPILink in @orpc/openapi-client 1.16.2 calls customErrorResponseBodyDecoder(deserializedBody, response) before its own error decoding and throws what it returns (Zero read it in dist/shared/openapi-client.DgkI_tTF.mjs); and getRouter() can read the incoming request on the server through TanStack Start's request accessor inside createIsomorphicFn().server(). Name the accessor you used in your report.
- The web calls the mock's route 54 with the body { version, choice, reason }: OpenAPILink drops path parameters from the body (contract section 1). The path's proposalId wins and a body copy is ignored, as oRPC's handler merges path over body (Axis S1-5, D48): don't read the raw body, and check 1 is the schema check only.
- Attempt a2 (2026-11-07, revision 9; INT's decision 4, S1-6's web side): the first two tasks are merged (a1). Do only the third. Start after Axis's S1-6 (@avel/contract on zod/mini, backend sprint-01) is merged on main: check that git grep -nE "from ['\"]zod['\"]" packages/contract/src lists nothing before you start, and if it does, stop and report. The two halves land together because either one on classic zod brings all of it back (backend sprint-01 decisions.md, S1-6).
- Axis's S1-6 spike notes for you (backend sprint-01 decisions.md, S1-6, 'The spike's notes for Ghost'): data/client.ts's type-level SchemaInput/SchemaOutput use z.ZodType, whose mini name is z.ZodMiniType (or take $ZodType from zod/v4/core, which accepts both); in pending-decisions.ts, .regex() becomes .check(z.regex(...)), .optional()/.nullable() become z.optional(x)/z.nullable(x), and .min(1) on an int becomes .check(z.minimum(1)). The spike measured both halves together at 156.28 kB gzip (from 173.53).
- a2 also takes two earmarked follow-ups (INT, 2026-11-07; decisions.md, 'Ghost's w0-data a2 scope'), as the fourth and fifth tasks: Zane's w0-data finding 03 (findings/w0-data-zane-03-forwarded-request-id-unvalidated.md: getRouter() forwards the incoming X-Request-Id only if it's a UUID or matches ^[A-Za-z0-9-]{1,64}$, else passes none so the wrapper makes one; contract section 3, 'On the server'), and UiError.stale.message (section 3's UiError table: the ErrorBody's message, or "" when the body isn't an ErrorBody; Revision 7, Leon's deviation 3). The locked w0-data tests match UiError with toMatchObject, so an added field doesn't break them. If one does, stop and report it. Tasks 4 and 5 don't wait for S1-6: if S1-6 isn't merged when you start, do them first and say so. packages/contract-mock and apps/web/test aren't in the browser's bundle, so section 3's rule doesn't cover them: leave them as they are unless they stop typechecking.

## 5. Territory

**You may change only:**

- `apps/web/src/data/**`
- `apps/web/src/lib/**`
- `apps/web/src/router.tsx`
- `packages/contract-mock/**`
- `docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md`

**You may not change:**

- `apps/web/e2e/**` (FENN, locked tests)
- `apps/web/package.json` (NEMI)
- `apps/web/playwright.config.ts` (FENN, locked tests)
- `apps/web/src/kit/**` (FANTEM)
- `apps/web/src/modules/decisions/**` (LEON)
- `apps/web/src/routes/__root.tsx` (NEMI)
- `apps/web/src/routes/index.tsx` (LEON)
- `apps/web/src/styles/**` (NEMI)
- `apps/web/test/data/**` (FENN, locked tests)
- `apps/web/test/kit/**` (FENN, locked tests)
- `apps/web/test/modules/decisions/**` (FENN, locked tests)
- `apps/web/test/setup/**` (FENN, locked tests)
- `apps/web/vitest.config.ts` (FENN, locked tests)
- `apps/web/{vite.config.ts,tsconfig.json,.gitignore}` (NEMI)
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

**Report.** Write `docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# GHOST: w0-data build, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| GHOST-01 | DONE / PARKED / BLOCKED | |
| GHOST-02 | DONE / PARKED / BLOCKED | |
| GHOST-03 | DONE / PARKED / BLOCKED | |
| GHOST-04 | DONE / PARKED / BLOCKED | |
| GHOST-05 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "GHOST w0-data build a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are GHOST on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-ghost-w0-data-build. Branch: frontend/sprint-01/agent-ghost-w0-data-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- GHOST-01: packages/contract-mock: createMock with the exact surface in section 2 (failNext written raw with times, remove, MOCK_OPERATOR_ID), routes 52 to 54 through the contract (route 54 answers 201), every error as m1's ErrorBody (BAD_REQUEST details { field, issues }, S1-3), both response headers, the idempotency rules, route 54's checks in CR-W2's order (check 1 the schema check only; the path's proposalId wins, S1-5), every request recorded (failed ones too), the dev-only bump and reset paths, and fixtures empty, step1 and many
- GHOST-02: apps/web/src/data and lib: createApiClient with its fetch wrapper (X-Request-Id, Idempotency-Key, NetworkError, the browser-only X-Contract-Version check) and decodeErrorBody as OpenAPILink's customErrorResponseBodyDecoder, createApi, bindApi, apiFor and useApi, BUILT_CONTRACT_VERSION and useContractMismatch, newIdempotencyKey, ApiError, NetworkError and toUiError's four branches (section 3, 'Reading an error') with section 3's UiError, createQueryClient with retryDelay, the CR-W2 row schemas, parsePendingPage (one page) and selectPendingPages (route 52's infinite select), formatAgo and formatClock; apps/web/src/router.tsx with getRouter (per request on the server, forwarding the incoming X-Request-Id)
- GHOST-03: Attempt a2: no classic zod in apps/web/src (UI contract section 3, 'Which zod the web may import'). data/pending-decisions.ts written in zod/mini with the same fields, parse results and issue paths; client.ts's type import from zod/mini; decodeErrorBody keeps ErrorBody from @avel/contract/errors
- GHOST-04: Attempt a2 (Zane's w0-data 03): router.tsx's getRouter() forwards the incoming X-Request-Id only if it's a UUID or matches ^[A-Za-z0-9-]{1,64}$; otherwise no requestId, so the fetch wrapper makes a new one (section 3, 'On the server')
- GHOST-05: Attempt a2: UiError's stale member carries message: string, the ErrorBody's message, or "" when the body isn't an ErrorBody (section 3's UiError table)

You may change only: apps/web/src/data/**, apps/web/src/lib/**, apps/web/src/router.tsx, packages/contract-mock/**, docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
