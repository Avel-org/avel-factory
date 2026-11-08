# FENN: w0-kit test-unit, completion report

verdict: DONE

## Summary
Attempt a4 does only FENN-03: UC-08 gains the three D15 tests (revision 11). The no-fact test fails on an assertion, the same way three runs in a row. The evidence-only and consequence-only tests pass, as the task doc expects. No other kit test changed.

## Pre-flight
- Part 2 files: read in the parts that touch this task (UI contract D15 row and UC-08 row, decisions.md 'Revision 11', decisions-brennan-01, the existing kit tests and `DecisionTag.tsx`). I did not re-read CR-W2, the Frontend Map or the design library beyond what those quote. Nothing is missing.
- Branch `frontend/sprint-01/agent-fenn-w0-kit-test-unit-a4`, start commit `cbb0b19`. `locks.md` has w0-kit at 88f3d4a (the D11 tests), as the notes say.
- Part 7 commands: all available. The worktree already had `node_modules`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE in a1 (965071b); not redone | |
| FENN-02 | DONE in a3 (88f3d4a); not redone | |
| FENN-03 | DONE | faed68f |

## Tests
All in `apps/web/test/kit/decision-tag.test.tsx`.
- UC-08 "(D15) neither evidence nor consequence: no .av-dt-facts element is drawn": `AssertionError: expected <dl class="av-dt-facts"></dl> to be null`.
- UC-08 "(D15) evidence only, pins existing behaviour": passes. One `.av-dt-facts`, holding the evidence.
- UC-08 "(D15) consequence only, pins existing behaviour": passes. One `.av-dt-facts`, holding the consequence.

Three runs of `vitest run test/kit`, identical each time: `Tests  6 failed | 68 passed (74)`. The 6 failures are the D15 no-fact test, plus the 5 a3 tests (D11 x4, `loadReasonDialog`). Those 5 are locked at 88f3d4a and wait for Fantem's w0-kit a4, which isn't merged on this branch. Their failure lines are unchanged from the a3 report.

## Lock
Committed with `AVEL_LOCK_OVERRIDE="w0-kit tests a4: D15, the facts list only with a fact (INT, revision 11)"`; check_locks logged: `locked tests changed, allowed by AVEL_LOCK_OVERRIDE`.
`- w0-kit · faed68f · apps/web/test/kit/**`

## Contract to files
- D15 (section 4, revision 11) and UC-08's D15 clause: `apps/web/test/kit/decision-tag.test.tsx`.

## Deviations
- The task doc's Expected line says "a single assertion failure". On this branch the 5 a3 tests still fail, because their builder (Fantem's a4) isn't merged here. The D15 attempt added exactly one failure, and I changed no existing test.

## Limitations
- The tests check the DOM for `.av-dt-facts`. They don't check the rule's look; the Factory PR card's rules are for review and the end-to-end pass.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- Fantem (w0-kit a4): `DecisionTag.tsx` lines 315-328 draw `<dl className="av-dt-facts">` always. Wrap it in `evidence || consequence`.
- INT: after the merge, move `locks.md`'s w0-kit line to faed68f.

## Files changed
```
apps/web/test/kit/decision-tag.test.tsx
docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-kit-test-unit-completion.md
```

## Verification
- `pnpm --filter "@avel/web..." build`: `✓ built in 271ms`, Done.
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: contract, contract-mock and apps/web, all Done.
- `pnpm lint`: `Checked 213 files in 286ms. No fixes applied.`
- `pnpm --filter @avel/web test`: `Test Files  2 failed | 12 passed (14)`, `Tests  6 failed | 190 passed (196)`; the 6 failures are listed under Tests, expected until Fantem's a4.
- `git diff --name-only main...HEAD` (before this report): `apps/web/test/kit/decision-tag.test.tsx`, in Part 5.
