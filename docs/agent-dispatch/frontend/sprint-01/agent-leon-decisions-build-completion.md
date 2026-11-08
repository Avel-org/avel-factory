# LEON: decisions build, completion report

verdict: PARTIAL

## Summary

Attempt a2 is built on a1's code, cherry-picked from c3effb3's build commit e771108 as 016a230. It adds the module's static stylesheet `decisions.css`. Route `/`'s head links it and `kit.css` through `decisionsScreenStylesheets`, so both are in the server's HTML. `ReasonDialog` is now lazy, in its own 1.52 kB chunk outside `/`'s first load, and the `DecisionsPage` root carries the hydration marker. All 37 locked screen tests pass (190 of 190 web tests), as do UC-29 and UC-30 end to end on phone and desk. **One locked end-to-end test fails: UC-31.** It measures D11's grid before it waits for the hydration marker, and the server can't know the viewport, so it draws the desk layout until hydration. With the wait moved earlier, in a scratch copy, UC-31 passes in full (Deviations 2).

## Pre-flight

- **Part 2 files, all read:**
  - `.claude/agents/leon.md`
  - `codebase-analysis.md`
  - the UI contract (revision 9, in full)
  - CR-W2: read for a1. In a2, I checked section 5.1's row and route 54 against the contract's quotes.
  - sprint `decisions.md`: "Revision 7", "Revision 8", "Revision 9", the size study and INT's answers on revision 9, in full; the rest skimmed
  - Frontend Map v0.6: What every module looks like, Data layer, Rendering and SSR (as in a1)
  - the design library: the Decisions screen's `.lib-screen`, `.scr-*`, `.dec-*` and `.pd*` rules, and HashChip `dt`
  - the Step 0 and Step 1 plan (as in a1)
  - Leah's a11y-perf completion report, and findings decisions-leah-01 to -04
  - this task doc
- **Also read:**
  - `locks.md`
  - the locked `e2e/decisions.spec.ts` and `playwright.config.ts`
  - the decisions test helpers
  - the kit's `index.ts`, `ReasonDialog.tsx`, `Dialog.tsx`, `DecisionTag.tsx` and `kit.css` (including K1)
  - `__root.tsx`, `vite.config.ts` and `data/errors.ts`
  - Fenn's e2e completion report
- **Not read in full:** `docs/design/API and data reference.md` (leon.md's Read first). Nothing changed in routes 52 to 54 for a2, and I worked from the contract's quotes.
- **Branch:** `frontend/sprint-01/agent-leon-decisions-build-a2`, starting at `b97076e`. INT's message confirmed that main has Fantem's w0-kit a3, Nemi's w0-split and Fenn's e2e a3 (lock 29a2458), and not Ghost's w0-data a2.
- **Setup:** `pnpm install --frozen-lockfile` (no tracked change) and `pnpm --filter @avel/contract build`.
- **Part 7 commands:** all available.

## Tasks

| Task | Status | Commit |
| --- | --- | --- |
| LEON-01 | DONE: typechecks; UC-11, UC-12 and UC-26 pass | 016a230 (a1's e771108, cherry-picked) |
| LEON-02 | BLOCKED on one locked test: UC-11 to UC-30 pass, and UC-31 fails on the test's own order (Deviations 2). A stale version is never re-sent: UC-15 asserts exactly one route 54 request | 016a230 |
| LEON-03 | DONE: no CSS in JS in the module; both sheets are in the server's HTML; `ReasonDialog` is in its own chunk; every locked screen test passes | f63a06e |
| LEON-04 | DONE: the server's HTML has no `data-hydrated`, the hydrated page has it, and the browser logs no hydration warning. UC-29 and UC-30 wait on the marker and pass. UC-31 fails before its wait (LEON-02) | f63a06e |

## Contract to files

| Contract item | Files | Result |
| --- | --- | --- |
| §5 Route, loader, module, layout, 5.1 to 5.5 (a1, unchanged apart from styles) | `api.ts`, `decisions.ts`, `index.ts`, `screens.ts`, `screens/DecisionsScreen.tsx`, `routes/index.tsx` | UC-11 to UC-28: 37/37 pass |
| §5 "Styles and loading": the module's styles in `decisions.css`, with no CSS in JS | `decisions.css`, and the screen uses `className` only (`grep style= src/modules/decisions` finds nothing) | values are a1's, which came from DL's `.lib-screen[data-wide]`, `.scr-*`, `.dec-sec*`, `.dec-count` and the empty card |
| §5: `screens.ts` exports `decisionsScreenStylesheets` (`kitStylesheetHref` and the module's `?url`); route `/`'s head links both | `screens.ts`, `routes/index.tsx` | dev server SSR HTML: `<link rel="stylesheet" href="/src/kit/kit.css">` and `…/decisions.css` |
| §5: `ReasonDialog` through `React.lazy`, fetched once the list has rendered | screen: `loadReasonDialog`, `prefetchReasonDialog` (an effect in `DecisionsList`), `<Suspense fallback={null}>` around the dialog | build: `ReasonDialog-*.js` 1.52 kB gzip. It's in neither the root's nor `/`'s preloads in the start manifest. In the browser it's fetched after the list renders, before any tap |
| §5 hydration marker: `useSyncExternalStore`, with server snapshot `false` and client `true`, and no `useEffect` | screen: `useHydrated`, `data-hydrated="true"` on the `DecisionsPage` root | SSR HTML: absent. Hydrated: present. Console: no warnings or errors |
| §5.3 null-version `stale` | screen, `failureView` | still a1's read of the thrown error's message: `UiError.stale.message` isn't on main (Ghost's w0-data a2) |
| §8 first load, reported | build output | below, under Limitations |

## Deviations

1. **The lazy `ReasonDialog` is imported straight from `apps/web/src/kit/ReasonDialog`, not through `kit/index.ts`.** This breaks FM's rule that a module imports the kit only through its index.
   - **Why:** I built it first with `import("../../../kit")`. The kit then became one shared chunk (`kit-*.js`, 10.18 kB gzip) that the entry imports statically, with `ReasonDialog` inside it. That's no split at all.
   - A dynamic import of the index can't split, because the index is also imported statically. Only a direct path gives the dialog a chunk of its own.
   - **It's the one import past the index,** and a comment on it in the screen says why.
   - **The clean fix is the kit's (Fantem):** for example, the kit exports a loader such as `loadReasonDialog = () => import("./ReasonDialog")` from `index.ts`, and the module calls that. Then the deep import goes.
2. **UC-31 (locked) measures the phone grid before it waits for the hydration marker.** I didn't change the test.
   - **What fails:** the spec checks D11's grid (lines 104 to 135), then waits for `data-hydrated` (line 138).
   - **Why it fails:** the page chooses `layout="phone"` in JavaScript (`useIsPhone`, `matchMedia("(max-width: 899px)")`). The server can't know the viewport, so its HTML has the desk layout. It's a1's documented limitation.
   - **The result:** it fails 3 of 3 runs on `Received: "flex"`.
   - **The check:** a scratch copy of the spec, with only the wait moved to just after `await expect(reject).toBeVisible()`, passes UC-31 in full: the grid, both columns, 44px, the 16px input and the confirm button.
   - **The options**, for INT:
     - (a) Fenn moves UC-31's wait before the grid check;
     - (b) the kit draws D11's phone actions from a CSS media rule, so the server's HTML is right on a phone. That's a kit and contract change, and the better first paint.
   - I didn't style the desk actions as a grid in `decisions.css`. The task's notes rule out working around the kit's layout there.

## Limitations

- **`/`'s first load, counted as section 8 counts it: 173.94 kB gzip.** That's over 160 kB. Per the task, it isn't mine to fix in a2: zod/mini is the cut.
  - The start manifest gives the root's preloads and script as `index-DimhTn_r.js` (154.68 kB) and `jsx-runtime-Wy9s6hX0.js` (3.39 kB). It gives `/`'s preload as `routes-Cosr3y1m.js` (15.87 kB).
  - So 154.68 + 3.39 + 15.87 = 173.94.
  - `ReasonDialog-I_m4HCea.js` (1.52 kB) is lazy and not counted.
  - Stylesheets, not counted: `kit.css` 3.75 kB, `decisions.css` 0.54 kB and `app.css` 6.94 kB.
  - I read the HTML's preloads from the manifest, not from a served production page: there's no API server in sprint-01, and my preview run was refused in this session.
- **Phone first paint:** on a phone, the desk layout shows until hydration (Deviations 2).
- **`ReasonDialog` fetch failure:** if the chunk can't be fetched when the dialog opens, the lazy component throws to the page's first-load boundary. That shows `Couldn't load` with Retry, and no request ID.
  - The prefetch's own failure isn't kept: the dialog's render fetches again.
  - The contract has no copy for this case, so I added none.
- **`UiError.stale.message`:** Ghost's w0-data a2 isn't on main, so the null-version stale row reads the thrown error's message, as a1 built it. The switch comes in a later fix.
- **HashChip weight:** in the browser, with `kit.css` linked, `HashChip` computes `"IBM Plex Mono" … 400`, not 500. So finding 04's Mono 500 may still be unused on first paint. `kit.css`'s `[data-ui="HashChip"]` rule sets no `font-weight`. That's the kit's (Issues).

## Parked chains

none

## P0 discoveries

none

## Issues for other agents

1. **Fenn / INT:** UC-31's hydration wait sits after the grid check. Option (a) or (b) in Deviations 2.
2. **Fantem:**
   - A lazy entry for `ReasonDialog` from `kit/index.ts`, so the module stops importing `kit/ReasonDialog` directly (Deviations 1).
   - Possibly D11 as a CSS media rule (Deviations 2 (b)).
   - `HashChip` computes font weight 400 with `kit.css` linked. Check it against DL's `dt` and Leah's finding 04.
3. **Leah:** `/`'s first load is 173.94 kB gzip as section 8 counts it, from the start manifest. The lazy dialog is 1.52 kB and out of it.
4. **Ghost:** when `UiError.stale.message` lands, the null-version stale row in `failureView` switches to it (a Leon follow-up).
5. **INT:** `016a230` is a1's `e771108`, cherry-picked onto a2's branch, because a1 was never merged to main.

## Files changed

```
apps/web/src/modules/decisions/api.ts
apps/web/src/modules/decisions/decisions.css
apps/web/src/modules/decisions/decisions.ts
apps/web/src/modules/decisions/index.ts
apps/web/src/modules/decisions/screens.ts
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx
apps/web/src/routes/index.tsx
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md
```

## Verification

```
$ pnpm --filter "@avel/web..." build          # exit 0
apps/web build: dist/client/assets/decisions-BpPPU4Jm.css              1.54 kB │ gzip:   0.54 kB
apps/web build: dist/client/assets/kit-DDPuOw4w.css                   17.31 kB │ gzip:   3.75 kB
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/ReasonDialog-I_m4HCea.js            3.50 kB │ gzip:   1.52 kB
apps/web build: dist/client/assets/jsx-runtime-Wy9s6hX0.js             8.91 kB │ gzip:   3.39 kB
apps/web build: dist/client/assets/routes-Cosr3y1m.js                 46.49 kB │ gzip:  15.87 kB
apps/web build: dist/client/assets/index-DimhTn_r.js                 493.83 kB │ gzip: 154.68 kB
apps/web build: ✓ built in 537ms
apps/web build: ✓ built in 183ms

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck   # exit 0
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint                                    # exit 0
Checked 205 files in 114ms. No fixes applied.

$ pnpm --filter @avel/web test                 # exit 0
 Test Files  14 passed (14)
      Tests  190 passed (190)

$ pnpm --filter @avel/web exec vitest run test/modules/decisions
 Test Files  4 passed (4)
      Tests  37 passed (37)

$ pnpm --filter @avel/web exec playwright test
  ✓  1 [phone] UC-29 (2.8s)
  ✓  2 [phone] UC-30 (2.3s)
  ✘  3 [phone] UC-31 (171ms)   Expected: "grid"  Received: "flex"  (decisions.spec.ts:125)
  ✓  4 [desk] UC-29 (2.4s)
  ✓  5 [desk] UC-30 (2.4s)
  -  6 [desk] UC-31 (skipped: phone only)
  1 failed, 1 skipped, 4 passed

$ git diff --name-only main...HEAD   # only Part 5 paths (the report is added by this commit)
apps/web/src/modules/decisions/api.ts
apps/web/src/modules/decisions/decisions.css
apps/web/src/modules/decisions/decisions.ts
apps/web/src/modules/decisions/index.ts
apps/web/src/modules/decisions/screens.ts
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx
apps/web/src/routes/index.tsx
```

The start manifest (`dist/server/assets/_tanstack-start-manifest_v-*.js`): `__root__` preloads `index-DimhTn_r.js` and `jsx-runtime-Wy9s6hX0.js`, and its script is `index-DimhTn_r.js`. `/` preloads `routes-Cosr3y1m.js`.
