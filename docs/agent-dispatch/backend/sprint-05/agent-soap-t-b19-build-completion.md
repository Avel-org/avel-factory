status: done
ticket: T-B19

# T-B19 build · Soap: completion report

Branch `t/B19-platform-follow-ups`, built on the lock commit `4519c88` (main at `90e0d6c` with T-B15, T-B16 and #68 already in it). Every locked test in `packages/server/test/follow-ups/` passes, and so does the read-only `test/entry/start.test.ts`. I changed only the files listed in Part 5.

## Pre-flight

**Before any change** (own Postgres from `scripts/pg-local.sh`, after `pnpm build`): `pnpm --filter @avel/server test` gave 8 files failed and 41 passed, with 13 tests failed, 105 passed and 1 skipped. The 13 failures were exactly Rigg's locked tests.

**After the build:**

| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (6 warnings, all in `apps/web/e2e/**` and already on main; none in this diff) |
| `pnpm test` | pass: 91 files, 1063 passed, 1 skipped |
| `pnpm --filter @avel/server test` | pass: 49 files, 118 passed, 1 skipped |
| `pnpm --filter @avel/server typecheck` | pass |
| `pnpm --filter @avel/server check:effect` | pass: 0 errors (9 warnings and 2 messages, all in test files that were already on main) |
| `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts` | pass (1 test) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | pass (exit 0) |

## What changed

- **`packages/server/src/platform/errors.ts`**: four new rows in the error table.
  - `BadRequest` maps to `BAD_REQUEST`.
  - `Unauthorized` maps to `UNAUTHORIZED`.
  - `Unprocessable` maps to `UNPROCESSABLE_CONTENT`.
  - `PayloadTooLarge` maps to `MESSAGE_TOO_LONG` (413), with `details: { maxChars }`.
- **`packages/server/src/onboarding/clients/operator.ts`**: the `Refused` class is gone. A request with no session now fails with `Unauthorized` inside `effectHandler`, so the 401 comes from the table.
- **`packages/server/src/onboarding/clients/idempotent.ts`**:
  - A write with no `Idempotency-Key` now fails with `BadRequest`.
  - A write that dies with a defect now calls `release` on its key.
- **`packages/server/src/onboarding/clients/routes.ts`**:
  - A malformed cursor now fails with `BadRequest`.
  - Route 9 refuses `kind: "internal"` in code with `Unprocessable` (422). `clients_one_internal_uq` still guards the table.
- **`packages/server/src/platform/idempotency.ts`**: new `release(principal, key)`. It deletes the key's row only while the row is `in_progress`, so a completed row is never touched.
- **`packages/server/src/platform/auth/web-auth.ts`**: new `answerOf`. Any 5xx from Better Auth's handler becomes a defect that carries only the status, so `runEdge` logs it and answers the contract's value-free 500 with the request's ID. This covers get-session's own `FAILED_TO_GET_SESSION` and every other served endpoint. Better Auth's 4xx answers still come back as responses.
- **`packages/server/src/platform/webhooks/github.ts`**:
  - **Body limit:** `readCapped` refuses a declared `Content-Length` over 25 MiB before reading anything. A body sent without that header is read only until it passes 25 MiB, then the read is cancelled. Either way the answer is 413 with the contract's body, before any signature work or database call.
  - **New decision type:** `decideDelivery` now returns Merge, Alert or Ignore.
    - A signed push to the factory repo's `refs/heads/main` whose `sender.login` isn't the App raises one `system.alert.raised` in the delivery row's transaction and writes no `factory_versions` row, so its SHA is never selectable.
    - A `pull_request` that is closed and merged, or a push to that main, whose payload doesn't parse also raises an alert. Its key is `unexpected_factory_merge:delivery:<id>`.
    - Other events, repos and branches are still acknowledged and ignored.
  - **Secret:** the secret may be a `Redacted`.
  - **Database:** `WebhookOptions` takes either `databaseUrl` (as T-B15 left it, for tests) or `db`, which is the owner's `Db`.
- **`packages/server/src/platform/router.ts`**: `makeRouter` takes either `{ services }` (owned and released by its caller) or `{ databaseUrl }` (T-B14's own pool, kept so its tests still work).
- **`packages/server/src/server.ts`**:
  - **Shared database layer:** `Db` and `Idempotency` are built once with `Layer.build` inside startServer's scope, from the `env` it was given (`DATABASE_URL` and the pool timeouts, never `process.env`). The router and the webhook both use it, and `close()` ends it.
  - **Webhook settings:** it reads `GITHUB_WEBHOOK_SECRET` (as `Config.Redacted`), `FACTORY_REPO` and `FACTORY_APP_LOGIN`.
    - With all three set, it mounts the webhook.
    - With none set, there's no webhook.
    - With only some set, or with one empty, startup stops. The message names the variable and never a value.

## Contract to files

| Task | Requirement | Files |
| --- | --- | --- |
| T-B19-01 | t-b15-rigg-03: webhook mounted from Config; a missing or empty secret stops startup | server.ts, webhooks/github.ts |
| T-B19-02 | t-b15-rigg-01: 413 before the body is read in full or the signature is checked | webhooks/github.ts, errors.ts |
| T-B19-03 | t-b15-rigg-02: alert on an admin push to main; alert on an unparseable merge | webhooks/github.ts |
| T-B19-04 | t-b16-rigg-02: get-session's database failure answers the contract's 500 | auth/web-auth.ts |
| T-B19-05 | t-b16-rigg-03: close() releases the router's and webhook's pool | server.ts, router.ts, webhooks/github.ts |
| T-B19-06 | t-b14-rigg-02: a defect releases the Idempotency-Key | idempotency.ts, clients/idempotent.ts |
| T-B19-07 | t-b14-rigg-03: route 9 refuses kind internal with 422 | clients/routes.ts, errors.ts |
| T-B19-08 | t-b14-rigg-01: the 401 and 400 come from errors.ts's table | errors.ts, clients/operator.ts, clients/idempotent.ts, clients/routes.ts |

**Variables the running server now reads**, for Javaris's `.env.example`:
- **Already there before this ticket:** `DATABASE_URL`, `PORT`, `AVEL_AUTH_SECRET`, `AVEL_WEB_ORIGIN`, and the optional `DATABASE_CONNECT_TIMEOUT_MS` and `DATABASE_STATEMENT_TIMEOUT_MS`.
- **New:** `GITHUB_WEBHOOK_SECRET`, `FACTORY_REPO` (the factory repo as `owner/name`) and `FACTORY_APP_LOGIN` (the App's login as GitHub writes it in `merged_by.login` and `sender.login`, for example `name[bot]`). These are the names Rigg's harness assumed and the lock fixed.

## Deviations

Axis should confirm each of these. I couldn't ask first: OSA wasn't reachable (see Messages received).

1. **A missing `GITHUB_WEBHOOK_SECRET` is refused only when the webhook is configured.**
   - The lead's note says to refuse a missing one at startup. But locked tests 04, 06, 07 and 08, T-B16's `test/server/*`, and the read-only `test/entry/start.test.ts` all start the server with none of the webhook's variables, and they expect it to start. Rigg raised this as limitation 2 in the tests report, and I found no ruling on it.
   - What I built is the only rule that passes every one of those tests: the three variables come all together or not at all. If any is set, all must be set and none may be empty; a missing or empty secret then stops startup, naming the variable (test 01). If none is set, the server runs with no webhook.
   - If Axis wants the secret required every time, `start.test.ts` and those tests need a relock.
2. **`FACTORY_MIRROR_PATH` is not read.**
   - The note asks for the mirror's path from Config. But nothing in the running server uses the loader in Step 1: finalize, its first caller, comes in Step 7. Reading a setting nothing uses would be dead code (E8), and would stop startup over a variable nothing needs.
   - The harness passes it, and the server ignores it. The loader's first caller should read it, and pass the shared `Db` to it the same way.
3. **The 413 uses `MESSAGE_TOO_LONG`.** The catalog has no generic 413 code (Rigg's limitation 3). `MESSAGE_TOO_LONG` is a catalog code with status 413, so this needs no contract change (I3). Its `details.maxChars` carries the limit, which is measured in bytes. If Axis wants a `PAYLOAD_TOO_LARGE` code, that's a contract CR.
4. **The limit is 25 MiB (26,214,400 bytes).** GitHub's docs ("Webhook events and payloads") cap payloads at 25 MB. I read that as 25 MiB, which is the value Rigg's tests assume.
5. **"Not the App's merge commit" is judged by `sender.login`.** A push to main whose sender is the App is ignored; the App's own merges are listed from their `pull_request` event. This matches Rigg's reading (limitation 5).

## Limitations

- **Two alerts for a human merge.** When someone other than the App merges a PR, GitHub sends a `pull_request` event and a `push` event. Each raises an alert under the same key, `unexpected_factory_merge:<sha>`, so two `system.alert.raised` events land for one merge. Nothing de-duplicates alerts by key yet.
- **An interrupted write keeps its key.** Only a defect releases an Idempotency-Key. A write cancelled by an aborted request still leaves the key `in_progress`, because the cancellation could land after its commit, and releasing then could run the write twice.
- **The webhook's runtime is never disposed.** Its `ManagedRuntime`, which holds the rate limiter and the shared `Db`, is never disposed. In startServer it holds no pool of its own (the `Db` comes from the scope). The `databaseUrl` paths of `makeRouter` and `createApp({ webhook })` still open pools that nothing closes; only tests use those paths.
- **Startup now connects to the database.** `Layer.build` opens the pool and runs DbLive's `lc_messages` check before the server listens, so an unreachable database stops startup. Before, the pool opened on the first clients request.
- **Not checked:** SIGTERM end to end through `main.ts`. Test 05 tests `close()` directly.

## Messages received

None. I tried to send OSA three questions at the start of the build (the secret rule, `FACTORY_MIRROR_PATH`, and the 413 code), but no OSA session was reachable (`ListAgents` showed no other sessions). So I built on the defaults described under Deviations.

The status message to OSA at the end of the build failed the same way, because OSA still wasn't reachable. This report is the record.
