# FENN: w0-kit test-unit, completion report (a5)

verdict: DONE

## Summary
Attempt a5, FENN-04 only: UC-09 now gets ReasonDialog through `await loadReasonDialog()`, and a new test asserts the kit index has no ReasonDialog value. That one test fails on main with an assertion, three runs in a row. Every other kit test passes.

## Pre-flight
All Part 2 files: read (none missing). Branch `frontend/sprint-01/agent-fenn-w0-kit-test-unit-a5`, start commit 81c5d99. Every Part 7 command is available. `pnpm install --frozen-lockfile` was needed first in the fresh worktree.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE (a1, merged and locked earlier) | |
| FENN-02 | DONE (a2, earlier) | |
| FENN-03 | DONE (a4, earlier) | |
| FENN-04 | DONE | 00bf715 |

## Tests
- UC-09 (R7), `test/kit/reason-dialog.test.tsx`, "the kit index has no ReasonDialog value: loadReasonDialog is its only way to the dialog": fails with `expected true to be false` ("the kit index has no ReasonDialog export"), 3 runs the same.
- UC-09 (R7), "loadReasonDialog resolves to a module with a ReasonDialog component (pins existing behaviour: passes)": replaces the old identity check against the index's export. It checks that the loaded module's ReasonDialog is the one the tests render.
- Other UC-09 behaviour tests and all UC-08 and UC-10 tests: unchanged and passing. The only difference is where the component comes from.
- `test/kit/kit.ts`: the pick of ReasonDialog from the index is gone. ReasonDialog comes from a top-level `await loadReasonDialog()`, with an inert stand-in if it's missing. It adds `indexHasReasonDialog`.

## Lock
Commit 00bf715, made with AVEL_LOCK_OVERRIDE="w0-kit tests a5: R7, the kit index exports only loadReasonDialog (INT, revision 13)". check_locks.py logged the override.
`- w0-kit · 00bf715 · apps/web/test/kit/**` (the report commit comes after it.)

## Contract to files
UC-09 and R7 (revision 13): `apps/web/test/kit/reason-dialog.test.tsx`, `apps/web/test/kit/kit.ts`.

## Deviations
None. I added the passing "resolves to a module with a ReasonDialog component" test because the old identity check had nothing left to compare it to.

## Limitations
`pnpm --filter @avel/web test` has 1 failure, the new no-static-export test, until Fantem's w0-kit a5 removes the index's ReasonDialog export. This is expected.

## Parked chains
None.

## P0 discoveries
None.

## Issues for other agents
Fantem (w0-kit a5): remove `ReasonDialog` as a value from `kit/index.ts`. `export type { ReasonDialogProps }` may stay. Leon: the page can then use `loadReasonDialog`.

## Files changed
- apps/web/test/kit/kit.ts
- apps/web/test/kit/reason-dialog.test.tsx
- docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-kit-test-unit-completion.md

## Verification
- `for i in 1 2 3; do pnpm --filter @avel/web exec vitest run test/kit ...`: 1 failed | 74 passed each time, the same assertion at reason-dialog.test.tsx:211 (`- false + true`).
- `git diff <merge-base>..HEAD --stat`: only kit.ts and reason-dialog.test.tsx under apps/web/test/kit.
- `pnpm --filter "@avel/web..." build`: built.
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: Done, no errors.
- `pnpm lint`: Checked 213 files, no fixes applied.
- `pnpm --filter @avel/web test`: 1 failed | 196 passed (the expected failure above).
