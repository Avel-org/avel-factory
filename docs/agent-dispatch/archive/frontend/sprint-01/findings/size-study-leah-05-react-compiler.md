status: closed (INT's decisions, contract revision 10)
severity: P3
owner: Nemi (`apps/web/vite.config.ts`, `package.json`); INT decides whether the budget carries it

# Size study 05: React Compiler (candidate 5)

**Measurement, not a defect.** Baseline `/` first load 174.35 kB gzip.

## The baseline does not build with the compiler
FM line 299 ("React rules"): "**React Compiler on**: `apps/web` builds with the React Compiler". `apps/web/vite.config.ts` has `react()` from `@vitejs/plugin-react` and no compiler (080ca45: `plugins: [tailwindcss(), tanstackStart(), react()]`), and UI contract section 6 doesn't mention it. So the FM's rule isn't met today, and the 174.35 kB baseline is without it. Turning it on is a size cost the budget has to carry.

## Saving (it is a cost)
| | first load, vite gzip | brotli 11 | change |
| --- | --- | --- | --- |
| baseline | 174.35 kB | 149.37 | |
| Babel React Compiler | 157.63 + 19.16 = **176.79** | 151.33 | **+2.44 gzip, +1.96 brotli** |

The route chunk grows most (17.04 -> 19.16): it holds the page's components, and the compiler adds a `useMemoCache` slot array and conditionals to each (`$[0] !== x` checks). The entry grows 0.3 (the kit's hooks are in the route chunk; the router glue is not compiled). Runtime: `react/compiler-runtime`'s `c()` is already in `react` (React 19.3), so there is no extra runtime package.

## Level: A
Production build + mock + Chromium: 4 rows in the HTML, hydrates with no console output, approve with a reason works. Full Vitest was not run on this build (Vitest has its own transform and the compiler is a build step).

I didn't measure the runtime benefit (fewer re-renders): the page has one list of 4 rows and few updates; it would show on a long list or a live stream (W4), which the FM's "Stream updates as transitions" assumes.

## What I used (scratch)
`@vitejs/plugin-react` 6.2.1 has no Babel any more. Two routes:
- **Babel:** `@rolldown/plugin-babel`, `@babel/core`, `babel-plugin-react-compiler` as dev dependencies, and in `vite.config.ts` `plugins: [..., react(), babel({ presets: [reactCompilerPreset()] })]`. This is what I measured.
- **Native:** `react({ compiler: true })` with the optional peer `oxc-transform-react` (a Rust port, marked experimental in the plugin's README). Not installed or measured.

## Cost
- Nemi: `vite.config.ts`, `package.json` (3 dev dependencies for Babel: Meta/Babel/Rolldown, MIT; or 1 for the native one).
- No locked-test change. Vitest's setup would need the same plugin to test the compiled output; not required.
- Lint: `react-hooks` rules from the compiler (Biome has no equivalent today); the FM's "No `memo`/`useMemo`/`useCallback` by habit" starts to hold.

## Risk
- Compiler bailouts on code that mutates props or reads refs in render; the kit's `interaction.ts` and timers in `DecisionsScreen.tsx` use refs. The build above compiled without a diagnostic (I did not turn `logDiagnostics` on).
- Build time up (a Babel pass over every component).
- Preact (option 2) and the compiler don't go together without `preact/compat/compiler-runtime`.

## Commands (scratch)
```
$ pnpm --filter @avel/web add -D @rolldown/plugin-babel @babel/core babel-plugin-react-compiler
$ pnpm exec vite build
dist/client/assets/routes-Gf2xoa6r.js   55.09 kB │ gzip:  19.16 kB
dist/client/assets/index-32q2grwY.js   502.86 kB │ gzip: 157.63 kB
FIRST LOAD  raw 557.96 kB  gzip 175.06 kB  brotli 151.33 kB
FIRST LOAD (vite gzip, summed over the chunks above): 176.79 kB
{ "rowsAfterLoad": 4, "approvedShown": true, "rowsAfterApprove": 3, "problems": [] }
```

## Recommendation: do at W2, and decide now whether the budget carries +2.4 kB
FM says it's on; the cost is small and mostly pays off with lists and streams. I would turn it on with the first live screen, not for a four-row page, but INT should either amend FM line 299 or count 2.4 kB in the budget. In the recommended set (report) the page is under 150 kB with it.
