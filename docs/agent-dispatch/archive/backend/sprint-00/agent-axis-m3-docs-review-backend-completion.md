# AXIS: m3-docs review-backend, completion report

verdict: PASS

## Summary
The drift check really compares: it reads every table spec and erDiagram in DATABASE.md and checks tables, columns, optionality, keys, foreign keys (composite ones too), value lists and relationship marks in both directions. It caught 16 of the 19 mismatches I planted beyond Rigg's locked cases. The 21 locked tests pass, the committed ERD and OpenAPI document match a fresh generate, and the OpenAPI document has the contract's 102 operations. One P3 finding: DATABASE.md's sentence about implied columns is wrong for 7 tables, and the drift check skips those columns, so it can't catch that. The lockfile isn't committed (disclosed by Atlas; INT commits it at merge, as in m1 and m2).

## Pre-flight
- Part 2 files: all 16 read. Present: `.claude/agents/axis.md`, `codebase-analysis.md`, `contract.md`, `decisions.md`, `Step 0 and Step 1 plan.md`, `AVEL Database Map.html`, `Schema vs DATABASE.md.md`, `Change requests CR-1 to 13.md`, `CR-16 Dispatch package contract.md`, `API routes.md`, `DATABASE.md`, `API and data reference.md`, `Canon onboarding v0.5.md`, `Backend modules and build plan.md`, and this task doc. Also read `CR-17 Agent access to the CLI.md` and `locks.md`. I read the parts that bear on m3 in full (Step 0 items 4 and 5, contract.md section 6 and item 5, D13, DATABASE.md notation and Source of truth) and skimmed the rest.
- Branch `backend/sprint-00/agent-axis-m3-docs-review-backend-a1`, started at `c595719` (Atlas's result). `AVEL_BASE=229000b`.
- Part 7 commands: all available. `pnpm install --frozen-lockfile` fails at c595719 (`ERR_PNPM_OUTDATED_LOCKFILE`, the uncommitted `tools/docs` importer). I ran `pnpm install --no-frozen-lockfile` locally (+192 lines in `pnpm-lock.yaml`, the same as Atlas reports), then restored the file with `git checkout -- pnpm-lock.yaml` before committing. The db suite ran against `scripts/pg-local.sh start`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| AXIS-01 | DONE | this report's commit |

What I checked for AXIS-01:
- **Diff read in full:** `.github/workflows/docs.yml` and `tools/docs/**` line by line. The DATABASE.md diff in part, and checked as a whole through the drift check. `docs/generated/**` checked by regenerating it.
- **Locked tests:** `pnpm --filter @avel/docs test` gives 21 of 21 passed. `git diff --stat ae759fb HEAD -- tools/docs/test` is empty, and `scripts/check_locks.py` exits 0.
- **Drift on the real file:** `no drift ... (92 tables, 207 foreign keys, 197 relationships)`, exit 0.
- **Drift fails on a mismatch.** I planted each of these in a copy of DATABASE.md, ran the check through `AVEL_DOCS_DATABASE_MD`, and every one exited 1 and named the difference:
  - a column's optional flag flipped;
  - a value list missing a value, the CR-6 `'leased'` put back, values in a different order, the wrong list name, the list left off;
  - a foreign key pointed at the wrong table, or dropped;
  - the wrong key, or a dropped key;
  - the wrong SQL type;
  - the wrong relationship mark;
  - a composite foreign key with its parent columns swapped, or dropped;
  - the CR-18 `users ||--o{ clients` edge put back;
  - a table specified twice.
- **Passed as designed (3):** a column inside a `/* */` comment (comments are notation); `updated_at` written out on a table that has it; a numeric annotation `claim_no: 1|2`, which `drift.ts:85` accepts without comparing (see Limitations).
- **Generators:** `AVEL_DOCS_OUT=<scratch> pnpm --filter @avel/docs generate` is byte-identical to the committed `docs/generated/erd.md` and `openapi.json`. The OpenAPI document has 102 operations on 83 paths, none under `/api/auth` or the webhook (Q6). It has 20 `Error_<CODE>` bodies shaped `{ code, message, details?, requestId }` (contract.md section 5).
- **CI:** `docs.yml` runs drift, then a generate with a `git diff --exit-code` (with `--intent-to-add`, so new files count too), then the tests. The root `pnpm test`, `typecheck` and `lint` cover `tools/docs`.

## Findings
- `docs/agent-dispatch/backend/sprint-00/findings/m3-docs-axis-01-implied-columns-unchecked.md`: P3. DATABASE.md's implied-column sentence (line 44) is wrong for 7 tables, and the drift check can't see it.

## Contract to files
- Step 0 item 4, done-when 4 (the drift check passes, and fails on a planted mismatch): `tools/docs/src/drift.ts`, `tools/docs/src/database-md.ts`, `tools/docs/src/schema.ts`, `.github/workflows/docs.yml`. Locked tests: `tools/docs/test/drift.test.ts` and `erd.test.ts`.
- Step 0 item 4, the ERD: `tools/docs/src/erd.ts` writes `docs/generated/erd.md`.
- Done-when 5, the OpenAPI half: `tools/docs/src/openapi.ts` writes `docs/generated/openapi.json`. Locked test: `tools/docs/test/openapi.test.ts`.
- Step 0 item 5 (DATABASE.md up to the schema): `docs/design/DATABASE.md`, with finding 01 against line 44.
- D13 (generators in `tools/docs/`, output in `docs/generated/`): followed.

## Deviations
- I ran `pnpm install --no-frozen-lockfile` locally so I could build and test, because the lockfile isn't committed. I restored `pnpm-lock.yaml` before committing and changed nothing else outside Part 5.

## Limitations
- I didn't check DATABASE.md's prose, or its Integrity rules tables, against the schema. The drift check leaves them out by design (DATABASE.md, Source of truth), and Brennan's review-spec covers the docs.
- `drift.ts:85` accepts a numeric annotation (`col: 1|2|3`) without comparing it. DATABASE.md uses none today (`grep -nE ":\s*[0-9]+(\s*\|\s*[0-9]+)+" docs/design/DATABASE.md` matches nothing), so I didn't raise a finding. If one is ever written, it goes unchecked.
- Value lists are compared with `@avel/contract`'s `checkedColumns`, not with the CHECK SQL itself. That the schema's CHECKs use those lists is the db suite's job (done-when 6 and 8).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** commit `pnpm-lock.yaml` with the merge. `pnpm install` on this branch adds the `tools/docs` importer and the `@orpc/*` 1.16.2 packages (+192 lines). Without it, the `pnpm install --frozen-lockfile` step in both `ci.yml` and `docs.yml` fails.
- **ATLAS:** finding 01 (DATABASE.md line 44, and the implied columns in `drift.ts`), whenever INT schedules it. P3, so it doesn't block this merge.

## Files changed
My commit adds:
- `docs/agent-dispatch/backend/sprint-00/agent-axis-m3-docs-review-backend-completion.md`
- `docs/agent-dispatch/backend/sprint-00/findings/m3-docs-axis-01-implied-columns-unchecked.md`

`git diff --name-only main...HEAD` also lists Atlas's m3 paths, which are the work under review. They're under Verification.

## Verification
```
$ pnpm build                                          # exit 0
packages/contract build: Done
packages/db build: Done

$ pnpm typecheck                                      # exit 0
packages/db typecheck: Done
tools/docs typecheck$ tsc -p tsconfig.json
tools/docs typecheck: Done

$ pnpm lint                                           # exit 0
> biome check .
Checked 128 files in 62ms. No fixes applied.

$ DATABASE_URL=$(scripts/pg-local.sh start) pnpm test # exit 0
 Test Files  16 passed (16)
      Tests  657 passed (657)

$ pnpm --filter @avel/docs test                       # AXIS-01's verify
 Test Files  3 passed (3)
      Tests  21 passed (21)

$ git diff --name-only main...HEAD   # before my commit; mine adds the two paths above
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
(Run with the lockfile installed locally and uncommitted. See Pre-flight.)
