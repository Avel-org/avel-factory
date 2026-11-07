# BRENNAN: w0-kit review-spec, completion report

verdict: PASS

## Summary
I reviewed Fantem's kit diff (`main...frontend/sprint-01/agent-fantem-w0-kit-build-a1`, head ada507e, with Zero's two P3 fixes in 56a079b) against UI contract section 4 (revision 6) and the design library's bundled source.

Every component is DL's, with only the changes section 4 lists, or changes that follow from them. `DecisionTagProps` matches the contract field for field, and D1 to D14, R1 to R4, E1 and W1 are each built as written. The locked kit tests pass, 68 of 68, and I wrote no findings. The only red check is the full web suite: Leon's `decisions` screen tests fail because his module isn't built yet.

## Pre-flight
- **Part 2 files:** all read.
  1. `.claude/agents/brennan.md`.
  2. `codebase-analysis.md`.
  3. and 9. `docs/ui-contracts/decisions-approval-page.md`, revision 6: sections 0, 4, 5, 6, 7 and 8 and Appendix A read in full; sections 1 to 3 skimmed.
  4. `CR-W2 Pending decisions.md`: sections 1 to 2.3 in full, the rest skimmed.
  5. `decisions.md`: "The UI contract", "INT's answers on Nemi's w0-app report", "w0-data merged" and "Revision 6" in full, the rest by heading.
  6. Frontend Map v0.6: In short, Layers, the kit lines and Territories.
  7. DL v1.1, from its bundled script and stylesheet: `n$`, `LH`, `BH`, `ee`, `d8`, `ou`, `ry`, `te`, `Ze`, `h8`, `dt`, `ne`, `Go`, `Uo`, `Dy`, `y8`, `v8`, `ly`, `x8`, `jr` and `eD`. Also the `.pd`/`.pd-actions`/`.pd-project` CSS, the "Overlays: Dialog, Sheet" block, "AVEL field anatomy", the token section's reduced-motion block and keyframes, and the step-up dialog's field-error form.
  8. `Step 0 and Step 1 plan.md`: item 13 and test 14.
  10. This task doc.
- **Role card's Read first list:** I read the docs this review depends on (FM). Backend modules, Roster, API and data reference, and DATABASE.md exist, but none applies to a kit that takes plain props.
- **Branch:** `frontend/sprint-01/agent-brennan-w0-kit-review-spec-a1`, starting at a10a690: INT's review base, main (7a53d8a) with Fantem's ada507e merged, per INT's message. `AVEL_BASE` is 7a53d8a.
- **Part 7 commands:** all available after `pnpm install --frozen-lockfile` (the worktree had no `node_modules`) and `pnpm --filter @avel/contract build` (decisions.md, 2026-11-07: web tests need the contract built).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | this report's commit |

## Findings
none

## Contract to files
Each row was checked against DL's minified source, compared line by line.

| Contract item | Kit file | Result |
| --- | --- | --- |
| `Button`: 9 props ported, 7 left out, no changes | `Button.tsx` | Same variants (`d8`), sizes, padding, colours, shadow, sheen, `translateY(0.5px)`, transition and `ButtonWithReason` as `ee`. Always `type="button"` and `aria-pressed` false for `segment`, because `type` and `pressed` aren't ported. `holdToConfirm` is gone |
| `Tag`: tone, size, icon, title, children; no `glyph` or `style` | `Tag.tsx` | Same as `Ze` and `h8`. The tone's glyph is always drawn, as DL's default `glyph: true` does |
| `Icon`: per-icon `lucide-react` imports | `Icon.tsx` | `data-ui="Icon"`, `data-icon`, size 16, stroke 1.75, and `title` gives `role="img"` with a `<title>`. Checked against lucide-react 1.70.0: a `<title>` child stops its automatic `aria-hidden` |
| `StatusGlyph`: status, size; no `onColor` | `StatusGlyph.tsx` | Every case is identical to `ne`. `onColor` reaches only the kit's Tag, through `drawStatusGlyph` |
| `HashChip`: no `verified`, `href` or `title`; copy button `Copy {value}` | `HashChip.tsx` | Same as `dt`. The title is always the full value |
| Request ID chip: `kind: "hash"`, 12, `req`, `Copy {id}` | `ErrorPanel.tsx`, `ReasonDialog.tsx`, `WidgetState.tsx`, `DecisionTag.tsx` | All four use those exact props |
| `ReasonDialog`, R1 to R4 | `ReasonDialog.tsx`, `Dialog.tsx`, `KitStyles.tsx` | Same as `Go`, `Uo` and `Dy`. **R1:** `role="alert"` under the textarea, in DL's own step-up field-error form (`aria-invalid`, `--av-stopped` edge, stopped glyph at 10). **R2:** `defaultReason ?? ""` on each open. **R3:** confirm doesn't call `onClose`. **R4:** the chip under the error |
| `ErrorPanel`, E1 | `ErrorPanel.tsx` | `AV_ERROR_COPY` is `v8` word for word. The button is drawn only with `onAction`. 409 is primary, and 429's button is disabled, as in DL |
| `WidgetState`, W1 | `WidgetState.tsx`, `ago.ts` | loading, empty (`x8`), staleVersion and both error forms, as `ly`. W1's chip goes under the message, or under the stale band's status row. `ago` is `jr` word for word, and identical to `lib/time.ts`'s `formatAgo` |
| `DecisionTagProps` | `DecisionTag.tsx:49-74` (diff) | Field for field the same as section 4's block |
| D1 and D2: flat props, optional `idLabel`, D2's `aria-label`; unknown variant → `Decision`, circle | `DecisionTag.tsx` | Done. `LH` is copied word for word as `AV_DECISION_VARIANTS` |
| D3: `clientName` after the kind label | `DecisionTag.tsx` | Done, styled as `eD`'s `.pd-project` (muted, 13px label, ellipsis) |
| D4, D7, D8 and D13: callbacks only; `Rejecting…`; buttons by state; `{rejectLabel}…`; no label, no button | `DecisionTag.tsx` | Done for every state |
| D5 and D6: approved line; version binding as text, struck in `stale` | `DecisionTag.tsx` | Done |
| D9: `link` as a link-style anchor with `arrow-up-right`, `_blank`, `noopener noreferrer` | `DecisionTag.tsx`, `Button.tsx` (`LINK_BUTTON_STYLE`) | Done. Hover underlines through base.css, and the inline colour and offset keep the link Button's look |
| D10: `actionsDisabledReason` on Approve as `disabledReason`; `inlineError` above the actions; `Refresh list`† in `notAllowed` | `DecisionTag.tsx` | Done |
| D11: phone grid `minmax(0, 1fr) minmax(0, 1.4fr)`, gap 10px, Reject left | `DecisionTag.tsx` | Same as `.pd[data-phone] .pd-actions`. The buttons are `lg` and full width, as in `eD` |
| D12: stamp on `--av-d-punch`; hole fill `av-hole-fill 160ms` not animated under reduced motion | `DecisionTag.tsx`, `KitStyles.tsx` | Done. The keyframes come from `tokens.css` |
| D14: one request ID chip, under the stale note, the Locked reason or the countdown | `DecisionTag.tsx` | Done, after Zero's 01 fix |
| The value rule (section 0) | all | Every `var(--…)` the kit uses is defined in `apps/web/src/styles` (checked with the loop below). No hex colours. The other literals are DL's, for the same element |
| UC-08 to UC-10 | `apps/web/test/kit/**` (locked at 965071b) | 68 of 68 pass. The diff doesn't touch them |

```
$ for v in $(grep -oh 'var(--[a-z0-9-]*' apps/web/src/kit/*.ts* | sed 's/var(//' | sort -u); do grep -q -- "$v:" apps/web/src/styles/*.css || echo "MISSING $v"; done; echo done
done
```

**Built, but not in section 4.** I checked each against DL and the contract. None is a finding:
- **`KitStyles.tsx`:** DL's Dialog CSS, word for word, without the Sheet rules. DL's field anatomy, scoped to the reason dialog's textarea. The D12 hole-fill rule. Inline styles can't hold `:hover`, keyframes or media queries, and section 6 ends `base.css` before the field anatomy, so the kit has to carry these.
- **`Dialog.tsx`:** DL's `Uo`/`Dy`, internal and not exported.
- **The empty footer:** `DecisionTag` draws no footer when it would be empty, which only D8 (`notAllowed` with no buttons) makes possible.
- **ErrorPanel's empty action row** isn't drawn. That follows from E1.
- **Extra named exports** (`AV_DECISION_VARIANTS`, `AV_ERROR_COPY`, types): DL's own names. FM requires named exports only, and these are.

## Deviations
- **Start commit:** INT's review base a10a690, not a merge-base checkout, as INT's message said. The kit diff is `git diff main...frontend/sprint-01/agent-fantem-w0-kit-build-a1`.
- **Two set-up commands:** I ran `pnpm install --frozen-lockfile` and `pnpm --filter @avel/contract build` before the Part 7 commands. They changed no tracked file.

## Limitations
- I reviewed against DL's source and ran the locked tests in jsdom. I didn't open the kit in a browser, so hover, focus trap and reduced motion are checked by reading, not by running them.
- `pnpm --filter @avel/web test` fails 37 tests, all in `test/modules/decisions/**`. The cause is "`screens.ts` should export the screen as `DecisionsScreen`": Leon's module isn't built. Every kit and data test passes.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Leon:**
  - `DecisionTag` draws D14's countdown chip only in `seen` with `actionsDisabledReason` set. Pass `requestId` there only for a 429, not with "You're offline."
  - 5.3's `network` and `server` chip goes in your `inlineError`, not in `DecisionTag.requestId`.
  - 5.4's empty card (`StatusGlyph` done) isn't one of `WidgetState`'s icons. The kit's Icon registry has only the 19 icons the kit draws.
- **Zero and Nemi:** I agree with Fantem's note. If more inputs arrive, DL's field anatomy probably belongs in `base.css`, and then `KitStyles` drops its scoped copy. Nothing to do for sprint-01.
- **INT:** `git diff --name-only main...HEAD` below lists Fantem's kit files too, because this branch starts at the review base with his branch merged in. `a10a690..HEAD` lists only my report.

## Files changed
```
$ git diff --name-only a10a690..HEAD
docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-kit-review-spec-completion.md
```

## Verification

```
$ pnpm --filter @avel/web exec vitest run test/kit        # BRENNAN-01's verify
 Test Files  3 passed (3)
      Tests  68 passed (68)
exit 0

$ git diff --stat main...frontend/sprint-01/agent-fantem-w0-kit-build-a1 -- apps/web/test apps/web/e2e apps/web/vitest.config.ts
(no output: no locked path changed)

$ pnpm --filter "@avel/web..." build
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.19 kB
apps/web build: ✓ built in 193ms
apps/web build: Done
exit 0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
exit 0

$ pnpm lint
> biome check .
Checked 197 files in 99ms. No fixes applied.
exit 0

$ pnpm --filter @avel/web test
 ❯ |web| test/modules/decisions/list.test.tsx (14 tests | 14 failed)
 ❯ |web| test/modules/decisions/errors.test.tsx (16 tests | 16 failed)
 ❯ |web| test/modules/decisions/deciding.test.tsx (7 tests | 7 failed)
AssertionError: apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen: expected undefined to be defined
 Test Files  3 failed | 10 passed (13)
      Tests  37 failed | 153 passed (190)
exit 1        # Leon's decisions module isn't built yet; kit 68/68 and data 85/85 pass

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
docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-kit-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
# everything except my report is Fantem's, from the review base's merge (a10a690).
# My commit changes only my report, which is in Part 5.
```
