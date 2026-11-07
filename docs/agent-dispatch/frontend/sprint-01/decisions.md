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

## Open: for INT before sprint-01 is planned

1. ~~Is there a W0 first?~~ Decided above: option (a).
2. ~~Ghost's time.~~ Decided above: alongside `avel-cli`. Was: INT has started Ghost on `avel-cli` (backend team, Axis reviews; Roster setup and sessions, rule 4). If sprint-01 takes option (a), Ghost's frontend-data dispatch comes after that, or runs alongside it with a separate task doc. INT to decide the order.
3. **Decision kinds in Step 1 (still open, waits on Axis's contract).** The page lists whatever `GET /api/pending-decisions` returns, but Frontend Map v0.6 (Decision kinds belong to the module that owns the work) has each module register its own kinds. For the minimal page I plan one generic proposal row (summary, approve or reject with a reason, `version` bound: D25, corrected 2026-11-06), and a 409 shows the stale state. Per-kind tags wait for W1. Confirmed once the contract says which kinds exist in Step 1. Route 52 is a plain `Placeholder` in m1 (D30), so this now waits on Step 1's decision on CR-W2, not on m1.
4. ~~Factory PRs in the list.~~ Decided above: read-only. Was: Route 52 returns "proposals of every kind, plus open factory PRs". A factory PR is approved through route 73 `POST /api/factory/changes/{changeId}/merges`, not route 54. Step 1's tables include `proposals` (read and decide only) but no factory-change table. Plan: the minimal page decides proposals only, and shows a factory PR row read-only if the contract returns one. Confirm once the contract is locked.

## 2026-11-06: INT's answers before dispatch

- **Escalation 01: resolved by INT.** `pnpm-workspace.yaml` lists `apps/*` and `vitest.workspace.ts` collects `apps` (main, operator commit). INT regenerates and commits `pnpm-lock.yaml` on main after merging any dispatch that changes a `package.json`; no dispatch commits the lockfile. The plan's notes for Nemi and Ghost stand.
- **The four unplaced files: confirmed as proposed.** `routes/__root.tsx` and `apps/web/.gitignore` to Nemi, `router.tsx` to Ghost, `vitest.config.ts`, `playwright.config.ts` and `test/setup/**` to Fenn.
- **The scope cut: accepted.** No `/decisions/$ref` in sprint-01; it follows once backend Step 1's contract has route 53's `ProposalViewDto` (CR-W2).
