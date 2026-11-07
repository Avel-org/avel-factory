# FANTEM: w0-kit build, completion report

verdict: DONE

## Summary
Attempt a3 does FANTEM-04 only, as the task's notes say: K1 and R5 from UI contract section 4 (revision 9). `kit.css` has a `@media (max-width: 899px)` block, written with DL's tokens only. It makes every Button at least `var(--av-touch-min)` tall, gives HashChip's copy button and the dialog's Close button a transparent hit area at least 44px square without changing their drawn size, and sets ReasonDialog's textarea to `var(--av-phone-body)`. The `Dialog` frame now names its description in `aria-describedby`. FANTEM-01 to 03 were merged in a1 and a2. The locked kit tests (UC-08 to UC-10) pass unchanged.

## Pre-flight
- Part 2 files, all read:
  - `.claude/agents/fantem.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md`: read in full for sections 0 and 4, skimmed for the rest
  - `CR-W2 Pending decisions.md`: skimmed, nothing in it touches K1 or R5
  - `decisions.md`: Revision 9 and the size study read in full
  - `Frontend Map v0.6`: skimmed
  - the design library: its token stylesheet, `--av-touch-min` and `--av-phone-body`, and the `[data-density="phone"]` blocks
  - `Step 0 and Step 1 plan.md`: skimmed
  - this task doc
- `locks.md` is at `docs/agent-dispatch/frontend/sprint-01/locks.md`, not at the repo root. Its w0-kit lock is `apps/web/test/kit/**` at 965071b, and nothing under it was touched.
- Branch: `frontend/sprint-01/agent-fantem-w0-kit-build-a3`, which starts at 9b25f09.
- Part 7 commands: all available. The fresh worktree first needed `pnpm install --frozen-lockfile`, and `@avel/web` typecheck only passed once the `@avel/web...` build had built `@avel/contract`'s output.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FANTEM-01 | DONE (a1, merged) | e47b8a5, 56a079b |
| FANTEM-02 | DONE (a1, merged) | 14befc1 |
| FANTEM-03 | DONE (a2, merged) | 4f0cf1c |
| FANTEM-04 | DONE | d3ec9a4 |

## Contract to files
- **K1: every Button is at least `var(--av-touch-min)` tall below 900px.** In `apps/web/src/kit/kit.css`, under `@media (max-width: 899px)`: `[data-ui="Button"][data-variant] { min-height: var(--av-touch-min) }`.
  - Every kit Button carries `data-variant`, and so does D9's anchor. The selector is as specific as the link variant's own `min-height: 24px` rule and comes after it, so it wins over it.
  - `height: var(--kb-h)` is left as it is, and `min-height` lifts it.
  - Covered, and measured at 44px: Approve and Reject in D11's grid, `Open on GitHub`, the dialog's Cancel and confirm, and plain, link and small buttons.
- **K1: the copy and Close tap areas are at least 44px square, with the drawn size unchanged.** In `kit.css`, under the same media query:
  - `.av-hash-copy` and `.av-icon-close` get `position: relative`;
  - each gets an empty `::after`, absolutely placed and centred (`top/left: 50%`, `transform: translate(-50%, -50%)`), sized `var(--av-touch-min)` square with `min-width/min-height: 100%`. So when the copy button widens to read "Copied", the area grows with it;
  - the pseudo-element is transparent, and a tap on it hits the button it belongs to.
- **K1 and R6: the textarea is 16px.** In `kit.css`: `[data-ui="ReasonDialog"] textarea { font-size: var(--av-phone-body) }` below 900px.
- **R5: the description is the accessible description.** In `apps/web/src/kit/Dialog.tsx`:
  - a second `useId()` gives `descriptionId`;
  - the description `<p>` carries it;
  - the `role="dialog"` element has `aria-describedby={description ? descriptionId : undefined}`, so there's no attribute when there's no description.
  - ReasonDialog already passes `description` only when one is given, so it inherits this.
- **No CSS in JS, and no new literals.** Nothing was added to the TSX apart from markup attributes. The only values in the new rules are the two DL tokens, plus the centring geometry (`50%`, `-50%`, `100%`, `content: ""`), which isn't a colour, size, radius or duration.

**How I measured** (scratch harness, thrown away, not committed):
- **The page:** I bundled the real kit components with esbuild (a HashChip with `prefix="req"`, Buttons, a phone DecisionTag with a link, and an open ReasonDialog with a description, error and request ID). It loaded the built `app.css` (tokens and base) and `kit.css`.
- **The browser:** Playwright Chromium 1.65, at 390x844, 899x900, 900x900 and 1280x900.
- **What I compared:** the new `kit.css` against the pre-change one (`git show HEAD:…kit.css` before the commit).
- **The hit test:** `document.elementFromPoint` at 21px left, right, above and below each button's centre. A hit counts when the button `contains()` the element returned.

| At 390x844 | Before | After |
| --- | --- | --- |
| Page HashChip copy button: tap ±21px | 0 of 4 hit | 4 of 4 hit |
| Page HashChip copy button: drawn size, chip height, row height | 24x24, 22, 22 | 24x24, 22, 22 (unchanged) |
| Dialog Close: tap ±21px | 0 of 4 hit | 4 of 4 hit |
| Dialog Close: drawn size, head height | 32x32, 71 | 32x32, 71 (unchanged) |
| Dialog request ID copy: tap ±21px | 0 of 4 hit | 4 of 4 hit |
| Dialog request ID copy: drawn size | 24x24 | 24x24 (unchanged) |
| Button heights: Plain, Link, Small, Reject…, Approve, Open on GitHub, Cancel, Confirm | 32, 32, 28, 38, 38, 32, 32, 32 | 44 for all 8 |
| Textarea font-size | 14px | 16px |
| `aria-describedby` | | names the `<p>` reading "Say why, for the record." |

- **At 899x900:** the same as 390.
- **At 900x900 and 1280x900:** every element's bounding box, under `#root` and the dialog, is identical between the old and new `kit.css` (`layout identical: true`). Button heights, the 14px textarea and the 0 of 4 hits are unchanged.

## Deviations
- None from the task.
- One note on the value rule: the centring uses `50%`, `-50%` and `100%`. These are positioning geometry, not design values, and the contract's own example ("an absolutely placed `::after`") needs something like them.

## Limitations
- Below 900px, the copy button's hit area spreads 10px past the 22px chip, above and below, and 10px over the chip's own text. Nothing in the kit puts another control within that reach. If a later screen puts a control right beside a chip, the two areas could overlap.
- No chunk sizes to report for this task. On main the kit isn't imported by any route yet (Leon's decisions module isn't merged), so the build has no kit chunk. `kit.css` isn't JS, so K1 doesn't change the JS size.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT / Leon:** `pnpm --filter @avel/web test` fails on main as it stands, with 37 tests in 4 files, all in `apps/web/test/modules/decisions/**` (UC-11 to UC-28). They all fail with `apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen`, because Leon's module isn't merged. `test/data` and `test/kit` pass: 10 files, 153 tests. This diff only touches `apps/web/src/kit/**`.
- **Leah (a11y-perf re-review a2):** K1 and R5 are in. The measurement method above can be rerun on the page once Leon's a2 links `kitStylesheetHref`.
- **Zero / Brennan (kit review):** the K1 rules are the last block of `kit.css`.

## Files changed
```
apps/web/src/kit/Dialog.tsx
apps/web/src/kit/kit.css
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```

## Verification
```
$ pnpm --filter "@avel/web..." build
packages/contract build$ tsc -p tsconfig.json
apps/web build$ vite build
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/index-SlPnXw7v.js                 496.83 kB │ gzip: 155.40 kB
apps/web build: ✓ built in 610ms
apps/web build: dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
apps/web build: dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
apps/web build: dist/server/assets/_tanstack-start-manifest_v-B6lNn6Fe.js    0.39 kB │ gzip:  0.29 kB
apps/web build: dist/server/assets/router-Dvq-asiP.js                       27.35 kB │ gzip:  9.27 kB
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.18 kB
apps/web build: ✓ built in 310ms
exit=0
```

```
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
Scope: 3 of 6 workspace projects
packages/contract typecheck$ tsc -p tsconfig.json --noEmit
packages/contract typecheck: Done
packages/contract-mock typecheck$ tsc -p tsconfig.json --noEmit
packages/contract-mock typecheck: Done
apps/web typecheck$ node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
apps/web typecheck: Done
exit=0
```

```
$ pnpm lint
> biome check .

Checked 198 files in 695ms. No fixes applied.
exit=0
```

```
$ pnpm --filter @avel/web test

Environment  |web| jsdom was created 14 times · 23.07s total, 48% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments

/home/jt0629/projects/avel-wt/frontend-sprint-01-agent-fantem-w0-kit-build-a3/apps/web:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 test: `vitest run`
Exit status 1
exit=1
```

```
$ (FANTEM-04 verify) pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/kit && grep -n "max-width: 899px|--av-touch-min|--av-phone-body" kit.css && grep -n aria-describedby Dialog.tsx && ! grep -rlE "<style|dangerouslySetInnerHTML" apps/web/src/kit
typecheck ok
 Test Files  3 passed (3)
      Tests  68 passed (68)
939:   only: --av-touch-min (44px) and --av-phone-body (16px). At 900px and over nothing changes. ---- */
940:@media (max-width: 899px) {
944:    min-height: var(--av-touch-min);
959:    width: var(--av-touch-min);
960:    height: var(--av-touch-min);
968:    font-size: var(--av-phone-body);
8:// aria-describedby, beside aria-labelledby; with none, there's no aria-describedby.
103:          aria-describedby={description ? descriptionId : undefined}
exit=0
```

The `test` failure above is the 37 decisions screen tests, which need Leon's unmerged module (see Issues). `vitest run test/data test/kit`: 10 files and 153 tests passed.

```
$ git diff --name-only main...HEAD
apps/web/src/kit/Dialog.tsx
apps/web/src/kit/kit.css
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md   (this commit)
```
