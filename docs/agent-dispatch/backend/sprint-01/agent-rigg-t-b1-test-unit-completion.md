status: done
ticket: T-B1

# T-B1 tests: completion report (Rigg)

## Pre-flight
Run on the start commit `91c4888` plus my test files. Node 24.22.2 (from nvm), Postgres from `scripts/pg-local.sh`.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 1: only the new tests, `TS2307` for the missing `src/platform/*` modules, and `TS2578` unused `@ts-expect-error` in `errors.test.ts` (T-B1-06's type-level test fails too) |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 1: 4 files failed (all T-B1), 27 files and 861 tests passed |
| `pnpm --filter @avel/server typecheck` | exit 1, same errors as above |
| `pnpm --filter @avel/server test` | exit 1: 4 files failed, no tests ran |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 1 at typecheck, as above |

Red is expected: this is the tests dispatch. Before I ran `pnpm build`, the first `pnpm test` showed 21 failures in `tools/docs` (the generated docs weren't built yet). After `pnpm build` they pass, so they aren't mine.

## Failing first
`pnpm --filter @avel/server test` on the start commit:

```
 FAIL  test/errors.test.ts   Error: Cannot find module '../src/platform/app.ts' imported from test/errors.test.ts
 FAIL  test/headers.test.ts  Error: Cannot find module '../src/platform/app.ts' imported from test/headers.test.ts
 FAIL  test/health.test.ts   Error: Cannot find module '../src/platform/app.ts' imported from test/health.test.ts
 FAIL  test/logger.test.ts   Error: Cannot find module '../../src/platform/app.ts' imported from test/support/harness.ts
 Test Files  4 failed (4)
      Tests  no tests
```

The right reason: `packages/server/src` doesn't exist yet. The suites fail at import, so no test body has run. **I have not shown any test passing against a real build,** so I haven't proved each one can pass. Axis should confirm the interface below before locking.

## What changed
All under `packages/server/test/`:
- `support/harness.ts`: names the server's seams once (`appRunning`, `fixedIds`, `get`, `deferred`).
- `health.test.ts`: T-B1-01.
- `headers.test.ts`: T-B1-02 (X-Contract-Version) and T-B1-03 (X-Request-Id; five cases: valid echoed, echoed on error, missing replaced, malformed replaced, a fresh ID per request).
- `errors.test.ts`: T-B1-04 (unknown route), 05 (tagged failure), 06 (type-level, via `@ts-expect-error`, enforced by `pnpm --filter @avel/server typecheck`), 07 (defect), 08 (abort).
- `logger.test.ts`: T-B1-09.

## Interface the tests assume (for Axis to confirm before the lock)
The task doc names no module paths beyond `src/platform/**`, so I chose these. If the build needs different ones, that's a test-dispute, not a reason to loosen the tests.
- `src/platform/app.ts`: `createApp({ router?, layer?, logLine? })` returns `{ fetch(Request): Promise<Response> }`. `router` defaults to the real one (route 6 only). `layer` is a `Layer<Ids>` that overrides the ID service. `logLine` receives each JSON log line.
- `src/platform/effect-handler.ts`: `effectHandler(({ input }) => program)`, usable as an oRPC `.handler(...)` argument. It takes the request's abort signal from the app.
- `src/platform/ids.ts`: `Ids`, a `Context.Service` shaped `{ uuidv7: Effect<string> }`.
- `src/platform/errors.ts`: `NotFound`, a `Data.TaggedError("NotFound")<{ message: string }>` mapped to `NOT_FOUND` (404) in the one table.
- A valid incoming `X-Request-Id` is a UUID (my sample is a UUIDv7). `not-a-uuid`, a 300-character string and a spaced string are malformed.
- The logger's line field names aren't specified, so tests assert JSON-per-line, `requestId`, and the message text appearing in the line.

## Contract to files
| Task | Test |
| --- | --- |
| T-B1-01 | `health.test.ts` |
| T-B1-02 | `headers.test.ts` (health, unknown route, unimplemented route, tagged failure, defect) |
| T-B1-03 | `headers.test.ts` |
| T-B1-04, 05, 06, 07, 08 | `errors.test.ts` |
| T-B1-09 | `logger.test.ts` |

## Spike 1 (for Javaris's Effect decision)
Checks 1, 3 and 4 have tests (T-B1-05 and 06, 08, 09). I can't give pass or fail yet: that comes when the build runs them. The build's report must say whether any needed a beta package, a fork or a patch.

## Deviations
- E13's four: route 6 is a GET with no `rowVersion`, so the idempotent-replay and stale-version tests don't apply. The happy path (01) and the error body with `requestId` (04, 05) are covered.
- No Postgres, `TestClock` or `Random`: the ticket has no Db service, no time-dependent behaviour and no random one. The IDs come from the `Ids` service. Nothing sleeps on the wall clock.
- T-B1-06 is a compile-time check, so it's red under `pnpm test` only through the missing import. Its real check is the server typecheck, which is in the Verification list.

## Limitations
- None of the tests has run against a real implementation (see Failing first).
- T-B1-08 waits on promises set in a finalizer; if the build never interrupts, it ends on the test timeout.
- T-B1-02 asserts no status for the unimplemented contract route (the task doc names none).

## Messages received
None.

## Lock line
- T-B1: packages/server/test/** @ <the branch tip: the commit that holds this report; a commit cannot name its own hash, so read it with `git rev-parse t/B1-server-shell`>
