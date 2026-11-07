# CR-W2, Step 1: what the approval page needs from a pending-decision row

Zero (frontend lead), 2026-11-06. Draft for INT and Axis. **Not a UI contract** and not a DTO: it says what the page has to show and send. Axis owns the shape in `packages/contract` (D30 makes route 52 decide it in Step 1). Field names below are only for clarity. Where I propose one, Axis can rename it.

## Scope (INT, 2026-11-06)

- **Step 1 only.** Two kinds of row:
  - **Proposals**, decided through routes 52 to 54. Approve or reject, bound to `proposals.version`, with a reason always required and one `Idempotency-Key` per tap.
  - **Open factory PRs**, read-only.
- Other decision kinds (checkpoints, finalize, pass approval, release, CR-W11's package commit) join in later steps.
- The Nov 3 write-up ("CR-W1 W2 W5 W9 W10: What the first screens need") is lost, so this starts fresh.

## Sources

- **Frontend Map v0.6** (FM):
  - line 468, CR-W2: "a stable `ref`, kind, target IDs, the version or hash to bind, a summary (title, evidence, cost impact in micros when the decision changes spend, consequence), and its approve and reject inputs"
  - line 161: `/decisions/$ref`, "`ref` is `kind:id`", a sheet on desk and a full page on the phone
  - line 86: money on decisions
  - lines 205 to 209: Writes
  - lines 214 to 222: errors by code
  - line 134: displayed, never computed
- **Design library v1.1** (DL):
  - `DecisionTag`: states new, seen, approving, approved, stale (409) and not allowed. Fields `title`, `binds`, `evidence`, `cost {amount, estimated, note}`, `consequence`, `notAllowedReason`, `staleNote`, `staleAction` and `age`.
  - The Decisions screen's card: Why, If you approve, Money, and "For the record".
  - `ReasonDialog`, `ErrorPanel` copy (`AV_ERROR_COPY`), and the `WidgetState` empty and staleVersion states.
- **m1 contract**, at commit e36737f on `backend/sprint-00/agent-axis-m1-contract-api-contract-a1`. It passed review and isn't merged yet:
  - `ProposalDto`
  - `DecideProposalInput = { proposalId, version, choice, reason }`
  - `Reason` = trimmed, at least 1 character
  - `StaleVersionDetails`
  - `FactoryChangeDto = { changeId, headSha, change: Placeholder }`
  - the error map
- **Others:** API routes.md, "Rules on every write" (line 16). API and data reference: "Approvals never ask" (no step-up). Step 0 and Step 1 plan: item 13 and done-when test 14.

## 1. The row: one union, two members

The page needs a discriminant that separates a **decidable proposal** from a **read-only factory PR**. Both members come from route 52's `Page<…>`. Every value below comes from the server. The page formats it and never derives it (FM line 134).

### Fields on every row

| Need | Why the page needs it | Source |
| --- | --- | --- |
| `ref`: a stable `kind:id` string | The URL `/decisions/$ref`, the list key, and the item a stale event or a 409 points at. It mustn't change when the proposal's version changes. | FM 161, 468 |
| The discriminant (proposal or factory PR) | Picks the renderer, and whether Approve and Reject exist | INT scope |
| Title: one line, plain language | The tag's `h3` and the sheet title | FM 468; DL `title` |
| Evidence: why this is being asked (one or two sentences) | DL "Evidence" / "Why" | FM 468; DL |
| Consequence: what happens if you approve | DL "Consequence" / "If you approve" | FM 468; DL |
| Created at (ISO time) | The age ("Waiting 6m"), from the shared clock | DL `age` |
| A mission label: the mission's id and a display name, or null when there is no mission | DL shows "client, project" on each card. A bare UUID isn't readable. | DL Decisions screen |

### Proposal member: decidable

| Need | Why | Source |
| --- | --- | --- |
| `proposalId` | The path of routes 53 and 54 | m1 `DecideProposalInput` |
| `proposalKind` (`ProposalKind`) | The kind label and icon. The kit maps parked, contract_change, quarantine, test_change, gate5, repin and budget_increase to its variants, and the rest to the generic "Decision" (a kit job, not a CR-W2 need) | m1 value list; DL `AV_DECISION_VARIANTS` |
| `version` (int): exactly `proposals.version` as shown | The value route 54 binds. Also shown as "Binds to Version N" | FM 205; D25; m1 route 54 |
| **The approve choice and the reject choice**: the two `choice` values that route 54 accepts for this row, each with its button label | Route 54 takes a free `choice: string`, and `options` is untyped `Json`. The page can't guess which string means approve. FM 468 asks for "its approve and reject inputs". | m1 `DecideProposalInput.choice`, `ProposalDto.options` |
| Cost impact, only when approving changes spend: `amountMicros` (signed int, positive means more spend), `estimated` (bool), optional short `note` | Drawn with `CostImpact` as "+$3.40, estimated". **Missing means no spend change, and no money is shown.** A change whose amount is unknown is `amountMicros: null`, shown as "—" (DL). Never `0` for "doesn't apply". | FM 86, 468; DL `cost` |
| Optional: `notAllowedReason` (string or null) | Only if Step 1 can list a proposal that can't be decided yet. DL's "Locked" state shows it. Null when the proposal can be decided. | DL `notAllowed` |

`options` (raw), `subjectKey`, `reason` (the agent's reason for raising it) and `expiresAt` aren't needed on the row unless the server builds the evidence text from them. The page never reads `options` itself.

### Factory PR member: read-only

| Need | Why | Source |
| --- | --- | --- |
| `changeId` | Identity and the `ref` | m1 `FactoryChangeDto` |
| `headSha` | Shown as "Binds to Commit 3c91e07". Not sent anywhere in Step 1 | DL `binds`; Q4 |
| The PR's kind: knowledge entry, rule, skill, template or roster | The kind label | FM line 84 |
| The PR number and its GitHub URL | "Open" goes to GitHub, since there's no approve here | FM 468 "target IDs" |

The page shows no Approve and no Reject on this row, and no cost. The copy for "approved elsewhere / later step" belongs in the UI contract, not here.

## 2. What approve and reject send (route 54)

Both actions open the reason sheet first (`ReasonDialog`). A reason is required for either choice: API routes.md line 16, m1 `reason: Reason`.

```
POST /api/proposals/{proposalId}/decisions
Idempotency-Key: <new on the tap; reused only when this same request is retried>
{ proposalId, version: <row.version as shown>, choice: <row's approve or reject choice>, reason: <trimmed, ≥ 1 char> }
```

- **Built from the row on screen, never from a refetch:** FM 205, "Approve what you saw".
- **No step-up:** "Approvals never ask".
- **Never queued while offline:** FM 208.
- **On 2xx:**
  - "Approving…" or "Sending…" shows within 100ms of the tap (FM 207).
  - The punch plays on 2xx (DL), and the row leaves the list.
  - In Step 1 there's no live stream on this page, so the page invalidates route 52 on 2xx.
  - **Need:** the decided proposal is gone from route 52 as soon as route 54 returns.

## 3. The cases the page must handle

| Case | What the page shows | What it needs from the API |
| --- | --- | --- |
| Loading | `WidgetState` loading skeleton | — |
| **Empty** | "Nothing needs you" / "A decision appears here the moment the factory needs one." (DL Decisions screen) | Route 52 returns `{ items: [], nextCursor: null }` |
| More than one page | Load more with `nextCursor`, `limit` ≤ 100 (D23) | **A stable server order** (say which: oldest first?) |
| **`STALE_VERSION` 409** on route 54 | The row goes to stale: the "Changed" tag and the binding struck through. Copy: "Version {currentVersion} arrived while you were reading." Action: "Review version {currentVersion}", which refetches and shows the new version. It **never re-sends** (FM item 5, line 219). | `details: { field: 'version', currentVersion: int }` (D21). Plus: **one call that returns the current row, with its summary, for one `ref`** (see question 3) |
| `CONFLICT` / `ALREADY_EXISTS` 409 | The generic error, never the stale state (frontend decisions, 2026-11-06) | — |
| `IDEMPOTENCY_KEY_REUSED` 409 | A bug report with the request ID (FM 219) | — |
| `IDEMPOTENCY_IN_PROGRESS` 409 | Keep "Approving…", then retry with the same key | — |
| Already decided or expired (someone else decided it, or 7 days passed) | "Not allowed now", with the server's reason and the current state (FM 220) | **Which code**: 422 `INVALID_TRANSITION { allowed: [] }`, or 404? See question 4 |
| 400 `BAD_REQUEST` | Field errors beside the reason input | `details` naming the field |
| 401 | Redirect to `/login?next=` | — |
| 403 `FORBIDDEN` | "Not allowed", with the reason | — |
| 404 (route 53 or 54) | Not found, with a way back to the list | — |
| 429 | The action is disabled, with a countdown | `details.retryAfterMs` (m1) |
| Network / 5xx | Keep the last good list and mark it stale. Retry the decision with the same key | — |
| Factory PR row | Read-only: no actions, "Open" goes to GitHub | §1 |
| Every error | The request ID is shown and can be copied | `requestId` (m1 error body) |

## 4. Questions for Axis (and INT where it's scope)

1. **The approve and reject choices.** Does route 54 keep `choice: string` with two values given on each row? Or does CR-W2 fix `choice` to `'approve' | 'reject'` for Step 1's kinds? Either works for the page, but it must not parse `options`.
2. **The title, evidence and consequence text.** These columns don't exist in `proposals`. Does the server compose them in Step 1 (from `kind`, `subjectKey`, `reason` and `options`), or do they wait for CR-W9's `plain` block? If they wait, what's the minimum Step 1 sends?
3. **One row for one `ref`.** `/decisions/$ref` and "Review the new version" need the same summary as the list row. Route 53 returns `ProposalDto`, which has no title or cost. Does route 53 return the row shape, or carry the summary? And can a factory PR `ref` be read alone? Routes 72 and 73 have no single get. If it can't, Step 1's factory PR rows have no detail page.
4. **A proposal that's already resolved or expired**, sent to route 54: which code and `details`?
5. **The mission label.** Step 1's table list (Step 0 and Step 1 plan, line 89) has `proposals` but not `missions`. Is the mission name available to route 52 in Step 1, or null for now?
6. **Cost in Step 1.** Which Step 1 proposal kinds carry a cost impact? I expect budget_increase, contract_change and repin. Is the figure measured or estimated? An empty answer is fine: the field is then just absent.
7. **The list order** of route 52.

## 5. Frontend items, not for CR-W2 (recorded so they aren't lost)

- **Approve takes a reason.** The kit's `DecisionTag` has no reason step on Approve, only on Reject. FM 209 lists "rejections" but not approvals. Route 54 needs a reason for both, so the UI contract will put the reason sheet before Approve too. That's for Fantem (kit) and Leon (`decisions`).
- **The reason length.** `ReasonDialog` defaults to `minLength` 3, and the contract's `Reason` accepts 1. The UI contract will pick one, and the client never accepts what the contract refuses.
- **The binding.** `DecisionTag.binds` shows a SHA. A proposal binds an integer `version`, so the kit needs a "Version N" binding form.
- **The 6-second Undo hold.** The library's Decisions screen holds an approval for 6s with Undo before sending. FM 207 says "answer a tap in under 100ms". The UI contract decides whether Step 1 keeps the hold; it changes nothing here.
