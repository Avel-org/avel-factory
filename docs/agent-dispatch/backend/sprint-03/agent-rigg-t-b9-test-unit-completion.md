status: done
ticket: T-B9

# T-B9 · tests · Rigg: completion report

Branch `t/B9-sign-in`, start commit `946d755`. I ran `pnpm install --frozen-lockfile` (nothing changed in the lockfile) and a local Postgres from `scripts/pg-local.sh`. Every test written fails on the start commit.

## Pre-flight

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 1: only the new tests' missing seams (below) |
| `pnpm lint` | exit 0 (2 warnings, none in `test/auth`) |
| `pnpm test` | exit 1: 9 files fail, all the new tests, plus `@avel/repo-checks` T-B2-04 (see Limitations); 970 others pass |
| `pnpm --filter @avel/server test` | exit 1: the 8 new files only |
| `pnpm --filter @avel/server typecheck` | exit 1: `src/seed.ts` missing, `auth` not in `AppOptions`, `fetch(request, peer)` takes 1 argument, `src/platform/auth/index.ts` missing |
| `pnpm --filter @avel/server check:effect` | exit 1: `caller.test.ts` can't type `Caller`/`ClientIp` until `auth/index.ts` exists |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 1 at typecheck, for the same reasons |

All red results are the failing-first state asked for. They turn green when the build supplies the seams.

## Failing first

`pnpm --filter @avel/server test` on the start commit (`946d755`) plus these test files:

```
FAIL test/auth/caller.test.ts        Error: Cannot find module '../../src/platform/auth/index.ts'
FAIL test/auth/fixation.test.ts      Error: Cannot find module '../../src/seed.ts' (imported from test/auth/support.ts)
FAIL test/auth/lockout.test.ts       Error: Cannot find module '../../src/seed.ts'
FAIL test/auth/rate-limit.test.ts    Error: Cannot find module '../../src/seed.ts'
FAIL test/auth/seed.test.ts          Error: Cannot find module '../../src/seed.ts'
FAIL test/auth/sign-in.test.ts       Error: Cannot find module '../../src/seed.ts'
FAIL test/auth/sign-up.test.ts       Error: Cannot find module '../../src/seed.ts'
FAIL test/auth/defect-message.test.ts > T-B9-08 > is errorMap's text, with the request's ID in the body and the header
  AssertionError: expected 'Internal server error' to be 'Something went wrong'
```

Seven fail because the code isn't there (no `src/seed.ts`, no `src/platform/auth.ts`, no Better Auth); T-B9-08 fails on a real assertion: effect-handler.ts answers "Internal server error". Better Auth isn't installed, so these tests can't go further until the build adds it.

## What changed

All under `packages/server/test/auth/`, plus this report.

| File | Task | Behaviour |
| --- | --- | --- |
| `support.ts` | all | The harness: names the seams (header comment), `authApp`, `testClock` (a `TestClock` at a whole minute, advanced without sleeping), `signIn`, `sessionCookie`, `operatorPassword` and `SECRET` (fresh random values per run, E6) |
| `sign-in.test.ts` | 01 | Right password: 200 `{ user }`, cookie httpOnly and SameSite=Lax, no Secure in tests, Secure with `secureCookies: true`, a row in `auth_sessions` and the adapter's `users`/`auth_accounts` mapping, `get-session` reads it. Wrong password and unknown email: 401 `INVALID_EMAIL_OR_PASSWORD`, no cookie, no session row |
| `sign-up.test.ts` | 02 | `sign-up/email` is a 4xx signed out and signed in; users stay 1; a seed run with another email creates no user |
| `lockout.test.ts` | 03 | 10 failures (spaced to stay under the rate limit): the 11th with the right password is 429, `X-Retry-After` 61 to 900 s, `TOO_MANY_ATTEMPTS`, no session; still locked at +10 min; 200 once 15 minutes pass. Failures older than 15 minutes don't count |
| `rate-limit.test.ts` | 04 | 6th in a minute for one email is 429 `TOO_MANY_REQUESTS` (even from a new IP, right password); 6th from one IP is 429 for any email, with a forged `X-Forwarded-For`/`X-Real-Ip` on every call; another peer is separate; the next minute is open |
| `caller.test.ts` | 05 | With the cookie `Caller` has the operator's `users.id` and the `auth_sessions.id`; none without, with a forged or tampered cookie, or after sign-out; `RequestIdempotencyKey` and `ClientIp` (the peer, not X-Forwarded-For) are readable |
| `fixation.test.ts` | 06 | Signing in while presenting an earlier session's cookie makes a new id and token; an attacker-chosen cookie is never adopted |
| `seed.test.ts` | 07 | Seed twice: one user, one credential account (password hashed), one internal client; a later seed with a different password changes nothing |
| `defect-message.test.ts` | 08 | A defect: 500, `body.message` is `errorMap.INTERNAL_SERVER_ERROR.message`, `requestId` is the request's (generated and echoed), no defect text |

## Contract to files

- Step 1 item 5 and plan test 7: 01, 02, 03, 06, 07
- Rate limits (sign-in), CR-43 test 5, T-B8 G7 P2: 04
- Caller, IP and Idempotency-Key services (Notes from the lead): 05
- t-b3-rigg-03, moved here: 08
- The login contract's wire (`docs/ui-contracts/login.md` section 1): 01, 03, 04

## Seams the build must provide (for Axis to confirm before the lock)

- `src/platform/auth/index.ts` (Territory is the folder `src/platform/auth/**`): `Caller` `{ userId, sessionId }` (read with `Effect.serviceOption`), `ClientIp` (string), `RequestIdempotencyKey` (`string | null`); all three provided by `effectHandler`.
- `createApp({ ..., clock?: Clock.Clock, auth?: { databaseUrl, secret, baseUrl, secureCookies } })`; `fetch(request, peer?: { address })`. The rate limiter and lockout are built once per app and read time from `clock` (the live one by default). The test's TestClock is shared across requests, so the limiter can't be built per request.
- `src/seed.ts`: `seedOperator({ databaseUrl, email, password })`.
- The session cookie is Better Auth's default name `better-auth.session_token`; the lockout answers 429 with code `TOO_MANY_ATTEMPTS` and the rate limit `TOO_MANY_REQUESTS`, both with `X-Retry-After` in seconds (per `login.md`).

## Deviations

- The E13 four apply to contract routes. `/api/auth/*` is outside the contract, so 01 to 07 test its wire (`login.md`), not the four; the only contract route touched is route 6 in 08, which checks the error body with `requestId`. No new route in this ticket takes `Idempotency-Key` or a `rowVersion`.
- Whether the seed with a *different* email rejects or does nothing isn't set by the docs; the tests accept either and require that no second user exists.
- Task 05 also checks `Caller` after sign-out and with a forged cookie, which goes beyond the sentence in the task doc; both follow from "no session means no Caller".

## Limitations

- I couldn't run these against a working build. Whether Better Auth's actual answers match (for example 400 vs 403 on sign-up, or the exact cookie format) is unchecked; the tests assert only what `login.md` and the plan say, with 4xx for sign-up.
- `pnpm --filter @avel/repo-checks test` T-B2-04 ("check:effect exits 0 on the server") fails now only because `caller.test.ts` can't type until `auth/index.ts` exists. It passes on `main` and turns green with the build.
- The lockout test assumes the account lockout counts only failed attempts and unlocks 15 minutes after the 10th failure (the mock's rule in `login.md`).
- Secure cookies are tested only through the `secureCookies` option, not over TLS.
- Better Auth's own hashing speed makes each file take a few seconds; the 60 s test timeout is plenty.

## Lock line

- T-B9: packages/server/test/auth/support.ts, packages/server/test/auth/sign-in.test.ts, packages/server/test/auth/sign-up.test.ts, packages/server/test/auth/lockout.test.ts, packages/server/test/auth/rate-limit.test.ts, packages/server/test/auth/caller.test.ts, packages/server/test/auth/fixation.test.ts, packages/server/test/auth/seed.test.ts, packages/server/test/auth/defect-message.test.ts @ <branch tip>

## Attempt a2 (Axis's two changes, relayed by OSA)

Both done in the tests only: (1) `caller.test.ts` and the `support.ts` seam comment now name `src/platform/auth/index.ts`; (2) `SECRET` in `support.ts` is `test-secret-` plus 24 random bytes per run. Other seams confirmed by Axis as written: Caller/ClientIp/RequestIdempotencyKey provided by effectHandler; `createApp({ clock?, auth? })`; `fetch(request, peer?)`; `seedOperator({ databaseUrl, email, password })`.
Re-run on the a2 tree: the same 7 files fail on a missing module (`auth/index.ts`, `seed.ts`) and T-B9-08 fails on `expected 'Internal server error' to be 'Something went wrong'`. Pre-flight is unchanged from the table above (build 0, lint 0, typecheck/test/check:effect 1 for the missing seams). Note: a fresh worktree needs `pnpm install --frozen-lockfile` and `pnpm build` before server tests can resolve `@avel/contract` and `@avel/db`; node came from nvm v24.22.2.

## Messages received

- OSA, relaying Axis (backend lead): change the import to `auth/index.ts` and the seam comment; make SECRET random per run; nothing else. Followed both; no other change made.
