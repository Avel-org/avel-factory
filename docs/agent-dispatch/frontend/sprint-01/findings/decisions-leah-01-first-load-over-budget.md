status: fixed (S1-6, 9392017: / first load 150.35 kB, under 160)
severity: P1
owner: INT to sequence; reductions below

# `/` first-load JavaScript is 173.5 kB gzip, over sprint-01's 160 kB

**Evidence.** UI contract section 8 (Leah): at most 160 kB gzip of JavaScript (Decisions 2026-11-07).
```
$ pnpm --filter "@avel/web..." build
apps/web build: dist/client/assets/index-CzkiNsNe.js   552.30 kB │ gzip: 173.53 kB
apps/web build: dist/client/assets/routes-DnqA3qzM.js    0.07 kB │ gzip:   0.08 kB
```
Over by 13.5 kB. One chunk holds everything; the only other JS is 0.07 kB. INT's 172 kB figure agrees.

**Breakdown** (sourcemap attribution of the minified bytes, each group gzipped on its own at level 9, so the groups sum to more than 173.5; use them for ranking). Script: scratchpad `attr.mjs`.

| Group | raw kB | gzip kB |
| --- | --- | --- |
| react-dom, react, scheduler, use-sync-external-store | 274 | 74 |
| TanStack (router-core, react-router, query-core, react-query, start-client-core, history, store, ssr-query) | 159 | 47 |
| seroval + plugins (TanStack Start's SSR payload) | 33 | 9 |
| zod (classic) | 119 | 28 |
| oRPC (openapi-client, client, tanstack-query, standard-server*, shared, contract) | 37 | 12.5 |
| kit (all components) | about 21 | about 8 |
| decisions module | about 15 | about 5 |
| lucide-react | 9 | 3.4 |
| `@avel/contract` dist (schemas for the decisions group) | 4.5 | 1.9 |
| data/lib, routes | about 6 | about 2.6 |

The page's own code (kit + module + data) is about 8% of the bytes. The budget is spent on libraries.

**Reductions** (savings are estimates; none is built):
| Reduction | Estimated saving (gzip) | Owner |
| --- | --- | --- |
| `zod/mini` in `@avel/contract` and the web's own schemas (`data/pending-decisions.ts`, `ErrorBody` use). Classic is 28 kB here; mini's runtime for a schema set this size is roughly a quarter (my esbuild micro-test: 7.3 kB gz for a comparable schema set, different bundler, so only an order of magnitude) | 15 to 20 kB. Alone this clears 160 kB | Axis (S1-6, `@avel/contract`) then Ghost (web schemas) |
| oRPC `minifyContractRouter` so the client ships routes without schemas (`@avel/contract` dist 1.9 kB, plus the part of zod only those schemas reach) | 2 kB alone; up to the whole 28 kB zod if the web's own two schemas (`PendingDecisionRow`, `ErrorBody`) also go to a smaller validator or hand-written guards | Axis / Ghost |
| `ReasonDialog` + `Dialog` out of the first load (`React.lazy`, contract 5, "Styles and loading") | about 1.7 kB | Leon a2 (already planned) |
| Split `DecisionTag`'s rarely used states, `lucide-react` named imports already per-icon | under 1 kB | not worth doing |
| Route splitting | none for sprint-01: `/` is the only route, so the router, query and React core load on `/` anyway | n/a until W2 |
| React, TanStack Router/Query/Start, seroval | none available | fixed cost |

**Fix means:** ship zod/mini (or minified contract router with the web's two schemas off zod), rebuild, report the new gzip size. Until then INT decides whether to accept 173.5 kB for sprint-01.

## a2 re-check (d480f0e on b97076e)
**Still open, smaller.** The hold at my start commit is **160 kB** (Ghost's w0-data a2 and Axis's S1-6 are not merged: `data/pending-decisions.ts` is still on classic zod).
```
$ pnpm --filter "@avel/web..." build
index-DimhTn_r.js 493.83 kB │ gzip: 154.68 kB    jsx-runtime-Wy9s6hX0.js 3.39 kB    routes-Cosr3y1m.js 15.87 kB
$ gzip -9c <each> | wc -c   -> 152569 + 3425 + 15671 = 171665 B (171.7 kB)
```
The first load per section 8 is the entry, `jsx-runtime` and the route chunk (the three the start manifest preloads for `/`): 173.94 kB by Vite's figure, 171.7 kB by `gzip -9`. Over 160 by 11.7 to 13.9 kB. The split worked as designed (entry 173.5 to 154.7) but `/`'s chunk loads on `/`, so the first load only fell 0.4 kB; the dialog is out (`ReasonDialog-*.js` 1.52 kB, lazy: `DecisionsScreen.tsx:120`). Fix is unchanged: S1-6 (about 17 kB) then Ghost's w0-data a2 gives about 156.7 kB, which clears 160 and still misses 150.
