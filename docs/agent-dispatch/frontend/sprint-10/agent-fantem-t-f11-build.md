---
doc: agent-fantem-t-f11-build
ticket: T-F11
lane: frontend
sprint: sprint-10
agent: fantem
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/F11-web-e2e-ci
checkout: branch
after: [agent-fenn-t-f11-test-unit]
depends_on: [T-F9]
report: docs/agent-dispatch/frontend/sprint-10/agent-fantem-t-f11-build-completion.md
---


# T-F11 · build · Fantem: The web's end-to-end tests run in CI

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-10 · Step 1 |
| Ticket | T-F11 · rigor standard |
| Dispatch | build · Fantem (builder) · model sonnet |
| Works on | `t/F11-web-e2e-ci` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-10/codebase-analysis.md`: the codebase in short
5. `docs/design/Build rules.md`: H4 (required checks, the web's three), H5 (a red check blocks), F6 (Playwright in CI, screenshot and video)
6. `.github/workflows/ci.yml`: the CI job today: install, build, typecheck, check:effect, lint, test (Vitest only)
7. `.github/workflows/ci.yml`: the job to extend, or to sit beside
8. `apps/web/playwright.config.ts`: what the suite starts itself (two dev servers), where it writes (test-results) and what it records (screenshot and video on, trace on failure)
9. `apps/web/e2e/budget.spec.ts`: it runs vite build and vite preview itself, so CI must have built the workspace packages first
10. `tools/repo-checks/test/workflow.test.ts`: how a workflow is checked as text
11. `tools/repo-checks/test/web-e2e-ci.test.ts`: the locked acceptance tests: they define done
12. `docs/agent-dispatch/frontend/sprint-10/agent-fantem-t-f11-build.md`: this document: follow it exactly

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

### T-F11-01: make it true: unit: ci.yml has a job that runs `playwright test` for @avel/web, after `pnpm install --frozen-lockfile` and `pnpm build`, and installs Playwright's Chromium with its system dependencies first

- **Verify:** its locked test passes: `pnpm --filter @avel/repo-checks test`, `pnpm build`, `pnpm --filter @avel/web exec playwright test`

### T-F11-02: make it true: unit: that job runs on pull_request and on push to main, and has no continue-on-error, no `|| true` after the test command, and no Playwright --retries

- **Verify:** its locked test passes: `pnpm --filter @avel/repo-checks test`, `pnpm build`, `pnpm --filter @avel/web exec playwright test`

### T-F11-03: make it true: unit: that job uploads apps/web/test-results with actions/upload-artifact under if: always()

- **Verify:** its locked test passes: `pnpm --filter @avel/repo-checks test`, `pnpm build`, `pnpm --filter @avel/web exec playwright test`

### T-F11-04: make it true: unit: the existing ci job still runs build, typecheck, check:effect, lint and test, unchanged

- **Verify:** its locked test passes: `pnpm --filter @avel/repo-checks test`, `pnpm build`, `pnpm --filter @avel/web exec playwright test`

## 5. Territory

**You may change** (and create):
- `.github/workflows/ci.yml`
- `docs/agent-dispatch/frontend/sprint-10/agent-fantem-t-f11-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `tools/repo-checks/test/web-e2e-ci.test.ts`

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

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F11`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

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

**Your report:** `docs/agent-dispatch/frontend/sprint-10/agent-fantem-t-f11-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-F11
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F11, "The web's end-to-end tests run in CI": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-10/agent-fantem-t-f11-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F11-web-e2e-ci`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-10/agent-fantem-t-f11-build-completion.md`, committed to the branch. Don't push.
