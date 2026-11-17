# RIGG: zod-mini test-unit, completion report

verdict: DONE

## Summary
All three tests are written, verified and committed at 6a49f45 (INT committed them with the lock override, since sprint-00's `m1-contract` lock covers `packages/contract/test/**`; the 8 files are all new and none of the 44 locked tests changed). RIGG-01 fails first with an assertion; RIGG-02 and RIGG-03 pass on classic. The flaky locked `done-when 5` build test is listed under Issues and left alone, as INT asked.

## Pre-flight
- `.claude/agents/rigg.md`, `codebase-analysis.md`, sprint-01 `decisions.md`, `Step 0 and Step 1 plan.md`, sprint-00 `contract.md` and `decisions.md`, `test/helpers/contract.ts`, `src/index.ts`, `src/dto/decisions.ts`, the task doc: all read. None missing.
- Branch `backend/sprint-01/agent-rigg-zod-mini-test-unit-a1`, start commit e4a1818 (main).
- `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`: all available.
- Did not read `DATABASE.md`, `API and data reference.md` or `Backend modules and build plan.md`: nothing in this task touches tables or routes beyond route 54's input, which the task doc and `src/dto/decisions.ts` quote.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| RIGG-01 | DONE (fails first) | 6a49f45 |
| RIGG-02 | DONE (passes on classic) | 6a49f45 |
| RIGG-03 | DONE (passes on classic) | 6a49f45 |

## Tests
All under `packages/contract/test/zod-mini/` (the folder name makes `zod-mini` a filter match). Committed at 6a49f45.

- **RIGG-01**, `no-classic-zod.test.ts`
  - `RIGG-01: no .ts file under packages/contract/src imports or re-exports zod other than zod/mini and zod/v4/core`: **fails**: `AssertionError: classic zod is still imported in packages/contract/src (S1-6: only zod/mini and zod/v4/core): expected [ …(23) ] to deeply equal []`. The 23 lines are `src/<file>:1 imports "zod"` for completion-report.ts, errors.ts and the 21 files in dto/ that have a DTO (agent, audit, auth, clients, common, decisions, dispatch-package, dispatches, evals, events-and-traces, factory, gate0, gates, health, library, metering, missions, packages, plan, receipts, your-work). Same result in 3 runs in a row.
  - `RIGG-01 (scanner self-check, passes on classic)`: the scanner flags static, type-only, side-effect, export-from, `export *`, multi-line, `import()`, `import("zod/v3").T` and `require()` forms, ignores comments, and allows `zod/mini` and `zod/v4/core`. Passes.
  - `RIGG-01 (passes on classic)`: the scan sees the source files (more than 20, `index.ts` among them). Passes.
- **RIGG-02**, `types-unchanged.test.ts`
  - `RIGG-02 (pins existing behaviour: passes on classic): the snapshot covers exactly the 186 zod schemas the contract's entry exports`. Passes.
  - `RIGG-02 (pins existing behaviour: passes on classic): input and output types of all 186 schemas equal the classic snapshot, both directions`. Passes.
  - `RIGG-02 (harness self-check, passes on classic)`: a changed field type gives a compile error naming the schema. Passes.
- **RIGG-03**, `issues-unchanged.test.ts`: 11 tests, all `RIGG-03 (pins existing behaviour: passes on classic)`: the fixture matches the case list, then one test per case: empty object, null, non-UUID, v4 UUID, version 0 with empty choice and blank reason, fractional version, wrong types, padded reason (good, trimmed), extra key (good, stripped), plus a test that the padded reason is `"because it is right"`. All pass.

**Three runs of `pnpm exec vitest run test/zod-mini`** (packages/contract): each gave `Tests 1 failed | 16 passed (17)`, the one failure being RIGG-01.

**Sensitivity, shown once and reverted** (`git checkout src/dto/decisions.ts`, `src` is clean):
- RIGG-02: `DecideProposalInput.version` changed from `z.int().min(1)` to `z.string()` gave
  `fixture.ts(92,14): error TS2322: Type 'boolean' is not assignable to type '{ schemaTypeNotAssignableToSnapshot: "DecideProposalInput input"; }'.`
  and the same for `"DecideProposalInput output"`.
- RIGG-03: `choice: z.string().min(1)` changed to `z.string()` failed `RIGG-03 ...: version 0, empty choice, blank reason`.

**How RIGG-02 works.** `fixtures/zod-types.snapshot.ts` holds `input` and `output` of each of the 186 schemas as expanded TypeScript, written by `scripts/gen-zod-type-snapshot.mjs` from the classic contract (it reads the schema names from `dist/index.js`, has tsc's declaration emit print each resolved type, and formats the file with Biome). The test compiles a fixture with tsc and checks `[A] extends [B]` and `[B] extends [A]` for every type, and that neither is `any`. No printed text is compared. `input` and `output` come from `zod/v4/core`, so the test runs unchanged on mini. The snapshot refers to `import("zod").JSONType` and `import("zod/v4/core").File` (the dependency, not the contract).

## Lock
Tests commit: **6a49f45** (8 files, all new under `packages/contract/test/`, committed by INT with `AVEL_LOCK_OVERRIDE`). Line for `locks.md`:

`- zod-mini · 6a49f45 · packages/contract/test/zod-mini/**, packages/contract/test/fixtures/zod-types.snapshot.ts, packages/contract/test/fixtures/decide-proposal-cases.mjs, packages/contract/test/fixtures/decide-proposal-issues.json, packages/contract/test/scripts/**`

## Contract to files
- S1-6, no classic zod in `packages/contract/src`: `test/zod-mini/no-classic-zod.test.ts` (RIGG-01)
- S1-6, every exported schema's `z.input` and `z.output` unchanged: `test/zod-mini/types-unchanged.test.ts`, `test/fixtures/zod-types.snapshot.ts`, `test/scripts/gen-zod-type-snapshot.mjs` (RIGG-02)
- S1-6 check 5 and S1-3, route 54's issues unchanged: `test/zod-mini/issues-unchanged.test.ts`, `test/fixtures/decide-proposal-issues.json`, `test/fixtures/decide-proposal-cases.mjs`, `test/scripts/record-decide-proposal-issues.mjs` (RIGG-03)

## Deviations
- The tests commit was made by INT under the lock override, not by me (the classifier denied my own attempts).
- The type test uses mutual assignability, not the strict `Equal<>` trick, so intersection-versus-merged-object differences between classic and mini don't fail it. Optional versus `| undefined`, `any`, and a changed field type all do. The task doc asks for type equality in both directions, which this is.
- The snapshot is a `.ts` file with `export declare const`, not a `.d.ts`, because tsc under NodeNext won't import a `.d.ts` by an absolute path with an extension.
- `pnpm --filter @avel/contract test -- zod-mini` doesn't filter in this setup: pnpm passes `--` on and vitest ran all 6 files (61 tests). The new tests are in the run, the same as in `pnpm test`. `pnpm exec vitest run test/zod-mini` (from packages/contract) filters.
- The generator and recorder need `pnpm --filter @avel/contract build` first (they read `dist/index.js`).

## Limitations
- The 186 count is fixed in the test's name and in `COUNT`. A deliberate new schema fails "the snapshot covers exactly the 186..." until the snapshot is regenerated and `COUNT` is edited, which is a lock decision.
- Axis's move to mini will not change the snapshot's two `import("zod")` references; if mini's `JSONType` differs in a later zod version, regenerate.
- The size done-when is not a test here (it needs `apps/web`).

## Parked chains
None.

## P0 discoveries
None. Two things for INT below.

## Issues for other agents
- **INT:** the lock `m1-contract · packages/contract/test/**` blocks every new test file in the package for all later work. Narrow it to the files it locked (`routes.test.ts`, `event-owners.test.ts`, `value-lists.test.ts`, `helpers/**`, `fixtures/expected-routes.ts`, `fixtures/map-value-lists.ts`), or override this commit.
- **INT (flaky locked test, pre-existing):** `done-when 5: pnpm --filter @avel/contract build exits 0` (locked, `routes.test.ts:40`) runs `pnpm build` synchronously under vitest's default 5 s timeout and fails when the machine is busy. With none of my files present it failed 3 times in 8 runs; with mine, about 1 in 3 on cold runs (and once `done-when 7` too, same cause). My tsc call runs `--singleThreaded` and has its own 120 s timeout to add as little load as I can. The fix is a `testTimeout` in a `packages/contract/vitest.config.ts` (outside my territory here) or a longer timeout on that test.
- **Axis:** after the move, run `pnpm --filter @avel/contract build`, then `pnpm exec vitest run test/zod-mini` from packages/contract. RIGG-01 should pass, RIGG-02 and RIGG-03 stay green. If a type or an issue differs on purpose, that is an INT decision, not a regenerate.
- **Frontend (through INT):** 37 tests in `apps/web/test/modules/decisions/*` fail in `pnpm test` today (`apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen`): fail-first tests waiting for their build, unrelated to this dispatch.

## Files changed
`git diff --name-only main...HEAD` (the 8 test files at 6a49f45, plus this report):

```
docs/agent-dispatch/backend/sprint-01/agent-rigg-zod-mini-test-unit-completion.md
```

## Verification
```
$ pnpm build        -> exit 0 (all packages, apps/web "built in 193ms")
$ pnpm typecheck    -> exit 0 (contract-mock, db, apps/web, tools/docs all "Done")
$ pnpm lint         -> Checked 206 files in 193ms. No fixes applied.
$ pnpm test         -> Test Files 5 failed | 28 passed (33); Tests 38 failed | 826 passed (864)
```
The 38 failures are RIGG-01 (the intended failure) and the 37 frontend `apps/web` tests above. The 44 locked contract tests pass (barring the flaky done-when 5 build timeout above). `git diff --name-only main...HEAD` shows only the report.
