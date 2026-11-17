status: done
ticket: T-B6

# T-B6 tests: completion report (Rigg)

## Pre-flight
Run with node v24.22.2 (`pnpm install --frozen-lockfile` first; the worktree had no node_modules).

| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (222 files) |
| `pnpm test` | **expected fail**: 4 failed (the new tests), 923 passed, 41 of 42 files pass |
| `pnpm --filter @avel/contract test` | covered by the workspace run above: only `defect-code.test.ts` fails |
| `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated` | pass, no diff (the committed document is current on the start commit) |

Postgres was not started: these are pure contract tests with no database, clock, ids or routes of their own (E13's four apply to routes; this ticket adds none).

## Failing first
Start commit 5c135fe (no product change; the tests are the only addition):

```
 ❯ test/defect-code.test.ts (4 tests | 4 failed)
   × T-B6-01 ... is a 500 with the message 'Something went wrong' and no data schema
   × T-B6-02 CONTRACT_VERSION is 1.0.1
   × T-B6-03 ... defines Error_INTERNAL_SERVER_ERROR with code INTERNAL_SERVER_ERROR and a requestId
   × T-B6-03 ... lists it as the 500 response of every operation
AssertionError: expected [ Array(17) ] to include 'INTERNAL_SERVER_ERROR'
AssertionError: expected '1.0.0' to be '1.0.1'
AssertionError: Error_INTERNAL_SERVER_ERROR is missing: regenerate docs/generated: expected undefined to be defined
AssertionError: expected 119 to be +0   (119 operations have no 500 entry)
```

## What changed
- `packages/contract/test/defect-code.test.ts` (new): T-B6-01 (errorMap entry: status 500, message "Something went wrong", no `data`; also in `ErrorCode` and `errorStatus`), T-B6-02 (`CONTRACT_VERSION` is "1.0.1"), T-B6-03 (committed `docs/generated/openapi.json` defines `Error_INTERNAL_SERVER_ERROR` with no `details` and lists it as the 500 of all 119 operations; two `it`s).
- This report.

## Contract to files
CR-38 table row 1 -> T-B6-01; row 2 -> T-B6-02; row 4 (regenerated OpenAPI) -> T-B6-03.

## Deviations
None.

## Limitations
- **Conflict for the lead:** `packages/contract/test/no-money.test.ts:115` pins `CONTRACT_VERSION` to `"1.0.0"` (and checks it against `package.json`). When the build bumps to 1.0.1, that line fails. It is outside my territory and an existing test, so I didn't touch it. The builder will also need `packages/contract/package.json` `version` bumped to 1.0.1 (that test requires the two agree), and the 1.0.0 literal in `no-money.test.ts` needs updating by whoever the lead assigns (a test-dispute or territory change for T-B6).
- T-B3 comments in `errors.ts` ("the generic seven") aren't tested; a comment isn't behaviour.
- T-B6-03 reads the committed document; it doesn't regenerate it (the `generate && git diff` check in the build's verification covers staleness).
- Server behaviour (effectHandler's INTERNAL_SERVER_ERROR) isn't tested here by design (CR-38: it would pass before the build, B2).

## Messages received
None.

## Lock line
- T-B6: packages/contract/test/defect-code.test.ts @ 88fca07
