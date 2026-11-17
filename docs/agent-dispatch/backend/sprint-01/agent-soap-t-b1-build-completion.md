status: done
ticket: T-B1

# T-B1 completion report (Soap)

## Pre-flight

Node came from `~/.nvm` v24.22.2 (not on PATH by default). Baseline before changes, after `pnpm build`: only the four `packages/server` test files failed (no `src`); the other 861 tests passed.

| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (biome, 181 files, no warnings) |
| `pnpm test` | pass: 31 files, 874 tests |
| `pnpm --filter @avel/server typecheck` | pass (includes the T-B1-06 `@ts-expect-error`, so the unmapped tag really fails to compile) |
| `pnpm --filter @avel/server test` | pass: 4 files, 13 tests |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | pass |

## Spike 1 (CR-30 section 6), checks 1, 3, 4: all pass on Effect 4.1.1 and oRPC 1.16.2, no beta package, fork or patch

- **Check 1, tagged error to the contract's body, and a compile failure for an unmapped tag: pass.** Evidence: `errors.test.ts` T-B1-05 (NotFound gives 404, `NOT_FOUND`, `ErrorBody` with the requestId) and T-B1-06 (type-level, checked by typecheck).
- **Check 3, a cancelled request interrupts its program and runs finalizers: pass.** Evidence: `errors.test.ts` T-B1-08. The request's `signal` goes to `Effect.runPromiseExit`, and the `acquireRelease` finalizer ran once after abort.
- **Check 4, the JSON logger in Effect's logger slot with the request ID: pass.** Evidence: `logger.test.ts` T-B1-09 and the defect test T-B1-07. One JSON line per call, each with `requestId`.

## What changed

All under `packages/server/src/`:
- `platform/errors.ts`: `errorTable` (tag to contract code), `MappedError`, `NotFound`.
- `platform/ids.ts`: the `Ids` service and live layer. UUIDv7 from `Clock` and `Random`.
- `platform/request-id.ts`: the `RequestId` service.
- `platform/logger.ts`: JSON logger (`Logger.make`) and the stdout sink.
- `platform/effect-handler.ts`: `effectHandler` adapter and `resolveRequestId`. These are the only places programs run.
- `platform/health.ts`: route 6, returning `{}`.
- `platform/app.ts`: `createApp`. Hono outer app, a per-request `OpenAPIHandler` whose `customErrorResponseBodyEncoder` writes `ErrorBody`, a 404 `ErrorBody` for unmatched routes, and both headers on every response.
- `main.ts`: dev entry, which the manifest's `dev` script already points at.
- This report.

## Contract to files

- T-B1-01: `health.ts`, `app.ts`.
- T-B1-02: `app.ts`, which sets the header on every response, including unmatched routes.
- T-B1-03: `effect-handler.ts` (`resolveRequestId`), `ids.ts`.
- T-B1-04: `app.ts` (unmatched-route 404).
- T-B1-05, T-B1-06: `errors.ts`, `effect-handler.ts`.
- T-B1-07: `effect-handler.ts` (defect logged with the requestId, answered as `INTERNAL_SERVER_ERROR` with a generic message).
- T-B1-08: `effect-handler.ts` (signal).
- T-B1-09: `logger.ts`, `effect-handler.ts` (`annotateLogs`).

## Deviations

- Two `biome-ignore noExplicitAny` suppressions. In `app.ts`, `router?: Router<any, RequestScope>`: a partial router has no single contract type. In `effect-handler.ts`, `effectHandler` returns `Promise<any>`: the locked harness derives the handler's type with `Parameters<typeof effectHandler>[0]`, which collapses a generic result type to `unknown`, and that doesn't fit route 6's output type. oRPC still validates the output at runtime. The cost is that the compile-time check of a program's output against its DTO is lost for now. That is for Axis to decide whether to tighten.
- `resolveRequestId` is a second place that runs an Effect, kept in `effect-handler.ts` so programs still run only in the adapter file.
- An incoming X-Request-Id counts as valid if it is any-version UUID shape. The doc doesn't say which.

## Limitations

- Only the `NotFound` tag is in the error table. More arrive with the tickets that need them.
- A defect answers with oRPC's `INTERNAL_SERVER_ERROR` code until CR-38.
- No lint rule for `runPromise` in `biome.json` exists yet, so rule 2 isn't machine-checked. I didn't add one, as the config is outside my territory.
- Only `pnpm install` produced the "approve-builds" notice, with no effect on the tests.
- `effectStream`, the caller and idempotency services are out of scope.

## Messages received

None.
