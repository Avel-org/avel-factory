# FENN: w0-kit test-unit, completion report

verdict: DONE

## Summary
Attempt a3 does only FENN-02: UC-08's D11 tests are now revision 10's form (the `av-dt-pair` hook in both layouts, the grid values and the media rule read from `kit.css`), and UC-09 adds `loadReasonDialog` (R7). The 5 new or changed tests fail on an assertion, the same way three runs in a row. The other 66 kit tests are unchanged and pass.

## Pre-flight
- Part 2 files: read (the contract's D11 and R7 rows and sections, and the existing kit tests, in full; `decisions.md`, CR-W2, the Frontend Map and the design library were not re-read beyond what the task doc's notes quote). Nothing is missing.
- Branch `frontend/sprint-01/agent-fenn-w0-kit-test-unit-a3` (the task doc says a2; this is the attempt branch I was given), start commit `a00fa14`.
- Part 7 commands: all available. I ran `pnpm install --frozen-lockfile` first, as the worktree had no `node_modules`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE in a1 (locked at 965071b); not redone | |
| FENN-02 | DONE | 88f3d4a |

## Tests
All in `apps/web/test/kit/`. `kit.ts` gains `loadReasonDialog` and `hasLoadReasonDialog` stand-ins.
- UC-08 `decision-tag.test.tsx` "phone (D11): Reject then Approve in one av-dt-pair container, with no inline grid style": `AssertionError: expected false to be true` (no `av-dt-pair` class).
- UC-08 "desk (D11): Approve then Reject in one av-dt-pair container, with no inline grid style": `AssertionError: expected false to be true`.
- UC-08 "(D11) kit.css draws .av-dt-pair as the grid for the phone layout, outside any media block": `AssertionError: expected a phone ".av-dt-pair" rule outside the media block to be drawn: expected null not to be null`.
- UC-08 "(D11) kit.css draws the desk layout's .av-dt-pair as the grid only inside @media (max-width: 899px)": `AssertionError: expected a desk ".av-dt-pair" rule inside the (max-width: 899px) block to be drawn: expected null not to be null`. It also asserts no desk `.av-dt-pair` rule outside the block sets a grid.
- UC-09 `reason-dialog.test.tsx` "(R7) loadReasonDialog resolves to a module whose ReasonDialog is the kit index's ReasonDialog": `AssertionError: the kit index exports loadReasonDialog: expected false to be true`.
- The two old D11 tests (phone grid inline; desk not the grid) are replaced by the four D11 tests above. Every other test is unchanged and passes (pins existing behaviour).

Three runs, identical each time: `Tests  5 failed | 66 passed (71)`.

## Lock
Committed with `AVEL_LOCK_OVERRIDE="w0-kit tests a2: D11 is a kit.css rule, and loadReasonDialog (INT, revision 10)"`; check_locks logged it as overridden.
`- w0-kit · 88f3d4a · apps/web/test/kit/**`

## Contract to files
- D11 (section 4, revision 10): `apps/web/test/kit/decision-tag.test.tsx`.
- R7 (`loadReasonDialog`): `apps/web/test/kit/reason-dialog.test.tsx`, `apps/web/test/kit/kit.ts`.

## Deviations
- The branch is a3 and the task doc's notes say a2. I followed the notes (second task only).
- The CSS tests accept any selector that contains `.av-dt-pair` and `phone` (outside the media block) or `desk` (inside it). The contract doesn't fix the selector's shape.
- `loadReasonDialog` resolving to a module that has `ReasonDialog` identical to the index's is checked by identity (`toBe`).

## Limitations
- jsdom applies no media queries, so the computed layout is UC-31's job (end to end).
- Fantem's w0-kit a4 must make `kit.css` the only place D11's grid lives; the tests also require no inline `display`, `gridTemplateColumns` or `gap` on the pair.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- Fantem (w0-kit a4): `src/kit/DecisionTag.tsx` still draws D11 inline, with no `av-dt-pair`. `index.ts` has no `loadReasonDialog`. Build to these tests.
- INT: after the merge, move `locks.md`'s w0-kit line to 88f3d4a.

## Files changed
```
apps/web/test/kit/decision-tag.test.tsx
apps/web/test/kit/kit.ts
apps/web/test/kit/reason-dialog.test.tsx
docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-kit-test-unit-completion.md
```

## Verification
- `pnpm --filter "@avel/web..." build`: built (`✓ built in 167ms`, Done).
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: contract, contract-mock and apps/web typecheck all Done.
- `pnpm lint`: `Checked 205 files in 166ms. No fixes applied.`
- `pnpm --filter @avel/web test`: `Test Files  2 failed | 12 passed (14)`, `Tests  5 failed | 188 passed (193)`; the 5 failures are the new tests above, expected until Fantem's a4.
- `git diff --name-only main...HEAD` (before this report): the three `apps/web/test/kit` files, all in Part 5.
