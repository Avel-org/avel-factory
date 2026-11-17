status: done
ticket: T-B2

## Pre-flight
Node 24.22.2 (nvm) and pnpm 10.33.2. Before changes: 6 failures, all T-B2 locked tests.

| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass |
| `pnpm test` | pass: 38 files, 902 tests |
| `pnpm install --frozen-lockfile` | pass |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | pass |
| `pnpm --filter @avel/server run check:effect` | exit 0: 14 files, 0 errors |
| `pnpm --filter @avel/repo-checks test` | pass: 5 files, 17 tests |
| `pnpm why @effect/language-service` | prints nothing |

## What changed
- `packages/server/package.json`: removed `@effect/language-service`; added devDependencies `@effect/tsgo` 0.64.1 and `@types/pg` 8.23.1; added dependencies `@avel/db` workspace:*, `drizzle-orm` 0.45.4, `pg` 8.23.1; added script `check:effect`.
- `pnpm-lock.yaml`: the cycle's one lockfile change.
- `packages/server/tsconfig.json`: plugin entry `@effect/language-service` (the name effect-tsgo reads) with two overrides, below.
- `.github/workflows/ci.yml`: step `pnpm --filter @avel/server run check:effect` after typecheck. CODEOWNERS path, so Javaris merges.
- `docs/design/Outside sources and what we took.md`: the Effect entry names `@effect/tsgo` (CR-39).

## Contract to files
- T-B2-01: package.json, lockfile. T-B2-02: package.json, lockfile.
- T-B2-03, T-B2-04: `check:effect` script and tsconfig plugin entry.
- T-B2-05: ci.yml.

## The command
`check:effect` is `sh -c '...' --`. With no paths it runs `effect-tsgo diagnostics --project <server>/tsconfig.json` (src and test). With paths (after `--`) it runs `effect-tsgo diagnostics --file <path>` for each and exits 1 if any failed. effect-tsgo exits 1 on any error diagnostic and prints the file and rule. The tsconfig must enable the plugin, or effect-tsgo skips the files and exits 0, so the entry is required.

## Deviations
- The tsconfig has an override turning `missingEffectError` off for `test/errors.test.ts` only. That file's T-B1-06 test deliberately feeds an unmapped error to `effectHandler` under `@ts-expect-error`, and effect-tsgo reports it. I can't edit the test (outside territory), and T-B2-04 needs exit 0. Axis may prefer an inline `@effect-diagnostics-next-line` in that test in a later ticket; then this override can go.
- The default override (`floatingEffect` as error in `src/**`) is restated in the tsconfig, because setting `overrides` replaces the default list.
- Spec says the script reads the package README; the README documents `diagnostics --file/--project`, which I used.

## Limitations
- `check:effect` with paths runs one effect-tsgo process per file.
- The pnpm "ignored build scripts" warning for esbuild is pre-existing.
- CI itself not run (no push).

## Messages received
None.
