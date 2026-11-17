# CR-W5: the mission list's summary and the status read (accepted, contract 1.0.0)

**Accepted by INT, Nov 8, 2026.** Written by Axis for INT, from Zero's frontend sprint-02 escalations 01 and 03 and the `clientName` part of 02. Nothing here is built yet. The shapes go into `packages/contract` with the Step 1 slice's `1.0.0` (INT, Nov 8, item d). The server sends them once it builds the routes (section 5).

**What it decides:**
- the summary on route 19's rows: `clientName`, `needsYouCount` and the onboarding step;
- `GET /api/status` and its waiting total;
- the shape of route 21's `onboarding.progress`.

**What it leaves for later:** the rest of FM's CR-W5 (gate strip, running dispatches, slots, alerts, `stallAfterMs`). Each is listed in section 6 with what it waits on.

## Sources

| Short name | Where |
| --- | --- |
| FM | `docs/design/AVEL Web App — Frontend Map v0.6.md`: line 252 (`stallAfterMs`), 290 ("never one request per mission"), 471 (CR-W5), 493 (`GET /api/status`, +1 route) |
| Brief | `docs/design/AVEL Shell Layout brief v1.9.md`: lines 32, 79 and 81 |
| Map | `docs/design/DATABASE.md`: `missions`, `clients`, `onboarding_sessions` |
| Canon | `docs/design/Canon onboarding v0.5.md`: "Stages in detail" and "Stage state machine" |
| CR-W2 | `docs/design/CR-W2 Pending decisions.md`: section 2.1 (`clientName`), section 6 ("Also in route 52"), section 7 (later kinds) |
| CR-20 | `docs/design/CR-20 Mission name.md`: `missions.name` |
| Esc | `docs/agent-dispatch/frontend/sprint-02/escalations/01-waiting-counts.md`, `02-project-names.md`, `03-onboarding-step.md`, with Axis's answers |
| S1 | `docs/agent-dispatch/backend/sprint-01/decisions.md`: S1-2 (the version rule), S1-9 |

## 1. Route 19's row: `MissionListRowDto`

**What changes on route 19:**
- **Input:** unchanged, `ListMissionsInput`.
- **Output:** `Page(MissionDto)` becomes `Page(MissionListRowDto)`.
- **`MissionDto` stays table-shaped.** Routes 20 to 25 still return it. CR-20 adds `name` to it.

```ts
MissionListRowDto = MissionDto & { summary: MissionSummary }   // z.extend(MissionDto, { summary })

MissionSummary = {
  clientName: string,                        // 1.1
  needsYouCount: int,                        // 1.2, ≥ 0
  onboarding: OnboardingStep | null,         // 1.3
}

OnboardingStep = { step: 1 | 2 | 3 | 4 | 5, of: 5 }   // `of` is the literal 5
```

**Every value in `summary` is computed by the server.** The web never derives one (FM 290; Esc 03).

### 1.1 `clientName`

- **Source:** `clients.name`, read through `missions.client_id`. It's a read-only join, as in CR-W2 section 2.1.
- **Not nullable:** `missions.client_id` and `clients.name` are both required (Map). Route 52's `clientName` is nullable only because a factory PR has no mission.
- **Archived clients:** an archived client still has its name, so it's still sent.

### 1.2 `needsYouCount`

- **What it counts:** the rows route 52 would list whose `missionId` is this mission. This is one rule, shared with route 52's query, so the badge and the list can't disagree.
- **What that means in Step 1:**
  - **Counted:** proposals with `proposals.mission_id` = this mission, `state = 'open'`, and `expires_at > now()` (CR-W2 section 6).
  - **Not counted:** factory PRs. They belong to no mission.
- **Later kinds:** each kind CR-W2 section 7 adds to route 52 joins this count in the same change, because its row carries a `missionId`.

### 1.3 `onboarding`

**How the step is worked out from the mission's session:**
- **Which session counts:** the mission's latest `onboarding_sessions` row (by `created_at`) whose `status` isn't `abandoned`.
- **No such row:** `null`.
- **Otherwise:** `step` comes from that session's `stage`, by the table below. A `paused` or `context_blocked` session keeps its step.

| `stage` | `step` | Why (Canon) |
| --- | --- | --- |
| `opener`, `discovery` | 1 | `opener → discovery` happens when the session is created, in the same transaction ("Stage state machine", first row), so the opener isn't a step you wait on |
| `breakdown` | 2 | Stage 3, checkpoint 0.2 |
| `mission_roster` | 3 | Stage 4, checkpoint 0.3 |
| `context` | 4 | Stage 5, checkpoint 0.4 |
| `finalize` | 5 | Stage 6 |
| `finalized` | `null` | onboarding is over |

- **The fast path** (`0.1+0.2`: `discovery → mission_roster`) goes from step 1 to step 3, and `of` stays 5.
- **Reopening a checkpoint** moves `stage` back, and the step follows it.
- **The mapping is a function in the server's `onboarding` module.** A test walks every value of `Stage` through it, so a new `Stage` value without a step fails CI (Canon's own rule: "a test that walks every stage").

## 2. Route 21: `onboarding.progress`

- **The shape:** `MissionDetailDto.onboarding.progress` is a `Placeholder` in m1 (`dto/missions.ts`). It becomes `OnboardingStep | null`, worked out by section 1.3's rule.
- **Why:** the sidebar and the project page then show the same step.
- **Still placeholders:** the gate strip and `why` (section 6).

## 3. `GET /api/status`: `StatusDto`

| Item | Value |
| --- | --- |
| Method and path | `GET /api/status` |
| Route number | `null`, like CR-16's routes (`route.ts`; FM 493 counts it +1) |
| Group | `decisions` (tag "Decisions"). FM 471 names its screens: "Decisions home, top bar" |
| Caller | an operator session. No step-up, and no `Idempotency-Key` (it's a read) |
| Input | none |
| Output | `StatusDto` |
| Errors | the base map only: `UNAUTHORIZED` 401 with no session |

```ts
StatusDto = {
  waiting: { total: int },      // ≥ 0
}
```

**What `waiting.total` counts:**
- **The rule:** exactly the rows route 52 lists, all kinds, on every page.
- **In Step 1:** open, unexpired proposals, plus open factory PRs. The factory PRs come from the same GitHub read that route 52 uses (CR-W2 section 2.3). How long that read is cached is the server's choice, as it is for route 52.
- **Later kinds** join it as they join route 52.
- **Not by mission:** the per-project numbers are route 19's `needsYouCount`, so the web never sums them itself.

**One object, so CR-W5 can grow:** each later field in section 6 is added as an optional output field, which is a minor bump (S1-2).

## 4. What doesn't change

- **Route 52** keeps `Page(PendingDecisionDto)`, with no total. `Page` is the one cursor wrapper every list route shares (`dto/common.ts`).
- **CR-W2** is unchanged. Route 52 still has no `missionName` (CR-20, "Not in this CR").
- **No table or column changes** (`missions.name` is CR-20's).
- **No new event kind.** The web refreshes these through the invalidations it already has. A decision event arrives with CR-W2 section 7's row for it.

## 5. Contract, version and who serves it

**`packages/contract` changes, all in the Step 1 slice's `1.0.0`:**
- `MissionSummary`, `OnboardingStep` and `MissionListRowDto` in `dto/missions.ts`;
- route 19's output becomes `Page(MissionListRowDto)`;
- route 21's `progress` gets its shape;
- `StatusDto` in `dto/decisions.ts`;
- `GET /api/status` in `routes/decisions.ts`.
- `test/routes.test.ts` and `test/fixtures/expected-routes.ts`: the expected list grows from 102 to 103, with `GET /api/status` added after CR-16's 3.

**The version:**
- **Why `1.0.0`:** `1.0.0` is the first released version (S1-2's start value), so nothing here needs a separate bump.
- **After `1.0.0`:** CR-W5's later fields are minor bumps.

**The mock** (`packages/contract-mock`, the frontend's) can serve all of this from `1.0.0`, and Zero's stand-ins end there.

**The server:**
- **Route 19 and route 21** send these fields when the step that builds the missions routes builds them. That isn't Step 1: Step 1 reads `missions` only for route 52 (Step 0 and Step 1 plan, "Tables touched").
- **`onboarding`** is always `null` until Step 7 creates sessions.
- **`GET /api/status`** is built by the first step whose slice lists it. Its data exists from Step 1, so it can come early if INT wants it there.

**Tests (for that step's done-when):**
- `needsYouCount` equals the number of route 52's rows with that `missionId`, on a seed that has proposals which are open, resolved and expired, and on more than one mission.
- `waiting.total` equals the count of all of route 52's rows, across pages.
- Every `Stage` value maps by section 1.3's table.
- An abandoned session is skipped.

## 6. Not in `1.0.0`

| What (FM 471) | Waits on | Its shape later |
| --- | --- | --- |
| Gate strip on route 19's rows (and route 21's `gateStrip`) | the gate step (Step 3) and its write-up | a `summary.gateStrip` field |
| Running dispatches per mission | the scheduler (Step 9b) | a `summary` count |
| Slots busy of 6 | the scheduler (Step 9b) | `StatusDto.slots` |
| Alerts | an alert list in a design doc. None exists yet | `StatusDto.alerts` |
| `stallAfterMs` (FM 252: 10 minutes, the same as the factory alert) | the first screen with an attempt clock (live streams, Step 5) | `StatusDto.stallAfterMs` |
| Spend and budget | already on `MissionDto`, and shown on Business only (FM 471) | no change |
