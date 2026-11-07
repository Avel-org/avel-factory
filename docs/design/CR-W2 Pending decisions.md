# CR-W2: pending decisions (accepted, Step 1)

**Accepted by INT, Nov 6, 2026.** Written by Axis for INT. INT answered section 8 on Nov 6; Brennan reviews it with the Step 1 slice. Nothing here is built yet. This replaces the Nov 3 write-up, which is lost, and is written fresh from the sources below.

**What it decides:** the shape of route 52's row (`PendingDecisionDto`, a `Placeholder` in m1 under D30), what routes 53 and 54 take and return, and the `ref` used by `/decisions/$ref`. It is sized for Step 1 item 13 ("a minimal approval page") and done-when test 14 ("a seeded proposal shows as waiting, and approving it records the decision with a reason and refuses a stale version").

**Scope (INT, 2026-11-06):** Step 1 covers proposals, which are approved or rejected through routes 52 to 54 and bound to `proposals.version`, plus open factory PRs, which are read-only. Every other decision kind arrives in a later step (section 7).

## Sources

| Short name | Where |
| --- | --- |
| Map | `docs/design/AVEL Database Map.html`: the `proposals`, `missions`, `clients` and `factory_versions` tables |
| Routes | `docs/design/API routes.md`: rows 52, 53, 54, 72 and 73; line 8 (Q4); line 16 ("Rules on every write") |
| FM | `docs/design/AVEL Web App — Frontend Map v0.6.md`: line 84 (factory PR kinds), 86 (money on decisions), 161 (`/decisions/$ref`), 468 (CR-W2), 475 (CR-W9) |
| Main | `docs/design/Design v0.6 Main.md`: line 442 (versions), 444 (approvals never ask for a password), 458 (Decisions routes), 459 (Gate 5 choices) |
| Plan | `docs/design/Step 0 and Step 1 plan.md`: item 13, the Step 1 tables (line 89), test 14 |
| Slice | `docs/agent-dispatch/backend/sprint-00/contract.md` (errors, section 5) and `decisions.md` (D21, D23, D25, D30) |
| m1 | `packages/contract` at e36737f: `ProposalDto`, `DecideProposalInput`, `FactoryChangeDto`, `Page`, `PageQuery`, `Reason` |
| Needs | `docs/agent-dispatch/frontend/sprint-01/cr-w2-needs.md` (Zero), whose questions 1 to 7 are answered in section 6 |

## 1. The `ref`

- **Format:** `ref = <kind>:<id>`, where `<kind>` is the union's discriminant (section 2) and `<id>` is that kind's identity (FM 161, 468).
- **The kinds in Step 1:**

| `kind` | `<id>` | Example |
| --- | --- | --- |
| `proposal` | `proposals.id`, a lowercase UUID | `proposal:0193a7c2-…` |
| `factory_change` | the PR number in decimal, which is also route 73's `{changeId}` | `factory_change:142` |

- **Stable:** a `ref` never changes while its decision is open. Neither the proposal's `version` nor the PR's `headSha` appears in it. The version is shown and bound separately.
- **Parsing:** the server splits a `ref` at its first `:`. Neither kind's `<id>` contains a `:`.
- **`changeId` is narrowed.** In m1, `FactoryChangeDto.changeId` is `z.string().min(1)`. This draft narrows it to the PR number written as digits (`/^[1-9][0-9]*$/`). That changes `packages/contract` in the Step 1 slice (section 8, item 5).
- **Why the discriminant and not the `ProposalKind`:** a `ProposalKind` such as `budget_increase` is a detail of a proposal, not a separate kind of decision. With the discriminant in the `ref`, the later kinds (section 7) slot in as new discriminants.

## 2. Route 52's row: `PendingDecisionDto`

`GET /api/pending-decisions` keeps `PageQuery` for its input and `Page(PendingDecisionDto)` for its output (D23). `PendingDecisionDto` is a Zod `discriminatedUnion("kind", [...])`. Every value in it is computed by the server, and the web never derives one (FM 134).

### 2.1 Fields on both members

| Field | Type | Source |
| --- | --- | --- |
| `kind` | `'proposal' \| 'factory_change'` | the discriminant (INT scope; FM 468 "kind") |
| `ref` | string, `kind:id` | section 1 |
| `title` | string, one line | proposal: section 3.1; factory PR: the GitHub PR's title |
| `createdAt` | ISO time | proposal: `proposals.created_at`; factory PR: the time GitHub says the PR was opened |
| `missionId` | UUID or null | proposal: `proposals.mission_id` (NOT NULL, so never null for a proposal); factory PR: always null |
| `clientName` | string or null (INT, section 8 item 1) | proposal: `clients.name`, read through `proposals.mission_id` → `missions.client_id` (a read-only join; Step 1 writes nothing to `missions` or `clients`); factory PR: always null. The map's `missions` has no name or title column, so Step 1 has no `missionName` |

### 2.2 `kind: 'proposal'` (can be decided)

| Field | Type | Source |
| --- | --- | --- |
| `proposalId` | UUID | `proposals.id` |
| `proposalKind` | `ProposalKind` (13 values) | `proposals.kind` (`proposals_kind_ck`) |
| `subjectKey` | string, may be `''` | `proposals.subject_key` |
| `moduleRunId` | UUID or null | `proposals.module_run_id` |
| `version` | int ≥ 1 | `proposals.version` (`proposals_version_ck`); the value route 54 binds (Q4, D25) |
| `evidence` | string | `proposals.reason` (section 3.1) |
| `approve` | `DecisionChoice`, absent when `options` doesn't parse | the entry in `proposals.options` whose `effect` is `approve` (section 3.2) |
| `reject` | `DecisionChoice`, absent when `options` doesn't parse | the entry in `proposals.options` whose `effect` is `reject` (section 3.2) |
| `expiresAt` | ISO time | `proposals.expires_at`, 7 days after creation (map description) |
| `costImpact` | optional `{ micros: int, estimated: boolean }` (INT, Q6) | **Step 1 never sends it.** `budget_increase`, `contract_change` and `repin` fill it once metering exists (FM 86, 468). When it's absent, the decision doesn't change spend, and the page shows no money. Never `0` to mean "doesn't apply". Its source column or `options` field is decided in the step that fills it |

`DecisionChoice = { choice: string, label: string, consequence: string }`:
- `choice` is the exact string route 54 accepts.
- `label` is the button text.
- `consequence` is the "If you approve" text for `approve` and the matching text for `reject` (FM 468).

The row doesn't carry the raw `options`, `dispatchId`, `rowVersion` or the resolution columns. The page doesn't need them (Needs §1), and route 53 returns them.

### 2.3 `kind: 'factory_change'` (read-only)

| Field | Type | Source |
| --- | --- | --- |
| `changeId` | string of digits | the PR number (section 1); the same as route 72's `changeId` |
| `prNumber` | int | the GitHub PR number. It becomes `factory_versions.pr_number` once merged |
| `headSha` | 40-character hex | the PR's head commit (Q4). Shown, and not sent anywhere in Step 1 |
| `url` | URL | the PR's GitHub page, which "Open" links to |

**There is no table behind this member.** The map has no table for open factory PRs: `factory_versions` records only merged commits. Route 72's row ("Open PRs") and m1's `FactoryChangeDto` say the same. In Step 1, the server reads open PRs on `avel/factory` from GitHub through the factory's GitHub App (Plan item 11), at request time. Every field above traces to route 72's row, with GitHub as its source. Whether to cache them, and for how long, is the server's choice and not part of the contract.

A factory PR row has no actions and no `costImpact`, and its `missionId` and `clientName` are null.

## 3. Where the text and the choices come from

### 3.1 `title` and `evidence` for a proposal

`proposals` has no title, evidence or consequence column. Until CR-W9's `plain` block arrives (FM 475, not in Step 1), the server fills them from existing columns:
- **`title`:** the kind's label from a fixed table in the server, followed by `: <subject_key>` when `subject_key` isn't empty. Examples: `Budget increase`, `Dependency: payments-api`. The table maps each of the 13 kinds to a label, and the server's typecheck fails if one is missing (`Record<ProposalKind, string>`).
- **`evidence`:** `proposals.reason`, which is NOT NULL. This is what the proposal's author wrote about why it is asking.
- **`consequence`:** comes from the chosen option (section 3.2).

When CR-W9 is accepted, `title`, `evidence` and `consequence` come from the `plain` block instead. The field names stay the same.

### 3.2 The shape of `proposals.options`

The map types `options` as `jsonb` and gives it no shape. DATABASE.md, line 597, says jsonb holds payloads "which we never filter on", so giving it a shape adds no column. This draft fixes the shape in `packages/contract` as `ProposalOptions`. Every write that creates or changes a proposal validates `options` against it.

```ts
ProposalOptions = {
  choices: Array<{
    choice: string;          // ≥ 1 char, unique within the proposal
    label: string;           // ≥ 1 char
    effect: 'approve' | 'reject' | 'other';
    consequence: string;     // ≥ 1 char
  }>;                        // ≥ 2 entries
}
```

- **Rule for Step 1:** every proposal has exactly one `approve` choice and exactly one `reject` choice. This is what the approval page needs (Needs §4 Q1, FM 468 "its approve and reject inputs").
- **`other` is reserved** for later kinds with more than two outcomes. An example is Gate 5's accept, rework or cancel (Main 459). In Step 1, a row with an `other` choice can't be listed, because the Step 1 row has no field for it. Section 7 says how it gets one.
- **Route 54 stays "choose an option" (Routes row 54).** It still sends a free `choice`, and the server checks it against `options.choices`. Approve and reject are the two named choices, not a separate API.
- **A proposal that doesn't fit (INT, section 8 item 3):** if route 52 finds an open proposal whose `options` doesn't parse, the server logs it and still lists the row, with `approve` and `reject` absent. The page shows it as not decidable. The list never fails and never drops the row silently. `approve` and `reject` are therefore optional in the schema, and present on every row whose `options` parse.

## 4. Route 53: one proposal

- **Path:** `GET /api/proposals/{proposalId}`, unchanged.
- **Output:** changes from `ProposalDto` to `ProposalViewDto`:
  - every field of the `proposal` member (section 2.2), so `/decisions/proposal:<id>` and "Review version N" show exactly what the list shows (Needs §4 Q3);
  - and the resolution fields: `state` (`ProposalState`), `choice`, `choiceReason`, `resolvedBy`, `resolvedAt` and `rowVersion`. These come straight from `proposals`.
- **`ProposalDto` stays as it is** for the other routes that return it (routes 32 and 97 in m1).
- **A resolved or expired proposal** still returns 200 from route 53, with its `state`. That's how the page shows "decided elsewhere".
- **A factory PR has no read for one row in Step 1 (INT, section 8 item 4).** Routes 72 and 73 have no single get. In Step 1, `/decisions/factory_change:<n>` is drawn from route 52's row, and "Open" goes to GitHub (`url`). A single read, `GET /api/factory/changes/{changeId}` (route 103), waits for the factory-change screens.

## 5. Route 54: the decision

```
POST /api/proposals/{proposalId}/decisions
Idempotency-Key: <one per tap; reused only to retry that same request>
{ proposalId: UUID, version: int ≥ 1, choice: string ≥ 1, reason: Reason }
```

- **The input is m1's `DecideProposalInput`, unchanged.** `version` is `proposals.version` (Q4, D25), and `reason` is required for both choices (Routes line 16; m1 `Reason`, trimmed, at least 1 character).
- **No step-up.** Approvals never ask for a password (Main 444).
- **Output:** `ProposalViewDto` (section 4), in its resolved state.
- **What it writes, in one transaction:**
  - the `proposals` row: `state = 'resolved'`, `choice`, `choice_reason = reason`, `resolved_by = the operator`, and `resolved_at = now()`. `proposals_resolved_ck` requires all four set together;
  - `row_version + 1`;
  - one `activity_log` row (Plan item 8).

  Step 1 emits no event for a decision: the 12 Step 1 kinds have none (Slice section 5). The page refetches route 52 after a 2xx (Needs §2).
- **Checked in this order, with the error for each:**

| # | Check | Error |
| --- | --- | --- |
| 1 | The body fails its schema, or the `proposalId` in the body doesn't match the one in the path | `BAD_REQUEST` 400, with `details` naming the field |
| 2 | No such proposal | `NOT_FOUND` 404 |
| 3 | `state` isn't `open`, or `expires_at ≤ now()` (counted as expired even before the expiry job runs) | `INVALID_TRANSITION` 422, `details: { state: 'resolved' \| 'expired', allowed: [] }` (Needs §4 Q4) |
| 4 | `version` ≠ `proposals.version` | `STALE_VERSION` 409, `details: { field: 'version', currentVersion }` (D21) |
| 5 | `choice` isn't one of `options.choices[].choice` | `BAD_REQUEST` 400, `details: { field: 'choice' }` |

- **Concurrency:** two decisions on the same row race on `UPDATE … WHERE id = $1 AND state = 'open' AND version = $2`. The one that updates no row re-reads the proposal and gets check 3 or 4. It never gets a 500.
- **Idempotency** follows the shared middleware: `IDEMPOTENCY_KEY_REUSED` or `IDEMPOTENCY_IN_PROGRESS` (Slice section 5). A replay with the same key and body returns the first response, even though the row is now resolved.
- **Done-when test 14** needs a seeded `missions` row and a seeded `clients` row behind the proposal, because `proposals.mission_id` is NOT NULL and has a foreign key.

## 6. Answers to Zero's questions (Needs §4)

1. **Approve and reject choices:** `choice` stays a string. Each row carries `approve.choice` and `reject.choice`, and the page never parses `options` (section 3.2).
2. **Title, evidence and consequence:** the server builds them in Step 1 from the proposal's kind label and `subject_key`, from `proposals.reason`, and from the option's `consequence`. CR-W9's `plain` block replaces their source later, and the field names stay the same (section 3.1).
3. **One row for one `ref`:** route 53 returns the row's fields plus the resolution fields (section 4). A factory PR has no single read in Step 1: its row links to GitHub, and route 103 waits for the factory-change screens.
4. **Resolved or expired:** `INVALID_TRANSITION` 422, `details: { state, allowed: [] }`. Route 53 still returns the row with its `state`.
5. **Mission label (INT):** `clientName`, nullable, `clients.name` through `missions.client_id`, a read-only join (section 2.1). No `missionName` in Step 1: the map's `missions` has no name column.
6. **Cost (INT):** `costImpact?: { micros, estimated }` is in the shape, and Step 1 never sends it (section 2.2).
7. **Order:** oldest first, by `createdAt` ascending and then `ref` ascending, across both members. For proposals that's also nearest-to-expiry first. The `nextCursor` is opaque and encodes `(createdAt, ref)`.

**Also in route 52:** only open proposals whose `expires_at > now()` are listed, and resolved proposals are never listed. A decided proposal is gone from route 52 as soon as route 54 returns (Needs §2).

## 7. Not in Step 1

| What | Arrives | What it adds to CR-W2 |
| --- | --- | --- |
| Checkpoint approvals (`checkpoint:<checkpointId>`) | Step 7 (Gate 0 with Canon) | a member bound to the checkpoint's `rowVersion`; the map's pending-decisions index lists `checkpoints (session_id) WHERE state = 'draft'` |
| Finalize, approval #1 (`finalize:<missionId>`) | Step 7 / 8 | a member bound to the plan `version` (Q4) |
| Pass approvals (`pass_approval:<missionId>`) | Step 9c | a member bound to `receiptHash`, with a reason |
| Releases, approval #2 (`release:<missionId>`) | Step 9c / 10 | a member bound to `receiptHash`; the map's index lists `missions (state) WHERE state = 'awaiting_release'` |
| Findings in triage or disputed | Step 9c | the map's index lists `findings (mission_id) WHERE state IN ('triage','disputed')`. Whether they belong in route 52 is for INT, since INT's brief doesn't list them |
| Draft human time, open pauses | later | also in the map's pending-decisions index. Not in INT's list, and unscoped here |
| Filling `costImpact` (the field is already in the Step 1 shape) | once metering exists, for `budget_increase` (route 32), `contract_change` and `repin` (INT, Q6) | the source of `micros` and `estimated`, which `proposals` has no column for today |
| Choices beyond approve and reject (`effect: 'other'`, for example Gate 5) | Step 9c | a `choices: DecisionChoice[]` field on the `proposal` member |
| `notAllowedReason` | when a listed decision can't be decided yet | not needed in Step 1: every listed proposal can be decided |
| A factory PR's area (knowledge entry, rule, skill, template or roster; FM 84) | Step 12 | the folder layout for skills and the roster isn't in the docs yet, so it can't be traced to a source now |
| A single factory-PR read, `GET /api/factory/changes/{changeId}` (route 103) | the factory-change screens | a detail page for `factory_change:<n>` |
| Merging a factory PR from the page (route 73, `headSha`) | the step that builds route 73 | factory PRs are read-only in Step 1 |
| CR-W9's `plain` block | when CR-W9 is accepted | becomes the source of `title`, `evidence` and `consequence` |
| A decision event (for example `proposal.resolved`) | the step that brings the live stream to Decisions | it isn't one of the 12 Step 1 kinds |

## 8. INT's decisions (Nov 6)

1. **`clientName`, not `missionName`.** The row carries `clientName` (`clients.name` through `missions.client_id`), nullable, and null for a factory PR. There's no `missionName` in Step 1. **Note for Plan line 89 (Step 1's tables):** route 52 reads `missions` and `clients`, read only, alongside `proposals` (read and decide). Test 14's seed also needs a `missions` row and a `clients` row, because `proposals.mission_id` is NOT NULL with a foreign key.
2. **`ProposalOptions`** is accepted as drafted (section 3.2).
3. **An open proposal whose `options` doesn't parse** is listed and logged, with `approve` and `reject` absent, so it can't be decided (section 3.2).
4. **No single factory-PR read in Step 1.** The row links to GitHub. Route 103 waits for the factory-change screens (section 4).
5. **The changes to `packages/contract` go into the Step 1 slice, not sprint-00's m1.** m1 has been reviewed and stays as it is: `PendingDecisionDto = Placeholder` (D30). The Step 1 slice:
   - makes `PendingDecisionDto` the union in section 2;
   - adds `ProposalViewDto` as the output of routes 53 and 54;
   - adds `DecisionChoice` and `ProposalOptions`;
   - narrows `FactoryChangeDto.changeId` to digits, and gives route 72's row `prNumber`, `url` and `title` where it is a `Placeholder` today;
   - records the change to D30 for routes 52 and 72.
