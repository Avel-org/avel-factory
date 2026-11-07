# AXIS: m1-contract api-contract, completion report

verdict: PARTIAL

## Summary
`packages/contract` is written and committed: 90 value lists covering the map's 99 CHECKs and section 3's changes, the DTOs and inputs, 102 oRPC route definitions over one base with the error map, the event-owner map (12 kinds, 19 modules), and the completion report schema. Build, typecheck, lint and test pass locally.

The verdict is PARTIAL for two reasons, both outside my territory:
- **CI can't install this branch.** The two new dependencies (`@orpc/contract`, `zod`) need an entry in `pnpm-lock.yaml`, which belongs to Atlas. `pnpm install --frozen-lockfile` fails until Atlas adds it.
- **No locked test has run against the contract.** Rigg's m1 tests aren't on main, so each task's Verify command ran zero tests.

## Pre-flight
- **Part 2 files:** all 22 read. `.claude/agents/axis.md`, `codebase-analysis.md`, `contract.md`, `decisions.md`, Step 0 and Step 1 plan, the database map (read through its embedded `ERD` data), Schema vs DATABASE.md, CR-1 to CR-13, CR-16, API routes.md, DATABASE.md (headings and the sections that touch DTOs), API and data reference, Canon v0.5 (Build spec), the build plan (sections 4 and 5), and Frontend Map v0.6 (Data layer, Contract conventions, Contract change requests, Route count). My Read first list also names CR-17 (read). None missing.
- **`locks.md`:** not in the repo, so there are no locked paths yet.
- **Branch:** `backend/sprint-00/agent-axis-m1-contract-api-contract-a1`, started at `6186c57` (main).
- **Part 7 commands:** all available after `pnpm install`. The worktree had no `node_modules` at the start.
- **Appendix A check:** I re-extracted the map's value-list CHECKs from `ERD.tables[].checks`. All 99 match Appendix A, character for character (`diff` printed nothing).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| AXIS-01 | DONE | c8f4ee5 |
| AXIS-02 | DONE (CI install blocked on the lockfile; see Limitations) | d848bc7, bc1e1dd |
| AXIS-03 | DONE | 902dd6e |

## Contract to files
| Item | Files | How it's checked (scratch checks, not committed) |
| --- | --- | --- |
| E1: value lists, defined once (section 3, Appendix A) | `src/value-lists.ts` | Each list is a `const` array plus a type. `valueLists` (90 lists) and `checkedColumns` (104 columns: Appendix A's 99 plus `clients.kind`, `missions.kind`, `missions.client_kind`, `design_systems.layer`, `design_systems.status`). For all 99, Appendix A's values with section 3's changes equal the list `checkedColumns` names, with 0 mismatches. No two of the 93 exported lists (90, plus 3 that no CHECK uses) share a value set, and no list goes unused. `JobState` has `claimed` |
| Section 3's changes | `src/value-lists.ts` (`DispatchRole`, `WorkKind`, `Level`, `IntegrationCommitKind`, `JobState`, `ClientKind`, `ProjectKind`, `DesignSystemLayer`, `IndexStatus`) | Each change is marked with its CR inline |
| E2: DTOs and inputs (section 4) | `src/dto/*.ts`, one file per route group, plus `dto/common.ts` | See A2 for the drafting rule. `ClientDto` is section 4's exact field list. `MissionDto` has `kind`, `clientKind`, the design-system pin and `displayState` |
| `DispatchPackageDto`, CR-16 word for word | `src/dto/dispatch-package.ts` | The CR-16 block is quoted in the doc comment. The Zod object has the same fields, types, nullability and comments |
| CR-13's contract items (section 4 table) | `dto/missions.ts` (`MissionDto.kind`, `CreateMissionInput.kind` required, `ListMissionsInput.kind?`), `dto/clients.ts` (`ClientDto.kind`, `CreateClientInput.kind` required), `dto/events-and-traces.ts` (`MissionCreatedPayload.kind`) | The metrics split is Step 10 and isn't here |
| E3: 102 routes (section 2) | `src/routes/*.ts`, `src/routes/index.ts` (`contract`), `src/base.ts`, `src/routes/route.ts` | 102 routes, 102 unique method and path pairs. Rows 1 to 99 each appear once, and each matches the method and path in API routes.md (0 mismatches). CR-16's 3 have `routeNo: null`. Step-up is on routes 2, 13, 14, 17 and 45, exactly the rows marked **Step-up**. Routes 94 to 99 have `caller: "agent"`. Every non-GET route is `write: true` |
| E4: error map (section 5) | `src/errors.ts` (`errorMap`, 16 codes on the base; `dispatchPackageErrorMap`, CR-16's 4 on the three CR-16 routes; `ErrorCode` (20); `errorStatus`; `ErrorBody`; `StaleVersionDetails`, D21) | Each status matches section 5's table |
| E5: event kind to owning module, exhaustive (done-when 7) | `src/events.ts` (`EventKind` (12), `Module` (19), `eventOwners ... satisfies Record<EventKind, Module>`) | Adding `"cli.ran"` to `EventKind` with no owner fails `tsc` with `TS2741: Property '"cli.ran"' is missing ...` (exit 1). With the file restored, `tsc` exits 0 |
| E6: completion report schema | `src/completion-report.ts` (`CompletionReportBody`), used by `CompletionReportDto.body` and route 94's input | See A7 |
| E7: no rep fields | everything | `grep -rnE "\brep(Id\|Pct\|_id\|_pct)\b" packages/contract/src` finds only two doc comments saying the fields are dropped |
| Done-when 5, OpenAPI half (Atlas's m3) | none (a scratch trial) | `@orpc/openapi@1.16.2` with `@orpc/zod/zod4` generates OpenAPI 3.1.1 from the built contract: 83 paths, 102 operations |

## Deviations
- **Choices recorded here, not in `decisions.md`.** Part 6 says to record every open choice in `decisions.md`, but Part 5 doesn't let me write `docs/agent-dispatch/**` beyond this report. So they're below, numbered A1 to A13, for INT to copy into `decisions.md` (as D23 onward) if accepted. Brennan checks them.
- **`pnpm-lock.yaml` isn't committed.** It belongs to Atlas. I installed locally, then restored the file before committing. The lockfile change is 110 added lines: the `packages/contract` importer (`@orpc/contract` 1.16.2, `zod` 4.6.7) and their 10 transitive packages (12 packages in all). See Issues for other agents.
- **Commit order: AXIS-01, AXIS-03, AXIS-02.** The DTOs import `EventKind` and `CompletionReportBody`, so AXIS-03's two files landed first, and each commit builds alone.
- **The Verify commands ran no tests.** `packages/contract/test/**` is Rigg's and isn't on main. The package's `test` script is `vitest run --passWithNoTests`, so `pnpm --filter @avel/contract test -- value-lists`, `-- routes` and `-- events` exit 0 with "No test files found". The "route snapshot lists 102 pairs" expectation is shown by my scratch check above, not by a locked test.
- **Summaries are quoted, not paraphrased.** Each route's OpenAPI `summary` is its row's "What it does", word for word. The 16 per-kind Library routes share their row's text.

**My choices (A1 to A13):**
- **A1. Paging** (left open by: section 4 rule 7, "the ported pagination shape". The port isn't in the repo). `PageQuery = { cursor?, limit? (1 to 100) }` and `Page<T> = { items, nextCursor: string | null }`. The limit of 100 is from Frontend Map v0.6, Data layer.
- **A2. How a row DTO is drafted** (left open by: section 4 rule 1 says every field traces, not which columns to include). A row DTO is every map column, camelCased, with section 6's changes, minus rule 3's list (and `lease_epoch` and `lease_until`, CR-6's old names). That's mechanical, so Brennan can check it by script. It keeps a few internal but non-secret columns: `missions.plan_state`, `repo_connections.read_secret_id` and `write_secret_id`, and `uploads.blob_key`. Value-list columns are typed with their list, and `events.kind` with `EventKind`.
- **A3. Which writes carry a version** (left open by: Q4 lists the fields but not the routes). A write that changes an existing mutable row named in its path sends that row's `rowVersion`. Creating a child row (a pause, a message, a waiver) doesn't. Approvals use the field Q4 names:
  - `version` for finalize (the plan version) and decisions (`proposals.version`);
  - `receiptHash` for pass approvals and releases;
  - `headSha` for factory merges.
  The device-login approval (route 2) sends only the user code, since nothing is shown before it.
  Changed before the merge (D25, finding 01): routes 39 (drafts) and 44 (answers) also send `rowVersion`. Route 5 stays without one (exempt).
- **A4. Route metadata** (left open by: no doc says how the contract marks writes or step-up). `RouteMeta = { write, stepUp, caller, routeNo }`, set on every route through `route()`. A POST answers 201 (Frontend Map v0.6: "`successStatus: 201` on creates").
- **A5. Error details** (left open by: D5 says `details` "names the constraint" and "lists the allowed moves", but not as which fields). `ALREADY_EXISTS`, `DELETE_REFUSED` and `CONSTRAINT_VIOLATION` carry `{ constraint }`, and `INVALID_TRANSITION` carries `{ allowed: string[] }`. CR-16's four codes go only on its three routes, so other routes can't return them.
- **A6. The module names** (left open by: section 5 names owners, not the full list). `Module` is the build plan's 19 modules (section 4), with `contract`'s server side named `platform` (CR-15 item 3, as section 6 does).
- **A7. The completion report body** (left open by: CR-10 item 7 and the Canon template name sections but give no shape). It has:
  - from the Canon template's sections: `tasks` (`{ id, status, commit }`), `parkedTasks` (`{ id, tried, why }`), `p0Discoveries`, `issuesForOthers`, `dependencyRequests` and `escalations`;
  - from CR-10's additions: `preflight` (`{ check, passed, output }`, at least one, since Gate 3 refuses a report without it), `contractToFiles` (`{ item, files }`), `deviations` (`{ what, why }`) and `limitations`.
  `CompletionTaskStatus` (`done`, `parked`, `blocked`) is a new contract-only list.
- **A8. Placeholders** (left open by: section 4 rule 6 for routes 21 and 52; the others have no field list in any accepted doc). Each is a `Placeholder` (a JSON record), or a known field plus one:
  - route 7 (`DoctorDto`, one key per item the row names);
  - route 21 (`gateStrip`, `onboarding.progress`, `why`);
  - routes 47 and 48 (`RosterDto.roster`; `version` is the pinned `roster_version`);
  - route 52 (`PendingDecisionDto`, a plain `Placeholder`; changed before the merge from my `source` union, D30, finding 02);
  - routes 72 and 73 (`FactoryChangeDto.change`; `changeId` and `headSha` are known);
  - route 56 (`log`), route 69 (`MetricsDto`) and route 92 (`results`).
- **A9. Template `itemId` is a string** (left open by: Q5 gives the four routes per kind, but `templates` is keyed by `(slug, version)` and has no `id`). Its format is `<slug>@<version>` (e.g. `landing-page@3`, D31); the server parses it, so a template slug can't contain `@`. The other three kinds use the UUID `id`.
- **A10. Fields named after their route row, not a column** (rule 1's second branch):
  - `deviceCode` (route 1), `token` (route 3), `readToken` and `writeToken` (routes 13 and 17);
  - `RepoTokenCheckDto`'s `ok`, `scopes` and `expiresAt` (route 16), and `value` (route 45);
  - `section` (route 38), `verified` (route 61), `missionIds` and `kbReleases` (route 71);
  - route 65's three bodies on `source: 'commit' | 'heartbeat' | 'time'`;
  - `files` (route 75), `body` (routes 79 and 83: the content behind `body_sha256` and `sha256`), and `query` (route 99).
- **A11. Route 57's gate is typed `3 | 4`.** So gates 1, 2 and 5 are refused as 400 `BAD_REQUEST`, not 422.
- **A12. Server-set, not inputs.** These aren't inputs:
  - route 20's `budget_micros` (required with no default in the map; CR-13 says $150 per mission, from config);
  - route 13's token expiry dates (read from GitHub);
  - the design-system pin at finalize (from the plan);
  - `clientKind` (section 4).
  Route 11 can't change `kind`, since the composite FK ties missions to it.
- **A13. Event payloads stay `Json`,** except `MissionCreatedPayload` (`{ kind }`, CR-13), until CR-W1 is decided.

## Limitations
- **CI's install fails on this branch** until the lockfile has the two dependencies (`pnpm install --frozen-lockfile` gives `ERR_PNPM_OUTDATED_LOCKFILE`: "2 dependencies were added: @orpc/contract@1.16.2, zod@4.6.7"). So the merge needs Atlas's lockfile change first, or alongside.
- **The wire error body isn't oRPC's default.** oRPC serializes an error as `{ defined, code, status, message, data }`, and the generated OpenAPI shows that shape. The `{ code, message, details?, requestId }` body in contract.md section 5 needs Step 1's error mapper (item 2.9). The contract exports `ErrorBody` for it.
- **Placeholders (A8)** are typed only as JSON records until their routes' steps decide them.
- **`displayState` precedence (D16)** is in the doc comment only. The server computes it, and Brennan still has to check D16.
- **`ScenarioDto.then`:** the map's column is `scenarios.then`, which Biome's `noThenProperty` flags. It has a scoped `biome-ignore` with the reason: the value is a string, so the object is never thenable.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Atlas** (`pnpm-lock.yaml`): run `pnpm install` on a branch that has `packages/contract/package.json`, and commit the lockfile. It adds the `packages/contract` importer (`@orpc/contract` 1.16.2, `zod` 4.6.7) and their 10 transitive packages (12 in all), 110 lines. For m3's OpenAPI generator: `@orpc/openapi` 1.16.2 with `ZodToJsonSchemaConverter` from `@orpc/zod/zod4` works on this contract (102 operations).
- **Rigg** (m1 tests): the export surface is `@avel/contract`.
  - **Done-when 6:** `valueLists` (90), `contractOnlyLists` (3) and `checkedColumns` (`"table.column"` to list name).
  - **Done-when 7:** `EventKind`, `Module` and `eventOwners`.
  - **Done-when 5:** `contract` (nested router; each procedure's `["~orpc"].route` has `method` and `path`, and `["~orpc"].meta` has `routeNo`).
  - Also exported: `errorMap`, `dispatchPackageErrorMap`, `ErrorCode` and `errorStatus`.
  - Paths carry no query string (route 63 is `GET /api/events/stream`). The package resolves to `dist/`, so tests that import `@avel/contract` need `pnpm build` first, or a relative import of `src/`.
- **Soap** (m2): build each value-list CHECK from `checkedColumns` and `valueLists`, which cover the 99 plus 5 new columns. Step 1's error mapper must turn oRPC errors into `ErrorBody` (Limitations).
- **Brennan** (m1 review): A1 to A13, and D16.
- **Zero, through INT:** `CONFLICT` is only the fallback 409. A stale version is `STALE_VERSION`, and an existing row is `ALREADY_EXISTS` (already in contract.md section 5). `PendingDecisionDto` is a plain placeholder until CR-W2 is decided (D30).
- **INT:** copy A1 to A13 into `decisions.md` if accepted. The lockfile needs Atlas before merge.

## Files changed
```
packages/contract/package.json
packages/contract/src/base.ts
packages/contract/src/completion-report.ts
packages/contract/src/dto/agent.ts
packages/contract/src/dto/audit.ts
packages/contract/src/dto/auth.ts
packages/contract/src/dto/clients.ts
packages/contract/src/dto/common.ts
packages/contract/src/dto/decisions.ts
packages/contract/src/dto/dispatch-package.ts
packages/contract/src/dto/dispatches.ts
packages/contract/src/dto/evals.ts
packages/contract/src/dto/events-and-traces.ts
packages/contract/src/dto/factory.ts
packages/contract/src/dto/gate0.ts
packages/contract/src/dto/gates.ts
packages/contract/src/dto/health.ts
packages/contract/src/dto/library.ts
packages/contract/src/dto/metering.ts
packages/contract/src/dto/missions.ts
packages/contract/src/dto/packages.ts
packages/contract/src/dto/plan.ts
packages/contract/src/dto/receipts.ts
packages/contract/src/dto/your-work.ts
packages/contract/src/errors.ts
packages/contract/src/events.ts
packages/contract/src/index.ts
packages/contract/src/routes/agent.ts
packages/contract/src/routes/audit.ts
packages/contract/src/routes/auth.ts
packages/contract/src/routes/clients.ts
packages/contract/src/routes/decisions.ts
packages/contract/src/routes/dispatch-package.ts
packages/contract/src/routes/dispatches.ts
packages/contract/src/routes/evals.ts
packages/contract/src/routes/events.ts
packages/contract/src/routes/factory.ts
packages/contract/src/routes/gate0.ts
packages/contract/src/routes/gates.ts
packages/contract/src/routes/health.ts
packages/contract/src/routes/index.ts
packages/contract/src/routes/library.ts
packages/contract/src/routes/metering.ts
packages/contract/src/routes/missions.ts
packages/contract/src/routes/packages.ts
packages/contract/src/routes/plan.ts
packages/contract/src/routes/receipts.ts
packages/contract/src/routes/route.ts
packages/contract/src/routes/your-work.ts
packages/contract/src/value-lists.ts
packages/contract/tsconfig.json
docs/agent-dispatch/backend/sprint-00/agent-axis-m1-contract-api-contract-completion.md
```
All of these are in Part 5.

## Verification
Run at bc1e1dd with `set -o pipefail`, after a local `pnpm install`. Blank lines are trimmed.

```
$ pnpm build
> pnpm -r --if-present run build
> @avel/contract@0.0.0 build .../packages/contract
> tsc -p tsconfig.json
exit: 0
$ pnpm typecheck
> tsc -p tsconfig.json && pnpm -r --if-present run typecheck
> @avel/contract@0.0.0 typecheck .../packages/contract
> tsc -p tsconfig.json --noEmit
exit: 0
$ pnpm lint
> biome check .
Checked 58 files in 56ms. No fixes applied.
exit: 0
$ pnpm test
No test files found, exiting with code 0
|@avel/contract|
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exit: 0
$ git diff --name-only main...HEAD
(the 51 packages/contract paths above; this report is added by the last commit)
```

The tasks' Verify commands: each exited 0, with no test files (see Deviations).
```
$ pnpm --filter @avel/contract test -- value-lists   # exit 0, no test files
$ pnpm --filter @avel/contract build                 # exit 0
$ pnpm --filter @avel/contract test -- routes        # exit 0, no test files
$ pnpm --filter @avel/contract typecheck             # exit 0
$ pnpm --filter @avel/contract test -- events        # exit 0, no test files
```

CI's install, on this branch with main's lockfile:
```
$ pnpm install --frozen-lockfile
  specifiers in the lockfile don't match specifiers in package.json:
* 2 dependencies were added: @orpc/contract@1.16.2, zod@4.6.7
exit: 1
```

Scratch checks against `dist/`:
```
routes: 102 unique method+path: 102
route numbers 1..99 each once: true CR-16 (null): 3
doc rows parsed: 99 mismatches: 0
write flag mismatches: 0
step-up routes: 2,13,14,17,45  agent routes: 94,95,96,97,98,99
lists: 90 checked + 3 contract-only; duplicates: 0
Appendix A columns: 99 checkedColumns: 104 mismatches: 0
unused lists: []
error codes: 20 event kinds: 12 modules: 19
openapi: 3.1.1 paths: 83 operations: 102
```

## After review (Brennan m1 PASS at de8b053; INT's answers D25, D30, D31)

One commit on this branch, before the merge (the commit that adds this section; its sha is in the message to INT):
- **D25, finding 01:** route 39 takes the new `DraftCheckpointInput` (`CheckpointIdInput` plus `rowVersion`). Route 44's `AnswerQuestionInput` gains `rowVersion`. Route 5 is unchanged (exempt).
- **D30, finding 02:** `PendingDecisionDto = Placeholder`. The unused `FactoryChangeDto` import is dropped.
- **D31:** the template `itemId` format `<slug>@<version>` is written into A9 above and the `TemplateIdInput` comment. The schema is still `z.string().min(1)`, and the server parses it.

Outcome: `pnpm build`, `pnpm typecheck` and `pnpm lint` exit 0 (`Checked 58 files ... No fixes applied.`). A built-contract check gives these inputs: route 5 `[sessionId]`; route 39 `[checkpointId, rowVersion]`; route 44 `[questionId, rowVersion, answer]`; route 52's item accepts any JSON record. `pnpm-lock.yaml` is untouched.
