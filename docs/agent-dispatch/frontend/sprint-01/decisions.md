# Frontend sprint-01: decisions

Lead: Zero. Scope (INT, 2026-11-05 22:22): Step 1's minimal approval page, served from `GET /api/pending-decisions` and `POST /api/proposals/{proposalId}/decisions` (Step 0 and Step 1 plan, Step 1 item 13; done-when test 14).

## 2026-11-05: on hold, no dispatch

- **Decision:** No UI contract, no tests lock, no dispatch until Axis reports that backend sprint-00's `packages/contract` is locked. Source: INT's message of 2026-11-05 22:22.
- **Why I can't write the UI contract early either:** the inputs it has to quote word for word aren't in the repo yet:
  - `packages/contract` doesn't exist (Step 0 builds it).
  - `docs/design/API and data reference.md` has only the overview. Its Routes and DTOs tabs aren't in `docs/design/` (the same files INT told Axis to wait for), so the shapes of the pending-decision DTO and the decision input aren't written down anywhere I can cite.
  - The CR-W2 write-up ("CR-W1 W2 W5 W9 W10: What the first screens need", Nov 3, cited in Frontend Map v0.6, Contract change requests) isn't in the repo. CR-W2 sets the pending-decision union this page renders.

## 2026-11-05: thin W0 slice inside sprint-01

- **Decision (INT):** option (a). Sprint-01 includes a thin W0 slice: Nemi (app config and tokens), Ghost (data core and a contract mock for the Decisions routes only), Fantem (the minimum kit). Leon's `decisions` module follows. No separate frontend sprint-00. Frontend Map v0.6, Build order for the web, W0 and W1.

## 2026-11-05: routes 52 to 54, still on hold

- **Input:** `docs/design/API routes.md` (commit 46e96a0), Decisions (3): route 52 `GET /api/pending-decisions`, route 53 `GET /api/proposals/{proposalId}` and route 54 `POST /api/proposals/{proposalId}/decisions`. Route 53 is now in scope too; Step 1 item 13 named only 52 and 54.
- **Rules that the UI contract will quote** (API routes.md, Rules on every write): route 54 needs an `Idempotency-Key`, carries the version it applies to (a stale version gets 409) and takes a written reason. No step-up (API and data reference, Conventions: "Approvals never ask").
- **Still on hold:** INT, 2026-11-05. The DTOs are still not written anywhere. API routes.md, "Not here", says they get drafted from the schema in Step 0. So the UI contract's data shapes wait for the locked `packages/contract`.

## 2026-11-05: INT's answers

- **Factory PRs (open item 4):** shown read-only on the minimal page. Only proposals are decided, through route 54. A factory PR's approval (route 73) isn't part of sprint-01.
- **Ghost (open item 2):** Ghost's frontend-data dispatch runs alongside the `avel-cli` work, not after it, with its own task doc and territory: `apps/web/src/data/**`, `apps/web/src/lib/**` and `packages/contract-mock/**` (Roster setup and sessions, rule 4; Frontend Map v0.6, Territories for Gate 1).

## 2026-11-06: the stale-version error is `STALE_VERSION`

- **Input (INT, from Axis):** backend sprint-00 slice, commit 5e45543, `docs/agent-dispatch/backend/sprint-00/contract.md`, error table and notes (lines 337, 345, 355) and `decisions.md` D21. I checked it in the commit:
  - `STALE_VERSION` (409): "the body's version isn't current; `details: { field, currentVersion }`". `field` is the stale body field (`rowVersion`, `version`, `receiptHash` or `headSha`); `currentVersion` is its current value, a number for `rowVersion` and `version`, a string otherwise.
  - `ALREADY_EXISTS` (409): a unique or partial-unique violation.
  - `CONFLICT` (409): "any other 409", the fallback only.
- **Decision:** the approval page's UI contract maps a 409 `STALE_VERSION` on route 54 to the stale state, and uses `details.currentVersion` to show that the proposal changed. It never re-sends with the new version (Frontend Map v0.6, In short, item 5: "A 409 opens the stale state instead of approving something newer"). `CONFLICT` and `ALREADY_EXISTS` get the generic error state, never the stale state. Ghost's contract mock returns `STALE_VERSION` with that `details` for a stale version, and the data core's `toUiError` keys the stale state on `STALE_VERSION` alone.
- **This differs from Frontend Map v0.6**, line 393, which defines `CONFLICT` as "stale version, not 'already exists'". The contract wins (the contract is the only API, Frontend Map v0.6, In short, item 3). The UI contract will cite the contract, and the Map's line needs updating in its next version. That's INT's doc, so I'm only flagging it.
- **Provisional:** this is the slice under Brennan's re-review (D22, a2), not the locked `packages/contract`. It's re-checked against the locked contract before the UI contract is written. Still on hold.

## 2026-11-06: m1 contract passed review; route 52 is a plain `Placeholder`

- **Input (INT, 2026-11-06):** Axis's m1 contract passed Brennan's review (review-spec a1, PASS, de8b053). Checked against `docs/agent-dispatch/backend/sprint-00/decisions.md`, D21, D25 and D30.
- **Route 52 (D30, finding 02):** `PendingDecisionDto` is a plain `Placeholder` (a JSON record). Axis's `source: 'proposal' | 'factory_change'` union is gone; CR-W2 (still open) asks for a different shape, and Step 1's routes 52 to 54 decide it.
- **Decision:** nothing frontend codes against a route 52 shape yet: no UI contract field list for the pending-decision row, no contract-mock fixture with fields, no data-core type beyond `Placeholder`. The plan for the factory PR row (read-only, open item 4) stands but can't be keyed on `source` until the shape is decided.
- **Stale versions (D21), re-confirmed:** `STALE_VERSION` 409 with `details: { field, currentVersion }`. The 2026-11-06 entry above stands, and is no longer only provisional on the slice: m1 carries it.
- **Correction to open item 3:** route 54 sends `version`, not `rowVersion` (D25: "Approvals send Q4's field: `version` (finalize, decisions)"). So on route 54 a stale decision comes back as `STALE_VERSION` with `field: 'version'` and a numeric `currentVersion`. The minimal page binds the proposal's `version`.
- **Still on hold:** m1 merges only after Rigg's m1 tests lock (D36, "Merge order for m1"). No UI contract, no tests lock, no dispatch until then, and the pending-decision row waits on Step 1's decision on CR-W2.

## 2026-11-06: CR-W2 is written fresh, Step 1 only

- **Input (INT):** the Nov 3 write-up is lost, so CR-W2 is written again. Scope is Step 1 only: proposals through routes 52 to 54 (approve or reject, bound to `proposals.version`, a reason always, one `Idempotency-Key` per tap), plus factory PRs, read-only.
- **Done:** what the page needs is in `cr-w2-needs.md` (uncommitted). INT and Axis are told. Axis owns the shape. Its section 4 has 7 open questions, and its section 5 lists frontend-only items for the UI contract: a reason on Approve too, the reason's minimum length, a "Version N" binding in the kit, and the 6s Undo hold.
- **Still on hold:** no UI contract until Axis answers and m1 merges.

## 2026-11-06: INT's scope answers on CR-W2 (needs questions 5 and 6)

- **Q5 (superseded below: `clientName`):** `missionName` is in the row, nullable (null when there's no mission). The page shows the name when it's set, and no mission label when it's null.
- **Q6:** `costImpact` is optional and absent in Step 1. When it's absent the page shows no cost (Frontend Map v0.6, line 86). The UI contract still covers the field for later steps, but Step 1's mock fixtures and tests use no cost.
- **Q1 to Q4 and Q7:** Axis answers them in the CR-W2 draft. I'll check that draft against `cr-w2-needs.md` before writing the UI contract.
- **Section 5** (the reason on Approve, the reason's minimum length, the "Version N" binding, the 6s Undo hold) stays with me, for the UI contract.

## 2026-11-06: INT's CR-W2 calls (these supersede the Q5 answer above)

- **`clientName`, not `missionName`:** missions have no name column. `clientName` is nullable, and null on a factory PR. The page shows the client's name as the row's label, and no label when it's null.
- **An open proposal whose options can't be parsed** is listed without Approve or Reject: it can't be decided. The page draws it with the kit's "not allowed" (Locked) state and no actions. When I check Axis's draft, I'll check how the row says this (a flag, or the choices being null) and whether it carries a reason the page can show. Without one, the reason copy goes in the UI contract.
- **No detail page for a factory PR in Step 1.** The row links to GitHub. `/decisions/$ref` resolves proposal refs only. A factory PR ref there gets the not-found state, with a way back to the list.
- **Next:** INT tells me when Axis's draft is accepted. Then I check it against `cr-w2-needs.md` and write the UI contract.

## 2026-11-06: The UI contract

- **Input (INT):** CR-W2 is accepted (`docs/design/CR-W2 Pending decisions.md`, D37). Plan sprint-01 against it. The contract code for routes 52 to 54 lands with backend Step 1, so the mock follows CR-W2 until then.
- **Written:** `docs/ui-contracts/decisions-approval-page.md` (a draft for Brennan's review), plus `plan.toml`, rendered and `--check` clean (23 files, uncommitted). Brennan's `agent-brennan-approvals-uic-review-spec` goes first. Everything else waits for it to merge, and the builds also wait for backend m1.

**Scope choices (contract section 0):**
- **No `/decisions/$ref` in sprint-01.** It needs route 53's `ProposalViewDto` (CR-W2 section 4), which isn't in m1. Without it, the mock can't return the summary through the contract. Step 1 item 13 names only routes 52 and 54.
- **"Review version N" refetches route 52** instead of reading route 53. The row keeps its `ref`, so it comes back with the new version.
- **No live stream, shared clock, `/login`, Undo hold, J/K/A keys, "new" pulse or per-kind registries.** All W1, W2 or W5. The age is computed against the time of the last fetch.
- **No cost shown:** `costImpact` is absent in Step 1 (INT).

**The CR-W2 bridge (contract section 1):**
- Until the Step 1 contract exports CR-W2's union, the data core holds the only web copy of the row schema (`apps/web/src/data/pending-decisions.ts`), transcribed from CR-W2 sections 2.1 to 2.3.
- Route 52's `select` parses each `Placeholder` item with it. A row that doesn't parse is counted and shown as an alert band, never drawn half-right.
- The mock serves CR-W2 rows through m1's route 52, which is valid because `Placeholder` accepts any JSON record.
- `INVALID_TRANSITION`'s `state` is optional on the page, because m1's error data doesn't have it.

**Design choices (contract section 4, changes to the library's `DecisionTag`):**
- **Approve asks for a reason too** (route 54 requires one, CR-W2 section 5). Both choices use the library's `ReasonDialog` from its Decisions screen, and the tag's inline reject textarea goes.
- **The reason's minimum length is 3**, the library's default. That's stricter than the contract's 1, never looser.
- **A version binding is shown as `Binds to Version N`** in plain text, not a SHA chip.
- **New state `rejecting`**, with the button reading `Rejecting…`.
- **Factory PRs** keep "Needs you", show only the "Open on GitHub" link, and use the PR number as the id chip.
- **Proposals show no id chip.** A v7 UUID's leading characters are its timestamp, so a short form wouldn't tell rows apart.
- **The phone breakpoint is 899px,** from the library's Decisions screen.

**Behaviour choices (contract sections 3 and 5):**
- **Queries** use `staleTime` 30s, refetch on focus, and retry at most 3 times, only on network errors and 5xx. That's FM's "stream down" row, because there's no stream.
- **Mutations** are never retried automatically. The exception is `IDEMPOTENCY_IN_PROGRESS`: the same key is re-sent after 500ms, 1s and 2s.
- **A user Retry** re-sends the same key and the same body.
- **429** counts down from `retryAfterMs`, with no automatic re-send.
- **`stale` is keyed on `STALE_VERSION` alone.** `CONFLICT` and other 409s show the generic error.
- **Copy the library doesn't have** is written into the contract and marked as such: the unreadable-options reason, the 422 and 404 reasons, "That decision was settled elsewhere.", "Couldn't reach the server.", "You're offline.", the unreadable-rows band, and the bad-reason error.

**Territories (FM, Territories for Gate 1) — needs INT's confirmation:** FM says its rows are "the only web paths", but the app needs four files it doesn't place. Nothing overlaps.
- `apps/web/src/routes/__root.tsx` goes to Nemi: it's the theme-cookie shell, and Leon keeps `routes/index.tsx`.
- `apps/web/.gitignore` goes to Nemi, with the app config.
- `apps/web/src/router.tsx` goes to Ghost: it wires Router and Query (FM, Rendering and SSR).
- `apps/web/{vitest.config.ts,playwright.config.ts}` and `apps/web/test/setup/**` go to Fenn, as FM's "test config".

**Tokens:**
- Nemi's task checks all 533 name and value pairs in the library's token section against `apps/web/src/styles`.
- `--av-stall-after: 8m` is copied as it is: FM's follow-up changes the library's source, not the app.

**Reviews:**
- Zero (`review-frontend`) and Brennan (`review-spec`) review every build.
- Zane reviews the two dispatches that add dependencies (`w0-app`, `w0-data`).
- Leah reviews the page on a phone, with the 150 KB budget.

**Blocked:** escalation 01 (`escalations/01-workspace-apps-and-lockfile.md`). The workspace root doesn't list `apps/*`, Vitest's workspace doesn't collect `apps`, and `pnpm-lock.yaml` has no frontend owner. The proposal is that INT regenerates the lockfile when merging. Only Brennan's review of the UI contract can start before this is resolved.

## 2026-11-06: Revision 2 of the UI contract (Brennan's a1, FAIL, 14 findings)

- **Input:**
  - Brennan's `approvals-uic` review a1 is a FAIL (report 05e0318).
  - INT asked for all 14 findings to be fixed, P1s first, and decided 01, 13 and 14.
  - a1 isn't merged. Brennan's a2 re-reviews the new commit.
- **Done:**
  - `docs/ui-contracts/decisions-approval-page.md`, revision 2. Its Appendix A maps each finding to its answer.
  - `plan.toml`, re-rendered with `--check` clean:
    - the scenario ranges are renumbered (UC-01 to UC-31; end to end is now UC-29 to UC-31);
    - the done-when lines are updated;
    - a2's notes are added;
    - the BRENNAN-01 verify now finds CR-W2's `## 5.` and `## 6.`;
    - the BRENNAN-02 verify now lists the contract's data-ui names missing from the library (only `DecisionsPage`).
  - Escalation 02 (the contract version value).
  - All uncommitted.

**INT's calls:**
- **01:** the mock answers route 54 with **201**, as m1's `route()` and D26 do. The "isn't a create" claim is dropped.
- **13, missing `Idempotency-Key`:** `BAD_REQUEST` with `details: { field: "Idempotency-Key" }`. This is **provisional until Axis confirms it in the Step 1 slice**: no source gives the code or the details (API routes.md line 16 and the slice's contract.md say only "required").
- **13, the success answer:** it adds `state: "resolved"` and `resolvedBy`. In the mock, `resolvedBy` is a fixed UUIDv7, `MOCK_OPERATOR_ID = 0193a000-0000-7000-8000-000000000001`.
- **14, `X-Contract-Version`:**
  - The check is built in sprint-01. The data client compares the header against the version it was built with; the mock sends the header; a mismatch shows the reload banner.
  - The banner sits on the page (section 5.5), because sprint-01 has one page. It moves to the shell with W2.
  - m1 exports the header name but no version value. So `__AVEL_CONTRACT_VERSION__` is read from `packages/contract/package.json` at build time until Axis exports a constant (escalation 02).
  - A response without the header is ignored, not treated as a mismatch.
- **14, the waiting count:** **stays client-counted until CR-W5** sends a server count. The lead line and the `Waiting for you` count are the number of rows drawn, with `+` while more pages exist. FM line 134 asks for a server number. This one is presentation of what's on screen (the library's own lead counts the same way), and CR-W5 isn't accepted.

**My choices in revision 2:**
- **02, the reason dialog:** option (b). The dialog closes on confirm, so the row shows `Approving…` within 100ms. On a reason 400 it reopens with the reason it sent (`defaultReason`, change R2) and the error. Sending it again is a new body, so it takes a new key.
- **03, `ErrorPanel`:**
  - A panel draws its action only when the caller passes `onAction` (E1).
  - `conflict` gets the title `This couldn't be recorded.`†, and `unprocessable` gets FM line 220's `Not allowed now`. Neither ever uses the library's 409 copy (which is the stale copy) or its 422 copy (`A reason is required`).
  - Every panel row in 5.3 and 5.4 now names its action, or says it has none.
- **04, `DecisionTag`:** D1 to D12 list every difference from the library, each with its reason.
  - **Buttons per state (D8):** `stale` disables both, and `notAllowed` draws none, even with labels: route 54 would refuse either way.
  - **The phone actions (D11)** come from the library's Decisions card, `.pd[data-phone] .pd-actions`: a two-column grid, with Reject left and Approve right.
- **05:** screen scenarios added for every row in 5.3 and 5.4: 403, `IDEMPOTENCY_KEY_REUSED`, 401, other 400s, `CONFLICT`, `UNPROCESSABLE_CONTENT`, "settled elsewhere", loading, the two error states, `Load more` failing, and the version banner. UC-19 and UC-22 assert the request ID.
- **06:** a `limit` over 100 is `BAD_REQUEST` (m1's `PageQuery`). Nothing is clamped.
- **07:**
  - `failNext` has one signature, and its error body is written raw, past m1's error schemas. That's how a test sends Step 1's `INVALID_TRANSITION.state`.
  - `remove` is added.
  - UC-17 names the reason each case shows.
- **08:** the unreadable-rows band has no request ID. A successful page gives none to the screen, and its copy no longer asks for one.
- **09:** the approved time is route 54's `resolvedAt` (`formatClock`), not the browser's clock.
- **10, the value rule:** a value is a `--av-*` token, or the literal the library's own source uses for that element. Under reduced motion, the hole fill (the library's literal `160ms`) isn't animated (D12).
- **11:** every string and `data-ui` name that isn't the library's is marked † in the contract:
  - `data-ui="DecisionsPage"`;
  - `Approve this decision?`, and the approve description;
  - `Rejecting…`;
  - `Version {n}`;
  - `Open on GitHub`;
  - `Refresh list`, `Load more` and `Retry loading more`;
  - `This decision's options can't be read, so it can't be decided here.`;
  - `This decision was already made.`, `This decision expired.`, `This can't be decided now.` and `This decision no longer exists.`;
  - `The server didn't accept this reason. Write a few more words.`;
  - `This couldn't be recorded.` and `Couldn't reach the server.`;
  - `That decision was settled elsewhere.`;
  - `You're offline.`;
  - the unreadable-rows band;
  - `Request ID {id}`;
  - `AVEL was updated. Reload to use the new version.`
- **12:** each kit row lists the library props it ports and the ones it leaves out. `Icon`'s `data-ui` is `Icon`. `formatAgo` takes `number | null`, and a non-finite value gives `—`, as the library's does.

## 2026-11-06: Escalation 02 closed (Axis, backend sprint-01 S1-2)

- **Axis's answer:**
  - `@avel/contract` will export `CONTRACT_VERSION` from `src/version.ts`, always equal to `packages/contract/package.json`'s `version`. The server sends it in `X-Contract-Version`, and the web imports it.
  - **Bumps:** `feat(contract)` is minor, `feat(contract)!` is major, `fix(contract)` is a patch.
  - **Breaking changes:** removing or renaming a route, field, code or event kind; adding a required input; narrowing an input; adding a value to an output list.
  - **Versions:** m1 stays `0.0.0`. Step 1's api-contract sets `1.0.0`, with CR-W2's changes.
- **Sprint-01 is unchanged:** it keeps the build-time read. `__AVEL_CONTRACT_VERSION__` comes from `packages/contract/package.json` (Nemi's `vite.config.ts`, Fenn's `vitest.config.ts`), and the data core exports it as `BUILT_CONTRACT_VERSION` (UI contract section 3). Today that's `0.0.0`.
- **The switch:** it comes with the dispatch that moves the web onto the Step 1 contract (`1.0.0`), alongside replacing the local CR-W2 schema (UI contract section 1). That dispatch:
  - makes `BUILT_CONTRACT_VERSION` re-export `CONTRACT_VERSION` from `@avel/contract`;
  - drops `__AVEL_CONTRACT_VERSION__` from both configs;
  - makes the mock's `createMock({ contractVersion })` default to `CONTRACT_VERSION`.

  The comparison stays an exact string match (FM line 226: "if it differs"). Axis's bump rules decide when the string changes.

## 2026-11-06: Revision 3 of the UI contract (Brennan's a2, FAIL)

- **Input:**
  - Brennan's a2 (0337449) closed 12 of a1's 14 findings. 04 and 12 stay open, narrowed. 15 to 21 are new.
  - INT gave 15's shape and asked for revision 3 covering all of them. Brennan's a3 re-reviews it.
- **Done:**
  - `docs/ui-contracts/decisions-approval-page.md`, revision 3. Appendix A has a table for a2's findings.
  - `plan.toml`, re-rendered with `--check` clean:
    - the `[analysis]` note now says UC-01 to UC-31 (finding 20);
    - the change ranges are updated (R1 to R4, E1, W1, D1 to D14);
    - Ghost's tasks name the error-reading rules;
    - a3's notes point at a2's findings and `git diff ad6d8bf`.
  - All uncommitted.

**15, the error body (INT's shape; my choice of mechanism):**
- **The problem:** m1's wire error is `ErrorBody` (`{ code, message, details?, requestId }`). oRPC's client doesn't recognise it, so it throws an `ORPCError` whose `code` is guessed from the status, with the body in `e.data.body`. That turns `STALE_VERSION` into `CONFLICT`.
- **Chosen: `toUiError` reads `e.data.body`,** parses it with `@avel/contract`'s `ErrorBody`, and takes `code`, `details` and `requestId` from it. A body that isn't an `ErrorBody` maps by status, with `code` null and never to `stale`. A rejected fetch is `network`.
- **Not chosen: a link interceptor that rethrows with the AVEL code.** Reading the body keeps one function that knows the wire shape, and it needs no change to oRPC's link.
- **Ghost confirms** that OpenAPILink's codec puts the body in `e.data.body`, as `@orpc/client` 1.16.2's does. If it doesn't, Ghost stops and reports.
- **The mock** writes every error as `ErrorBody`, its own and `failNext`'s. It converts the OpenAPI handler's errors.
- **Check 1 (and `PageQuery`) are provisional:** `BAD_REQUEST` with `details: { field: "<first failing path>" }`, the first issue's path joined with `.`. Axis confirms it in the Step 1 slice, and the contract follows any change to the wire shape.
- **UC-04 adds a round trip:** a mock `STALE_VERSION` through `createApiClient` comes out as `stale`, not `conflict`.

**My choices:**
- **04, `rejectLabel` (D13):** the button reads `{rejectLabel}…`, keeping DL's ellipsis because it opens a dialog, so `Reject` gives DL's `Reject…`. Absent hides it. Approve reads `approveLabel`, as DL's does.
- **12:** `Button` now ports DL's `disabledReason`. D10's `actionsDisabledReason` passes through it on Approve (DL's `ButtonWithReason`: the caption beside the button, `aria-describedby`). The other seven Button props, and StatusGlyph's `onColor`, are listed as left out.
- **16, the request ID** is shown on every error. The six rows that had nowhere to show it now use:
  - `DecisionTag.requestId` (D14) for stale, Locked and the 429 countdown;
  - `ReasonDialog.requestId` (R4) for a reason 400;
  - `WidgetState.requestId` (W1) for the no-data network error;
  - `inProgress` ends as `network`, whose band shows it.

  The † string `Request ID {id}` is withdrawn: the band uses the chip. UC-15, UC-17, UC-18, UC-21 and UC-27 assert it.
- **17:**
  - The no-data network or 5xx state on route 52 is DL's `WidgetState` error exactly (`Couldn't load` / `The server did not answer. Nothing was changed.` / `Retry`). The † `Couldn't reach the server.` panel there is withdrawn, but the † string stays in 5.3 for route 54, where "nothing was changed" isn't certain.
  - Other no-data panels pass the status as `code` and the server's `message` as `body`, never DL's 403 or 404 specimen bodies.
- **18:** E2 is withdrawn. DL's `ErrorPanel` already draws the request ID as a copyable `HashChip` (`req`, 12 characters), and every request ID on the page is that chip. Tests find it by `Copy {requestId}`.
- **19:** `failNext` takes `{ times }` (default 1; a new call replaces a pending one). `createQueryClient` takes `{ retryDelay }`, which only the screen tests set (`0`). UC-26 and UC-27 fail route 52 four times: the page's three retries plus the first try.
- **21, not drawn from the library's Decisions screen (`Mme`):**
  - no desk inbox with a detail pane or listbox semantics (that's `/decisions/$ref`, after Step 1);
  - the lead's first sentence only (the mission-health sentence needs CR-W5);
  - no "Just decided", project filter, "New project" or projects section.

  Both layouts are one flat `DecisionTag` list.

## 2026-11-06: Axis's S1-3 — revision 3's decoder stands, and two follow-ups go into the next revision

- **Input:** Axis's S1-3 (backend sprint-01 `decisions.md`) and INT, 2026-11-06.
  - The wire error stays m1's `ErrorBody` in Step 1. No contract change is planned.
  - Revision 3's decoder (`toUiError` reads `e.data.body`) "is accepted as is". `parseErrorBody` is optional for the web.
  - Brennan's a3 runs on revision 3 (c836c29) and isn't stopped.
- **The two follow-ups are refactors, not fixes.** They go into the **next UI contract revision**, written after a3 reports, not into Ghost's `w0-data` task alone:
  1. **Decode at the link.** An `OpenAPILink` error decoder or interceptor parses the body once with `ErrorBody.safeParse` (and `@avel/contract`'s `parseErrorBody` once Step 1 exports it). It rethrows `ORPCError` with `code = body.code`, `status` = the HTTP status and `data = { details, requestId }`, and `toUiError` reads `e.code` and `e.data`. This is the same place and rule as the CLI. UC-04's `STALE_VERSION` round trip stays as it is.
     - **The hook (Axis, via INT):** `@orpc/openapi-client` 1.16.2's `OpenAPILink` has the option `customErrorResponseBodyDecoder(deserializedBody, response) => ORPCError | null`. The next revision names it as the decoder, and Ghost's `w0-data` notes say to confirm it exists in the installed version. If it doesn't, Ghost stops and reports.
  2. **`BAD_REQUEST` details:** `{ field, issues: [{ field, message }] }`. `field` is the first failing path joined with `.`, or the header name for `Idempotency-Key`. `ErrorBody.message` is the first issue's message. The mock writes `issues`. UC-03 asserts it for check 1 and a missing key. The page still reads only `field`.
- **Why the revision and not just the task:**
  - Section 3's decoder, section 2's mock errors, and UC-03 and UC-04 are fixed names in the contract. Fenn's `w0-data` tests lock against them before Ghost builds.
  - A task-only change would leave the contract and the locked tests saying revision 3 while Ghost builds something else.
  - The plan's Ghost task follows the revision on the next re-render.
- **Timing:** the revision lands before Fenn's `agent-fenn-w0-data-test-unit` starts. That dispatch waits for Nemi's merge and backend m1. If a3 fails, the revision answers a3's findings too. If a3 passes, it's a short revision limited to these two items, for INT to send for a quick re-review or accept.

## 2026-11-06: Revision 4 of the UI contract (Brennan's a3, FAIL)

- **Input:** Brennan's a3 (report 44a3e08) failed revision 3 (c836c29) on 16 (P3, narrowed), 22 to 24 (P2) and 25 (P3). No a1 or a2 finding reopened. INT asked for revision 4, with Axis's S1-3 folded in as decided above.
- **16, the request ID:**
  - UC-23 (401) asserts it.
  - In 5.4, the refetch-failed band passes it to `WidgetState` (W1), and `Load more` shows the chip beside `Retry loading more`. UC-26 and UC-27 assert both, and UC-27's 403 too.
  - **The one exception:** a response body the link can't read or decode reaches `toUiError` as a plain `Error`, with nothing that carries the ID. It shows as `network` with no chip. 5.3 says so.
- **22, route 54's wire body:**
  - Under m1's `compact` input, `OpenAPILink` 1.16.2 removes path parameters from the body. The input stays `{ proposalId, version, choice, reason }`, but the wire body is `{ version, choice, reason }`. UC-13, UC-14, UC-19 and the plan's done-when line now say that.
  - The mock reads the raw body before oRPC's handler for CR-W2's check 1 mismatch, and a body without `proposalId` is valid.
  - **For Axis, via INT:** oRPC's OpenAPI handler merges `{ ...body, ...params }`, so the server can't see CR-W2 check 1's "`proposalId` in the body doesn't match the path" either. Either the server reads the raw body as the mock does, or the Step 1 slice drops that half of check 1. **Decided by Axis: S1-5 and D48, below.**
- **23, the sent request ID. The fetch wrapper carries it,** because it's the one place that both makes the ID and sees the outcome:
  - A rejected fetch becomes a `NetworkError` (a `TypeError`) with `requestId`.
  - A response with no `X-Request-Id` gets the sent ID in that header, so oRPC's `e.data.headers` always has one.
  - **Not chosen:**
    - a module-level "last request ID", which is wrong under concurrent requests;
    - a link interceptor that wraps errors, which would hide the `TypeError`.
  - `requests()` now records the requests `failNext` fails, network failures included.
- **24, one data path:**
  - **Tests:** one mock per test, through `createApi({ fetch: mock.fetch })`.
  - **Development and end to end:** one mock instance in the dev server (`apply: "serve"` plugin). The browser fetches its own origin, and the SSR loader fetches the incoming request's origin over HTTP. Both reach that instance.
  - **`POST /__mock/reset`** is added, because the end-to-end tests now share that one instance. Playwright runs `workers: 1`.
  - **The API is bound to the `QueryClient`** (`bindApi`, `apiFor`, `useApi`) rather than put in the router context. That way Nemi's `__root.tsx`, built before the data core, only types `{ queryClient }`, and nothing module-level holds a client.
  - **The SSR client forwards the incoming `X-Request-Id`** (FM line 141). **Cookie forwarding waits for W5:** sprint-01 has no sessions, so there's nothing to forward, and W5 adds it beside the request ID.
  - **The `X-Contract-Version` check runs in the browser only.** The mismatch store is module state, which the server would share across requests.
  - `@avel/contract-mock` is a dev dependency of `@avel/web`. Zane's check now also greps the build for `MOCK_OPERATOR_ID`'s value and `apps/web/src` for imports of the mock.
- **25:** the mock's default `limit` of 50 is **provisional**: m1's `PageQuery` has none. Axis confirms or changes it in the Step 1 slice. The page always sends `limit`, and no scenario relies on the default.
- **Folded in from S1-3:**
  - **Decoding:** errors are decoded at the link: `decodeErrorBody` is `OpenAPILink`'s `customErrorResponseBodyDecoder`, and it returns an `ApiError` (an `ORPCError` with the AVEL code). I read the hook in `@orpc/openapi-client` 1.16.2's `dist/shared/openapi-client.DgkI_tTF.mjs`. Ghost still confirms it once installed, or stops and reports.
  - **`BAD_REQUEST` details** are `{ field, issues }`. The missing key gives `message: "required"` (S1-1 and S1-3, no longer provisional).
    - **Check 5** keeps CR-W2's `{ field: "choice" }` as written. The page reads only `field`.
- **Copy:** revision 4 adds no † strings.

## 2026-11-06: S1-5 taken into revision 4 before a4 (Axis's S1-5; D48)

- **Input:** INT, 2026-11-06. Axis decided S1-5: path parameters win on every route. A body `proposalId` is ignored, never compared or refused, as oRPC's decode `{ ...body, ...params }` already does. Check 1 is the schema check only. CR-W2 section 5 row 1 is edited on main (3fb5b04).
- **The change:** revision 4 (4b6bf65) had the mock read the raw body to refuse a mismatch, and UC-03 asserted that 400. That no longer matches CR-W2 on main, so a4 would have to raise it. The fix is small, so it goes in **before a4 starts**, as a follow-up commit to revision 4, not a new revision:
  - **Section 2:** the path wins, and the mock doesn't read the raw body. Check 1 is the schema check only.
  - **UC-03:** a body with a different `proposalId` is ignored, and the path's proposal is checked and decided.
  - **Appendix A, finding 22;** Ghost's mock task and notes in `plan.toml`, re-rendered.
  - Revision 4's provisional mismatch message is gone with the check.

## Open: for INT before sprint-01 is planned

1. ~~Is there a W0 first?~~ Decided above: option (a).
2. ~~Ghost's time.~~ Decided above: alongside `avel-cli`. Was: INT has started Ghost on `avel-cli` (backend team, Axis reviews; Roster setup and sessions, rule 4). If sprint-01 takes option (a), Ghost's frontend-data dispatch comes after that, or runs alongside it with a separate task doc. INT to decide the order.
3. ~~Decision kinds in Step 1.~~ Settled by CR-W2 (D37) and the UI contract, section 5.1: one generic proposal row, with the kind label from the kit's variant map; per-kind registries wait for W1. Was: **Decision kinds in Step 1 (still open, waits on Axis's contract).** The page lists whatever `GET /api/pending-decisions` returns, but Frontend Map v0.6 (Decision kinds belong to the module that owns the work) has each module register its own kinds. For the minimal page I plan one generic proposal row (summary, approve or reject with a reason, `version` bound: D25, corrected 2026-11-06), and a 409 shows the stale state. Per-kind tags wait for W1. Confirmed once the contract says which kinds exist in Step 1. Route 52 is a plain `Placeholder` in m1 (D30), so this now waits on Step 1's decision on CR-W2, not on m1.
4. ~~Factory PRs in the list.~~ Decided above: read-only. Was: Route 52 returns "proposals of every kind, plus open factory PRs". A factory PR is approved through route 73 `POST /api/factory/changes/{changeId}/merges`, not route 54. Step 1's tables include `proposals` (read and decide only) but no factory-change table. Plan: the minimal page decides proposals only, and shows a factory PR row read-only if the contract returns one. Confirm once the contract is locked.

## 2026-11-06: INT's answers before dispatch

- **Escalation 01: resolved by INT.** `pnpm-workspace.yaml` lists `apps/*` and `vitest.workspace.ts` collects `apps` (main, operator commit). INT regenerates and commits `pnpm-lock.yaml` on main after merging any dispatch that changes a `package.json`; no dispatch commits the lockfile. The plan's notes for Nemi and Ghost stand.
- **The four unplaced files: confirmed as proposed.** `routes/__root.tsx` and `apps/web/.gitignore` to Nemi, `router.tsx` to Ghost, `vitest.config.ts`, `playwright.config.ts` and `test/setup/**` to Fenn.
- **The scope cut: accepted.** No `/decisions/$ref` in sprint-01; it follows once backend Step 1's contract has route 53's `ProposalViewDto` (CR-W2).
