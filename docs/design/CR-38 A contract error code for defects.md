# CR-38: A contract error code for defects (proposed)

Nov 16, 2026 · drafted by Axis for @javaris · touches `packages/contract/src/errors.ts`, `API routes.md`, the generated OpenAPI document; contract 1.0.0 → 1.0.1

Proposed, for the next cycle. Nothing below is in force until Javaris accepts it, and as a contract change it also needs Zero's sign-off (I3).

## In short

- **What:** add one generic code to the contract's error catalog, `INTERNAL_SERVER_ERROR` with status 500 and the message "Something went wrong", for every defect.
- **Why:** `AGENTS.md` (Writing Effect, rule 3) says a failure no caller can handle is "a defect: 500 with the request ID, logged, never shown". It also says every error is `{ code, message, details?, requestId }` *from the contract's catalog*. But the catalog's generic codes stop at 429, and its only 5xx code is `MODEL_UNAVAILABLE` (503). So a defect has no code to send without breaking one rule or the other. T-B1 (backend sprint-01) found this; for now it sends oRPC's built-in `INTERNAL_SERVER_ERROR` and its tests check the status, shape and `requestId`, not the code.
- **Why that name:** it's the code oRPC already sends for an unhandled error, so the server's adapter and oRPC agree with no remapping, and the web client's `parseErrorBody` needs no special case.

## 1. The change

| Where | Change |
| --- | --- |
| `packages/contract/src/errors.ts`, `errorMap` | Add `INTERNAL_SERVER_ERROR: { status: 500, message: "Something went wrong" }` to the generic codes, with no `data`: a defect never carries details (nothing from the cause reaches the body) |
| `packages/contract/src/version.ts` | `CONTRACT_VERSION` 1.0.0 → 1.0.1 (an added code is backwards compatible) |
| `API routes.md` | The error section: the generic codes become eight, with the defect rule |
| `docs/generated/openapi.json` | Regenerated (`pnpm --filter @avel/docs generate`) |
| `packages/contract-mock` | Nothing: the mock never returns a defect |
| `apps/web` | Shows its generic error state for any 500, with the `requestId` for support. No new screen |
| `packages/server` | The defect path in the `effectHandler` adapter maps to this code. One test: a defect's body has `code: "INTERNAL_SERVER_ERROR"` and no detail of the cause |

## 2. How it's built

One `contract`-labelled ticket in Axis's lane naming this CR (I3), standard rigor, about 20 minutes, plus the one server test in the same ticket if the server shell has merged by then.

## Decisions

1. Accept the code as `INTERNAL_SERVER_ERROR`, 500, no details. **Recommended.**
2. Bump the contract to 1.0.1. **Recommended.**
3. Zero signs off for the frontend (I3).
