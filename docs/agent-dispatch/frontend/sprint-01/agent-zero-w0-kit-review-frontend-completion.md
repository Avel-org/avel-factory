# ZERO: w0-kit review-frontend, completion report

verdict: PASS

## Summary
I reviewed Fantem's w0-kit diff (3cb8f64, base 61d37ca) line by line against UI contract section 4 and DL's own source for each component. All nine components carry the props, `data-ui` names, copy and values section 4 gives them, and the changes D1 to D14, R1 to R4, E1 and W1 are in. The kit imports nothing outside itself, and the 68 locked kit tests pass. There are two P3 findings, both about where the request ID chip goes: neither blocks the merge.

## Pre-flight
- Part 2 files, all read: `.claude/agents/zero.md`, `codebase-analysis.md`, `docs/ui-contracts/decisions-approval-page.md` (section 0 and section 4 in full; section 5 and the UC-08 to UC-10 rows for how the page uses the kit), `CR-W2 Pending decisions.md`, `decisions.md` (the section 4 design choices), the Frontend Map v0.6 (Layers, What every module looks like, Territories), the design library (component source `te`, `ee`/`d8`, `ne`, `dt`, `Ze`/`h8`, `y8`/`v8`, `ly`/`x8`, `BH`, `n$`/`LH`, `Uo`/`Dy`, `Go`, `jr`, `ou`/`ry`; the `.pd` CSS; the step-up field error), the Step 0 and Step 1 plan, and this task doc. None missing. My Read first list's `API and data reference.md` and `CR-16 Dispatch package contract.md` exist too. The kit doesn't touch the API, so I only skimmed them.
- Branch `frontend/sprint-01/agent-zero-w0-kit-review-frontend-a1`, start commit 3cb8f64 (Fantem's report), `AVEL_BASE` 61d37ca.
- Part 7 commands: all available once I ran `pnpm install --frozen-lockfile --prefer-offline`, because the worktree had no `node_modules`. Build and typecheck fail for a reason outside the kit (see Verification).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE | this report's commit |

ZERO-01 verify, in two parts:
- `pnpm --filter @avel/web test -- test/kit`: through pnpm the `--` is passed on to vitest, so it ran the whole suite (see Deviations). The kit's own run, `cd apps/web && pnpm exec vitest run test/kit`: `Test Files 3 passed (3)`, `Tests 68 passed (68)`. `git diff --stat 965071b HEAD -- apps/web/test/kit` is empty, so the lock is intact.
- `! grep -rn '@orpc\|@tanstack/react-router\|#[0-9a-fA-F]\{6\}' apps/web/src/kit`: nothing listed, exit 0. The kit also has no relative import outside `src/kit`.

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-01-decisiontag-request-id-drawn-twice.md`, P3: `DecisionTag` draws the request ID chip twice when a `stale` card also has `actionsDisabledReason` (5.2's offline reason does that), and draws the footer chip for any disabled reason, not only a 429 (D14).
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-02-widgetstate-stale-band-chip-beside-message.md`, P3: `WidgetState` `error` with rows on screen draws the chip beside the stale message, not under it (W1).

## Contract to files
- **Value rule (section 0):** no hex anywhere (grep above). Every other literal is DL's own for that element: the Button sheen gradient, HashChip's `fontSize: 12`, `borderRadius: 4` and 1200ms, the hole fill's `160ms`, `.pd-actions`' `10px`, and the dialog CSS copied from DL's "Overlays: Dialog" rules. Every token the kit uses exists in `apps/web/src/styles/tokens.css`, including the keyframes `av-hole-fill`, `av-stamp-land` and `av-skeleton`.
- **Plain props, no oRPC or router:** `apps/web/src/kit/*`. The props are exactly section 4's ported subsets, and the left-out props are absent.
- **Button** (`Button.tsx`): DL `ee`/`d8`, with the same variants, sizes, disabled look, sheen and `ButtonWithReason`.
- **Tag** (`Tag.tsx`): `Ze`/`h8`. DL's `count.num` is dropped, but DL never reads it.
- **Icon** (`Icon.tsx`): lucide-react per-icon imports, `data-ui="Icon"`, `data-icon`, 16 and 1.75, and `title` giving `role="img"`.
- **StatusGlyph** (`StatusGlyph.tsx`): `ne`, the same for every status. `onColor` is reached only by Tag, through `drawStatusGlyph`.
- **HashChip** (`HashChip.tsx`): `dt`, with the copy button's `aria-label` `Copy {value}`.
- **ReasonDialog** (`ReasonDialog.tsx`, `Dialog.tsx`, `KitStyles.tsx`):
  - `Go`, `Uo` and `Dy`, with the copy `Why?`, `Cancel`, `Confirm` and the placeholder.
  - R1 is in DL's step-up field-error form.
  - R2: the text is reset to `defaultReason` on each open.
  - R3: `onConfirm` doesn't call `onClose`.
  - R4: the request ID chip.
- **ErrorPanel** (`ErrorPanel.tsx`): `y8`/`v8`, with DL's copy word for word. E1: no button without `onAction`.
- **WidgetState** (`WidgetState.tsx`, `ago.ts`):
  - `ly`/`x8`, with only the four states.
  - W1 is right in the plain error state. In the stale band the chip is beside the message (finding 02).
- **DecisionTag** (`DecisionTag.tsx`): `n$`/`BH`/`LH`.
  - D1: flat props, and an unknown variant is drawn as `Decision`/`circle`.
  - D2: the `aria-label` with and without `idLabel`.
  - D3: `clientName` after the kind label, at 13px desk, which is `.pd-project`'s.
  - D4: Approve and Reject only call back.
  - D5: the approved line uses `binds.label`.
  - D6: a version binding is text, struck in `stale`.
  - D7: `Rejecting…`.
  - D8: buttons by state.
  - D9: an `<a>` in the link look, `target="_blank"`, `rel="noopener noreferrer"`, `arrow-up-right`.
  - D10: `disabledReason` on Approve, and `inlineError` above the actions.
  - D11: the grid `minmax(0, 1fr) minmax(0, 1.4fr)`, gap 10px, Reject left.
  - D12: `--av-d-punch`, and the hole fill isn't animated under reduced motion.
  - D13: `{rejectLabel}…`.
  - D14: the chip under the stale note, the Locked reason and the countdown, except for the duplicate in finding 01.
  - The state tags are DL's.
- **UC-08 to UC-10:** Fenn's locked `apps/web/test/kit/**`, all passing.

## Deviations
- **ZERO-01's verify command:** `pnpm --filter @avel/web test -- test/kit` passes the `--` on to vitest (`vitest run -- test/kit`), so it ran the whole suite, and the w0-data and decisions tests fail on this base (see Verification). I ran the kit's tests with `pnpm exec vitest run test/kit` instead. The plan's verify line should drop the `--`.
- **`git diff --name-only main...HEAD`** lists Fantem's kit files and build report as well as mine, because this branch starts at the build's result commit. My own changes are `git diff --name-only 3cb8f64..HEAD`, and both are shown below.
- **One scratch render probe**, for the findings' evidence: a vitest file and config in the session scratchpad, outside the repo. Nothing in the repo changed for it.

## Limitations
- I didn't look at the kit in a browser. I compared values and structure against DL's source, and checked rendered markup by server render. Motion, hover and the 390px dialog are for Leah's a11y-perf review.
- The full build and typecheck can't pass on this base, because the w0-data paths aren't in it. `tsc` reports no error in `src/kit` or `test/kit`.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Fantem:** findings 01 and 02.
- **Leon:**
  - Section 5.4's empty card (`StatusGlyph` done and `Nothing needs you.`) is DL's `.dec-empty` from the Decisions screen, not the kit's `WidgetState` `empty`, whose `icon` takes only an `IconName`. Draw it in the module.
  - The kit also exports `AV_ERROR_COPY` and `AV_DECISION_VARIANTS` (DL's own), for DL's 400 title and body.
- **Leah:**
  - `WidgetState` `loading` keeps DL's `aria-label` on a div with no role (`WidgetState.tsx:61-66`, with a biome-ignore). That's DL as it is.
  - On a phone, both decision buttons are `size="lg"` (`--av-control-h-lg`, 44px on touch). DL's Decisions card sets `.pd[data-phone] [data-ui="Button"] { min-height: 48px; }`, which D11 doesn't carry.
- **INT:**
  - The w0-kit verify line in `plan.toml` (the `--`, see Deviations).
  - The merge of w0-kit is yours. The two P3 findings can follow it.

## Files changed
`git diff --name-only 3cb8f64..HEAD` (this review):
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-01-decisiontag-request-id-drawn-twice.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-02-widgetstate-stale-band-chip-beside-message.md
```
`git diff --name-only main...HEAD` (adds the build under review): the 14 files in `apps/web/src/kit/`, `docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md`, and the three files above.

## Verification
```
$ pnpm --filter "@avel/web..." build
apps/web build: error during build:
apps/web build: Error: Could not resolve entry for router entry: router in …/apps/web/src
apps/web build: Failed
EXIT=1
```
`src/router.tsx` is w0-data's (Ghost's). It isn't in base 61d37ca. main has since merged w0-data (79ce639).

```
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
apps/web typecheck: Error: Could not resolve entry for router entry: router in …/apps/web/src
apps/web typecheck: Failed
EXIT=1
$ cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit | grep 'error TS' | cut -d'(' -f1 | sort | uniq -c
  29 errors, all in test/data/*, test/modules/decisions/*, test/setup/*, vite.config.ts
  (missing @avel/contract-mock, src/data/*, src/modules/decisions/*). None in src/kit or test/kit.
```

```
$ pnpm lint
> biome check .
Checked 182 files in 130ms. No fixes applied.
EXIT=0
```

```
$ pnpm --filter @avel/web test
 Test Files  10 failed | 3 passed (13)
      Tests  122 failed | 68 passed (190)
EXIT=1
```
- The 3 files that pass are `test/kit/**`. They're all 68 passes, and no test in `test/kit` fails.
- The failures are in `test/data/**` (85) and `test/modules/decisions/**` (37). Their modules aren't on this base.

```
$ cd apps/web && pnpm exec vitest run test/kit
 Test Files  3 passed (3)
      Tests  68 passed (68)

$ ! grep -rn '@orpc\|@tanstack/react-router\|#[0-9a-fA-F]\{6\}' apps/web/src/kit
(no output) exit 0

$ git diff --name-only main...HEAD   # only paths from Part 5
```
Listed under Files changed. Of these paths, only the three in this review's list are mine, and all three are in Part 5.
