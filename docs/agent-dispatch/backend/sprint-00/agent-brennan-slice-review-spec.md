# BRENNAN: slice review-spec

Backend sprint-00 · step 0 · The contract written fresh, and the schema rebuilt from the database map

Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.

## 1. Identity

- **You are** BRENNAN, as `.claude/agents/brennan.md` describes you, on avel-factory: the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, a React web app) that builds client software through agents and gates.
- **This dispatch:** `agent-brennan-slice-review-spec` (review), module `slice`.
- **Your branch:** `backend/sprint-00/agent-brennan-slice-review-spec-a<attempt>`. Check with `git branch --show-current`. One session is one attempt: never switch branches, push, rebase or force anything.
- **Your worktree:** `../avel-wt/backend-sprint-00-agent-brennan-slice-review-spec-a<attempt>`, made by `scripts/agent.sh`.
- **Starts:** at once.

## 2. Context: read before you act

Read these in order, properly, not from memory. If one is missing, stop and say which in your report.

1. `.claude/agents/brennan.md`: your role, your Read first list and your Learned rules
2. `docs/agent-dispatch/backend/sprint-00/codebase-analysis.md`: the stack, the layout and the commands
3. `docs/agent-dispatch/backend/sprint-00/contract.md`: this sprint's source
4. `docs/agent-dispatch/backend/sprint-00/decisions.md`: this sprint's source
5. `docs/design/Step 0 and Step 1 plan.md`: this sprint's source
6. `docs/design/AVEL Database Map.html`: this sprint's source
7. `docs/design/Schema vs DATABASE.md.md`: this sprint's source
8. `docs/design/Change requests CR-1 to 13.md`: this sprint's source
9. `docs/design/CR-16 Dispatch package contract.md`: this sprint's source
10. `docs/design/API routes.md`: this sprint's source
11. `docs/design/DATABASE.md`: this sprint's source
12. `docs/design/API and data reference.md`: this sprint's source
13. `docs/design/Canon onboarding v0.5.md`: this sprint's source
14. `docs/design/Backend modules and build plan.md`: this sprint's source
15. `docs/agent-dispatch/backend/sprint-00/contract.md`: under review, as at your start commit: sections 3, 4, 5 and 6 changed for a1's findings
16. `docs/agent-dispatch/backend/sprint-00/decisions.md`: under review: D1 to D22, B1 to B9, O1 and O2, and the section "Brennan's slice review (a1) and INT's answers"
17. `docs/design/AVEL Database Map.html`: what exists: tables, columns, CHECKs, indexes, triggers (its ERD data)
18. `docs/design/Change requests CR-1 to 13.md`: the accepted changes on top of the map
19. `docs/design/Backend modules and build plan.md`: sections 8 to 10: auth, CR-18 and CR-19 (the precedence)
20. `docs/design/API routes.md`: the 99 routes and CR-16's 3
21. `docs/design/CR-16 Dispatch package contract.md`: accepted Nov 6: routes, DispatchPackageDto, errors, dispatch_docs
22. `docs/design/Step 0 and Step 1 plan.md`: Step 0: what the contract and schema must contain, and done-when 1 to 9
23. `docs/design/Schema vs DATABASE.md.md`: how the map differs from DATABASE.md
24. `docs/agent-dispatch/backend/sprint-00/agent-brennan-slice-review-spec.md`: this task doc: follow it exactly

## 3. Domain

Re-review the Step 0 step contract before anything is built on it: docs/agent-dispatch/backend/sprint-00/contract.md and decisions.md as at the commit your session starts on, which answers attempt a1's seven findings, against the database map, the accepted CRs, API routes.md and CR-16 (CR-19's precedence).

**The rest of this sprint:**

- `agent-atlas-m0-workspace-build`: The pnpm workspace, TypeScript, Biome and Vitest config, scripts/pg-local.sh and the main CI workflow with a Postgres service (Step 0 item 1). No package code.
- `agent-axis-m0-workspace-review-backend`: Review the workspace against Step 0 item 1 and this plan's commands.
- `agent-axis-m1-contract-api-contract`: packages/contract: the value lists, DTOs and inputs, the 102 oRPC route definitions (the 99 and CR-16's 3), the error map, the event-kind to owning-module map and the completion report schema, from contract.md (Step 0 item 2).
- `agent-rigg-m1-contract-test-unit`: The contract's done-when tests: 5 (the contract builds and the route snapshot), 6 (the contract exports every list the schema checks), 7 (an event kind with no owner fails to compile).
- `agent-brennan-m1-contract-review-spec`: Review packages/contract against contract.md, API routes.md, the database map and CR-16: every route, list, DTO field and code traces to its source.
- `agent-rigg-m2-db-test-unit`: The db done-when tests against real Postgres: 1 (migration applies and reverses), 2 (one test per CHECK, unique and partial-unique index, exactly-one-parent rule and delete refusal, from the map and the changes on top), 3 (the CR-13 rules), 6 (no value list repeated in packages/db, and no two contract lists with the same values; contract.md section 3), 8 (the schema matches the map, with every difference in contract.md section 6's names table), 9 (one test per function: the map's six plus freeze_after_set, CR-13).
- `agent-soap-m2-db-build`: packages/db: the Drizzle schema rebuilt from the database map with contract.md section 6's changes on top, the seven functions (the map's six plus freeze_after_set), the table-owner map, and the first migration (Step 0 item 3; CR-19).
- `agent-axis-m2-db-review-backend`: Review packages/db against contract.md section 6 and the database map.
- `agent-brennan-m2-db-review-spec`: Review packages/db against the database map, the accepted CRs and contract.md section 6 (CR-19's precedence): no invented column, every CR change in.
- `agent-rigg-m3-docs-test-unit`: Done-when 4 (the ERD drift check passes, and fails on a planted mismatch) and 5's OpenAPI half (the document generates and holds the contract's routes).
- `agent-atlas-m3-docs-build`: tools/docs: the ERD generator from the Drizzle schema, the drift check against DATABASE.md, the OpenAPI generator from the contract, and their CI workflow (Step 0 item 4); DATABASE.md brought up to the schema (Step 0 item 5).
- `agent-axis-m3-docs-review-backend`: Review the generated docs and the drift check against Step 0 item 4.

## 4. Tasks

Do them in order. Finish each one, verified, before the next.

### BRENNAN-01: Routes and shapes: the 99 routes match API routes.md lines 20 to 189 byte for byte, CR-16's 3 match lines 192 to 196, and DispatchPackageDto matches the CR-16 contract (P0)

- **Verify:** `diff <(sed -n '20,189p' 'docs/design/API routes.md' | sed 's/^## //') <(sed -n '/^### Auth (5)/,/^\*\*Total: 99.\*\*/p' docs/agent-dispatch/backend/sprint-00/contract.md | sed 's/^### //') && diff <(sed -n '28,50p' 'docs/design/CR-16 Dispatch package contract.md') <(sed -n '/^```ts/,/^```$/p' docs/agent-dispatch/backend/sprint-00/contract.md) && echo QUOTES-MATCH`
- **Expected:** QUOTES-MATCH

### BRENNAN-02: Tables and lists: Appendix A is the map's value-list CHECKs unedited, section 3's changes each cite an accepted CR or a recorded INT answer, section 6's names table covers every new or renamed object, and its owner table names the map's 91 tables plus design_systems exactly once (P0)

- **Verify:** `python3 -I -c "import json;l=[x for x in open('docs/design/AVEL Database Map.html',encoding='utf-8') if x.startswith('const ERD =')][0];e=json.loads(l[len('const ERD ='):].strip().rstrip(';'));print(e['stats'])"`
- **Expected:** {'tables': 91, 'foreignKeys': 204, 'checks': 199, 'uniques': 81, 'indexes': 183}

### BRENNAN-03: Decisions: every D, B and O entry cites a source that says what it claims; any choice that changes the map, a route or an accepted CR without an INT answer or a CR is a finding (P1)

- **Verify:** `grep -cE "^- \*\*(D|B)[0-9]+\." docs/agent-dispatch/backend/sprint-00/decisions.md`
- **Expected:** the count of D and B entries, each of which you've checked

**Notes:**

- The work under review is two files as at your start commit, not a diff: the slice is on main, so AVEL_BASE..HEAD shows nothing of it. Read both files whole with git show "$AVEL_BASE":<path>. What changed since a1 reviewed them: git diff ffc6914 "$AVEL_BASE" -- docs/agent-dispatch/backend/sprint-00/contract.md docs/agent-dispatch/backend/sprint-00/decisions.md.
- Attempt a1 (commit 45c83da, branch backend/sprint-00/agent-brennan-slice-review-spec-a1) failed with seven findings, slice-brennan-01 to 07. Read them with git show 45c83da:docs/agent-dispatch/backend/sprint-00/findings/<file> (git show --stat 45c83da~1 lists them). In your report, say for each whether it's closed, and cite the line that closes it. A still-open one keeps its file name; a new finding is numbered from 08.
- INT answered 01 and 02 (decisions.md). Check that contract.md applies those answers as written. Don't reopen the answers themselves; anything that contradicts a source is still a finding.
- Each finding cites the slice's line (contract.md:N or decisions.md:N at your start commit), the source it breaks (file and section, or the map's table and CHECK name), and the command that shows it.
- Axis's api-contract dispatch (m1) waits for this review to be merged into main, so your report and findings are what it builds on. Only this attempt is merged, not a1 (D22).

## 5. Territory

**You may change only:**

- `docs/agent-dispatch/backend/sprint-00/agent-brennan-slice-review-spec-completion.md`
- `docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-*.md`

**You may not change:**

- `.github/workflows/ci.yml` (ATLAS)
- `.github/workflows/docs.yml` (ATLAS)
- `.npmrc` (ATLAS)
- `biome.json` (ATLAS)
- `docs/design/DATABASE.md` (ATLAS)
- `docs/generated/**` (ATLAS)
- `package.json` (ATLAS)
- `packages/contract/package.json` (AXIS)
- `packages/contract/src/**` (AXIS)
- `packages/contract/test/**` (RIGG, locked tests)
- `packages/contract/tsconfig.json` (AXIS)
- `packages/db/**` (SOAP)
- `packages/db/test/**` (RIGG, locked tests)
- `pnpm-lock.yaml` (ATLAS)
- `pnpm-workspace.yaml` (ATLAS)
- `scripts/pg-local.sh` (ATLAS)
- `tools/docs/**` (ATLAS)
- `tools/docs/test/**` (RIGG, locked tests)
- `tsconfig.base.json` (ATLAS)
- `tsconfig.json` (ATLAS)
- `vitest.workspace.ts` (ATLAS)
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

**Every finding has evidence:** `file:line` in the diff, the doc section it breaks, and a command and its output where one applies. No evidence, no finding. One file per finding at `docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-*.md`, starting with `status: open`, a severity (P0 to P3), and what fixing it means.

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

**Report.** Write `docs/agent-dispatch/backend/sprint-00/agent-brennan-slice-review-spec-completion.md` on your branch and commit it last. Use this outline and leave no section out (write "none" where it applies):

```markdown
# BRENNAN: slice review-spec, completion report

verdict: PASS | FAIL

## Summary
Two or three sentences: what's done and what isn't.

## Pre-flight
Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE / PARKED / BLOCKED | |
| BRENNAN-02 | DONE / PARKED / BLOCKED | |
| BRENNAN-03 | DONE / PARKED / BLOCKED | |

## Findings
One line per finding file you wrote (`docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-*.md`): its path, severity and title. "none" if none.

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
scripts/tell.sh INT "BRENNAN slice review-spec a<N>: <verdict>, report at <sha> on <branch>. Needs INT: <merges, locks, decisions, or none>"
```

Say the same in the session. The operator takes it from there.

## Activation

This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.

```text
You are BRENNAN on avel-factory, backend sprint-00 (step 0: The contract written fresh, and the schema rebuilt from the database map).
Dispatch: agent-brennan-slice-review-spec. Branch: backend/sprint-00/agent-brennan-slice-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/backend/sprint-00/agent-brennan-slice-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Routes and shapes: the 99 routes match API routes.md lines 20 to 189 byte for byte, CR-16's 3 match lines 192 to 196, and DispatchPackageDto matches the CR-16 contract
- BRENNAN-02: Tables and lists: Appendix A is the map's value-list CHECKs unedited, section 3's changes each cite an accepted CR or a recorded INT answer, section 6's names table covers every new or renamed object, and its owner table names the map's 91 tables plus design_systems exactly once
- BRENNAN-03: Decisions: every D, B and O entry cites a source that says what it claims; any choice that changes the map, a route or an accepted CR without an INT answer or a CR is a finding

You may change only: docs/agent-dispatch/backend/sprint-00/agent-brennan-slice-review-spec-completion.md, docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/backend/sprint-00/agent-brennan-slice-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
