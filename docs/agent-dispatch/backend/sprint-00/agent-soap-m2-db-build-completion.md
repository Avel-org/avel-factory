# SOAP: m2-db build, completion report

verdict: PARTIAL

## Summary
`packages/db` is built. It has the map's 91 tables plus `design_systems`, with section 6's changes, the seven functions with their 67 triggers, the table-owner map, and the first migration with its down migration. 591 of the 592 locked db tests pass, including all of done-when 8 (the schema matches the map) and done-when 9 (the functions).

The one failure is a defect in a locked test, not in the build. Done-when 6's fourth test can't pass on any schema that passes done-when 8 (Deviations, D-1). So SOAP-01's "the locked db suite passes" isn't met in full, which is why the verdict is PARTIAL. SOAP-02 is done.

## Pre-flight
- **Part 2 files:** all read; none missing.
  - Read in full: `.claude/agents/soap.md`, `codebase-analysis.md`, `contract.md`, `decisions.md` (D1 to D37, B1 to B9, O1 and O2, F01 to F09), `Step 0 and Step 1 plan.md`, `Schema vs DATABASE.md.md`, and this task doc.
  - The database map: read through its embedded `ERD` data, by script: every table, column, default, FK, CHECK, unique, index, trigger and rule text. That is also what the locked suite reads.
  - Read for the parts that touch the schema: `Change requests CR-1 to 13.md` (CR-13, the freeze), `Backend modules and build plan.md` (section 10, the six functions), and `DATABASE.md` (Plans are frozen, Ownership).
  - Skimmed (nothing in them bears on `packages/db` beyond what `contract.md` quotes): `CR-16 Dispatch package contract.md`, `API routes.md`, `API and data reference.md`, `Canon onboarding v0.5.md`.
  - Also read: `packages/contract/src/value-lists.ts` and `events.ts` (`checkedColumns`, `valueLists`, `Module`), the locked suite and its helpers, and Rigg's m2 and Axis's m1 reports.
- **Branch:** `backend/sprint-00/agent-soap-m2-db-build-a1`, started at `ad6d8bf` (main). The m2-db lock is in `locks.md` (803b869), and m1 is merged (d4098fa).
- **Part 7 commands:** all available after `pnpm install` (the worktree had no `node_modules`). Postgres came from `scripts/pg-local.sh` (postgres:17-alpine).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| SOAP-01 | BLOCKED on one locked test (D-1). Everything else in it is done: 591 of 592 tests pass | 94871cb |
| SOAP-02 | DONE | 3151810, 90999ad |

## Contract to files
| Item | Files |
| --- | --- |
| The map's 91 tables, by name, plus `design_systems` (B9): every column, type, default, NOT NULL, PK, FK (RESTRICT; Better Auth's 3 cascade; the map's 2 NO ACTION deferred), CHECK, unique, partial unique and index | `src/schema/<module>.ts`, one file per owning module (17 files) |
| Section 6's changes, each with its source in a comment where it lands (CR-5, CR-6, CR-7, CR-8, CR-9, CR-13, CR-16, CR-18, B9, INT finding 01) | the same files; `jobs` in `platform.ts`, `clients` and `usage_log` in `onboarding.ts`, `missions` in `factory.ts`, `templates` and `design_systems` in `knowledge.ts`, `integration_commits` in `integrator.ts` |
| CR-2's label ("Cost and time") | the table doc comments in `metering.ts`. It's a label, not an object |
| Value lists imported from `@avel/contract`, never written out: 104 value-list CHECKs from `checkedColumns` (all 90 `valueLists` are used) | `src/schema/columns.ts` (`oneOf`, `oneOfOrNull`), and the imports in each schema file |
| The seven functions (the map's six, plus `freeze_after_set`) | `drizzle/0000_functions.sql` |
| The triggers: the map's 65, `missions_frozen` and `design_systems_touch_updated_at` | `drizzle/0002_hand_written.sql` |
| The table-owner map (D9; contract.md section 6), exhaustive at compile time | `src/owners.ts` (`tableOwners`, `TableName`, `tables`) |
| The first migration (done-when 1) and its down migration | `drizzle/0000_functions.sql`, `0001_schema.sql`, `0002_hand_written.sql`, `drizzle/meta/`, `drizzle/down/*.sql`, `src/migrate.ts`, `drizzle.config.ts`, and the `package.json` scripts `migrate:up`, `migrate:down` and `generate` |
| Done-when 1, 2, 3, 8, 9 | pass: 3, 497 + 1, 5, 4 and 78 tests |
| Done-when 6 | 3 of 4 pass; test (c) fails (D-1) |

## Deviations
- **D-1. A locked test contradicts another locked test.** Done-when 6 test (c) ("every value-list CHECK in the migrated schema holds exactly the values of one contract list") fails on 15 CHECKs. I didn't change it.
  - **What the test does:** its `listOf` takes the first `ARRAY[...]` of **every** CHECK, not just the value-list ones.
  - **Which CHECKs it hits:** 15 of the map's rule CHECKs hold a subset of a list inside a rule. For example, `jobs_finished_ck` is `(state <> ALL (ARRAY['done', 'dead'])) OR (finished_at IS NOT NULL)`, and `deliveries_connection_ck` uses `ARRAY['pr', 'push']`. No contract list is `[done, dead]`, so the test fails.
  - **Why it's the test:** done-when 8 requires these 15 CHECKs exactly as the map prints them, and that test passes.
  - **Shown without my build:** run the test's own `listOf` over the locked helpers' expected schema (`helpers/rules.ts` `checkRules`: the map plus `changes.ts`) against the contract's `valueLists`. It flags the same 15:
    - `deliveries_connection_ck`, `device_logins_approved_ck`, `facts_source_said_ck`;
    - `findings_reviewed_commit_ck`, `_cites_ck`, `_closed_decided_ck`, `_reason_ck`, `_fixed_by_ck`;
    - `integration_commits_finished_ck`, `jobs_finished_ck`;
    - `missions_started_ck`, `_state_rendered_ck`, `_state_delivered_ck`;
    - `module_runs_build_base_ck`, `_landed_ck`.
  - **Why Rigg's check didn't catch it:** his reference run had no contract package, so test (c) never ran against real lists (his report: "4 for the missing contract package").
  - **A fix, for Rigg and INT:** apply (c) only to the value-list CHECKs, such as `checkRules` whose def matches `^\(\((\w+) = ANY` or the `IS NULL) OR` form, or the names in `checkedColumns`. Alternatively, accept subset arrays inside rule CHECKs. Every one of the 104 value-list CHECKs does equal a contract list; (c) reports only these 15.
- **D-2. Lists inside rule CHECKs are copied from the map's printed form.** The 103 non-value-list CHECKs (207 in all, minus the 104 value-list ones) are the map's definitions, word for word. The 15 above include partial lists such as `ARRAY['done'::text, 'dead'::text]`. Those are rules over a list, not the list itself, so I didn't rebuild them from contract values. Test 6(b) (no list written in `packages/db/src`) passes.
- **D-3. "The first migration" is three drizzle-kit files, named like the map's own source** (`0000_functions.sql`, `0001_schema.sql`, `0002_hand_written.sql`; the map was generated from migrations with those names).
  - **Why three:** functions must exist before the tables (their defaults call `uuid_generate_v7()`), and triggers after. drizzle-kit can express neither, so 0000 and 0002 are `drizzle-kit generate --custom` and 0001 is `drizzle-kit generate`.
  - **What `migrate:down` does:** reverses every applied migration, newest first (`drizzle/down/<tag>.sql`), in one transaction, and removes their rows from `drizzle.__drizzle_migrations`. That's drizzle-orm's bookkeeping, outside `public`.
- **D-4. One hand edit in a generated file:** `0001_schema.sql` has `) PARTITION BY RANGE ("at");` on `agent_traces`. drizzle-kit has no partitioning, and the map has the table partitioned (key `(trace_seq, at)`). `drizzle-kit generate` still reports "No schema changes", because the snapshot doesn't track partitioning.
- **D-5. The two deferred FKs** (`dispatches_task_doc_fk`, `missions_current_plan_fk`) are declared in the Drizzle schema. 0002 then makes them `DEFERRABLE INITIALLY DEFERRED` (`ALTER CONSTRAINT`), because drizzle-kit can't say it. Each carries a comment.
- **D-6. Triggers are in SQL, not in the Drizzle schema.** Drizzle has no trigger API. Every CHECK, index and FK is in the schema itself, as SOAP-01 asks.
- **Choices the docs leave open (for INT to copy into `decisions.md` if accepted).** I can't write it. Brennan to check:
  - **S1. Refusals are `check_violation` with `CONSTRAINT` set to the trigger's name** (for example `missions_frozen`). So Step 1's mapper reports a freeze or immutability refusal as `CONSTRAINT_VIOLATION` (422) with `details.constraint`, the same way as a CHECK.
  - **S2. `freeze_plan`:**
    - a draft changes freely;
    - once a plan isn't a draft, every column except `state`, `row_version` and `updated_at` is frozen;
    - `state` may move only from `approved` to `superseded`.
    - That's D36's six columns and more: the plan's whole content.
  - **S3. `freeze_plan_detail`** freezes once the plan's state isn't `draft`, so `superseded` too (D36 leaves `superseded` untested). An update is checked against both the old and the new `plan_id`.
  - **S4. `freeze_once_set`:**
    - a set column can't change;
    - a null one can be set;
    - an argument naming a column the table lacks raises an error;
    - a no-op update of a set column is allowed.
  - **S5. `touch_updated_at`** sets `updated_at = now()` (transaction time, as the column defaults) and adds 1 to `row_version`.
  - **S6. `uuid_generate_v7`** is built on `gen_random_uuid()` (core Postgres 13 and later; no extension): 48 bits of ms time, version 7, and the RFC variant.
  - **S7. Composite primary keys are named `<table>_pkey`.** The map doesn't record PK names, and done-when 8 compares only the columns.
  - **S8. No `agent_traces` partitions are created by the migration.** The map has none, and "partitioned by week" is runtime work.
- **The lockfile isn't committed.** `pnpm-lock.yaml` is Atlas's. I installed locally, then restored it (as Axis did for m1). See Issues.
- **Decisions are here, not in `decisions.md`:** my territory doesn't include it.

## Limitations
- **The locked db suite isn't all green:** 591 of 592 (D-1).
- **CI's install fails on this branch** until the lockfile has the db importer: `pnpm install --frozen-lockfile` gives `ERR_PNPM_OUTDATED_LOCKFILE`. The merge needs Atlas's lockfile change first, or with it.
- **`agent_traces` takes no rows until a partition exists** (S8). The locked suite makes its own year-2000 partition, and Step 5's trace stream needs the weekly partition job.
- **`migrate.ts` runs under Node type stripping** (`--experimental-strip-types`). That's silent on Node 24 and on 22.18 or later, and prints an experimental warning on 22.12 to 22.17. It imports only `pg`, drizzle-orm and node builtins, never the schema.
- **`generate` and `pnpm --filter @avel/db test` need `@avel/contract` built** (`pnpm build`), because the contract resolves to `dist/`. CI builds before it tests.
- **The owner map has no runtime test.** Its exhaustiveness is a compile-time `satisfies Record<TableName, Module>`, checked by hand: removing `users` or adding an unknown table each fails `tsc`. Rigg noted that no locked test covers it.
- **Postgres version:** the suite ran on postgres:17-alpine, as CI does. Another major version could print a CHECK differently (Rigg's note).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Rigg and INT:** done-when 6 test (c) needs the fix in D-1 before the db suite can go green. A test change is INT's decision (`AVEL_LOCK_OVERRIDE`).
- **Atlas** (`pnpm-lock.yaml`): run `pnpm install` on a branch with `packages/db/package.json` and commit the lockfile. It adds the `packages/db` importer: `@avel/contract` (workspace), `drizzle-orm` 0.45.4, `pg` 8.23.1, `@types/pg` 8.23.1 and `drizzle-kit` 0.31.11, plus their transitive packages. My local diff was +1097/−20 lines.
  - pnpm skips esbuild's build scripts ("Ignored build scripts: esbuild"). drizzle-kit worked here regardless, through its platform binary package.
- **Atlas (m3):**
  - The ERD generator can read the schema from `@avel/db`: `tables` (every Drizzle table) and `tableOwners`; drizzle-orm's `getTableConfig` gives the columns, FKs, CHECKs and indexes.
  - The map's domain grouping isn't in `packages/db`. CR-2's "Cost and time" is only in the table doc comments. If the ERD groups by domain, that data has to come from somewhere; the map's `ERD.tables[].domain` has it.
  - The triggers and the partitioning are in `drizzle/0002_hand_written.sql` and `0001_schema.sql`, not in the Drizzle objects.
- **Soap, Step 1:** the triggers raise `check_violation` with the trigger as the constraint (S1), so the error mapper needs no special case.
- **Brennan and Axis (m2 reviews):** S1 to S8, D-3 to D-5.

## Files changed
`git diff --name-only main...HEAD` (with this report):
```
docs/agent-dispatch/backend/sprint-00/agent-soap-m2-db-build-completion.md
packages/db/drizzle.config.ts
packages/db/drizzle/0000_functions.sql
packages/db/drizzle/0001_schema.sql
packages/db/drizzle/0002_hand_written.sql
packages/db/drizzle/down/0000_functions.sql
packages/db/drizzle/down/0001_schema.sql
packages/db/drizzle/down/0002_hand_written.sql
packages/db/drizzle/meta/0000_snapshot.json
packages/db/drizzle/meta/0001_snapshot.json
packages/db/drizzle/meta/0002_snapshot.json
packages/db/drizzle/meta/_journal.json
packages/db/package.json
packages/db/src/index.ts
packages/db/src/migrate.ts
packages/db/src/owners.ts
packages/db/src/schema/audit.ts
packages/db/src/schema/cli.ts
packages/db/src/schema/columns.ts
packages/db/src/schema/compute.ts
packages/db/src/schema/delivery.ts
packages/db/src/schema/evals.ts
packages/db/src/schema/events.ts
packages/db/src/schema/factory.ts
packages/db/src/schema/gate.ts
packages/db/src/schema/index.ts
packages/db/src/schema/integrator.ts
packages/db/src/schema/knowledge.ts
packages/db/src/schema/metering.ts
packages/db/src/schema/onboarding.ts
packages/db/src/schema/packages.ts
packages/db/src/schema/plan.ts
packages/db/src/schema/platform.ts
packages/db/src/schema/rules.ts
packages/db/src/schema/runner.ts
packages/db/tsconfig.json
```
Every path is in Part 5. No locked path is touched: `scripts/check_locks.py` exited 0.

**How the schema files were written:** a scratch script, not committed, read the map's `ERD` data and contract.md section 6 and wrote the Drizzle TypeScript. Biome then formatted it. The committed files are plain Drizzle code, and done-when 8 checks the result against the map.

## Verification
Task verify commands:
```
$ pnpm --filter @avel/db test                (SOAP-01; DATABASE_URL unset, so the suite starts pg-local.sh)
 FAIL  test/done-when-6.value-lists.test.ts > [done-when 6] every value-list CHECK in the migrated schema holds exactly the values of one contract list
AssertionError: CHECK lists that no contract list has: expected [ …(15) ] to deeply equal []
 Test Files  1 failed | 9 passed (10)
      Tests  1 failed | 591 passed (592)
exit 1

$ pnpm --filter @avel/db migrate:up && pnpm --filter @avel/db migrate:down     (SOAP-02; DATABASE_URL = an empty database)
> node --experimental-strip-types src/migrate.ts up
> node --experimental-strip-types src/migrate.ts down
migrate:down: reversed 0002_hand_written
migrate:down: reversed 0001_schema
migrate:down: reversed 0000_functions
exit 0

$ npx vitest run test/done-when-1.migration.test.ts      (after the last package.json change)
      Tests  3 passed (3)

$ cd packages/db && npx drizzle-kit generate
No schema changes, nothing to migrate 😴

$ scripts/check_locks.py
exit 0
```

Part 7:
```
$ pnpm build
Scope: 2 of 3 workspace projects
packages/contract build$ tsc -p tsconfig.json
packages/contract build: Done
packages/db build$ tsc -p tsconfig.json
packages/db build: Done
exit 0

$ pnpm typecheck
> tsc -p tsconfig.json && pnpm -r --if-present run typecheck
Scope: 2 of 3 workspace projects
packages/contract typecheck: Done
packages/db typecheck: Done
exit 0

$ pnpm lint
> biome check .
Checked 117 files in 143ms. No fixes applied.
exit 0

$ pnpm test
 ❯ |@avel/db| test/done-when-6.value-lists.test.ts (4 tests | 1 failed)
 ❯ |docs| test/drift.test.ts (8 tests | 8 failed)
 ❯ |docs| test/openapi.test.ts (8 tests | 8 failed)
 ❯ |docs| test/erd.test.ts (5 tests | 5 failed)
 Test Files  4 failed | 12 passed (16)
      Tests  22 failed | 635 passed (657)
exit 1
```
- **The 22 failures:**
  - 1 is D-1.
  - The other 21 are `tools/docs`' locked m3 tests, which fail first by design because the m3 build (Atlas) doesn't exist yet: "No projects matched the filters", "openapi.json was not written", "erd.md was not written". `tools/docs` has only its `test/` folder.
- **The contract's tests pass** (they're among the 635).

```
$ git diff --name-only main...HEAD
(the list in Files changed: packages/db/** and this report only)
```
