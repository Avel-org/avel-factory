# DISPATCH: backend/sprint-03: Step 1, cycle 3: a hardened platform, sign-in, step-up and CLI login

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->

Lead: Axis · builder: Soap · checker: Rigg · Step 1

## Goals

- Nothing the Db service does can hang a request, crash the process on a dropped connection, or log a query's values
- The operator can sign in with email and password, a second account can't be made, and brute force locks out
- The CLI can log in through a device code the operator approves with step-up
- Every write in this sprint takes an Idempotency-Key, replays safely, and leaves one activity row

## Done when

- Step 0 and Step 1 plan, Step 1 test 5: the 6th device-login start in a minute (route 1) is 429
- Step 1 test 7: the 11th failed sign-in in 15 minutes is locked out; sign-up is refused; nothing creates a second user
- Step 1 test 8: a wrong password gets no grant; a grant reused, used for another action or target, from another session, or after 5 minutes is refused
- Step 1 test 9, its first half: approval needs step-up; polling returns the session once; a replayed poll is 409 and never returns the token (expiry and revoke come with T-B12)
- Step 1 test 13, for this sprint's writes: each leaves exactly one activity row

## Tickets

| Ticket | Title | Rigor | Branch | Depends on |
| --- | --- | --- | --- | --- |
| T-B8 | Platform hardening and the middleware services: safe defect logs, pool timeouts, an idempotency store and rate limits | full | `t/B8-platform-hardening` | — |
| T-B9 | Sign-in: Better Auth with email and password for one operator, lockout, the seed, and the caller | full | `t/B9-sign-in` | T-B8 |
| T-B10 | Step-up grants and CLI login: start a device login, approve it with step-up, poll for the session (routes 1 to 3) | full | `t/B10-step-up-cli-login` | T-B9 |
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
| `agent-rigg-t-b10-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b10-build.md` | Soap | build | opus |
| `agent-rigg-t-b10-review.md` | Rigg | review | opus |
| `agent-rigg-t-b11-test-unit.md` | Rigg | tests | sonnet |
| `agent-soap-t-b11-build.md` | Soap | build | sonnet |
| `agent-rigg-t-b11-review.md` | Rigg | review | sonnet |

## Territory map

| Ticket | Builds | Tests |
| --- | --- | --- |
| T-B8 | `packages/server/src/platform/db/db.ts`, `packages/server/src/platform/errors.ts`, `packages/server/src/platform/idempotency.ts`, `packages/server/src/platform/rate-limit.ts` | `packages/server/test/platform-hardening/**` |
| T-B9 | `packages/server/src/platform/auth/**`, `packages/server/src/platform/app.ts`, `packages/server/src/platform/effect-handler.ts`, `packages/server/src/seed.ts`, `packages/server/package.json`, `pnpm-lock.yaml` | `packages/server/test/auth/**` |
| T-B10 | `packages/server/src/platform/step-up/**`, `packages/server/src/platform/cli/**`, `packages/server/src/audit/**`, `packages/server/src/platform/router.ts`, `packages/server/src/main.ts` | `packages/server/test/cli-login/**` |
| T-B11 | `packages/contract-mock/src/**`, `packages/contract/src/minified.ts`, `packages/contract/src/index.ts`, `packages/contract/scripts/**` | `packages/contract-mock/test/auth.test.ts`, `packages/contract/test/minified-router.test.ts` |

## Merge order

One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):

1. T-B8
2. T-B9
3. T-B10
4. T-B11

## Commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```
