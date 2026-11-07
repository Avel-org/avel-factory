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

## Open: for INT before sprint-01 is planned

1. ~~Is there a W0 first?~~ Decided above: option (a).
2. ~~Ghost's time.~~ Decided above: alongside `avel-cli`. Was: INT has started Ghost on `avel-cli` (backend team, Axis reviews; Roster setup and sessions, rule 4). If sprint-01 takes option (a), Ghost's frontend-data dispatch comes after that, or runs alongside it with a separate task doc. INT to decide the order.
3. **Decision kinds in Step 1 (still open, waits on Axis's contract).** The page lists whatever `GET /api/pending-decisions` returns, but Frontend Map v0.6 (Decision kinds belong to the module that owns the work) has each module register its own kinds. For the minimal page I plan one generic proposal row (summary, approve or reject with a reason, `rowVersion` bound), and a 409 shows the stale state. Per-kind tags wait for W1. Confirmed once the contract says which kinds exist in Step 1.
4. ~~Factory PRs in the list.~~ Decided above: read-only. Was: Route 52 returns "proposals of every kind, plus open factory PRs". A factory PR is approved through route 73 `POST /api/factory/changes/{changeId}/merges`, not route 54. Step 1's tables include `proposals` (read and decide only) but no factory-change table. Plan: the minimal page decides proposals only, and shows a factory PR row read-only if the contract returns one. Confirm once the contract is locked.
