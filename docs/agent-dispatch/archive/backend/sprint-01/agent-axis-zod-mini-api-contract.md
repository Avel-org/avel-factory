# AXIS: zod-mini api-contract

Backend sprint-01 · step 1 · Step 1, first module: @avel/contract on zod/mini (S1-6)

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** AXIS, as `.claude/agents/axis.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-axis-zod-mini-api-contract` (contract), module `zod-mini`.
- **Your branch:** `backend/sprint-01/agent-axis-zod-mini-api-contract-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/backend-sprint-01-agent-axis-zod-mini-api-contract-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** first; after `agent-rigg-zod-mini-test-unit` is merged into main.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/axis.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/backend/sprint-01/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/agent-dispatch/backend/sprint-01/decisions.md`: this sprint's source
4. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
5. `docs/agent-dispatch/backend/sprint-00/contract.md`: this sprint's source
6. `docs/agent-dispatch/backend/sprint-00/decisions.md`: this sprint's source
7. `docs/agent-dispatch/backend/sprint-01/decisions.md`: S1-6 in full: what changes, what doesn't, the spike's five checks and its findings for openapi.ts and the Page constraint; S1-8 (why shared schemas must stay one object)
8. `packages/contract/src/dto/common.ts`: the shared pieces every DTO uses: Uuid, IsoTime, Json, Placeholder, Page, PageQuery (coerce), Reason (trim)
9. `tools/docs/src/openapi.ts`: line 27's classic instanceof check, the only change outside the contract
10. `docs/generated/openapi.json`: must come out byte for byte the same
11. `docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract.md`: this task doc: follow it exactly

## 3. Domain

packages/contract/src moved from classic zod to zod/mini, as S1-6 describes, with no change a consumer can see; the OpenAPI generator's DTO check moved to zod/v4/core's $ZodType; Biome's ban on classic zod in packages/contract/**.

**The rest of this sprint:**

- `agent-rigg-zod-mini-test-unit`: The zod-mini regression tests, written against the classic contract on main and locked before the move: no classic zod import in packages/contract/src; every exported schema's z.input and z.output type unchanged against a snapshot taken now; route 54's bad-input issues unchanged (S1-6, S1-3).
- `agent-brennan-zod-mini-review-spec`: Review the zod-mini diff against decisions.md S1-6 (and S1-2, S1-3, S1-8): nothing a consumer can see changes, and no classic zod is left in packages/contract.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### AXIS-01: Rewrite every schema in packages/contract/src in zod/mini: about 377 chained calls (S1-6's counts: .nullable 167, .min 79, .int 54, .optional 50, .array 49, .extend 15, .trim 11, .refine 2, .pick 2, .meta 1) (P0)

- **Now:** Every DTO file, errors.ts and completion-report.ts import { z } from "zod" and chain methods
- **Required:** Only "zod/mini" and "zod/v4/core" are imported. Names, exports, comments and order stay as they are. The `.meta` call keeps its metadata in the OpenAPI output. `Page<T>`'s constraint becomes core.$ZodType, so classic schemas can still be paged (S1-6, Consumers). No change to package.json
- **Verify:** `pnpm --filter @avel/contract build && pnpm --filter @avel/contract test`
- **Expected:** builds; the 44 locked tests and Rigg's zod-mini tests all pass

### AXIS-02: tools/docs/src/openapi.ts: find DTOs with zod/v4/core's $ZodType instead of classic z.ZodType (spike check 2) (P0)

- **Required:** Only that check and its import change. The generated document is byte for byte main's
- **Verify:** `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated/openapi.json && echo OPENAPI-UNCHANGED`
- **Expected:** OPENAPI-UNCHANGED

### AXIS-03: biome.json: an overrides entry for packages/contract/** with style/noRestrictedImports banning "zod" and "zod/v4", each with a message pointing at zod/mini (P1)

- **Required:** pnpm lint passes on the moved contract, and fails on a planted `import { z } from "zod"` in a packages/contract/src file (show it once in your report, then remove it). No other lint rule changes
- **Verify:** `pnpm lint`
- **Expected:** exits 0

**Notes:**

- Start only after Rigg's zod-mini tests are merged and the operator has added their line to locks.md: the type snapshot must come from the classic contract.
- Keep every shared schema one object (S1-8). Placeholder, and every DTO that's an alias of it, must stay the same object, or the OpenAPI document changes.
- If a schema has no zod/mini form that keeps both its types and its OpenAPI output, stop and report it under Deviations. Don't approximate it.
- The size measure isn't yours to rerun: you don't build apps/web. Quote the spike's 173.53 to 156.28 kB in your report and say it's the spike's.

## 5. Territory

**You may change only:**

- `packages/contract/src/**`
- `tools/docs/src/openapi.ts`
- `biome.json`
- `docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract-completion.md`

**You may not change:**

- `packages/contract/test/**` (RIGG, locked tests)
- `apps/web/**` (the other team)
- `packages/contract-mock/**` (the other team)
- `.claude/**` and `docs/agent-dispatch/**` apart from your report (no territory)
- any path in `locks.md` (locked tests: a commit that changes one fails the lock check)

Read anything you need: reading never crosses a territory.

## 6. Execution protocol

**Before you write:** read the step's plan and every source in Part 2. Quote routes, DTOs, errors and events from the API and data reference word for word, and tables and columns from DATABASE.md. Never invent a column or a route.

**While you work:**
- Write only inside your territory. The contract is the only API both teams build against: every name you write is a name someone else must use.
- Record every choice the docs leave open in `decisions.md`, with the doc section that leaves it open.
- A conflict between two docs is a change request, not a silent pick: write it under Deviations.

**When it's written:** run the verification in Part 7, commit, and report. Brennan reviews it in a separate session; you never review your own contract.

## 7. Completion

**Verification.** Run each of these at the end, and paste each command with its output into your report:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
git diff --name-only main...HEAD   # only paths from Part 5
```

**Report.** Write `docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# AXIS: zod-mini api-contract, completion report

verdict: DONE | PARTIAL | BLOCKED

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| AXIS-01 | DONE / PARKED / BLOCKED | |
| AXIS-02 | DONE / PARKED / BLOCKED | |
| AXIS-03 | DONE / PARKED / BLOCKED | |

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
scripts/tell.sh INT "AXIS zod-mini api-contract a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are AXIS on avel-factory, backend sprint-01 (step 1: Step 1, first module: @avel/contract on zod/mini (S1-6)).
Dispatch: agent-axis-zod-mini-api-contract. Branch: backend/sprint-01/agent-axis-zod-mini-api-contract-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- AXIS-01: Rewrite every schema in packages/contract/src in zod/mini: about 377 chained calls (S1-6's counts: .nullable 167, .min 79, .int 54, .optional 50, .array 49, .extend 15, .trim 11, .refine 2, .pick 2, .meta 1)
- AXIS-02: tools/docs/src/openapi.ts: find DTOs with zod/v4/core's $ZodType instead of classic z.ZodType (spike check 2)
- AXIS-03: biome.json: an overrides entry for packages/contract/** with style/noRestrictedImports banning "zod" and "zod/v4", each with a message pointing at zod/mini

You may change only: packages/contract/src/**, tools/docs/src/openapi.ts, biome.json, docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
