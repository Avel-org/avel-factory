status: open
severity: P3
owner: INT (ordering); Nemi, Leon, Fantem for the individual items

# Size study 07b: the fresh attribution of the baseline, ranked, with the estimates I did not build

**Measurement, not a defect.** Baseline = 080ca45 + `sideEffects` line, sourcemap build (`vite build --sourcemap`), the minified bytes of both client chunks (552.6 kB raw) attributed to the source file each byte maps to, and each group gzipped on its own at level 9 (so groups sum to more than the 174.35 kB first load; use them for ranking). Script: scratchpad `attr.mjs`.

## By package
| Group | raw kB | gzip kB (alone) | What it is for `/` |
| --- | --- | --- | --- |
| react-dom | 207.2 | 63.7 | fixed (React) |
| zod (classic) | 94.5 | 26.2 | S1-6 (17.25 given) |
| `@tanstack/router-core` | 58.9 | 20.6 | the router |
| `@tanstack/query-core` | 35.3 | 10.0 | option 1 |
| seroval | 24.1 | 7.9 | option 4 |
| `@tanstack/react-router` | 17.7 | 6.4 | the router's React glue |
| `DecisionsScreen.tsx` | 10.9 | 4.2 | the page |
| lucide-react | 7.8 | 3.2 | 20 icons |
| react | 8.2 | 3.1 | fixed |
| oRPC (openapi-client 2.6, client 2.3, standard-server 1.6, shared 1.5, server-fetch 1.5, tanstack-query 1.3, contract 0.8) | 29.6 | 11.6 | option 3 |
| `start-client-core` (serverFnFetcher 1.2, frame-decoder 1.1, rest 0.2) | 5.6 | 2.5 | option 4 |
| `@tanstack/history` | 4.5 | 1.9 | router |
| `@avel/contract` | 3.8 | 1.8 | S1-6, S1-7 |
| kit (DecisionTag 2.0, ErrorPanel 1.0, Dialog 0.9, WidgetState 0.8, ReasonDialog 0.7, StatusGlyph 0.6, HashChip 0.5, Button 0.5, Icon 0.4, Tag 0.3) | 18.4 | 7.9 | the page |
| scheduler, use-sync-external-store, store | 9 | about 4 | fixed |
| the rest (modules `api.ts`, `decisions.ts`, `data/*`, `lib`, `routes`) | 8.4 | 4.3 | the page |

Baseline duplicates: none (26 packages, each in one version).

The page's own code (kit 7.9 + screen 4.2 + the rest 4.3) is about 16 kB gzipped alone, under a tenth of the 174. Four things make up about 155 of it (alone-gzip figures): React (about 68), the router with its history and store (about 30), zod (26), and TanStack Query, oRPC and seroval (about 31 together).

## Ranked by saving (everything this study measured or estimated)
| Rank | Item | Saving, gzip | Level | Where |
| --- | --- | --- | --- | --- |
| 1 | Preact | 58.4 | C (size real, page broken) | finding 02 |
| 2 | S1-6 (zod/mini), as given | 17.25 | given | backend S1-6 |
| 3 | Start's server-function RPC and seroval | 11.0 | A (stubbed) | finding 04 |
| 4 | TanStack Query -> loaders | 12.5 | A | finding 01 |
| 5 | Thin oRPC link | 7.0 to 7.7 | A | finding 03 |
| 6 | Router pieces the page never uses (below) | 2 to 4 | C | this file |
| 7 | Error-path code lazy (below) | 2 to 3 | C | this file |
| 8 | Icons (below) | 1 to 2 | C | this file |
| 9 | Lazy `ReasonDialog` | 0.7 | A | finding 07 |
| -  | React Compiler | -2.4 (a cost) | A | finding 05 |
| -  | Build options | 0 | A | finding 06 |

## Estimates I did not build (level C: attribution only, nothing stubbed)
1. **Router code the page never runs, 2 to 4 kB.** `react-router/link.js` 2.0 (the `Link` component: the page has none; it probably stays because a default component references it; I didn't trace it), `router-core/scroll-restoration.js` 1.1, `defer.js` + `awaited.js` + `lazyRouteComponent.js` 0.8, `redirect.js`/`not-found.js` 0.4. Tree-shaking can't drop them: `createRouter` and the default components reference them. Removing them means patching TanStack Router or a build-time stub like option 4's, per file. Fragile, and it grows with W2 (links appear on every page). **Don't.**
2. **Error-path components lazy, 2 to 3 kB.** `ErrorPanel` 1.0, `WidgetState` (error and stale states only) part of 0.8, `HashChip` 0.5, `failureView` and `UnreachableBand` (inside `DecisionsScreen`'s 4.2; I guess about 1 kB of it). They draw only after a failure. The loading state needs `WidgetState` at first paint, so only the error half could split. A lazy error state also delays the "Couldn't load" panel by a request, on the path where the network is already failing. **Don't now; reconsider at W2.**
3. **Icons, 1 to 2 kB.** The kit registers 20 lucide icons (about 0.2 each, 3.2 in all with the base code); the first paint draws only a few of them (I didn't count which). Inline SVG paths for those or a lazy icon sheet would save about 1.5 kB. Fantem's territory and DL's registry rule ("per-icon imports", FM v0.4). **Don't.**
4. **Inline `style` objects in `DecisionsScreen.tsx` (the `PAGE`, `HEAD`… constants), under 1 kB.** Moving them to `decisions.css` takes bytes from the JavaScript budget into CSS. That is allowed by section 8 (stylesheets don't count) but it is accounting, not a saving, and the contract already puts the module's styles in `decisions.css`. Leon a2's move may do it; I don't count it.

## Commands
```
$ pnpm exec vite build --sourcemap
$ node attr.mjs <web>          # groups by package; FILES=<regex> breaks one group down by source file
react-dom 207.2 raw / 63.7 gzip; zod 94.5 / 26.2; @tanstack/router-core 58.9 / 20.6; @tanstack/query-core 35.3 / 10.0; seroval 24.1 / 7.9 …
$ FILES="tanstack\+(router-core|react-router|history|react-start|store|start-client)" node attr.mjs <web>
router-core/load-client.js 19.5 / 7.1; router.js 16.4 / 6.0; new-process-route-tree.js 8.3 / 3.1; react-router/link.js 4.0 / 2.0; scroll-restoration.js 2.4 / 1.1 …
```

## Recommendation
Rank 1 is not available. Ranks 2 to 5, 9 and a decision on the Compiler give the recommended set in the report. Ranks 6 to 8 are small, fragile or accounting; leave them.
