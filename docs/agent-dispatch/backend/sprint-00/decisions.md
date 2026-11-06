# Backend sprint-00: decisions

Lead: Axis. Step 0: `packages/contract` and `packages/db`, written fresh in avel-factory with no migration (Step 0 and Step 1 plan, Step 0, Nov 5 change; commit 56f1197). The slice is in `contract.md`. Its blocking items (B1 to B9) need the operator; the choices below are mine, each with the doc section that leaves it open. Brennan checks both.

## 2026-11-05: scope and inputs

- **Start (INT):** build order approved; sprint-00 is Step 0. Hold until the route tabs landed. INT, 2026-11-05: the route list is in, `docs/design/API routes.md` (commit 46e96a0, all 99 routes). The DTOs aren't in it ("drafted from the schema"). Start the slice and `plan.toml`.
- **Read:** all six read-first docs, plus API routes.md, Canon onboarding v0.5 (Implementation), Frontend Map v0.6 (Contract change requests), Roster setup and sessions, and the dispatch kit.
- **Missing docs:** Step 0 names these sources, and none is in the repo: the design doc Main tab, `claude/Change requests.md`, the Port inventory, `claude/Roster.md`, the After Canon tab, the project instructions, CR-10, and "CR-W1 W2 W5 W9 W10: What the first screens need". I use only what `docs/design/` quotes from them. Several blocking items come from this gap (B1, B4, B5).

## Decisions

- **D1. Library paths are `/api/library/skills`, `/api/library/kb-entries`, `/api/library/rules` and `/api/library/templates`.**
  - **Left open by:** API routes.md, Library: "check the exact per-kind paths ... against the contract". This step writes the contract, so it can't check against it.
  - **Why:** rows 74 to 89 write those paths, and Q5 (per kind) is decided. The agent's search stays at row 99, `GET /api/agent/kb-entries`.
- **D2. DTOs are drafted from DATABASE.md, using the rule in `contract.md` section 4.** **Superseded on Nov 6** (finding 05): DTOs are drafted from the map's columns, with section 6's changes, by the rule in `contract.md` section 4. DATABASE.md no longer settles columns (D3; CR-19). The original follows.
  - **Left open by:** API routes.md, "Not here"; INT, 2026-11-05.
  - **How it's checked:** every field traces to a column or to its route's row. Anything else goes on an open list instead of into the DTO. The reference's 85 and 56 counts aren't a target, because nothing can be checked against them.
- **D3. Source order: replaced on Nov 5 by CR-19** (Backend modules and build plan, section 10, "Precedence while Step 0 runs"; commit 300127b). When sources disagree, the first in this list wins:
  1. **`AVEL Database Map.html`,** for what exists. It isn't in `docs/design/` yet, so until it lands, `Schema vs DATABASE.md.md` stands in (INT, 2026-11-05). **Superseded on Nov 6** (finding 09): the map landed in e1ed7ae and replaces the stand-in (the Nov 6 entry below), so the map settles what exists;
  2. **accepted change requests,** applied on top of it: CR-1 to CR-13 (`Change requests CR-1 to 13.md`), CR-18 and CR-19;
  3. **`API routes.md`;**
  4. **DATABASE.md,** for the reasoning only (the spine, the integrity rules, the delete policy). It no longer settles names or columns;
  5. **the Canon enums;**
  6. **the reference's Conventions.**

  **Effect:** DATABASE.md no longer wins on names. `checkpoints.stale_module_labels` against Canon's `stale_module_refs`, and the `onboarding_sessions.status` list, are settled by the map once it lands. The original D3, "accepted CRs, then DATABASE.md, API routes.md, the Canon enums, the reference's Conventions", is withdrawn.
- **D4. The Library group counts 18:** 16 per-kind routes, plus rows 90 and 91. The total of 99 checks out:

  | Group | Routes | Running total |
  | --- | --- | --- |
  | Auth | 5 | 5 |
  | Health | 2 | 7 |
  | Clients and repos | 10 | 17 |
  | Packages | 1 | 18 |
  | Missions | 16 | 34 |
  | Gate 0 | 11 | 45 |
  | Plan and roster | 3 | 48 |
  | Dispatches | 3 | 51 |
  | Decisions | 3 | 54 |
  | Gates and findings | 6 | 60 |
  | Receipts and delivery | 2 | 62 |
  | Events and traces | 2 | 64 |
  | Your work | 4 | 68 |
  | Metering | 2 | 70 |
  | Factory repo | 3 | 73 |
  | Library | 18 | 91 |
  | Evals, later | 1 | 92 |
  | Audit | 1 | 93 |
  | Agent | 6 | 99 |

  A contract test should snapshot the method and path pairs (Frontend Map v0.6, Route count), and that's the count that counts from now on.
- **D5. The error map: updated on Nov 5 and Nov 6 with INT's answers to B6.**
  - **The generic codes** (Frontend Map v0.6, `contract/base.ts`): `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `UNPROCESSABLE_CONTENT` (422), `TOO_MANY_REQUESTS` (429, with `retryAfterMs` in `details`, CR-W8). The statuses follow Design v0.6 Main, "One error contract".
  - **The specific codes** (INT, 2026-11-05; the last two, 2026-11-06):

    | Code | Status | Where it's raised (Step 1 items 3 and 4) |
    | --- | --- | --- |
    | `STEP_UP_REQUIRED` | 403 | a credential action with no valid grant (CR-W6) |
    | `STALE_VERSION` | 409 | the body's `rowVersion`, `version`, `receiptHash` or `headSha` isn't current |
    | `IDEMPOTENCY_KEY_REUSED` | 409 | the same key with a different body |
    | `IDEMPOTENCY_IN_PROGRESS` | 409 | the same key while the first is still running |
    | `TOKEN_REPLAYED` | 409 | a token-minting route (route 3) replayed; the token is never returned again |
    | `INVALID_TRANSITION` | 422 | a move the state machine doesn't allow; `details` carries the allowed moves |
    | `CONSTRAINT_VIOLATION` | 422 | a CHECK violation, or a foreign key whose parent is missing |
    | `ALREADY_EXISTS` | 409 | a unique or partial-unique violation, for example a second internal client (Step 1 test 6) |
    | `DELETE_REFUSED` | 409 | a delete refused by a RESTRICT foreign key |

  - **The last two codes** cover the 409s in Step 1 item 3 that the first list didn't name. INT, 2026-11-06: they get their own codes, not `CONFLICT`. The names are mine:
    - `ALREADY_EXISTS`: Frontend Map v0.6 defines `CONFLICT` as "stale version, not 'already exists'", so the web already treats the two apart.
    - `DELETE_REFUSED`: DATABASE.md calls it a "delete refusal" (Integrity rules, Foreign-key policy).
    - **`details`:** both carry the constraint name, the same as `CONSTRAINT_VIOLATION`.
    - **`CONFLICT`** stays as the generic 409 for any case none of these codes covers.
  - **Out until CR-17 is accepted:** `AGENT_NOT_PERMITTED` and `AGENT_SCOPE` (403). D10 stands.
  - **CR-16's four 404 codes are in** (superseded on Nov 6, finding 05). This line used to read "Out until CR-16 is accepted"; CR-16 was accepted on Nov 6 (the Nov 6 entry below).
  - **`STALE_VERSION` carries `details: { field, currentVersion }`** (D21).
  - **The superseded D5** listed only the generic codes plus `STEP_UP_REQUIRED`.
- **D6. The evals tables are in the first schema.** **Now by CR-19** (Nov 6, finding 05): the four evals tables are in the map ("Designed, not built yet"), and CR-19 item 1 rebuilds every table in it. The "leave all four out" alternative below is withdrawn, since it would break CR-19. The original reasoning follows.
  - **Left open by:** DATABASE.md, "Designed, not built yet": "built only when evals are turned on". The Step 0 table, though, changes the `eval_tasks.role` CHECK (CR-7, CR-8), and Step 0 item 3 says "every table in DATABASE.md".
  - **Why:** I read "built" as the code. Their shapes "are kept here so the IDs they need already exist".
  - **The alternative:** leave all four out and drop that CHECK change until evals arrive. That one's yours if you prefer it.
- **D7. `Package` (the Canon enum) is a contract value list, but no CHECK on `packages.key`.**
  - **Left open by:** DATABASE.md `packages` is "an index of the packages in factory.yaml; changed only by a factory PR" and gives `key` no list. The Canon enum types `package_provisional` and `package_final`.
  - **Why:** a CHECK on `packages.key` would mean a migration for every new package, against "changed only by a factory PR".
- **D8. `dispatches.parked_from` is optional and holds one `DispatchState` (never `parked`).** It's set iff `state = 'parked'`.
  - **Left open by:** CR-15 item 6 names the column and gives no type.
  - **Why:** it follows the "required only in some states" pattern (DATABASE.md, Integrity rules).
- **D9. The table-owner map lives in `packages/db`** and is exported next to the schema. The value lists live in `packages/contract`.
  - **Left open by:** CR-15 item 1 asks for an owner on every table but doesn't say where in code.
  - **Why:** owners are a property of tables, and the contract package is the public API.
- **D10. CR-17 isn't in Step 0** (still "proposed"), and neither are its two error codes or `cli.ran`. **CR-16 is in, since it was accepted on Nov 6** (see the Nov 6 entry below). The original D10 left both out.
- **D12. Package names are `@avel/contract`, `@avel/db` and `@avel/docs`.**
  - **Left open by:** no doc names them.
  - **Effect:** the plan's verify commands use `pnpm --filter`.
- **D13. The generated docs go in two places:** the generators and the drift check in `tools/docs/`, and their output in `docs/generated/`. That keeps the generated ERD and `openapi.json` apart from the design docs.
  - **Left open by:** Step 0 item 4 names the outputs, not where they go.
- **D14. The contract's tests don't gate the contract.** In m1, Rigg's tests (done-when 5, 6 and 7) run alongside the `api-contract` dispatch, and Brennan reviews against them. That's because the renderer's lock rule gates builds only. Soap's schema build waits on the contract (it imports the value lists) and on its own locked tests.
- **D15. No Zane, Leah or Breach dispatches in Step 0.** No trigger applies, since nothing in Step 0 runs as a server. The schema rules for `credentials`, `secrets` and `step_up_grants` are covered by Brennan, then Zane in Step 1, where the code that uses them lands.
- **D11. Not mine to fix:** API and data reference, line 13 points to `docs/DATABASE.md`; the file is `docs/design/DATABASE.md`.

## 2026-11-05: INT's answers to B1 to B9, and CR-19

**Inputs:**
- INT's message of 2026-11-05;
- the new docs in `docs/design/` (commit 62bcf2c): `Change requests CR-1 to 13.md` (with CR-10), `Schema vs DATABASE.md.md`, `Design v0.6 Main.md`, `Port inventory.md`, `Dispatch concept.md`, `Roster.md`, `Factory records.md` and `CR-14 CLI conventions.md`;
- CR-19, accepted (commit 300127b; build plan section 10; the Step 0 plan updated).

**CR-19 changes Step 0's base:**
- **What it says:** the old schema is lost. Step 0 rebuilds `packages/db` from `AVEL Database Map.html` (91 tables), then applies CR-1 to CR-13 and CR-18 on top. The six functions are rewritten from their names. DATABASE.md is brought up to the schema in Step 0.
- **The map isn't in the repo yet.** I checked `docs/design/` and it isn't there. Until it lands, `Schema vs DATABASE.md.md` stands in (INT).
- **The stand-in is incomplete.** It lists the map's 11 extra tables (`completion_reports`, `progress_notes`, `mission_scenarios`, `check_results`, `release_approvals`, `mission_refreshes`, `mission_pauses`, `proposal_findings`, `redactions`, `readiness_waivers`, `device_logins`) and the column changes by table, but not every table's full column list, default and index name. So Soap's m2 build waits for the map. The contract (m1) can start on the stand-in, and its DTOs are rechecked against the map when it lands.

**The answers:**

- **B1. `MissionState`** = `draft`, `onboarding`, `approved`, `rendered`, `running`, `reviewing`, `deciding`, `awaiting_release`, `refreshing`, `delivering`, `delivered`, `closed`, `cancelled`, enforced by `missions_state_ck`.
  - **Source:** INT, matching `Schema vs DATABASE.md.md` (Column changes, `missions`).
  - **Paused and blocked are holds, not states.** They're shown only through `displayState` (Design v0.6 Main, The spine: "Paused and blocked are holds (open `mission_pauses` rows), not mission states").
  - **Each state has its lifecycle timestamp:** `onboarding_started_at`, `approved_at`, `rendered_at`, `delivered_at`, `closed_at` and `cancelled_at` are each tied to the state by a CHECK (same source).
- **B2. `ProjectKind`** = `client`, `internal`, `template`.
  - **Source:** CR-13, the table in `Change requests CR-1 to 13.md`.
  - **Clients:** `clients.kind` takes `client` or `internal`, with one internal client (a partial unique index).
  - **Missions:** a mission's kind must match its client's: `(kind = 'client') = (client_kind = 'client')`. So `internal` and `template` missions belong to the internal client.
- **B3. The new integration-commit kinds** are `ui_contract` and `api_contract` (INT). `dispatch_docs` comes in only if CR-16 is accepted, and CR-16 is still proposed.
- **B4. `completion_reports`** has `attempt_id`, `status` (`done`, `partial`, `blocked`), `result_commit`, `body` and `submitted_at` (INT, from the map).
  - **The CR-10 sections go inside `body`:** pre-flight, contract to files, deviations, limitations (CR-10 item 7; "contract package: the completion report schema (`completion_reports.body`)").
  - **The table is immutable:** a `refuse_update` trigger (`Schema vs DATABASE.md.md`, Patterns).
  - **Not yet checkable:** the stand-in says only "keyed by attempt. Immutable." I recheck these five columns against the map when it lands.
- **B5. Events:** the named kinds, plus the full event-to-owning-module map. Each later step adds its own kinds. `cli.ran` comes in only if CR-17 is accepted.
  - **INT, 2026-11-06:** `task_doc.rendered` and `message.stopped` are in, and `cli.ran` stays out until CR-17 is accepted. That makes 11 kinds. INT's message says "the 12 named kinds", but my 12 counted `cli.ran`, so 12 without it is 11. **For INT:** confirm 11.
  - **Both are in on INT's word, not by an accepted CR.** `task_doc.rendered` comes from CR-16 (proposed). `message.stopped` comes from CR-W14 (not accepted), and its route, `POST /api/missions/{missionId}/messages/{messageId}/cancellations`, isn't among the 99, so nothing emits it yet.
  - **Owners, by the table each kind's entity lives in** (contract.md, section 6):

    | Kind | Owner |
    | --- | --- |
    | `dispatch.ready`, `dispatch.started`, `dispatch.parked` | `factory` |
    | `attempt.started`, `attempt.ended` | `runner` |
    | `mission.created` | `factory`. Per CR-13, it carries `kind` |
    | `pass.approved`, `receipt.issued` | `gate` |
    | `usage.recorded` | `metering` |
    | `task_doc.rendered` | `factory`, which owns `task_docs` |
    | `message.stopped` | `onboarding`, which owns `messages`; CR-W14 says the same |

- **B6. Error codes:** as D5 (updated above).
- **B7. Pauses:** the schema wins. `mission_pauses` holds independent rows, not a stack, and route 24 ends one row (INT; `Schema vs DATABASE.md.md`: "Replaces `missions.paused_from`").
  - **Frozen columns:** `started_at`, `kind` and `interrupted_state` are freeze-once (same doc, Patterns).
  - **`displayState`:** `state`, or the hold when a `mission_pauses` row is open (API and data reference, Q8).
- **B8. Who writes what:** Axis writes `packages/contract` (`api-contract`), and Brennan reviews it. Soap builds the schema, and later the server (INT). The draft `plan.toml` already does this. The Step 0 plan's "Soap (schema, contract)" is superseded for the contract.
- **B9. The design library index** is a new table, `design_systems`, shaped like `templates` (INT):
  - **Columns:** key `(slug, version)`, an optional `client_id → clients`, `path` (under `design/<slug>`), `factory_commit → factory_versions`, and `status` (`'active'|'retired'`).
  - **Pinning:** a mission pins one at finalize.
  - **Owner:** I propose `knowledge`, beside `templates` (build plan section 4, Library).
  - **`layer`** (INT, 2026-11-06): `layer: 'global'|'client'`, with the CHECK `(layer = 'client') = (client_id IS NOT NULL)`. That's the map's `kb_entries_client_layer_ck`, word for word. `kb_entries.layer` itself also allows `'stack'`, but `design_systems` has no stack layer.
  - **Pin columns, confirmed** (INT, 2026-11-06): `missions.design_system_slug` and `missions.design_system_version`. The rest of the earlier proposal is still mine, and Brennan checks it: both optional, a composite FK to `design_systems`, both set or both null, mirroring `plans.template_slug` and `template_version`. **Corrected on Nov 6** (finding 05): there's no state tie. My first draft also had them "set once the state is `approved` or later"; that's dropped, as in `contract.md` section 6. The map ties none of `missions`' other pins to a state beyond `missions_approved_fields_ck`, and not every package needs a design system.
- **D6, D7 and D8 stand** (INT).
  - **D8:** the stand-in also lists `parked_from` on `module_runs` and `dispatches`. D8's type applies until the map gives one.

## 2026-11-06: the map, CR-16 and the pin columns

**Inputs:**
- INT, 2026-11-06, two messages: the map, CR-16 and the pin columns, then a correction of the commit;
- commit e1ed7ae, "docs: add the database map; accept CR-16". INT first gave 3cb7c0f, but no such object exists (`git cat-file`), and INT corrected it to e1ed7ae;
- commit 5baef35, the Step 0 builders and build-order row, following CR-19 and B8.

**The map** (`docs/design/AVEL Database Map.html`, generated 2026-11-01T19:21:37Z from `0000_functions.sql`, `0001_schema.sql` and `0002_hand_written.sql`):
- **Its counts match CR-19's,** read from the map's embedded `ERD` data: 91 tables, 204 foreign keys, 199 CHECKs, 81 unique and partial-unique indexes, 183 indexes. It also holds 999 columns, 124 rules and 65 triggers.
- **It replaces the stand-in.** `Schema vs DATABASE.md.md` is now only a guide to what changed.
- **m2 can start once the slice locks** (INT).
- **Rechecked against it:**
  - **B1:** `missions_state_ck` has exactly INT's 13 states.
  - **B4:** `completion_reports` has key `attempt_id`, then `status` (`completion_reports_status_ck`: `done`, `partial`, `blocked`), `result_commit?` (optional), `body`, `submitted_at` and `created_at`. That's INT's list, plus `created_at`, with `result_commit` optional.
  - **B7:** `mission_pauses` has `kind` (`operator`, `proposal`, `budget`), `interrupted_state` (a `MissionState`), `proposal_id?`, `paused_by?`, `reason?`, `started_at`, `ended_at?` and `ended_by?`, with five CHECKs (`mission_pauses_kind_ck`, `_interrupted_state_ck`, `_proposal_ck`, `_operator_ck`, `_ended_ck`; "four" until finding 09).
  - **D7:** the map puts the `Package` list on `onboarding_sessions.package_provisional` and `package_final`, and has no list on `packages.key`. D7 stands, unchanged.
  - **D8:** `dispatches_parked_ck` is "`(state = 'parked') = (parked_from IS NOT NULL)` and `parked_from <> 'parked'`", which is D8, so D8 is now quoted from the map. `module_runs.parked_from` has its own list (`module_runs_parked_from_ck`).
  - **The table set:** the map's 91 are exactly my 83 earlier tables, minus `outbox`, plus the 9 tables DATABASE.md lacked. `completion_reports` and `device_logins` were already in my 83. With `design_systems` (B9), Step 0 has 92 tables.
  - **CR-18:** the map still has `clients.rep_id`, `missions.rep_id` and `missions.rep_pct`, and those three are dropped.
  - **CR-6:** the map still has `jobs.lease_epoch`, `lease_until` and `'leased'`, and those are renamed.
- **The 99 value-list CHECKs** in the map (a fixed list, or "NULL or one of" for an optional column) are quoted in `contract.md`, Appendix A. They were extracted by a script from the map's `ERD.tables[].checks`. The CR changes are applied on top and listed separately, never edited into the quote.

**CR-16, accepted** (e1ed7ae; CR-16 contract, "Accepted Nov 6, 2026"):
- **B3:** `dispatch_docs` joins `ui_contract` and `api_contract` as the new `integration_commits.kind` values.
- **Routes:** CR-16's three dispatch-package routes are in the contract (API routes.md, "Proposed, not counted: CR-16 (3)"), for 102 routes in all. D4's snapshot test counts 102.
- **Its shapes and errors, quoted from the CR-16 contract:** `DispatchPackageDto`; the four 404 codes (`MISSION_NOT_FOUND`, `DISPATCH_PACKAGE_NOT_RENDERED`, `DISPATCH_PACKAGE_FILE_NOT_FOUND`, `PLAN_VERSION_NOT_FOUND`); the `?planVersion=` query; and `task_doc.rendered`, which is now backed by an accepted CR.
- **Still out:** the web's CR-W11 confirm route and the `dispatch_package_commit` decision kind ("Open, from the web"), and client-repo stripping (build plan section 6, still open).

**The pin columns** (B9): `missions.design_system_slug` and `missions.design_system_version`, confirmed by INT.

**Step 0 changes from CR-19** (Step 0 and Step 1 plan, read on 2026-11-06):
- **Item 5:** DATABASE.md is brought up to the schema. In `plan.toml`, that goes to Atlas's m3 (generated docs), so the drift check (done-when 4) compares against the updated doc.
- **Done-when 8:** the schema matches the map.
- **Done-when 9:** one test for each of the six functions.
- **Rigg's m2 tests** now cover 1, 2, 3, 6, 8 and 9.
- **Item 3** no longer has the `agent_traces` `progress` kind. The map has a `progress_notes` table instead (CR-15 item 7: "unless the repo already does something else"), so no new `agent_traces` kind.

## 2026-11-06: O1 and O2 answered

- **Committed:** INT committed sprint-00 as 84bc62d, and the edits below come after it.
- **O1, events:** `mission.closed` (owner `factory`) is the 12th kind (INT, 2026-11-06; Design v0.6 Main, line 534). Step 0 ships 12 kinds, and `cli.ran` waits for CR-17.
- **O2, `displayState`:** an open `operator` pause shows `paused`, and an open `proposal` or `budget` pause shows `blocked_on_you` (INT, 2026-11-06). Otherwise `displayState` is `state`.
- **D16. When pauses of different kinds are open at once, `blocked_on_you` wins over `paused`.**
  - **Left open by:** O2 maps each kind, but the map allows several open pauses at the same time: at most one `operator` and one `budget` per mission, plus one per proposal (`mission_pauses_open_operator_uq`, `mission_pauses_open_budget_uq`, `mission_pauses_open_proposal_uq`). Nothing says which one shows.
  - **Why:** `blocked_on_you` means work waits on a decision of yours. Showing `paused` would hide that.
  - **For Brennan:** check this.

## 2026-11-06: a review of the slice itself (after ffc6914)

**Not part of the reviewed slice.** Brennan reviews `contract.md` and `decisions.md` as at ffc6914. This entry was added after that commit.

- **INT, 2026-11-06:** `plan.toml` had no review of the slice, because both Brennan dispatches review built code. INT asked for a `review-spec` dispatch on `contract.md` and `decisions.md` at ffc6914, checked against the map, the accepted CRs, API routes.md and CR-16, with m1 (`api-contract`) waiting for it. Atlas's m0 starts from ffc6914.
- **D17. How that review is wired:**
  - **It's `agent-brennan-slice-review-spec`, in its own module, `slice`.** Inside m1, the renderer would point it at the m1 contract (`review_target`). With no build or contract in its module, it's ready at once.
  - **It starts at the commit that adds its task doc, not at ffc6914.** `scripts/agent.sh` refuses a start commit that doesn't contain the task doc ("isn't committed at $base"), and the new task doc doesn't exist at ffc6914.
  - **It has no diff, so its task doc pins the files.** The slice is already on main, so `AVEL_BASE..HEAD` is empty. The task doc tells Brennan to read both files whole with `git show ffc6914:<path>`, and its verify commands read the ffc6914 copies.
  - **m1 waits for the review to be merged.** m1's `after` names the review, and `after` counts only branches merged into main (`render.py`, `ready()`). So m1 starts once Brennan's branch, with his report and findings, is merged.
  - **Checked by running them:** the review's three verify commands printed `QUOTES-MATCH`, then the map's counts, then 25 (D1 to D16 and B1 to B9).

## 2026-11-06: Brennan's slice review (a1) and INT's answers

**Inputs:**
- Brennan's review, FAIL: report and seven findings on `backend/sprint-00/agent-brennan-slice-review-spec-a1`, commit 45c83da (`docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-01` to `07`). He reviewed ffc6914.
- INT, 2026-11-06: answers to 01 and 02; fix 03 to 07 from their sources; Brennan a2 re-reviews the new commit.

**The findings and what changed:**
- **F01 (P1), the parent shape of the contract commits.** INT: `ui_contract` and `api_contract` take the `tests` shape, "module_run_id required, the other two parents null", since CR-7 and CR-8 say the contracts are locked like tests. `dispatch_docs` keeps the `operator` shape (CR-16, line 84). In `contract.md` section 6.
  - **Settled after 5e45543** (INT, 2026-11-06): "the tests shape" is the map's literal rule, `module_run_id` required and nothing said about `attempt_id` or `dependency_request_id`. "The other two null" was INT's wording, not the map's. So the branch is `(module_run_id IS NOT NULL)`, and `contract.md` section 6 says so.
  - **Applied after Brennan's a2 reviewed 5e45543,** as INT's direct answer (INT, 2026-11-06). a2 passed on the stricter wording, so the change wasn't in what a2 reviewed. Brennan's m1 review checks the `integration_commits_by_kind_ck` branches.
- **F02 (P2), freezing `missions.kind`.** INT: a seventh function, `freeze_after_set`. Once `onboarding_started_at` is set, `missions.kind` can't change (CR-13's freeze trigger; CR-19's six are the map's, and CR-13 sits on top). It gets a done-when 9 test. In `contract.md` section 6: the function, its signature and the `missions_frozen` trigger. In `plan.toml`: Soap's m2 build and Rigg's m2 tests name seven functions.
- **F03 (P2), unnamed objects.** `contract.md` section 6 now has a names table: every new or renamed object, its definition and its source. CR-6's two names are CR-6's (`jobs_expired_claims_ix`, `jobs_claim_ck`), and `jobs_one_live_key_uq`'s predicate changes `'leased'` to `'claimed'`. The other names follow the map's patterns (D19).
- **F04 (P2), CR-13's contract items.** `contract.md` section 4: `kind` on `MissionDto`; `kind` required on route 20's input; an optional `?kind=` on route 19; and the metrics split (route 69) in Step 10, per CR-13's build order. The route rows stay as quoted.
- **F05 (P3), stale entries.** D2, D5's CR-16 line and D6 are marked superseded, with what replaces each. B9's pin note no longer ties the pin to a state. B3's "CR-16 is still proposed" stays: it's history, superseded by the Nov 6 entry.
- **F06 (P3), shared lists.** `contract.md` section 3 names `EvalSet`, `LibraryLayer`, `IndexStatus` and `ArchiveStatus`, adds Canon's `Topic`, and defines `FactKind` as `Topic` plus the rest (D18).
- **F07 (P3), citations.** `receipt.issued`'s source is now Frontend Map v0.6, lines 92 and 476, and B5 (INT), not CR-W10. `STALE_VERSION` has a `details` shape (D21).
  - **For Zero, through INT:** `CONFLICT` no longer means a stale version. A stale version is `STALE_VERSION`, and an existing row is `ALREADY_EXISTS`. `packages/contract-mock` and the web's error handling should follow. That's frontend territory, so I note it here and in my report to INT.

**My choices, for Brennan to check:**
- **D18. Lists with the same values are one list.**
  - **Left open by:** E1 says "every value list, defined once", and done-when 6 tests for repeats, but neither says whether two columns that happen to share values share a list.
  - **The rule:** two exported lists with the same values are a repeat. So `EvalSet` (`eval_runs.set`, `eval_tasks.set`), `LibraryLayer` (`kb_entries.layer`, `rules.scope`), `IndexStatus` (`packages`, `rules`, `skills`, `templates` and `design_systems` `.status`) and `ArchiveStatus` (`clients.status`, `notes.state`) are each one list.
  - **Why:** one rule with no exceptions gives Rigg's repeat test a plain check: no two lists with the same values. The judgment calls (`IndexStatus`, `ArchiveStatus`) mean the same thing on each column: an index row retired by a factory PR; a row archived. If one column later needs a value the others don't, it splits off then.
  - **Not a repeat:** `DesignSystemLayer` (`global`, `client`) differs from `LibraryLayer`, so it's its own list.
- **D19. New object names follow the map's patterns.**
  - **Left open by:** CR-13 and B9 name columns and rules but not their CHECKs, indexes, FKs or triggers. The conventions say names are "the map's, word for word, as contract.md section 6 changes them".
  - **The patterns:** they're listed above the names table, each with a map example. Where a source gives a name (CR-6), that name wins.
  - **One choice inside it:** the composite FK to `clients (id, kind)` is `missions_client_kind_fk`, not `missions_client_fk`, because the map's one-column `missions_client_id_clients_id_fk` stays and the new name says what's added.
- **D20. `clients.kind`, `missions.kind` and `missions.client_kind` have no default.**
  - **Left open by:** CR-13 gives none, and the map has none.
  - **Effect:** a client's create input carries `kind` (`ClientKind`), and route 20's input carries `kind` (`ProjectKind`). The server sets `missions.client_kind` from the client.
  - **Why:** a default of `'client'` would quietly make an internal mission a client one. A missing kind should fail.
- **D21. `STALE_VERSION`'s `details` is `{ field, currentVersion }`.**
  - **Left open by:** Frontend Map v0.6 (line 393) asks for "the current version on a 409" and gives no shape. B6 named the code, not its `details`.
  - **The shape:** `field` is the stale body field (`rowVersion`, `version`, `receiptHash` or `headSha`, per Q4); `currentVersion` is its current value, a number or a string to match.
- **D22. Brennan's re-review (a2) reads the new commit, and only a2 is merged.**
  - **What changes in `plan.toml`:** the slice review now reads `contract.md` and `decisions.md` as at the commit a2 starts on, with `git diff ffc6914 "$AVEL_BASE"` for what changed since a1. a2 reads a1's findings from 45c83da and says in its report whether each is closed.
  - **Merge a2, not a1.** m1's `after` counts any merged attempt of the review (`render.py`, `ready()`), so merging a1, a FAIL, would free m1.
  - **Findings files:** a still-open a1 finding keeps its file name; a new finding is numbered from 08.

## Open: for INT

Nothing. F01's shape was settled after 5e45543 (above).

## 2026-11-06: Brennan's slice re-review (a2)

- **PASS** (INT; commit 890f6f6), with two P3 findings, fixed before m2:
  - **F08, `usage_log.vendor` had no definition.** It's now `vendor text NOT NULL`, no default, in `contract.md` section 6. That's derived from the map, not a choice: CR-5 says only "add it", and the map's `attempts.vendor` and `price_table.vendor` (which CR-5 says already carry it) and `usage_log.model` are all `text NOT NULL` with no default.
  - **F09, two inaccurate lines here.** D3 item 1 is marked superseded (the map landed in e1ed7ae), and the B7 recheck says five CHECKs, not four.
- **Not reviewed by a2:** the F01 branch change and these two fixes. Brennan's m1 review checks the `by_kind` branches.
