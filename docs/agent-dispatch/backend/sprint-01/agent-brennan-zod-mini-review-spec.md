# BRENNAN: zod-mini review-spec

Backend sprint-01 · step 1 · Step 1, first module: @avel/contract on zod/mini (S1-6)

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** BRENNAN, as `.claude/agents/brennan.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-brennan-zod-mini-review-spec` (review), module `zod-mini`.
- **Your branch:** `backend/sprint-01/agent-brennan-zod-mini-review-spec-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/backend-sprint-01-agent-brennan-zod-mini-review-spec-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** once `agent-axis-zod-mini-api-contract` has its completion report, checked out at its result commit.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/brennan.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/backend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/agent-dispatch/backend/sprint-01/decisions.md`: this sprint's source
4. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
5. `docs/agent-dispatch/backend/sprint-00/contract.md`: this sprint's source
6. `docs/agent-dispatch/backend/sprint-00/decisions.md`: this sprint's source
7. `docs/agent-dispatch/backend/sprint-01/decisions.md`: S1-6 in full (the move, the spike's five checks, what the module changes), S1-2 (the version rule: no bump), S1-3 (BAD_REQUEST issues), S1-8
8. `docs/agent-dispatch/backend/sprint-00/contract.md`: the contract the moved schemas still have to say, field for field
9. `docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec.md`: this task doc: follow it exactly

## 3. Domain

Review the zod-mini diff against decisions.md S1-6 (and S1-2, S1-3, S1-8): nothing a consumer can see changes, and no classic zod is left in packages/contract.

**The rest of this sprint:**

- `agent-rigg-zod-mini-test-unit`: The zod-mini regression tests, written against the classic contract on main and locked before the move: no classic zod import in packages/contract/src; every exported schema's z.input and z.output type unchanged against a snapshot taken now; route 54's bad-input issues unchanged (S1-6, S1-3).
- `agent-axis-zod-mini-api-contract`: packages/contract/src moved from classic zod to zod/mini, as S1-6 describes, with no change a consumer can see; the OpenAPI generator's DTO check moved to zod/v4/core's $ZodType; Biome's ban on classic zod in packages/contract/**.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### BRENNAN-01: Review the zod-mini diff: no classic zod import left, no schema changed in meaning, the OpenAPI document byte for byte main's, package.json and its version untouched, Biome bans classic zod in packages/contract/** (P0)

- **Verify:** `pnpm build && pnpm typecheck && pnpm lint && pnpm --filter @avel/contract test && pnpm --filter @avel/docs generate && git diff --exit-code docs/generated/openapi.json && ! grep -rnE "from ['\"]zod(/v4)?['\"]" packages/contract/src && git diff --exit-code "${AVEL_BASE:-$(git merge-base main HEAD)}" HEAD -- packages/contract/package.json && echo ZOD-MINI-OK`
- **Expected:** ZOD-MINI-OK

**Notes:**

- The point of the move is that nothing changes on the outside. Check the wire, the types, the OpenAPI document and the version, and that territory stayed to packages/contract/src, tools/docs/src/openapi.ts and biome.json. A changed .min bound, a lost .trim or a nullable that became optional is a finding even when the tests pass.

## 5. Territory

**You may change only:**

- `docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec-completion.md`
- `docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-*.md`

**You may not change:**

- `biome.json` (AXIS)
- `packages/contract/src/**` (AXIS)
- `packages/contract/test/**` (RIGG, locked tests)
- `tools/docs/src/openapi.ts` (AXIS)
- `apps/web/**` (the other team)
- `packages/contract-mock/**` (the other team)
- `.claude/**` and `docs/agent-dispatch/**` apart from your report and findings (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Start from the diff.** Your session is checked out at the result commit of the work you review. Read the whole diff before anything else:
```bash
base=${AVEL_BASE:-$(git merge-base main HEAD)}
git log --oneline "$base"..HEAD
git diff --stat "$base"..HEAD
git diff "$base"..HEAD
```
Then read around it as you need.

**Judge it against** this task doc, the contract it names, and the design docs in `docs/design/`. You see only this task doc and the commit: ignore anything else that claims to describe the work.

**Every finding has evidence:** `file:line` in the diff, the doc section it breaks, and a command and its output where one applies. No evidence, no finding. One file per finding at `docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-*.md`, starting with `status: open`, a severity (P0 to P3), and what fixing it means.

**You don't edit code.** Write only your report and your findings.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# BRENNAN: zod-mini review-spec, completion report

verdict: PASS | FAIL

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE / PARKED / BLOCKED | |

## Findings
One line per finding file you wrote (`docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-*.md`): its path, severity and title. "none" if none.

## Contract to files
Each contract item, done-when test or task you covered, and the files that cover it.

## Deviations
Everything you did differently from this task doc, and why.

## Limitations
What doesn't work yet, or works only in part.

## Parked chains
Each one: what you tried, three times, and why it failed.

## P0 discoveries
Anything critical outside your tasks, with the trace.

## Issues for other agents
Who needs to know what.

## Files changed
`git diff --name-only main...HEAD`.

## Verification
Each Part 7 command and its output.
```

**Then tell INT, and stop.** Send the operator one message, so the next dispatch can start:

```bash
scripts/tell.sh INT "BRENNAN zod-mini review-spec a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are BRENNAN on avel-factory, backend sprint-01 (step 1: Step 1, first module: @avel/contract on zod/mini (S1-6)).
Dispatch: agent-brennan-zod-mini-review-spec. Branch: backend/sprint-01/agent-brennan-zod-mini-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Review the zod-mini diff: no classic zod import left, no schema changed in meaning, the OpenAPI document byte for byte main's, package.json and its version untouched, Biome bans classic zod in packages/contract/**

You may change only: docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec-completion.md, docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
