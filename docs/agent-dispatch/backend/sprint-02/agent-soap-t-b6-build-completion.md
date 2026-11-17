status: done
ticket: T-B6

## Pre-flight
Baseline before changes: `pnpm test` had 26 failing tests (the locked T-B6 tests and the 1.0.1 pin), as expected.
After the change, all run with exit 0:
- `pnpm build`: pass
- `pnpm typecheck`: pass
- `pnpm lint`: pass
- `pnpm test`: 42 files, 927 tests, all pass (the zod `types-unchanged` snapshot did not move)
- `pnpm --filter @avel/contract test`: pass (run inside `pnpm test`; the earlier standalone run, before regenerating docs, had only the 2 OpenAPI tests failing)
- `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`: clean after the commit
- `pnpm build && pnpm typecheck && pnpm lint && pnpm test`: pass

## What changed
- `packages/contract/src/errors.ts`: added `INTERNAL_SERVER_ERROR { status: 500, message: "Something went wrong" }` with no data to the generic codes; comment "generic seven" is now "generic eight".
- `packages/contract/src/version.ts`: `CONTRACT_VERSION` 1.0.0 to 1.0.1.
- `docs/generated/openapi.json`: regenerated; it now has `Error_INTERNAL_SERVER_ERROR` and lists it as the 500 of every operation.

## Contract to files
- T-B6-01: errors.ts. T-B6-02: version.ts. T-B6-03: docs/generated/openapi.json.

## Deviations
- None to the design. The worktree had no `node_modules`, so I ran `pnpm install --frozen-lockfile` (no lockfile change) and put Node 24 on PATH. `pnpm build` was needed before `docs generate`.

## Limitations
- The Postgres container is still running; I did not stop it.

## Messages received
- OSA (relaying Axis): if the zod type snapshot test moves, stop with test-dispute; Axis made the 1.0.1 pin changes (0712fa1) and those tests are locked. This narrows nothing in my territory. The snapshot did not move, and I edited no locked test.
