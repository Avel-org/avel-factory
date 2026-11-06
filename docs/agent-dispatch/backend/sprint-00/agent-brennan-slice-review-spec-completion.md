# BRENNAN: slice review-spec, completion report

verdict: PASS

## Summary
I re-reviewed `contract.md` and `decisions.md` as at 5e45543.
- **a1's findings:** all seven are closed, each by a line I cite below. INT's answers to 01 and 02 are applied as written.
- **Checked by script:** the routes, `DispatchPackageDto`, Appendix A, the shared-list table, the Step 0 change table, the names table and the owner table all check out against their sources.
- **Two new P3 findings:**
  - 08: `usage_log.vendor` has no definition.
  - 09: two inaccurate lines in decisions.md.
- **Neither blocks m1.** Fix 08 before m2 starts.

## Pre-flight
- **Branch:** `backend/sprint-00/agent-brennan-slice-review-spec-a2`, starting at 5e45543 (`AVEL_BASE`). `AVEL_BASE..HEAD` was empty at the start, as the task doc says it would be.
- **Part 2 files:** all read, none missing.
  - `.claude/agents/brennan.md`, `codebase-analysis.md`, `contract.md`, `decisions.md`.
  - `Step 0 and Step 1 plan.md`, `AVEL Database Map.html` (its ERD data), `Schema vs DATABASE.md.md`, `Change requests CR-1 to 13.md`, `CR-16 Dispatch package contract.md`, `API routes.md`, `DATABASE.md`, `API and data reference.md`, `Canon onboarding v0.5.md`, `Backend modules and build plan.md` (sections 8 to 10 in full).
  - This task doc.
- **brennan.md's Read first list:** Frontend Map v0.6 and Roster setup and sessions are present. I read Frontend Map v0.6 where the slice cites it (lines 92, 393 and 476).
- **Part 7 commands:** `pnpm` is installed, but there's no `package.json` yet, because Atlas's m0 workspace isn't on main. All four pnpm commands fail with `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` (Verification). `git diff` is available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | 99a4256 (findings), this report's commit |
| BRENNAN-02 | DONE | 99a4256 |
| BRENNAN-03 | DONE | 99a4256 |

### BRENNAN-01: routes and shapes
- **The task's verify command** printed `QUOTES-MATCH`. That covers two things:
  - the 99 routes match `API routes.md` lines 20 to 189, apart from the heading levels;
  - `DispatchPackageDto` matches CR-16 lines 28 to 50.
- **CR-16's three route rows** (contract.md:216–220) match API routes.md lines 192 to 196 byte for byte. `diff` shows only the slice's heading and a trailing blank line.
- **CR-16's errors, query and access** (contract.md:222–223 and :349–352) match the CR-16 contract's Routes and Errors sections (lines 52–73).
  - The four 404 codes are there, with `details: { missionState }` on `DISPATCH_PACKAGE_NOT_RENDERED`.
  - CR-16's Touches says "3 error codes", but its own table lists four. The slice follows the table, which is right.

### BRENNAN-02: tables and lists
- **The map's counts:** `{'tables': 91, 'foreignKeys': 204, 'checks': 199, 'uniques': 81, 'indexes': 183}`, as expected.
- **Appendix A against the map:** I rebuilt Appendix A from the map's `ERD.tables[].checks`, taking every "col = ANY (ARRAY[...])" CHECK and every "col IS NULL OR ..." CHECK. That gives 99 rows. Compared as sets, they're identical to contract.md:502–600 (`APPENDIX-A-SET-MATCH`). Only the row order differs.
- **Shared lists:** I grouped Appendix A by identical value sets and found 10 groups. Each one has its own row in section 3's table (contract.md:235–249), so after D18 no two contract lists share a value set. That still holds after the CR changes:
  - `ClientKind`, `ProjectKind` and `DesignSystemLayer` match no existing set;
  - the changed `DispatchRole`, `WorkKind`, `Level`, `jobs.state` and `integration_commits.kind` lists all stay unique.
- **Canon's enums:** `Topic` and `FactKind = Topic | ...` match Canon onboarding v0.5 lines 291–293.
- **Section 3's changes** (contract.md:257–269): each cites CR-6, CR-7, CR-8, CR-9, CR-13, CR-16, B2, B3, B4 or B9, and I checked each against its text.
- **Section 6's "Applied on top" table** (contract.md:385–399) matches the Step 0 plan's table byte for byte (`STEP0-TABLE-MATCH`). It also covers every row of `Schema vs DATABASE.md.md`'s "What Step 0 still has to add" table.
  - CR-19 item 2 limits the schema changes to that table. So CR-10's per-task reference field and CR-13's template discovery topics are rightly left to later steps.
- **The names table** (contract.md:412–453), checked against the map's objects:
  - **CR-6:** every object that names lease or `leased` is renamed or redefined. That's 2 columns in `jobs`, 1 in `consumer_cursors`, `jobs_state_ck`, `jobs_lease_ck`, `jobs_one_live_key_uq` and `jobs_expired_leases_ix`.
  - **CR-18:** every rep object is dropped. That's 3 columns, 2 FKs and 2 indexes. `rep_pct` has no CHECK in the map.
  - **The naming patterns** each match a map example: `plans_template_fk`, `_ix` and `_pair_ck`; `repo_connections_client_id_id_uq`; `templates_factory_commit_factory_versions_sha_fk`; `kb_entries_client_layer_ck`; `attempts_frozen`.
  - **The claim at :435 and :445** ("the map indexes 196 of its 204 FKs, including every one-column FK outside `agent_traces`") is true. The 8 FKs without a leading-column index are the 2 in `agent_traces` and 6 composites.
  - **One gap:** `usage_log.vendor` has no definition (finding 08).
- **The owner table** (contract.md:459–477) names 92 distinct tables, each once: the map's 91 plus `design_systems`. Nothing is missing, and nothing outside the map is named except `design_systems`.

### BRENNAN-03: decisions
- **The count:** `grep -cE "^- \*\*(D|B)[0-9]+\." decisions.md` gives 31. That's D1 to D22 and B1 to B9, and I checked each one. I also checked O1 and O2 (decisions.md:197–198).
- **Checked against their sources:**
  - **D1 and D4:** API routes.md rows 74–89, and the arithmetic, which reaches 99.
  - **D5:** Frontend Map v0.6:393, and INT's B6 answers.
  - **D7 and D8:** the map's `onboarding_sessions_package_*_ck` and `dispatches_parked_ck`, quoted.
  - **D16:** no doc sets a precedence between pauses. API and data reference Q8 (line 39) and the build plan were searched. So it's a choice the docs leave open, and it contradicts nothing.
  - **D18 and D19:** derived from the map's patterns, as above.
  - **D20:** `kind` on the create-client input. CR-13's "Contract" line doesn't list it. Step 1 test 6, though, expects "creating a second internal client" to get 409, so a client create has to be able to carry `internal`. Sourced.
  - **D21:** Frontend Map v0.6:393 asks for "the current version on a 409". Every `version` a write carries (plans and checkpoints) is an integer in the map, so `currentVersion`'s types hold.
  - **B4 and B7 rechecks:** against the map's `completion_reports` and `mission_pauses`. One count is wrong (finding 09).
  - **Map statistics** (decisions.md:165): 999 columns, 124 rules and 65 triggers. All three match.
  - **O1:** Design v0.6 Main:534 names the `mission.closed` event.
  - **O2:** INT's answer.
  - **Event owners:** CR-15 item 8 is build plan line 209. `dispatch.*` and `attempt.*` come from Dispatch concept line 32.
- **No D entry changes the map, a route or an accepted CR without an INT answer or a CR.**
  - **`freeze_after_set`** adds a seventh function to CR-19's six. INT recorded it in answer to finding 02 (decisions.md:239).
  - **The `ui_contract` and `api_contract` branch** is stricter than the map's `tests` branch, on INT's words (decisions.md:237). It's raised for INT in contract.md section 7 and decisions.md's "Open: for INT".

### a1's findings
| a1 finding | State | Closed by |
| --- | --- | --- |
| slice-brennan-01 (P1) contract-commit parent shape | **closed** | contract.md:402–405 applies INT's answer as written (decisions.md:237): `ui_contract` and `api_contract` take `(module_run_id IS NOT NULL) AND (attempt_id IS NULL) AND (dependency_request_id IS NULL)`; `dispatch_docs` takes the `operator` shape, citing CR-16 line 84. The gap between "the tests shape" and "the other two parents null" is raised for INT (contract.md:485; decisions.md "Open: for INT"). It changes one CHECK in m2 and nothing in m1. |
| slice-brennan-02 (P2) freezing `missions.kind` | **closed** | contract.md:381 defines `freeze_after_set(<gate column>, <column>, ...)` against the old row's gate column. contract.md:436 adds `missions_frozen` with `freeze_after_set('onboarding_started_at', 'kind')`, and :453 lists the function. INT's answer is at decisions.md:239. plan.toml lines 273 and 281–292 name seven functions. |
| slice-brennan-03 (P2) unnamed objects | **closed** | contract.md:410–453, the names table. CR-6's names are CR-6's (`jobs_claim_ck`, `jobs_expired_claims_ix`; CR doc line 88), and `jobs_one_live_key_uq`'s predicate is at :418. The one gap left is a column's definition, not a name: finding 08. |
| slice-brennan-04 (P2) CR-13's contract items | **closed** | contract.md:313–324: `MissionDto.kind`, route 20's required `kind`, route 19's optional `?kind=`, and the metrics split deferred to Step 10 (CR-13 line 327, "the metrics split in Step 10"). The route rows are unchanged. |
| slice-brennan-05 (P3) stale decisions | **closed** | D2 at decisions.md:16, D5 at :75, D6 at :78 and the B9 pin at :153 are all marked superseded or corrected. B3 (:123) stays as history, as a1 allowed. The same staleness in D3 (:20) wasn't covered: finding 09. |
| slice-brennan-06 (P3) shared value lists | **closed** | contract.md:240–253: `Topic`, `FactKind` as `Topic` plus the rest, `EvalSet`, `LibraryLayer`, `IndexStatus`, `ArchiveStatus`, `DesignSystemLayer`, and the repeat rule. D18 is at decisions.md:234. |
| slice-brennan-07 (P3) citations | **closed** | contract.md:369: `receipt.issued`'s source is now Frontend Map v0.6 lines 92 and 476, plus B5. contract.md:341 and :354 give `STALE_VERSION`'s `details` (D21). contract.md:355 is the `CONFLICT` note for Zero. |

## Findings
- `docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-08-usage-log-vendor-undefined.md`: P3. The names table adds `usage_log.vendor` with no type, nullability or default.
- `docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-09-decisions-accuracy.md`: P3. decisions.md: D3 still says the map isn't in the repo, and the B7 recheck miscounts `mission_pauses`' CHECKs.

## Contract to files
| Item | Checked in | Result |
| --- | --- | --- |
| E3, 102 routes | contract.md section 2 against API routes.md 20–189 and 192–196 | match |
| E2, `DispatchPackageDto` | contract.md:275–297 against CR-16 28–50 | match |
| E2, CR-13 items and `ClientDto` | contract.md:311–324 against CR-13 line 325 and the map's `clients` | match; no rep fields (E7) |
| E1, value lists | contract.md section 3 and Appendix A against the map's 99 list CHECKs | match; no repeats |
| E4, errors | contract.md:328–356 against D5, CR-16 and Frontend Map v0.6:393 | match |
| E5, 12 event kinds | contract.md:363–375 against the build plan, Dispatch concept, CR-15 item 8, CR-16, Design Main:534, O1 and B5 | match |
| E6, completion report | contract.md:33 against CR-10 item 7 and the map's `completion_reports` | match |
| Section 6, tables | against the map, the Step 0 table, the Schema-vs "still has to add" table and CR-6, CR-13 and CR-18 | match, apart from finding 08 |
| Owner table | contract.md:459–477 against the map | 91 + `design_systems`, each once |
| Decisions | decisions.md D1–D22, B1–B9, O1, O2 | sourced, apart from finding 09 |

## Deviations
- **Not a diff review.** As the task doc's notes say, the work is two files at the start commit. I read them whole, along with `git diff ffc6914 5e45543` for what changed since a1.
- **Appendix A compared as sets.** The slice orders rows by the map's CHECK order within each table, and my script sorts them, so I compared them as sets.

## Limitations
- **The ERD extraction counts list CHECKs by pattern:** `col = ANY (ARRAY[...])`, with or without `col IS NULL OR`. I listed the CHECKs that use `ANY (ARRAY` in another shape to confirm none of them is a column value list. They're state rules, such as `findings_cites_ck` and `missions_started_ck`.
- **`version` types for D21:** I checked them against the map's `version` columns. Exactly which routes send `version` isn't fixed until the DTOs exist (m1), so Brennan's m1 review should recheck it.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Axis:**
  - Fix finding 08 in contract.md section 6 before m2 starts.
  - Fix finding 09 in decisions.md whenever convenient.
  - Neither blocks m1.
- **INT:** one point is still open from finding 01's answer. Should `ui_contract` and `api_contract` null `attempt_id`, as your parenthetical says, or follow the map's `tests` branch, which leaves it free? It changes one CHECK in Soap's m2 and nothing in m1 (contract.md:485).
- **Zero (frontend lead), through INT:** in this contract, `CONFLICT` no longer means a stale version. A stale version is `STALE_VERSION`, with `details: { field, currentVersion }`, and an existing row is `ALREADY_EXISTS` (contract.md:341, :345 and :355). `packages/contract-mock` and the web's error handling should follow.
- **Rigg (m2):**
  - Done-when 9 covers seven functions.
  - `mission_pauses` has five CHECKs, not four.
  - Take the counts from the map, not from decisions.md.

## Files changed
```
$ git diff --name-only main...HEAD
docs/agent-dispatch/backend/sprint-00/agent-brennan-slice-review-spec-completion.md
docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-08-usage-log-vendor-undefined.md
docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-09-decisions-accuracy.md
```

## Verification
```
$ pnpm build
 ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  No package.json (or package.yaml, or package.json5) was found in ".../backend-sprint-00-agent-brennan-slice-review-spec-a2".
$ pnpm typecheck
 ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  (same)
$ pnpm lint
 ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  (same)
$ pnpm test
 ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  (same)
```
There's no workspace on main yet (Atlas's m0), and this review changes only markdown, so none of the four can run here.

```
$ diff <(sed -n '20,189p' 'docs/design/API routes.md' | sed 's/^## //') <(sed -n '/^### Auth (5)/,/^\*\*Total: 99.\*\*/p' docs/agent-dispatch/backend/sprint-00/contract.md | sed 's/^### //') && diff <(sed -n '28,50p' 'docs/design/CR-16 Dispatch package contract.md') <(sed -n '/^```ts/,/^```$/p' docs/agent-dispatch/backend/sprint-00/contract.md) && echo QUOTES-MATCH
QUOTES-MATCH
$ python3 -I -c "...ERD...; print(e['stats'])"
{'tables': 91, 'foreignKeys': 204, 'checks': 199, 'uniques': 81, 'indexes': 183}
$ grep -cE "^- \*\*(D|B)[0-9]+\." docs/agent-dispatch/backend/sprint-00/decisions.md
31
$ diff <(sort appA_map.md) <(sort appA_slice.md) && echo APPENDIX-A-SET-MATCH
APPENDIX-A-SET-MATCH
$ diff <(Step 0 plan "Applied on top" rows) <(contract.md section 6 "Applied on top" rows) && echo STEP0-TABLE-MATCH
STEP0-TABLE-MATCH
$ (owner table vs map)
owner rows: 92 distinct: 92 dupes: []  missing from owner table: []  not in map: ['design_systems']
$ (FK index coverage)
FKs 204 leading-column covered 196
```
