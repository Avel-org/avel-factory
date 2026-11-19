status: done
ticket: T-B9

All eight tasks pass on `b10aca7`, T-B9-01 to T-B9-08: the 8 locked files in `packages/server/test/auth/`, 12 tests, in every run.

**One flaky test, not mine, for Axis to decide before CI runs.** T-B8's `test/platform-hardening/pool-timeouts.test.ts` ("withTransaction fails as a defect within the connect timeout") failed in 3 of 9 full test runs on this branch, here on 4 cores. The assertion was `no new connection reached the proxy after the switch` at line 133. It passed 5 of 5 times alone and 6 of 6 alongside only `test/auth/`. So it looks like CPU load across the whole parallel suite meeting its 400 ms connect timeout. The auth tests add real load: Better Auth hashes with pure-JS scrypt on every sign-in and seed. I didn't measure the rate on the lock commit, so I can't say how much of it is new. Neither the test nor `vitest.config.ts` is in my Territory, and weakening the password hash to ease it would be wrong. CI runs once (H5), so it may come up red. Details are under Pre-flight.

This is attempt a1, built on the lock at `522b980`. It has three code commits, all with `Refs: T-B9`:
- `114bece`: the dependency (better-auth 1.7.16), alone with the lockfile
- `5379e14`: Better Auth at `/api/auth/*`, the sign-in limits and lockout, the request services and Caller, and the defect message
- `b10aca7`: the seed

## Pre-flight

The Postgres came from `scripts/pg-local.sh start` (D5). The worktree was fresh, so I first ran `pnpm install --frozen-lockfile`, which left the lockfile unchanged.

Before any change:
- `pnpm --filter @avel/server test`: the 8 locked auth files failed, and the other 17 passed (54 tests).
- `pnpm test`: 9 files failed. They were the 8 auth files, plus the server's `check:effect` run, which failed because the auth modules didn't exist yet.

The locked tests failed first, as B2 requires.

The verification, in Part 7's order, on `b10aca7`:

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. 246 files; 2 warnings, both already there and outside this ticket (`apps/web/e2e/control-room-budget/budget.spec.ts` 73 and 89) |
| `pnpm test` | exit 0. 63 files, 983 tests passed |
| `pnpm --filter @avel/server test` | **exit 1.** 24 of 25 files passed, 65 of 66 tests. The one failure was T-B8-02 in `pool-timeouts.test.ts` (the flake above). Rerun 3 times straight after: 25 of 25 files, 66 of 66 tests, each time |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0. 50 files, 0 errors; 6 warnings and 2 messages, all in tests outside this ticket (for example `test/platform-hardening/rate-limit.test.ts`'s `unstableApiUsage` and `multipleEffectProvide`), none in `src/` |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | **exit 1** at `pnpm test`: 62 of 63 files, 982 of 983 tests. The one failure was the same T-B8-02 test. Build, typecheck and lint passed |

**Every full run since the code landed** (the server suite, or the root suite, which includes it):
- T-B8-02 failed in runs 1, 5 and 6;
- runs 2 to 4 and 7 to 9 were all green.

The 12 auth tests passed in all nine.

**Other checks:**
- `git diff 522b980 HEAD -- packages/server/test` is empty: no locked test changed.
- Every file changed since the lock is in Part 5's Territory.
- Probed by hand with a temporary test file, deleted afterwards and never committed:
  - `POST /api/auth/sign-in/email/` (trailing slash) is 404 from Better Auth's router, so the guard can't be stepped around;
  - a form-encoded sign-in with the email upper-cased still counts against the email limit (the 6th, from a 6th address, is 429);
  - `env.incoming.socket.remoteAddress` is read as the peer.

## What changed

| File | Why |
| --- | --- |
| `packages/server/package.json` | `better-auth` `1.7.16`, exact (E5). Also a `seed` script: `node --experimental-strip-types src/seed.ts` |
| `pnpm-lock.yaml` | better-auth and its 17 new packages. The `drizzle-orm` entries of `packages/db`, `packages/server` and `tools/docs` now resolve with the `kysely` peer that better-auth brings, at the same version (0.45.4). No other version moved |
| `packages/server/src/platform/auth/services.ts` (new) | The three request services. `Caller` is `{ userId, sessionId }`. `ClientIp` is a string. `RequestIdempotencyKey` is `string \| null` |
| `packages/server/src/platform/auth/lockout.ts` (new) | `Lockout`, an Effect service in memory, keyed by lower-cased email, on the Clock. The 10th failure within 15 minutes locks the account for 15 minutes, and `check` fails with `Locked { retryAfterMs }` until then. Locking clears the failure count |
| `packages/server/src/platform/auth/web-auth.ts` (new) | `makeWebAuth(options, clock, logLine)`. See the notes below |
| `packages/server/src/platform/auth/index.ts` (new) | Re-exports the services, `makeWebAuth` and its types: the seam the tests import |
| `packages/server/src/platform/effect-handler.ts` | See the notes below |
| `packages/server/src/platform/app.ts` | See the notes below |
| `packages/server/src/seed.ts` (new) | See the notes below |

**`web-auth.ts`:**
- **Better Auth's settings:**
  - email and password, with `disableSignUp`;
  - the Drizzle adapter over the schema's `users`, `auth_sessions`, `auth_accounts` and `auth_verifications`, under Better Auth's model names (`user`, `session`, `account`, `verification`);
  - `generateId: false`, so ids come from the schema's `uuid_generate_v7()` default;
  - Better Auth's own rate limit off, telemetry off, and IP tracking off (it would read X-Forwarded-For);
  - the cookie is `better-auth.session_token`, httpOnly, SameSite=Lax, and Secure exactly when `secureCookies` is set. `useSecureCookies: false` keeps the name the web reads (login.md section 1) by leaving off the `__Secure-` prefix.
- **Its own pool:** a node-postgres pool with an idle-error listener, and DbLive's default timeouts.
- **Its logger:** the message only, as one JSON line through the app's `logLine`, stamped from the Clock.
- **The sign-in guard,** for `POST /api/auth/sign-in/email`:
  1. it reads the email the way Better Auth does (JSON, or a form) and lower-cases it;
  2. it checks T-B8's `sign-in-email` limit, then `sign-in-ip`, then the lockout. A refusal never reaches Better Auth. It is 429 with `X-Retry-After` in whole seconds and `{ code, message, requestId }`, where the code is `TOO_MANY_REQUESTS` or `TOO_MANY_ATTEMPTS`;
  3. a 401 from Better Auth counts as a failure for the lockout.
- **One runtime per app:** RateLimitLive and LockoutLive, plus the app's Clock when it has one, built in a `ManagedRuntime`.
- **`caller`:** Better Auth's `getSession` with `disableRefresh`, mapped to `Option<CallerIdentity>`.

**`effect-handler.ts`:**
- **`RequestScope` gains three fields:** `clientIp`, `idempotencyKey`, and `caller` (an Effect run only when a procedure runs).
- **`Services` now includes `ClientIp` and `RequestIdempotencyKey`.** `effectHandler` provides them, and provides `Caller` only when the session is live. A failed session lookup is a defect: the contract's 500.
- **A defect's 500 carries `errorMap.INTERNAL_SERVER_ERROR.message`** ("Something went wrong"), in both places that build it.
- **New `runEdge`:** it runs an `/api/auth/*` program on the app's runtime with the request's logger and services. A defect is logged and answered as the contract's 500 body with the request ID.

**`app.ts`:**
- **`createApp` takes two new options:** `clock` and `auth`. With `auth`, `/api/auth/*` goes to Better Auth through `runEdge`, inside the same handler, so those responses carry X-Request-Id and X-Contract-Version too.
- **`fetch(request, peer?)`:** the peer is `{ address }` (the tests) or @hono/node-server's `env`, read from `incoming.socket.remoteAddress` (Axis's note 1). No header is read for the IP. Without a peer, the address is `"unknown"`.
- **The scope** carries the Idempotency-Key header (`IDEMPOTENCY_KEY_HEADER`) and the caller lookup.

**`seed.ts`:**
- **`seedOperator({ databaseUrl, email, password })`** runs one transaction under an advisory lock, so two seeds take turns:
  - with no user, it inserts the operator (name `Operator`, email lower-cased) and a `credential` `auth_accounts` row (`account_id` = the user's id), with the password hashed by Better Auth's scrypt `hashPassword`;
  - with the same email it changes nothing;
  - with another email it throws, so there's never a second user.
- **The internal client** (`AVEL`, kind `internal`) is inserted with `ON CONFLICT DO NOTHING` on the CR-13 partial index.
- **Passwords under 8 characters are refused.** That is Better Auth's default minimum, which section 8 keeps.
- **Run directly,** it reads `DATABASE_URL`, `AVEL_OPERATOR_EMAIL` and `AVEL_OPERATOR_PASSWORD`, and refuses when one is missing.

**For Axis's `.env.example`:** `AVEL_OPERATOR_EMAIL` and `AVEL_OPERATOR_PASSWORD`. Both are read only by the seed. The password is never in the repo; the tests make a throwaway one.

**The dependency (E5):**

| | |
| --- | --- |
| Package | better-auth `1.7.16`, pinned exact |
| Licence | MIT |
| Released | Nov 3, 2026: the newest release older than two weeks. 1.7.17 is from Nov 4, which is borderline; latest is 1.7.26 |
| Installed size | 2.1 MB for the package alone. About 7.8 MB with the 17 new packages it brings: the `@better-auth/*` core, adapters, telemetry and utils, plus better-call, @better-fetch/fetch, @noble/ciphers, @noble/hashes, jose, kysely, nanostores, defu and rou3 |
| Why | The plan names Better Auth for sign-in. No existing package does sessions or password hashing |

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B9-01: sign-in, the cookie and the session; a wrong password or an unknown email is 401 `INVALID_EMAIL_OR_PASSWORD` | `web-auth.ts` (Better Auth's settings, the cookie attributes, the Drizzle name mapping), `app.ts` (the mount) |
| T-B9-02: sign-up refused; the users count stays 1 | `web-auth.ts` (`disableSignUp`), `seed.ts` (refuses another email) |
| T-B9-03: the lockout, 10 in 15 minutes for 15 minutes | `lockout.ts`, and the guard in `web-auth.ts`; the clock comes from `createApp({ clock })` |
| T-B9-04: 5 a minute per email and per IP; X-Forwarded-For ignored | the guard in `web-auth.ts` (T-B8's `RateLimit`), and `peerAddress` in `app.ts` |
| T-B9-05: Caller, ClientIp and RequestIdempotencyKey | `services.ts`, `effect-handler.ts` (`provideRequest`, `withCaller`), `app.ts` (the scope) |
| T-B9-06: no session fixation | Better Auth always makes a new session at sign-in and never adopts a presented cookie. Checked by the locked test |
| T-B9-07: the seed runs twice safely | `seed.ts` |
| T-B9-08: a defect's 500 carries the contract's message | `effect-handler.ts` (`internalError`, `runEdge`) |
| Axis, note 1: the peer address from `env.incoming` | `app.ts` (`Peer`, `peerAddress`) |
| Axis, note 2: main.ts untouched | No change to `main.ts` (see Limitations) |

## Deviations

None from the task doc. Some choices the doc left open:
- **The 429 bodies on `/api/auth/*`** are `{ code, message, requestId }`. The codes and the lockout's message ("Too many attempts") are login.md's wire. `TOO_MANY_ATTEMPTS` isn't a contract code, because `/api/auth/*` is outside the contract, so it isn't in `errorTable`. `errors.ts` isn't in my Territory anyway.
- **The defect message also applies where `effectHandler` gets a context that isn't a `RequestScope`.** That was the other place with "Internal server error".
- **I added `runEdge` to `effect-handler.ts`.** Writing Effect rule 2 keeps program runs in the adapter, so the auth routes run there too, not in `app.ts`.

## Limitations

- **The production entry point doesn't mount auth yet** (Axis, note 2). `main.ts` still calls `createApp()` with no `auth`, so production serves no `/api/auth/*` and no Caller until T-B14 wires the options and the router. T-B14 will also need the settings for `secret`, `baseUrl` and `secureCookies`, which this ticket doesn't name.
- **No trusted-proxy setting.** The ticket says "the socket's peer address, or the first trusted proxy's when one is configured". No setting for a trusted proxy exists, and no test asks for one, so building one would be speculative (E8). The IP is always the socket peer's. If AVEL runs behind a proxy, every client shares the proxy's address for the `sign-in-ip` limit. Candidate for T-B14 or the backlog.
- **Without a peer,** for example `app.fetch(request)` alone as the older harness calls it, `ClientIp` is `"unknown"`, and all such requests share one `sign-in-ip` window. Production always passes node-server's `env`.
- **The lockout and the rate limits are in memory** for each app, as the plan says. A restart clears them. Two attempts in flight at the 10th failure can both reach Better Auth, but the 5-a-minute email limit bounds that.
- **The lockout counts unknown emails too.** That's harmless and keeps the answer the same for both. Only a 401 from Better Auth counts.
- **Better Auth's pool** uses DbLive's default timeouts (5 s connect, 30 s statement) as constants. It doesn't read `DATABASE_CONNECT_TIMEOUT_MS` or `DATABASE_STATEMENT_TIMEOUT_MS`, and nothing closes it, because the app has no shutdown hook yet.
- **`auth_sessions.ip_address` stays null:** IP tracking is off. Better Auth would otherwise have recorded a client-set X-Forwarded-For.
- **The web session lasts Better Auth's default 7 days,** refreshed daily by `get-session`. No doc names a web session lifetime; login.md's mock uses 12 hours. The caller lookup on contract routes never refreshes it (`disableRefresh`).
- **A new sign-in doesn't revoke the session a client presented.** T-B9-06 asks only that the new session differs, and the presented one isn't adopted.
- **The T-B8-02 flake** (top of this report) isn't fixed here. It belongs to T-B8's test or to the suite's parallelism, both outside Territory. Candidates: give that test its own run or a longer connect timeout, or limit how many server test files run at once.
- **Better Auth's logger is set to `error`,** and writes the message only. Its `warn` lines (for example "User not found") are dropped.

## Messages received

| # | From | Instruction | What I did |
| --- | --- | --- | --- |
| 1 | OSA, relaying Axis | In `app.ts`, take the peer address from `env.incoming.socket.remoteAddress` as well as from the tests' `{ address }`, because @hono/node-server calls `fetch(request, env)`; never a raw X-Forwarded-For | **Followed.** `Peer` and `peerAddress` in `app.ts`. It narrows the ticket and stays in Territory. Probed by hand: six sign-ins arriving through `env.incoming` from six addresses were counted per email |
| 2 | OSA, relaying Axis | Don't wire auth or the router into `main.ts`, which is T-B14's; say in Limitations that production doesn't mount auth yet | **Followed.** `main.ts` is unchanged, and it's the first Limitation |
| 3 | OSA, relaying Axis | Review: one review, no round 2 | Noted. It matches the task doc's note (G5) and changes nothing in the build |
