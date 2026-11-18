---
doc: agent-rigg-t-b5-review
ticket: T-B5
lane: backend
sprint: sprint-02
agent: rigg
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/B5-lock-check-merges
checkout: detached
after: [agent-soap-t-b5-build]
depends_on: []
report: docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b5-review-completion.md
---


# T-B5 · review · Rigg: Lock check: merge commits are checked, the build doc is found by the PR's branch, and an F2 relock line is honoured

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B5 · rigor standard |
| Dispatch | review · Rigg (checker) · model sonnet |
| Works on | a detached checkout of `t/B5-lock-check-merges`'s head |
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
9. `tools/repo-checks/src/check-locks.ts`: the check as T-B0 built it: rev-list --no-merges, and findBuildDoc's first match
10. `tools/repo-checks/test/helpers.ts`: the locked interface (T-B0) the check keeps to, and the scratch-repo helpers
11. `docs/agent-dispatch/backend/sprint-01/findings/t-b0-rigg-02.md`: P2: an 'evil merge' hides a change; the suggested fixes
12. `docs/agent-dispatch/backend/sprint-01/findings/t-b0-rigg-03.md`: P3: the first match across sprints; match by the doc's branch front matter
13. `scripts/render.py`: the build doc's front matter (branch:) and report paths; read only
14. `tools/repo-checks/test/locks-merges.test.ts`: the locked acceptance tests: they define done
15. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b5-build-completion.md`: the builder's completion report
16. `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b5-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** A builder can't change a locked test or a file outside the ticket inside a merge commit, and a PR is always checked against its own ticket's build doc.

**Refs:**
- Build rules H6 and F2
- T-B0 review findings t-b0-rigg-02 (P2) and t-b0-rigg-03 (P3)
- Javaris, Nov 17: F2 relock in the lock check (option a)

**Notes from the lead:**
- P2: a merge commit's own changes must be held to the same rules as any builder commit: compare each merge against its first parent (or the whole range's tree), so a locked test or an out-of-Territory file changed only in a merge result fails and is named. A plain merge of main that brings in main's own changes must still pass
- P3: find the build doc whose front matter branch: equals GITHUB_HEAD_REF, not the first file with the ticket's name. Ticket IDs are never reused across sprints today, so this is hardening, not a live bug
- F2 relock (Javaris, Nov 17): after a test-dispute changes a locked test, the lead adds a second line for the ticket, `- T-B1: <path>, <path> @ <newsha> (F2 relock)`. The check honours it only if: it was added in a commit that changes nothing but the sprint's locks.md; it lists the same paths as the earlier line, or more; and its sha descends from the earlier line's sha. Then the locked paths are frozen from the new sha on (the checker's fix between the two shas is allowed), while the Territory still applies to every commit after the first lock sha. Any other later line for the ticket still fails the check and names locks.md, as T-B0's add-only rule says. The kit's render.py already accepts the line's format (lead kit PR, Nov 17)
- CI can't tell who added a relock line: the reviewer checks that the PR's relock follows a test-dispute the lead decided (F2)
- The T-B0 interface in helpers.ts stays: same script, environment and messages

## 4. Tasks

### T-B5-01: check: a merge commit whose result changes a locked test that neither parent changed fails, and names the file

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B5-02: check: a merge commit whose result changes a file outside the Territory that neither parent changed fails, and names the file

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B5-03: check: a merge of main into the ticket branch that only brings in main's own commits passes

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B5-04: check: the build doc is the one whose branch: front matter matches GITHUB_HEAD_REF, even when another sprint's folder has a doc with the same file name

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B5-05: check: F2 relock: a checker's commit changing a locked test, then a locks.md-only commit adding '(F2 relock)' at the new tip with the same paths, then a builder commit inside the Territory, passes

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B5-06: check: F2 relock: a builder commit that changes a locked test after the relock still fails and names the file, and one outside the Territory before the relock still fails

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B5-07: check: F2 relock: a relock line with fewer paths, one whose sha isn't a descendant of the first lock, or one added in a commit that also changes another file fails and names locks.md

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B5-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b5-review-completion.md`
- `docs/agent-dispatch/backend/sprint-02/findings/t-b5-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `tools/repo-checks/src/**`

**Never change, whatever the task says:**
- `tools/repo-checks/package.json`
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
| T-B6 | builds | `packages/contract/src/errors.ts`, `packages/contract/src/version.ts`, `docs/generated/**` |
| T-B6 | tests | `packages/contract/test/defect-code.test.ts` |
| T-B7 | builds | `tools/repo-checks/src/**` |
| T-B7 | tests | `tools/repo-checks/test/locks-tests-report.test.ts` |

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

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b5-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B5
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B5, "Lock check: merge commits are checked, the build doc is found by the PR's branch, and an F2 relock line is honoured": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b5-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b5-review-completion.md`, left uncommitted. Don't push.
