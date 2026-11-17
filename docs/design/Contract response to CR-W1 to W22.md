# Contract response to CR-W1 to W22

Nov 12, 2026 · backend contract session for @javaris · **contract 1.0.0** · branch `feat/contract-cr-w1-w22` (5 commits, not pushed yet: see "Delivery" at the end)

## In short

- **Version:** `@avel/contract` 1.0.0, the first release (S1-2). It carries the Step 1 slice and every decision below. `CONTRACT_VERSION` equals `package.json`, and a test checks it.
- **Routes:** 102 → **119**. Two withdrawn (69 `GET /api/metrics`, 70 `POST /api/payments`), 19 added (numbered 104 to 122 in API routes.md; 103 stays reserved for CR-W2's factory-change read).
- **Events:** 12 entity-named kinds → **87** kinds named `<module>.<object>.<verb>`: 47 object kinds, plus `opened`, `resolved`, `expired` and `returned` for each of the 10 decision owners. Each kind has one typed payload.
- **Decisions:** one union of **10 kinds**, each with a schema and an approve route built from its `target` alone (`approveCallFor`).
- **Migration:** `0003_crw_contract_1_0.sql` with its down file. It adds 4 tables, 36 CHECKs, 5 unique indexes and 15 foreign keys (553 rules in all, each with its generated test).
- **Tests, against real Postgres:** contract 163, contract-mock 12, db 652 and docs 21, all passing. The web has 39 failing tests (of 197), all in the Decisions module, until it moves to the new union (see "What the web must change").
- **No money** on any web-facing route or event except AI cost against its cap. A test walks every output schema and event payload to check this.

## Verdict per CR

| CR | Verdict | What differs from the ask |
| --- | --- | --- |
| **CR-W1** event catalog | Accepted with changes | `EventDto` is a discriminated union over the catalog (`eventPayloads`, exhaustive both ways). `EventHandlers` is the web's registry type: leaving a kind out is a compile error, and a test checks that. Some kinds are merged so each change has one event: `integrator.commit.queued/testing/landed/rejected` become `integrator.commit.changed {state}`; `onboarding.checkpoint.drafted/approved/stale` become `onboarding.checkpoint.changed {state}`; `factory.module.state_changed` and `parked` become `factory.module.changed`; `delivery.delivery.completed/failed` become `delivery.delivery.changed {delivery}`; `knowledge.change.merged` becomes `knowledge.change.closed {merged}`. Dropped: `runner.attempt.progress` (that's agent output, on the trace stream) and `runner.gate3.evaluated` (covered by `gate.evaluation.recorded`). Added: `missions.mission.changed`, `missions.mission.kind_set`, `onboarding.fact.changed`, `onboarding.question.changed`, `factory.task_doc.rendered`, `knowledge.change.updated`, `evals.run.*` and `pipeline.*`. Renamed to the past tense: `metering.budget.warned`. No old name is stored anywhere, so nothing is migrated. |
| **CR-W2** pending decisions | Accepted with changes | It builds on the accepted Nov 6 shape: `kind: 'proposal'` with `proposalKind` inside `target`, not 13 top-level proposal kinds. The kinds are `proposal`, `factory_change`, `checkpoint`, `plan_finalize`, `checkpoint_question`, `pass_approval`, `release`, `dispatch_package_commit`, `followup_send` and `upkeep_offer`. Each item carries `owner` (FM's decision-ownership table), `mission {id, name, kind, clientName}`, `asOfSeq` (the event seq it reflects, which replaces CR-W2's `version`, since bound versions differ by kind and sit in `target`), `plain`, `evidence[]`, `reasonRequired`, `rejectable`, `unlocks` and `previous`. Proposals carry `choices[]` (with `recommended` and `effect`) and `decidable`. Money appears only as `budget` on a `budget_increase` (AI budget from and to) and the accepted `costImpact`. A stale bind returns 409 `STALE_VERSION` with `details.current` set to the current item. Routes 53 and 54 return `ProposalViewDto`. |
| **CR-W5** summaries and status | Accepted with changes | Route 19 returns `MissionListRowDto`. Missions have no slug, so it carries `id` and `name`. Its strip is `gates[]` (CR-W18 section 5's shape), and money stays off it. `GET /api/status` returns `StatusDto`: `slots`, `needsYouCount`, `alerts[]` (with a stable `key` so `system.alert.cleared` can name the alert), `stallAfterMs` (600000, the `no_progress` setting), `lastSeq` and `at`. |
| **CR-W9** plain blocks | Accepted | `MissionPlain`, `ModulePlain`, `DispatchPlain`, `DecisionPlain` (with `returned`), `ReceiptPlain`, and `PackagePlain` for CR-W11. The templates live in the contract (`plain-templates.ts`, `PLAIN_TEMPLATES_VERSION` 1.0.0), so the server, the CLI and the mock write the same text. Tests cover every mission display state, module state, dispatch state and role, decision kind and verdict, against the length limits and the ID lint (`plainTextIssues`: module and finding refs, check labels, SHAs, UUIDs, gate numbers). |
| **CR-W10** event names | Accepted | Both `missions.` and `system.` are prefixes. `factory` writes `missions.*` and `platform` writes `system.*`; every other prefix is the module that writes the kind, and a test checks that. Each decision owner emits its own decision events. This supersedes CR-15 item 8 ("names stay entity names"). That was safe because no event had been stored yet. |
| **CR-W11** package route | Accepted with changes | CR-16's three routes and DTO stay as accepted, with CR-16's file kinds. The manifest gains `commit {state, sha, confirmedAt, confirmedHash}` and `plain`. The confirm route is `POST …/dispatch-package/commits {packageHash}` (`GATE1_NOT_PASSED` 422; a re-render gets 409 `STALE_VERSION` on `packageHash`). There's a `dispatch_package_commit` decision kind (`rejectable: false`), attempts carry `taskDocSha256` and `activationSha256`, and the three events are as asked. The archive keeps CR-16's 409 `ARCHIVE_BUILDING` instead of an `archive.state` field. |
| **CR-W15** decisions that come back | Accepted with changes | `previous`, `plain.returned`, `<owner>.decision.returned` and the order (returned items first) are as asked. `proposals` gains state `superseded` and `superseded_by`; a superseded proposal keeps its choice and reason. **Release approvals stay immutable**, because a receipt depends on them, so they get no `superseded_at` column. A release is superseded when no delivery exists for the approval and the mission has a newer receipt. That's read from records, not from timing. A package commit is superseded when `confirmed_hash` ≠ `hash`. |
| **CR-W16** skill results and eval runs | Accepted with changes | `GET /api/library/skills/{itemId}/results` returns `SkillResultsDto`, which includes `origin`. `factory_change.target.evalRun` is an `EvalRunSummaryDto`. The run read is a new route, `GET /api/eval/runs/{runId}`. `budget_reservations` gains `scope` (`mission`, `eval`) and `eval_run_id`, and `mission_id` is required only for the mission scope. The parent rules accept `eval_run_id`. `skills` gains `license` (required for an import), `upstream_ref` and `edition_note`. |
| **CR-W17** pipeline, Phase 1 | Accepted with changes | A new backend module, `pipeline` (the 20th), owns `leads` and `followups`. `clients.status` gains `lead` and `lost`; `clients.proof_consent_at`, `missions.lead_id` and `missions.follows_delivery_id` are added. There are five routes plus a sixth: list, create and close leads; read a follow-up; read the pipeline; and **one approve route for both decision kinds**, `POST /api/followups/{followupId}/sends {draftHash, outcome: sent \| skipped}`. An upkeep offer is a `followups` row of kind `upkeep`. "Unsubscribed" is read from the contact entries in `clients.contacts` and shown as `FollowupDto.unsubscribed`; sending then gets `CONTACT_UNSUBSCRIBED` (422). `human_time.activity` gains `sales`, but only against a mission (see Deferred). |
| **CR-W18** scope, gates, clock, delivery | Accepted with changes | **§1:** `CheckpointDto.sections` is `CheckpointSectionDto[]` of `FactLineDto` (with `relayedBy`). **§2:** `MissionDetailDto.onboarding` is `OnboardingJourneyDto`. **§3:** `CheckpointDto.rubric` is `RubricResultDto[]` with `suggestion`. **§4:** see conflicts 1 and 2. **§5:** `gates[]` carries `runs` and `counts`. **§6:** `MissionDto.deadline` is a `DeadlineClock`, adding `atRisk`; `dueAt` replaces `deadlineAt`. **§7:** withdrawn. **§8:** `DeliveryViewDto` keeps the design's states (`pending`, `recorded`, `failed`) and adds `prNumber`, `prUrl`, `mergedAt` and `target`, which the webhook fills; it's announced by `delivery.delivery.changed`. **§9:** `FindingDto` adds `moduleRef`, `citedRequirements`, `citedScenarios` and `cappedAtPass`, and route 59 filters by state, route and module. **§10:** `MissionDto.clientMain` is read from the new `repo_connections.main_head`. **§11:** `PlanViewDto.moduleSummaries`. |
| **CR-W19** Canon streaming and the dock | Accepted with changes | Route 34 (`POST /api/missions/{missionId}/messages`) *is* `send`: it returns an event iterator of `CanonStreamChunk` (AI SDK v5 UI message chunks; `finish` carries status, `ttftMs` and `totalMs`). Resume is `GET …/messages/{messageId}/stream`, and route 33 lists `CanonMessageDto`. Canon's cost is `costMicros`, not `costUsd`, because money is in micro-dollars. `fact.proposed` and `canon.message.updated` become `onboarding.fact.proposed` and `onboarding.message.updated`. Questions gain `code`, a subject, `why`, `after` and `answerSource`. Route 44 takes `choice` (an option ID, or `other` with `answer` up to 2000 characters); there's no generic `decisions.decide`. **Transcribe takes the recorded clip** (`POST …/transcriptions`, at most 8 MB) and streams the transcript back. Live partials *while you talk* need a duplex channel the OpenAPI handler doesn't have (Deferred). The latency rules are accepted as server obligations. |
| **CR-W20** template docs, Business removed | Accepted | **§1:** `TemplateDocs` is on `TemplateViewDto` (route 88's output), read from the factory repo at the pinned commit. It's null only for a template indexed before CR-W20. **§2:** no contract change. **§3:** routes 69 and 70 are gone, and so are `priceMicros` on `MissionDto` and `PlanDto` and `priceMicros` and `monthlyPriceMicros` on `PackageDto`. The database columns stay for now (Deferred). |
| **CR-W21** proof files, module runs, authoring | Accepted with changes | **§1:** `ReceiptDto` gains `target`, `plan`, `modules`, `gates`, `tests`, `acceptance`, `artifacts`, `signature` and `plain`; the artifact route is added, and `?verify=1` returns `verified {signature, checkedAt}`. The digest is one shared function (`receiptDigestInput`), the same in the browser, the server and the mock. The mock's receipt hash is computed with it, and a test checks that. A missing receipt is the generic `NOT_FOUND`. **§2:** `GET /api/missions/{missionId}/modules/{moduleRef}` returns `ModuleRunViewDto`, and steps come from `GET /api/attempts/{attemptId}/steps` and the trace stream (conflict 4). `module.updated` is `factory.module.changed`. **§3:** the routes sit under `/api/library`. A draft save is a `PUT` bound to `rowVersion`, not "last write wins", so a second tab gets a 409 instead of losing text. Opening the PR returns `{prNumber, decisionRef}`. |
| **CR-W22** client project or template | Accepted with changes | **`kind` keeps CR-13's three values**: `client`, `internal` (AVEL's own software, like the Control room) and `template` (an internal template build). It's null until Q-0.1a is answered, together with `client_id` and `client_kind` (one CHECK); it must be set before the mission leaves onboarding; and it freezes once the plan is approved, not once onboarding starts. Q-0.1a offers a third option, "Internal tool". `missions.name` and `template_slug` are added. `POST /api/missions` takes `{name, clientId?}` and no kind. Route 19 takes `?kind=` and `unset`; route 8 leaves out the internal client unless you pass `?kind=internal`. `templates.source_mission_id` already exists (CR-13). |

## Conflict decisions

1. **How "a reason is required" is shaped:** CR-W2's `reasonRequired { approve, reject }`. A checkpoint's "request changes" takes a reason and its approval doesn't, so one boolean can't say it.
2. **Decision kind names:** `checkpoint`, `plan_finalize` and `checkpoint_question`. Proposals stay one kind, `proposal`, with `proposalKind` in `target`, as accepted on Nov 6.
3. **Event names:** all follow `<module>.<object>.<verb>`: `onboarding.fact.proposed`, `onboarding.message.updated`, `factory.module.changed` and `missions.mission.kind_set`. `agent.step` isn't an event (see 4).
4. **`agent.step`:** it gets a separate trace subscription, not a mission-stream event. The module page opens route 64 with `?attemptId=…&view=steps`, which streams `AgentStepDto`, and backfills with `GET /api/attempts/{attemptId}/steps?after=`. The mission stream stays bounded.
5. **Error codes, in one place:** `errors.ts`. Every code has an HTTP status there (`errorStatus`), and the body is always `{code, message, details?, requestId}`; `parseErrorBody` reads it. The new codes:

| Code | Status | Details |
| --- | --- | --- |
| `DECISION_SUPERSEDED` | 422 | `{replacedBy}` (a ref) |
| `GATE1_NOT_PASSED` | 422 | none |
| `ARCHIVE_BUILDING` | 409 | none |
| `MISSION_NOT_IN_SCOPING` | 409 | none |
| `CANON_BUSY` | 409 | none |
| `MESSAGE_TOO_LONG` | 413 | `{maxChars}` |
| `BUDGET_EXCEEDED` | 402 | `{scope: mission \| module \| eval}` |
| `MODEL_UNAVAILABLE` | 503 | `{retryAfterMs}` |
| `STREAM_GONE` | 410 | none |
| `TRANSCRIBE_FAILED` | 422 | none |
| `ARTIFACT_TOO_LARGE` | 413 | `{bytes, sha256}` |
| `RECEIPT_SUPERSEDED` | 409 | `{receiptId}` |
| `TEMPLATE_DOCS_INVALID` | 422 | `{issues: [{path, rule}]}` |
| `TEMPLATE_SLUG_TAKEN` | 409 | `{suggestion}` |
| `SOURCE_NOT_SHIPPED` | 409 | none |
| `TEMPLATE_SOURCE_NOT_VERIFIED` | 409 | none |
| `KIND_NOT_SET` | 409 | `{questionRef}` |
| `CLIENT_NAME_TAKEN` | 409 | `{clientId}` |
| `LICENSE_NOT_ALLOWED` | 422 | `{license}` |
| `CONTACT_UNSUBSCRIBED` | 422 | none |

   Three asks map onto existing codes: CR-W19's `DECISION_ALREADY_DECIDED` is `INVALID_TRANSITION` (422, with `state` and `resolvedAt`); `RECEIPT_NOT_FOUND` and `MODULE_NOT_FOUND` are `NOT_FOUND`. `STALE_VERSION` now also covers `packageHash` and `draftHash`, and carries `current`.
6. **`audience` or `kind`:** `kind`. The prototype's `audience: internal` maps to `kind: template` for a template build, or to `kind: internal` for AVEL's own tools.
7. **Ref uniqueness:** a ref is `<kind>:<id>`, where `<id>` is a row UUID, a mission UUID or a PR number, so refs are unique across the factory, not just per mission. Labels like "Q-0.1a" are a question's `code`, unique per session (a partial unique index), and never a ref. The sample data's repeated "Q-0.1" is a label.

## Open questions answered

- **CR-W1:**
  - The `missions.` and `system.` prefixes are accepted.
  - `GET /api/status` is in the Health group.
  - `stallAfterMs` is added and reads the `no_progress` setting.
  - Plain text comes from templates only, never a model at read time.
  - The final catalog is `EventKind`.
- **CR-W15:**
  - **The subject table** is confirmed. A new receipt after a fix is the same subject for a pass approval and a release.
  - **What acts asynchronously today:**
    - releases (the delivery worker);
    - package commits (the integrator);
    - proposal outcomes carried out by jobs (factory and integrator).
  - **What acts at once:** checkpoint approval, finalize, pass approval, factory merges (the merge binds `headSha`) and budget increases.
  - **`superseded`** is a proposal state, with `superseded_by`.
- **CR-W16:**
  - The baseline matches role and work kind only. Stack waits until there are enough attempts per stack.
  - A targeted run for a skill PR joins the nightly run automatically, within the monthly eval budget. Full runs still wait for `eval_runs.approved_by`.
  - The run read is added (route 116).
  - `eval` is the only new scope. Canon has no factory-level work.
- **CR-W17:**
  - A new `pipeline` module.
  - Intake gets its own scope when Phase 2 lands.
- **CR-W21:** whether a passing proof check is required before Release is your call. It isn't required in 1.0.0.

## Routes, version and migrations

- **Before and after:** 102 → 119. Removed: 69 and 70. Added, as 104 to 122:
  - 104 `GET /api/status`
  - 105 `GET /api/missions/{missionId}/messages/{messageId}/stream`
  - 106 `POST /api/missions/{missionId}/transcriptions`
  - 107 `GET /api/receipts/{receiptId}/artifacts/{key}`
  - 108 `GET /api/missions/{missionId}/modules/{moduleRef}`
  - 109 `GET /api/attempts/{attemptId}/steps`
  - 110 `GET /api/library/templates/sources/{missionId}`
  - 111 `GET /api/library/template-drafts/{draftId}`
  - 112 `PUT /api/library/template-drafts/{draftId}`
  - 113 `POST /api/library/template-drafts/{draftId}/pull-requests`
  - 114 `POST /api/missions/{missionId}/dispatch-package/commits`
  - 115 `GET /api/library/skills/{itemId}/results`
  - 116 `GET /api/eval/runs/{runId}`
  - 117 `GET /api/leads`
  - 118 `POST /api/leads`
  - 119 `POST /api/leads/{leadId}/closures`
  - 120 `GET /api/followups/{followupId}`
  - 121 `POST /api/followups/{followupId}/sends`
  - 122 `GET /api/pipeline`
- **Contract version:** 1.0.0.
- **Migration `0003_crw_contract_1_0`** (and `down/0003_crw_contract_1_0.sql`):

| Table | Change | CR |
| --- | --- | --- |
| `leads` | new | CR-W17 |
| `followups` | new | CR-W17 |
| `receipt_artifacts` | new, immutable | CR-W21 |
| `template_drafts` | new | CR-W21 |
| `missions` | `name`; `template_slug`; `lead_id`; `follows_delivery_id`; nullable `client_id`, `kind` and `client_kind`; four CHECKs; `missions_frozen` now gates on `approved_at` | CR-W22, CR-W17 |
| `clients` | status `lead` and `lost`; `proof_consent_at` | CR-W17 |
| `human_time` | `sales` | CR-W17 |
| `proposals` | `superseded`; `superseded_by` | CR-W15 |
| `mission_docs` | commit state and confirmation | CR-W11 |
| `attempts` | `task_doc_sha256`; `activation_sha256` | CR-W11 |
| `messages` | 9 columns; one-streaming and client-ID unique indexes | CR-W19 |
| `questions` | 7 columns; code unique per session | CR-W19, CR-W22 |
| `budget_reservations` | `scope`; `eval_run_id` | CR-W16 |
| `skills` | `license`; `upstream_ref`; `edition_note` | CR-W16 |
| `receipts` | `signature_key`; `signature` | CR-W21 |
| `deliveries` | `pr_number`; `merged_at` | CR-W18 |
| `repo_connections` | `main_head`; `main_head_at` | CR-W18 |

  Every difference from the map is listed in `packages/db/test/helpers/changes.ts` with its CR. DATABASE.md, the ERD and `openapi.json` are updated, and the drift check passes. **0003 needs an empty database**: four new NOT NULL columns have no default, and no database is deployed yet.

## What the web must change

1. **Decisions:**
   - Read route 52 as the 1.0.0 union.
   - Text comes from `plain.title`, `plain.why`, `plain.ifYouApprove` and `plain.ifYouReject`. `title`, `clientName` and the `evidence` string are gone from the top level: the mission is `mission.{name, clientName}` and evidence is `evidence[]`.
   - Proposal choices come from `target.choices[]`, which replaces `approve` and `reject`.
   - Approve with `approveCallFor(item, tap)`.
   - Routes 53 and 54 return `ProposalViewDto`.
   - This is the source of the 39 failing web tests (`pending-decisions`, `route-52`, `route-54` and the Decisions module tests).
2. **Route 19:** rows are `MissionListRowDto`, with `name`, `client`, `gates[]`, `modules`, `deadline` and `plain`. They aren't `MissionDto`.
3. **`MissionDto`:**
   - `priceMicros` and `deadlineAt` are gone; use `deadline.dueAt`.
   - `kind`, `clientId` and `clientKind` can be null.
   - New fields: `name`, `plain`, `clientMain` and `templateSlug`.
4. **Events:** handle the 87 kinds by their new names through `EventHandlers`, and use `asOfSeq` and `rowVersion` to drop stale events.
5. **Canon:** route 34 is now a stream (`CanonStreamChunk`). Route 44 takes `choice` and `answer`. Voice sends the recorded clip.
6. **The module page's live feed:** open route 64 with `view=steps`, not the mission stream.
7. **Template drafts:** send the `rowVersion` from the last save.
8. **New project:** sends `{name, clientId?}` only. The "For" filter uses `?kind=client|internal|template|unset`.
9. **Rename `audience` to `kind`.**
10. **Business:** drop the last references to `/api/metrics`, payments and package prices.
11. **The mock:** `createMock({ world: true })` serves the sample world, a decision of every kind and one event of every kind. Without `world`, it serves the Step 1 seeds as before, now in the 1.0.0 shapes.

## Deferred, and why

- **CR-W17 Phase 2 (public intake):** waits, as the CR says. It also needs its own `intake` budget scope and rate limits.
- **Selling time before a mission exists:** `human_time.mission_id` is required, so `sales` minutes are logged against the project being scoped. Logging minutes against a client alone needs a design change to `human_time`.
- **Live voice partials while you talk:** need a duplex channel (WebSocket) outside the OpenAPI handler, which is a design change. The recorded-clip route streams the transcript back as it's decoded.
- **Dropping `payments`, `missions.price_micros`, `plans.price_micros` and the package prices from the database:** the contract no longer serves them, but removing tables and columns is a design change to the money model (cost control). That needs its own change request.
- **Intake budget scope and email sending:** the `copy` channel only until a mail service and AVEL address exist.
- **Server implementations:** this is the contract, mock and schema. The server builds each route in its build step.

## Design docs this touches (change requests)

- **Backend modules and build plan, section 4:** add `pipeline` as the 20th module (owns `leads` and `followups`).
- **Frontend Map v0.6, "Event kinds belong to modules too":** "Names stay entity names" is replaced by CR-W10's `<module>.<object>.<verb>`. CR-15 item 8 is superseded.
- **Design v0.6 Main, Decisions row and the decision list:** the 10 kinds and their approve routes.
- **Canon Onboarding:** Q-0.1a and Q-0.1b, which open every interview; the kind freezes at plan approval.
- **Already updated on the branch:** DATABASE.md, API routes.md, `docs/generated/erd.md` and `openapi.json`.

## Delivery

The branch is committed with Commit Convention v1 (`type(scope): summary`, CR IDs in `Refs:` trailers, `!` and `BREAKING CHANGE:` on the two breaking commits):

- `feat(contract)!`
- `feat(contract)`
- `feat(db)!`
- `docs(db)`
- `docs(contract)`

Pushing failed: this session can't push to `Avel-org/avel-factory` because GitHub isn't linked to the session. A git bundle of the five commits was handed over instead. To open the PR:

```
git fetch <bundle> feat/contract-cr-w1-w22:feat/contract-cr-w1-w22
git push -u origin feat/contract-cr-w1-w22
```

Then open the PR against main. Nothing was pushed to main.
