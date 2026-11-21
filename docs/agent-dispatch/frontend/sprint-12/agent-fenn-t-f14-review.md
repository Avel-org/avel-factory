---
doc: agent-fenn-t-f14-review
ticket: T-F14
lane: frontend
sprint: sprint-12
agent: fenn
seat: checker
kind: review
role: review
rigor: full
model: opus
branch: t/F14-data-layer-seam
checkout: detached
after: [agent-fantem-t-f14-build]
depends_on: [T-F10]
report: docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f14-review-completion.md
---


# T-F14 · review · Fenn: The data layer, and one source per screen group

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-12 · Step 1 |
| Ticket | T-F14 · rigor full |
| Dispatch | review · Fenn (checker) · model opus |
| Works on | a detached checkout of `t/F14-data-layer-seam`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
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
19. `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f14-build-completion.md`: the builder's completion report
20. `docs/review/security-checklist.md`: full rigor: work through it item by item
21. `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f14-review.md`: this document: follow it exactly

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
- Amended Nov 21 (Zero, before the lock; Fenn's tests report, Limitations): app/crew.js (Watch the work) imports operations.json, which a source owns, so it reads it through the build source like the other Watch the work data. That's the one change to crew.js; history.json stays where it is
- Budget: / doesn't grow. Copy budget.spec's / figure into the report and the PR text as a number. Over 235 KB, stop with needs-cr
- Review, full rigor (G7): Fenn, then the second review against docs/review/security-checklist.md, then Javaris merges. One review round (CR-42). The full-diff rule applies: every file in `git diff main...HEAD --name-only` is in this build's may-change list, this ticket's locked test files, its own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1
- Size: a full session (#45: 120 minutes, 150 turns). If the build can't finish, report blocked with what's done, the client and the error map first. Run only this ticket's specs while building; CI runs the whole suite

## 4. Tasks

### T-F14-01: check: unit (behaviour): the client's procedures equal @avel/contract/minified's routes, by number, method and path, and the built client chunk holds no Zod schema and doesn't import the package index

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-02: check: unit (behaviour): every code in packages/contract/src/errors.ts has a sentence in the error map, and none is the raw code or message

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-03: check: unit (behaviour): the stream reader parses route 63's events, resumes with Last-Event-ID after a drop, and reports stalled after stallAfterMs with no event, on a fake clock

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-04: check: unit (behaviour): LG-06, a 401 from a contract call navigates once to /login?next=...&reason=expired with replace, and three 401s at once make one navigation

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-05: check: unit (behaviour): no file under control-room/src/app or control-room/src/pages imports a mock JSON that a source owns, calls fetch, or imports src/data; only sources/** and lib/api.js do

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-06: check: unit (behaviour): each source in sample mode returns exactly the sample world's values its screens read today, with status ready

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-07: check: e2e (behaviour): forcing a source's status (a test hook in sources/) to loading, empty, and error with 404, 409 and 500 shows that screen's skeleton, empty state and error panel with the error map's sentence, for one screen of each source

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-08: check: e2e (guard): every screen in the page registry still opens with its title and no console error (T-F9's specs, unchanged), and / stays at most 235 KB

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F14-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).
- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f14-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-12/findings/t-f14-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/src/data/**`
- `apps/web/control-room/src/lib/api.js`
- `apps/web/control-room/src/lib/stream.js`
- `apps/web/control-room/src/sources/**`
- `apps/web/control-room/src/app/logic.js`
- `apps/web/control-room/src/app/canon.js`
- `apps/web/control-room/src/app/operations.js`
- `apps/web/control-room/src/app/decisions.js`
- `apps/web/control-room/src/app/crew.js`
- `apps/web/control-room/changes/T-F14.md`

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

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

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

**Your report:** `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f14-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
verdict: pass | changes | block
ticket: T-F14
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F14, "The data layer, and one source per screen group": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f14-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f14-review-completion.md`, left uncommitted. Don't push.
