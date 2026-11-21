---
doc: agent-fantem-t-f14-build
ticket: T-F14
lane: frontend
sprint: sprint-12
agent: fantem
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/F14-data-layer-seam
checkout: branch
after: [agent-fenn-t-f14-test-e2e]
depends_on: [T-F10]
report: docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f14-build-completion.md
---


# T-F14 · build · Fantem: The data layer, and one source per screen group

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-12 · Step 1 |
| Ticket | T-F14 · rigor full |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F14-data-layer-seam` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-12/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/login.md`: the sign-in UI contract: the wire, the guard, /login, sign-out, the mock, the LG scenarios
6. `docs/design/CR-W29 The control room from the design export.md`: E14 (sign-in first), E16 and decision 6 (/'s budget), E4 (new code is TypeScript)
7. `docs/design/CR-W30 The web's auth wire and a minified contract.md`: A: the auth mock this ticket builds against
8. `docs/design/Step 0 and Step 1 plan.md`: item 5 (Better Auth: one operator, sign-up off, lockout), Rate limits, test 7
9. `apps/web/src/data/client.ts`: today's client over one route group with full schemas; it moves to the minified router and the whole contract
10. `packages/contract/src/minified.ts`: every route's key path, method, path, number, write and stepUp, with no schema (T-B11, CR-W30 D)
11. `packages/contract/src/errors.ts`: every error code the error map covers
12. `docs/ui-contracts/login.md`: section 2: the 401 rule (LG-06) and the expired notice T-F12 draws
13. `docs/ui-reference/control-room-handoff/screens.md`: each screen's routes and the words its states use
14. `apps/web/control-room/src/app/logic.js`: where each page's state is decided today (the valid states, c.w, worldErr and errCode, near renderVals' page state) and the sample imports that move into sources
15. `apps/web/e2e/budget.spec.ts`: / at most 235 KB gzipped, warning over 225 KB
16. `apps/web/test/data/**`: the locked acceptance tests: they define done
17. `apps/web/test/sources/**`: the locked acceptance tests: they define done
18. `apps/web/e2e/sources/**`: the locked acceptance tests: they define done
19. `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f14-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** Every contract route has a typed call, every error code a plain sentence, the event stream reconnects by itself, and an expired session sends you to Sign in once; the control room reads its data through one source module per screen group, and nothing on screen changes yet.

**Refs:**
- CR-W30 D (the minified router)
- E16 (the data layer from the minified contract)
- login.md section 2 (LG-06)
- handoff README, port order step 1 (the oRPC client, the event stream hook, the error map)
- Zero's re-plan, approved Nov 18: T-F13's client moves here

**Merged before this starts:** T-F10

**Notes from the lead:**
- The client: apps/web/src/data/client.ts covers every route in @avel/contract/minified (imported by that subpath only, never the package index), with no Zod schema in the browser bundle. One error map in src/data/errors.ts gives every code in errors.ts a plain sentence; where screens.md or a UI contract names a state's words, use them. The report lists each code and its sentence
- The door: control-room/src/lib/api.js is the export's only way to the client. lib/stream.js reads route 63 (GET /api/events/stream) through it, resumes with Last-Event-ID after a drop, backs off between tries, and marks the stream stalled when no event arrives within StatusDto.stallAfterMs (route 104). Time comes from an injected clock, so tests never sleep (F4). Nothing else polls (handoff README)
- The sources: control-room/src/sources/{decisions,missions,canon,plan,build,release}.js. Each owns the sample JSON its screens read today (the imports move out of logic.js, canon.js and operations.js, unchanged) and exposes the same values in the same shapes, plus a status: ready, loading, empty, or error with a code. logic.js decides each page's state from its source's status, through the state handling it already has (valid states, errCode, the skeleton). This ticket sets every source to the sample world, so every screen renders exactly as on main. Sprints 13 and 14's tickets each switch one source to the API and change only that source, its pages and their own changes file
- Which screens read which source: decisions (Decisions); missions (Clients, All projects, New project, the project overview and Progress); canon (Onboarding); plan (Plan, Dispatch); build (Live, Watch the work, the module page); release (Gates, Findings, Release, Receipt). Every other page keeps its sample imports where they are
- LG-06 lives in the data layer: on a 401 from any contract route it navigates once to /login?next={path, search and hash}&reason=expired with replace, and a burst of 401s makes one navigation. It reads nothing from __root and changes no route file: T-F12's /login draws the expired notice and its guard handles the rest. The end-to-end LG-06 check comes with the first screen that calls the API (T-F16)
- Log every export file this ticket changes, with its reason, in control-room/changes/T-F14.md (T-F12 adds the pointer in SOURCE.md)
- Budget: / doesn't grow. Copy budget.spec's / figure into the report and the PR text as a number. Over 235 KB, stop with needs-cr
- Review, full rigor (G7): Fenn, then the second review against docs/review/security-checklist.md, then Javaris merges. One review round (CR-42). The full-diff rule applies: every file in `git diff main...HEAD --name-only` is in this build's may-change list, this ticket's locked test files, its own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1
- Size: a full session (#45: 120 minutes, 150 turns). If the build can't finish, report blocked with what's done, the client and the error map first. Run only this ticket's specs while building; CI runs the whole suite

## 4. Tasks

### T-F14-01: make it true: unit (behaviour): the client's procedures equal @avel/contract/minified's routes, by number, method and path, and the built client chunk holds no Zod schema and doesn't import the package index

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F14-02: make it true: unit (behaviour): every code in packages/contract/src/errors.ts has a sentence in the error map, and none is the raw code or message

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F14-03: make it true: unit (behaviour): the stream reader parses route 63's events, resumes with Last-Event-ID after a drop, and reports stalled after stallAfterMs with no event, on a fake clock

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F14-04: make it true: unit (behaviour): LG-06, a 401 from a contract call navigates once to /login?next=...&reason=expired with replace, and three 401s at once make one navigation

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F14-05: make it true: unit (behaviour): no file under control-room/src/app or control-room/src/pages imports a mock JSON that a source owns, calls fetch, or imports src/data; only sources/** and lib/api.js do

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F14-06: make it true: unit (behaviour): each source in sample mode returns exactly the sample world's values its screens read today, with status ready

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F14-07: make it true: e2e (behaviour): forcing a source's status (a test hook in sources/) to loading, empty, and error with 404, 409 and 500 shows that screen's skeleton, empty state and error panel with the error map's sentence, for one screen of each source

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F14-08: make it true: e2e (guard): every screen in the page registry still opens with its title and no console error (T-F9's specs, unchanged), and / stays at most 235 KB

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/src/data/**`
- `apps/web/control-room/src/lib/api.js`
- `apps/web/control-room/src/lib/stream.js`
- `apps/web/control-room/src/sources/**`
- `apps/web/control-room/src/app/logic.js`
- `apps/web/control-room/src/app/canon.js`
- `apps/web/control-room/src/app/operations.js`
- `apps/web/control-room/src/app/decisions.js`
- `apps/web/control-room/changes/T-F14.md`
- `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f14-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/data/**`
- `apps/web/test/sources/**`
- `apps/web/e2e/sources/**`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/control-room/src/mock/**`
- `apps/web/control-room/src/pages/**`
- `apps/web/control-room/contract/**`
- `apps/web/control-room/SOURCE.md`
- `apps/web/src/auth/**`
- `apps/web/src/routes/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F12 | builds | `apps/web/src/auth/**`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/login.tsx`, `apps/web/src/routeTree.gen.ts`, `apps/web/control-room/src/pages/settings/SettingsPage.jsx`, `apps/web/control-room/SOURCE.md`, `apps/web/vite.config.ts` |
| T-F12 | tests | `apps/web/test/sign-in/**`, `apps/web/e2e/sign-in/**`, `apps/web/e2e/support/auth.setup.ts`, `apps/web/playwright.config.ts`, `apps/web/e2e/budget.spec.ts`, `apps/web/e2e/control-room/prod.spec.ts`, `apps/web/e2e/control-room-budget/**`, `apps/web/e2e/support/preview-auth.ts` |
| T-F22 | builds | `packages/contract-mock/src/**` |
| T-F22 | tests | `packages/contract-mock/test/mission-world.test.ts`, `packages/contract-mock/test/mission-routes.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F14`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f14-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F14
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F14, "The data layer, and one source per screen group": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f14-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F14-data-layer-seam`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f14-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/F14-data-layer-seam`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
