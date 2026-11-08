# NEMI: w0-split build, completion report

Attempt a2 (a1's report, for NEMI-01, is in this file's history at a1's merge).

verdict: DONE

## Summary
Both a2 tasks are done, in `apps/web/vite.config.ts` and `apps/web/package.json`. The server-function stub keeps seroval and the server-function RPC out of the client and leaves the server build unchanged. Its `createServerFn` guard and its alarm each failed a build on a scratch edit. The React Compiler is on, over `apps/web/src` only. `/`'s first load is 166.50 kB gzip, down from 173.94 on main: −11.05 for the stub and +3.61 for the compiler. Build, typecheck, lint and all 190 web tests pass. End to end, UC-29 and UC-30 pass and UC-31 fails, as expected, until Fantem's w0-kit a4. The alarm checks the client's output, not "each of the three stubs used": in this Start version, one stub can never be used (Deviation 1).

## Pre-flight
- Part 2 files, all read:
  1. `.claude/agents/nemi.md`: read (Learned: none yet)
  2. `codebase-analysis.md`: read
  3. `docs/ui-contracts/decisions-approval-page.md`: read; sections 0, 5 ("The route split", "Styles and loading"), 6 and 8 in full
  4. `docs/design/CR-W2 Pending decisions.md`: present; headings skimmed, nothing in it touches the build config
  5. `decisions.md`: read; "Revision 9", "The size study" and "Revision 10" in full
  6. FM v0.6: read; lines 20 to 38 ("In short", line 30's oRPC rule), 113 to 114, 280 to 302 (line 285 code splitting, line 299 React Compiler)
  7. DL v1.1: present; no tokens or components in this task
  8. `Step 0 and Step 1 plan.md`: present; headings skimmed, nothing in it touches this task
  9. to 12.: as above
  - Also read in full: Leah's findings `size-study-leah-04-seroval-and-server-function-rpc.md` and `size-study-leah-05-react-compiler.md` (on main).
- `locks.md`: the sprint's copy, `docs/agent-dispatch/frontend/sprint-01/locks.md`. I touched none of its paths.
- Branch: `frontend/sprint-01/agent-nemi-w0-split-build-a2`. Start commit: `a00fa14` (main).
- Part 7 commands: all available, after `pnpm install --frozen-lockfile` in the fresh worktree.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| NEMI-01 | DONE in a1 (merged; not in a2's scope) | a1: 1a71be5, 2b4284e |
| NEMI-02 | DONE | e182c37, 704a968 |
| NEMI-03 | DONE | 320e027 |

## Contract to files
- **Section 6, the server-function stub** → `apps/web/vite.config.ts`: `serverFnStubs`, `serverFnStub()` and `serverFnGuard()`. Both plugins sit before `tanstackStart()`.
  - Client environment only: `applyToEnvironment: (environment) => environment.name === "client"`. It matches a relative import of `client-rpc/{serverFnFetcher,createClientRpc,frame-decoder}.js` made from inside `@tanstack/start-client-core` (1.170.39, under react-start 1.169.4). The import resolves to a virtual module whose exports throw `"<file> is stubbed in apps/web/vite.config.ts: the web has no server functions (UI contract section 6)"` when called. One exception: `trackPostProcessPromise` stays a no-op, which is what the real one does outside a server function's response.
  - **The guard:** `buildStart` scans every file under `apps/web/src` and fails on `createServerFn`. It runs in every environment, and in dev it stops the server from starting.
  - **The alarm:** in the client build's `generateBundle`, the build fails if no stub was used, or if any module under `start-client-core/dist/esm/client-rpc/`, `seroval` or `seroval-plugins` has rendered code in a client chunk (Deviation 1).
- **Section 6, the React Compiler** → `apps/web/vite.config.ts`: `babel({ presets: [reactCompilerPreset()], include: [webSourceFiles] })`, after `react()`. `webSourceFiles` is a RegExp that matches only `.js`/`.jsx`/`.ts`/`.tsx` under `apps/web/src/`, and the plugin's default `node_modules` exclude stays. The preset itself runs only in the client environment (`applyToEnvironmentHook: consumer === "client"`). `apps/web/vitest.config.ts` isn't touched.
- **Section 6, the dependencies** → `apps/web/package.json` devDependencies, exact:
  - `@rolldown/plugin-babel` **0.3.0**
  - `@babel/core` **7.29.13**
  - `babel-plugin-react-compiler` **1.0.0**
  - `pnpm-lock.yaml` changed with `pnpm install` and **isn't committed** (it isn't mine). INT or the merge needs to regenerate it.
- **NEMI-02 Required:**
  - **No seroval or serverFnFetcher in the client:** `grep -l 'seroval\|fromCrossJSON'` and `grep -l 'serverFnFetcher\|createFrameDecoder'` over `dist/client/assets/*.js` list nothing. The alarm's chunk check lists no seroval, seroval-plugins or client-rpc module.
  - **The server build is unchanged:** `diff -r` of `dist/server` built with main's `vite.config.ts` and with mine: every chunk is byte-identical (`router-C_gWCO5A.js`, `routes-C8B0LD8Z.js`, `ReasonDialog-DxtD8UaD.js`, …). Only the Start manifest and the one line of `server.js` that imports it differ. The manifest names the client's entry and route chunks, whose hashes changed.
  - **SSR and hydration, production build:** I served `dist/` with a scratch Node server: the built `server.js` fetch handler, `/assets` from `dist/client`, and `/api` from `createMock` seeded with `fixtures.step1`. The script is outside the repo. Chromium at 390×844 got: 4 `DecisionTag`s in the server's HTML, `data-hydrated="true"` after hydration, approve with a reason → `Approved by you at …` → 3 rows, exactly one route 54 request, no console errors or warnings, no page errors. Same result on the stub build and the stub-plus-compiler build.
  - **SSR and hydration, dev server:** UC-29 and UC-30 pass on phone and desk. Both wait for the hydration marker and then click (below). `start-client-core` and `seroval` aren't in Vite's pre-bundled deps (`node_modules/.vite/deps`), so the stub applies in dev as well.
  - **The guard fires**, on a scratch file `apps/web/src/scratch-serverfn.ts` (`createServerFn().handler(…)`, deleted, never committed): `pnpm build` exit 1, `RolldownError: createServerFn appears in scratch-serverfn.ts under apps/web/src, but vite.config.ts stubs Start's server-function client (UI contract section 6). Taking the stub off is a contract decision.`
  - **The alarm fires**, on a scratch edit renaming all three stub keys to `*.renamed.js`, as if Start had renamed the files (reverted with `git checkout`, never committed): `pnpm build` exit 1, `RolldownError: The server-function stub no longer holds in the client build (stubs used: none; server-function code in the client: seroval@1.7.9/…/seroval/dist/index.js, seroval-plugins@1.7.8_seroval@1.7.9/…/web.js, …/client-rpc/frame-decoder.js, …/client-rpc/serverFnFetcher.js, …/client-rpc/createClientRpc.js). @tanstack/start-client-core has changed: update the stub (UI contract section 6).`
    - Renaming **only** `createClientRpc.js` didn't fire it, and that's correct. The real `createClientRpc.js` then loads and imports `./serverFnFetcher.js`, which the second stub catches. The build stayed at 143.73 kB, with no seroval.
  - **Tests:** 190/190.
- **NEMI-03 Required:**
  - **Compiled components:** `grep -l 'compiler-runtime\|useMemoCache\|react.memo_cache_sentinel'` lists `routes-Co1-rRcu.js`, `ReasonDialog-DmxEiHIl.js`, `compiler-runtime-CUb8v2iE.js` and `index-C-ihfoib.js`.
  - **Compiler diagnostics,** from a scratch run with the preset's `logger` (not committed): 26 functions compiled and 4 skipped. A skipped function runs as plain, uncompiled React, and the build doesn't fail. Each is under Issues for other agents:
    1. `kit/DecisionTag.tsx`, `DecisionTag` (line 93): UseMemo, "Expected the first argument to be an inline function expression", at 121:28 (`useMemo(canHover, [])`)
    2. `kit/interaction.ts`, `usePress` (line 26): the same, at 29:28 (`useMemo(canHover, [])`)
    3. `kit/Dialog.tsx`, `useDialogFocus` (line 14): Refs, "Cannot access refs during render", at 20:2 (`close.current = onClose;`)
    4. `modules/decisions/screens/DecisionsScreen.tsx`, `ProposalDecision` (line 505): Todo, "(BuildHIR::lowerStatement) Handle empty test in ForStatement", at 591:4 (`for (let resend = 0; ; resend += 1)`)
    - Compiled: `Button`, `Tag`, `Icon`, `HashChip`, `ErrorPanel`, `WidgetState`, `ReasonDialog`, `Dialog`, `PunchHole`, both `RequestIdChip`s, `DecisionsScreen`, `DecisionsList`, `RowView`, `PageHeader`, `EmptyCard`, `FirstLoadError`, `SignedOutPanel`, `UnreachableBand`, `useHydrated`, `useIsPhone`, `useOnline`, `useApi`, `useContractMismatch` and `RootShell`.
  - **/ hydrates:** production and dev, as above, with the compiler on.
  - **Tests:** 190/190.
  - **End to end** (`pnpm --filter @avel/web exec playwright test`), four full runs plus one 5× repeat of UC-29 on the phone:
    - Final runs: UC-29 phone ✓, UC-30 phone ✓, UC-29 desk ✓, UC-30 desk ✓.
    - **UC-31 phone ✘:** `Expected: "grid" Received: "flex"` at `decisions.spec.ts:125`. That's D11's grid, which waits on Fantem's w0-kit a4, as the task doc says. UC-31 desk is skipped.
    - One flake: see Limitations.

**Sizes** (Vite's gzip, `/`'s first load as section 8 counts it). It's the entry plus every chunk the server's HTML loads or preloads; I checked the list against the HTML and Chromium's requests.

| Build | entry `index` | shared `jsx-runtime` / `compiler-runtime` | route `routes` | **first load** | change | lazy `ReasonDialog` |
| --- | --- | --- | --- | --- | --- | --- |
| main (a00fa14, Leon's a2 merged) | 154.68 | 3.39 | 15.87 | **173.94** | | 1.52 |
| + stub (NEMI-02) | 143.63 | 3.39 | 15.87 | **162.89** | −11.05 (Leah: −11.03) | 1.53 |
| + compiler (NEMI-03) | 143.85 | 3.41 | 19.24 | **166.50** | +3.61 (Leah: +2.44) | 2.59 |

- With zlib level 9 on the files themselves: 171.98 → 161.06 → 164.58.
- The compiler costs 1.17 kB more than Leah measured. She measured on Leon's a1 (17.04 → 19.16 on the route chunk). Leon's a2 has more components in the route chunk (the hydration marker, the lazy dialog's loader), and the compiler adds a memo-cache slot array to each.
- So at 166.50, `/` is over sprint-01's 160 kB. Leah's 147.8 kB projection also counts S1-6 (Axis's contract on `zod/mini` and Ghost's w0-data a2), which isn't on main.
- The client's CSS is unchanged: `app-CCOL2GSK.css` 6.94, `kit-DDPuOw4w.css` 3.75 and `decisions-BpPPU4Jm.css` 0.54, the same hashes as main.

## Deviations
1. **The alarm checks the output, not "each of the three stubs used".** In `@tanstack/start-client-core` 1.170.39, the client reaches these modules only through `client/index.js` → `hydrateStart.js` → `ServerFunctionSerializationAdapter.js` → `client-rpc/createClientRpc.js`.
   - `serverFnFetcher.js` is imported by `createClientRpc.js` and by the package root `index.js`, which isn't in the client graph. `frame-decoder.js` is imported only by `serverFnFetcher.js`.
   - So once `createClientRpc.js` is stubbed, the other two never load, and "fail if any stub wasn't used" would fail every build. I measured this: the first version did exactly that.
   - Instead, the client build fails if no stub was used, or if any real `client-rpc/*` module, `seroval` or `seroval-plugins` has rendered code in a client chunk. That catches the rename section 6 worries about (shown above), and also a Start version that reaches the RPC code by a new path.
   - The three stubs stay. The other two cover a Start version that imports them directly. The contract's wording ("fails if any of the three stubs wasn't used") needs Zero's eye. My suggested rewording: "fails if the stub no longer keeps start-client-core's client-rpc modules and seroval out of the client".
2. **Stub contents follow 1.170.39's exports, not Leah's scratch diff.** In this version, `frame-decoder.js` exports `createFrameDecoder`; the `FRAME_*` constants are in `constants.js`.
3. **`@babel/core` is 7.29.13, not the latest 8.1.0.** `babel-plugin-react-compiler` 1.0.0 is a Babel 7 plugin (it depends on `@babel/types` ^7.26). `@rolldown/plugin-babel` 0.3.0 accepts `^7.29.0 || ^8.0.0-rc.1`. No `@types/babel__core` was needed: typecheck passes.
4. **No scratch merge of Leon's a2.** The task doc says Leon's decisions isn't on main, but his a2 is merged (b834283, and `git merge-base --is-ancestor frontend/sprint-01/agent-leon-decisions-build-a2 main` is true). So I measured on main itself, and main's 173.94 kB equals Leon's figure.
5. **The compiler's shared chunk is renamed.** Leon's shared `jsx-runtime-*.js` chunk (revision 10's "shared `jsx-runtime` chunk") is now `compiler-runtime-*.js`: it carries `react/jsx-runtime` and `react/compiler-runtime` together, 3.41 kB. Anyone who greps for `jsx-runtime` by name needs to know.

## Limitations
- **One flaky UC-29 phone failure** (`expect(locator).toBeVisible() failed`, 7.4s), on the first end-to-end run after the compiler's dependencies went in. It passed in the three full runs after that and in 5/5 runs of `-g UC-29 --project=phone --repeat-each=5`.
  - My unconfirmed guess: Vite's dependency optimizer. The preset adds `react/compiler-runtime` to `optimizeDeps.include`, so the first dev-server start after the change re-optimizes, which can reload the page under the test.
  - I didn't reproduce it: clearing `node_modules/.vite` to retry a cold start was denied in this session. Leah's or Fenn's next run should watch for it.
- The compiler runs on the client build only (the preset's own `applyToEnvironmentHook`). The server renders uncompiled components. Output is the same, and hydration passes.
- The stub depends on Start's internals (level C, as Leah wrote). The alarm is what makes an upgrade visible.
- The guard is a text scan, so a comment that mentions `createServerFn` under `apps/web/src` also fails the build. That's deliberate: it errs safe.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - `pnpm-lock.yaml` must be regenerated at merge for the three dev dependencies (`@rolldown/plugin-babel` 0.3.0, `@babel/core` 7.29.13, `babel-plugin-react-compiler` 1.0.0). It isn't committed here.
  - The budget: with the stub and the compiler on main, `/` is 166.50 kB. That's over 160 until S1-6's two halves land.
- **Zero (w0-split review) and the contract:** Deviation 1, the alarm's wording in section 6.
- **Zane (w0-split security review):** the three new dev dependencies are build-time only. Nothing from them ships except `react/compiler-runtime`, which is part of `react` 19.3.1. The stub's `resolveId` only answers relative imports from inside `start-client-core`, in the client environment.
- **Fantem (kit), compiler bailouts:**
  - `DecisionTag` and `usePress` aren't compiled, because `useMemo(canHover, [])` passes a function reference. An inline `useMemo(() => canHover(), [])` would let them compile.
  - `useDialogFocus` isn't compiled, because it writes `close.current = onClose` during render.
- **Leon (decisions), compiler bailout:** `ProposalDecision` isn't compiled, because `for (let resend = 0; ; resend += 1)` has an empty test, which the compiler doesn't lower yet.
- **Leah (size):** the compiler's real cost on Leon's a2 is +3.61, not +2.44, so her 147.8 kB projection is about 1.2 kB light.
- **Fenn / Leah (e2e):** the cold-start flake under Limitations.

## Files changed
```
apps/web/package.json
apps/web/vite.config.ts
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-split-build-completion.md
```

## Verification
`pnpm --filter "@avel/web..." build`: exit 0
```
apps/web build: vite v8.3.6 building client environment for production...
apps/web build: dist/client/assets/decisions-BpPPU4Jm.css              1.54 kB │ gzip:   0.54 kB
apps/web build: dist/client/assets/kit-DDPuOw4w.css                   17.31 kB │ gzip:   3.75 kB
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/ReasonDialog-DmxEiHIl.js            5.49 kB │ gzip:   2.59 kB
apps/web build: dist/client/assets/compiler-runtime-CUb8v2iE.js        9.07 kB │ gzip:   3.41 kB
apps/web build: dist/client/assets/routes-Co1-rRcu.js                 54.13 kB │ gzip:  19.24 kB
apps/web build: dist/client/assets/index-C-ihfoib.js                 461.76 kB │ gzip: 143.85 kB
apps/web build: ✓ built in 2.31s
apps/web build: vite v8.3.6 building ssr environment for production...
apps/web build: dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
apps/web build: dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
apps/web build: dist/server/assets/rolldown-runtime-D8jQpDG7.js              0.34 kB │ gzip:  0.24 kB
apps/web build: dist/server/assets/_tanstack-start-manifest_v-CcwhCt6d.js    0.64 kB │ gzip:  0.35 kB
apps/web build: dist/server/assets/ReasonDialog-DxtD8UaD.js                  5.85 kB │ gzip:  2.01 kB
apps/web build: dist/server/assets/router-C_gWCO5A.js                       33.59 kB │ gzip: 11.23 kB
apps/web build: dist/server/assets/routes-C8B0LD8Z.js                       48.57 kB │ gzip: 13.80 kB
apps/web build: ✓ built in 347ms
```
(Fonts listed too, unchanged: `ibm-plex-mono-400`, `ibm-plex-mono-500`, `inter-variable`. `packages/contract` built first, exit 0.)

`pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: exit 0
```
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
```

`pnpm lint`: exit 0
```
> biome check .
Checked 205 files in 335ms. No fixes applied.
```

`pnpm --filter @avel/web test`: exit 0
```
 Test Files  14 passed (14)
      Tests  190 passed (190)
```

`git diff --name-only main...HEAD` (before this report's commit; the report adds itself):
```
apps/web/package.json
apps/web/vite.config.ts
```

Task verifies:
- NEMI-02: `! grep -l 'seroval\|fromCrossJSON' apps/web/dist/client/assets/*.js` → nothing listed, exit 0.
- NEMI-03: `pnpm install` → done, the lockfile changed and isn't committed. `grep -l 'compiler-runtime\|useMemoCache\|react.memo_cache_sentinel' apps/web/dist/client/assets/*.js` → `ReasonDialog-DmxEiHIl.js`, `routes-Co1-rRcu.js`, `compiler-runtime-CUb8v2iE.js`, `index-C-ihfoib.js`.
- `pnpm --filter @avel/web exec playwright test 2>&1 | tail -8`:
```
  1 failed
    [phone] › e2e/decisions.spec.ts:93:1 › UC-31: on a phone the actions are D11's two-column grid, 44px tall, and the reason input is 16px 
  1 skipped
  4 passed (20.0s)
```
