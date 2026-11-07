# ATLAS: m3-docs build, completion report

verdict: DONE

## Summary
`@avel/docs` is built in `tools/docs`:
- `generate` writes the ERD (`erd.md`) from the Drizzle schema and `openapi.json` from the contract's 102 routes.
- `drift` checks DATABASE.md against the schema: tables, columns, optionality, keys, foreign keys, value lists and the ERD's relationships.
- `.github/workflows/docs.yml` runs both and fails on a stale DATABASE.md or a stale `docs/generated/`.

DATABASE.md is brought up to the schema and the drift check reports no drift. All 21 locked m3 tests pass, and so does the whole suite (657). The one thing left for INT is the lockfile: it isn't committed, as in m1 and m2.

## Pre-flight
- **Part 2:** all read, none missing:
  - `.claude/agents/atlas.md` and its Read first list: the Sandbox doc and Roster setup and sessions skimmed for what touches this work; the build plan and the Step 0 plan read in full.
  - `codebase-analysis.md`, `contract.md`, `decisions.md`, `Step 0 and Step 1 plan.md`, `AVEL Database Map.html` (its `ERD` data, including its `domains` and `drift` keys), `Schema vs DATABASE.md.md`, `DATABASE.md` and this task doc: read in full.
  - The CR-1 to 13 doc, CR-16, `API routes.md`, the API and data reference, Canon onboarding v0.5 and the build plan: read for what touches the generated docs and DATABASE.md (CR-2, CR-18, CR-19, Q6).
- **Also read:** Rigg's m3 report (the interface the tests lock), Soap's m2 report (lockfile precedent, notes for m3), `locks.md`, `packages/db` (schema, owners, migrations) and `packages/contract` (routes, errors, value lists).
- **Branch:** `backend/sprint-00/agent-atlas-m3-docs-build-a1`, started at 229000b.
- **Part 7 commands:** all available. `pnpm test` needs Postgres for the db suite: `DATABASE_URL=$(scripts/pg-local.sh start)`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ATLAS-01 | DONE | 5b9ccc6 (with 43a455a: the brace-less link-table entry and the "1 difference" wording) |
| ATLAS-02 | DONE | 43a455a |

## Contract to files
- **Step 0 item 4, done-when 4** (the drift check passes, and fails on a planted mismatch):
  - `tools/docs/src/drift.ts` (the comparison and exit codes), `tools/docs/src/database-md.ts` (the DATABASE.md reader) and `tools/docs/src/schema.ts` (the schema reader and the relationships).
  - The ERD: `tools/docs/src/erd.ts` writes `docs/generated/erd.md`.
  - Locked tests: `tools/docs/test/drift.test.ts` and `erd.test.ts`.
- **Done-when 5, the OpenAPI half:** `tools/docs/src/openapi.ts` writes `docs/generated/openapi.json`. Locked test: `tools/docs/test/openapi.test.ts`.
- **The interface Rigg's tests lock** (his report, Deviations): `pnpm --filter @avel/docs run generate|drift`, `$AVEL_DOCS_OUT`, `$AVEL_DOCS_DATABASE_MD`, "no drift" with exit 0, exit 1 naming each difference. Files: `tools/docs/package.json` and `tools/docs/src/paths.ts`.
- **CI:** `.github/workflows/docs.yml` (drift, generate then `git diff --exit-code docs/generated`, the docs tests). Step 1 item 14 lists these alongside the main CI.
- **Step 0 item 5 and CR-19 item 5** (DATABASE.md brought up to the schema): `docs/design/DATABASE.md`.
  - The 11 tables are in, and `outbox` is gone (the jobs table is the outbox).
  - Every column change from `Schema vs DATABASE.md.md` is in, and so is `design_systems` with the mission's pin (B9).
  - The CR changes on top:
    - CR-2: the "Cost and time" domain, and the Cost branch.
    - CR-5: `usage_log.vendor`.
    - CR-6: `claim_no`, `claim_expires_at` and `'claimed'`, the claim CHECK and the live-key index.
    - CR-7, CR-8 and CR-16: the work kinds, roles and integration-commit kinds, and the `by_kind` rule.
    - CR-9: `load`.
    - CR-13: the kinds, the composite FK, the match CHECK, the one-internal index, the freeze and `templates.source_mission_id`.
    - CR-18: no rep columns.
  - Kept: the spine, the integrity rules, the delete policy, the foreign-key policy, types, ownership and source of truth. Each is corrected to the schema (checked against `0001_schema.sql` and `0002_hand_written.sql`).
- **Supporting files:** `tools/docs/tsconfig.json` (typechecks `src` and the locked tests) and `tools/docs/vitest.config.ts` (test timeout).

## Deviations
- **ATLAS-01's verify needed ATLAS-02 first.** Its drift tests can only pass once DATABASE.md matches the schema. So I built and committed ATLAS-01 (5b9ccc6), finished ATLAS-02, then ran both verify commands; both pass at 43a455a.
- **The lockfile isn't committed.** `pnpm-lock.yaml` isn't in my territory, so I followed m1 and m2: installed locally and left it out. See Issues.
- **New dependencies** (pinned to the workspace's versions): `@orpc/openapi` 1.16.2 and `@orpc/zod` 1.16.2 (the generator and its Zod 4 converter, matching `@orpc/contract` 1.16.2), plus `drizzle-orm` 0.45.4 and `zod` 4.6.7 (already in the lockfile, through m1 and m2), and `@avel/contract` and `@avel/db` from the workspace. `@orpc/server` 1.16.2 comes in as `@orpc/zod`'s peer.
- **My choices, for Axis to review** (no doc fixes them):
  - **D-1. The OpenAPI error bodies are the contract's wire shape.** oRPC's default error body is `{ defined, code, status, message, data }`. Contract.md section 5 (and the contract's `ErrorBody`) says the wire body is `{ code, message, details?, requestId }`, with `details` the code's typed data. So `openapi.ts` uses `customErrorResponseBodySchema` to document that shape, one component per code (`Error_<CODE>`), and a response lists the codes of its status. If Step 1's error mapper ends up sending something else, this has to follow it.
  - **D-2. DTOs are named components.** Every exported `...Dto` Zod schema is a `commonSchemas` entry (output strategy), and inputs stay inline (oRPC splits them into path, query and body). Without components the file was 3.5 MB; it's 734 KB now. `info` is `AVEL API`, version `0.0.0` (the contract package's version).
  - **D-3. The ERD is grouped by owning module** (`tableOwners`), not by the map's domains. The map's domains aren't in `packages/db` (Soap's note), and the generator reads only the schema. DATABASE.md keeps the domains for reading.
  - **D-4. What "drift" means** (the header of `drift.ts`, and DATABASE.md's Source of truth). It compares tables, columns, optionality (`?`), primary keys, every foreign key both ways, value lists, and the relationships. Its rules:
    - **Value lists:** a CHECKed column must show its list, by name or as literals in the contract's order, and it must be the list `checkedColumns` gives that column. A SQL type after `:` must be the column's type.
    - **Columns the specs leave out:** `id` (when no `key (...)` is shown), `created_at`, `row_version` and `updated_at`. DATABASE.md's notation says so.
    - **Relationships:** every FK is drawn as one parent and child pair per table pair (197), with marks the schema decides. `||` means some FK to the parent is required, `|o` that all are optional. `o|` means every FK to the parent is unique in the child, `o{` otherwise.
    - **Exit codes:** 0 no drift, 1 drift, 2 when the check can't run (an unreadable file or a crash), so a crash never reads as drift.
  - **D-5. The doc's diagrams draw all 197 pairs,** grouped by the child's domain. The test's "a relationship removed from the ERD fails" means every pair must be drawn, including the 24 to `users`. Labels kept from the Nov 1 copy where the pair still exists; the rest name their FK columns.
  - **D-6. `skill_loads` moved from Execution to Library,** following the map's domain. `design_systems` is under Library.
  - **D-7. The scripts run from `src`** under Node's type stripping (`--experimental-strip-types`, as `@avel/db`'s `migrate.ts` does), with `.ts` relative imports (`allowImportingTsExtensions`). So `@avel/docs` has no build step; it needs `@avel/db` and `@avel/contract` built (`pnpm build`), as CI does.
  - **D-8. Two tools/docs config files outside `src`:**
    - `vitest.config.ts` sets a 240 s test timeout. The locked tests spawn `pnpm` subprocesses, and the 5 s default is too short.
    - `tsconfig.json` includes `test/`, so the locked tests are typechecked too (they pass). Rigg noted nothing typechecked them before.

## Limitations
- **The drift check doesn't compare the prose,** or the tables under Integrity rules: the FK reference table, the CHECK rules, the exactly-one-parent and unique-index tables. I rewrote them by hand from the schema and the migrations, and they can go stale unseen. DATABASE.md says so under Source of truth.
- **It doesn't compare** defaults, indexes, CHECKs other than value lists, triggers, or column types where the doc gives none.
- **Mermaid output isn't rendered here.** `erd.md` and the doc's diagrams use mermaid's documented erDiagram syntax (types like `text[]`, `PK, FK`, quoted comments), but I had no mermaid renderer to check them.
- **Node version:** checked on Node 24.22.2. CI uses Node 22, where `--experimental-strip-types` and `--disable-warning` exist from 22.6 and 21.3 (`engines` says 22.12 or later), but I didn't run it on 22.
- **Until the lockfile lands,** CI's `pnpm install --frozen-lockfile` fails on this branch (`ERR_PNPM_OUTDATED_LOCKFILE`).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT (lockfile):** run `pnpm install` on this branch and commit `pnpm-lock.yaml` with the merge. It adds the `tools/docs` importer (`@avel/contract` and `@avel/db` from the workspace, `@orpc/openapi` 1.16.2, `@orpc/zod` 1.16.2, `drizzle-orm` 0.45.4, `zod` 4.6.7) and the new `@orpc/*` 1.16.2 packages (`interop`, `json-schema`, `openapi`, `openapi-client`, `server`, `standard-server-*`, `zod`) with their transitive packages. My local diff was +192 lines. `docs.yml` and the main CI both need it.
- **INT (decisions.md):** D-1 to D-8 are here because `decisions.md` isn't in my territory.
- **Axis (m3 review):** D-1 to D-8, and the drift rules in `drift.ts`'s header.
- **Soap and Axis, Step 1:**
  - The OpenAPI document describes errors as `{ code, message, details?, requestId }` (D-1). Step 1's error mapper should send exactly that, or the generator changes with it.
  - A schema change now needs DATABASE.md updated in the same commit, and `pnpm --filter @avel/docs generate` re-run, or CI fails.
- **Rigg:** nothing changed in the locked tests. The plant texts all still match the new DATABASE.md: `## Integrity rules`, a one-line `payments` entry, `contacts: jsonb`, a `clients          {` line and `clients ||--o{ missions : has`.

## Files changed
```
.github/workflows/docs.yml
docs/agent-dispatch/backend/sprint-00/agent-atlas-m3-docs-build-completion.md
docs/design/DATABASE.md
docs/generated/erd.md
docs/generated/openapi.json
tools/docs/package.json
tools/docs/src/database-md.ts
tools/docs/src/drift.ts
tools/docs/src/erd.ts
tools/docs/src/generate.ts
tools/docs/src/openapi.ts
tools/docs/src/paths.ts
tools/docs/src/schema.ts
tools/docs/tsconfig.json
tools/docs/vitest.config.ts
```
All in Part 5. `pnpm-lock.yaml` is modified locally and not committed.

## Verification
Run at 43a455a, with `DATABASE_URL=$(scripts/pg-local.sh start)` for the db suite.

```
$ pnpm build
Scope: 3 of 4 workspace projects
packages/contract build$ tsc -p tsconfig.json
packages/contract build: Done
packages/db build$ tsc -p tsconfig.json
packages/db build: Done
(exit 0; tools/docs has no build step, D-7)

$ pnpm typecheck
...
packages/contract typecheck: Done
packages/db typecheck$ tsc -p tsconfig.json --noEmit
packages/db typecheck: Done
tools/docs typecheck$ tsc -p tsconfig.json
tools/docs typecheck: Done
(exit 0)

$ pnpm lint
> biome check .
Checked 128 files in 68ms. No fixes applied.
(exit 0)

$ pnpm test
> vitest run --config vitest.workspace.ts --passWithNoTests
 Test Files  16 passed (16)
      Tests  657 passed (657)
(exit 0)

$ git diff --name-only main...HEAD   # only paths from Part 5
.github/workflows/docs.yml
docs/design/DATABASE.md
docs/generated/erd.md
docs/generated/openapi.json
tools/docs/package.json
tools/docs/src/database-md.ts
tools/docs/src/drift.ts
tools/docs/src/erd.ts
tools/docs/src/generate.ts
tools/docs/src/openapi.ts
tools/docs/src/paths.ts
tools/docs/src/schema.ts
tools/docs/tsconfig.json
tools/docs/vitest.config.ts
(plus this report, in the next commit)
```

The tasks' own verify commands:
```
$ pnpm --filter @avel/docs test && pnpm --filter @avel/docs generate     # ATLAS-01
 Test Files  3 passed (3)
      Tests  21 passed (21)
wrote erd.md and openapi.json to .../docs/generated
(exit 0; git diff --exit-code -- docs/generated afterwards: no change)

$ pnpm --filter @avel/docs drift                                         # ATLAS-02
no drift: .../docs/design/DATABASE.md matches the schema (92 tables, 207 foreign keys, 197 relationships)
(exit 0)
```

Planted mismatches, run by hand on copies (each exit 1):
```
- table ghost_table: in DATABASE.md (line 817), not in the schema
- table payments: in the schema, not in DATABASE.md
- clients.contact_list: in DATABASE.md, not in the schema
- clients.contacts: in the schema, not in DATABASE.md
- clients.rep_id: in DATABASE.md, not in the schema
- relationship clients ||--o{ missions: in the schema, not in DATABASE.md's ERD
- jobs.state: DATABASE.md's value list lacks 'claimed' and has 'leased', which JobState doesn't
```
An unreadable file: `drift: can't read /nonexistent/x.md: ENOENT ...`, exit 2.
