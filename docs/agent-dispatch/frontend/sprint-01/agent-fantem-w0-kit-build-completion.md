# FANTEM: w0-kit build, completion report

verdict: DONE

## Summary
The kit is built in `apps/web/src/kit/**` and exported by name from `index.ts`: Button, Tag, Icon, StatusGlyph, HashChip, ReasonDialog (R1 to R4), ErrorPanel (E1), WidgetState (W1) and DecisionTag (D1 to D14). Each is ported from DL's bundled source, found by its minified name. All three locked kit test files pass: UC-08, UC-09 and UC-10, 68 of 68 tests. Kit lint is clean, and `tsc` reports no errors in `src/kit` or `test/kit`.

`@avel/web`'s build and typecheck are still red, and so are its data and decisions tests. The cause is outside this territory: Ghost's `src/router.tsx` and `packages/contract-mock` haven't landed. decisions.md (2026-11-07, "INT's answers on Nemi's w0-app report") expects this until Ghost merges.

## Pre-flight
- **Part 2 files, all read:**
  1. `.claude/agents/fantem.md`
  2. `codebase-analysis.md`
  3. `docs/ui-contracts/decisions-approval-page.md` (revision 5), read in full
  4. `CR-W2 Pending decisions.md`, sections 1 to 2.3 in full, the rest skimmed
  5. `decisions.md`, read in full
  6. Frontend Map v0.6: the Layers, Writes and Errors-by-code sections, the kit lines and Territories
  7. DL v1.1, from its bundled script and stylesheet:
     - the components: `ee`, `d8`, `ou`, `ry`, `te`, `Ze`, `h8`, `dt`, `ne`, `Go`, `Uo`, `Dy`, `y8`, `v8`, `ly`, `x8`, `jr`, `n$`, `LH` (`AV_DECISION_VARIANTS`), `BH` and `zo`;
     - the Decisions card `eD` and its `.pd` CSS;
     - the Overlays and field-anatomy CSS, the token section and the reduced-motion block.
  8. `Step 0 and Step 1 plan.md`: item 13 and test 14
  9. Contract sections 0 and 4: see 3
  10. DL again: see 7
  11. This task doc
- **Starts conditions:**
  - `agent-fenn-w0-kit-test-unit` is locked: `locks.md`, w0-kit · 965071b · `apps/web/test/kit/**`.
  - Nemi's w0-app is merged: `apps/web` and `src/styles` are on main.
- **Branch:** `frontend/sprint-01/agent-fantem-w0-kit-build-a1`, starting at `61d37ca`. main has since moved to `20d2915`, with contract subpath exports only. Nothing in my territory or in `apps/web/test/kit` changed.
- **Part 7 commands:** all available. `pnpm install --frozen-lockfile` ran clean, and the lockfile is unchanged.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FANTEM-01 | DONE | e47b8a5 |
| FANTEM-02 | DONE | 14befc1 |

## Contract to files
| Item | Files |
| --- | --- |
| `Button` and `ButtonWithReason`: section 4's props; the seven others left out | `kit/Button.tsx`, `kit/interaction.ts` (DL's `ou`/`ry`) |
| `Tag`: `tone`, `size`, `icon`, `title`, `children` | `kit/Tag.tsx` |
| `Icon`: `data-ui="Icon"`, `data-icon`; per-icon `lucide-react` imports | `kit/Icon.tsx` |
| `StatusGlyph`: `status`, `size` | `kit/StatusGlyph.tsx` |
| `HashChip`: `value`, `kind`, `length`, `prefix`, `strike`, `copy`; `Copy {value}` button | `kit/HashChip.tsx` |
| `ReasonDialog`, R1 to R4 (UC-09: 17 tests) | `kit/ReasonDialog.tsx`, `kit/Dialog.tsx` (DL's `Uo`/`Dy`, internal) |
| `ErrorPanel`, E1, `AV_ERROR_COPY` (UC-10: 17 panel tests) | `kit/ErrorPanel.tsx` |
| `WidgetState`, W1 (UC-10: 5 tests) | `kit/WidgetState.tsx`, `kit/ago.ts` (DL's `avAgo`) |
| `DecisionTag`, `DecisionTagProps` exactly, D1 to D14 (UC-08: 29 tests) | `kit/DecisionTag.tsx` |
| D12: stamp on `--av-d-punch`; hole fill not animated under reduced motion | `kit/DecisionTag.tsx` (stamp), `kit/KitStyles.tsx` (the hole-fill rule and its `prefers-reduced-motion` override) |
| The request ID chip everywhere (`kind: "hash"`, 12, `req`) | `ErrorPanel.tsx`, `ReasonDialog.tsx`, `WidgetState.tsx`, `DecisionTag.tsx` |
| Named exports | `kit/index.ts` |
| The value rule (section 0) | Every value is a `--av-*` token or the literal DL uses for that element. `KitStyles.tsx` holds DL's own CSS rules word for word |

## Deviations
1. **The verify command doesn't filter.** `pnpm --filter @avel/web test -- test/kit` passes `--` through, so vitest runs the whole web suite. The kit files pass in that run. I also ran `vitest run test/kit` in `apps/web` to see the kit on its own: 3 files, 68 tests passed.
2. **FANTEM-01's "Expected: UC-08 passes"** looks like a slip in the plan: UC-08 is DecisionTag, which is FANTEM-02. I verified FANTEM-01 against its Required line (UC-09 and UC-10), and both pass.
3. **Build and typecheck are red, for a reason outside my territory:** `Could not resolve entry for router entry: router in apps/web/src`. That's Ghost's `src/router.tsx` (decisions.md 2026-11-07). They were red at my start commit too.
4. **The kit brings its own stylesheet** (`KitStyles.tsx`), as a React 19 hoisted `<style href="avel-kit" precedence="default">`. Inline styles can't hold hover, focus, keyframes or reduced motion, and `src/styles` (Nemi's) has only DL's tokens and base defaults. It holds three things, all DL's own CSS:
   - DL's "Overlays: Dialog" rules, word for word, including `av-fade` and `av-dialog-in`, which aren't in `tokens.css`. The Sheet rules are left out.
   - DL's "AVEL field anatomy" rules, scoped to `[data-ui="ReasonDialog"] textarea`.
   - The hole fill's `av-hole-fill 160ms var(--av-ease) both`, with `animation: none` under `prefers-reduced-motion` (D12).
   - **Checked on the server:** `renderToString` and the streaming `renderToReadableStream` both put the style in `<head>`, once.
5. **Where the contract left placement open, my choices:**
   - `Refresh list` (D10) is a `Button size="sm"` in the actions area, matching the stale action and ErrorPanel's buttons.
   - The D14 chip is its own line straight after the stale alert, after the Locked reason, or under the actions row (the countdown).
   - `clientName` (D3) sits straight after the kind label, before the id chip.
   - On a phone with only one decision button, that button is full width with no grid. D11's grid needs both buttons.
6. **Small structural differences that follow from the changes:**
   - DecisionTag's footer isn't drawn when it would be empty (`notAllowed` with no `onRefresh`, or no labels and no link). DL always draws it, because DL always has buttons.
   - ErrorPanel's action row is drawn only when it holds the button (E1) or the chip.
7. **Accessibility additions and DL props the kit can't take:**
   - ReasonDialog's textarea gets `aria-invalid` and `aria-describedby` pointing at the R1 error, and its id comes from `useId` instead of DL's fixed `av-reason`.
   - The R1 error uses DL's own field-error form from its step-up dialog: a stopped glyph, `--av-stopped` text and a `--av-stopped` field edge.
   - DL offsets the Locked reason's lock icon with Icon's `style` prop, which isn't ported. A wrapper span carries the same `marginTop: 3` instead.
8. **Types and internal pieces:**
   - `StatusGlyph`'s `onColor` isn't a public prop. Tag still draws its glyph on colour, as DL does, through the internal `drawStatusGlyph`.
   - `WidgetState.state` is required, because `populated` (DL's default) isn't ported.
   - `DecisionVariant` is DL's keys `| (string & {})`, so an unknown variant compiles and draws as `Decision` (D1).
   - `Dialog` (DL's `Uo`) isn't in section 4, so it's internal and not exported.
9. **HashChip copy:**
   - It clears its "Copied" timer on unmount.
   - It catches a refused clipboard write, so the rejection isn't left unhandled. As in DL, the chip shows "Copied" either way, and the full value stays in its title.
10. **`kit/ago.ts`** is a copy of DL's `avAgo` for WidgetState's stale band. The kit imports nothing outside itself, and Ghost's `lib/time.ts` isn't on main.

## Limitations
- Build, typecheck and the full web suite can't go green until Ghost's w0-data, and then Leon's decisions module, merge.
- I haven't run the kit in a real browser. Hover, focus trap and the reduced-motion hold are checked by reading against DL, not by running them.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero and Leah:**
  - DL's `WidgetState` loading state puts `aria-label="Loading"` on a `div` with no role, so assistive tech may ignore it. Biome flags it. I ported it as it is, with a suppression explaining why. If the label should be announced, the UI contract needs a change (for example `role="status"`).
- **Zero and Nemi:**
  - DL's "AVEL field anatomy" block is global in DL, but section 6 ends `base.css` before it. So the kit scopes it to ReasonDialog's textarea.
  - If more inputs arrive, that block probably belongs in `src/styles/base.css`, and then the kit's copy goes.
- **INT, on the plan:**
  - FANTEM-01's verify uses `-- test/kit`, which doesn't narrow the run.
  - Its Expected line names UC-08 instead of UC-09 and UC-10.
- **Leon:**
  - `DecisionTag`, `ReasonDialog`, `ErrorPanel` and `WidgetState` are exported with section 4's props.
  - `AV_DECISION_VARIANTS` and the `DecisionVariant` type are exported too.
  - An unknown variant string draws the generic "Decision".

## Files changed
```
apps/web/src/kit/Button.tsx
apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/Dialog.tsx
apps/web/src/kit/ErrorPanel.tsx
apps/web/src/kit/HashChip.tsx
apps/web/src/kit/Icon.tsx
apps/web/src/kit/KitStyles.tsx
apps/web/src/kit/ReasonDialog.tsx
apps/web/src/kit/StatusGlyph.tsx
apps/web/src/kit/Tag.tsx
apps/web/src/kit/WidgetState.tsx
apps/web/src/kit/ago.ts
apps/web/src/kit/index.ts
apps/web/src/kit/interaction.ts
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```

## Verification

```
$ pnpm --filter "@avel/web..." build
apps/web build: error during build:
apps/web build: Error: Could not resolve entry for router entry: router in .../apps/web/src
apps/web build: Failed
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 build: `vite build`
exit 1        # Ghost's src/router.tsx isn't on main yet (Deviation 3)

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
apps/web typecheck: Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 typecheck: `node -e "import('vite')..." && tsc -p tsconfig.json`
exit 1        # same cause; @avel/contract-mock doesn't exist yet

$ (cd apps/web && npx tsc -p tsconfig.json) | grep -E "src/kit|test/kit"
(no output)   # 0 errors in the kit; 31 errors elsewhere (data, decisions, router), the same 31 as at the start commit

$ pnpm lint
> biome check .
Checked 182 files in 93ms. No fixes applied.
exit 0

$ pnpm --filter @avel/web test
 ✓ |web| test/kit/decision-tag.test.tsx   (UC-08, 29 passed)
 ✓ |web| test/kit/reason-dialog.test.tsx  (UC-09, 17 passed)
 ✓ |web| test/kit/error-panel.test.tsx    (UC-10, 22 passed)
 ❯ |web| test/data/*.test.ts                 (85 failed: Ghost's subjects, not built)
 ❯ |web| test/modules/decisions/*.test.tsx   (37 failed: Leon's module, not built)
 Test Files  10 failed | 3 passed (13)
      Tests  122 failed | 68 passed (190)
exit 1

$ pnpm --filter @avel/web test -- test/kit
(the same run as above: the "--" doesn't filter; see Deviation 1)

$ (cd apps/web && npx vitest run test/kit)
 Test Files  3 passed (3)
      Tests  68 passed (68)

$ git diff --name-only main...HEAD
apps/web/src/kit/Button.tsx
apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/Dialog.tsx
apps/web/src/kit/ErrorPanel.tsx
apps/web/src/kit/HashChip.tsx
apps/web/src/kit/Icon.tsx
apps/web/src/kit/KitStyles.tsx
apps/web/src/kit/ReasonDialog.tsx
apps/web/src/kit/StatusGlyph.tsx
apps/web/src/kit/Tag.tsx
apps/web/src/kit/WidgetState.tsx
apps/web/src/kit/ago.ts
apps/web/src/kit/index.ts
apps/web/src/kit/interaction.ts
exit 0        # all in apps/web/src/kit/** (Part 5); the report is added by the last commit
```
