status: closed (INT's decisions, contract revision 10)
severity: P3
owner: Nemi (apps/web config) if it is ever pursued; INT decides

# Size study 02: Preact with preact/compat under TanStack Start (candidate 2)

**Measurement, not a defect.** Baseline `/` first load 174.35 kB gzip.

## Saving (the size is real; the page does not work)
| | first load, vite gzip | brotli 11 | change vs baseline |
| --- | --- | --- | --- |
| Client only (server renders with React) | 99.12 + 16.87 = **115.99 kB** | 100.91 | **-58.36 kB gzip, -48.46 brotli** |
| Client and server (Preact SSR through `preact-render-to-string`, `ssr.noExternal`) | 99.19 + 16.87 = 116.06 kB | 101.04 | -58.29 gzip |

Preact 11.2.0 (`preact/compat`). `react`, `react-dom`, `react-dom/client`, `react/jsx-runtime` aliased in the client environment. The server bundle grows (`dist/server/server.js` 261 -> 473 kB raw) because aliasing forces `noExternal`; that is not first load.

## Level: C for the saving's usefulness, B- for the build
Both builds succeed and the server's HTML has the 4 rows. **Hydration fails**, so the saving can't be called real:
1. **Without any change to the entry:** the page throws an uncaught `Promise` in the browser (`window.error: Uncaught #<Promise>`), and no click works (the approve dialog never opens). Cause (my reading, not proven): `@tanstack/react-router` `Match.js:109` does `throw router._tx[5]` for a pending match, which React 19 turns into a suspended transition. In `preact/compat` 11.2.0 `startTransition(cb)` is just `cb()` (`compat/src/hooks.js:3`), `useTransition` returns `[false, startTransition]` and `useDeferredValue` is the identity, so a thrown promise is an ordinary suspense with no boundary above `<html>`. (`compat` does export `use`, which throws the thenable the same way.)
2. **With a custom `src/client.tsx`** that wraps `<StartClient />` in `<Suspense fallback={null}>`: the throw goes away, but `hydrateRoot(document, …)` on Preact does not adopt the server's DOM. The page is **drawn twice**. Counted on the client-plus-server build at 1280x800: `article` 4 -> 8, `ul` 1 -> 2, `button` 5 -> 10. The client-only build with the same entry shows two Approve buttons per row too (strict-mode locator error at 390x844); I did not count its DOM.

   ```
   SSR: <button count 5  articles 4
   DOM: buttons 10 articles 8 lists 2
   ```
   (Likely cause, not proven: Start hydrates the whole `document` and its shell component renders `<html>`, which Preact's `hydrate` did not adopt here.)
3. Not reachable because of (1) and (2), so unchecked: `useSyncExternalStore` with a server snapshot (the page uses it for `useIsPhone`; Preact's compat may ignore `getServerSnapshot`), `useId`, `lazy`, transitions.

I stopped after these two attempts (time-boxed). A fix would be a custom client entry that hydrates `document.documentElement`'s children, or Start support for Preact; neither is a config line.

## Cost (if it worked)
- Nemi: `vite.config.ts` (alias plugin, `ssr.noExternal`), `package.json` (`preact`, `preact-render-to-string`; MIT, both maintained by the Preact team), a custom `src/client.tsx`.
- Contract/FM: section 6 (stack), FM's "React rules" (React Compiler is React-only; its runtime is `react/compiler-runtime`; Preact ships `preact/compat/compiler-runtime`), and every FM plan that names React 19 APIs: `Suspense`, `use`, `Activity` (I found no `Activity` in `preact/compat` 11.2.0), and transitions (which compat only simulates, above).
- Locked tests: Vitest runs on React in jsdom; they'd keep running on React and so would not cover the Preact build. Playwright e2e (UC-29 to UC-31) is the only check, and it fails today.

## Risk
- High and structural: Start/Router rely on React 19 suspense-in-transition semantics; each Start or Router upgrade can break a Preact build silently (they test against React).
- W2 to W5: more routes, streaming and `use` make it worse, not better.

## Commands (scratch)
```
$ BUILD with alias plugin, client env only
dist/client/assets/routes-DTXeqHZ5.js   47.89 kB │ gzip:  16.87 kB
dist/client/assets/index-CrfzgAFZ.js   307.68 kB │ gzip:  99.12 kB
FIRST LOAD  raw 355.57 kB  gzip 114.87 kB  brotli 100.91 kB
rows in HTML: 4
{ "rowsAfterLoad": 4, "dialogOpened": false, "problems": ["pageerror: Promise"] }
$ with src/client.tsx (Suspense) and PREACT=client,ssr
locator.click: strict mode violation: … Approve … resolved to 2 elements
```

## Recommendation: don't
58 kB is by far the biggest number in this study, but it is not available on this stack today. Revisit only if TanStack Start documents Preact support.
