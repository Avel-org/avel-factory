status: done
ticket: T-B11

# T-B11 tests: completion report (Rigg)

## Pre-flight
- `pnpm build`: pass (needed first; contract-mock resolves `@avel/contract` from dist).
- `pnpm typecheck`: pass.
- `pnpm lint`: pass; 2 existing warnings in apps/web e2e, none in my files.
- `pnpm test`: 11 failed, 961 passed. All 11 failures are the new T-B11 tests.
- `pnpm --filter @avel/contract-mock test`: 7 failed (auth.test.ts), world.test.ts passes.
- `pnpm --filter @avel/contract test`: 4 failed (minified-router.test.ts), 167 pass.
- The last line (`build && typecheck && lint && test`) fails only on the same 11 tests, as it must before the build.

## Failing first (start commit 01066e4)
- auth.test.ts, 7 tests: `fixtures.operator` is undefined ("fixtures.operator is not there yet" / "Cannot read properties of undefined (reading 'email')"). Sign-in, session, 404, reset, recorded() are not built.
- minified-router.test.ts, 4 tests: "packages/contract/src/minified.ts does not exist yet"; "packages/contract/scripts has no generator yet"; the index has no `minified` export.

## What changed
- `packages/contract-mock/test/auth.test.ts` (new): T-B11-01 to 04. A movable clock closure drives `createMock({ now })`; no wall clock.
- `packages/contract/test/minified-router.test.ts` (new): T-B11-05. Walks `contract` for each route's method, path, routeNo, write, stepUp and key path, and compares them to the minified entries. Checks that no schema is carried, that the index exports it, and that running the generator in `packages/contract/scripts` leaves `src/minified.ts` unchanged (the file is restored afterwards).

## Contract to files
- login.md s5 (sign-in, lockout, get-session, sign-out, 404, reset/resetAuth, recorded) and CR-W30 A: auth.test.ts.
- CR-W30 D: minified-router.test.ts.

## Deviations
- The tests can't use a real Postgres: the mock is in-memory, and the E13 four are for server routes, not these. Not applicable.
- The task doc doesn't name the minified export, the entry's key-path field or the generator file. The tests find the list by shape (an array or map of 50+ entries), find the key-path field by a name matching /key/i (a "." joined string or an array), and run the first .js/.ts/.mjs file in `packages/contract/scripts` with `node` from the package dir. Soap's build must fit this; a rename needs a `test-dispute` or an Axis decision.
- login.md and CR-W30 say `recorded()`, but today's mock has `requests()`. I test `recorded()` as written, plus `resetAuth()`.

## Limitations
- The 5-a-minute rate limit is not simulated by spec, so it isn't tested.
- That contract routes ignore the session isn't tested separately; world.test.ts covers their present behaviour.
- The size claim (about a third) and the "web can't pull in schemas" check are not tested.

## Lock line
- T-B11: packages/contract-mock/test/auth.test.ts, packages/contract/test/minified-router.test.ts @ <branch tip>

## Messages received
None.
