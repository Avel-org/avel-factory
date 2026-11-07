# FANTEM: w0-kit build, completion report

verdict: DONE

## Summary
Attempt a2 did only FANTEM-03. FANTEM-01 and 02 merged in a1. The kit's styles now live in one static stylesheet, `apps/web/src/kit/kit.css`, and `kit/index.ts` exports its URL as `kitStylesheetHref` (a `?url` import). `KitStyles.tsx` and every CSS string and style object are gone. The kit renders no style element, and there's no `dangerouslySetInnerHTML`.

Inline `style` is left in three places only, all values the locked kit tests read from the element:
- D11's phone grid;
- D6's stale strike;
- D12's stamp animation. This one isn't in the contract's list: see Deviation 1.

All 68 locked kit tests pass unchanged, and lint is clean. A browser comparison against main's kit found no computed-style difference (Limitations says how it was checked). The kit's JS drops from 11,096 B to 7,527 B gzip.

## Pre-flight
- **Branch:** `frontend/sprint-01/agent-fantem-w0-kit-build-a2`, starting at `3bf5e3b` (main).
- **Part 2 files.** All exist. In this attempt I read:
  1. `.claude/agents/fantem.md`
  2. `codebase-analysis.md`
  3. The UI contract (revision 7):
     - sections 0 and 4 in full, including "The kit's styles";
     - section 5's route, module and "Styles and loading" paragraphs;
     - sections 6 and 8.
  4. `decisions.md`: "Revision 7" in full.
  5. This task doc, in full.
- **Part 2 files not re-read in a2:** CR-W2, the Frontend Map, the Step plan and the design library.
  - a2 changes where values live, not what they are. Every value was copied from a1's merged components, which Zero and Brennan reviewed against DL.
  - From DL I only checked its Dialog class names, with a grep.
  - I'm saying this plainly rather than counting those files as read.
- **Starts conditions:** the w0-kit tests are locked (`locks.md`: w0-kit · 965071b), and Nemi's w0-app is on main.
- **Part 7 commands:** all available.
  - `pnpm install --frozen-lockfile` ran clean in this fresh worktree, and the lockfile is unchanged.
  - `typecheck` needs `packages/contract/dist`, which the Part 7 `build` creates. Run in Part 7's order, it passes.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FANTEM-01 | DONE (a1, merged) | e47b8a5 |
| FANTEM-02 | DONE (a1, merged) | 14befc1 |
| FANTEM-03 | DONE | 4f0cf1c |

## Contract to files
- **Section 4, "Where they live":** `kit.css` holds every rule as class and `[data-ui]` rules. That covers:
  - DL's Overlays (Dialog) and field-anatomy rules, word for word from `KitStyles.tsx`;
  - D12's hole fill and its reduced-motion rule;
  - every style object that was in `Button`, `Tag`, `Icon`, `StatusGlyph`, `HashChip`, `Dialog`, `ReasonDialog`, `ErrorPanel`, `WidgetState` and `DecisionTag`.
- **Section 4, "How it's loaded":** `index.ts` exports `kitStylesheetHref` from `./kit.css?url`.
- **Section 4, "No CSS in JavaScript":** `KitStyles.tsx` is deleted, and its imports are gone from `Dialog.tsx` and `DecisionTag.tsx`.
- **State the kit tracks in JS** reaches the CSS as data attributes. JS still decides each state, so behaviour is unchanged:
  - `data-hovered` and `data-pressed` come from DL's `ry`/`ou` in `interaction.ts`;
  - the variants are `data-variant`, `data-size`, `data-tone`, `data-layout`, `data-block`, `data-icon-only`, `data-copy`, `data-copied`, `data-strike`, `data-compact` and `data-stopped`.
- **Section 4, "What stays inline":**
  - D11's grid: `DecisionTag.tsx`, the phone actions `div`;
  - D6's strike: `DecisionTag.tsx`, `Binds to {label}`;
  - D12's stamp animation: Deviation 1.
- **Locked UC-08 to UC-10:** `apps/web/test/kit/**`, unchanged, 68 of 68 passing.
- **Task 3's Expected (chunk sizes against INT's split):** see "JS gzip, before and after" below.

### JS gzip, before and after
- **The app build can't show the kit.** On main no route imports the kit (Leon's `routes/index.tsx` isn't merged), so `pnpm --filter @avel/web build` prints no kit chunk.
- **So I measured the kit on its own.** Each entry was bundled with Vite library mode, minified, with `react`, `react-dom` and `lucide-react` external, and gzipped with `-9`.
- **"Before" is main's kit (`3bf5e3b`), measured the same way:**

| Entry | JS raw before | JS gzip before | JS raw after | JS gzip after | Gzip change |
| --- | --- | --- | --- | --- | --- |
| `kit/index.ts` (the whole kit) | 43,254 | 11,096 | 26,059 | 7,527 | −3,569 (−32%) |
| `Button.tsx` | 7,502 | 2,522 | 2,928 | 1,306 | −1,216 (−48%) |
| `DecisionTag.tsx` (with Button, HashChip, Tag, Icon and StatusGlyph) | 29,177 | 7,755 | 15,179 | 4,600 | −3,155 (−41%) |

- **CSS:** `kit.css` is a separate asset, 16,920 B raw and 3,644 B gzip. Under section 8 it doesn't count toward the JS budget.
- **INT's split** (Button 5.2 kB, DecisionTag 5.3 kB gzip) was measured on Leon's branch with that app's chunking, so the absolute numbers don't line up with mine. The ratios are what carry over: Button's JS is about half what it was, and DecisionTag's about 40% smaller. Re-measuring `/` is for Leon's a2 and Leah.

## Deviations
1. **D12's stamp animation stays inline. The contract's "what stays inline" names only D11 and D6.**
   - The locked UC-08 test `approved (D12): the stamp's animation reads --av-d-punch` checks `card.outerHTML` for `--av-d-punch`. A stylesheet value can't appear in the HTML.
   - So the stamp keeps one inline declaration: `animation: av-stamp-land var(--av-d-punch) var(--av-ease) 80ms both`. Its other values (position, border, type, `rotate(-7deg)`) are in `kit.css`.
   - This is the contract's own rule: "the values the locked kit tests read from the element". The list after it just missed this one.
   - **Needs:** Zero, to add D12's stamp animation to section 4's "What stays inline" list.
2. **HashChip's `strike` moved to CSS (`[data-strike]`).** No locked test reads it: `isStruck` is only used on D6's version text. So it follows the general rule, not the D6 exception.
3. **`Dialog.tsx` still sets `document.documentElement.style.overflow`.** That's DL's scroll lock (`Dy`), a runtime behaviour on `<html>`, not a style rule the kit draws. It's unchanged.
4. **One `biome-ignore` in `kit.css`** for `noImportantStyles`, on DL's overlay reduced-motion rule (`animation: none !important`). That rule is word for word from DL.
5. **Biome formatted `kit.css`** to its CSS style: one declaration per line, and `.985` printed as `0.985`. The values are the same.
6. **Two rules raise specificity on purpose.** Inline styles used to beat every stylesheet, so these keep the cascade's outcome the same:
   - `a[data-ui="Button"][data-variant]` keeps the D9 link anchor's colour and 3px underline offset over base.css's `a:hover`. Its underline on hover is unchanged: the inline style never set `text-decoration`.
   - The ReasonDialog field's error edge, `textarea[aria-invalid="true"]`, comes after `:hover` and `:focus-visible`.

## Limitations
- **The browser comparison** was a temporary harness in `apps/web/src/kit/__cmp__/`, deleted before commit and never committed.
  - **Setup:** headless Chromium on a Vite dev server, with the app's `app.css` (tokens and base) loaded. The same specimens were rendered from main's kit and from this branch:
    - every Button variant × size × {label, icons, icon-only, block, disabled, disabledReason, disabledReason + block};
    - every Tag tone × {default, sm + icon, empty};
    - HashChip kinds × {prefix + strike, copy on and off, null};
    - every StatusGlyph, an Icon, and ErrorPanel codes × compact;
    - all WidgetState states and the stale band;
    - DecisionTag {desk, phone} × all seven states × {version, sha} × {plain, link + disabledReason + inlineError, approve only};
    - the open ReasonDialog with an error and a request ID.
  - **Result:** all computed properties of 5,139 elements at rest, plus 246 hover and press snapshots, matched: **0 differences**.
    - The hover and press snapshots cover every md Button variant with its modifiers, every DecisionTag state and layout, and the HashChip copy buttons.
    - Animations were settled before the at-rest pass, and transitions were turned off for the interaction pass. The `transition` values themselves were compared at rest.
  - **The harness can catch a change.** I changed one token in `kit.css` (`.av-dt-age` font size) and it reported 756 differences. Then I restored the file, byte for byte.
  - **Not covered:** hover and press at sizes other than md. Those rules key on `data-size` exactly as at rest, and at rest every size matched.
- **The kit's CSS reaches the page only once the page links `kitStylesheetHref`.** That's Leon's decisions a2 (section 5, "Styles and loading"). Until then the kit draws unstyled, but no page on main draws it yet.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Leon (decisions a2):** link `kitStylesheetHref` in route `/`'s `head` through `decisionsScreenStylesheets` (section 5). Without it, the kit draws unstyled.
- **Zero:** please add D12's stamp animation to section 4's "What stays inline" (Deviation 1).
- **INT, two notes on the app build:**
  - **The client JS figure changed between my builds, but not because of the kit.** My first `pnpm --filter @avel/web build`, run before `packages/contract/dist` existed, reported `index-*.js` 397.57 kB / 127.47 kB gzip. Every build after `pnpm --filter "@avel/web..." build` reports 496.83 kB / 155.40 kB gzip. The kit isn't in that bundle: a grep of `dist/client/assets/*.js` for `DecisionTag`, `av-dt-` and `kitStylesheet` finds nothing. It may be worth checking which `@avel/contract` build Leah's budget run resolves.
  - **`app.css` shrank** from 35.26 kB to 31.88 kB (7.51 to 6.94 kB gzip). Tailwind scans the kit's source, and the old inline style strings produced utility class candidates. They're gone now.

## Files changed
```
apps/web/src/kit/Button.tsx
apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/Dialog.tsx
apps/web/src/kit/ErrorPanel.tsx
apps/web/src/kit/HashChip.tsx
apps/web/src/kit/Icon.tsx
apps/web/src/kit/KitStyles.tsx   (deleted)
apps/web/src/kit/ReasonDialog.tsx
apps/web/src/kit/StatusGlyph.tsx
apps/web/src/kit/Tag.tsx
apps/web/src/kit/WidgetState.tsx
apps/web/src/kit/index.ts
apps/web/src/kit/kit.css         (new)
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```
Everything is inside Part 5's territory.

## Verification

**FANTEM-03's verify**, one chain. It exits 0:
```
$ pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/kit && test -f apps/web/src/kit/kit.css && ! grep -rlE '<style|KitStyles|dangerouslySetInnerHTML' apps/web/src/kit && pnpm --filter @avel/web build 2>&1 | grep -E 'gzip' | tail -12
apps/web typecheck: Done
 Test Files  3 passed (3)
      Tests  68 passed (68)
(grep: no file listed)
dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
dist/client/assets/index-SlPnXw7v.js                 496.83 kB │ gzip: 155.40 kB
dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
dist/server/assets/_tanstack-start-manifest_v-CFh7QUvh.js    0.39 kB │ gzip:  0.29 kB
dist/server/assets/router-Dvq-asiP.js                       27.35 kB │ gzip:  9.27 kB
dist/server/server.js                                      261.19 kB │ gzip: 63.19 kB
exit 0
```

**Part 7:**
```
$ pnpm --filter "@avel/web..." build
packages/contract build: Done
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/index-SlPnXw7v.js                 496.83 kB │ gzip: 155.40 kB
apps/web build: ✓ built in 273ms
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.19 kB
apps/web build: Done
exit 0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
exit 0

$ pnpm lint
> biome check .
Checked 197 files in 136ms. No fixes applied.
exit 0

$ pnpm --filter @avel/web test
 Test Files  3 failed | 10 passed (13)
      Tests  37 failed | 153 passed (190)
exit 1
```

**The `test` exit 1 isn't from the kit.** All 37 failures are in `test/modules/decisions/{list,deciding,errors}.test.tsx`: the locked UC-11 to UC-28 tests for Leon's decisions module, which isn't on main (`apps/web/src/modules` doesn't exist). Everything else passes, including the kit's 68 tests and the data tests.

```
$ git diff --name-only main...HEAD
(the list under Files changed)
```
