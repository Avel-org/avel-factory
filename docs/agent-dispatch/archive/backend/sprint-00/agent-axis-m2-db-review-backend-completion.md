# AXIS: m2-db review-backend, completion report

verdict: PASS

## Summary
I reviewed Soap's m2-db diff (`ad6d8bf..0eb89e5`) against contract.md section 6, the database map and D38 to D46. I found nothing.
- **Rules in the schema:** every CHECK, FK, unique and index in the migration is declared in the Drizzle schema.
- **Owners:** the owner map matches section 6 table for table.
- **Value lists:** all 104 value-list CHECKs import their contract list.

The one failing locked test is done-when 6 (c), the test defect INT recorded as D46. Per INT's instruction I reviewed the build as it is, so that failure doesn't count against it.

## Pre-flight
- **Part 2 files:** all present and read.
  - `.claude/agents/axis.md`, `codebase-analysis.md`, `contract.md` (sections 1, 3, 6, 7 in full; the rest skimmed), `decisions.md` (this branch's copy, plus D38 to D46 on main at `b784e50`, which INT pointed me to).
  - `Step 0 and Step 1 plan.md`, `AVEL Database Map.html`, `Schema vs DATABASE.md.md`, `Change requests CR-1 to 13.md`, `CR-16 Dispatch package contract.md`, `API routes.md`, `DATABASE.md`, `API and data reference.md`, `Canon onboarding v0.5.md`, `Backend modules and build plan.md`, and this task doc.
  - The design docs outside `packages/db`'s scope were skimmed.
  - `CR-17 Agent access to the CLI.md` (from axis.md's Read first) is present too.
- **Branch:** `backend/sprint-00/agent-axis-m2-db-review-backend-a1`, started at `0eb89e5` (Soap's result commit). `AVEL_BASE=ad6d8bf`.
- **Part 7 commands:** all available after `pnpm install`.
  - The install rewrote `pnpm-lock.yaml`, because the db importer is missing. I restored it with `git checkout`, so it isn't in this commit.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| AXIS-01 | DONE | this report's commit |

## Findings
none

### What I checked, with evidence
- **Rules in the schema, not only the migration.**
  - **Method:** a read-only node script, at the absolute path `/tmp/claude-1000/-home-jt0629-projects-avel-wt-backend-sprint-00-agent-axis-m2-db-review-backend-a1/33c07e2a-a5aa-42ed-a576-175f630fa7a5/scratchpad/names.mjs`. It loads the built `@avel/db` and reads every table with drizzle-orm's `getTableConfig` (checks, FKs, indexes, uniques). It then compares those names with every `CONSTRAINT`/`INDEX` name in `drizzle/0001_schema.sql`.
  - **Output:** `tables 92 schema objects 683 sql objects 702`, with nothing in the SQL that isn't in the schema and nothing in the schema that isn't in the SQL. The 19-object gap is the composite primary keys, all named `<table>_pkey` (D44).
  - **What only 0002 says:** the 67 triggers, and the two FKs made `DEFERRABLE INITIALLY DEFERRED`. Drizzle can express neither (Soap's D-5 and D-6).
  - **What only 0001 says:** `agent_traces`' `PARTITION BY RANGE ("at")` (D-4).
  - Each of these is commented where it lands.
- **Owners match section 6.**
  - **Method:** a script parsed section 6's "One owner per table" table and `packages/db/src/owners.ts`.
  - **Output:** `92 92 17`, with no differences.
  - **Proposed tables:** the ten marked `// proposed` are exactly section 6's ten proposed tables.
  - **Exhaustiveness:** the map is `as const satisfies Record<TableName, Module>`. Excess-property checking on the literal also rejects a table that doesn't exist.
- **Value lists imported.**
  - **Method:** a script checked that every `oneOf`/`oneOfOrNull` call in `src/schema/*.ts` uses the list that `@avel/contract`'s `checkedColumns` names for that column.
  - **Output:** 104 calls against 104 `checkedColumns` entries, with no differences.
  - **Literal lists:** the only ones in `packages/db/src` are the map's rule CHECKs and partial-index predicates, copied word for word as done-when 8 requires (D46). An example is `missions_rendered_ck` at `src/schema/factory.ts:514`.
- **Section 6's named objects:** each one in the new-or-renamed table is in the schema file of its owning module. `rep_id` and `rep_pct` appear nowhere, and no `lease*` column or name survives (CR-6).
- **FK policy:** 202 are `ON DELETE restrict`, 3 are `cascade` (exactly `auth_accounts`, `auth_passkeys` and `auth_sessions` → `users`), and 2 are `no action` (the map's two deferred FKs).
- **D38 to D45 against the code:**
  - **D38:** all six refusals in `drizzle/0000_functions.sql` are `ERRCODE = 'check_violation'` with `CONSTRAINT = TG_NAME`.
  - **D39 and D40:** `freeze_plan` and `freeze_plan_detail` behave as written. All nine tables with `*_frozen → freeze_plan_detail()` have a `plan_id` column, so none of them escapes the freeze silently.
  - **D41 to D43:** match the function bodies.
  - **D44:** 19 composite PKs named `<table>_pkey`.
  - **D45:** no `PARTITION OF` in any migration.
- **A suspected race I ruled out.**
  - **The concern:** `freeze_plan_detail` reads `plans.state` with a plain `SELECT`, so in principle a detail write could commit after its plan was approved.
  - **How I tested it:** in a separate scratch Postgres (`PG_LOCAL_NAME=avel-pg-axis-m2-race`, removed afterwards), I held a `requirements` insert open while another session approved the plan.
  - **Without the FK:** the approval committed first and the detail row landed in an approved plan.
  - **With the real `plan_id` FK:** the approval blocked until the insert committed (`pg_blocking_pids` showed the wait). The cause is `plans_mission_id_id_state_uq`, a map index: it's a non-partial unique index that includes `state`, so a state change takes `FOR UPDATE`. That lock conflicts with the FK's `FOR KEY SHARE`.
  - **Coverage:** every plan-detail table has an FK into `plans`, so the real schema serialises this. No finding.
- **Down migration:** `down/0001` drops all 92 tables in one statement. `down/0002` drops the 67 triggers and sets the two FKs back to `NOT DEFERRABLE`. `down/0000` drops the seven functions. Done-when 1 passes.

## Contract to files
| Item | Files checked |
| --- | --- |
| Section 6: the map's 91 tables plus `design_systems` | `packages/db/src/schema/*.ts`, `drizzle/0001_schema.sql` |
| Section 6: the changes on top (CR-5, CR-6, CR-7, CR-8, CR-9, CR-13, CR-16, CR-18, B9, finding 01) | `platform.ts`, `events.ts`, `onboarding.ts`, `factory.ts`, `knowledge.ts`, `integrator.ts`, `plan.ts`, `evals.ts` |
| Section 6: one owner per table | `packages/db/src/owners.ts` |
| Section 3 and done-when 6: value lists imported | `packages/db/src/schema/columns.ts` and every schema file's imports |
| Section 6: the seven functions and the triggers (D38 to D43) | `drizzle/0000_functions.sql`, `drizzle/0002_hand_written.sql` |
| Done-when 1: migrate up and down | `drizzle/down/*.sql`, `src/migrate.ts` |

## Deviations
- **I read D38 to D46 from main (`b784e50`).** This branch's `decisions.md` predates them, and INT's message told me to check them there.
- **I didn't run drizzle-kit.** I wanted to regenerate the migration into the scratchpad and diff it against `0001_schema.sql`, but two attempts were denied: the first wrote a temporary config file into `packages/db`, outside my territory. I used the read-only `getTableConfig` comparison above instead. It checks object names, not their full definitions; done-when 8 checks the definitions against the map.

## Limitations
- **`pnpm --filter @avel/db test`:** 591 of 592 pass. The failure is done-when 6 (c), a locked-test defect (D46) that Rigg is narrowing under `AVEL_LOCK_OVERRIDE`. So AXIS-01's "Expected" isn't met literally until that fix lands.
- **`pnpm test`:** 22 failures. One is the same D46 test; the other 21 are `tools/docs`' m3 tests, which can't pass until Atlas's m3 build exists.
- **The lockfile:** `pnpm install --frozen-lockfile` fails until INT adds the db lockfile at merge. INT says that's expected.
- **Literal lists in rule CHECKs drift silently:** the rule CHECKs that hold a subset of a list as literals (D-2, D46) won't follow a contract list if it changes. done-when 8 would catch the drift only once the map changes too. I'm noting this, not raising a finding: the map wins (CR-19).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Rigg:** done-when 6 (c) still fails at `0eb89e5`, which is expected until your D46 fix lands. Rerun the db suite on the merge.
- **Atlas (m3):** the ERD has to pick up the triggers and `agent_traces`' partitioning from the SQL migrations, because they aren't in the Drizzle objects (Soap's report, Issues).

## Files changed
`git diff --name-only main...HEAD`. The branch is built on Soap's result commit, so it includes his 36 paths (`packages/db/**` and his report). This review adds only:
```
docs/agent-dispatch/backend/sprint-00/agent-axis-m2-db-review-backend-completion.md
```

## Verification
```
$ pnpm --filter @avel/db test        (AXIS-01; DATABASE_URL unset, so the suite started pg-local.sh)
 ❯ test/done-when-6.value-lists.test.ts (4 tests | 1 failed)
   × [done-when 6] every value-list CHECK in the migrated schema holds exactly the values of one contract list
 Test Files  1 failed | 9 passed (10)
      Tests  1 failed | 591 passed (592)
exit 1      (the D46 test defect)

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
Checked 117 files in 65ms. No fixes applied.
exit 0

$ pnpm test
 ❯ |@avel/db| test/done-when-6.value-lists.test.ts (4 tests | 1 failed)
 ❯ |docs| test/openapi.test.ts (8 tests | 8 failed)
 ❯ |docs| test/drift.test.ts (8 tests | 8 failed)
 ❯ |docs| test/erd.test.ts (5 tests | 5 failed)
 Test Files  4 failed | 12 passed (16)
      Tests  22 failed | 635 passed (657)
exit 1      (1 is D46; 21 are tools/docs' m3 tests, red until Atlas's m3 build)

$ git diff --name-only main...HEAD
Soap's 36 paths (packages/db/** and agent-soap-m2-db-build-completion.md), plus
docs/agent-dispatch/backend/sprint-00/agent-axis-m2-db-review-backend-completion.md
```
The only path this review adds is the report, which is in Part 5.
