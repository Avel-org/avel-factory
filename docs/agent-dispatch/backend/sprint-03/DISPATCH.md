# DISPATCH: backend/sprint-03: Step 1, cycle 3: a hardened platform and sign-in

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Axis · builder: Soap · checker: Rigg · Step 1

## Goals

- Nothing the Db service does can hang a request, crash the process on a dropped connection, or log a query's values
- The operator can sign in with email and password, a second account can't be made, and brute force locks out

## Done when

- Step 0 and Step 1 plan, Step 1 test 5 (as CR-43 proposes): the 6th sign-in in a minute, for one email or from one IP, is 429
- Step 1 test 7: the 11th failed sign-in in 15 minutes is locked out; sign-up is refused; nothing creates a second user

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-B8 | Platform hardening and the middleware services: safe defect logs, pool timeouts, an idempotency store and rate limits | full | `t/B8-platform-hardening` | — |
| T-B9 | Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller | full | `t/B9-sign-in` | T-B8 |
| T-B11 | The web's auth mock and a minified router (CR-W30 A and D) | standard | `t/B11-auth-mock-minified-router` | — |

## Dispatches

Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).

| Task doc | Agent | Kind | Model |
| --- | --- | --- | --- |
| `agent-rigg-t-b8-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b8-build.md` | Soap | build | opus |
| `agent-rigg-t-b8-review.md` | Rigg | review | opus |
| `agent-rigg-t-b9-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b9-build.md` | Soap | build | opus |
| `agent-rigg-t-b9-review.md` | Rigg | review | opus |
| `agent-rigg-t-b11-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b11-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b11-review.md` | Rigg | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-B8 | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/rate-limit.ts` | `packages/server/test/platform-hardening/**` |
| T-B9 | `packages/server/src/platform/auth/**`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/effect-handler.ts`, `packages/server/src/seed.ts`, `packages/server/package.json`, `pnpm-lock.yaml` | `packages/server/test/auth/**` |
| T-B11 | `packages/contract-mock/src/**`, `packages/contract/src/minified.ts`, `packages/contract/src/index.ts`, `packages/contract/scripts/**`, `packages/contract/package.json` | `packages/contract-mock/test/auth.test.ts`, `packages/contract/test/minified-router.test.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-B8
2. T-B9
3. T-B11

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```
