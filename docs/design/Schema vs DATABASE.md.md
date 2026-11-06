# Schema vs DATABASE.md

Nov 4, 2026 · checked by Claude for @javaris

The `DATABASE.md` in this folder is the project's copy, written Nov 1 before build step 1. The real schema has moved past it. This note lists every difference found by comparing it with the ERD generated from the repo (`AVEL Database Map.html`, generated 2026-11-01 19:21 UTC from migrations `0000_functions.sql`, `0001_schema.sql` and `0002_hand_written.sql`).

**Which one wins:** the Drizzle schema in `packages/db`. The design says so from build step 1, and the ERD's own drift check reports no drift between the schema and the repo's `docs/DATABASE.md`. So the repo's `docs/DATABASE.md` is current and the copy here is an older snapshot. Read this folder's `DATABASE.md` for the reasoning (spine, integrity rules, delete policy), and the schema for names and columns.

**To regenerate the map:** `pnpm --filter @avel/db erd`. The HTML map isn't in this zip because the repo generates it.

## Size

| | Project DATABASE.md | Schema (migrations 0000–0002) |
| --- | --- | --- |
| Tables | 77 specified, plus Better Auth's 4 named but not specified | 91 (77 − `outbox` + the 11 below + the 4 `auth_*` tables) |
| Foreign keys | — | 204 |
| CHECKs | — | 199 |
| Unique and partial-unique indexes | — | 81 |
| Indexes | — | 183 |

## Tables in the schema that DATABASE.md lacks (11)

| Table | Domain | What it's for |
| --- | --- | --- |
| `completion_reports` | Execution | The agent's report when its attempt ends, keyed by attempt. Immutable. |
| `progress_notes` | Execution | `POST /api/agent/progress-notes`, append-only, per attempt |
| `mission_scenarios` | Plan | A scenario's identity across plan versions (like `module_runs.ref` for modules). Locks, quarantines and check results point here, so a contract change can't lose them. |
| `check_results` | Verification and delivery | One row per scenario or check, per run, per commit. `decide()` reads these. Immutable. |
| `release_approvals` | Verification and delivery | Approval #2, tied to the receipt's hash and verdict. Makes "a pass needs a pass approval before release" a database rule. Immutable. |
| `mission_refreshes` | Verification and delivery | History of `pinned_commit` moves; a conflict opens a proposal |
| `mission_pauses` | Judgment | Holds on a mission (operator, proposal, budget). Independent rows, **not a stack**. Replaces `missions.paused_from`. |
| `proposal_findings` | Judgment | Which findings a proposal decides |
| `redactions` | Judgment | The one allowed overwrite: text scrubbed from a row, with who, why and a single-use step-up grant |
| `readiness_waivers` | Canon | Your decision to go ahead on a partial readiness result at 0.4 |
| `device_logins` | Plumbing | The CLI device-code login: started, approved with step-up, consumed by the poll |

## Tables in DATABASE.md that the schema dropped

| Table | What replaced it |
| --- | --- |
| `outbox` | The `jobs` table is the outbox: finalize's render request is the job `render_dispatch` with key `render:<plan_id>`. |

## Column and rule changes, by table

Only differences are listed. "Pending" means an accepted change request (CR-1 to CR-13) that Step 0 still has to apply.

| Table | Schema has | DATABASE.md has |
| --- | --- | --- |
| `missions` | `plan_state` with a deferred composite FK so the current plan is always the one approved plan; `onboarding_started_at`, `approved_at`, `rendered_at`, `delivered_at`, `closed_at`, `cancelled_at`, each tied to the state by a CHECK; package and `factory_commit` optional until onboarding starts. States: draft, onboarding, approved, rendered, running, reviewing, deciding, awaiting_release, refreshing, delivering, delivered, closed, cancelled. | `paused_from` (a stack) and `clock_paused_ms`; no lifecycle timestamps |
| `missions`, `clients` | — (pending CR-13: `missions.kind`, `missions.client_kind`, `clients.kind`) | — |
| `clients` | `archived_at` | — |
| `repo_connections` | One *active* connection per client (a revoked one doesn't block reconnecting); secrets linked by `(client_id, id)` so both tokens belong to the same client | One connection per client, ever |
| `secrets` | `client_id` (repo tokens belong to the client); at most one owner | `mission_id` only |
| `plans` | `source` (`onboarding` or `proposal`), `proposal_id`, `approved_by`; state `draft` added; one approved and at most one draft per mission; `session_id` optional | `session_id` required; states approved, superseded |
| `module_runs` | `ref` (stable across plan versions), `parked_from`, `started_at`, `tests_base_commit` (test writers start here), `build_base_commit` (the build and Retries 2 and 3 start here), `landed_at`, `current_commit` (moves with each rework); a freeze trigger | `start_commit` |
| `dispatches` | `pass`, `parked_from`, `task_doc_version` (deferred FK); one dispatch per (module, role, pass). Role CHECK still has 6 roles (pending CR-7 and CR-8). | `report_status` |
| `attempts` | `mission_id`, `reserved_micros`; `reserved_micros + cost_micros <= cap_micros`; one running attempt per dispatch; `started_at` and `kind` frozen | — |
| `integration_commits` | `queued_at`, `started_at`, `finished_at`; one in flight per module. Kinds still 4 (pending CR-7, CR-8; CR-16 proposes `dispatch_docs`). | `results` required |
| `test_locks` | `mission_id`, `kind` (`fail_first` or `pinning`), `scenario_key` → `mission_scenarios`, `integration_commit_id` | `scenario_id` → `scenarios`; `failed_first_at` required |
| `quarantines` | `scenario_key`, `ended_at`; one open quarantine per test | `scenario_id` |
| `findings` | kind `integrity` (can never be accepted); `decided_by_kind`, `decided_by_user_id`, `decided_by_attempt_id`, `decided_at`; a finding that cites nothing must be in triage | four kinds |
| `proposals` | `subject_key`: one open proposal per module, kind and subject | one open per module and kind |
| `overrides` | `action` (start, retry, park, cancel); `commit_sha` only on gate overrides | — |
| `gate_evaluations` | `gate_run_id`; result `passed`, `failed` or `error`; exactly the parent its gate needs; one result per commit, attempt or run | — |
| `gate_runs` | `commit_sha`, `started_at`, `decided_at`; one running per mission | — |
| `receipts` | `mission_id`; immutable trigger | — |
| `pass_approvals` | `receipt_verdict` must be `pass`; immutable | — |
| `deliveries` | `release_approval_id` (required), `state` (pending, recorded, failed), `error`, `recorded_at`; one pending per mission | `pass_approval_id`, `released_by`, `released_at` (moved to `release_approvals`) |
| `budget_reservations` | `kind` (`expected` before an attempt exists, `request` per proxy call), `dispatch_id`, `reserved_micros`, `settled_micros`, `settled_at`; a retried proxy request can't reserve twice | `scope`, `amount_micros` |
| `human_time` | `state` (running, draft, confirmed, discarded); `ended_at` and `minutes` set only once confirmed | — |
| `payments` | `recorded_by`; immutable | — |
| `facts`, `messages`, `notes` | `redacted_at` | — |
| `facts` | `mission_id`; a CHECK per source (`said`/`relayed` need a message, `uploaded` an upload, `repo` a commit and path) | — |
| `checkpoints` | `approved_by`; checkpoint `0.1+0.2` | — |
| `uploads` | `blob_key` optional once removed | `blob_key` required |
| `agent_traces` | key `(trace_seq, at)`, partitioned by week, purged by dropping partitions | `id` |
| `rooms` | `mission_id` required | — |
| `idempotency_keys` | `status` (`in_progress`, `completed`), `http_status` | — |
| `skills` | `source` (upload, written, import), `source_url` | — |
| `kb_entries` | `search_text` (tsvector, GIN index) for the agents' kb-search | — |
| `usage_log` | — (pending CR-5: `vendor`) | — |
| `jobs`, `consumer_cursors` | still `lease_epoch`, `lease_until`, `'leased'` (pending CR-6: `claim_no`, `claim_expires_at`, `'claimed'`); `jobs.finished_at` | lease names |
| Domain label | still "Money and time" (pending CR-2: "Cost and time") | "Money and time" |

## Patterns the schema adds everywhere

- **Composite keys stop cross-mission links.** Most child tables carry `mission_id` and point at `(mission_id, id)` on the parent, so a row can't link to another mission's records.
- **`row_version` and `updated_at`** on every mutable table, with a `touch_updated_at` trigger. That's what the API's stale-version 409 checks.
- **Immutable tables refuse updates** with a `refuse_update` trigger: `receipts`, `pass_approvals`, `release_approvals`, `completion_reports`, `check_results`, `task_docs`, `payments`.
- **Frozen plan detail:** `plan_modules`, `plan_module_deps`, `requirements`, `scenarios`, `scenario_modules`, `checks`, `module_checks`, `quality_targets` and `codebase_analysis` refuse inserts, updates and deletes once their plan is approved (`freeze_plan_detail`); `plans` itself has `freeze_plan`.
- **Freeze-once columns:** `freeze_once_set(...)` on `attempts` (`started_at`, `kind`), `module_runs` (landing and base commits) and `mission_pauses` (`started_at`, `kind`, `interrupted_state`).

## What Step 0 still has to add (accepted, not yet in the schema)

| CR | Change |
| --- | --- |
| CR-2 | Domain label "Money and time" → "Cost and time" |
| CR-5 | `usage_log.vendor` |
| CR-6 | `jobs.lease_epoch` → `claim_no`, `lease_until` → `claim_expires_at`, `'leased'` → `'claimed'`; `consumer_cursors.lease_epoch` → `claim_no`; index and CHECK renames |
| CR-7, CR-8 | Work kinds `frontend-components`, `frontend-data`; dispatch roles `ui-contract`, `review-frontend`, `review-a11y-perf`, `api-contract`, `review-backend` (on `dispatches.role` and `eval_tasks.role`); integration-commit kinds for UI and API contracts; the design library index |
| CR-9 | Scenario level `load` |
| CR-13 | `clients.kind`, `missions.kind`, `missions.client_kind`, the composite FK, the CHECK, the freeze trigger, `templates.source_mission_id` |
| CR-16 (proposed) | Integration-commit kind `dispatch_docs` |
