# Backend sprint-00: The contract written fresh, and the schema rebuilt from the database map

Step 0 · lead AXIS · rendered by `scripts/render.py` from `plan.toml`.

## Goals

- A pnpm workspace with TypeScript, Biome, Vitest, scripts/pg-local.sh and CI with a Postgres service
- packages/contract: every value list defined once, the DTOs and inputs, the 102 oRPC route definitions, the error map, the event-kind to owning-module map and the completion report schema, with no rep fields
- packages/db: the Drizzle schema rebuilt from AVEL Database Map.html (every table, column, default, foreign key, CHECK, index and trigger by name, the map's six functions rewritten, plus freeze_after_set from CR-13), the accepted CRs applied on top, value lists imported from the contract, and a first migration
- The ERD and the OpenAPI document generated, DATABASE.md brought up to the schema, and the drift check in CI

## Done when

1. The first migration applies to an empty database and reverses cleanly.
2. A `db` suite against real Postgres covers every CHECK, unique and partial-unique index, exactly-one-parent rule and delete refusal in DATABASE.md, one test per rule (the count is filled in when Rigg writes them).
3. The CR-13 rules: a second internal client is refused; a client mission on the internal client is refused, and an internal mission on a client is refused; changing a mission's kind after onboarding starts is refused.
4. The ERD drift check passes: the schema and DATABASE.md agree.
5. The contract builds and the OpenAPI document generates; the review script passes.
6. Every value list the schema checks is imported from the contract package, not repeated (a test looks for repeats).
7. A new event kind with no owning module fails to compile.
8. **The schema matches the map:** a test reads the map's table, column, foreign-key, CHECK and index lists and compares them with the schema. Anything that differs has to be listed against the CR that changed it.
9. **Each of the six functions has a test** for the rule it enforces. For example: an update to an immutable table is refused; a frozen plan's detail can't be inserted, updated or deleted; a freeze-once column can't change once set; `updated_at` and `row_version` move on every update; v7 ids sort by time.

## Sources

- `docs/agent-dispatch/backend/sprint-00/contract.md`
- `docs/agent-dispatch/backend/sprint-00/decisions.md`
- `docs/design/Step 0 and Step 1 plan.md`
- `docs/design/AVEL Database Map.html`
- `docs/design/Schema vs DATABASE.md.md`
- `docs/design/Change requests CR-1 to 13.md`
- `docs/design/CR-16 Dispatch package contract.md`
- `docs/design/API routes.md`
- `docs/design/DATABASE.md`
- `docs/design/API and data reference.md`
- `docs/design/Canon onboarding v0.5.md`
- `docs/design/Backend modules and build plan.md`

## Dispatches

| Task doc | Agent | Role | Module | Starts |
| --- | --- | --- | --- | --- |
| [`agent-atlas-m0-workspace-build`](agent-atlas-m0-workspace-build.md) | ATLAS | build | m0-workspace | at once (no test dispatch in this module) |
| [`agent-axis-m0-workspace-review-backend`](agent-axis-m0-workspace-review-backend.md) | AXIS | review-backend | m0-workspace | once `agent-atlas-m0-workspace-build` has its completion report, checked out at its result commit |
| [`agent-brennan-slice-review-spec`](agent-brennan-slice-review-spec.md) | BRENNAN | review-spec | slice | at once |
| [`agent-axis-m1-contract-api-contract`](agent-axis-m1-contract-api-contract.md) | AXIS | api-contract | m1-contract | first; after `agent-atlas-m0-workspace-build`, `agent-brennan-slice-review-spec` is merged into main |
| [`agent-rigg-m1-contract-test-unit`](agent-rigg-m1-contract-test-unit.md) | RIGG | test-unit | m1-contract | first; after `agent-atlas-m0-workspace-build` is merged into main |
| [`agent-brennan-m1-contract-review-spec`](agent-brennan-m1-contract-review-spec.md) | BRENNAN | review-spec | m1-contract | once `agent-axis-m1-contract-api-contract` has its completion report, checked out at its result commit |
| [`agent-rigg-m2-db-test-unit`](agent-rigg-m2-db-test-unit.md) | RIGG | test-unit | m2-db | first; after `agent-atlas-m0-workspace-build` is merged into main |
| [`agent-soap-m2-db-build`](agent-soap-m2-db-build.md) | SOAP | build | m2-db | once `agent-rigg-m2-db-test-unit` is merged and listed in `locks.md`; after `agent-axis-m1-contract-api-contract` is merged into main |
| [`agent-axis-m2-db-review-backend`](agent-axis-m2-db-review-backend.md) | AXIS | review-backend | m2-db | once `agent-soap-m2-db-build` has its completion report, checked out at its result commit |
| [`agent-brennan-m2-db-review-spec`](agent-brennan-m2-db-review-spec.md) | BRENNAN | review-spec | m2-db | once `agent-soap-m2-db-build` has its completion report, checked out at its result commit |
| [`agent-rigg-m3-docs-test-unit`](agent-rigg-m3-docs-test-unit.md) | RIGG | test-unit | m3-docs | first; after `agent-atlas-m0-workspace-build` is merged into main |
| [`agent-atlas-m3-docs-build`](agent-atlas-m3-docs-build.md) | ATLAS | build | m3-docs | once `agent-rigg-m3-docs-test-unit` is merged and listed in `locks.md`; after `agent-soap-m2-db-build`, `agent-axis-m1-contract-api-contract` is merged into main |
| [`agent-axis-m3-docs-review-backend`](agent-axis-m3-docs-review-backend.md) | AXIS | review-backend | m3-docs | once `agent-atlas-m3-docs-build` has its completion report, checked out at its result commit |

## Territory map

| Paths | Owner |
| --- | --- |
| `package.json` | ATLAS (build) |
| `pnpm-workspace.yaml` | ATLAS (build) |
| `pnpm-lock.yaml` | ATLAS (build) |
| `.npmrc` | ATLAS (build) |
| `tsconfig.base.json` | ATLAS (build) |
| `tsconfig.json` | ATLAS (build) |
| `biome.json` | ATLAS (build) |
| `vitest.workspace.ts` | ATLAS (build) |
| `.github/workflows/ci.yml` | ATLAS (build) |
| `scripts/pg-local.sh` | ATLAS (build) |
| `packages/contract/src/**` | AXIS (api-contract) |
| `packages/contract/package.json` | AXIS (api-contract) |
| `packages/contract/tsconfig.json` | AXIS (api-contract) |
| `packages/contract/test/**` | RIGG (test-unit) |
| `packages/db/test/**` | RIGG (test-unit) |
| `packages/db/**` | SOAP (build) |
| `tools/docs/test/**` | RIGG (test-unit) |
| `tools/docs/**` | ATLAS (build) |
| `docs/generated/**` | ATLAS (build) |
| `.github/workflows/docs.yml` | ATLAS (build) |
| `docs/design/DATABASE.md` | ATLAS (build) |
| `docs/agent-dispatch/backend/sprint-00/findings/m0-workspace-axis-*.md` | AXIS (findings) |
| `docs/agent-dispatch/backend/sprint-00/findings/slice-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/backend/sprint-00/findings/m1-contract-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/backend/sprint-00/findings/m2-db-axis-*.md` | AXIS (findings) |
| `docs/agent-dispatch/backend/sprint-00/findings/m2-db-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/backend/sprint-00/findings/m3-docs-axis-*.md` | AXIS (findings) |

## Order

Nothing waits for a wave: each dispatch starts when its own rule above is met (the factory's scheduler rule). `scripts/dispatch.sh backend/sprint-00` starts everything that's ready, up to the 6 slots, and says what the rest are waiting for.

1. Contracts and test writers start first. Brennan reviews each contract.
2. The operator locks each module's tests in `locks.md` once they're merged (`scripts/check_locks.py`).
3. Builders start once their module's tests are locked.
4. Reviewers start once the build has its report, checked out at the build's result commit.
5. The operator merges one module at a time, in the order below, with the full tests after each (the merge board, `p` in INT, shows what's READY).

## Merge order

1. `agent-atlas-m0-workspace-build`
2. `agent-axis-m1-contract-api-contract`
3. `agent-rigg-m1-contract-test-unit`
4. `agent-rigg-m2-db-test-unit`
5. `agent-rigg-m3-docs-test-unit`
6. `agent-soap-m2-db-build`
7. `agent-atlas-m3-docs-build`

## Closing the sprint

Every module merged, every finding decided, `SPRINT-ASSESSMENT.md` written (`docs/agent-dispatch/templates/sprint-assessment.md`), and every worktree removed.
