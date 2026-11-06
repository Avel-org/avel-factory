# Step 0 and Step 1 plan

Nov 2, 2026 · @javaris

The plan for the first two build steps, written before any code as the project instructions ask: what each step touches, what gets built, and the tests that say it's done. Every test runs against real Postgres (`scripts/pg-local.sh`). Decisions come from `claude/Change requests.md` (CR-12, CR-13 and the decisions log). Anything that turns out to conflict with the repo or the After Canon tab becomes a change request, not a silent change.

**Nov 5 update:** one operator, email and password for sign-in and step-up, passkeys later (Backend modules and build plan, section 8). CR-18 (accepted Nov 5, section 9) drops reps from the schema and contract in Step 0. Items 5 and 6 and tests 7 and 8 are updated to match.

## Step 0: the contract and the schema, from the docs

**Nov 5 change:** avel-factory has no existing schema or contract to migrate. Step 0 writes both fresh in this repo from DATABASE.md and the API and data reference, with CR-1 to CR-18 already in. The table below is kept as a checklist of what the first schema must already say. It is no longer a migration.

**What gets built:**
1. **The workspace:** pnpm workspace, TypeScript, Biome, Vitest, `scripts/pg-local.sh`, CI with a Postgres service.
2. **`packages/contract`:** every value list (`WorkKind`, `DispatchRole`, `Level`, `ProjectKind`, the client kinds, the integration commit kinds, the job states, and the rest) defined once; the DTOs and inputs; the oRPC route definitions; the error map; the event-kind → owning-module map (CR-15 item 8); the completion report schema with the CR-10 sections. No rep fields (CR-18).
3. **`packages/db`:** the Drizzle schema for every table in DATABASE.md, with its CHECKs, partial-unique indexes, `num_nonnulls` rules and RESTRICT foreign keys written in the schema, and a first migration generated from it. Value lists are imported from the contract, never repeated. One owner per table, as CR-15 proposes. Includes `completion_reports`, `dispatches.parked_from` and the `agent_traces` `progress` kind (CR-15 items 6 and 7).
4. **Generated docs:** the ERD and the OpenAPI document, and the drift check against DATABASE.md.

**The first schema must already say** (from the change requests):

| Change | From |
| --- | --- |
| `jobs.lease_epoch` → `claim_no`, `lease_until` → `claim_expires_at`, state `'leased'` → `'claimed'`; rename `jobs_expired_leases_ix` and `jobs_lease_ck` | CR-6 |
| `consumer_cursors.lease_epoch` → `claim_no` | CR-6 |
| `plan_modules.work_kind` CHECK: add `frontend-components`, `frontend-data` | CR-7 |
| `dispatches.role` and `eval_tasks.role` CHECKs: add `ui-contract`, `review-frontend`, `review-a11y-perf`, `api-contract`, `review-backend` | CR-7, CR-8 |
| `integration_commits.kind` CHECK: add the UI-contract and API-contract kinds | CR-7, CR-8 |
| `scenarios.level` CHECK: add `load` | CR-9 |
| `usage_log`: add `vendor` | CR-5 |
| The domain label "Money and time" → "Cost and time" | CR-2 |
| The design library index and a mission's pinned design system | CR-7 (shape to settle in Step 0: a new table, or a kind on an existing library table) |
| `clients.kind` (`'client'` or `'internal'`), with a partial unique index allowing one internal client | CR-13 |
| `missions.kind` (`ProjectKind`) and `missions.client_kind`; composite FK `(client_id, client_kind)` → `clients (id, kind)`; CHECK `(kind = 'client') = (client_kind = 'client')`; `kind` frozen once onboarding starts | CR-13 |
| `templates.source_mission_id` → `missions` (optional) | CR-13 |
| Drop `clients.rep_id`, `missions.rep_id` and `missions.rep_pct` (one operator; nobody else is a user) | CR-18 (accepted Nov 5) |

**Docs:** DATABASE.md, the design doc (Main: roster, build order with Step 0, Cost control model routing, Dispatch, Project templates, Measurement and receipts), the Canon doc (work kinds, dispatch roles, task doc, scenario levels, project kinds), the Sandbox doc (host, model key), the project instructions (Durable work wording, the Step 1 list). The ERD and OpenAPI document are regenerated.

**Done when:**
1. The first migration applies to an empty database and reverses cleanly.
2. A `db` suite against real Postgres covers every CHECK, unique and partial-unique index, exactly-one-parent rule and delete refusal in DATABASE.md, one test per rule (the count is filled in when Rigg writes them).
3. The CR-13 rules: a second internal client is refused; a client mission on the internal client is refused, and an internal mission on a client is refused; changing a mission's kind after onboarding starts is refused.
4. The ERD drift check passes: the schema and DATABASE.md agree.
5. The contract builds and the OpenAPI document generates; the review script passes.
6. Every value list the schema checks is imported from the contract package, not repeated (a test looks for repeats).
7. A new event kind with no owning module fails to compile.

**Builders:** Atlas (workspace, CI, generated docs) and Soap (schema, contract). Rigg writes the done-when tests first. Review: Axis, and Brennan against DATABASE.md and the API and data reference.

## Step 1: the scaffold

The longer scope from the design doc and the Port inventory, minus secrets (CR-1).

### What gets built

1. **The server shell.** Hono, with oRPC's `implement(contract)` served through OpenAPIHandler under `/api`. Outside the contract: `/api/auth/*` (Better Auth) and `POST /api/webhooks/github` (raw-body signature check, deduplicated on `X-GitHub-Delivery`).
2. **Middleware, in this order:**
   1. request ID: read or create, echoed in `X-Request-Id`;
   2. the JSON logger, with the request ID on every line;
   3. `X-Contract-Version` on every response;
   4. rate limit (in memory, behind a small wrapper);
   5. auth: a web session or a CLI session;
   6. idempotency, on writes;
   7. the procedure;
   8. output validation through the DTO mapper;
   9. the error mapper, into `{ code, message, details?, requestId }`.
3. **Database errors to status codes:** a unique violation is 409; a CHECK violation is 422; a foreign-key refusal is 409 when a delete is refused and 422 when a parent is missing; a stale `rowVersion` is 409; a move the state machine doesn't allow is 422 with the allowed moves. Constraints are never duplicated in code as the only guard.
4. **Idempotency store** (`idempotency_keys`): kept per (principal, key) for 24 hours with the route and a hash of the body. The same key and body returns the first response; a different body is 409; a duplicate while the first is still running is 409. A response carrying a secret or token is never stored, and its route answers a replay with 409.
5. **Better Auth:** email and password, for one operator (sign-up off), lockout after 10 failed sign-ins for 15 minutes. Passkeys come later (Nov 5); their table exists but isn't used yet. The password is never in the repo: the seed reads it from `AVEL_OPERATOR_PASSWORD` on the host, and tests use their own throwaway value. It uses the existing `users` and `auth_*` tables through the Drizzle adapter. A seed script creates your account and AVEL's internal client record (CR-13).
6. **Step-up grants** (`step_up_grants`): your password again, for one action on one target. Single-use, 5 minutes, consumed in one atomic update. In Step 1 it guards approving a CLI login; secrets and repo connections use it from Step 4.
7. **CLI login:** start a device login, approve it in the web app with step-up, poll for the session. Sessions last 12 hours and are stored hashed (`device_logins`, `cli_sessions`). List and revoke sessions.
8. **Activity log** (`activity_log`): every write records who, what, on which target and why.
9. **Jobs** (`jobs`): claimed with `FOR UPDATE SKIP LOCKED`; each claim raises `claim_no` and sets `claim_expires_at`; saves are conditional on the current `claim_no`; one live job per key.
   - A claim lasts 30 seconds and workers check in about every 10 seconds.
   - The reaper runs every 10 seconds and puts expired claims back in the queue.
   - A failing job retries with backoff (10 s, 30 s, 2 min, 10 min) and is marked `dead` after 5 tries.
10. **Events** (`events`, `consumer_cursors`): a state change, its event and any follow-up job are saved in one transaction; `seq` is taken under an advisory lock as the last statement before commit, so it follows commit order. Consumers are claimed jobs that move their cursor only by compare-and-swap.
11. **The factory repo:** `avel/factory` with branch protection, a first `factory.yaml`, and a loader that reads it by commit SHA. A merge seen on the webhook adds a `factory_versions` row; a merge by anyone but the factory's GitHub App raises an alert and isn't selectable.
12. **The sample route:** the clients routes (`GET/POST /api/clients`, `GET/PATCH /api/clients/{clientId}`), with `toClientDto`, including `kind`. Client repo connections wait for Step 4.
13. **A minimal approval page:** what's waiting, with approve and reject, served from `GET /api/pending-decisions` and `POST /api/proposals/{proposalId}/decisions`, so later steps can be approved before the full web app.
14. **CI:** build, typecheck, lint and test against a Postgres service, plus the ERD drift check, OpenAPI generation and the contract review script.

**Ported from avel-server** (per the Port inventory): as-is: the clock, ids, canonical JSON, tokens, the logger, the envelope, pagination and the idempotency header schema. With changes: the error union and status mapping, the middleware, the DB core, Better Auth (email and password, no GitHub sign-in), the activity log, and the test helpers. Everything else in this step is new.

### Tables touched
`users`, `auth_sessions`, `auth_accounts`, `auth_verifications`, `auth_passkeys`, `step_up_grants`, `device_logins`, `cli_sessions`, `idempotency_keys`, `activity_log`, `jobs`, `events`, `consumer_cursors`, `factory_versions`, `webhook_deliveries`, `clients`, `proposals` (read and decide only).

### Docs touched
The design doc (Main: build order, API routes, Factory as code), DATABASE.md (Plumbing, People and clients), the Port inventory (Step 1 list), `docs/design/Jobs and workers.md`.

### Rate limits (proposed defaults, in config)
- Sign-in: 5 a minute per email and per IP, on top of the lockout.
- CLI login: 5 device-login starts a minute; polling no faster than every 5 seconds.
- GitHub webhook: 60 a minute.
- The agent API per dispatch token: the wrapper is built now and applied when those routes arrive in Step 4.

### Tests that say Step 1 is done
1. CI is green on an empty app; the contract builds and the OpenAPI document is generated from it.
2. **DTO mapper:** a client's output has exactly the DTO's fields and no internal column.
3. **Errors:** a typed error returns `{ code, message, details?, requestId }`, and `requestId` matches `X-Request-Id`. Every response carries `X-Contract-Version`.
4. **Idempotency:** a replayed write with the same key and body returns the first response; the same key with a different body gets 409; a duplicate during the first gets 409.
5. **Rate limit:** the sample route returns 429 past its test limit.
6. **Database rules:** a unique violation maps to 409 (for example, creating a second internal client), a CHECK violation to 422, a stale `rowVersion` to 409.
7. **Sign-in:** the 11th failed sign-in in 15 minutes is locked out; sign-up is refused, and no route or seed run can create a second user.
8. **Step-up:** a wrong password gets no grant; a grant used twice, used for another action or target, used from another session, or used after 5 minutes is refused.
9. **CLI login:** approval needs step-up; polling returns the session once; a replayed poll gets 409 and never returns the token again; the session expires after 12 hours and can be revoked.
10. **Jobs:** a job whose worker is killed is picked up within a minute and does its work once; a save with an out-of-date claim number is refused; two workers never claim the same job; a job that keeps failing ends `dead` after 5 tries.
11. **Events:** under concurrent transactions, `seq` order equals commit order with no gaps a reader can miss; a rolled-back transaction leaves no event and no job; two copies of one consumer never both act on an event.
12. **Factory repo:** the loader reads `factory.yaml` at a given SHA; an unmerged change has no effect; a merge by anyone but the factory's GitHub App isn't selectable and raises an alert; a replayed webhook delivery is ignored. (The full "no effect until a new mission is finalized" test needs finalize, which arrives in Step 7; Step 1 tests the loader and the pin.)
13. **Activity log:** every write in this step leaves exactly one row.
14. **Approval page:** a seeded proposal shows as waiting, and approving it records the decision with a reason and refuses a stale version.

### Not in Step 1
Secrets and KMS, repo connections, the delivery worker (Step 4); rooms and proxies (Step 2); the event stream over SSE and the CLI's `watch` (Step 5); Canon's per-kind briefing (Step 7).

### Risks
- **The After Canon tab isn't in the project.** Job kinds, the event catalog and the state machines are taken from the repo's contract and schema. If the tab later disagrees, that becomes a change request.
- **Better Auth's table names.** The schema calls them `auth_sessions`, `auth_accounts` and so on, so the adapter needs a name mapping. Checked in the first sign-in test.
- **Step 1's factory-repo test needs GitHub.** CI uses a local bare repo and recorded webhook payloads; one manual run against the real `avel/factory` repo confirms branch protection.
