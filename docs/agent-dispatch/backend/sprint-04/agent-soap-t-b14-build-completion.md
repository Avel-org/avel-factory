status: done
ticket: T-B14

# T-B14 build: completion report (Soap)

Branch `t/B14-clients-routes`, starting at the lock commit `bdbeec9` (tests at `54173c3`). Nothing pushed.

All 16 locked tests in `packages/server/test/clients/` pass, and none of them were edited. Before the build, all 7 files failed at import because `src/platform/router.ts` didn't exist (Rigg's report; I saw the same thing at the start: 7 failed, 25 passed, 65 tests passed and 1 skipped).

## Pre-flight

Run against my own Postgres (`scripts/pg-local.sh start`), in the order Part 7 gives.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. 2 warnings, both already there (`apps/web/e2e/control-room-budget/budget.spec.ts`) |
| `pnpm test` | exit 0. 72 files passed; 1009 tests passed, 1 skipped (the quarantined T-B8-02 test) |
| `pnpm --filter @avel/server test` | exit 0. 32 files passed; 81 tests passed, 1 skipped |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0. 0 errors, 6 warnings and 2 messages, all already there and all in tests. Nothing in `src/` |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0. 72 files, 1009 passed, 1 skipped |
| `GITHUB_HEAD_REF=t/B14-clients-routes pnpm --filter @avel/repo-checks run check-locks` | passed: T-B14, 4 builder commits (run as an extra check) |

The server tests print `idle database client error 57P01` lines. They come from each test file's `drop database … with (force)` ending the open pools. The pools log them and carry on, as Better Auth's pool already did.

## What changed

- `packages/server/src/audit/activity.ts` (new). `recordActivity({ userId, action, target, reason? })` is the audit module's one call. It inserts one `activity_log` row: `actor_kind 'user'`, the operator's id, the action, the target and the reason, with the id taken from `Ids`. It needs `Tx`, so it can only run inside the transaction of the change it records.
- `packages/server/src/onboarding/clients/dto.ts` (new). `toClientDto` is the one mapper. It names each `ClientDto` field, turns timestamps into ISO strings and parses the result with the contract's `ClientDto`, so no other column can get out.
- `packages/server/src/onboarding/clients/operator.ts` (new). `operatorHandler` wraps `effectHandler`. With no live session it answers 401 `UNAUTHORIZED` ("Not signed in", the contract's body and the request's id) and the route's program never runs. Otherwise the program runs with the Caller. A program can also answer `Refused("BAD_REQUEST")`; see Deviations.
- `packages/server/src/onboarding/clients/idempotent.ts` (new). `idempotentWrite` runs a write under the request's Idempotency-Key through T-B8's `Idempotency` store, with the operator's user id as the principal and a sha256 of the input as the contract parsed it. Without the header the write is refused (400).
  - **Replay:** the same key and body get the first answer back, whether that was the output or a tagged failure. The failure is stored as `{ code, message, details }` and raised again under its tag.
  - **Refusals from the store:** another body is `IDEMPOTENCY_KEY_REUSED`, and a request while the first still runs is `IDEMPOTENCY_IN_PROGRESS`.
  - **Order:** the key is claimed and committed before the write's own transaction starts.
- `packages/server/src/onboarding/clients/routes.ts` (new). `clientsRouter(services)` holds routes 8 to 11 through `implement(contract)`. Each program gets its Db and Idempotency from `services`.
  - **Route 8:** pages oldest first by id, a UUIDv7. The cursor is the last id on the page before, and the default `limit` is 50. Only `kind = 'client'` is listed unless the query has `?kind=internal`. `?status=` filters by status.
  - **Route 9:** inserts the client and its `clients.create` activity row in one transaction. The id comes from `Ids`, and `contacts` is sent as `::jsonb` so a JSON `null` stays a JSON value.
  - **Route 10:** an unknown id is 404 `NOT_FOUND`.
  - **Route 11:** locks the row (`for update`). An unknown id is 404. It then updates `where id and row_version = input`. `requireUpdated` turns a stale version into 409 `STALE_VERSION { field: "rowVersion", currentVersion }`. `archived_at` follows `status`, `proof_consent_at` follows `proofConsent` (time from `Clock`), and the trigger moves `row_version` and `updated_at`. The `clients.update` activity row goes in the same transaction. A CHECK the database refuses comes back from the Db service as 422 `CONSTRAINT_VIOLATION` naming the constraint, and the transaction rolls back, activity row included.
- `packages/server/src/platform/router.ts` (new). `makeRouter({ databaseUrl })` composes the health router (route 6) and `clients`. It builds `DbLive` and `IdempotencyLive` once in a `ManagedRuntime`: one pool for the process, made on the first request that needs it. The given URL wins over `DATABASE_URL`, and the pool's other settings still come from the environment. `app.ts` didn't change.
- `packages/server/src/main.ts`. It passes `makeRouter({ databaseUrl: DATABASE_URL })` to `createApp` and refuses to start without `DATABASE_URL`. Sign-in isn't mounted (T-B16), so until T-B16 lands the real server answers routes 8 to 11 with 401.

Commits: `ca2752b` (audit), `814d3d6` (onboarding), `8e6b8be` (router and main), then this report. Each carries `Refs: T-B14`.

## Contract to files

| Requirement | Files |
| --- | --- |
| T-B14-01, test 2: route 9's output is exactly `ClientDto`, and route 10 returns the same | `dto.ts`, `routes.ts` (create, get) |
| T-B14-02, test 4: replay, key reuse, and a repeat while the first runs | `idempotent.ts`, through T-B8's `idempotency.ts` (read only) |
| T-B14-03, test 3: an unknown client is 404 on routes 10 and 11, with the request's `requestId` | `routes.ts` (`notFound`, update's locked read) |
| T-B14-04, test 6: an edit bumps `rowVersion`; archive and restore keep `archivedAt` in step; stale is 409; a CHECK is 422; the edit replays | `routes.ts` (update), `idempotent.ts`, the Db service's mapping (read only) |
| T-B14-05: route 8 pages and leaves the internal client out unless `?kind=internal`; route 9 can't make a second internal client | `routes.ts` (list; create through `clients_one_internal_uq`) |
| T-B14-06: no session is 401 on every route | `operator.ts` |
| T-B14-07, test 13: one activity row per write, none for a refused write, a replay or a read | `audit/activity.ts`, `routes.ts` (the same transaction) |
| Routing: `platform/router.ts` composes the routes and `main.ts` passes them to `createApp` | `router.ts`, `main.ts` |
| E12: onboarding writes `clients`, audit writes `activity_log` | `onboarding/clients/*`, `audit/activity.ts` |
| Writing Effect rule 4: ids from `Ids`, time from `Clock` | `routes.ts`, `activity.ts` |

## Deviations

- **401 and 400 are answered outside the error table.** `platform/errors.ts` has no tagged error for `UNAUTHORIZED` or `BAD_REQUEST`, and that file isn't in my Territory. So `operator.ts` answers these as oRPC errors with the contract's code, status, message and body, before or around the program. That's the same way oRPC already answers input its schema rejects (400), and the way `app.ts` answers an unknown path (404). It covers three cases:
  - no session (401);
  - a write without an `Idempotency-Key` (400);
  - a route 8 cursor that isn't one of ours (400, as contract-mock answers it). Without that check, Postgres would turn a bad cursor into a 500.

  Every other failure is a tagged error from the one table. The cleaner home would be `Unauthorized` and `BadRequest` rows in `errors.ts`, which a later ticket could add (I suggest P2), and `Refused` would then go away. I didn't stop for this, because the ticket can be done in full inside its Territory and no doc says otherwise. Axis may rule differently.
- **Route 9 and the internal client.** Route 9 has no check of its own for `kind: "internal"`. The database's `clients_one_internal_uq` refuses the second internal client, and the Db service answers 409 `ALREADY_EXISTS` naming that constraint. Nothing is written. The test allows any 4xx. The seed creates the operator and the internal client in the same transaction, so no one can sign in and reach route 9 while no internal client exists.
- **Refused writes are stored as their first answer.** When a write fails with a tagged error (404, 409 or 422), the key is completed with that status and error body, so a replay gets the same refusal back with its own `requestId`. Design v0.6 says "the same caller, key and body returns the first response", and T-B8's store has no way to release a key. Nothing here was asked for beyond that.
- **Activity action names.** No doc gives an action list, and the Port inventory says only "new action list". I used the contract's procedure names, `clients.create` and `clients.update`. The target is `clients/<id>`, and `reason` is null because routes 9 and 11 take none.
- **No event.** "Backend modules and build plan" §8 item 5 says an operator write goes to `activity_log` "with its event". The contract has no client event kind, so routes 9 and 11 write none.

## Limitations

- **A defect or an interruption mid-write** (a 500, or the client hanging up) leaves its Idempotency-Key `in_progress` until the row expires after 24 hours. Until then, a retry with the same key gets 409 `IDEMPOTENCY_IN_PROGRESS`. T-B8's store has no release, and `idempotency.ts` is read only. The data stays safe (nothing is written twice), but a client has to use a new key. I suggest a `release` in a later platform ticket.
- **The key is completed in its own transaction,** after the write commits, because that's how the store works. If the process dies between the two, the key stays `in_progress` as above.
- **No locked test covers these**, so I checked each one once with a throwaway test I didn't commit and then deleted:
  - a missing key → 400 `BAD_REQUEST`;
  - a bad cursor → 400;
  - a stale edit replayed with the same key → the same 409 `STALE_VERSION`;
  - `contacts: null` stored as JSON `null`;
  - an edit with no fields → 200 and `rowVersion` bumped;
  - route 9 with `kind: "internal"` → 409 `ALREADY_EXISTS` (`clients_one_internal_uq`).
- **Route 8's default `limit` of 50** copies contract-mock's provisional value. No doc sets one (`decisions-approval-page.md` §172 asks Axis to confirm it). The order is by id; with `Ids`' UUIDv7s that is creation order to the millisecond.
- **Archiving or giving consent again** resets `archivedAt` or `proofConsentAt` to now.
- **Rate limits on these routes:** none, because the plan names none.
- **`main.ts` was not started by hand.** It only typechecks. Sign-in in the real server is T-B16.

## Messages received

None.

At the finish I tried to message OSA with my status and this report's path, but no session named OSA was reachable (`ListAgents` showed only the T-B15 build and the T-F10 build). I sent nothing to any other session.
