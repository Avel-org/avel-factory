---
doc: agent-rigg-t-b7-review
ticket: T-B7
lane: backend
sprint: sprint-02
agent: rigg
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/B7-lock-check-tests-report
checkout: detached
after: [agent-soap-t-b7-build]
depends_on: [T-B5]
report: docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b7-review-completion.md
---


# T-B7 · review · Rigg: Lock check: the tests report may change after the lock, and a merged side branch's commits are checked

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B7 · rigor standard |
| Dispatch | review · Rigg (checker) · model sonnet |
| Works on | a detached checkout of `t/B7-lock-check-tests-report`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-02/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 3 (database errors) and 10 (events and seq), and test 6
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 2 (the Db service: withTransaction, Tx, Events.append, commitWithEvents) and section 6 (spike 1 check 2)
7. `docs/design/CR-39 Effect's language service on TypeScript 7.md`: the accepted change: @effect/tsgo 0.64.1 replaces @effect/language-service, run in the editor and CI
8. `docs/design/Build rules.md`: C4 (full rigor), E5 (one lockfile change per cycle), E9 (spike 2 before the jobs engine), E10 (real Postgres), F2 (locked tests), H6 (the lock check)
9. `tools/repo-checks/src/check-locks.ts`: the check as T-B5 left it: merges, the build doc by branch, the F2 relock line
10. `tools/repo-checks/test/helpers.ts`: the locked interface (T-B0) and the scratch-repo helpers; read only
11. `tools/repo-checks/test/locks-merges.test.ts`: T-B5's relock tests, which must still pass unchanged
12. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b5-build.md`: a build doc's front matter: after: names the tests doc, whose own report: is the path to exempt
13. `docs/design/Build rules.md`: F2 (the test-dispute, the checker's fix, the relock) and H6 (the lock check)
14. `tools/repo-checks/test/locks-tests-report.test.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b7-build-completion.md`: the builder's completion report
16. `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b7-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** A ticket that goes through a test-dispute and a relock passes the lock check as pushed, with no force-pushed rebuild, and a builder can't slip a change in on a side branch merged into the ticket branch.

**Refs:**
- Build rules H6 and F2
- Zero's input on PR #30 (T-F7), Nov 17
- Javaris, Nov 17: approve T-B7
- Javaris, Nov 17: approve the wider T-B7 (every commit not on main, side branches included)
- T-B5 build report, Limitations: --first-parent skips a merged side branch's commits

**Merged before this starts:** T-B5

**Notes from the lead:**
- The exempt path: the build doc's after: names the tests task doc; that doc's report: front matter is the tests completion report. Exempt exactly that one path from the Territory and the lock, in every commit after the first lock sha. No other report, task doc or docs path is exempt
- Why: the checker commits its report with the F2 fix, and the kit rewrites it to status done after the lock so a retry unblocks the waiting build. Today both turn the check red (PR #30: Fenn's report commits named 'outside the Territory')
- A checker commit at or before a relock line's sha may change that line's locked paths plus the tests report, and nothing else. Any other file in it still fails and is named. T-B5's rules for the relock line itself don't change: a locks.md-only commit, the same paths or more, a sha that descends from the first
- Builder commits are held to the Territory and the lock exactly as before. CI can't tell who changed the tests report, so the reviewer checks that file's history (F2)
- The T-B0 interface in helpers.ts stays: same script, environment and messages. T-B5's tests pass unchanged
- Side branches (T-B5's limitation): T-B5 walks --first-parent, so a commit that arrives through a merge's second parent is never checked, and a clean merge of a side branch hides an out-of-Territory change. The check covers every commit in lock..HEAD that isn't on the base branch: exclude origin/$GITHUB_BASE_REF (Actions sets it on pull_request, and the checkout has fetch-depth 0), falling back to a local main when that ref is missing, as in the scratch repos. Main's own commits still pass, and T-B5's merge-result check (diff-tree -c) stays. Don't change locks.yml; if the base ref can't be found, fail and say so rather than skipping the check
- Reproduction for the fixture's shape: PR #30's pushed head 84bd7c2 (red on H6) against the rebuilt 7bcca95 (green). Both are in the local object store. Model the scratch repo on 84bd7c2's commit order; don't reference those shas from the test

## 4. Tasks

### T-B7-01: check: a T-F7-shaped history passes: lock, a builder commit, a checker commit changing the locked test and the tests report, a locks.md-only relock line at that sha, a commit changing only the tests report to status done, then builder commits inside the Territory

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B7-02: check: a commit after the lock that changes only the tests report passes, with or without a relock

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B7-03: check: a checker commit before the relock that changes the locked test and a file that is neither locked nor the tests report fails, and names that file

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B7-04: check: a builder commit that changes another report (the review report, or another ticket's tests report) still fails and names it

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B7-05: check: a builder commit that changes a locked test after the relock still fails and names the file, even when the same commit also changes the tests report

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B7-06: check: a side branch whose own commit changes a file outside the Territory, merged cleanly into the ticket branch, fails and names the file and that commit; a merge of main that brings in main's own commits still passes

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B7-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b7-review-completion.md`
- `docs/agent-dispatch/backend/sprint-02/findings/t-b7-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `tools/repo-checks/src/**`

**Never change, whatever the task says:**
- `tools/repo-checks/package.json`
- `tools/repo-checks/test/helpers.ts`
- `.github/workflows/locks.yml`
- `scripts/render.py`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B2 | builds | `packages/server/package.json`, `packages/server/tsconfig.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml`, `docs/design/Outside sources and what we took.md` |
| T-B2 | tests | `tools/repo-checks/test/dependencies.test.ts`, `tools/repo-checks/test/effect-check.test.ts`, `tools/repo-checks/test/fixtures/effect/**` |
| T-B3 | builds | `packages/server/src/platform/db/errors.ts`, `packages/server/src/platform/errors.ts` |
| T-B3 | tests | `packages/server/test/db/**` |
| T-B4 | builds | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/db/tx.ts`, `packages/server/src/platform/db/events.ts`, `packages/server/src/platform/db/index.ts` |
| T-B4 | tests | `packages/server/test/db-service/**` |
| T-B5 | builds | `tools/repo-checks/src/**` |
| T-B5 | tests | `tools/repo-checks/test/locks-merges.test.ts` |
| T-B6 | builds | `packages/contract/src/errors.ts`, `packages/contract/src/version.ts`, `docs/generated/**` |
| T-B6 | tests | `packages/contract/test/defect-code.test.ts` |

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
pnpm test
pnpm --filter @avel/repo-checks test
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b7-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B7
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B7, "Lock check: the tests report may change after the lock, and a merged side branch's commits are checked": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b7-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b7-review-completion.md`, left uncommitted. Don't push.
