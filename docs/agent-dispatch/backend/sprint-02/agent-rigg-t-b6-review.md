---
doc: agent-rigg-t-b6-review
ticket: T-B6
lane: backend
sprint: sprint-02
agent: rigg
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/B6-defect-code
checkout: detached
after: [agent-soap-t-b6-build]
depends_on: []
report: docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-review-completion.md
---


# T-B6 · review · Rigg: The contract's defect code: INTERNAL_SERVER_ERROR, 500, no details; contract 1.0.1 (CR-38)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-02 · Step 1 |
| Ticket | T-B6 · rigor standard |
| Dispatch | review · Rigg (checker) · model sonnet |
| Works on | a detached checkout of `t/B6-defect-code`'s head |
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
9. `docs/design/CR-38 A contract error code for defects.md`: the change, word for word
10. `packages/contract/src/errors.ts`: errorMap: the generic codes, where the new one goes
11. `packages/contract/src/version.ts`: CONTRACT_VERSION 1.0.0 to 1.0.1
12. `packages/server/src/platform/effect-handler.ts`: already answers a defect with INTERNAL_SERVER_ERROR; read only, it shouldn't need a change
13. `packages/contract/test/defect-code.test.ts`: the locked acceptance tests: they define done
14. `docs/agent-dispatch/backend/sprint-02/agent-soap-t-b6-build-completion.md`: the builder's completion report
15. `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** A defect's 500 carries a code from the contract's catalog, so the web can show it like any other error.

**Refs:**
- CR-38 (accepted Nov 17; Zero signed off, I3)
- AGENTS.md, Writing Effect rule 3
- Build rules I3

**Labels:** contract · implements CR-38

**Notes from the lead:**
- Add INTERNAL_SERVER_ERROR { status: 500, message: 'Something went wrong' } to errorMap's generic codes, with no data, and change the comment 'the generic seven' to 'the generic eight'. Bump CONTRACT_VERSION to 1.0.1. Regenerate docs/generated with pnpm --filter @avel/docs generate and commit it
- The server already sends INTERNAL_SERVER_ERROR for a defect (T-B1), so no server file changes. If a server test or typecheck fails because of the new code, stop with out-of-scope rather than editing the server

## 4. Tasks

### T-B6-01: check: errorMap has INTERNAL_SERVER_ERROR with status 500, message 'Something went wrong' and no data schema

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B6-02: check: CONTRACT_VERSION is 1.0.1

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B6-03: check: the generated OpenAPI document lists INTERNAL_SERVER_ERROR as a 500 error code

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B6-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-review-completion.md`
- `docs/agent-dispatch/backend/sprint-02/findings/t-b6-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `packages/contract/src/errors.ts`
- `packages/contract/src/version.ts`
- `docs/generated/**`

**Never change, whatever the task says:**
- `packages/contract/src/routes/**`
- `packages/contract/src/dto/**`
- `packages/contract-mock/**`
- `packages/server/**`
- `apps/web/**`
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
pnpm --filter @avel/contract test
pnpm --filter @avel/docs generate && git diff --exit-code docs/generated
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B6
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B6, "The contract's defect code: INTERNAL_SERVER_ERROR, 500, no details; contract 1.0.1 (CR-38)": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-02/agent-rigg-t-b6-review-completion.md`, left uncommitted. Don't push.
