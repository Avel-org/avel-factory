# LEAH: size-study review-a11y-perf, completion report

verdict: PASS

(PASS means the study is complete. It does not mean the page is in budget: the baseline is 174.35 kB.)

## Summary
Every option on INT's list is measured from the baseline (080ca45 plus the `sideEffects` line, 174.35 kB gzip), most of them as a real build that serves, hydrates and approves with a reason on the mock (level A). **A set that fits 150 kB exists and costs little:** S1-6 (17.25, given) + stubbing Start's server-function RPC out of the client (11.03, which takes seroval out with it) + the lazy `ReasonDialog` (0.73) projects to **145.3 kB**, or 147.8 with the React Compiler on. Preact is the biggest number (-58 kB) but the page doesn't hydrate under it. I did not measure S1-6 myself; I took Axis's 17.25 as given.

## Pre-flight
- Part 2 files:
  - **Read in full:** `.claude/agents/leah.md`, `codebase-analysis.md`, my a1 report, finding `decisions-leah-01`, backend `decisions.md` S1-6 to S1-8, frontend `decisions.md` ("160 kB", "Revision 9", "The size study"), the UI contract sections 3, 5 (route, loader, styles and loading) and 8, the Frontend Map's Performance budgets (lines 275 to 305) and the v0.4 note (line 20), and this task doc.
  - **Skimmed or not opened, because a size study doesn't touch them:** `CR-W2 Pending decisions.md`, `AVEL Enclosure Grid · Design library v1.1.html`, `Step 0 and Step 1 plan.md`, and the rest of the Frontend Map (Data layer and Rendering and SSR only as the UI contract quotes them). `DATABASE.md` and `API and data reference.md` (leah.md's list) were not opened: nothing here uses a table or a DTO.
  - Nothing missing.
- Branch `frontend/sprint-01/agent-leah-size-study-review-a11y-perf-a1`, start commit 9b25f09. `AVEL_BASE` unset. Main has since moved to b97076e (w0-split, w0-kit a3 and Fenn's e2e a3 are merged); the study measures the baseline the task doc names, not main.
- Part 7 commands: all available (output below).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| LEAH-01 | DONE (baseline rebuilt and attributed; options 1 to 4; findings 01 to 04) | this report's commit |
| LEAH-02 | DONE (options 5 to 7; findings 05 to 08; summary table, recommended set, budget) | this report's commit |

## Findings
All P3, status open, one file per option, in `docs/agent-dispatch/frontend/sprint-01/findings/`:
- `size-study-leah-01-tanstack-query-to-router-loaders.md`: P3, TanStack Query to loaders, -12.45 kB, level A
- `size-study-leah-02-preact-compat.md`: P3, Preact/compat, -58.4 kB in size, **does not hydrate**
- `size-study-leah-03-thin-orpc-link.md`: P3, a thin oRPC link, -7.7 kB alone (-8.6 on top of 04), level A
- `size-study-leah-04-seroval-and-server-function-rpc.md`: P3, seroval and Start's server-function RPC stubbed out, -11.03 kB, level A (stub)
- `size-study-leah-05-react-compiler.md`: P3, React Compiler, **+2.44 kB**, level A; the baseline doesn't build with it though FM line 299 says it should
- `size-study-leah-06-build-options.md`: P3, build options, 0 kB
- `size-study-leah-07-lazy-reason-dialog.md`: P3, lazy `ReasonDialog`, -0.73 kB (my a1 estimate was 1.7), level A
- `size-study-leah-08-ranked-attribution-and-estimates.md`: P3, the baseline's attribution ranked, and four estimates I did not build (level C)

## How I measured
- **Baseline:** 080ca45 (detached scratch worktree) with `"sideEffects": ["**/*.css"]` in `apps/web/package.json`. `pnpm --filter "@avel/web..." build`:
  ```
  routes-BCY8Alcf.js    50.25 kB │ gzip:  17.04 kB
  index-DEz1F4dU.js    502.30 kB │ gzip: 157.31 kB        first load 174.35 kB
  ```
  The route is split as w0-split makes it (without the line it was one 552 kB chunk, 173.53 kB).
- **First load, as section 8 counts it:** a harness serves the production build (`dist/server/server.js` plus `dist/client` statics, the contract mock on `/api`), fetches `/`, and takes every `<script src>` and `modulepreload` the HTML names, plus their static imports (here: the entry and the route chunk; both were also what Chromium downloaded). Sizes are **vite's own per-chunk gzip, summed** (to compare with 173.53 and 17.25), and also zlib gzip and brotli 11 from the same files. Vite's figure is about 1% above zlib's (174.35 vs 172.68 for the baseline). Deltas below are vite gzip; brotli deltas are in each finding and run about 15% smaller.
- **Level A** means, on that production build in Chromium at 390x844: the server's HTML holds the 4 rows; the page hydrates with no console error or warning; approve with a reason removes the row (4 -> 3). It does not mean the stale, rate-limit, signed-out or first-load-error flows were run. Where I ran the repo's Vitest on a scratch build I say so.
- **Attribution:** `vite build --sourcemap`, each minified byte mapped to the package of its source, each group gzipped alone at level 9 (so the groups sum above the first load; use them to rank).
- Harness and scratch scripts (`serve.mjs`, `measure.mjs`, `flow.mjs`, `attr.mjs`, `bench.mjs`) are in my session's scratchpad, not in the repo. Each option's numbers are from a separate scratch worktree at 080ca45 plus the diff the finding describes.

## Summary table
Savings are gzip, first load of `/`, from the 174.35 kB baseline. "Level" is A (page works), B (builds, renders, hydrates), C (estimate or broken).

| Option | Saving (gzip / brotli) | Level | Cost | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| **S1-6** zod/mini (given by Axis, not measured here) | 17.25 / n/a | given | Axis's contract module; Ghost's w0-data a2 | none new | **do now** |
| **4** Start's server-function RPC (and seroval) stubbed from the client | **11.03 / 8.90** | A (stub) | Nemi: a ~20-line plugin in `vite.config.ts`, with a build guard on `createServerFn`; no contract line, no locked test, no dependency | Start upgrades can rename the three matched paths (then the size silently returns); `createServerFn` later needs the stub off | **do now** |
| **7a** lazy `ReasonDialog` | 0.73 / 0.64 | A | Leon, already planned | tap-to-dialog delay; keep the import off the kit index | **do now** |
| **5** React Compiler | **-2.44 / -1.96** (a cost) | A | Nemi: 3 dev dependencies, `vite.config.ts` | bailouts on ref use; build time | **do at W2** (or count 2.4 kB now) |
| **3** thin oRPC link | 7.7 alone, 8.6 on top of 4 / 6.5 | A | Ghost: a new `thin-link.ts`, a base error class; contract section 3, 5 lines; no locked test if `ORPCError` stays imported | thrown away when W4 needs SSE/uploads; drifts from oRPC's encoding | **don't** now |
| **1** TanStack Query to loaders | 12.45 / 10.66 | A (happy path) | Ghost, Leon, Nemi (12 files); UI contract 3 and 5, FM Data layer; **37 locked tests fail** (4 files: lock override on w0-data and decisions) | cache rebuilt by hand at W4; breaks "no server data in state" | **don't** |
| **2** Preact/compat | 58.4 / 48.5 (the size is real) | **C** (does not hydrate) | Nemi: config, 2 dependencies, a custom client entry | Start/Router rely on React 19 suspense-in-transition and hydrate the whole `document`; breaks silently on upgrades | **don't** |
| **6** build options | 0 | A | none | none | **don't** (default is best) |
| **7b** router pieces the page never runs | 2 to 4 (est.) | C | patching or stubbing per file | breaks as pages add links | **don't** |
| **7c** error-path components lazy | 2 to 3 (est.) | C | Leon | error panel arrives a request late, when the network is failing | **don't** now, look again at W2 |
| **7d** icons inlined or lazy | 1 to 2 (est.) | C | Fantem | against the kit's per-icon rule | **don't** |

## The recommended set
Numbers are first load of `/`, vite gzip.

| Set | Contents | Projected | How real |
| --- | --- | --- | --- |
| baseline | | 174.35 | built |
| after S1-6 alone | -17.25 | **157.10** | given |
| **Recommended (A)** | S1-6 + 4 + 7a | **145.34** | options 4 + 7a built together: 162.59 (entry 146.36 + route 16.23; lazy chunk 1.50 not counted), less 17.25 |
| A with the React Compiler on | + 2.44 | **147.78** | the compiler built alone; assumed additive |
| A + thin link (3) | -8.63 | about 136.7 | 3 measured on top of 4 (163.32 -> 154.69); S1-6 and 7a added |
| A + 1 + 3 (everything buildable) | | about 126.3 | 1 + 3 + 4 built together: 144.32, less 17.25, less 0.73 |

- **Overlaps.** 1 and 3 share `@orpc/tanstack-query` (1.3 kB): built together with 4 they saved 30.03 against a sum of 31.17. 4 and 3 interact the other way: 3 saves 7.7 alone and 8.6 on top of 4 (I don't know why; I did not look). 5 is a cost against all of them. 2 would replace the base React bytes under everything else (and 5's runtime).
- **S1-6 is assumed additive.** I did not measure it on any of these builds. Axis's spike measured it on the unsplit entry (173.53 -> 156.28); it touches zod and the contract only, none of the files my options change, apart from option 3's V2 (finding 03 says where).

## The budget
- **What's reachable for sprint-01 at a cost I'd accept: about 145 kB** (A), 148 with the Compiler. The cost is one build plugin in Nemi's `vite.config.ts` with a guard, plus things already planned (S1-6, Leon's lazy dialog). No locked test changes.
- **Is 150 kB it? Yes, with thin margin:** 4.7 kB without the Compiler, 2.2 with it. Everything else in the study either costs a rewrite (1), is a second client path (3), or doesn't work (2).
- **My proposal for INT:**
  1. Keep **160 kB** as the gate until S1-6's two halves *and* option 4 are merged. Section 8 already switches to 150 when S1-6's two halves land; I'd make it **when both S1-6 and option 4 are merged**, because S1-6 alone leaves the page at 157.1.
  2. Then hold **150 kB**, re-measured at my decisions a2 re-review, which will include Leon a2, kit a3 and the real S1-6 (Leah's budget figure is only final after Ghost's w0-data a2).
  3. If INT doesn't want the plugin: S1-6 + 7a + the thin link is about 148.7 (174.35 - 17.25 - 7.7 - 0.73), too close to call 150. Then the honest gate is **155 kB**, and 160 stands if neither is taken (156.4 with S1-6 and 7a).
  4. Decide the Compiler: either amend FM line 299, or count its 2.4 kB. The baseline doesn't have it on.
  5. Ask TanStack upstream for the conditional server-function adapter, so the plugin can go.
- At W2 the route chunk is split per route, so the first load of `/` stops growing with each screen. What grows it is the shared code (router, data, kit); re-check then.

## Contract to files
- Task doc LEAH-01 and LEAH-02: findings 01 to 08 above; this report. Section 8's definition of the first load: "How I measured". The 160/150 kB rule: "The budget".
- Files read for the study (none changed): `apps/web/src/**`, `apps/web/vite.config.ts`, `apps/web/package.json`, `apps/web/e2e/fixtures.ts`, `packages/contract/dist/routes/decisions.js`.

## Deviations
- **Decisions are in this report, not in `decisions.md`.** The Always rules say to record decisions in `decisions.md`; Part 5 lets me change only my report and the findings, so my budget proposal is above for Zero and INT to carry over.
- **First-load figures are the production build served with the mock, not a CDN or a real server.** There's no API server in sprint-01. Compression is measured with zlib and brotli on the files, not on the wire.
- **The hydration check has no marker on this baseline** (it is Leon a2's), so `flow.mjs` waits for network idle plus 1.2 s before the first click.
- I did not run Playwright's own specs; the harness is mine, written to the same flow. I did not run Lighthouse or measure LCP/INP for any option (size only).
- My first attempt to kill a background server used `pkill -f serve.mjs`, which matched and killed my own shell; nothing was lost.

## Limitations
- **S1-6's 17.25 kB is Axis's, not re-measured**, and assumed to add to the other options.
- **Option 2 is stopped at hydration.** I tried two fixes (a root Suspense, a custom client entry); more may work. The size is real, the page isn't.
- Option 1 and 3 builds were checked on the happy path (and, for 3, Vitest 190/190 with `ORPCError` imported from `@orpc/client`); I did not run the stale, 429, 401, idempotency or offline flows in the browser.
- Option 4 is a stub of Start's internals, matched by file path in `@tanstack/start-client-core` 1.170.39 (react-start 1.169.4, start-plugin-core 1.171.55). Deferred loader data and streaming were not tested with it.
- Options 7b, 7c, 7d are attribution-based estimates, not builds.
- Option 6's `treeshake` rows were not run through the browser flow.
- Brotli figures are level 11 on the files; production would likely use a lower level.
- Vite's gzip figure is about 1% above zlib's; both are in the findings where they differ.
- The study runs on 080ca45, not on main (b97076e), which has Leon's code unmerged; main's `/` doesn't render the decisions screen yet (see the Vitest note below).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** the budget proposal above; whether to take option 4's plugin; the Compiler decision; whether the 150 kB switch waits for option 4. 
- **Nemi:** option 4's plugin and guard (finding 04); the Compiler (finding 05). `vite.config.ts` and `package.json` are his.
- **Zero:** FM line 299 says the React Compiler is on; `apps/web/vite.config.ts` at 080ca45 doesn't build with it, and UI contract section 6 doesn't mention it (finding 05). Section 8's trigger for 150 kB (finding above).
- **Leon (decisions a2):** the lazy dialog saves 0.73 kB, not 1.7; import it from `kit/ReasonDialog`, not the kit index (finding 07). Report sizes with the production-serve first-load method, or ask me.
- **Ghost (w0-data a2):** nothing from this study changes his task. If INT takes option 3 later, `data/client.ts` and `errors.ts` are the files.
- **Axis:** the 17.25 kB was measured on the unsplit single chunk (173.53). I took it as given on the split page (174.35 as the sum of two chunks); the real number needs a re-measure once both halves are merged.
- **Fenn:** option 1 would need a lock override for 37 tests; nothing else here touches a locked file.

## Files changed
```
$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-01/agent-leah-size-study-review-a11y-perf-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-01-tanstack-query-to-router-loaders.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-02-preact-compat.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-03-thin-orpc-link.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-04-seroval-and-server-function-rpc.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-05-react-compiler.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-06-build-options.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-07-lazy-reason-dialog.md
docs/agent-dispatch/frontend/sprint-01/findings/size-study-leah-08-ranked-attribution-and-estimates.md
```
(All paths are in Part 5. The listing is what the commit will hold; before the commit the same command printed nothing.)

## Verification
Run on my own branch (docs only; started at 9b25f09, which is main without the decisions module, so this is main's state and not the baseline):
```
$ pnpm --filter "@avel/web..." build
packages/contract build: Done
apps/web build: dist/client/assets/index-SlPnXw7v.js   496.83 kB │ gzip: 155.40 kB
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
Scope: 3 of 6 workspace projects
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
> biome check .
Checked 198 files in 121ms. No fixes applied.

$ pnpm --filter @avel/web test
Test Files  4 failed | 10 passed (14)
Tests  37 failed | 153 passed (190)
 (the 4 files are test/modules/decisions/*: "apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen: expected undefined to be defined". 
  This branch has no apps/web/src/modules: Leon's code isn't on main yet, and the locked screen tests ran ahead of it. Not caused by this study; I changed no file under apps/web.)

$ git diff --name-only main...HEAD
(see Files changed)
```
The same 37 tests failed in my option 1 scratch build for a different reason (finding 01), which is a coincidence of count: 37 screen tests either way.

The scratch worktrees (base, c1 to c7, cmb) were outside the repo and are removed (`git worktree list` shows none left under the scratchpad).
