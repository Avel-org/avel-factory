status: done
ticket: T-B16

# T-B16 · build · Soap: sign-in in the real server

The running server now signs the operator in. `src/server.ts`'s `startServer(env, deps?)` reads its settings from Config, builds the app with T-B14's router and Better Auth, and listens through `@hono/node-server`. Its socket, Better Auth's pool and the sign-in guard's runtime live in one Effect scope. `close()` closes that scope, and so does a failed startup. If the database fails inside a Better Auth endpoint, the answer is the contract's 500 with the requestId, and nothing prints the query's params. All 8 locked tests in `packages/server/test/server/**` pass. On the start commit `e208358`, those 8 were the only failing tests in the repo.

Branch: `t/B16-sign-in-in-production`. Commits: `1098cd6` (auth), `237dffb` (server and main), then this report. Not pushed.

## Pre-flight

Run against this worktree's own Postgres (`scripts/pg-local.sh start`), on `237dffb`:

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. "Found 2 warnings": both are `lint/performance/useDomNodeTextContent` in `apps/web/e2e/control-room-budget/budget.spec.ts` (lines 73 and 89). They were already on main, and the file is outside this Territory |
| `pnpm test` | exit 0: 78 files passed; 1017 tests passed, 1 skipped (the quarantined test already on main) |
| `pnpm --filter @avel/server test` | exit 0: 38 files passed; 89 tests passed, 1 skipped |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors, 6 warnings, 2 messages. All are in `test/**` files already on main (`unstableApiUsage`, `multipleEffectProvide`). None are in `src/` |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0: 78 files passed; 1017 passed, 1 skipped |

Before any change, `pnpm test` had exactly 8 failures, all T-B16's (`test/server/{sign-in,config,rate-limit,database-failure,lockout,close}.test.ts`). I also checked that the error-path change is what makes the test pass: with `onAPIError: { throw: false }`, T-B16-04 fails again (better-call's empty 500, "Unexpected end of JSON input"). T-B16-05 still passes either way.

## What changed

- **`packages/server/src/platform/auth/web-auth.ts`**
  - `onAPIError: { throw: true }`. Better Auth's router rethrows an endpoint's error and logs nothing. better-call still turns an `APIError` into its response, so the 401 that the lockout counts and Better Auth's other 4xx answers are unchanged. Any other error comes out of `auth.handler` as a rejection. `intoBetterAuth` reduces it to a value-free defect, and `runEdge` answers it with the contract's 500 and logs one line carrying the requestId. Before this change, that error went to better-call's `console.error("# SERVER_ERROR: ", error)` and an empty 500. Better Auth's own logger also wrote the error's message ("Failed query … params: …").
  - `AuthOptions` has three new optional fields:
    - `connectTimeoutMs` and `statementTimeoutMs`. Without them, the pool keeps DbLive's defaults (5 s and 30 s).
    - `onRelease`. `makeWebAuth` calls it once with an effect that disposes the guard's `ManagedRuntime` and then ends the pool.
  - The pool also gets DbLive's `query_timeout` (the statement timeout plus 5 s), and its idle-error listener comes off when the pool ends. The pool and the logger are split out of `betterAuthFor` into `poolFor` and `logWith`, so `makeWebAuth` holds the pool it has to release.
- **`packages/server/src/server.ts`** (new)
  - Startup reads these settings from `ConfigProvider.fromEnvRecord(env)`:
    - `DATABASE_URL` (`Config.Redacted`);
    - `PORT` (`Config.Int`, default 3000; 0 asks for a free port);
    - `AVEL_AUTH_SECRET` (`Config.Redacted`). Under 32 characters, startup fails with `InvalidSetting`: "AVEL_AUTH_SECRET must be at least 32 characters";
    - `AVEL_WEB_ORIGIN` (`Config.URL`). Its origin is Better Auth's `baseUrl`, and cookies are Secure unless its protocol is `http:`;
    - optionally `DATABASE_CONNECT_TIMEOUT_MS` and `DATABASE_STATEMENT_TIMEOUT_MS`, the same variables DbLive reads.
  - `createApp` runs inside `Effect.acquireRelease`, so its release is the effect `onRelease` handed over. `listen` is a second `acquireRelease` around `createAdaptorServer(...).listen(port)`, released with `server.close()`. Both are in one `Scope`.
  - `close()` closes the scope: the socket first, then the runtime and the pool. A failed startup closes the same scope with the failure.
  - The rejection's message is "the server didn't start: " plus one of two things. For a setting, it's the setting's message: our own, or Effect's ConfigError, which names the variable and never the value. For a defect, it's only the defect's name.
- **`packages/server/src/main.ts`**: `await startServer(process.env)`, and `close()` on SIGINT and SIGTERM. Its old `PORT` and `DATABASE_URL` handling moved into `server.ts`.

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B16-01: sign-in over real HTTP, a Secure, HttpOnly, SameSite=Lax cookie for an https origin, and get-session names the operator | `server.ts` (the `baseUrl` and `secureCookies` from `AVEL_WEB_ORIGIN`; `listen`), `main.ts` |
| T-B16-02: a missing or short secret stops startup; the error names the variable and not the value | `server.ts` (`settings`, `InvalidSetting`, `reasonOf`) |
| T-B16-03: the 6th sign-in in a minute from one socket is 429, whatever X-Forwarded-For says | `server.ts`: `@hono/node-server` passes `env.incoming`, and T-B9's `app.ts` reads its socket address as `ClientIp`. No header is read |
| T-B16-04: a database failure is the contract's 500 with the requestId, with no params, token, email or password in the output (t-b9-rigg-03, t-b9-axis-06) | `web-auth.ts` (`onAPIError: { throw: true }`, which leaves the error to T-B9's `intoBetterAuth` and `runEdge`) |
| T-B16-05: a wrong password is still a 401 response and still counts toward the lockout | `web-auth.ts`: better-call still answers `APIError`s, so `signIn` still sees the 401 |
| T-B16-06: after close(), no Better Auth connection is left on the database (t-b9-rigg-02) | `web-auth.ts` (`onRelease`, `poolFor`'s `end`), `server.ts` (one scope, `acquireRelease`) |
| Lead note: the pool timeouts come from Config with DbLive's defaults | `server.ts` (`Config.option` on DbLive's two variables), `web-auth.ts` (the defaults) |
| Lead note: released on shutdown and on a failed startup | `main.ts` (the signals), `server.ts` (`Scope.close(scope, exit)` on failure) |

**New environment variables.** `.env.example` is outside every agent's Territory, so Javaris adds these. No values are given here:
- `AVEL_AUTH_SECRET`: required, at least 32 characters. It signs the session cookie.
- `AVEL_WEB_ORIGIN`: required. The web app's origin, e.g. `https://…`. Plain `http` turns Secure cookies off.
- `PORT`: optional, default 3000. It was already read by `main.ts`.
- `DATABASE_CONNECT_TIMEOUT_MS` and `DATABASE_STATEMENT_TIMEOUT_MS`: optional. DbLive already reads them; Better Auth's pool now reads them too.
- From T-B9, for the seed: `AVEL_OPERATOR_EMAIL` and `AVEL_OPERATOR_PASSWORD`.

## Deviations

- **The release hook is a new option.** `app.ts` is locked for this ticket, and `createApp` returns only `{ fetch }`, so `server.ts` can't reach the `WebAuth` that `createApp` builds. `AuthOptions` is the only channel into `makeWebAuth` inside this Territory. So `AuthOptions` gained `onRelease`, which hands the owner the release as an Effect, and `server.ts` puts that release in its scope with `acquireRelease`. Callers that don't pass it (T-B9's and T-B14's test apps) behave exactly as before.
- **Where the program runs.** `startServer` runs its startup program and `close()` with `Effect.runPromiseExit` and `Effect.runPromise`. I'm treating `server.ts` as the server's entry point, the place Writing Effect rule 2 allows besides `effectHandler`; `main.ts` only calls it. The lead's notes put `startServer` and the `close()` handle there. No lint rule objects.
- **One variable name was my choice.** For the pool timeouts I reused DbLive's `DATABASE_CONNECT_TIMEOUT_MS` and `DATABASE_STATEMENT_TIMEOUT_MS` rather than adding `AVEL_AUTH_*` names, because both pools reach the same database. The lead can rename them if Better Auth's pool should be tuned on its own.

## Limitations

- **The router's pool isn't closed.** `close()` releases Better Auth's pool and runtime, as the ticket asks. It doesn't release the pool behind T-B14's routes 8 to 11: `makeRouter` keeps its `ManagedRuntime` to itself, and `router.ts` is outside this Territory. That pool opens only on the first clients request, so T-B16-06 (sign-in only) doesn't see it. A later ticket that owns `router.ts` could expose its release the same way. On process exit this doesn't matter.
- **`main.ts` was checked by type only.** This session wasn't permitted to run `main.ts` by hand (start it, hit `/api/health`, send SIGTERM). Its start, sign-in and close path is the one the locked tests run through `startServer`, but the signal handling itself is checked only by the typechecker.
- **The listen address is unchanged.** The server listens on every interface (Node's default for `listen(port)`), as `main.ts` did before. There's no host setting, because no test or note asks for one.
- **Clean shutdown is only partly covered.** `server.close()` waits for in-flight requests to finish, and Node closes idle keep-alive connections. A request that never ends would hold `close()` open. No test covers that, and nothing here cuts it off.

## Messages received

None.
