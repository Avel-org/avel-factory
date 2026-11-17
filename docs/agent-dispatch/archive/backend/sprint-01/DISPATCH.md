# Backend sprint-01: Step 1, first module: @avel/contract on zod/mini (S1-6)

Step 1 · lead AXIS · rendered by `scripts/render.py` from `plan.toml`.

## Goals

- @avel/contract's schemas are built with zod/mini (and zod/v4/core), with no import of classic zod anywhere in packages/contract/src, so the web stops bundling classic zod once its own side moves too (S1-6)
- Nothing a consumer sees changes: the wire, every z.input and z.output type, the OpenAPI document byte for byte, S1-3's BAD_REQUEST issues, and the package version (no bump: S1-6, INT)
- Biome refuses a classic zod import in packages/contract/**, and a locked test refuses it too

## Done when

1. Build, typecheck and lint pass.
2. The 44 locked contract tests pass unchanged, and so do the new zod-mini tests: no classic zod import in packages/contract/src, every exported schema's z.input and z.output type unchanged against the pre-move snapshot, and route 54's bad-input issues unchanged.
3. The OpenAPI document is unchanged: after `pnpm --filter @avel/docs generate`, `git diff --exit-code docs/generated/openapi.json` exits 0.
4. The first-load size: the spike measured 173.53 to 156.28 kB gzip with both packages on zod/mini (decisions.md, S1-6). The real number is Leah's, on the frontend side, once Ghost's web change and this module are both on main.

## Sources

- `docs/agent-dispatch/backend/sprint-01/decisions.md`
- `docs/design/Step 0 and Step 1 plan.md`
- `docs/agent-dispatch/backend/sprint-00/contract.md`
- `docs/agent-dispatch/backend/sprint-00/decisions.md`

## Dispatches

| Task doc | Agent | Role | Module | Starts |
| --- | --- | --- | --- | --- |
| [`agent-rigg-zod-mini-test-unit`](agent-rigg-zod-mini-test-unit.md) | RIGG | test-unit | zod-mini | first |
| [`agent-axis-zod-mini-api-contract`](agent-axis-zod-mini-api-contract.md) | AXIS | api-contract | zod-mini | first; after `agent-rigg-zod-mini-test-unit` is merged into main |
| [`agent-brennan-zod-mini-review-spec`](agent-brennan-zod-mini-review-spec.md) | BRENNAN | review-spec | zod-mini | once `agent-axis-zod-mini-api-contract` has its completion report, checked out at its result commit |

## Territory map

| Paths | Owner |
| --- | --- |
| `packages/contract/test/**` | RIGG (test-unit) |
| `packages/contract/src/**` | AXIS (api-contract) |
| `tools/docs/src/openapi.ts` | AXIS (api-contract) |
| `biome.json` | AXIS (api-contract) |
| `docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-*.md` | BRENNAN (findings) |

## Order

Nothing waits for a wave: each dispatch starts when its own rule above is met (the factory's scheduler rule). `scripts/dispatch.sh backend/sprint-01` starts everything that's ready, up to the 6 slots, and says what the rest are waiting for.

1. Contracts and test writers start first. Brennan reviews each contract.
2. The operator locks each module's tests in `locks.md` once they're merged (`scripts/check_locks.py`).
3. Builders start once their module's tests are locked.
4. Reviewers start once the build has its report, checked out at the build's result commit.
5. The operator merges one module at a time, in the order below, with the full tests after each (the merge board, `p` in INT, shows what's READY).

## Merge order

1. `agent-rigg-zod-mini-test-unit`
2. `agent-axis-zod-mini-api-contract`

## Closing the sprint

Every module merged, every finding decided, `SPRINT-ASSESSMENT.md` written (`docs/agent-dispatch/templates/sprint-assessment.md`), and every worktree removed.
