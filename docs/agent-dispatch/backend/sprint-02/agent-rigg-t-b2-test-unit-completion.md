status: done
ticket: T-B2

# T-B2 tests: completion report (Rigg)

## Pre-flight
Run on the start commit 9d63a4d plus my test files. Node was not on PATH; I used nvm's v24.22.2.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 (after moving the fixtures to `.ts.txt`; see Deviations) |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 1: the 6 expected failures below, nothing else |
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 1 at `pnpm test`, the same 6 failures |
| `pnpm --filter @avel/server run check:effect` | exit 1: `ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT` (the script isn't built yet) |
| `pnpm --filter @avel/repo-checks test` | exit 1: the same 6 failures |
| `pnpm why @effect/language-service` | exit 0, printed nothing, on the start commit |

The last line is not a signal: `@effect/language-service` is still in `packages/server/package.json` on the start commit. T-B2-01 asserts on the manifest and lockfile directly.

## Failing first
`pnpm --filter @avel/repo-checks test` on the start commit: 6 failed, 11 passed.

```
× the server and web manifests pin the approved packages at exact versions   (T-B0-08, changed)
    expected { …(2) } to match object { '@effect/tsgo': '0.64.1', …(1) }
× T-B2-01 ...  expected undefined to be '0.64.1'
× T-B2-02 ...  expected undefined to be 'workspace:*'
× T-B2-03 ...  expected ' ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT  No…' to contain 'floating.ts'
× T-B2-04 ...  None of the selected packages has a "check:effect" script: expected 1 to be +0
× T-B2-05 ...  expected -1 to be greater than 50
```
Each fails because the behaviour isn't built: no tsgo pin, no `@avel/db`, no `check:effect` script, no CI step.

## What changed
- `tools/repo-checks/test/dependencies.test.ts`: T-B0-08's `SERVER.devDependencies` now pins `@effect/tsgo` 0.64.1 in place of `@effect/language-service` (CR-39, F2: the checker's own commit). Added T-B2-01 (pin, no `@effect/language-service` in the manifest or `pnpm-lock.yaml`, tsgo specifier in the lockfile) and T-B2-02 (`@avel/db` `workspace:*`; `drizzle-orm`, `pg`, `@types/pg` equal to `packages/db`'s and to 0.45.4, 8.23.1, 8.23.1).
- `tools/repo-checks/test/effect-check.test.ts`: T-B2-03, T-B2-04 and T-B2-05. It runs `pnpm --filter @avel/server run check:effect [-- <abs .ts paths>]` against fixtures copied to a temp dir, with `node_modules` linked to `packages/server/node_modules` so `effect` resolves. T-B2-03 also requires `floatingEffect` in the output, and that the failure isn't pnpm's missing-script error.
- `tools/repo-checks/test/fixtures/effect/`: `tsconfig.json` (enables the plugin entry), `bad/floating.ts.txt` (a floating `Effect.log`), `clean/clean.ts.txt` (a yielded one).

## Contract to files
| Task | Test |
| --- | --- |
| T-B2-01 | `dependencies.test.ts`, T-B2-01 and the changed T-B0-08 |
| T-B2-02 | `dependencies.test.ts`, T-B2-02 |
| T-B2-03 | `effect-check.test.ts`, T-B2-03 |
| T-B2-04 | `effect-check.test.ts`, T-B2-04 |
| T-B2-05 | `effect-check.test.ts`, T-B2-05 |

## Interface for Soap (what the tests lock)
- Command `pnpm --filter @avel/server run check:effect`; no paths checks `src` and `test`. With `-- <absolute .ts paths>` it checks those. It exits non-zero on an Effect error and the output names the file.
- I tried `@effect/tsgo` 0.64.1 on TypeScript 7.0.2 in a scratch project, so the stop rule doesn't apply. Findings:
  - `effect-tsgo diagnostics --file <abs path> --format text` exits 1 on a floating Effect, with `effect(floatingEffect)` and the file in the line. It exits 0 when only messages (suggestions) are raised.
  - `effect-tsgo tsc -p` also exits non-zero on suggestions, so `diagnostics` is the better fit for CI.
  - **The tsconfig plugin entry must be `{ "name": "@effect/language-service" }`.** With `"@effect/tsgo"` the files are skipped ("their tsconfig does not enable the plugin") and exit is 0. Soap has to add that entry to `packages/server/tsconfig.json` and state it in their report.
  - `diagnostics --file` finds the tsconfig by file location, so my fixture `tsconfig.json` is copied beside the fixtures. If Soap's script runs another way, that's fine as long as the tests pass.

## Deviations
- Fixtures are `.ts.txt`, renamed to `.ts` in the temp copy. `tools/repo-checks/tsconfig.json` includes `test`, and a real `.ts` fixture broke `pnpm typecheck` (cannot find `effect`). I can't change that tsconfig (outside my territory).
- T-B0-08 test and T-B2-01 overlap on the tsgo pin on purpose: the old test keeps the whole-manifest check, the new one carries the removal.

## Limitations
- I couldn't run T-B2-03 and T-B2-04 green: `@effect/tsgo` isn't in the repo until Soap builds it. I checked the fixtures' behaviour only in a scratch project outside the repo, with the same tsgo, TypeScript and effect versions.
- T-B2-04 runs the check on the server as it stands, so a later Effect mistake in `packages/server` turns it red.
- T-B2-05 reads `ci.yml` as text; it doesn't check that the step is in the main job beyond the file having one job.
- No Postgres, `TestClock` or route tests apply: this ticket has no routes or time.

## Messages received
None.

## Lock line
- T-B2: tools/repo-checks/test/dependencies.test.ts, tools/repo-checks/test/effect-check.test.ts, tools/repo-checks/test/fixtures/effect/** @ 4c823b5 (the commit that holds the tests; a later commit changes only this report line)
