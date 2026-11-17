# RIGG: m3-docs test-unit, completion report

verdict: DONE

## Summary
21 tests for done-when 4 (ERD generation and the DATABASE.md drift check, with five planted-mismatch cases) and done-when 5's OpenAPI half. All 21 fail with an assertion, the same way on 3 runs, because `@avel/docs` doesn't exist yet. The tests run `generate` and `drift` as subprocesses, so nothing imports code that isn't there. The interface they lock is under Deviations.

## Pre-flight
- Part 2: read: rigg.md, codebase-analysis.md, contract.md (sections 2 and 6, Appendix A), decisions.md, Step 0 and Step 1 plan, the database map (its `const ERD` data), DATABASE.md, API and data reference, Backend modules and build plan (skimmed). Skimmed rather than read in full: Schema vs DATABASE.md, the CR docs, CR-16, API routes, Canon onboarding. Atlas's m3 task doc: read. Nothing missing.
- Branch `backend/sprint-00/agent-rigg-m3-docs-test-unit-a1`, started at 6186c57.
- Part 7: `pnpm build`, `typecheck`, `lint` and `test` all run. `locks.md` doesn't exist in this worktree.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| RIGG-01 | DONE | ae759fb0af84f378266fb09f892797df8d457473 |

## Tests
All in `tools/docs/test/`. Every one fails first (3 runs, identical). The two kinds of assertion failure:
- drift tests: `AssertionError: expected 'No projects matched the filters in "/…' to match /no drift/i` (the planted cases fail on their control step, the same way; "a planted mismatch never edits the file" fails with `expected +0 to be 1`).
- generate tests: `AssertionError: erd.md was not written: expected false to be true` (and the same for `openapi.json`).

`drift.test.ts` (done-when 4):
1. the schema and docs/design/DATABASE.md agree: exit 0 and 'no drift'
2. the check only reads DATABASE.md: the file is the same after a run
3. a table in DATABASE.md that the schema lacks fails, naming it (`ghost_table`)
4. a schema table missing from DATABASE.md fails, naming it (`payments`)
5. a column renamed in DATABASE.md fails, naming the old and the new (`contacts`, `contact_list`)
6. a dropped rep column put back fails, naming it (CR-18, `rep_id`)
7. a relationship removed from the ERD in DATABASE.md fails, naming both tables (`clients`, `missions`)
8. a planted mismatch never edits the file it checked

Each planted case first runs the unmodified copy as a control (it must say "no drift"), so a check that always fails can't pass it.

`erd.test.ts` (done-when 4, generator): erd.md is a mermaid erDiagram; it names all 92 tables (the map's 91 plus `design_systems`); it holds no `outbox`, `lease_epoch` or `rep_id`; two runs are byte-identical; the committed `docs/generated/erd.md` matches a fresh run.

`openapi.test.ts` (done-when 5): openapi.json is valid OpenAPI 3.x with a title and version; contract.md's route list parses to 102 (the test's own input); the document holds exactly the 102 routes (method and path, both directions); nothing outside the contract (`/api/auth/*`, the webhook, git); every operation has a response; CR-16's three routes take `planVersion`, and the files route `path`; two runs are byte-identical; the committed `docs/generated/openapi.json` matches a fresh run.

## Lock
Tests commit: `ae759fb0af84f378266fb09f892797df8d457473`.

`- m3-docs · ae759fb · tools/docs/test/**`

## Contract to files
- Done-when 4 (drift passes, fails on a planted mismatch): `tools/docs/test/drift.test.ts`, `erd.test.ts`.
- Done-when 5, OpenAPI half: `tools/docs/test/openapi.test.ts`.
- Shared helpers: `tools/docs/test/helpers.ts`.
- Not covered, by design: done-when 5's contract build and route snapshot (m1 Rigg), and its "review script passes" (not in this task).

## Deviations
The task doc and Atlas's doc fix the script names (`generate`, `drift`, `test`) and say the output is "the ERD and openapi.json" in `docs/generated/`. They don't fix the rest, so I set it in the tests. **Atlas must build to this, or ask for a change before the lock:**
- `pnpm --filter @avel/docs run generate` writes `erd.md` (a ```mermaid erDiagram fence) and `openapi.json` into `$AVEL_DOCS_OUT`, default `docs/generated/`.
- `pnpm --filter @avel/docs run drift` reads `$AVEL_DOCS_DATABASE_MD`, default `docs/design/DATABASE.md`. Drift: exit 1, output names what differs. No drift: exit 0 and prints "no drift".
- Both are read from the environment, not flags, because pnpm's `--` forwarding is unreliable.
- The ERD must name all 92 tables as words; relationship edges use `a ||--o{ b`. The drift check must read DATABASE.md's spec blocks (a line starting with the table name, columns inside `{ }`) and its mermaid edges, as DATABASE.md writes them today.
- The planted-mismatch edits rely on today's DATABASE.md wording: a `payments` line, `contacts: jsonb`, a `clients  {` line, the edge `clients ||--o{ missions : has`, and the heading `## Integrity rules`. If Atlas's rewrite moves them, a test fails with "the plant did not change DATABASE.md". That's a locked-test change for the operator, not Atlas.
- `docs/generated/erd.md` and `docs/generated/openapi.json` must be committed by Atlas; two tests compare them with a fresh run.
- `tools/docs/test` has no tsconfig (outside my territory), so the root `pnpm typecheck` doesn't check these files; Vitest and Biome do run on them.

## Limitations
- `pnpm --filter @avel/docs test` can't run yet: there is no `tools/docs/package.json` (Atlas's). I ran the tests with the root `pnpm test`, where the `tools/docs` folder is picked up as a Vitest project.
- pnpm exits 0 when `--filter` matches nothing, so no test relies on exit 0 alone; it also checks the output or files.
- The tests read `docs/agent-dispatch/backend/sprint-00/contract.md` for the route list. If that file is renamed or the table format changes, they fail on the "parses to 102" check.
- The drift check's definition of "drift" for columns, and the ERD's exact entity syntax, are only as tight as the tests above.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- Atlas: build to the interface under Deviations; the generator tests need `@avel/docs` to have `generate` and `drift` scripts, and a `test` script that runs Vitest. The `packages/db` schema and `packages/contract` routes must be in place first (your `after` list covers that).
- Operator: `locks.md` isn't in this worktree; add the Lock line above.

## Files changed
```
docs/agent-dispatch/backend/sprint-00/agent-rigg-m3-docs-test-unit-completion.md
tools/docs/test/drift.test.ts
tools/docs/test/erd.test.ts
tools/docs/test/helpers.ts
tools/docs/test/openapi.test.ts
```

## Verification
```
$ pnpm build
No projects matched the filters in ".../backend-sprint-00-agent-rigg-m3-docs-test-unit-a1"      (exit 0)
$ pnpm typecheck
tsc -p tsconfig.json && pnpm -r --if-present run typecheck: No projects matched the filters     (exit 0)
$ pnpm lint
Checked 11 files in 5ms. No fixes applied.                                                      (exit 0)
$ pnpm test
 Test Files  3 failed (3)
      Tests  21 failed (21)                                                                     (exit 1, expected: no generators yet)
$ git diff --name-only main...HEAD
docs/agent-dispatch/backend/sprint-00/agent-rigg-m3-docs-test-unit-completion.md
tools/docs/test/drift.test.ts
tools/docs/test/erd.test.ts
tools/docs/test/helpers.ts
tools/docs/test/openapi.test.ts
```
