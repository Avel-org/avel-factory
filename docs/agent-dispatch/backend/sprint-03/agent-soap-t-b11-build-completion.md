status: done
ticket: T-B11

## Pre-flight
- `pnpm build`: pass
- `pnpm typecheck`: pass
- `pnpm lint`: pass (2 warnings, both in apps/web e2e, not touched)
- `pnpm test`: pass, 51 files, 972 tests (before the work: 12 files failed, the locked ones)
- `pnpm --filter @avel/contract-mock test`: pass, 19 tests
- `pnpm --filter @avel/contract test`: pass, 171 tests
- `pnpm --filter @avel/docs drift`: no drift; `generate` left no diff

## What changed
- `packages/contract/scripts/generate-minified.mjs`: writes `src/minified.ts` from the built router (`../dist`), in the router's key order, in Biome's format.
- `packages/contract/src/minified.ts`: generated; `minifiedRouter`, one entry per route (keyPath, method, path, routeNo, write, stepUp), no schema, no zod or oRPC import.
- `packages/contract/src/index.ts`: exports it.
- `packages/contract-mock/src/fixtures.ts`: `fixtures.operator` (mock-only password).
- `packages/contract-mock/src/mock.ts`: sign-in, lockout, get-session, sign-out; 404 for other /api/auth/* paths; `recorded()`, `resetAuth()`; `reset()` clears lockouts and keeps sessions. `MOCK_OPERATOR_ID` now comes from the fixture (same value).

## Contract to files
- T-B11-01 to 04: `mock.ts`, `fixtures.ts`
- T-B11-05: `minified.ts`, `generate-minified.mjs`, `index.ts`

## Deviations
None. `CONTRACT_VERSION` stays 1.0.1.

## Limitations
- The generator needs `pnpm build` first (it reads `dist`); the locked test relies on CI building first.
- `recorded()` returns the same log as `requests()`, so auth requests (password redacted) also show in `requests()`.
- Not checked: that apps/web imports the minified router from the index without pulling in schemas (the index still re-exports the schemas; the web uses subpaths). Zero or the web ticket should confirm.

## Messages received
- OSA, relaying Axis: generator as .mjs importing ../dist; minified.ts shape; `recorded()` on the same log as `requests()`; sign-out 200 `{ success: true }`; version and generated docs unchanged. All followed; none widened the ticket.
