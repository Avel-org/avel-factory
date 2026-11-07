# BRENNAN: m1-contract review-spec, completion report

verdict: PASS

## Summary
I reviewed `packages/contract` (6186c57..0dce235, 52 files) against `contract.md`, API routes.md, the database map and CR-16. I checked by script, against the built `dist/`. Nothing found is invented, missing or a rep field:
- the 102 routes;
- the 99 value-list CHECKs, with section 3's changes;
- every row DTO, column by column against its map table;
- the error map;
- the event-owner map;
- `DispatchPackageDto`.

There are two P3 findings, and neither blocks the merge:
- 01: three writes send no `rowVersion`;
- 02: route 52's placeholder fixes an undocumented discriminator.

Not done: the task's Expected, "the locked tests pass", can't be shown yet, because Rigg's m1 tests aren't on this commit (zero tests ran). The branch also can't be installed in CI until Atlas commits the lockfile.

## Pre-flight
- **Branch:** `backend/sprint-00/agent-brennan-m1-contract-review-spec-a1`, at 0dce235 (Axis's result commit). `AVEL_BASE` = 6186c57.
- **Part 2 files:** all present, none missing.
  - `.claude/agents/brennan.md`, `codebase-analysis.md`, `contract.md` (all of it), `decisions.md` (all of it), `Step 0 and Step 1 plan.md`, `CR-16 Dispatch package contract.md` and `API and data reference.md`: read in full.
  - `AVEL Database Map.html`: read through its embedded `ERD` data, extracted to a scratch JSON file and queried by script (91 tables, 99 value-list CHECKs).
  - `API routes.md`: the header, the rules and the CR-16 block read; rows 1 to 99 parsed by script.
  - `Change requests CR-1 to 13.md`: CR-10 and CR-13 read in full, and the rest searched.
  - `Backend modules and build plan.md`: sections 4, 9 and 10.
  - `Canon onboarding v0.5.md`: the Build spec's Completion row (line 378).
  - `Schema vs DATABASE.md.md` and `DATABASE.md`: skimmed only. CR-19 makes the map, not either of these, the source for columns.
  - This task doc.
- **brennan.md's Read first list:** Frontend Map v0.6 (searched for paging, `base.ts`, `successStatus`, CR-W2) and Roster setup and sessions are present.
- **`locks.md`:** not in the repo, so no locked paths.
- **Part 7 commands:** all available once I ran `pnpm install` (the worktree had no `node_modules`). The install rewrote `pnpm-lock.yaml`, which belongs to Atlas. I restored it with `git checkout -- pnpm-lock.yaml` before committing.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | f086c13 (findings), this report's commit |

### BRENNAN-01: what I checked, and how
- **Routes (E3), checked by script against `dist/`:**
  - 102 routes. Rows 1 to 99 each appear once, plus CR-16's 3 with `routeNo: null`.
  - Method and path match API routes.md for every parsed row (0 mismatches). The 16 Library routes match D1's paths.
  - `write` is true exactly on the rows marked W.
  - `stepUp` is true exactly on 2, 13, 14, 17 and 45, the rows marked **Step-up**.
  - `caller: "agent"` is set exactly on 94 to 99.
  - CR-16's three are GET-only, operator-only and non-write, and carry the base 16 codes plus CR-16's 4. No other route has CR-16's codes.
  - Each summary is its row's text, word for word.
  - The 20 tags are API routes.md's 19 groups plus "Dispatch package".
- **Value lists (E1):**
  - All 99 `table.column` lists in the map's ERD, with section 3's changes applied, equal the list `checkedColumns` names. That's 0 differences, and no column is missing or extra.
  - The changes applied: the CR-7 and CR-8 roles, CR-7's work kinds, CR-9's `load`, the 3 new integration-commit kinds, and `leased` → `claimed`.
  - The 5 new columns have their section 3 values.
  - The section 3 names (`MissionState` to `DesignSystemLayer`) back exactly the columns the table says.
  - The 3 contract-only lists:
    - `MissionDisplayState` is `MissionState` plus `paused` and `blocked_on_you` (Q8).
    - `DispatchPackageFileKind` is CR-16's literals.
    - `CompletionTaskStatus` (`done`, `parked`, `blocked`): see Limitations.
- **DTOs (E2):**
  - **Matched by script:** each DTO whose doc comment names a map table (58 tables) was compared field by field with that table's camelCased columns. The comparison applied section 6's changes and dropped rule 3's list.
  - **Result:** no extra field, no missing field, nullability matching the map's `required`, `rowVersion` on every mutable table's DTO, and no rule 3 column.
  - **The one addition:** `MissionDto.displayState`, which rule 6 names.
  - **`ClientDto`:** exactly section 4's nine fields.
  - **CR-13's items:**
    - `MissionDto.kind`;
    - `CreateMissionInput.kind`, required;
    - `ListMissionsInput.kind?`;
    - `CreateClientInput.kind`, required;
    - `MissionCreatedPayload.kind`.
  - **Fields that aren't columns:** 94 field names aren't a map column. I went through each one. All but finding 02's trace to a route row's wording (A10), a placeholder named by its row (A8), CR-10 item 7 or the Canon Completion row (the report body), CR-16, or paging (A1).
- **`DispatchPackageDto`:** field for field against the CR-16 block: names, `string` and `number` types, nullability, the `location` object, the `files[].kind` literals, and the comments.
- **Error map (E4):** the 20 codes and their statuses match section 5. `details` shapes:
  - `retryAfterMs` on `TOO_MANY_REQUESTS`;
  - `{ field, currentVersion }` on `STALE_VERSION` (D21), a number for `rowVersion` and `version`, a string otherwise;
  - `{ missionState }` on `DISPATCH_PACKAGE_NOT_RENDERED`;
  - `allowed` on `INVALID_TRANSITION`;
  - the constraint name on the three constraint codes.

  `AGENT_NOT_PERMITTED` and `AGENT_SCOPE` are absent (CR-17 is out).
- **Events (E5):**
  - The 12 kinds and their owners are exactly section 5's table.
  - `Module` is the build plan's 19 modules (section 4), with `contract` as `platform`.
  - I ran done-when 7 myself. With `cli.ran` added to `EventKind`, `tsc` exits 1 with `TS2741: Property '"cli.ran"' is missing`. The original file exits 0.
- **Completion report schema (E6):** the body's sections are the Canon Completion row's six ("tasks, parked tasks, P0 discoveries, issues for others, dependency requests, escalations") plus CR-10 item 7's four (pre-flight results, contract to files, deviations with reasons, limitations). Nothing else is in it.
- **No rep fields (E7):** the only matches are two doc comments saying the fields are dropped. CR-18 item 2 holds too: there are no people routes.
- **Rulings on Axis's choices:**
  - **Accepted:**
    - **D16** (`blocked_on_you` wins): consistent with O2, and no doc contradicts it.
    - **A1 to A13,** except A3's three gaps (finding 01) and A8's route 52 (finding 02).
    - **A1's `limit` of at most 100:** Frontend Map v0.6, line 194.
    - **A4's 201:** line 396.
    - **The exact `@orpc/contract` pin:** line 406.
  - **None needs a CR.** Each fills a gap the docs leave open, and none contradicts an accepted source.
  - **A9 (the template `itemId` string) stays open.** It's marked open in the code (`dto/library.ts:180`), as codebase-analysis.md's Notes require. INT has to name the format before routes 88 and 89 are built.
- **`integration_commits_by_kind_ck`** (decisions.md says "Brennan's m1 review checks the `by_kind` branches"): it isn't in this diff, since it's a `packages/db` object. The contract side is checked: `IntegrationCommitKind` has the map's 4 kinds plus `ui_contract`, `api_contract` and `dispatch_docs`. The branches themselves go to `agent-brennan-m2-db-review-spec`.

## Findings
- `docs/agent-dispatch/backend/sprint-00/findings/m1-contract-brennan-01-writes-without-row-version.md`: P3. Routes 5, 39 and 44 change a mutable row named in their path but send no `rowVersion`, against Axis's own rule A3.
- `docs/agent-dispatch/backend/sprint-00/findings/m1-contract-brennan-02-pending-decision-shape-invented.md`: P3. Route 52's "typed placeholder" fixes a discriminator (`source: 'proposal' | 'factory_change'`) that no doc defines.

## Contract to files
| Item | Files reviewed | Result |
| --- | --- | --- |
| E1 value lists | `src/value-lists.ts` | matches the map plus section 3 (0 differences) |
| E2 DTOs and inputs | `src/dto/*.ts` | rows match the map; findings 01 and 02 |
| `DispatchPackageDto` | `src/dto/dispatch-package.ts` | matches CR-16 field for field |
| E3 102 routes | `src/routes/*.ts`, `src/base.ts`, `src/routes/route.ts` | matches API routes.md and CR-16 |
| E4 error map | `src/errors.ts` | matches section 5 |
| E5 event owners, done-when 7 | `src/events.ts` | matches section 5; a planted kind fails `tsc` |
| E6 completion report | `src/completion-report.ts`, `src/dto/agent.ts` | matches CR-10 item 7 and the Canon Completion row |
| E7 no rep fields | all of `src/` | none |
| Package setup | `package.json`, `tsconfig.json`, `src/index.ts` | builds; D12's name `@avel/contract` |

## Deviations
- **I ran `pnpm install` to build.** It changed `pnpm-lock.yaml` (110 lines added). I restored the file, so it isn't in my diff.
- **The verify command's Expected ("the locked tests pass") isn't met as written.** No locked tests exist on this commit, and `packages/contract/test` is absent, so the command ran zero tests and exited 0. I checked done-when 5's route snapshot, 6 (lists) and 7 (events) by my own scratch scripts instead (BRENNAN-01, above). I didn't commit those scripts, because they're outside Part 5.

## Limitations
- **Locked tests:** Rigg's m1 tests (done-when 5, 6 and 7) haven't run against this contract. My scripts are evidence for this review, not locked tests.
- **Things I accepted, but with only a thin source:**
  - `CompletionTaskStatus` (`done`, `parked`, `blocked`). Its values match the kit's task doc template (`scripts/render.py:557`: "DONE / PARKED / BLOCKED"), which is "the completion report template" Canon line 378 names. Axis's A7 doesn't cite that source.
  - The type of `PutRosterInput.version` (route 48). It's a placeholder, as A8 says.
- **Out of my scope:**
  - The wire error body (`{ code, message, details?, requestId }`) is Step 1's error mapper, as Axis's report says.
  - Route 3's answer while a login is still pending has no shape in any doc. Step 1 item 7 settles it.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Atlas:** CI can't install this branch. `pnpm install --frozen-lockfile` fails with `ERR_PNPM_OUTDATED_LOCKFILE` ("2 dependencies were added: @orpc/contract@1.16.2, zod@4.6.7"). The lockfile change has to land with or before this merge.
- **Rigg:** m1's locked tests (done-when 5, 6 and 7) aren't on this commit. The export surface I checked against: `contract`, `valueLists`, `contractOnlyLists`, `checkedColumns`, `EventKind`, `Module` and `eventOwners`.
- **Axis:** findings 01 and 02.
- **INT:**
  - Copy A1 to A13 into `decisions.md`, with findings 01 and 02's outcomes.
  - Name the template `itemId` format (A9) before Step 12 builds routes 88 and 89.
  - Tell Zero that route 52's shape is provisional (finding 02).
- **Brennan (m2 review):** check `integration_commits_by_kind_ck`'s three new branches. They were deferred here, since they aren't in m1's diff.

## Files changed
```
docs/agent-dispatch/backend/sprint-00/agent-axis-m1-contract-api-contract-completion.md
docs/agent-dispatch/backend/sprint-00/agent-brennan-m1-contract-review-spec-completion.md
docs/agent-dispatch/backend/sprint-00/findings/m1-contract-brennan-01-writes-without-row-version.md
docs/agent-dispatch/backend/sprint-00/findings/m1-contract-brennan-02-pending-decision-shape-invented.md
packages/contract/... (Axis's 51 files, under review)
```
`main...HEAD` includes Axis's commits, since this branch starts at his result commit. My own commits add only the three paths from Part 5 (`git diff --name-only 0dce235..HEAD`, below).

## Verification
Run at f086c13, after a local `pnpm install`, with `set -o pipefail`. Blank lines are trimmed, and absolute paths are shortened to `.`.

```
$ pnpm --filter @avel/contract build
> tsc -p tsconfig.json
exit: 0
$ pnpm --filter @avel/contract test
No test files found, exiting with code 0
exit: 0
$ pnpm build
> pnpm -r --if-present run build
> @avel/contract@0.0.0 build ./packages/contract
> tsc -p tsconfig.json
exit: 0
$ pnpm typecheck
> tsc -p tsconfig.json && pnpm -r --if-present run typecheck
> @avel/contract@0.0.0 typecheck ./packages/contract
> tsc -p tsconfig.json --noEmit
exit: 0
$ pnpm lint
> biome check .
Checked 58 files in 16ms. No fixes applied.
exit: 0
$ pnpm test
> vitest run --config vitest.workspace.ts --passWithNoTests
No test files found, exiting with code 0
exit: 0
$ git diff --name-only main...HEAD
(Axis's 52 paths, under review, plus the three below)
$ git diff --name-only 0dce235..HEAD
docs/agent-dispatch/backend/sprint-00/agent-brennan-m1-contract-review-spec-completion.md
docs/agent-dispatch/backend/sprint-00/findings/m1-contract-brennan-01-writes-without-row-version.md
docs/agent-dispatch/backend/sprint-00/findings/m1-contract-brennan-02-pending-decision-shape-invented.md
```

Scratch checks, against `dist/` and the map's ERD data:
```
routes: total 102; doc rows parsed 83 + Library 16; mismatches 0
stepup 2 13 14 17 45; agent 94 95 96 97 98 99; POST successStatus [201]
map value-list checks 99; checkedColumns 104; bad 0
row DTOs vs map tables: only MissionDto EXTRA displayState (rule 6)
done-when 7: planted "cli.ran" -> TS2741, exit 1; original exit 0
$ pnpm install --frozen-lockfile   (lockfile restored)
ERR_PNPM_OUTDATED_LOCKFILE ... 2 dependencies were added: @orpc/contract@1.16.2, zod@4.6.7
```
