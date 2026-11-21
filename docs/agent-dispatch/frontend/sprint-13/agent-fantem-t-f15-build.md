---
doc: agent-fantem-t-f15-build
ticket: T-F15
lane: frontend
sprint: sprint-13
agent: fantem
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/F15-e2e-production-build
checkout: branch
after: [agent-fenn-t-f15-test-e2e]
depends_on: [T-F12]
report: docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f15-build-completion.md
---


# T-F15 · build · Fantem: The end-to-end suite runs against the build you ship

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F15 · rigor full |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F15-e2e-production-build` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-13/codebase-analysis.md`: the codebase in short
5. `docs/ui-reference/control-room-handoff/screens.md`: every screen: its routes by number, its states and their words
6. `docs/ui-reference/control-room-handoff/README.md`: the rules that aren't obvious: Decisions is home, approvals never ask for a password, no money, nothing polls
7. `docs/design/API routes.md`: each route by number
8. `docs/ui-contracts/decisions-approval-page.md`: the decision card, Undo and the stale state
9. `apps/web/playwright.config.ts`: today's two web servers, both vite dev (with and without AVEL_API=mock); T-F12 added the sign-in setup project
10. `apps/web/vite.config.ts`: mockApi() already serves contract-mock in vite dev and vite preview under AVEL_API=mock (T-F12)
11. `.github/workflows/ci.yml`: the web e2e job
12. `docs/quarantine.md`: T-F7-05's row, removed when it's back
13. `docs/design/CR-W33 The web server reads the session at a configured origin.md`: the rule this ticket builds: the session read's origin from AVEL_API_ORIGIN, fail closed, dev and preview wiring
14. `apps/web/src/routes/__root.tsx`: readRoot reads the session at new URL(getRequest().url).origin today (lines 16 and 21): the Host-derived origin CR-W33 replaces
15. `apps/web/src/auth/api.ts`: getSession({ cookie, origin }): the one caller of get-session
16. `apps/web/e2e/control-room/routes.spec.ts`: the locked acceptance tests: they define done
17. `apps/web/e2e/control-room-screens/routes.ts`: the locked acceptance tests: they define done
18. `apps/web/e2e/e2e-build/**`: the locked acceptance tests: they define done
19. `apps/web/test/sign-in/origin.test.ts`: the locked acceptance tests: they define done
20. `apps/web/e2e/sign-in/sign-out-failure.spec.ts`: the locked acceptance tests: they define done
21. `apps/web/e2e/support/preview-auth.ts`: the locked acceptance tests: they define done
22. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f15-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** CI's end-to-end tests run against the production build, so a lazy page never waits on the dev server's first compile, and the suite gives the same answer every run; T-F7-05 is back from quarantine.

**Refs:**
- CR-W33 (accepted Nov 21 with Javaris's "Option b"): the guard's session read at AVEL_API_ORIGIN, from Axis's G7 P1 on #102 (t-f12-fenn-01)
- t-f12-fenn-02 (P3): sign-out's failure alert has no test
- F5 and issue #57 (T-F7-05 quarantined Nov 18, #58)
- F6 (end-to-end tests in CI)
- build review item 3.6 (sessions run only their ticket's specs)
- Fenn's P3 t-f9-fenn-01 (loose route titles)

**Merged before this starts:** T-F12

**Notes from the lead:**
- Both web servers run vite build, then vite preview, under the same AVEL_API values. T-F12 already serves the mock in preview (configurePreviewServer, under AVEL_API=mock only), so this ticket changes vite.config.ts only if the build switch needs it. Local runs may keep vite dev through an env switch the report names; CI always uses the build
- Remove T-F7-05's row from docs/quarantine.md once the checker's un-skipped test passes, and close #57 in the PR text (Fixes #57)
- CR-W33 (Javaris, Nov 21: "Option b": T-F12 merged with t-f12-fenn-01 accepted until this ticket fixes it, before the web is served anywhere beyond localhost): the guard's session read, and any later call the web server makes to /api while rendering, goes to AVEL_API_ORIGIN, a server-side setting, never to an origin built from the request's Host. Missing or not an absolute http(s) origin: the read fails, the visitor is signed out, and the server logs it once with no values (fail closed). The dev and preview web servers in playwright.config.ts, and the preview starters through e2e/support/preview-auth.ts's environment, set it to their own origin; for a person's vite dev, mockApi() may default it to the origin Vite resolved, only when it's unset and AVEL_API=mock (say how in the report). safeNext keeps the request's origin, which it only compares. Name the setting in the report so Javaris adds it to .env.example (E6)
- t-f12-fenn-02: sign-out's failure (login.md section 4: stay on Settings and draw Couldn't sign out. Try again.) gets its test here. T-F12's sign-in navigates instead of calling router.invalidate(), as its build report explains (a thrown redirect always replaces, which broke LG-22's Back); that stands, and the lead's old note is superseded
- Full rigor (C4: sign-in): Fenn's review, then Axis's second review against docs/review/security-checklist.md, then Javaris merges, as he does anyway for .github/workflows/ci.yml (CR-36's guardrail exclusion)
- Report the suite's time in CI before and after, as numbers
- Review: one round (CR-42); the full-diff rule applies as in T-F14
- Size: about 60 minutes

## 4. Tasks

### T-F15-01: make it true: e2e (behaviour): the server the suite runs against serves the production build: the page loads hashed scripts under /assets/ and never /@vite/client

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec playwright test`, `pnpm typecheck`, `pnpm lint`

### T-F15-02: make it true: e2e (guard): under AVEL_API=mock, the preview server still answers /api with contract-mock (route 52 returns the mock's rows); T-F12 built it, so this passes first (CR-42)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec playwright test`, `pnpm typecheck`, `pnpm lint`

### T-F15-03: make it true: e2e (guard): T-F7-05's test runs again (the quarantine's test.skip removed) and passes with --repeat-each 10 in one run

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec playwright test`, `pnpm typecheck`, `pnpm lint`

### T-F15-04: make it true: unit (behaviour, CR-W33): the guard's session read goes to AVEL_API_ORIGIN; a request with Host: other.example sends nothing to other.example; with AVEL_API_ORIGIN unset or not an absolute http(s) origin, the read fails and the visitor is signed out

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec playwright test`, `pnpm typecheck`, `pnpm lint`

### T-F15-05: make it true: e2e (behaviour, t-f12-fenn-02): a 500 on sign-out keeps you on Settings with Couldn't sign out. Try again. and the Sign out button back, and passes WCAG 2.2 AA

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec playwright test`, `pnpm typecheck`, `pnpm lint`

### T-F15-06: make it true: e2e (guard): t-f9-fenn-01, each project tab and the Library's three pages are told apart by a per-tab marker (aria-current or a data-testid beside the h1), not the mission name alone

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vite build`, `pnpm --filter @avel/web exec playwright test`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/playwright.config.ts`
- `apps/web/vite.config.ts`
- `.github/workflows/ci.yml`
- `docs/quarantine.md`
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/auth/api.ts`
- `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f15-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/e2e/control-room/routes.spec.ts`
- `apps/web/e2e/control-room-screens/routes.ts`
- `apps/web/e2e/e2e-build/**`
- `apps/web/test/sign-in/origin.test.ts`
- `apps/web/e2e/sign-in/sign-out-failure.spec.ts`
- `apps/web/e2e/support/preview-auth.ts`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/data/**`
- `apps/web/src/routes/login.tsx`
- `apps/web/control-room/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F16 | builds | `apps/web/control-room/src/sources/decisions.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/pages/decisions/**`, `apps/web/control-room/changes/T-F16.md` |
| T-F16 | tests | `apps/web/test/decisions-live/**`, `apps/web/e2e/decisions-live/**` |
| T-F17 | builds | `apps/web/control-room/src/sources/missions.js`, `apps/web/control-room/src/pages/project/NewProjectPage.jsx`, `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`, `apps/web/control-room/changes/T-F17.md` |
| T-F17 | tests | `apps/web/test/mission-start/**`, `apps/web/e2e/mission-start/**` |
| T-F23 | builds | `packages/contract-mock/src/**` |
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts`, `packages/contract-mock/test/world.test.ts` |
| T-F24 | builds | `packages/contract-mock/src/**` |
| T-F24 | tests | `packages/contract-mock/test/mission-reads.test.ts` |
| T-F25 | builds | `apps/web/control-room/src/sources/canon.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/uploads.js`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/changes/T-F25.md` |
| T-F25 | tests | `apps/web/e2e/home-headroom/**`, `apps/web/test/sources/samples.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F15`).
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
pnpm --filter @avel/web exec vite build
pnpm --filter @avel/web exec playwright test
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f15-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F15
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F15, "The end-to-end suite runs against the build you ship": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f15-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F15-e2e-production-build`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f15-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/F15-e2e-production-build`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
