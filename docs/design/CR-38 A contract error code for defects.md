# CR-38: A contract error code for defects (accepted)

Nov 16, 2026 · drafted by Axis for @javaris · touches `packages/contract/src/errors.ts`, `API routes.md`, the generated OpenAPI document; contract 1.0.0 → 1.0.1

**Accepted Nov 17 by the operator** (decisions 1 and 2). As a contract change it also needs Zero's sign-off for the frontend (I3, decision 3); until Zero signs, it isn't built. Built in backend sprint-02 as T-B6 (`docs/agent-dispatch/backend/sprint-02/plan.toml`).

## In short

- **What:** add one generic code to the contract's error catalog, `INTERNAL_SERVER_ERROR` with status 500 and the message "Something went wrong", for every defect.
- **Why:** `AGENTS.md` (Writing Effect, rule 3) says a failure no caller can handle is "a defect: 500 with the request ID, logged, never shown". It also says every error is `{ code, message, details?, requestId }` *from the contract's catalog*. But the catalog's generic codes stop at 429, and its only 5xx code is `MODEL_UNAVAILABLE` (503). So a defect has no code to send without breaking one rule or the other. T-B1 (backend sprint-01) found this; for now it sends oRPC's built-in `INTERNAL_SERVER_ERROR` and its tests check the status, shape and `requestId`, not the code.
- **Why that name:** it's the code oRPC already sends for an unhandled error, so the server's adapter and oRPC agree with no remapping, and the web client's `parseErrorBody` needs no special case.

## 1. The change

| Where | Change |
| --- | --- |
| `packages/contract/src/errors.ts`, `errorMap` | Add `INTERNAL_SERVER_ERROR: { status: 500, message: "Something went wrong" }` to the generic codes, with no `data`: a defect never carries details (nothing from the cause reaches the body) |
| `packages/contract/src/version.ts` | `CONTRACT_VERSION` 1.0.0 → 1.0.1 (an added code is backwards compatible) |
| `API routes.md` | Nothing. Correction, Nov 17: `API routes.md` has no list of the generic codes; the catalog in `errors.ts` is the source. Its comment "the generic seven" becomes "the generic eight" in T-B6 |
| `docs/generated/openapi.json` | Regenerated (`pnpm --filter @avel/docs generate`) |
| `packages/contract-mock` | Nothing: the mock never returns a defect |
| `apps/web` | Shows its generic error state for any 500, with the `requestId` for support. No new screen |
| `packages/server` | Nothing. T-B1's `effectHandler` already answers a defect with `INTERNAL_SERVER_ERROR` and no detail of the cause (its test T-B1-07). Correction, Nov 17: no new server test, since it would pass on `main` before the build (B2); the contract's tests carry the change |

## 2. How it's built

One `contract`-labelled ticket in Axis's lane naming this CR (I3), standard rigor, about 20 minutes: T-B6 in backend sprint-02.

## Decisions

1. **Accepted Nov 17:** the code is `INTERNAL_SERVER_ERROR`, 500, no details.
2. **Accepted Nov 17:** the contract goes to 1.0.1.
3. Zero signs off for the frontend (I3): asked Nov 17.
