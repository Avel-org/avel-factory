# BRENNAN: approvals-uic review-spec, completion report

verdict: PASS

## Summary
Revision 5 of `docs/ui-contracts/decisions-approval-page.md` (at 20ecf34) closes all three a4 findings, 26, 27 and 28, each with a line it can be checked against. The diff from revision 4 (f323450) touches only those three answers, the status line and Appendix A. No closed finding reopened, and I found nothing new. The contract can be merged, and the rest of the sprint can build on it.

## Pre-flight
- **Branch:** `frontend/sprint-01/agent-brennan-approvals-uic-review-spec-a5`. **Start commit:** `20ecf34` (`AVEL_BASE`). `git log "$AVEL_BASE"..HEAD` was empty at start: the work under review is the file on main, as the task notes say.
- **Part 2 files, all present and read:**
  1. `.claude/agents/brennan.md`: read.
  2. `codebase-analysis.md`: read.
  3. and 9. `docs/ui-contracts/decisions-approval-page.md`: read whole, lines 1 to 607.
  4. and 10. `CR-W2 Pending decisions.md`: read whole, sections 1 to 8.
  5. and 11. Frontend `decisions.md`: read the "Revision 5" entry in full, and skimmed the rest for what the contract cites.
  6. Frontend Map v0.6: present. Read lines 134, 205 to 208 and 220, which the revision 5 text relies on.
  7. Design library v1.1: present. Grepped for BRENNAN-02's `data-ui` check.
  8. `Step 0 and Step 1 plan.md`: present. Unchanged since a4, and revision 5 cites nothing new from it.
  12. `cr-w2-needs.md`: present. Unchanged since a4.
  13. Backend `sprint-00/decisions.md`: read D21 (`:248`), D23 (`:271`), D25 (`:273`), D30 (`:279`) and D37 (`:298`).
  14. This task doc: read.
- **The role file's Read-first docs:** Backend modules and build plan, Roster setup and sessions, API and data reference, and DATABASE.md are all present. Revision 5 cites none of them.
- **m1:** `e36737f:packages/contract/src/errors.ts` and `dto/common.ts`, read.
- **Part 7 commands:** all available. `pnpm lint` first failed with `biome: not found`, because this new worktree had no `node_modules`. `pnpm install --frozen-lockfile --prefer-offline` fixed it, and the install changed no tracked file.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | this report's commit |
| BRENNAN-02 | DONE | this report's commit |
| BRENNAN-03 | DONE | this report's commit |

### What changed since a4
`git diff f323450 20ecf34 -- docs/ui-contracts/decisions-approval-page.md` has 27 changed lines, in these hunks:
- `:3`: the status line.
- `:48`: section 1.
- `:211` and `:212`: section 3's `parsePendingPage` and `selectPendingPages`.
- `:431`: 5.3's `notAllowedNow` action.
- `:442`: 5.3's `inProgress`.
- UC-17 (`:528`), UC-20 (`:531`), UC-23 (`:534`) and UC-26 (`:537`).
- Appendix A's a4 table (`:601` to `:607`).

Nothing else in the contract moved. The other changes in `f323450..20ecf34` that touch this sprint (`decisions.md` "Revision 5", `plan.toml`, and Ghost's and this task doc's re-render) match the contract. Ghost's GHOST-02 now names `parsePendingPage (one page) and selectPendingPages (route 52's infinite select)`. Revision 5 adds no † strings: every quoted string in the new lines already exists in revision 4.

### The a4 findings
- **26, route 52's infinite `select`: closed.**
  - `:48` and `:211`: `parsePendingPage` parses **one** page.
  - `:212`: `selectPendingPages(data: InfiniteData<Page>)` is the infinite query's `select`. It concatenates `rows` in page order, sums `unreadable` over the loaded pages and takes the last page's `nextCursor`.
  - These are the three rules the finding asked for. `Page` is D23's `Page<T>` notation (`sprint-00/decisions.md:271`).
  - UC-26 (`:537`) checks the sum. An item injected before the first Load more lands on page 2, so the band's `1` surviving page 3 is only true if `unreadable` is summed (`injectRawItem` is "the next response", `:103`).
- **27, scenario gaps: closed.**
  - **`inProgress`:** UC-20 (`:531`) uses `failNext(…IDEMPOTENCY_IN_PROGRESS…, { times: 4 })` with fake timers. It expects three re-sends 500ms, 1s and 2s apart, `Approving…` throughout, then `Couldn't reach the server.` with the fourth request's ID, and no fifth request. This matches 5.3 `:442` ("then as `network`, with the last request's ID").
  - **401:** UC-23 (`:534`) names both routes: 54 after confirming, and 52 on the first load without prefetched data. This covers 5.4's no-data `signedOut` row (`:453`).
  - **Testable on the mock:** both cases work. m1's `ErrorBody.code` is `z.string()` and `details` is optional (`errors.ts:95-99`), so a `failNext` with no `data` still decodes as `ApiError` with the right code. A 401 isn't retried, because retries happen only on `network` and `server` (`:207`).
- **28, UC-17's Refresh list: closed.**
  - UC-17 (`:528`) now runs `resolve` before the `"resolved"` `failNext`, and `expire` before the `"expired"` one. The store matches the error in every case, so "Refresh list drops the row" holds.
  - Route 52 lists only open proposals with `expiresAt > now` (`:166`; CR-W2 6, "Also in route 52"). CR-W2 check 3 counts `expires_at ≤ now()` as expired (CR-W2 5).
  - The new "Still listed" case (`failNext` alone) expects the row back in `seen`. 5.3 `:431` says the same for `notAllowedNow`, and `:435` (`notFound`, "as above") inherits it. That fits FM 134 and FM 220 ("with … the current state").

### No closed finding reopened
- **16 (request ID):** revision 5 only adds request-ID assertions, in UC-20 and UC-23.
- **22 (wire body) and 25 (default `limit`):** the lines are untouched.
- **23 (the sent request ID):** each re-send in UC-20 is a new request with a new `X-Request-Id` (`:197`), so "the fourth request's ID" is well defined against `requests()`.
- **a1's 01 to 14:** none of the text they rest on changed.

### BRENNAN-01: data and API
- **`selectPendingPages` reads only what route 52 sends.** It joins pages, sums a count of failed parses and passes through `nextCursor`. It derives nothing the server should send (FM 134).
- **m1's error codes:** `STALE_VERSION` (`errors.ts:39`), `INVALID_TRANSITION` (`:52`) and `TOO_MANY_REQUESTS` (`:33`) are present. The details UC-17 and UC-18 send are written raw through `failNext`, so m1's schemas don't constrain them (`:92-96`).
- **D21, D23, D25, D30 and D37:** no change to how the contract uses them since a4.
- **CR-W2 sections 5 and 6:** both headings are present, and both match the contract (see "Verification").

### BRENNAN-02: design
- The `comm` check prints only `DecisionsPage`, the one name marked †. Its decision is at `:361`, in Decisions "Revision 2".
- Revision 5 adds no component, prop, state, token or copy.

### BRENNAN-03: scenarios
There are 31 UC IDs.

| Row of 5.3 (route 54) | Scenarios |
| --- | --- |
| `stale` | UC-15, UC-16 |
| `notAllowedNow`, `notFound` | UC-17 |
| reason `badRequest` | UC-21 |
| other `badRequest`, `forbidden`, `idempotencyConflict`, `conflict`, `unprocessable` | UC-22 |
| `signedOut` | UC-23 |
| `rateLimited` | UC-18 |
| `inProgress`, both branches | UC-20 |
| `network`, `server` | UC-19 |

| Row of 5.4 (route 52) | Scenarios |
| --- | --- |
| Loading | UC-27 |
| Empty | UC-11 |
| No data, `signedOut` | UC-23 |
| No data, `network` or `server` | UC-27 |
| No data, anything else | UC-27 (403) |
| Data on screen | UC-27 |
| Unreadable | UC-24, UC-26 |
| `Load more` fails | UC-26 |

Every `plan.toml` done-when line (`:23` to `:29`) names scenarios that exist and cover it. The `IDEMPOTENCY_IN_PROGRESS` "with the request ID" part of `:27` is now covered by UC-20's run-out case.

## Findings
none

## Contract to files
- **26:** `decisions-approval-page.md:48`, `:211`, `:212`, `:537`, `:605`.
- **27:** `decisions-approval-page.md:442`, `:531`, `:534`, `:606`.
- **28:** `decisions-approval-page.md:431`, `:435`, `:528`, `:607`.
- **BRENNAN-01:** sections 1 to 3 and 5.3, against `e36737f:packages/contract/src/errors.ts`, `dto/common.ts`, CR-W2 sections 2 to 6, and D21, D23, D25 and D30.
- **BRENNAN-02:** sections 4 to 6, against the design library's HTML.
- **BRENNAN-03:** section 7, against 5.3, 5.4 and `plan.toml:21-29`.

## Deviations
- I ran `pnpm install --frozen-lockfile --prefer-offline` so that `pnpm lint` could run. It changed no tracked file.

## Limitations
- `apps/web` and `packages/contract-mock` don't exist yet. The build, typecheck and test commands match no project, so they check nothing.
- m1 is read at `e36737f`, as the task doc says, not from a merged `packages/contract`.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
None of these is a finding:
- **Leon and Zero (decisions build and review):** 5.3's `conflict` and `unprocessable` rows (`:443`, `:444`) also have `Refresh list`, but don't repeat `:431`'s sentence about a row the refetch still lists. Apply the same rule there: the page keeps no state the server doesn't send, so the `inlineError` clears and the row is drawn as the server sends it. UC-22 doesn't check what happens after the refresh.
- **Fenn (UC-20):** UC-20 runs on fake timers. Set up `user-event` with `advanceTimers` so the dialog's typing and confirm still work under them.
- **Ghost:** type `selectPendingPages`'s `Page` as route 52's output type, D23's `Page<T>`. m1 exports `Page` as a schema factory (`dto/common.ts:45`), not as a type.

## Files changed
```
$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-01/agent-brennan-approvals-uic-review-spec-completion.md
```
(after this report's commit; it was empty before)

## Verification
```
$ git show e36737f:packages/contract/src/errors.ts | grep -n 'STALE_VERSION\|INVALID_TRANSITION\|TOO_MANY_REQUESTS' && grep -n '^## [56]\.' 'docs/design/CR-W2 Pending decisions.md'
15:/** `STALE_VERSION`'s details (D21): the stale body field and its current value. */
33:  TOO_MANY_REQUESTS: {
39:  STALE_VERSION: {
52:  INVALID_TRANSITION: {
128:## 5. Route 54: the decision
161:## 6. Answers to Zero's questions (Needs §4)

$ comm -23 <(…BRENNAN-02's command…) <(…)
DecisionsPage

$ grep -o 'UC-[0-9][0-9]' docs/ui-contracts/decisions-approval-page.md | sort -u | wc -l
31

$ pnpm --filter "@avel/web..." build
No projects matched the filters in "…/frontend-sprint-01-agent-brennan-approvals-uic-review-spec-a5"
(exit 0)

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
No projects matched the filters in "…/frontend-sprint-01-agent-brennan-approvals-uic-review-spec-a5"
(exit 0)

$ pnpm lint
> biome check .
Checked 128 files in 66ms. No fixes applied.
(exit 0; before `pnpm install`: "sh: 1: biome: not found", exit 1)

$ pnpm --filter @avel/web test
No projects matched the filters in "…/frontend-sprint-01-agent-brennan-approvals-uic-review-spec-a5"
(exit 0)

$ git diff --name-only main...HEAD   # before this commit
(empty)
```
