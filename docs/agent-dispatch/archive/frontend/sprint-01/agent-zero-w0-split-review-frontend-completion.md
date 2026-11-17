# ZERO: w0-split review-frontend, completion report

Attempt a2. Reviewed at 0d5626e: main b1932d9 with Nemi's w0-split build a2 (6311fab) merged, plus INT's lockfile commit. `AVEL_BASE` = b1932d9.

verdict: PASS

## Summary
Nemi's w0-split a2 meets UI contract section 6. The server-function stub applies only in the client environment and sits before `tanstackStart()`. The guard and the alarm each fail a build on a scratch edit, the server build's chunks are byte-identical to main's, and no seroval reaches the client. The React Compiler runs after `react()` over `apps/web/src` only, with the three dev dependencies pinned exact. a1's `sideEffects` field (ZERO-01) is on main and unchanged. There's one P3 finding, on the contract's wording rather than the code: as section 6 words the alarm, it can't be built in this Start version (w0-split-zero-01). The six failing web tests are on main as well: they're the D11, D15 and R7 tests merged to fail first, waiting for Fantem's w0-kit a4.

## Pre-flight
- Part 2 files:
  1. `.claude/agents/zero.md`: read (Learned: none yet).
  2. `codebase-analysis.md`: read.
  3. `docs/ui-contracts/decisions-approval-page.md`: read, revision 11. Read in full: sections 0, 5 ("Styles and loading", "The route split"), 6 and 8.
  4. `docs/design/CR-W2 Pending decisions.md`: present. I skimmed the headings: nothing in it touches the build config.
  5. `decisions.md`: read. Read in full: "Revision 9", "The size study", "Revision 10", "Revision 11" and "Queued for revision 12".
  6. FM v0.6: read lines 28 to 32 (line 30: every call through the oRPC client) and lines 280 to 302 (line 285: code splitting; line 289: fonts; line 299: React Compiler).
  7. DL v1.1: present. The diff touches no token, component or motion.
  8. `Step 0 and Step 1 plan.md`: present. I skimmed the headings: nothing in it touches this diff.
  9. The contract's sections 5 and 6: as in 3.
  10. This task doc: read in full.
  - The Read first list's `API and data reference.md` and `CR-16 Dispatch package contract.md`: present. Neither touches a build-config diff.
- Branch: `frontend/sprint-01/agent-zero-w0-split-review-frontend-a2`. Start commit: 0d5626e.
- Part 7 commands: all available after `pnpm install --frozen-lockfile`.
  - `pnpm --filter @avel/web build` on its own fails in a fresh worktree: `Rolldown failed to resolve import "@avel/contract/errors"`, because `packages/contract` isn't built yet. The `"@avel/web..."` build builds it first, and after that the task verifies' single-package build passes.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE | this report's commit |
| ZERO-02 | DONE (one P3 finding, on the contract) | this report's commit |

**ZERO-01** checks a1, which is merged (1a71be5, 2b4284e; `git merge-base --is-ancestor 2b4284e main` is true).
- `git diff 1a71be5^..2b4284e --stat` lists only `apps/web/package.json | 3 +++`. The change is the one `"sideEffects": ["**/*.css"]` field: CSS files only, with no dependency or script change.
- In a2's diff it's unchanged (`apps/web/package.json:6-8`).
- The build still emits the app CSS (`app-CCOL2GSK.css` 6.94 kB, `kit-DDPuOw4w.css` 3.75, `decisions-BpPPU4Jm.css` 0.54), and the route stays in its own chunk (`routes-CsGRMfOY.js` 19.24 kB gzip).
- The verify's "only `apps/web/package.json` changed" applies to a1's diff. a2's diff adds `vite.config.ts` by design (ZERO-02).

**ZERO-02**, against section 6:
- **Stub, client environment only:** `applyToEnvironment: (environment) => environment.name === "client"` with `enforce: "pre"` (`vite.config.ts:165-166`).
  - It answers only relative imports, made from inside `start-client-core`, of the three named `client-rpc` files.
  - `serverFnGuard()` and `serverFnStub()` are at lines 218-219, before `tanstackStart()` at 221.
- **The server build is untouched:** I built main's config (b1932d9) in a scratch worktree and ran `diff -rq` against this build's `dist/server`. Every chunk is identical. Only `_tanstack-start-manifest_v-*.js` and `server.js` differ: the manifest names the client's chunk hashes, and `server.js` imports the manifest.
- **No seroval in the client:** `! grep -l 'seroval\|fromCrossJSON' apps/web/dist/client/assets/*.js` lists nothing, exit 0.
  - `serverFnFetcher` does appear in `index-*.js`, but only in the stub's error message: "createClientRpc.js is stubbed in apps/web/vite.config.ts: the web has no server functions (UI contract section 6)".
- **The guard:** I ran it on a scratch worktree at 0d5626e and didn't commit anything. A file `apps/web/src/scratch-zero.ts` holding only the comment `// mentions createServerFn` fails the build: `RolldownError: createServerFn appears in scratch-zero.ts under apps/web/src, but vite.config.ts stubs Start's server-function client (UI contract section 6). Taking the stub off is a contract decision.`
- **The alarm:** with all three stub keys renamed to `*.renamed.js` (scratch, then reverted), the build fails: `RolldownError: The server-function stub no longer holds in the client build (stubs used: none; server-function code in the client: …/seroval@1.7.9/…/seroval/dist/index.js, …`.
  - It differs from section 6's wording, because that wording can't be built: finding w0-split-zero-01.
- **The React Compiler:**
  - `babel({ presets: [reactCompilerPreset()], include: [webSourceFiles] })` is at line 227, after `react()` at 223.
  - `webSourceFiles` (line 130) is anchored at `apps/web/src/`.
  - `@rolldown/plugin-babel` 0.3.0 keeps its default exclude when only `include` is given (`dist/index.mjs:80-81`: `exclude: options.exclude ?? DEFAULT_EXCLUDE`).
  - `apps/web/vitest.config.ts` is a standalone `vitest/config` with `plugins: [stubUnbuiltSubjects()]` and doesn't load `vite.config.ts`, so the tests don't run the compiler, as section 6 requires.
  - The preset itself applies only to client consumers (`@vitejs/plugin-react` `dist/index.js:48`). Section 6 doesn't ask for that, and it doesn't conflict with anything.
- **The three dev dependencies, pinned exact:** `@babel/core` 7.29.13, `@rolldown/plugin-babel` 0.3.0 and `babel-plugin-react-compiler` 1.0.0 (`package.json:32,34,42`). `pnpm install --frozen-lockfile` passes on 0d5626e's lockfile.
- **Nothing outside `apps/web/{package.json,vite.config.ts}`** from Nemi's code. The other two paths in the diff are explained under Deviations.

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-split-zero-01-alarm-wording-in-section-6.md`: P3. Section 6's alarm says "any of the three stubs wasn't used", which start-client-core 1.170.39 makes impossible. The fix is contract wording only.

## Contract to files
- Section 5, "The route split" / section 6, `sideEffects` → `apps/web/package.json:6-8` (ZERO-01).
- Section 6, "The server-function stub" → `apps/web/vite.config.ts:105-207`: `serverFnStubs`, `serverFnGuard()`, `serverFnStub()`, and the plugin order at 218-221.
- Section 6, "The guard" → `vite.config.ts` `serverFnGuard().buildStart`.
- Section 6, "The alarm" → `vite.config.ts:191-207` (w0-split-zero-01).
- Section 6, "The React Compiler is on" → `vite.config.ts:130-132,224-227`, and `package.json:32,34,42`.
- Section 6, the dependencies list (the build's three) → `package.json`, devDependencies.

## Deviations
- **The diff holds four paths, where ZERO-02's Expected says two:** `pnpm-lock.yaml` and Nemi's completion report are also in it.
  - The lockfile is INT's commit 0d5626e. It's needed for the three new dependencies, and its changes are only those three plus their transitive `artichokie` 0.4.5 and `@vitejs/plugin-react`'s optional peers.
  - The report is Nemi's, and in his territory.
  - Neither is code outside the two paths, so I don't count it against the task.
- ZERO-01's verify ran against a1's merged diff (1a71be5^..2b4284e), not against this a2 diff. Its "only package.json changed" can only hold for a1.
- I ran the guard and alarm checks, and main's server build, in a throwaway `git worktree` in my scratchpad. I've removed it, and none of it was committed.

## Limitations
- I didn't run the end-to-end tests or the dev server. Section 6's stub and compiler are build-config items, and the dispatch's verifies are build-only. Nemi reports UC-29 and UC-30 pass, with UC-31 phone red until Fantem's w0-kit a4.
- The stub and the compiler's `include` build their paths with `path.sep`. I've only checked them on Linux, where the factory runs. On Windows, the alarm would fail the build, which is the safe direction, and the compiler would silently not run. I couldn't test that, so it isn't a finding.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - Finding w0-split-zero-01 is a contract rewording for revision 12, alongside the queued w0-data-brennan-02. It needs no code change, and w0-split a2 can merge as built.
  - `/`'s first load at 0d5626e is 143.87 + 3.41 + 19.24 = **166.52 kB** gzip (entry, `compiler-runtime`, `routes`). That's still over sprint-01's 160 until S1-6's two halves land.
  - The compiler cost +3.61 kB against Leah's +2.44, so the 150 kB margin after S1-6 is about 1.0 kB (150 − 147.8 − 1.17), not 2.2.
- **Leah:** the first-load figure above, and the renamed shared chunk (`compiler-runtime-*.js` replaces `jsx-runtime-*.js`).
- **Fantem and Leon:** Nemi's report lists four compiler bailouts in your territories: `DecisionTag` and `usePress` (`useMemo(canHover, [])`), `useDialogFocus` (ref written during render) and `ProposalDecision` (`for` with an empty test). They're not findings here. Each one runs uncompiled and correct.
- **Fenn / Fantem:** the six failing web tests (UC-08 D11 ×4, UC-08 D15, UC-09 R7) fail identically on main b1932d9. They're the failing-first tests for w0-kit a4.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-split-review-frontend-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-split-zero-01-alarm-wording-in-section-6.md
```
`git diff --name-only main...HEAD` also lists the reviewed commits' paths, which are below this branch's start commit: `apps/web/package.json`, `apps/web/vite.config.ts`, `docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-split-build-completion.md`, `pnpm-lock.yaml`.

## Verification
`pnpm --filter "@avel/web..." build`: exit 0
```
dist/client/assets/decisions-BpPPU4Jm.css              1.54 kB │ gzip:   0.54 kB
dist/client/assets/kit-DDPuOw4w.css                   17.31 kB │ gzip:   3.75 kB
dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
dist/client/assets/ReasonDialog-CzAYi2H3.js            5.49 kB │ gzip:   2.60 kB
dist/client/assets/compiler-runtime-CUb8v2iE.js        9.07 kB │ gzip:   3.41 kB
dist/client/assets/routes-CsGRMfOY.js                 54.13 kB │ gzip:  19.24 kB
dist/client/assets/index-C_5BT1FF.js                 461.83 kB │ gzip: 143.87 kB
✓ built in 10.82s
dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
dist/server/assets/rolldown-runtime-D8jQpDG7.js              0.34 kB │ gzip:  0.24 kB
dist/server/assets/_tanstack-start-manifest_v-LHaRwOuL.js    0.66 kB │ gzip:  0.36 kB
dist/server/assets/ReasonDialog-BsOg8Fj6.js                  5.85 kB │ gzip:  2.01 kB
dist/server/assets/router-BZYHJa7P.js                       34.52 kB │ gzip: 11.60 kB
dist/server/assets/routes-C213wK2f.js                       48.57 kB │ gzip: 13.80 kB
✓ built in 1.22s
```

`pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: exit 0
```
packages/contract-mock typecheck: Done
apps/web typecheck: Done
```

`pnpm lint`: exit 0
```
> biome check .
Checked 213 files in 688ms. No fixes applied.
```

`pnpm --filter @avel/web test`: exit 1. These are the same six failures as on main b1932d9, which I checked in a scratch worktree with the same output.
```
     × UC-08 phone (D11): Reject then Approve in one av-dt-pair container, with no inline grid style
     × UC-08 desk (D11): Approve then Reject in one av-dt-pair container, with no inline grid style
     × UC-08 (D11) kit.css draws .av-dt-pair as the grid for the phone layout, outside any media block
     × UC-08 (D11) kit.css draws the desk layout's .av-dt-pair as the grid only inside @media (max-width: 899px)
     × UC-08 (D15) neither evidence nor consequence: no .av-dt-facts element is drawn
     × UC-09 (R7) loadReasonDialog resolves to a module whose ReasonDialog is the kit index's ReasonDialog
 Test Files  2 failed | 12 passed (14)
      Tests  6 failed | 190 passed (196)
```

`git diff --name-only main...HEAD` (before this commit):
```
apps/web/package.json
apps/web/vite.config.ts
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-split-build-completion.md
pnpm-lock.yaml
```

Task verifies:
- ZERO-01: `pnpm --filter @avel/web build 2>&1 | grep -E 'client/assets/.*(js|css)'` lists the seven client assets above. `git diff 1a71be5^..2b4284e --stat` gives `apps/web/package.json | 3 +++`.
- ZERO-02: the build passes, and `! grep -l 'seroval\|fromCrossJSON' apps/web/dist/client/assets/*.js` lists nothing (exit 0). `git diff "$(git merge-base main HEAD)"..HEAD --stat` lists the four paths above, explained under Deviations.
