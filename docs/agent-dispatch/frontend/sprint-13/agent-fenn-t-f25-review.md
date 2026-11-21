---
doc: agent-fenn-t-f25-review
ticket: T-F25
lane: frontend
sprint: sprint-13
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F25-home-headroom
checkout: detached
after: [agent-fantem-t-f25-build]
depends_on: [T-F12, T-F14]
report: docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f25-review-completion.md
---


# T-F25 · review · Fenn: / loads only what Decisions shows

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-13 · Step 1 |
| Ticket | T-F25 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F25-home-headroom`'s head |
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
9. `apps/web/control-room/src/app/uploads.js`: imports mock/uploads.json at the top, so Uploads' sample world (about 4.1 KB gzipped) is in /'s first load
10. `apps/web/control-room/src/sources/canon.js`: owns mock/onboarding.json since T-F14 (about 5.2 KB gzipped, also in /'s first load); its status can be loading
11. `apps/web/control-room/src/app/logic.js`: where the canon source and uploads are read, and the lazy imports the export already uses (osa.json, contract-mock-decisions.json, world.json)
12. `apps/web/e2e/budget.spec.ts`: how /'s figure is measured: 235 KB limit, 225 KB warning
13. `apps/web/e2e/home-headroom/**`: the locked acceptance tests: they define done
14. `apps/web/test/sources/samples.test.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/frontend/sprint-13/agent-fantem-t-f25-build-completion.md`: the builder's completion report
16. `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f25-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** Opening the control room loads only what Decisions draws: Onboarding's and Uploads' sample worlds arrive when you open those screens, so / is back under the 225 KB warning before sprints 13 and 14 add screens to it.

**Refs:**
- Javaris, Nov 21, to OSA: "Yes I approve" (a frontend follow-up that wins back /'s headroom)
- CR-W29 decision 6, second amendment (235 KB, warning over 225 KB)
- E16

**Merged before this starts:** T-F12, T-F14

**Notes from the lead:**
- Measured by Zero on T-F12's build (Nov 21): / is 226,587 B gzipped, against the 230,400 B warning. main's chunk carries the export's sample JSON, and two files Decisions never shows are in it whole: onboarding.json (about 5.2 KB gzipped) and uploads.json (about 4.1 KB). The framework chunk (React, the router, Start) and the guard are out of scope
- The fix: those two files load with a dynamic import the first time their screen needs them, the way logic.js already loads osa.json and world.json. While the canon source's sample is on its way, its status is loading (T-F14's statuses), so Onboarding shows its skeleton for that moment and nothing else changes. If something drawn on / (a badge or a count) reads either file today, say so in the report and keep that one value eager: it's out-of-scope only if it needs a page change
- Target: / at most 220 KB gzipped (225,280 B) by budget.spec's method. Copy the before and after figures into the report and the PR text as numbers. budget.spec's 235 KB limit and 225 KB warning stay as they are. If the two files don't get / under 220 KB, report the figure and what else in main's chunk Decisions doesn't use, and don't cut further
- Log every export file this ticket changes in control-room/changes/T-F25.md
- Review: one round (CR-42); the full-diff rule applies as in T-F14
- Size: about 60 minutes

## 4. Tasks

### T-F25-01: check: e2e (behaviour): signed in on the production preview, no script that / loads before Decisions' first card holds onboarding.json's or uploads.json's sample text (checked by distinctive strings from each file)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F25-02: check: e2e (behaviour): opening Onboarding and Uploads from / still draws their sample world, with no console error, and passes WCAG 2.2 AA at 390 and 1280

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F25-03: check: unit (behaviour): the canon source in sample mode reports loading, then ready with exactly the sample world's values. T-F14-06's canon case changes to that and nothing else in samples.test.ts

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F25-04: check: e2e (guard): every screen in the page registry still opens with its title (T-F9's specs, unchanged), and / stays at most 235 KB

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F25-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f25-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-13/findings/t-f25-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/src/sources/canon.js`
- `apps/web/control-room/src/app/canon.js`
- `apps/web/control-room/src/app/uploads.js`
- `apps/web/control-room/src/app/logic.js`
- `apps/web/control-room/changes/T-F25.md`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/vite.config.ts`
- `apps/web/control-room/src/mock/**`
- `apps/web/control-room/src/pages/**`
- `apps/web/control-room/SOURCE.md`
- `apps/web/src/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F15 | builds | `apps/web/playwright.config.ts`, `apps/web/vite.config.ts`, `.github/workflows/ci.yml`, `docs/quarantine.md`, `apps/web/src/routes/__root.tsx`, `apps/web/src/auth/api.ts` |
| T-F15 | tests | `apps/web/e2e/control-room/routes.spec.ts`, `apps/web/e2e/control-room-screens/routes.ts`, `apps/web/e2e/e2e-build/**`, `apps/web/test/sign-in/origin.test.ts`, `apps/web/e2e/sign-in/sign-out-failure.spec.ts`, `apps/web/e2e/support/preview-auth.ts` |
| T-F16 | builds | `apps/web/control-room/src/sources/decisions.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/pages/decisions/**`, `apps/web/control-room/changes/T-F16.md` |
| T-F16 | tests | `apps/web/test/decisions-live/**`, `apps/web/e2e/decisions-live/**` |
| T-F17 | builds | `apps/web/control-room/src/sources/missions.js`, `apps/web/control-room/src/pages/project/NewProjectPage.jsx`, `apps/web/control-room/src/pages/project/ProjectOverviewPage.jsx`, `apps/web/control-room/changes/T-F17.md` |
| T-F17 | tests | `apps/web/test/mission-start/**`, `apps/web/e2e/mission-start/**` |
| T-F23 | builds | `packages/contract-mock/src/**` |
| T-F23 | tests | `packages/contract-mock/test/mission-streams.test.ts`, `packages/contract-mock/test/world.test.ts` |
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
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f25-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
verdict: pass | changes | block
ticket: T-F25
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F25, "/ loads only what Decisions shows": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f25-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-13/agent-fenn-t-f25-review-completion.md`, left uncommitted. Don't push.
