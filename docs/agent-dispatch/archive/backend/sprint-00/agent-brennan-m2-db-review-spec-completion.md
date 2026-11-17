# BRENNAN: m2-db review-spec, completion report

verdict: PASS

## Summary
I reviewed Soap's `packages/db` (0eb89e5, base ad6d8bf) column by column against the database map, the Step 0 table and contract.md section 6. My cross-check of the live schema against the map doesn't use Rigg's helpers. It finds the map's 999 columns with no type, NOT NULL or default difference, except section 6's adds, drops and renames, and nothing else. Every section 6 object is present with its definition. The owner map matches section 6, and so do Soap's S1 to S8 (D38 to D45).

The locked db suite is 591 of 592. The one failure is done-when 6 (c), which I independently confirm is the test's defect (D46), not the build's. I filed one P3 finding, against the contract rather than the build: CR-13's freeze on `missions.kind` can be undone by clearing `onboarding_started_at` first.

## Pre-flight
- **Part 2 files:** all 18 read; none missing.
  - Read in full: `.claude/agents/brennan.md`, `codebase-analysis.md`, `contract.md`, `decisions.md`, `Step 0 and Step 1 plan.md` and this task doc.
  - The database map: read through its embedded `ERD` data, by my own script (columns, defaults, triggers).
  - Searched for what touches `packages/db`: `Schema vs DATABASE.md.md` (Patterns), `Change requests CR-1 to 13.md` (CR-13), `DATABASE.md`, and `Backend modules and build plan.md` (section 10).
  - Skimmed (nothing in them bears on the schema beyond what contract.md quotes): `CR-16 Dispatch package contract.md`, `API routes.md`, `API and data reference.md` and `Canon onboarding v0.5.md`.
  - `brennan.md`'s Read first list: `AVEL Web App — Frontend Map v0.6.md` and `Roster setup and sessions.md` are present, and I checked them only for territory.
- **Also read: `decisions.md` on main (b784e50), D38 to D46.** INT pointed me to it mid-session (see Deviations).
- **Branch:** `backend/sprint-00/agent-brennan-m2-db-review-spec-a1`, started at 0eb89e5 (Soap's report commit). `AVEL_BASE` is ad6d8bf.
- **Part 7 commands:** all available after `pnpm install`. That changes `pnpm-lock.yaml` (Atlas's), so I restored it with `git checkout`. Postgres came from `scripts/pg-local.sh` (postgres:17-alpine).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | this report's commit |

## Findings
- `docs/agent-dispatch/backend/sprint-00/findings/m2-db-brennan-01-kind-freeze-reopens-when-gate-cleared.md`: **P3**. `missions.kind`'s freeze can be bypassed in two updates by clearing `onboarding_started_at` first. The build does what contract.md says; the gap is in the contract. It's for INT and Axis, and it doesn't block the merge.

## Contract to files
What I checked, how I checked it, and where it lands:

| Item | How checked | Result | Files |
| --- | --- | --- | --- |
| The map's 91 tables plus `design_systems`, every column, type, NOT NULL and default | My own script: the map's `ERD` JSON against `pg_attribute`/`pg_attrdef` of a scratch DB after `migrate:up` | Map 999 columns, live 1013. Only-in-map: `clients.rep_id`, `missions.rep_id`, `missions.rep_pct`, `jobs.lease_epoch`, `jobs.lease_until`, `consumer_cursors.lease_epoch` (CR-18, CR-6). Only-live: `jobs.claim_no`, `jobs.claim_expires_at`, `consumer_cursors.claim_no` (CR-6), `usage_log.vendor` (CR-5), `clients.kind`, `missions.kind`, `client_kind`, `templates.source_mission_id` (CR-13), `missions.design_system_slug`/`_version` and the 10 `design_systems` columns (B9). 0 type, NOT NULL or default diffs on the 993 shared columns. New defaults are only `design_systems`' (as `templates`') and `claim_no 0` (as `lease_epoch`'s) | `src/schema/*.ts`, `drizzle/0001_schema.sql` |
| Section 6's names table, every row | Read in `0001_schema.sql`/`0002_hand_written.sql` against each definition | All present, with names and definitions as written: `jobs_claim_ck`, `jobs_expired_claims_ix`, `jobs_one_live_key_uq` (queued, claimed), `clients_kind_ck`, `_one_internal_uq`, `_id_kind_uq`, `missions_kind_ck`, `_client_kind_ck`, `_client_kind_match_ck`, `_client_kind_fk` (RESTRICT), `_client_kind_ix`, `_frozen`, `_design_system_fk`/`_pair_ck`/`_ix`, `templates_source_mission_id_*`, `design_systems_*`, and `integration_commits_by_kind_ck`'s three branches. `rep_*` columns, FKs and indexes are gone | `drizzle/0001_schema.sql` lines 1710-1820 and 1834-2037, `0002_hand_written.sql:81` |
| No invented object | Every allowed difference in the locked `changes.ts` traces to a section 6 row, and done-when 8 (all 4 tests) passes. `drizzle-kit generate` says "No schema changes" | Clean | — |
| Value lists imported, never repeated (section 3; done-when 6) | Every value-list CHECK uses `oneOf`/`oneOfOrNull` with a contract list. The names match section 3's shared lists (`MissionState` on `mission_pauses.interrupted_state`, `DispatchState` on `parked_from`, `LibraryLayer` on `rules.scope`, `ArchiveStatus` on `clients.status`/`notes.state`, `IndexStatus` ×5, `Package` ×2, `Stage` ×2, `DesignSystemLayer`). My script: the 104 `checkedColumns` CHECKs in the live DB each equal one `valueLists` list; none is off | Clean | `src/schema/columns.ts`, the schema files |
| The 15 rule CHECKs holding sub-lists (Soap D-2) | Each is the map's text word for word (done-when 8). They're rules over a list, not a list | Accepted; D46 covers the test | `drizzle/0001_schema.sql` |
| The seven functions (section 6; D36; D38 to D45) | Read each body against D36 and D38 to D45, and against Schema vs DATABASE.md.md, Patterns | Each matches. D38 checked live: `ERROR 23514`, `CONSTRAINT NAME: missions_frozen`, `TABLE NAME: missions`, `COLUMN NAME: kind`. D43 checked live: version nibble 7, variant 8 | `drizzle/0000_functions.sql` |
| The triggers: map 65 + 2 | 67 `CREATE TRIGGER`; the map's ERD has 65. The 46 tables with `row_version` are exactly the 46 with `*_touch_updated_at`. The 7 immutable tables and the 9 plan-detail tables (each has `plan_id`) are as Schema vs DATABASE.md.md, Patterns, lists them | Clean | `drizzle/0002_hand_written.sql` |
| The two deferred FKs, `agent_traces` partitioned, no partitions (D45) | Read, and done-when 8 compares `deferred` and `partitioned` | Clean | `0002_hand_written.sql` lines 8-11, `0001_schema.sql` (`agent_traces`) |
| The table-owner map (D9; section 6) | My script: `owners.ts` against section 6's owner table. Each schema file holds only tables its module owns | 92 = 92, 0 differences; 0 tables in the wrong file | `src/owners.ts`, `src/schema/<module>.ts` |
| Done-when 1, 2, 3, 8, 9 | `pnpm --filter @avel/db test` | Pass | `packages/db/test/**` (locked) |
| Done-when 6 | The same | 3 of 4. (c) fails on 15 rule CHECKs; it's the test's defect (D46), confirmed above | — |

## Deviations
- **I read `decisions.md` on main (b784e50, D38 to D46) as well as at my start commit.** INT's message in this session told me to check S1 to S8 against D38 to D45. That's an operator instruction about which decisions apply, not a description of the work, so I followed it. My start commit's `decisions.md` ends at D37.
- **`git diff --name-only main...HEAD` lists Soap's 36 paths as well as mine.** That's because my session starts on Soap's result commit. My own commit adds only the two Part 5 paths.
- **I made and dropped one scratch database (`brennan_probe`)** in this worktree's pg-local container, to read the live schema and try the freeze. Nothing in the repo changed.

## Limitations
- **`uuid_generate_v7` doesn't sort within a millisecond.** Two ids from the same ms came out as `01a1b453-ad2e-7eba-…` then `01a1b453-ad2e-721d-…`. D43 accepts 48 bits of ms time with random bits after, and RFC 9562 allows it, so this isn't a finding. Step 1 shouldn't use id order as event or insert order (`events.seq` is what does that).
- **Not checked by me directly:** the map's FK, CHECK, unique and index lists, item by item. The locked done-when 8 compares all of them, including `onDelete`, `deferred` and `partitioned`, and it passes. I checked its allowed differences (`changes.ts`) against section 6 instead.
- **CI's install fails on this branch** until the lockfile has the db importer (Soap's report; INT adds it at merge).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT and Axis:** finding m2-db-brennan-01 (P3). Decide whether CR-13's freeze must survive a cleared `onboarding_started_at` (option A: `freeze_once_set('onboarding_started_at')` on `missions`, a section 6 change, and a test from Rigg) or whether that's left to the server (option B: a line in `decisions.md`).
- **INT, the lock:** D46. On the build at 0eb89e5 I confirm the narrowed (c) passes: all 104 value-list CHECKs hold a contract list. Rigg's fix should pass on this build unchanged.
- **Soap, Step 1:** trigger refusals arrive as SQLSTATE 23514 with `constraint` set to the trigger name (D38), so they map as `CONSTRAINT_VIOLATION`. A missing-column argument to `freeze_once_set`/`freeze_after_set` raises P0001. That's a schema bug, not a request error, and it should surface as a 500.

## Files changed
`git diff --name-only main...HEAD`, my commit's paths only:
```
docs/agent-dispatch/backend/sprint-00/agent-brennan-m2-db-review-spec-completion.md
docs/agent-dispatch/backend/sprint-00/findings/m2-db-brennan-01-kind-freeze-reopens-when-gate-cleared.md
```
The full list also has Soap's 36 paths under `packages/db/**` and his report (Deviations).

## Verification
Task verify (BRENNAN-01):
```
$ pnpm --filter @avel/db test
 ❯ test/done-when-6.value-lists.test.ts (4 tests | 1 failed)
     × [done-when 6] every value-list CHECK in the migrated schema holds exactly the values of one contract list
AssertionError: CHECK lists that no contract list has: expected [ …(15) ] to deeply equal []
   (deliveries_connection_ck, device_logins_approved_ck, facts_source_said_ck, findings_cites_ck,
    findings_closed_decided_ck, findings_fixed_by_ck, … : the 15 rule CHECKs in Soap's D-1)
 Test Files  1 failed | 9 passed (10)
      Tests  1 failed | 591 passed (592)
exit 1
```
Expected: "the locked tests pass". They pass except done-when 6 (c), the locked-test defect INT ruled on in D46. I confirm it independently: all 104 value-list CHECKs equal a contract list (Contract to files).

```
$ npx drizzle-kit generate          (in packages/db)
No schema changes, nothing to migrate 😴
```

Part 7:
```
$ pnpm build
packages/contract build: Done
packages/db build$ tsc -p tsconfig.json
packages/db build: Done
exit 0

$ pnpm typecheck
packages/contract typecheck: Done
packages/db typecheck$ tsc -p tsconfig.json --noEmit
packages/db typecheck: Done
exit 0

$ pnpm lint
Checked 117 files in 113ms. No fixes applied.
exit 0

$ pnpm test
 ❯ |@avel/db| test/done-when-6.value-lists.test.ts (4 tests | 1 failed)
 ❯ |docs| test/openapi.test.ts (8 tests | 8 failed)
 ❯ |docs| test/drift.test.ts (8 tests | 8 failed)
 ❯ |docs| test/erd.test.ts (5 tests | 5 failed)
 Test Files  4 failed | 12 passed (16)
      Tests  22 failed | 635 passed (657)
exit 1
```
The 22 failures: 1 is D46. The other 21 are `tools/docs`' locked m3 tests, which fail first by design: the m3 build (Atlas) isn't written yet. That's the same as Soap's run.

```
$ git diff --name-only main...HEAD
```
See Files changed: Soap's 37 paths plus my 2, which are both Part 5 paths.
