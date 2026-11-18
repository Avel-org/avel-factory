---
doc: agent-fenn-t-f11-test-unit
ticket: T-F11
lane: frontend
sprint: sprint-10
agent: fenn
seat: checker
kind: tests
role: test-unit
rigor: standard
model: sonnet
branch: t/F11-web-e2e-ci
checkout: branch
after: []
depends_on: [T-F9]
report: docs/agent-dispatch/frontend/sprint-10/agent-fenn-t-f11-test-unit-completion.md
---


# T-F11 · tests · Fenn: The web's end-to-end tests run in CI

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-10 · Step 1 |
| Ticket | T-F11 · rigor standard |
| Dispatch | test-unit · Fenn (checker) · model sonnet |
| Works on | `t/F11-web-e2e-ci` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-10/codebase-analysis.md`: the codebase in short
5. `docs/design/Build rules.md`: H4 (required checks, the web's three), H5 (a red check blocks), F6 (Playwright in CI, screenshot and video)
6. `.github/workflows/ci.yml`: the CI job today: install, build, typecheck, check:effect, lint, test (Vitest only)
7. `.github/workflows/ci.yml`: the job to extend, or to sit beside
8. `apps/web/playwright.config.ts`: what the suite starts itself (two dev servers), where it writes (test-results) and what it records (screenshot and video on, trace on failure)
9. `apps/web/e2e/budget.spec.ts`: it runs vite build and vite preview itself, so CI must have built the workspace packages first
10. `tools/repo-checks/test/workflow.test.ts`: how a workflow is checked as text
11. `docs/agent-dispatch/frontend/sprint-10/agent-fenn-t-f11-test-unit.md`: this document: follow it exactly

## 3. Domain

**Goal:** A pull request that breaks the control room's budget, accessibility or routes goes red in CI, with each test's screenshot and video attached to the run.

**Refs:**
- Build rules H4 (the web's checks), H5, F6
- Javaris, Nov 17: "Approve T-F11"

**Merged before this starts:** T-F9

**Notes from the lead:**
- Add one job, e2e (name it "web e2e (Playwright)"), in ci.yml. It runs on the workflow's existing triggers (pull_request, and push to main) and needs no Postgres service. Steps: checkout, pnpm/action-setup, setup-node 22 with the pnpm cache, `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm --filter @avel/web exec playwright install --with-deps chromium`, then `pnpm --filter @avel/web exec playwright test`. Finally actions/upload-artifact uploads apps/web/test-results with `if: always()`, so a red run keeps its screenshots, videos and traces (F6)
- timeout-minutes: 30 for this job. No retries, no continue-on-error, no `|| true`: a red test makes the job red (H5)
- Leave the existing ci job's steps as they are
- Making the new job a required check is a branch-protection setting, which Javaris sets on GitHub. Say so in the report
- If the suite fails in CI where it passes locally (a port, a missing browser dependency, the budget's figure), don't touch the tests or the config: report it with the run's log. The budget figure CI measures is the one that counts (CR-W29 decision 6): if it's over 220 KB, stop with needs-cr. Since T-F8, / is 225,154 B gzipped of 225,280 B, which is over the 200 KB warning, so the spec prints a "budget warning: <n> B" line. Copy the CI run's figure into the report and the PR text, as a number
- Review, until T-B7 is on main (Axis's interim rule, adopted for this lane Nov 17): run `git diff main...HEAD --name-only` on the PR's full diff. Every file must be in this build's may-change list, this ticket's locked test files, this ticket's own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1 out-of-territory finding, even when CI's lock check passed

## 4. Tasks

### T-F11-01: a failing test for: unit: ci.yml has a job that runs `playwright test` for @avel/web, after `pnpm install --frozen-lockfile` and `pnpm build`, and installs Playwright's Chromium with its system dependencies first

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F11-02: a failing test for: unit: that job runs on pull_request and on push to main, and has no continue-on-error, no `|| true` after the test command, and no Playwright --retries

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F11-03: a failing test for: unit: that job uploads apps/web/test-results with actions/upload-artifact under if: always()

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

### T-F11-04: a failing test for: unit: the existing ci job still runs build, typecheck, check:effect, lint and test, unchanged

- **Write:** one test, in the test paths, that proves this behaviour.
- **Verify:** `pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test` runs it, and it **fails** on the start commit for the right reason.

## 5. Territory

**You may change** (and create):
- `tools/repo-checks/test/web-e2e-ci.test.ts`
- `docs/agent-dispatch/frontend/sprint-10/agent-fenn-t-f11-test-unit-completion.md` (your report)

**Never change, whatever the task says:**
- `.github/workflows/locks.yml`
- `.github/workflows/docs.yml`
- `.github/CODEOWNERS`
- `apps/web/**`
- `packages/**`
- `package.json`
- `pnpm-lock.yaml`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

## 6. Execution protocol: tests

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Write one test per task in Part 4, in the test paths only. Real Postgres; `TestClock` and the Clock, Ids and Random services; never sleep on the wall clock (E10, F4).
5. Cover every state the screen names (loading, empty, error, ready) against `contract-mock`. Every end-to-end test runs the WCAG 2.2 AA check and records a screenshot (E17, F6).
6. No `.skip`, `.only` or `todo` (F3).
7. Run them and confirm **every one fails**, for the reason the behaviour isn't built yet. A test that passes now is your bug (B2).
8. Commit the tests and your report to the branch. The lead reviews them and writes the lock line.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/repo-checks test
pnpm build
pnpm --filter @avel/web exec playwright test
```

**Your report:** `docs/agent-dispatch/frontend/sprint-10/agent-fenn-t-f11-test-unit-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F11
```

Then these sections:
- Pre-flight: each verification command and its result
- Failing first: the output of the tests failing on the start commit
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Lock line, for the lead to copy into locks.md: `- T-F11: <path>, <path> @ <branch tip>`, the test paths separated by commas. The lead fills in the branch tip after your report commit
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F11, "The web's end-to-end tests run in CI": the tests dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-10/agent-fenn-t-f11-test-unit.md`. Read it in full, then its Context in order, before you change anything. Write the acceptance tests on branch `t/F11-web-e2e-ci`, only in the test paths in Part 5. Prove each one fails on the ticket's start commit, and paste that output into your report. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-10/agent-fenn-t-f11-test-unit-completion.md`, committed to the branch. Don't push.
