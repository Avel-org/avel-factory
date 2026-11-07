# FENN: w0-kit test-unit, completion report

verdict: DONE

## Summary
UC-08 (DecisionTag, one test per state plus the D-change tests), UC-09 (ReasonDialog) and UC-10 (ErrorPanel, and WidgetState's error with a request ID) are written in `apps/web/test/kit/`: 68 tests. All 68 fail on an assertion, the same way three runs in a row. This is attempt a2; a1 was BLOCKED because w0-data wasn't merged, and it is now.

## Pre-flight
- Part 2 files: `.claude/agents/fenn.md`, `codebase-analysis.md`, `docs/ui-contracts/decisions-approval-page.md` (in full), the design library (DecisionTag `n$`, ReasonDialog `Go`, Dialog `Uo`, ErrorPanel `y8`/`v8`, WidgetState `ly`, Button `ee`, HashChip `dt`): read. `decisions.md`, `CR-W2`, the Frontend Map and `Step 0 and Step 1 plan.md`: skimmed with grep for the kit, not read in full. Nothing is missing.
- Branch `frontend/sprint-01/agent-fenn-w0-kit-test-unit-a2`, start commit `f470e0b`.
- Part 7 commands: all run. `build` and `typecheck` can't pass yet (see Verification). `lint` passes.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE | 965071b |

## Tests
All are in `apps/web/test/kit/`. Each fails with `AssertionError: expected <the thing> to be drawn: expected null not to be null`, because `src/kit` isn't built. None pins existing behaviour.
- `decision-tag.test.tsx`, 29 tests, UC-08. Fails at "a [data-ui="DecisionTag"] card". One per state: seen, approving, rejecting (D7), approved (D5, stamp, D12 `--av-d-punch`), rejected, stale (D6 struck binding, note, action, D8 disabled), notAllowed (D8 no buttons; with `onRefresh` D10). Then: D13 labels, `Reject…`, no labels, only approve; D9 link and no link; D2 with and without `idLabel`; unknown variant; D3 `clientName`; D6 sha and version bindings; D10 `actionsDisabledReason` (both disabled, `aria-describedby`) and `inlineError`; D14 `Copy {id}` in stale, notAllowed and disabled-reason, and none without; D11 phone grid; desk isn't the grid.
- `reason-dialog.test.tsx`, 17 tests, UC-09. Fails at the dialog or the "Why?" textarea. Open copy; closed; confirm disabled under 3 trimmed characters; padding doesn't count; trimmed `onConfirm`; Ctrl+Enter and Cmd+Enter; too-short Ctrl+Enter; R3 doesn't close; Cancel; R1 error with `role="alert"` under the textarea; R2 `defaultReason` on open and on reopen; R4 `Copy {id}` under the error, and none without.
- `error-panel.test.tsx`, 22 tests (the `test.each` rows count separately), UC-10. Fails at "an [data-ui="ErrorPanel"]" or "a [data-ui="WidgetState"]". E1 (no button without `onAction`, with it the `actionLabel` or DL's copy for 400/401/403/404/409/422); body as given; DL's titles; the request ID chip (`req` and 12 characters, `Copy {requestId}`); WidgetState `error`: message, W1 chip under the message, Retry, and the stale-with-rows form.

## Lock
Tests commit `965071b`. Line for `locks.md`:
`- w0-kit · 965071b · apps/web/test/kit/**`

## Contract to files
- UC-08 → `decision-tag.test.tsx`
- UC-09 → `reason-dialog.test.tsx`
- UC-10 → `error-panel.test.tsx`
- The shared loader and helpers → `kit.ts`

## Deviations
- **A test-local loader instead of a stub.** The locked `vitest.config.ts` stubs only `src/data`, `src/lib` and `@avel/contract-mock`, not `src/kit`. A direct import of `src/kit` would fail on import, not on an assertion. So `test/kit/kit.ts` loads `src/kit/index.ts` with `import.meta.glob` and falls back to components that draw nothing. When Fantem's `index.ts` exists, the real one is used with no change. It needs `src/kit/index.ts` to export `DecisionTag`, `ReasonDialog`, `ErrorPanel` and `WidgetState` by name (FANTEM-01 says so).
- `pnpm --filter @avel/web test -- test/kit` doesn't filter (the `--` makes vitest run everything). I ran `npx vitest run test/kit` from `apps/web` for the three runs.
- `kit.ts` carries its own copy of the prop types, since `src/kit` doesn't exist. They follow section 4 exactly.

## Limitations
- jsdom loads no CSS, so some checks are by inline style or class text: the struck binding (`line-through` on the element or an ancestor, or `<s>`/`<del>`), the phone grid (`1fr`, `1.4fr` and `10px` in the container's inline style or class), and the stamp's `--av-d-punch` (in the card's HTML). A builder who draws these with CSS rules in a stylesheet would fail them; that is a call for INT, not a reason to loosen them.
- D12's "hole fill isn't animated under reduced motion" can't be seen in jsdom; not tested (belongs in the e2e or a review).
- The kit's tests were checked against the design library's source, not against a built kit, so some may need a ruling once Fantem builds (see Issues).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- Fantem: the tests need `apps/web/src/kit/index.ts` with named exports. `ReasonDialog` must label its textarea "Why?" (DL) and render in a portal with `role="dialog"` named by its title. Disabled-reason text must be the element Approve's `aria-describedby` names. `link` is an `<a>`.
- INT: build and typecheck fail on a fresh checkout because `src/router.tsx` (Ghost) doesn't exist.

## Files changed
```
apps/web/test/kit/decision-tag.test.tsx
apps/web/test/kit/error-panel.test.tsx
apps/web/test/kit/kit.ts
apps/web/test/kit/reason-dialog.test.tsx
docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-kit-test-unit-completion.md
```

## Verification
Three runs, `cd apps/web && npx vitest run test/kit`:
```
 Test Files  3 failed (3)
      Tests  68 failed (68)
```
(identical each time; the failures are `AssertionError: expected a [data-ui="DecisionTag"] card to be drawn` ×29, `an [data-ui="ErrorPanel"]` ×10, `the 'Why?' textarea` ×9, `a [data-ui="WidgetState"]` ×5, `the reason dialog` ×3, and one each of the chip, the alert, the confirm button, Cancel, and a bare `expected null not to be null`.)

- `pnpm --filter "@avel/web..." build` → fails: `Could not resolve entry for router entry: router in apps/web/src` (Ghost's `src/router.tsx` isn't built). Exit 1.
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck` → the same router error. Exit 1. `tsc` on my files alone (`npx tsc -p apps/web/tsconfig.json`, filtered to `test/kit`) shows no errors.
- `pnpm lint` → `Checked 160 files in 82ms. No fixes applied.` Exit 0.
- `pnpm --filter @avel/web test` → `Test Files 10 failed (10)`, `Tests 153 failed (153)`: the w0-data tests and these, all failing first, as locked.
- `git diff --name-only main...HEAD` → only the four files in `apps/web/test/kit/` (and this report, once committed).
