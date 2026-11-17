# RIGG: m2-db test-unit, completion report

verdict: DONE

## Summary
The db suite for done-when 1, 2, 3, 6, 8 and 9 is written and committed as one tests commit (`803b869`). It has 592 tests against real Postgres. Before any schema exists, 589 fail on assertions, the same 589 on 3 runs in a row, and 3 pass because they pin existing behaviour and say so in their names. Test 2 has 497 rules, each with its own test. I checked the suite against a throwaway reference schema built from the map (never committed): 588 tests pass, and the 7 schema mutations I planted were each caught.

## Pre-flight
- Read in full: `.claude/agents/rigg.md`, `codebase-analysis.md`, `contract.md`, `decisions.md`, `Step 0 and Step 1 plan.md`, `Schema vs DATABASE.md.md`, and my task doc. I also read the m2-db build task doc (SOAP's), to see which commands it names.
- The database map: all 91 tables were read from its embedded `ERD` data by script, which the suite also does. I did not read the rendered page.
- Read in part:
  - `DATABASE.md`: Integrity rules and the delete policy.
  - `Change requests CR-1 to 13.md`: the header and CR-13.
  - `Backend modules and build plan.md`: the line that names the six functions.
- Not opened: `CR-16 Dispatch package contract.md`, `API routes.md`, `API and data reference.md`, `Canon onboarding v0.5.md`. Nothing in them bears on db tests beyond what `contract.md` quotes.
- Nothing was missing.
- Branch: `backend/sprint-00/agent-rigg-m2-db-test-unit-a1`, started at `6186c57`.
- Part 7: `pnpm build`, `typecheck`, `lint` and `test` are all available. `build` and `typecheck` say "No projects matched" because no package exists yet.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| RIGG-01 | DONE | 803b869 |

## Tests
All in `packages/db/test/`. Every name starts `[done-when N]`.

**Rule count for test 2: 497**, one test each:
- 207 CHECKs, of which 196 are plain value or expression rules and 11 are exactly-one-parent rules.
- 83 unique and partial-unique indexes.
- 207 foreign keys: 204 delete refusals and 3 Better Auth cascades, pinned.

The rules are the map's 199 CHECKs, 81 uniques and 204 foreign keys, with the changes from `contract.md` section 6 applied (`helpers/changes.ts`). The map's reader and the change list are pinned by `done-when-2.count.test.ts`.

| Done-when | File | Tests | Failure line before the schema exists |
| --- | --- | --- | --- |
| 1 | `done-when-1.migration.test.ts` | 3: up applies (every table and the 7 functions); down leaves nothing in `public`; up again after down gives the same schema | `tables the migration did not make: expected [ 'activity_log', …(91) ] to deeply equal []`; `something was applied: expected 0 to be greater than 0`; `the first migrate:up made the schema: expected 0 to be greater than 80` |
| 2, CHECKs | `done-when-2.checks.test.ts` | 196 | `` `migrate:up` must create the schema's tables in the public schema (it created none): expected 0 to be greater than 80 `` |
| 2, exactly-one-parent | `done-when-2.parents.test.ts` | 11: `agent_traces`, `budget_reservations` (2), `secrets`, `closeout_items`, `credentials`, `gate_evaluations`, `integration_commits` (by kind, with the three new branches), `overrides`, `rooms`, `findings` (decided by). Each tries every parent combination and kind against the real table | same |
| 2, uniques | `done-when-2.uniques.test.ts` | 83 | same |
| 2, delete refusals | `done-when-2.deletes.test.ts` | 204 refusals + 3 cascade pins | same |
| 2, count | `done-when-2.count.test.ts` | 1 | **pins existing behaviour: passes** |
| 3 | `done-when-3.cr13.test.ts` | 5 | same |
| 6 | `done-when-6.value-lists.test.ts` | 4 | `packages/db/src has TypeScript files: expected 0 to be greater than 0` (x2); `@avel/contract can be imported: Error: Cannot find package '@avel/contract'` (x2) |
| 8 | `done-when-8.map.test.ts` | 4 | same `migrate:up` line (x2); the other 2 are pinning tests that **pass** |
| 9 | `done-when-9.functions.test.ts` | the 7 functions, plus per-table cases (below) | same `migrate:up` line |

- **Test 3 has 5 tests:**
  - a second internal client is refused;
  - a client mission on the internal client is refused;
  - an internal or template mission on a client is refused;
  - the kind freeze, along the honest path with every constraint in force;
  - the kind freeze through the `missions_frozen` trigger alone (see "How the rules are isolated").
- **Test 6 has 4 tests:**
  - `packages/db/src` exists, imports `@avel/contract`, and has no `pgEnum`;
  - no run of string literals in `packages/db/src` matches a list the schema checks;
  - no two lists exported by the contract have the same values;
  - every value-list CHECK in the migrated schema equals one contract list.
- **Test 8 has 4 tests:**
  - the reader finds the map's counts (91 / 204 / 199 / 81 / 183): **pins, passes**;
  - every difference between map and schema is a listed change, and every listed change is there;
  - the schema equals the map with the changes applied;
  - every change names its source: **pins, passes**.
- **Test 9 per function:**
  - `uuid_generate_v7`: 1 test (version 7, variant, sorts by time, carries the current ms).
  - `touch_updated_at`: 1 committed-clock test, plus 1 per table that has it.
  - `refuse_update`: 7 tables.
  - `freeze_once_set`: 9 table-and-column cases, from the map's trigger arguments.
  - `freeze_plan_detail`: 9 tables.
  - `freeze_plan`: 1.
  - `freeze_after_set`: 1.
  - Plus 3 guard-list tests: exactly seven functions, exactly the 7 `refuse_update` tables, exactly the 9 `freeze_plan_detail` tables.
- **The 3 tests that pass now** are named "pins existing behaviour (passes now)": the map reader's counts, the change list's sources, and the rule count.

## Lock
Tests commit: `803b86959a1940324e7ff8dc08645ff1a238ef23`.

- m2-db · 803b86959a1940324e7ff8dc08645ff1a238ef23 · packages/db/test/**

## Contract to files
| Item | Files |
| --- | --- |
| Done-when 1 | `done-when-1.migration.test.ts` |
| Done-when 2 | `done-when-2.{checks,parents,uniques,deletes,count}.test.ts`, `helpers/rowkit.ts`, `helpers/rules.ts` |
| Done-when 3 | `done-when-3.cr13.test.ts` |
| Done-when 6 | `done-when-6.value-lists.test.ts` |
| Done-when 8 | `done-when-8.map.test.ts`, `helpers/{map,catalog,diff,expected,changes}.ts` |
| Done-when 9, the seven functions | `done-when-9.functions.test.ts` |
| `contract.md` section 6 names table | `helpers/changes.ts`: one entry per row, each with its CR |

## How the rules are isolated
Test 2 can only judge a rule if nothing else can refuse the row. So each test drops every other constraint of that table inside a transaction that is always rolled back. The error must name the rule, and a control row that keeps the rule must go in.

- Postgres finds the breaking and the keeping rows itself, by evaluating the rule over candidate values.
- Unique tests also drop the primary key. Otherwise a key like `(mission_id, id)` could never be hit alone, because the primary key on `id` fires first.
- Test 9 and test 3 keep the triggers on.
- Test 3's trigger-only test drops the match CHECK and the client-kind key, then shows the change is refused with the trigger on and goes through with it off.

## Deviations
- **psql, not a driver.** The workspace has no Postgres client package (`package.json` is Atlas's, and I may not add one), so the helpers drive the `psql` client against the pg-local.sh container. `psql` must be on `PATH`: it is on GitHub's ubuntu runners and here. `DATABASE_URL` is used if set; otherwise the helpers call `scripts/pg-local.sh start`.
- **`pnpm --filter @avel/db test` can't run yet.** `packages/db/package.json` is SOAP's. The tests are already picked up as the `|db|` project by the root `pnpm test`, and they will run under that filter once the package has a `test` script such as `vitest run`.
- **Assumed commands:** the migration commands are SOAP-02's, `pnpm --filter @avel/db migrate:up` and `migrate:down`, with the target database in `DATABASE_URL`. Test 1 and every test that needs the schema use them. `pnpm` exits 0 when no package matches the filter, so the tests also check that tables were actually created.
- **Assumed paths:** test 6 reads `packages/db/src/**/*.ts` and `import("@avel/contract")`. It recognises an export as a value list if it is an array of strings, a Zod enum (`.options`), or a plain object of strings. If the contract exports lists another way, the test needs a small change before the lock. I did not guess further.
- **Function behaviour the docs leave open.** The map has no function bodies. I tested only what the plan and the map's trigger list say, and I'd want INT or Brennan to confirm these before the lock:
  - `freeze_plan`: a draft plan can change and be approved; an approved plan's `brief_snapshot`, `price_micros`, `package_key`, `roster_version`, `version` and `mission_id` can't change; an approved plan can become `superseded`.
  - `freeze_plan_detail`: refuses insert, update and delete once the plan is `approved`. I did not test `superseded`, which the docs don't settle.
  - `freeze_once_set`: a set column can't change; a null column can be set once; a neighbouring column stays free. A no-op update of a set column is not tested.
  - `refuse_update`: refuses `UPDATE` only, not `DELETE`.
  - `touch_updated_at`: `row_version` goes up by 1 on every update, and `updated_at` moves on committed updates.
- **Decisions are in this report, not `decisions.md`.** I have no write access to `decisions.md`.

## Limitations
- The table-owner map (D9, `contract.md` section 6) is not tested. It is not in my done-when list, and its export name isn't specified. Whoever reviews it needs a test.
- Test 8 compares Postgres's own printed forms (`pg_get_constraintdef` and so on). The map was generated on an unknown Postgres version, and the suite ran here on postgres:17-alpine. A different major version could print a CHECK differently and show up as a false difference.
- Test 8 compares value lists regardless of order. The order of values in a list doesn't matter, only the set.
- The agent_traces test makes a throwaway year-2000 partition inside the rolled-back transaction. If SOAP's migration partitions differently, such as hash partitioning, `rowkit.prepare` needs a change. It assumes range partitions on a timestamp.
- The 3 pass-now pins would be the only tests the build can't turn green or red. That is by design.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **SOAP:**
  - `packages/db/package.json` needs a `test` script and the `migrate:up` and `migrate:down` scripts, each reading `DATABASE_URL`. `migrate:down` must leave nothing in the `public` schema (drizzle's own bookkeeping schema may stay).
  - `packages/db/src` must import the value lists from `@avel/contract`.
  - The test suite runs migrations once per test file, so about 9 times per run.
  - The first migration must give every NOT NULL column without a default that `contract.md` leaves undefaulted (`clients.kind`, `missions.kind`, `missions.client_kind`, `usage_log.vendor`) no default, as D20 says.
- **Axis and Brennan (m1 contract):** test 6 needs the contract to export value lists that look like arrays or Zod enums, with no two lists holding the same values (D18).
- **Operator:** lock `packages/db/test/**` at `803b869`.

## Files changed
`git diff --name-only main...HEAD` after this report is committed: the 20 files under `packages/db/test/` plus this report.

```
packages/db/test/done-when-1.migration.test.ts
packages/db/test/done-when-2.checks.test.ts
packages/db/test/done-when-2.count.test.ts
packages/db/test/done-when-2.deletes.test.ts
packages/db/test/done-when-2.parents.test.ts
packages/db/test/done-when-2.uniques.test.ts
packages/db/test/done-when-3.cr13.test.ts
packages/db/test/done-when-6.value-lists.test.ts
packages/db/test/done-when-8.map.test.ts
packages/db/test/done-when-9.functions.test.ts
packages/db/test/helpers/catalog.ts
packages/db/test/helpers/changes.ts
packages/db/test/helpers/db.ts
packages/db/test/helpers/diff.ts
packages/db/test/helpers/expected.ts
packages/db/test/helpers/map.ts
packages/db/test/helpers/model.ts
packages/db/test/helpers/psql.ts
packages/db/test/helpers/rowkit.ts
packages/db/test/helpers/rules.ts
docs/agent-dispatch/backend/sprint-00/agent-rigg-m2-db-test-unit-completion.md
```

## Verification
```
$ pnpm build
No projects matched the filters in ".../backend-sprint-00-agent-rigg-m2-db-test-unit-a1"
exit 0

$ pnpm typecheck
> tsc -p tsconfig.json && pnpm -r --if-present run typecheck
No projects matched the filters in ".../backend-sprint-00-agent-rigg-m2-db-test-unit-a1"
exit 0
(The root tsconfig only includes vitest.workspace.ts. I also type-checked packages/db/test with a temporary tsconfig outside the repo, against tsconfig.base.json: exit 0.)

$ pnpm lint
> biome check .
Checked 27 files in 14ms. No fixes applied.
exit 0

$ pnpm test      (DATABASE_URL from scripts/pg-local.sh; fails first, as it should)
 Test Files  9 failed | 1 passed (10)
      Tests  589 failed | 3 passed (592)
exit 1

$ pnpm --filter @avel/db test
No projects matched the filters in ".../backend-sprint-00-agent-rigg-m2-db-test-unit-a1"
exit 0

$ git diff --name-only main...HEAD    (before this report's commit)
the 20 files under packages/db/test/ listed above, and nothing else
```

Three fail-first runs of `npx vitest run --config vitest.workspace.ts packages/db`: each gave `589 failed | 3 passed`, and the sorted list of failing tests had the same checksum all 3 times (`047a7839…`). The 589 failures group into 6 distinct `AssertionError` messages, and none is a setup, import or syntax error:
- `migrate:up must create the schema's tables in the public schema (it created none)` (the other 579 failures; vitest prints a repeated message once and lists the tests under it);
- `packages/db/src has TypeScript files: expected 0 to be greater than 0` (x2);
- `@avel/contract can be imported` (x2);
- `tables the migration did not make` (x1);
- `something was applied` (x1);
- `the first migrate:up made the schema` (x1).

The evidence that the tests can pass and can catch faults:
- Against a reference schema generated from the map plus `changes.ts`, with my own readings of the seven functions (scratch, deleted before the commit), 587 of 592 passed. The 5 that didn't: 4 for the missing contract package and `packages/db/src`, and 1 for an "already migrated" test that I then removed. Re-run after the final edits, 588 of 593 passed, with the same 5 failing.
- With a stand-in contract and `packages/db/src`, test 6 failed when I planted a repeated list in `packages/db/src` and when I planted two same-valued lists in the contract.
- Seven planted faults were each caught by the expected tests: a dropped CHECK, a dropped partial unique index, a RESTRICT turned CASCADE, a dropped `missions_frozen` trigger, a dropped `refuse_update` trigger on `payments`, a dropped freeze trigger on `plan_modules`, and an un-renamed `lease_epoch`.
