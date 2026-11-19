# CR-W31: contract-mock serves the first mission's routes

Nov 18, 2026 · drafted by Zero · **accepted Nov 18** (Javaris's brief, item 7; "approve T-F22"). Part (a) is built by the frontend lane as T-F22, on Axis's three conditions (below). Parts (b) and (c): who builds them is open.

**What:** `packages/contract-mock` serves the routes the first mission's screens use, over a world with one mission that can walk from draft to receipt.
**Why:** the web builds against contract-mock and never fakes an endpoint (E2, handoff README). The mock serves only routes 8, 19 and 52 to 54 today, plus 1 to 7 under CR-W30 C. Javaris's Nov 18 re-plan wires the mission's screens next (frontend sprint-13).
**Touches:** `packages/contract-mock/src/**` only. No contract, schema or design doc changes. It follows contract 1.0.0 as written.

## A. Routes

Grouped by the sprint-13 ticket that reads them:

| Ticket | Routes |
| --- | --- |
| T-F16 Decisions | 52, 53, 54 (already served), 104, 28, 29, 30, 40, 44, 114 |
| T-F17 A mission starts | 8 (served), 9, 10, 19 (served), 20, 21, 108 |
| T-F18 Canon | 33, 34 (streaming `CanonStreamChunk`), 105 (`STREAM_GONE` once finished), 38 to 44 |
| T-F19 Plan and dispatch | 46, 49, 100, 101, 102, 114 |
| T-F20 The build | 49, 56, 63 (event iterator, `Last-Event-ID` resume), 64 (`view=steps`), 104, 108, 109 |
| T-F21 Release | 29, 30, 55, 56, 58, 59, 60, 61 (with `?verify=`), 107 |

Every write keeps the mock's existing rules:
- `Idempotency-Key` with replay;
- `rowVersion` or the bound hash, with stale answered 409;
- a move the state machine doesn't allow answered 422 with the allowed moves;
- the contract's error body.

## B. The world

One internal client and one mission, seeded at a state chosen per test (draft, onboarding at each checkpoint, finalized, building, at Gate 5, awaiting release, delivered). Moving it through the routes changes the world the way the state machine says. The streams replay a fixed script on `TestClock`-style timing the test controls.

## C. Test hooks

The existing `MockFailure` hook covers every new route (any status and code, or a network failure). Recorded requests name the route by number.

## The parts

| Part | Routes | Built by |
| --- | --- | --- |
| (a) | The world's mission state module, and routes 8, 9, 10, 19, 20, 21, 28 to 30, 40, 44, 52 to 54, 104, 108 and 114 (Axis's split, Nov 18: 8, 19 and 52 to 54 read the same world, so what a write makes or removes shows in the lists) | The frontend lane, T-F22 (frontend sprint-12) |
| (b) and (c) | The streams (34, 63, 64) and the remaining reads and writes in section A | Open: Axis's lane (backend sprint-05), or the frontend lane after T-F22 (Javaris, asked Nov 18) |

## Axis's conditions on the frontend building it (Nov 18)

1. The mock stays `implement(contract)` with output validation, and each new route's test checks its output against the contract.
2. State moves follow the contract's value lists and state machines (422 with the allowed moves, stale is 409). Anything the contract doesn't say is a CR-W.
3. Axis reads part (a)'s state module for fidelity before it merges, as a check, not a G7 review.

## What changes in the kit

`scripts/render.py` refuses any frontend ticket that changes `packages/contract-mock/**` ("only the backend lane changes packages/contract-mock/** (I3)"). For T-F22, it allows the frontend lane `packages/contract-mock/src/**` and `packages/contract-mock/test/**`, in a ticket that names CR-W31. `packages/contract` and `packages/db` stay Axis's lane only (I3). This is a kit change in Axis's lane, landed between cycles (CR-42).
