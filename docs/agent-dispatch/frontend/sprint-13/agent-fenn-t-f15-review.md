---
doc: agent-fenn-t-f15-review
ticket: T-F15
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F15-e2e-production-build
checkout: detached
after: [agent-fantem-t-f15-build]
depends_on: [T-F12]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f15-review-completion.md
---


# T-F15 · review · Fenn: The end-to-end suite runs against the build you ship

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F15 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F15-e2e-production-build`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-13/codebase-analysis.md`: the codebase in short
5. `docs/ui-reference/control-room-handoff/screens.md`: every screen: its routes by number, its states and their words
6. `docs/ui-reference/control-room-handoff/README.md`: the rules that aren't obvious: Decisions is home, approvals never ask for a password, no money, nothing polls
7. `docs/design/API routes.md`: each route by number
8. `docs/ui-contracts/decisions-approval-page.md`: the decision card, Undo and the stale state
9. `apps/web/playwright.config.ts`: today's two web servers, both vite dev (with and without AVEL_API=mock); T-F12 added the sign-in setup project
10. `apps/web/vite.config.ts`: the mock middleware is apply: serve, configureServer only; vite preview needs it too
11. `.github/workflows/ci.yml`: the web e2e job
12. `docs/quarantine.md`: T-F7-05's row, removed when it's back
13. `apps/web/e2e/control-room/routes.spec.ts`: the locked acceptance tests: they define done
14. `apps/web/e2e/control-room-screens/routes.ts`: the locked acceptance tests: they define done
15. `apps/web/e2e/e2e-build/**`: the locked acceptance tests: they define done
16. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f15-build-completion.md`: the builder's completion report
17. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f15-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** CI's end-to-end tests run against the production build, so a lazy page never waits on the dev server's first compile, and the suite gives the same answer every run; T-F7-05 is back from quarantine.

**Refs:**
- F5 and issue #57 (T-F7-05 quarantined Nov 18, #58)
- F6 (end-to-end tests in CI)
- build review item 3.6 (sessions run only their ticket's specs)
- Fenn's P3 t-f9-fenn-01 (loose route titles)

**Merged before this starts:** T-F12

**Notes from the lead:**
- Both web servers run vite build, then vite preview, under the same AVEL_API values. The mock middleware runs in preview too (configurePreviewServer), never in a deployed build. Local runs may keep vite dev through an env switch the report names; CI always uses the build
- Remove T-F7-05's row from docs/quarantine.md once the checker's un-skipped test passes, and close #57 in the PR text (Fixes #57)
- The PR changes .github/workflows/ci.yml, so Javaris merges it (CR-36's guardrail exclusion)
- Report the suite's time in CI before and after, as numbers
- Review: one round (CR-42); the full-diff rule applies as in T-F14
- Size: about 60 minutes

## 4. Tasks

### T-F15-01: check: e2e (behaviour): the server the suite runs against serves the production build: the page loads hashed scripts under /assets/ and never /@vite/client

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F15-02: check: e2e (behaviour): under AVEL_API=mock, the preview server still answers /api with contract-mock (route 52 returns the mock's rows)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F15-03: check: e2e (guard): T-F7-05's test runs again (the quarantine's test.skip removed) and passes with --repeat-each 10 in one run

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F15-04: check: e2e (guard): t-f9-fenn-01, each project tab and the Library's three pages are told apart by a per-tab marker (aria-current or a data-testid beside the h1), not the mission name alone

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F15-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f15-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-13/findings/t-f15-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/playwright.config.ts`
- `apps/web/vite.config.ts`
- `.github/workflows/ci.yml`
- `docs/quarantine.md`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/**`
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
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts` |
| T-F24 | builds | `packages/contract-mock/src/**` |
| T-F24 | tests | `packages/contract-mock/test/mission-reads.test.ts` |

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
pnpm --filter @avel/web exec vite build
pnpm --filter @avel/web exec playwright test
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f15-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F15
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F15, "The end-to-end suite runs against the build you ship": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f15-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f15-review-completion.md`, left uncommitted. Don't push.
