# FENN: w0-data test-unit, completion report

verdict: PARTIAL

## Summary
FENN-01 and FENN-02 are written and committed in one tests commit (033a4ae): the web's Vitest config, the shared helpers, and UC-01 to UC-07 as 85 tests. All 85 fail on an assertion, three runs in a row. PARTIAL because the Part 7 build, typecheck and lint commands can't pass yet (see Verification), and a stray untracked directory, `apps/web/.vitest/`, which I made by mistake and couldn't delete, breaks `pnpm lint` until the operator removes it.

## Pre-flight
- Part 2 files: all read (fenn.md, codebase-analysis.md, the UI contract in full, CR-W2, decisions.md, Frontend Map v0.6, Step 0 and Step 1 plan, this task doc). The design library HTML was not read in full: I read only `avAgo` (`jr`), which UC-06 needs.
- Branch `frontend/sprint-01/agent-fenn-w0-data-test-unit-a1`, started at 96afa60.
- Part 7 commands: all runnable; build and typecheck fail until Ghost's `src/router.tsx` and Nemi's build can resolve; lint is red from the stray directory.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE | 033a4ae |
| FENN-02 | DONE | 033a4ae |

## Tests
All in `apps/web/test/data/`. Every one fails with an `AssertionError` against the stubs (checked in the JSON report: 85 of 85 are assertion failures, none an import, syntax or setup error). Failure line shown is the first assertion that fails.

| UC | File | Tests | First failing assertion |
| --- | --- | --- | --- |
| UC-01 | pending-decisions.test.ts | 5 (step1 rows parse; two decidable + budget_increase; missing `ref`; unparseable options; factory PR) | `route 52 should answer 200: expected 404 to be 200` |
| UC-02 | route-52.test.ts | 8 (order; open and unexpired only; limit 0/101/-1/abc; limit 100; paging through `fixtures.many`) | `GET ?limit=50 should answer 200: expected 404 to be 200` / `expected 404 to be 400` |
| UC-03 | route-54.test.ts | 18 (check 1 field/issues/order; no `proposalId`; differing `proposalId` ignored; missing key; checks 2 to 5; check order; replay; key reused on body and path; 201 success; gone from route 52) | `expected 404 to be 400` (and 201, 422, 409) |
| UC-04 | errors.test.ts | 32 (one per row of section 3's table; stale keyed on `STALE_VERSION` alone; each branch of "Reading an error"; round trips) | `expected { kind: 'unbuilt', … } to match object { kind: 'stale', … }`; `the call rejected: Error: stub: src/data/client.ts isn't built yet: expected false to be true` |
| UC-05 | client.test.ts | 7 (request ID new or fixed; key from context; response headers; route 54 recorded path and body; network failure recorded; status failure recorded) | `the call rejected: … expected false to be true` |
| UC-06 | time.test.ts | 13 (`formatAgo` 0s/59s/60s/59m/61m/null/Infinity and edges; `formatClock`) | `expected '' to be '0s'` |
| UC-07 | contract-version.test.ts | 5 (differs, stays set; equal; absent; error response; `BUILT_CONTRACT_VERSION` and the default) | `the call rejected: … expected false to be true` |

None pins existing behaviour; there is none to pin.

## Lock
Tests commit: `033a4aee47e65c89128dfe034a40a32b8c8122ef`.

`- w0-data · 033a4ae · apps/web/test/data/** apps/web/test/setup/** apps/web/vitest.config.ts`

`apps/web/test/setup/**` and `vitest.config.ts` are shared with the kit and decisions tests. If they are locked now, those dispatches can't change them: tell me if they should stay unlocked (Issues).

## Contract to files
- FENN-01: `apps/web/vitest.config.ts` (jsdom, `__AVEL_CONTRACT_VERSION__` from `packages/contract/package.json`, `@avel/contract` read from source, the stub plugin); `test/setup/setup.ts`; `test/setup/app.ts` (mock-backed client, `request`, `decide`, `expectOk`, `expectRejected`); `test/setup/render.tsx` (`renderWithApp`: a `QueryClient` from `createQueryClient({ retryDelay: 0 })` bound to a mock-backed `Api`); `test/setup/seed.ts` (hand-built rows).
- Stubs: `test/setup/stubs/**`. The plugin in `vitest.config.ts` resolves a subject that doesn't exist yet (a file under `src/`, or `@avel/contract-mock` before `packages/contract-mock/package.json` exists) to its stub. The moment the real file exists, the plugin steps aside. No edit is needed at lock time or after.
- FENN-02: UC-01 `pending-decisions.test.ts`; UC-02 `route-52.test.ts`; UC-03 `route-54.test.ts`; UC-04 `errors.test.ts`; UC-05 `client.test.ts`; UC-06 `time.test.ts`; UC-07 `contract-version.test.ts`.

## Deviations
- "A type-only stub": the stubs are runtime stubs (inert modules with the contract's names), not type-only. A type-only stub can't stop an import error at run time. Typechecking the tests still needs the real modules (below).
- The tests import by relative path (`../../src/data/client`), not an alias, because I can't change `apps/web/tsconfig.json` (Nemi's).
- The date-sensitive rows (`proposalRow`) are relative to the real clock, not a fixed one, so they stay valid against the mock's default clock and `fixtures.*` (which I haven't seen) never expire under a fixed test clock.
- I installed dependencies in this worktree with `pnpm install --offline`. It made no tracked change.

## Limitations
- The tests were never run against a real mock or data core. Where UI contract section 2 or 3 is silent, I chose: UC-03 asserts the `issues` order for `{ reason }` alone as `["version", "choice"]` (schema order); UC-02 asserts `limit` `-1` and `abc` give `BAD_REQUEST` on `limit`; UC-07's error-response test asserts the version check also runs on an error response. If the contract meant otherwise, that's a contract question for Zero or Brennan.
- jsdom plus Node's `Request` and an `AbortSignal` is a known problem pairing. If `OpenAPILink` passes a signal, the first real run may hit it. The fix would be in `test/setup/` and would need a lock exception.
- UC-07 uses `vi.resetModules()` and dynamic imports, which relies on React being loaded once outside Vite's module graph.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** `apps/web/.vitest/json/output.json` is an untracked artifact of my own `--reporter=json --outputFile` run. My `rm -rf` was denied, so it's still there and biome (`pnpm lint`) fails on it. Delete `apps/web/.vitest/` (it isn't committed).
- **Ghost:** the tests call `client.decisions.listPending({ limit })` and `client.decisions.decide(input, { context: { idempotencyKey } })`, `new ApiError(body, status)`, `new NetworkError(requestId, cause)` and `createMock({ contractVersion, now? })`. These constructor signatures aren't fixed in section 3; adjust the build to them or ask Zero. `proposalRow` and `factoryRow` in `test/setup/seed.ts` show the SeedRow shape I assumed.
- **Ghost:** `fixtures.step1` and `fixtures.many` must be valid at the real clock when the tests run (`expiresAt` in the future), since the tests don't fix the mock's clock for them.
- **INT:** `apps/web/tsconfig.json` includes `test`, so `typecheck` can't pass until Ghost's modules exist.

## Files changed
```
apps/web/test/data/client.test.ts
apps/web/test/data/contract-version.test.ts
apps/web/test/data/errors.test.ts
apps/web/test/data/pending-decisions.test.ts
apps/web/test/data/route-52.test.ts
apps/web/test/data/route-54.test.ts
apps/web/test/data/time.test.ts
apps/web/test/setup/app.ts
apps/web/test/setup/render.tsx
apps/web/test/setup/seed.ts
apps/web/test/setup/setup.ts
apps/web/test/setup/stubs/contract-mock.ts
apps/web/test/setup/stubs/data/client.ts
apps/web/test/setup/stubs/data/contract-version.ts
apps/web/test/setup/stubs/data/errors.ts
apps/web/test/setup/stubs/data/idempotency.ts
apps/web/test/setup/stubs/data/pending-decisions.ts
apps/web/test/setup/stubs/data/query.ts
apps/web/test/setup/stubs/lib/time.ts
apps/web/vitest.config.ts
docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-data-test-unit-completion.md
```

## Verification
Three runs of `pnpm --filter @avel/web test` (tests commit 033a4ae), each ending:
```
 Test Files  7 failed (7)
      Tests  85 failed (85)
```

```bash
pnpm --filter "@avel/web..." build
```
Red, for a reason outside my territory (Nemi's `vite.config.ts` needs Ghost's `src/router.tsx`):
```
apps/web build: Error: Could not resolve entry for router entry: router in .../apps/web/src
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 build: `vite build`
```
```bash
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
```
Red, same cause (`Could not resolve entry for router entry: router`). `@avel/contract-mock` doesn't exist yet either.
```bash
pnpm lint
```
Red from `apps/web/.vitest/json/output.json` (the stray artifact above), not from tracked files. `pnpm exec biome check apps/web/test apps/web/vitest.config.ts`: `Checked 20 files … No fixes applied.`
```bash
pnpm --filter @avel/web test
```
`Test Files 7 failed (7)`, `Tests 85 failed (85)`, every failure an `AssertionError`.
```bash
git diff --name-only main...HEAD   # only paths from Part 5
```
Only paths from Part 5 (the list under Files changed).
