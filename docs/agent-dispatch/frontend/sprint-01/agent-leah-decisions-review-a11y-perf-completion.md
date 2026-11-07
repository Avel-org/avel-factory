# LEAH: decisions review-a11y-perf, completion report

verdict: FAIL

## Summary
Both tasks are done and report findings. `/` first-load JS is 173.5 kB gzip, 13.5 kB over the 160 kB budget (one 552 kB chunk; zod/mini alone should clear it). The page's stylesheets aren't linked on this base (Leon a2), so phone tap targets (20px) and the reason input (14px) fail UC-31 and Mono 500 goes unused. CLS on `/` at 390x844 with late fonts is 0.0017, well under 0.02. 5 of 6 e2e tests fail on the review base; one cause I inferred but didn't prove.

## Pre-flight
- Part 2: all read (leah.md, codebase-analysis.md not re-read in full, the UI contract in full, CR-W2/Frontend Map/design library/plan read for the sections named; decisions.md read for the budget and Fonts entries). Nothing missing. `DATABASE.md` and `API and data reference.md` are not relevant to this review and were not opened.
- Branch `frontend/sprint-01/agent-leah-decisions-review-a11y-perf-a1`, start commit 080ca45 (main ceb6d47 + Leon a1 c3effb3). `AVEL_BASE` unset; I diffed against ceb6d47.
- Part 7 commands: all available. I ran `pnpm install --frozen-lockfile --prefer-offline` first (no tracked change).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| LEAH-01 | DONE (findings 01, 02, 03) | this report's commit |
| LEAH-02 | DONE (finding 04; CLS in budget) | this report's commit |

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-01-first-load-over-budget.md`: P1, first load 173.5 kB gzip > 160 kB
- `.../decisions-leah-02-page-unstyled-targets-and-input-below-minimum.md`: P1, 20px buttons, 14px input, stylesheets not linked
- `.../decisions-leah-03-e2e-click-before-hydration.md`: P2, 5 of 6 e2e fail
- `.../decisions-leah-04-mono-500-preload-unused-on-first-paint.md`: P2, Mono 500 preloaded but unused

## LEAH-01 result: bundle
`index-CzkiNsNe.js` 552.30 kB raw, **173.53 kB gzip** (the only initial JS besides a 0.07 kB `routes` chunk). Breakdown (sourcemap, my measurement; groups gzipped separately so they sum above the total):

| Group | raw kB | gzip kB |
| --- | --- | --- |
| React (dom, react, scheduler) | 274 | 74 |
| TanStack router/query/start/history/store | 159 | 47 |
| seroval | 33 | 9 |
| zod classic | 119 | 28 |
| oRPC | 37 | 12.5 |
| kit | about 21 | about 8 |
| decisions module | about 15 | about 5 |
| lucide-react | 9 | 3.4 |
| `@avel/contract` dist | 4.5 | 1.9 |
| data/lib/routes | about 6 | about 2.6 |

INT's by-package figures (React 66, TanStack 50, zod 26, oRPC 10, kit 6, decisions 5, lucide 3, data 3) are the same shape; mine are slightly higher because each group is gzipped alone. Reductions, each with estimated saving and owner (estimates, none built):
- zod/mini (S1-6): 15 to 20 kB. Axis for `@avel/contract`, Ghost for the web's two schemas. Alone it clears 160.
- oRPC `minifyContractRouter` (client ships no schemas): about 2 kB alone, up to about 28 kB if the web's own two zod schemas also leave zod. Axis / Ghost.
- Lazy `ReasonDialog` (Leon a2): about 1.7 kB. Leon.
- Route splitting: nothing to gain in sprint-01 (one route). Revisit at W2.
- React, TanStack, seroval: fixed.
No reduction I can measure from the lazy dialog or the CSS move changes the verdict by itself; zod is the one that does.

## LEAH-02 result: fonts
- Preloads: two, Inter Variable and IBM Plex Mono 500 (`__root.tsx:45-56`).
- Used at first paint: Inter yes. Mono 500 no, on this base (finding 04).
- **CLS on `/` at 390x844: 0.0017** (one shift, at 1533 ms, when the delayed fonts landed). Method: Playwright Chromium on the dev server (`AVEL_API=mock`), a `PerformanceObserver` for `layout-shift` entries without recent input, every `.woff2` held back 1.5 s so the fonts arrive after first paint, 3.5 s observed. No delay: CLS 0. At 1280x800 with the delay: 0.0012. Under 0.02, so no finding for the font swap.
- Caveats: dev server, not a production serve (sprint-01 has no API server to serve one against); kit.css not linked and Mono not used yet, so **re-measure after Leon a2**.

## Accessibility summary (phone 390x844 and desk)
Fails: finding 02. Passes: dialog role, `aria-modal`, `aria-labelledby`, focus into the textarea, Escape closes and returns focus, labelled input, named buttons, heading order h1/h2/h3, `lang`, viewport meta, no horizontal overflow. Not checked: colour contrast, screen reader output, the night theme, keyboard order beyond the dialog.

## Contract to files
- Section 8 Leah / budget: finding 01. UC-31: finding 02 and 03. Fonts (FM line 289, section 6): finding 04 and the CLS figure above.
- Files read: `apps/web/src/modules/decisions/**`, `routes/index.tsx`, `routes/__root.tsx`, `kit/index.ts`, `data/client.ts`, `router.tsx`, `e2e/*`, `vite.config.ts`.

## Deviations
- I added no files outside Part 5. I built with `vite build --sourcemap` once to attribute bytes; output is git-ignored (`dist`).
- The tasks' verify command `pnpm --filter @avel/web exec playwright test` fails (finding 03); I report it instead of changing tests.
- A bad first probe of mine used port 4190, which the fetch spec blocks (undici "bad port"); that false failure is mine, not the app's, and I discarded it. A `curl` check I tried was denied, so I didn't check the SSR HTML by hand; the e2e spec's own SSR assertions got past it.

## Limitations
The e2e cause in finding 03 is inferred. Savings in finding 01 are estimates; my zod/mini micro-test used esbuild, not Rolldown. No production-serve measurement of CLS or time to interactive. Dev-mode "preloaded but not used" warning for Inter not checked in a production build.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT: accept or fix 173.5 kB (finding 01); route finding 03 (Fenn/Leon).
- Leon (a2): link kit.css and decisions.css from `/`'s `head`, then fonts and 44px/16px re-measure (findings 02, 04).
- Axis / Ghost: zod/mini, minified contract router (finding 01).
- Fenn: whether the locked e2e should wait for hydration before the first click.

## Files changed
```
apps/web/src/modules/decisions/api.ts
apps/web/src/modules/decisions/decisions.ts
apps/web/src/modules/decisions/index.ts
apps/web/src/modules/decisions/screens.ts
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx
apps/web/src/routes/index.tsx
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md
```

## Verification
```
$ pnpm --filter "@avel/web..." build
packages/contract build: Done
apps/web build: dist/client/assets/index-CzkiNsNe.js                 552.30 kB │ gzip: 173.53 kB
apps/web build: Done

$ typecheck
Scope: 3 of 6 workspace projects
packages/contract typecheck$ tsc -p tsconfig.json --noEmit
packages/contract typecheck: Done
packages/contract-mock typecheck$ tsc -p tsconfig.json --noEmit
packages/contract-mock typecheck: Done
apps/web typecheck$ node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
apps/web typecheck: Done

$ pnpm lint

> avel-factory@ lint /home/jt0629/projects/avel-wt/frontend-sprint-01-agent-leah-decisions-review-a11y-perf-a1
> biome check .

Checked 204 files in 136ms. No fixes applied.

$ pnpm --filter @avel/web test
> @avel/web@0.0.0 test /home/jt0629/projects/avel-wt/frontend-sprint-01-agent-leah-decisions-review-a11y-perf-a1/apps/web
> vitest run


 RUN  v5.1.0 /home/jt0629/projects/avel-wt/frontend-sprint-01-agent-leah-decisions-review-a11y-perf-a1/apps/web


 Test Files  14 passed (14)
      Tests  190 passed (190)
   Start at  16:58:19
   Duration  9.00s (tests 62%, environment 20%, import 9%, transform 5%, setup 4%)

    Isolate  14 workers spawned · ~435ms startup each (spawn + environment, per file)
             at least ~1.59s faster with isolate: false — reuses workers across files instead of one per file

$ pnpm --filter @avel/web exec playwright test
5 failed, 1 skipped (UC-29/30/31 phone, UC-29/30 desk); see finding 03
```
