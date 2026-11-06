# Backend sprint-00 (Step 0): the step contract

Nov 6, 2026 · Axis · **status: for Brennan's review-spec; not locked.** B1 to B9, O1 and O2 are answered (`decisions.md`). Nothing is open.

Step 0 rebuilds `packages/db` from `AVEL Database Map.html`, applies CR-1 to CR-13 and CR-18 on top, and writes `packages/contract` fresh (Step 0 and Step 1 plan, Step 0, "Nov 5 change (CR-19)"). This slice says what the contract contains and which tables the schema has. Each item cites its source. An item no source defines is marked **open**. Nothing here is invented.

**Sources, in the order they win** (CR-19, build plan section 10, "Precedence while Step 0 runs"; `decisions.md` D3):
1. the database map (`docs/design/AVEL Database Map.html`, commit e1ed7ae), for what exists;
2. accepted change requests, on top of it: CR-1 to CR-13, CR-16 (accepted Nov 6), CR-18 and CR-19, plus INT's answers recorded in `decisions.md`;
3. `docs/design/API routes.md`;
4. DATABASE.md, for the reasoning only;
5. the Canon enums;
6. the reference's Conventions.

CR-17 and the web's CR-W requests are still proposed, so they're out (section 8).

**Still not in the repo:**
- the After Canon tab, which holds the event catalog and the state machines;
- the project instructions;
- "CR-W1 W2 W5 W9 W10: What the first screens need".

This slice uses only what `docs/design/` quotes from them.

## 1. What `packages/contract` exports (Step 0 item 2)

| # | Export | Source | State |
| --- | --- | --- | --- |
| E1 | Every value list, defined once (section 3, Appendix A) | Step 0 item 2; the map's CHECKs | Quoted |
| E2 | The DTOs and inputs (section 4) | Step 0 item 2 | Drafted from the map's columns by the rule in section 4 (D2). `DispatchPackageDto` is quoted from CR-16 |
| E3 | The oRPC route definitions: 102 routes (section 2) | API routes.md: the 99, plus CR-16's 3 | Quoted |
| E4 | The error map (section 5) | Step 1 items 2.9, 3 and 4; D5; CR-16 | Decided |
| E5 | The event-kind → owning-module map, exhaustive: 12 kinds (section 5) | CR-15 item 8; done-when 7; O1 | Decided |
| E6 | The completion report schema: `completion_reports.body` holds the CR-10 sections | Step 0 item 2; CR-10 item 7; the map (B4) | Decided |
| E7 | No rep fields anywhere | CR-18 item 1 | Quoted |

## 2. Routes: 102 (the 99 copied byte for byte from `docs/design/API routes.md`, lines 20 to 189, with only the heading levels changed; then CR-16's 3)

**Rules on every route** (API routes.md, top; API and data reference, Conventions):
- **On every write:** an `Idempotency-Key` is required. Approvals, decisions, releases, overrides and acceptances carry the version they apply to in the body (`rowVersion`, `version`, `receiptHash`, `headSha`, per Q4), and a stale version gets 409. Overrides, decisions, acceptances and pass approvals take a written reason.
- **Step-up** (password re-entry) applies only where a row says **Step-up**: credential actions. Approvals never ask.
- **Paths and values:** paths are lowercase plural nouns with named IDs. Money is whole micro-dollars (`*Micros`). Times carry a time zone. IDs are UUIDv7.
- **Outside the contract** (not counted, no typed client entry, per Q6): `/api/auth/*` (Better Auth), `POST /api/webhooks/github`, `/git/missions/{missionId}.git`.

### Auth (5)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 1 | W | `POST /api/cli/device-logins` | Starts a CLI login with a device code and a short user code |
| 2 | W | `POST /api/cli/device-logins/{userCode}/approvals` | You approve it in the web app. **Step-up.** |
| 3 | W | `POST /api/cli/sessions` | The CLI polls with its device code and gets its session once approved. Never replayable: a replayed key gets 409, and the token is never returned again. |
| 4 | R | `GET /api/cli/sessions` | List CLI sessions (stored hashed, 12 hours, operator scope) |
| 5 | W | `DELETE /api/cli/sessions/{sessionId}` | Revoke a session |

### Health (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 6 | R | `GET /api/health` | Health |
| 7 | R | `GET /api/doctor` | Database, Docker and gVisor, proxies, token expiry dates, the last isolation run; also room health |

### Clients and repos (10)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 8 | R | `GET /api/clients` | List clients |
| 9 | W | `POST /api/clients` | Create a client |
| 10 | R | `GET /api/clients/{clientId}` | One client |
| 11 | W | `PATCH /api/clients/{clientId}` | Edit a client |
| 12 | R | `GET /api/repo-connections` | List connections |
| 13 | W | `POST /api/repo-connections` | One per client, with a read token and a write token limited to that client's repos. **Step-up.** |
| 14 | W | `PATCH /api/repo-connections/{connectionId}` | Edit its `repos[]`. **Step-up.** |
| 15 | W | `DELETE /api/repo-connections/{connectionId}` | Revokes both tokens; the record stays for history |
| 16 | W | `POST /api/repo-connections/{connectionId}/verifications` | Checks both tokens and their scopes |
| 17 | W | `POST /api/repo-connections/{connectionId}/rotations` | Replaces the read or the write token without changing the connection. **Step-up.** |

### Packages (1)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 18 | R | `GET /api/packages` | A paged list; read-only (packages change through a factory PR) |

### Missions (16)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 19 | R | `GET /api/missions` | List missions |
| 20 | W | `POST /api/missions` | A new mission starts as a draft with a client |
| 21 | R | `GET /api/missions/{missionId}` | State, gate strip, onboarding progress and checkpoints, why, deliveries |
| 22 | W | `PATCH /api/missions/{missionId}` | Links a repo connection |
| 23 | W | `POST /api/missions/{missionId}/pauses` | Pause |
| 24 | W | `DELETE /api/missions/{missionId}/pauses/{pauseId}` | Resume (ends that pause row; pauses are independent rows, not a stack, per the schema) |
| 25 | W | `POST /api/missions/{missionId}/cancellations` | Cancel |
| 26 | W | `POST /api/missions/{missionId}/context-runs` | Read the context again after it was blocked |
| 27 | W | `POST /api/missions/{missionId}/readiness-waivers` | Proceed on a partial readiness result, with a reason |
| 28 | W | `POST /api/missions/{missionId}/finalizations` | Approval #1, with the plan version |
| 29 | W | `POST /api/missions/{missionId}/pass-approvals` | The receipt hash and a reason |
| 30 | W | `POST /api/missions/{missionId}/releases` | Approval #2, with the receipt hash and, for a pass, the pass approval ID |
| 31 | W | `POST /api/missions/{missionId}/refreshes` | Refresh onto a newer client main |
| 32 | W | `POST /api/missions/{missionId}/budget-increases` | Opens a budget-increase proposal naming the module or mission budget and the amount |
| 33 | R | `GET /api/missions/{missionId}/messages` | Canon chat history, from the onboarding messages table |
| 34 | W | `POST /api/missions/{missionId}/messages` | Your turn with Canon; replies stream on the trace stream |

### Gate 0 (11)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 35 | R | `GET /api/missions/{missionId}/uploads` | List uploads |
| 36 | W | `POST /api/missions/{missionId}/uploads` | Upload |
| 37 | W | `DELETE /api/uploads/{uploadId}` | Refused once an approved fact cites the upload |
| 38 | W | `PATCH /api/checkpoints/{checkpointId}/sections/{sectionKey}` | Edit one section |
| 39 | W | `POST /api/checkpoints/{checkpointId}/drafts` | Generate |
| 40 | W | `POST /api/checkpoints/{checkpointId}/approvals` | Approve |
| 41 | W | `POST /api/checkpoints/{checkpointId}/change-requests` | Ask for changes |
| 42 | W | `POST /api/checkpoints/{checkpointId}/reopenings` | Reopen |
| 43 | W | `PATCH /api/facts/{factId}` | Confirm or reject |
| 44 | W | `POST /api/questions/{questionId}/answers` | Answer |
| 45 | W | `PUT /api/missions/{missionId}/secrets/{secretName}` | Write-only. **Step-up.** (Step 4, per CR-1.) |

### Plan and roster (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 46 | R | `GET /api/missions/{missionId}/plan` | `?version=` |
| 47 | R | `GET /api/roster` | The roster |
| 48 | W | `PUT /api/roster` | Replaces the whole roster as a new version, filed as a factory-repo PR; running missions keep theirs |

### Dispatches (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 49 | R | `GET /api/missions/{missionId}/dispatches` | With DISPATCH.md |
| 50 | R | `GET /api/dispatches/{dispatchId}` | Task doc versions, attempts, room |
| 51 | W | `POST /api/dispatches/{dispatchId}/overrides` | Start, retry, park or cancel by hand, with a reason |

### Decisions (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 52 | R | `GET /api/pending-decisions` | Everything waiting on you: proposals of every kind, plus open factory PRs |
| 53 | R | `GET /api/proposals/{proposalId}` | One proposal |
| 54 | W | `POST /api/proposals/{proposalId}/decisions` | Choose an option, with a reason |

### Gates and findings (6)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 55 | R | `GET /api/missions/{missionId}/gates` | Every gate evaluation and integration commit |
| 56 | R | `GET /api/integration-commits/{integrationCommitId}` | Results and log |
| 57 | W | `POST /api/missions/{missionId}/overrides` | Gates 3 and 4 only; caps the verdict at pass. Gates 1, 2 and 5 are refused. |
| 58 | R | `GET /api/missions/{missionId}/findings` | List findings |
| 59 | W | `PATCH /api/findings/{findingId}` | Confirm or dismiss, with a reason |
| 60 | W | `POST /api/findings/{findingId}/acceptances` | Accept with a reason; caps the verdict at pass; refused for an integrity failure at Gate 5 |

### Receipts and delivery (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 61 | R | `GET /api/receipts/{receiptId}` | `?verify=1` rechecks the hash |
| 62 | R | `GET /api/deliveries/{deliveryId}/archive` | The zip |

### Events and traces (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 63 | R | `GET /api/events/stream?missionId=` | Server-sent events through oRPC's event iterator; resumes from `Last-Event-ID` (the event's `seq`), replaying up to 30 days |
| 64 | R | `GET /api/traces/stream` | `?attemptId=` or `?sessionId=`; resumes from `Last-Event-ID` (the trace ID) |

### Your work (4)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 65 | W | `POST /api/operator/events` | Commits from the git hook, CLI activity heartbeats, hand-entered time |
| 66 | W | `PATCH /api/time-entries/{timeEntryId}` | Confirm or edit |
| 67 | R | `GET /api/notes` | Your notes |
| 68 | W | `POST /api/notes` | Add a note, from the web or CLI |

### Metering (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 69 | R | `GET /api/metrics` | `?missionId=` or by package, and by factory commit |
| 70 | W | `POST /api/payments` | Record a payment |

### Factory repo (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 71 | R | `GET /api/factory/versions` | Merged commits, which missions are on each, and knowledge releases |
| 72 | R | `GET /api/factory/changes` | Open PRs |
| 73 | W | `POST /api/factory/changes/{changeId}/merges` | Approve and merge |

### Library (18)
The same four routes for each kind. Creating or changing an item opens a factory PR; approving, retiring or promoting one is merging that PR.

| # | | Route | What it does |
| --- | --- | --- | --- |
| 74–77 | R/W | `GET`, `POST /api/library/skills`; `GET`, `PATCH /api/library/skills/{itemId}` | Skills: create, or upload a skill folder; each records its source (upload, written or import) |
| 78–81 | R/W | the same for `/api/library/kb-entries` | Knowledge entries |
| 82–85 | R/W | the same for `/api/library/rules` | Rules |
| 86–89 | R/W | the same for `/api/library/templates` | Project templates |
| 90 | R | `GET /api/rules/{rulesVersion}/bundle` | What `avel check` runs |
| 91 | R | `GET /api/missions/{missionId}/closeout-items` | Confirmed findings and lesson candidates to write up |

The design writes the Library paths as `/api/library/{kind}`; check the exact per-kind paths (for example `/api/library/kb-entries` or `/api/kb-entries`) against the contract.

### Evals, later (1)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 92 | R | `GET /api/eval/configs` | Live results per config |

### Audit (1)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 93 | R | `GET /api/activity` | The activity log, overrides included |

### Agent, host tool server only (6)
Called only through the host tool server with a dispatch token, which is checked against the token's dispatch and role.

| # | | Route | What it does |
| --- | --- | --- | --- |
| 94 | W | `POST /api/agent/reports` | Completion report |
| 95 | W | `POST /api/agent/findings` | Reviewers only |
| 96 | W | `POST /api/agent/dependency-requests` | At most 3 new packages per dispatch |
| 97 | W | `POST /api/agent/escalations` | Test disputes, test changes, suppressions, contract changes |
| 98 | W | `POST /api/agent/progress-notes` | Progress notes |
| 99 | R | `GET /api/agent/kb-entries?query=` | The kb-search tool: read-only, scoped to the mission's client, its stack and global entries; logged in the trace |

**Total: 99.**

### Dispatch package (3), CR-16 (accepted Nov 6, e1ed7ae; copied byte for byte from API routes.md, lines 192 to 196)
| | Route | What it does |
| --- | --- | --- |
| R | `GET /api/missions/{missionId}/dispatch-package` | The package manifest (`DispatchPackageDto`) |
| R | `GET /api/missions/{missionId}/dispatch-package/files?path=` | One file, `text/markdown` |
| R | `GET /api/missions/{missionId}/dispatch-package/archive` | The deterministic zip |

- **Query and caching:** all three take `?planVersion=`, which defaults to the mission's current plan. The files route returns `text/markdown` with its `sha256` as the `ETag`. The archive returns `application/zip` with `packageSha256` as the `ETag`, and it's deterministic.
- **Access:** reads only. No `Idempotency-Key` and no step-up, and only an operator session (web or CLI) may call them. Agents never do (CR-16 contract, Routes and Errors).

**Total: 102.** A contract test snapshots the method and path pairs (D4).

## 3. Value lists (E1)

**Defined once, in `packages/contract`,** and imported by `packages/db`. Repeating one fails done-when test 6.

**The base is the map's 99 value-list CHECKs,** quoted in Appendix A: table, column, values and CHECK name, as the map has them. Where one list backs several CHECKs, the contract defines it once under one name:

| Name | Backs (map CHECKs) | Source of the name |
| --- | --- | --- |
| `MissionState` | `missions.state`, `mission_pauses.interrupted_state` | DATABASE.md; B1 |
| `DispatchState` | `dispatches.state`, `dispatches.parked_from` (never `parked`, by `dispatches_parked_ck`) | D8 |
| `ModuleRunState` | `module_runs.state`, `module_runs.parked_from` | — |
| `DispatchRole` | `dispatches.role`, `eval_tasks.role` | Canon |
| `Package` | `onboarding_sessions.package_provisional`, `package_final` | Canon; D7 |
| `Stage`, `Checkpoint`, `FactKind`, `WorkKind`, `EarsPattern`, `Level` | their columns in Appendix A | Canon |

Any other list is named after its table and column, for example `AttemptOutcome` or `FindingState`.

**Changes applied on top of the map** (never edited into Appendix A):

| List | Change | From |
| --- | --- | --- |
| `dispatches.role`, `eval_tasks.role` (`DispatchRole`) | add `ui-contract`, `review-frontend`, `review-a11y-perf`, `api-contract`, `review-backend` | CR-7, CR-8 |
| `plan_modules.work_kind` (`WorkKind`) | add `frontend-components`, `frontend-data` | CR-7 |
| `scenarios.level` (`Level`) | add `load` | CR-9 |
| `integration_commits.kind` | add `ui_contract`, `api_contract`, `dispatch_docs` | CR-7, CR-8 (B3); CR-16 |
| `jobs.state` | `leased` → `claimed` | CR-6 |
| `clients.kind` (`ClientKind`), new | `client`, `internal` | CR-13 |
| `missions.kind` (`ProjectKind`), new | `client`, `internal`, `template` | CR-13 (B2) |
| `missions.client_kind`, new | `ClientKind` | CR-13 |
| `design_systems.layer`, new | `global`, `client` | B9 (INT) |
| `design_systems.status`, new | `active`, `retired` | B9, shaped like `templates` |
| `completion_reports.status` | unchanged: `done`, `partial`, `blocked` | the map (B4) |

## 4. DTOs and inputs (E2)

**`DispatchPackageDto` is quoted** (CR-16 contract, `GET /api/missions/{missionId}/dispatch-package`, word for word):

```ts
DispatchPackageDto = {
  missionId: string;
  planVersion: number;
  factoryCommit: string;
  renderedAt: string;            // ISO time
  gate1PassedAt: string | null;  // the line "every section passed the pre-dispatch check"
  location: {                    // where it's written in the repo; null if it isn't written there
    repo: string;                // e.g. "avel-org/gts-landing"
    branch: string;              // e.g. "mission/landing"
    path: string;                // e.g. "docs/agent-dispatch/landing"
  } | null;
  packageSha256: string;         // hash of the sorted (path, sha256) list; changes whenever any file changes
  files: Array<{
    path: string;
    kind: 'codebase_analysis' | 'dispatch_md' | 'task_doc' | 'prompts_archive' | 'completion_report';
    dispatchId: string | null;   // set for task_doc and completion_report
    version: number | null;      // the task doc version
    sha256: string;
    bytes: number;
  }>;
}
```

**Every other DTO is drafted** by this rule (D2), and Brennan checks each one against it:
1. **Every field traces** to a column in the map (with section 6's changes), in camelCase, or to a word in its route's row in section 2. A field with neither is left out and listed as open.
2. **`rowVersion` is on every DTO of a mutable table.** Writes send it back (Q4), and the map has `row_version` on every mutable table.
3. **Never a raw row:** no secrets, ciphertext, `wrapped_dek`, `kms_key_id`, token or code hashes (`token_sha256`, `device_code_sha256`, `user_code_sha256`), claim columns (`claim_no`, `claimed_by`, `claim_expires_at`) or `search_text`. A response carrying a token is never stored by idempotency.
4. **No rep fields** (CR-18).
5. **Values:** money is integer `*Micros`, times are ISO strings with a zone, and IDs are UUIDv7 strings.
6. **Computed fields** are included where a doc names them:
   - `displayState`: `state` when no `mission_pauses` row is open (Q8; B7). An open `operator` pause shows `paused`, and an open `proposal` or `budget` pause shows `blocked_on_you` (O2, INT 2026-11-06). The map allows several open pauses at once: one `operator`, one `budget` and one per proposal (`mission_pauses_open_operator_uq`, `mission_pauses_open_budget_uq`, `mission_pauses_open_proposal_uq`). No doc says which wins. I'd let `blocked_on_you` win, since it's the one that needs you; Brennan to check.
   - Route 21's gate strip and onboarding progress, and route 52's pending-decision union, are named but have no field list: CR-W2 and CR-W5 aren't accepted. They get typed placeholders, and Step 1's routes 52 to 54 decide them.
7. **Lists share one `Page<T>` wrapper,** from the ported pagination shape (Step 1, Ported).
8. **One file per route group** under `packages/contract/src/dto/`.

**`ClientDto`** (Step 1 item 12, test 2): `id`, `name`, `kind`, `contacts`, `status`, `archivedAt`, `rowVersion`, `createdAt`, `updatedAt`. That's the map's `clients` columns plus CR-13's `kind`, without `rep_id`.

## 5. Errors and events

### Errors (E4; D5)
- **Body:** `{ code, message, details?, requestId }`, and `requestId` matches `X-Request-Id`.

| Code | Status | When |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | bad input |
| `UNAUTHORIZED` | 401 | not signed in |
| `FORBIDDEN` | 403 | wrong role or token kind |
| `NOT_FOUND` | 404 | no such row |
| `CONFLICT` | 409 | any other 409 |
| `UNPROCESSABLE_CONTENT` | 422 | any other 422 |
| `TOO_MANY_REQUESTS` | 429 | rate limited; `details.retryAfterMs` |
| `STEP_UP_REQUIRED` | 403 | a credential action with no valid grant |
| `STALE_VERSION` | 409 | the body's version isn't current |
| `IDEMPOTENCY_KEY_REUSED` | 409 | the same key, a different body |
| `IDEMPOTENCY_IN_PROGRESS` | 409 | the same key while the first still runs |
| `TOKEN_REPLAYED` | 409 | a token route replayed; the token isn't returned again |
| `ALREADY_EXISTS` | 409 | a unique or partial-unique violation; `details` names the constraint |
| `DELETE_REFUSED` | 409 | a delete refused by a RESTRICT foreign key; `details` names the constraint |
| `INVALID_TRANSITION` | 422 | a move the state machine doesn't allow; `details` lists the allowed moves |
| `CONSTRAINT_VIOLATION` | 422 | a CHECK violation, or a missing parent; `details` names the constraint |
| `MISSION_NOT_FOUND` | 404 | CR-16: no such mission |
| `DISPATCH_PACKAGE_NOT_RENDERED` | 404 | CR-16: not rendered yet; `details: { missionState }` |
| `DISPATCH_PACKAGE_FILE_NOT_FOUND` | 404 | CR-16: `?path=` isn't in the package |
| `PLAN_VERSION_NOT_FOUND` | 404 | CR-16: no such `?planVersion=` |

- **Out until CR-17 is accepted:** `AGENT_NOT_PERMITTED` and `AGENT_SCOPE`.

### Events (E5; B5)
- **Shape:** the map's `events` row. Kinds keep their entity names (CR-15 item 8).
- **One exhaustive `Record<EventKind, Module>`** in `packages/contract`. A kind with no owner doesn't compile (done-when 7).
- **The kinds:**

| Kind | Owner | Source |
| --- | --- | --- |
| `dispatch.ready`, `dispatch.started`, `dispatch.parked` | `factory` | build plan section 3; Dispatch concept |
| `attempt.started`, `attempt.ended` | `runner` | the same |
| `mission.created` | `factory` | CR-15 item 8; it carries `kind` (CR-13) |
| `pass.approved` | `gate` | CR-15 item 8 |
| `receipt.issued` | `gate` | CR-W10 |
| `usage.recorded` | `metering` | CR-15 item 8 |
| `task_doc.rendered` | `factory` | CR-16 (accepted) |
| `message.stopped` | `onboarding` | CR-W14; INT, 2026-11-06 |
| `mission.closed` | `factory` | Design v0.6 Main, line 534; O1 (INT, 2026-11-06) |

- **Count:** 12 kinds (O1). `cli.ran` comes in with CR-17. Each later step adds its own kinds.

## 6. Tables (`packages/db`; Step 0 items 3 and 5)

**The base is the map's 91 tables,** rebuilt by name. That means every column, default, foreign key (all RESTRICT, except Better Auth's cascades), CHECK, unique and partial-unique index, index and trigger, with the six functions rewritten from the rules they enforce: `uuid_generate_v7`, `touch_updated_at`, `freeze_once_set`, `refuse_update`, `freeze_plan_detail`, `freeze_plan` (CR-19 items 1 and 3). `outbox` isn't among them; `jobs` replaces it.

**Applied on top of the map** (copied byte for byte from Step 0 and Step 1 plan, Step 0):

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

**Also on top:**
- **CR-7 and CR-8, B3 and CR-16:** `integration_commits.kind` gains `ui_contract`, `api_contract` and `dispatch_docs`, and `integration_commits_by_kind_ck` covers them. All three are module-free docs commits, so they take `operator`'s shape (all three parents null) unless Brennan finds a source that says otherwise.
- **B9, a new table:** `design_systems`, key `(slug, version)`, with `layer` (`global`, `client`), `client_id? → clients`, `path` (under `design/<slug>`), `factory_commit → factory_versions`, `status` (`active`, `retired`), `created_at`, `row_version` and `updated_at`, like `templates`. Its CHECK is `(layer = 'client') = (client_id IS NOT NULL)`.
- **B9, the pin:** `missions.design_system_slug?` and `missions.design_system_version?` (INT), with a composite FK to `design_systems (slug, version)`, set together or not at all. A mission pins one at finalize.
- **Item 5:** DATABASE.md is brought up to this schema, so the drift check (done-when 4) compares like with like.

**One owner per table** (Step 0 item 3; build plan section 4 and CR-15 item 2; `device_logins` → `cli` from section 8). The new tables' owners are **proposed** here (CR-19 asks for them):

| Module | Tables |
| --- | --- |
| `platform` | `users`, `auth_sessions`, `auth_accounts`, `auth_verifications`, `auth_passkeys`, `cli_sessions`, `step_up_grants`, `idempotency_keys`, `webhook_deliveries`, `jobs` |
| `cli` | `device_logins` |
| `events` | `events`, `consumer_cursors`, `agent_traces` |
| `audit` | `activity_log`, `overrides`, `redactions` (proposed) |
| `onboarding` | `clients`, `onboarding_sessions`, `messages`, `uploads`, `facts`, `questions`, `topic_coverage`, `checkpoints`, `checkpoint_facts`, `rubric_results`, `context_refs`, `usage_log`, `readiness_waivers` (proposed) |
| `packages` | `packages` |
| `plan` | `plans`, `codebase_analysis`, `plan_modules`, `plan_module_deps`, `requirements`, `scenarios`, `scenario_modules`, `checks`, `module_checks`, `quality_targets`, `mission_scenarios` (proposed) |
| `factory` | `missions`, `module_runs`, `dispatches`, `task_docs`, `mission_docs`, `findings`, `proposals`, `notes`, `mission_pauses`, `mission_refreshes`, `proposal_findings` (the last three proposed) |
| `integrator` | `integration_commits`, `test_locks`, `locked_scripts`, `dependency_requests`, `quarantines` |
| `runner` | `attempts`, `skill_loads`, `completion_reports`, `progress_notes` (proposed) |
| `compute` | `rooms`, `credentials` |
| `metering` | `budget_reservations`, `price_table`, `human_time`, `payments` |
| `gate` | `gate_evaluations`, `gate_runs`, `receipts`, `pass_approvals`, `check_results`, `release_approvals` (the last two proposed) |
| `delivery` | `deliveries`, `repo_connections`, `secrets` |
| `rules` | `rules`, `rules_versions`, `rules_version_rules` |
| `knowledge` | `factory_versions`, `skills`, `kb_entries`, `kb_releases`, `kb_release_entries`, `templates`, `closeout_items`, `design_systems` (proposed) |
| `evals` | `agent_configs`, `eval_tasks`, `eval_runs`, `eval_results` (D6) |

The exceptions (DATABASE.md, Ownership): `missions.branch_head` is written by `integrator`; `reserved_micros` and `spent_micros` by `metering`.

## 7. Open

Nothing. B1 to B9 (2026-11-05 and 2026-11-06), O1 and O2 (2026-11-06) are answered in `decisions.md`.

One choice the docs leave open is mine, and Brennan checks it: which `displayState` wins when more than one pause is open (section 4, item 6).

## 8. Not in this step

- **CR-17:** the policy tags, agent identities, `AGENT_NOT_PERMITTED`, `AGENT_SCOPE` and `cli.ran`.
- **The web's CR-W requests:** none is accepted (CR-W11's confirm route and `dispatch_package_commit` included). CR-W2 and CR-W5 placeholders: section 4, item 6.
- **CR-16's open question:** client-repo stripping.
- **Server code:** Step 1.

## Appendix A: the map's value-list CHECKs (99)

Extracted by a script from `AVEL Database Map.html` (its `ERD.tables[].checks`): each CHECK that is "column in a fixed list", or "NULL or in a fixed list" (marked `?`). Section 3's changes are applied on top. This is the map, unedited.

| Table.column | Values | CHECK |
| --- | --- | --- |
| `activity_log.actor_kind` | `user`, `agent`, `system` | `activity_log_actor_kind_ck` |
| `agent_traces.kind` | `message`, `tool_call`, `tool_result`, `check`, `delta`, `search` | `agent_traces_kind_ck` |
| `attempts.kind` | `initial`, `retry_1`, `retry_2`, `retry_3`, `fix`, `rework`, `resume`, `infra_restart` | `attempts_kind_ck` |
| `attempts.compute` | `docker`, `boat`, `miosa` | `attempts_compute_ck` |
| `attempts.outcome?` | `passed`, `failed`, `capped`, `budget_parked`, `killed`, `crashed`, `infra_lost` | `attempts_outcome_ck` |
| `budget_reservations.kind` | `expected`, `request` | `budget_reservations_kind_ck` |
| `budget_reservations.state` | `held`, `settled`, `released` | `budget_reservations_state_ck` |
| `check_results.result` | `passed`, `failed`, `skipped`, `quarantined` | `check_results_result_ck` |
| `checkpoints.checkpoint` | `0.1`, `0.2`, `0.3`, `0.4`, `0.1+0.2` | `checkpoints_checkpoint_ck` |
| `checkpoints.state` | `draft`, `approved`, `stale` | `checkpoints_state_ck` |
| `checks.kind` | `file_exists`, `test`, `typecheck`, `command`, `e2e` | `checks_kind_ck` |
| `clients.status` | `active`, `archived` | `clients_status_ck` |
| `closeout_items.kind` | `finding`, `lesson_candidate` | `closeout_items_kind_ck` |
| `closeout_items.state` | `open`, `written`, `dismissed` | `closeout_items_state_ck` |
| `codebase_analysis.standing_context` | `found`, `generated` | `codebase_analysis_standing_context_ck` |
| `completion_reports.status` | `done`, `partial`, `blocked` | `completion_reports_status_ck` |
| `context_refs.kind` | `doc`, `design`, `repo_path`, `fixture`, `secret_name` | `context_refs_kind_ck` |
| `credentials.kind` | `dispatch`, `git`, `proxy`, `service` | `credentials_kind_ck` |
| `deliveries.kind` | `zip`, `pr`, `push` | `deliveries_kind_ck` |
| `deliveries.state` | `pending`, `recorded`, `failed` | `deliveries_state_ck` |
| `dependency_requests.state` | `open`, `approved`, `rejected`, `expired` | `dependency_requests_state_ck` |
| `device_logins.state` | `pending`, `approved`, `denied`, `expired`, `consumed` | `device_logins_state_ck` |
| `dispatches.role` | `build`, `test-unit`, `test-e2e`, `review-spec`, `review-security`, `red-team` | `dispatches_role_ck` |
| `dispatches.state` | `pending`, `ready`, `starting`, `running`, `reporting`, `waiting_dependency`, `blocked_on_you`, `succeeded`, `failed`, `parked`, `cancelled` | `dispatches_state_ck` |
| `dispatches.parked_from?` | `pending`, `ready`, `starting`, `running`, `reporting`, `waiting_dependency`, `blocked_on_you`, `succeeded`, `failed`, `parked`, `cancelled` | `dispatches_parked_from_ck` |
| `dispatches.origin` | `factory`, `override` | `dispatches_origin_ck` |
| `eval_runs.stage` | `targeted`, `full` | `eval_runs_stage_ck` |
| `eval_runs.aim` | `improve`, `non_inferior` | `eval_runs_aim_ck` |
| `eval_runs.set` | `dispatch`, `role`, `mission` | `eval_runs_set_ck` |
| `eval_runs.state` | `proposed`, `running`, `done`, `failed`, `cancelled` | `eval_runs_state_ck` |
| `eval_tasks.set` | `dispatch`, `role`, `mission` | `eval_tasks_set_ck` |
| `eval_tasks.role?` | `build`, `test-unit`, `test-e2e`, `review-spec`, `review-security`, `red-team` | `eval_tasks_role_ck` |
| `eval_tasks.source` | `synthetic`, `internal`, `replay` | `eval_tasks_source_ck` |
| `facts.kind` | `problem`, `outcome`, `scope`, `deadline`, `core_flows`, `data_integrations`, `quality_targets`, `edge_cases`, `existing_assets`, `acceptance`, `nogo`, `risk`, `module`, `requirement`, `scenario`, `work_kind`, `package`, `territory`, `constraint`, `context_ref`, `trace` | `facts_kind_ck` |
| `facts.source` | `said`, `relayed`, `uploaded`, `repo`, `inferred` | `facts_source_ck` |
| `facts.status` | `confirmed`, `proposed`, `rejected` | `facts_status_ck` |
| `findings.source` | `checkpoint`, `review`, `gate` | `findings_source_ck` |
| `findings.kind` | `requirement`, `security`, `scope`, `integrity`, `advisory` | `findings_kind_ck` |
| `findings.route` | `rework`, `proposal`, `receipt` | `findings_route_ck` |
| `findings.state` | `open`, `triage`, `confirmed`, `disputed`, `dismissed`, `fixed`, `accepted` | `findings_state_ck` |
| `findings.decided_by_kind?` | `user`, `agent`, `check` | `findings_decided_by_kind_ck` |
| `gate_evaluations.result` | `passed`, `failed`, `error` | `gate_evaluations_result_ck` |
| `gate_runs.state` | `running`, `decided`, `failed` | `gate_runs_state_ck` |
| `gate_runs.trigger` | `auto`, `override`, `refresh` | `gate_runs_trigger_ck` |
| `human_time.activity` | `onboarding`, `approval`, `review`, `fix`, `call`, `override` | `human_time_activity_ck` |
| `human_time.source` | `auto`, `manual` | `human_time_source_ck` |
| `human_time.state` | `running`, `draft`, `confirmed`, `discarded` | `human_time_state_ck` |
| `idempotency_keys.status` | `in_progress`, `completed` | `idempotency_keys_status_ck` |
| `integration_commits.kind` | `tests`, `module`, `dependency`, `operator` | `integration_commits_kind_ck` |
| `integration_commits.state` | `queued`, `testing`, `landed`, `rejected` | `integration_commits_state_ck` |
| `jobs.state` | `queued`, `leased`, `done`, `failed`, `dead` | `jobs_state_ck` |
| `kb_entries.layer` | `global`, `stack`, `client` | `kb_entries_layer_ck` |
| `kb_entries.status` | `proposed`, `approved`, `retired` | `kb_entries_status_ck` |
| `messages.role` | `opener`, `canon`, `operator` | `messages_role_ck` |
| `mission_pauses.kind` | `operator`, `proposal`, `budget` | `mission_pauses_kind_ck` |
| `mission_pauses.interrupted_state` | `draft`, `onboarding`, `approved`, `rendered`, `running`, `reviewing`, `deciding`, `awaiting_release`, `refreshing`, `delivering`, `delivered`, `closed`, `cancelled` | `mission_pauses_interrupted_state_ck` |
| `mission_refreshes.state` | `running`, `done`, `conflict`, `failed` | `mission_refreshes_state_ck` |
| `missions.state` | `draft`, `onboarding`, `approved`, `rendered`, `running`, `reviewing`, `deciding`, `awaiting_release`, `refreshing`, `delivering`, `delivered`, `closed`, `cancelled` | `missions_state_ck` |
| `module_runs.state` | `blocked`, `tests_writing`, `tests_locked`, `building`, `in_review`, `fixing`, `integrating`, `landed`, `retrying`, `reworking`, `parked` | `module_runs_state_ck` |
| `module_runs.parked_from?` | `blocked`, `tests_writing`, `tests_locked`, `building`, `in_review`, `fixing`, `integrating`, `landed`, `retrying`, `reworking`, `parked` | `module_runs_parked_from_ck` |
| `notes.source` | `web`, `cli` | `notes_source_ck` |
| `notes.state` | `active`, `archived` | `notes_state_ck` |
| `onboarding_sessions.stage` | `opener`, `discovery`, `breakdown`, `mission_roster`, `context`, `finalize`, `finalized` | `onboarding_sessions_stage_ck` |
| `onboarding_sessions.status` | `active`, `paused`, `context_blocked`, `finalized`, `abandoned` | `onboarding_sessions_status_ck` |
| `onboarding_sessions.package_provisional?` | `diagnostic`, `landing_page`, `stabilize`, `feature`, `upkeep`, `custom` | `onboarding_sessions_package_provisional_ck` |
| `onboarding_sessions.package_final?` | `diagnostic`, `landing_page`, `stabilize`, `feature`, `upkeep`, `custom` | `onboarding_sessions_package_final_ck` |
| `overrides.kind` | `gate`, `dispatch` | `overrides_kind_ck` |
| `overrides.action?` | `start`, `retry`, `park`, `cancel` | `overrides_action_ck` |
| `packages.status` | `active`, `retired` | `packages_status_ck` |
| `plan_modules.est_source` | `canon`, `calibrated` | `plan_modules_est_source_ck` |
| `plan_modules.work_kind` | `data`, `infra`, `design-system`, `frontend`, `api`, `services`, `ai`, `maintenance`, `docs`, `audit` | `plan_modules_work_kind_ck` |
| `plan_modules.asvs_level?` | `L1`, `L2`, `L3` | `plan_modules_asvs_level_ck` |
| `plan_modules.data_classification?` | `public`, `internal`, `personal`, `payment` | `plan_modules_data_classification_ck` |
| `plans.source` | `onboarding`, `proposal` | `plans_source_ck` |
| `plans.state` | `draft`, `approved`, `superseded` | `plans_state_ck` |
| `proposals.kind` | `parked`, `converge`, `contract_change`, `dependency`, `quarantine`, `budget_increase`, `reentry`, `dispute`, `gate5`, `suppression`, `test_change`, `review_limit`, `repin` | `proposals_kind_ck` |
| `proposals.state` | `open`, `resolved`, `expired` | `proposals_state_ck` |
| `questions.stage` | `opener`, `discovery`, `breakdown`, `mission_roster`, `context`, `finalize`, `finalized` | `questions_stage_ck` |
| `receipts.verdict` | `verified`, `pass`, `fail` | `receipts_verdict_ck` |
| `repo_connections.state` | `active`, `revoked` | `repo_connections_state_ck` |
| `requirements.ears_pattern` | `ubiquitous`, `event`, `state`, `optional`, `unwanted`, `complex` | `requirements_ears_pattern_ck` |
| `rooms.kind` | `dispatch`, `check`, `integration`, `image_build` | `rooms_kind_ck` |
| `rooms.state` | `creating`, `ready`, `busy`, `destroyed` | `rooms_state_ck` |
| `rubric_results.result` | `pass`, `fail`, `finding`, `advisory` | `rubric_results_result_ck` |
| `rules.scope` | `global`, `stack`, `client` | `rules_scope_ck` |
| `rules.status` | `active`, `retired` | `rules_status_ck` |
| `scenarios.level` | `unit`, `integration`, `e2e` | `scenarios_level_ck` |
| `scenarios.kind` | `happy`, `failure`, `pinning`, `smoke` | `scenarios_kind_ck` |
| `secrets.state` | `active`, `destroyed` | `secrets_state_ck` |
| `skills.author` | `you`, `import` | `skills_author_ck` |
| `skills.source` | `upload`, `written`, `import` | `skills_source_ck` |
| `skills.status` | `active`, `retired` | `skills_status_ck` |
| `templates.status` | `active`, `retired` | `templates_status_ck` |
| `test_locks.kind` | `fail_first`, `pinning` | `test_locks_kind_ck` |
| `topic_coverage.topic` | `problem`, `outcome`, `scope`, `deadline`, `core_flows`, `data_integrations`, `quality_targets`, `edge_cases`, `existing_assets`, `acceptance` | `topic_coverage_topic_ck` |
| `topic_coverage.state` | `clear`, `partial`, `missing` | `topic_coverage_state_ck` |
| `uploads.parse_status` | `pending`, `parsed`, `failed`, `unsupported` | `uploads_parse_status_ck` |
| `uploads.state` | `active`, `removed` | `uploads_state_ck` |
| `usage_log.call_kind` | `canon`, `extractor`, `breakdown`, `brennan`, `checkpoint_doc` | `usage_log_call_kind_ck` |
