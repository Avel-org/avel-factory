# NEMI: w0-app build, completion report

verdict: PARTIAL

## Summary
NEMI-01 to NEMI-03 are written and committed (6234b9b): `@avel/web`'s package, tsconfig, vite config with the `AVEL_API=mock` dev middleware, the design library's token stylesheet with the Tailwind mapping (533 of 533 pairs), the library's two fonts, and the root shell with `data-theme` from the `avel-theme` cookie on the server. The token check and the `data-theme` check pass on the committed tree. Build, typecheck and test can't pass on it yet, and the dispatch order is why: TanStack Start won't build without Ghost's `src/router.tsx`, and `vite.config.ts` imports Ghost's `@avel/contract-mock`. With local stand-ins for those two (never committed), build and typecheck exit 0. `pnpm lint` also fails, on `@theme`, until the root `biome.json` enables Tailwind directives, and that file isn't in my territory.

## Pre-flight
- **Part 2 files:** all read.
  1. `.claude/agents/nemi.md`: read.
  2. `codebase-analysis.md`: read.
  3. and 9. `docs/ui-contracts/decisions-approval-page.md` (revision 5): read; section 6 in full.
  4. `docs/design/CR-W2 Pending decisions.md`: read (skimmed; nothing in it touches the app config).
  5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: read.
  6. and 11. Frontend Map v0.6: read; Rendering and SSR, Folder layout, Performance budgets and Territories in full.
  7. and 10. The design library v1.1: read; the token section (lines 17 to 594), the `@font-face` rules (lines 11 to 16), Light and Night.
  8. `docs/design/Step 0 and Step 1 plan.md`: read (item 13).
  12. `pnpm-lock.yaml`: read. `@orpc/contract` 1.16.2 and `zod` 4.6.7 (`packages/contract/package.json` pins the same).
  13. This task doc: read.
- **`locks.md`:** there's no frontend sprint-01 `locks.md` yet. The only one is `docs/agent-dispatch/backend/sprint-00/locks.md`, and I touched none of its paths.
- **Branch:** `frontend/sprint-01/agent-nemi-w0-app-build-a1`, started at `4eee066` (main).
- **Part 7 commands:** all available (pnpm 10.33.2, Node 24.22.2, Biome 2.6.5, TypeScript 7.0.2, Vitest 5.1.0). How each one ran is under Verification.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| NEMI-01 | DONE in code; its verify fails on the committed tree until Ghost's `router.tsx` and `@avel/contract-mock` exist (Limitations 1) | 6234b9b |
| NEMI-02 | DONE: 533 library tokens, 0 missing | 6234b9b |
| NEMI-03 | DONE in code: `data-theme` is in `__root.tsx`, and the built server's HTML carries it. The build step of its verify has the same limit as NEMI-01 | 6234b9b |

## Contract to files
- **Section 6, "The package is `@avel/web`" on TanStack Start with React and Vite:** `apps/web/package.json`.
  - Scripts:
    - `dev`: `vite dev`;
    - `build`: `vite build`;
    - `typecheck`: resolves the Vite config, which generates `src/routeTree.gen.ts`, then runs `tsc -p tsconfig.json`;
    - `test`: `vitest run`.
- **Section 6, the dependencies.** These are the resolved versions (`pnpm list --depth 0`); each is pinned exactly in `package.json`.

  | Dependency | Version | Kind | Section 6 |
  | --- | --- | --- | --- |
  | `@avel/contract` | `workspace:*` | dependency | yes |
  | `@orpc/client` | 1.16.2 | dependency | yes, at the contract's `@orpc/contract` version |
  | `@orpc/openapi-client` | 1.16.2 | dependency | yes, same |
  | `@orpc/tanstack-query` | 1.16.2 | dependency | yes, same |
  | `@tanstack/react-start` | 1.169.4 | dependency | yes |
  | `@tanstack/react-router` | 1.170.46 | dependency | yes (the version react-start 1.169.4 pins) |
  | `@tanstack/react-query` | 5.107.1 | dependency | yes |
  | `react` | 19.3.1 | dependency | yes |
  | `react-dom` | 19.3.1 | dependency | yes |
  | `zod` | 4.6.7 | dependency | yes, the contract's version |
  | `lucide-react` | 1.70.0 | dependency | yes |
  | `@tanstack/react-router-ssr-query` | 1.167.3 | dependency | **no**: Deviation 2 |
  | `@avel/contract-mock` | `link:../../packages/contract-mock` | dev | yes, but through `link:` instead of `workspace:` (Deviation 1) |
  | `tailwindcss` | 4.3.5 | dev | yes |
  | `@tailwindcss/vite` | 4.3.5 | dev | yes |
  | `vitest` | 5.1.0 | dev | yes, the workspace's version |
  | `@testing-library/react` | 16.3.3 | dev | yes |
  | `@testing-library/user-event` | 14.6.8 | dev | yes |
  | `jsdom` | 31.0.0 | dev | yes |
  | `@playwright/test` | 1.65.0 | dev | yes |
  | `vite` | 8.3.6 | dev | **no**: Deviation 2 (the version the lockfile already had through vitest) |
  | `@types/react` | 19.3.0 | dev | **no**: Deviation 2 |
  | `@types/react-dom` | 19.3.0 | dev | **no**: Deviation 2 |
  | `@testing-library/dom` | 10.4.2 | dev | **no**: Deviation 2 |

  The lockfile isn't committed (escalation 01). `pnpm install` changed it locally only.
- **Section 6, `tsconfig.json`:** `apps/web/tsconfig.json`.
  - It extends `tsconfig.base.json`, with DOM libs, `jsx: react-jsx`, Bundler resolution, `vite/client` types and `noEmit`.
  - It includes `src`, `test`, `e2e` and the three config files, so Fenn's tests and configs are typechecked too.
- **Section 6, `vite.config.ts`:** `apps/web/vite.config.ts`.
  - **`__AVEL_CONTRACT_VERSION__`:** read with `fs` from `packages/contract/package.json` at config time; a missing or empty `version` throws. It's `"0.0.0"` today.
  - **`AVEL_API=mock`:** adds the `avel:contract-mock` plugin with `apply: "serve"`. It makes one `createMock({ contractVersion })`, seeds `fixtures.step1`, and serves dev-server middleware:
    - `/api` and `/api/*`: the Node request becomes a fetch `Request`, goes to `mock.fetch`, and the response is written back with its status, headers and body;
    - `POST /__mock/reset`: `reset()`, then `seed(fixtures.step1)`, answering 204;
    - `POST /__mock/bump/{proposalId}`: `bumpVersion`, answering 200 `{ "version": n }`;
    - any other `/__mock` path or method: 404;
    - a thrown error goes to Vite's error handler.
  - The plugin sits before Start's, so it answers before SSR. It's the only import of `@avel/contract-mock` under `apps/web` outside the tests.
  - **Route tree:** Start's defaults, `src/routes` to `src/routeTree.gen.ts`, git-ignored in `apps/web/.gitignore` (with `dist/` and `.output/`).
- **Section 6 and NEMI-02, `tokens.css`:** `apps/web/src/styles/tokens.css`.
  - **The copy:** every declaration from the library's `Theme-independent AVEL tokens` comment up to `Base element defaults`, cut by script and kept character for character, under the same selectors. That includes the reduced-motion overrides and the `@keyframes`. `--av-stall-after: 8m` is as it is.
  - **The Tailwind mapping**, after the copy:
    - a `@theme` block clears Tailwind's default `--font-*`, `--radius-*`, `--shadow-*` and `--text-*`. The library's first comment says to do that ("Tailwind's default radii, shadows, type sizes and families are cleared");
    - a `@theme reference` block registers the library's 128 tokens in Tailwind's namespaces (`--color-*`, `--radius-*`, `--font-*`, `--text-*` with their sub-properties, `--shadow-*`, `--spacing-*`, `--ease-avel`), each as `var(--itself)`. Tailwind writes no copy of its own, so each utility reads the library's value, Light or Night.
  - **Checked by compiling:**
    - `bg-app-page`, `text-text`, `rounded-card`, `shadow-card`, `font-mono`, `text-title` (with its line height, weight and tracking), `h-control-md` and `ease-avel` read the tokens;
    - `rounded-md`, `text-sm`, `shadow-md` and `font-serif` generate nothing.
- **Section 6, "loads Inter Variable and IBM Plex Mono":**
  - `apps/web/src/styles/fonts/*.woff2` are the library's embedded WOFF2 data, base64-decoded byte for byte: Inter Variable 300 to 700, and IBM Plex Mono 400 and 500.
  - `apps/web/src/styles/fonts.css` has the library's three `@font-face` descriptors, pointing at those files.
  - `apps/web/src/styles/app.css` imports Tailwind, the fonts and the tokens.
  - The shell links `app.css` and preloads Inter Variable (FM, Performance budgets: self-hosted and preloaded).
- **Section 6 and NEMI-03, `__root.tsx`:** `apps/web/src/routes/__root.tsx`.
  - `createRootRouteWithContext<RouterContext>()`, where `RouterContext = { queryClient: QueryClient }` is exported for Ghost. The shell adds no provider and no auth guard.
  - The root `loader` returns `{ theme }` from a `createIsomorphicFn`:
    - on the server it's `getCookie("avel-theme")`;
    - in the browser it reads `document.cookie`, for client navigations.
  - Only `night` gives `night`. A missing cookie or any other value gives `light`.
  - `shellComponent` writes `<html lang="en" data-theme={theme}>`, with `HeadContent` and `Scripts`. The route component is `Outlet`.
  - **Checked on the built server, in process** (with the stand-in router):
    - no cookie gives `data-theme="light"`;
    - `avel-theme=night`, alone or after another cookie, gives `"night"`;
    - `avel-theme=dark` gives `"light"`.
  - `getCookie` isn't in the client bundle.
- **Section 8, Zane's check:** a production build made with `AVEL_API=mock` set has no `__mock`, no `contract-mock` and no `0193a000-0000-7000-8000-000000000001` in `dist/` (stand-in mock and router). Nothing under `apps/web/src` imports `@avel/contract-mock`.

## Deviations
1. **`@avel/contract-mock` is `link:../../packages/contract-mock`, not `workspace:*`.**
   - pnpm refuses `workspace:*` for a package that isn't in the workspace yet: `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`. That would break `pnpm install` for the whole workspace, backend included, until Ghost's package lands.
   - `link:` installs now. It makes the symlink `apps/web/node_modules/@avel/contract-mock`, which resolves once `packages/contract-mock` exists.
   - It should become `workspace:*` once Ghost's package is merged. That's a one-line change in my territory (Issues, INT).
2. **Five dependencies that section 6 doesn't list.** Each one is needed by something section 3 or 6 asks for:
   - `vite` 8.3.6: a peer dependency of `@tanstack/react-start` (`vite >=8`), and the binary behind `build` and `dev`. Section 6 says "TanStack Start with React and Vite".
   - `@types/react` and `@types/react-dom` 19.3.0: without them, no `.tsx` file typechecks. They're also a peer of `@testing-library/react`.
   - `@testing-library/dom` 10.4.2: a required peer of `@testing-library/react` 16. Fenn's component tests can't import RTL without it.
   - `@tanstack/react-router-ssr-query` 1.167.3: UI contract section 3 has Ghost's `getRouter()` call `setupRouterSsrQueryIntegration`, and that function ships only in this package. Ghost can't add it, because `package.json` is mine.

   Not added: `@vitejs/plugin-react`. Vite 8 compiles the JSX itself, and the build and SSR work without it. The cost is no React Fast Refresh in dev (Limitations).
3. **A `dev` script** (`vite dev`) besides build, typecheck and test. The `AVEL_API=mock` dev server and Fenn's Playwright `webServer` need a way to start Vite. Drop it if INT prefers `pnpm exec vite dev`.
4. **Temporary stand-ins at Ghost's paths, for local verification only.**
   - A minimal `apps/web/src/router.tsx` (`getRouter` with a `QueryClient` and `setupRouterSsrQueryIntegration`), and a stub `packages/contract-mock` (`createMock`, `fixtures`, `fetch`, `seed`, `bumpVersion`, `reset`).
   - I used them to check build, typecheck, the dev server and the SSR HTML.
   - Both were deleted before the commit and never staged. `git diff --name-only main...HEAD` lists only Part 5 paths.
5. **`tokens.css` starts with four `biome-ignore-all` comments.**
   - **`format`:** Biome's formatter changes the library's values. It writes `.97` as `0.97`, adds line breaks inside `linear-gradient(...)`, and so on. With it, the token check falls to 10 missing.
   - **`noImportantStyles`:** the library's reduced-motion `!important`.
   - **`noUnknownUnit`:** `8m`.
   - **`noDescendingSpecificity`:** the library's selector order.

   They're comments only, and no value or selector changed.
6. **The fonts are files written from the library's embedded data**, not a font package. Section 6 adds no font dependency, and FM wants them self-hosted.

## Limitations
1. **Build, typecheck and test fail on the committed tree until Ghost's w0-data merges.** This is the dispatch order, not the config:
   - Start requires a router entry. `vite build` and the typecheck's route-tree step stop with `Could not resolve entry for router entry: router in apps/web/src`.
   - `tsc` can't resolve `@avel/contract-mock` in `vite.config.ts` until the package exists.
   - With both stand-ins in place: `pnpm --filter "@avel/web..." build` exits 0; the typecheck command exits 0; `vite dev` with `AVEL_API=mock` starts with the mock plugin loaded.
   - So **main's `@avel/web` build is red** from this merge until Ghost's.
2. **`pnpm lint` fails** with `@theme` parse errors until the root `biome.json` sets `css.parser.tailwindDirectives: true`. `biome check --css-parse-tailwind-directives=true apps/web` is clean.
3. **`pnpm --filter @avel/web test` fails:** there are no tests yet (Fenn's), and Vitest falls back to `vite.config.ts` with no `vitest.config.ts`. The script is `vitest run`, exactly as the notes give it.
4. **The dev middleware's `/api` and `/__mock` answers weren't exercised over HTTP.** This session denied local HTTP requests, both curl and a background dev server probe.
   - Checked: the dev server started with the plugin and the stub mock, and the SSR HTML was checked by calling the built server's `fetch` in process.
   - Not checked over HTTP: the request and response conversion and the `/__mock` routing. UC-29 and UC-30 (Fenn's e2e) cover them.
5. **No React Fast Refresh in dev,** because there's no `@vitejs/plugin-react` (Deviation 2).
6. **Not copied:** the library's `Base element defaults` (body background `--av-floor`, colour `--av-ink`, font size and line height). They're outside the token section that section 6 names.
   - Tailwind's preflight does give `html` the library's `--font-sans`, through `--default-font-family`.
   - The page background and text colour stay unset until someone is given those rules.
7. **Tailwind's default colour palette isn't cleared,** so `bg-red-500` still generates. The library's comment names only families, radii, shadows and type sizes, so I cleared those four.
8. **Only Inter Variable is preloaded.** IBM Plex Mono loads through `@font-face` when it's first used, to keep the phone's first paint light.
9. **No `notFoundComponent`.** `/` returns 404 until Leon's `routes/index.tsx` exists, and the router warns that the root has no `notFoundComponent`.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  1. **Root `biome.json`** (not frontend territory): add `"css": { "parser": { "tailwindDirectives": true } }`, or `pnpm lint` stays red on `apps/web/src/styles/tokens.css`.
  2. **Merge order:** `@avel/web` can't build or typecheck until Ghost's `src/router.tsx` and `packages/contract-mock` land (Limitations 1). Either merge w0-app and w0-data close together, or accept a red web build on main in between. Fenn's w0-data tests come between them in the plan.
  3. **After Ghost's merge:** switch `@avel/contract-mock` to `workspace:*` in `apps/web/package.json` (Deviation 1), then regenerate the lockfile.
  4. **Decide on the five extra dependencies** (Deviation 2) and the `dev` script (Deviation 3).
  5. **Regenerate `pnpm-lock.yaml`** at merge (escalation 01).
- **Ghost:**
  - `router.tsx` must export `getRouter()` from `apps/web/src/router.tsx` and import `routeTree` from `./routeTree.gen`. The generated tree's footer does `import type { getRouter } from './router.tsx'`.
  - The root route types its context as `RouterContext = { queryClient: QueryClient }`, exported from `routes/__root.tsx`.
  - `setupRouterSsrQueryIntegration` is in `@tanstack/react-router-ssr-query` 1.167.3, now a dependency.
  - `__AVEL_CONTRACT_VERSION__` is defined in `vite.config.ts`, but nothing declares its type. Declare it beside `BUILT_CONTRACT_VERSION`, for example `declare const __AVEL_CONTRACT_VERSION__: string;`.
  - **The mock surface `vite.config.ts` uses:** `createMock({ contractVersion })`, `fixtures.step1`, `mock.fetch(request)`, `mock.seed`, `mock.reset` and `mock.bumpVersion(proposalId)`, which should throw for an unknown id; the middleware passes the error on to Vite.
  - `packages/contract-mock/package.json`'s `exports` must resolve when Vite loads its config. A TypeScript source entry worked with my stub.
- **Fenn:**
  - Without `apps/web/vitest.config.ts`, Vitest loads `vite.config.ts` (with Start's plugin). Your config needs to define `__AVEL_CONTRACT_VERSION__` from `packages/contract/package.json` (section 3).
  - `tsconfig.json` already includes `test`, `e2e`, `vitest.config.ts` and `playwright.config.ts`.
  - For Playwright's `webServer`: `AVEL_API=mock pnpm --filter @avel/web dev` (or `vite dev`). The `/__mock` paths are POST only; anything else there answers 404.
- **Leon:** `/` has no route until your `routes/index.tsx`. Your route can set the page's `<title>` through `head`; the shell sets no title.
- **Zero:** please decide who copies the library's `Base element defaults` (Limitations 6), and whether Tailwind's colour palette should be cleared too (Limitations 7).
- **Zane:** the dependency table is under Contract to files. A production build made with `AVEL_API=mock` set was checked for `__mock`, `contract-mock` and `MOCK_OPERATOR_ID`'s value: none found.
- **Leah:** only Inter Variable (48 KB WOFF2) is preloaded. The stand-in build's client entry was one JS chunk. The real numbers come with Leon's route.

## After review
- **2026-11-07, INT (Zero's w0-app review, Issues, b13979f; UI contract section 6 on main, bc4aafa):** the design library's `Base element defaults` block is copied word for word into the new `apps/web/src/styles/base.css`. That's every rule from its comment up to `AVEL field anatomy`:
  - `html` and `body` background `var(--av-floor)`;
  - `body` ink `var(--av-ink)`, type, and font smoothing;
  - links and their hover;
  - focus rings;
  - selection;
  - form and code inheritance.
- **Load order:** `app.css` imports it after `tokens.css`. It's unlayered, so it follows Tailwind's preflight. This closes Limitations 6.
- **One extra line:** a `biome-ignore-all format` comment at the top, as in `tokens.css`, so Biome keeps the library's text as it is.
- **Checks:**
  - the block is in `base.css` verbatim, and declares 0 custom properties;
  - NEMI-02's check: 533 library tokens, 0 missing (unchanged);
  - `biome check --css-parse-tailwind-directives=true apps/web`: clean, 8 files;
  - `pnpm lint`: the same 3 `@theme` errors in `tokens.css` as before, waiting on the root `biome.json`. My branch starts before INT's e5d4484;
  - compiling `app.css` with Tailwind puts the `html` and `body` rules after the tokens, unlayered;
  - `pnpm --filter "@avel/web..." build`: `packages/contract` builds, and `apps/web` still stops on Ghost's missing `src/router.tsx` (Limitations 1).
- **Files changed:** `apps/web/src/styles/base.css` (new) and `apps/web/src/styles/app.css` (one import, and its comment).

## Files changed
```
apps/web/.gitignore
apps/web/package.json
apps/web/src/routes/__root.tsx
apps/web/src/styles/app.css
apps/web/src/styles/base.css
apps/web/src/styles/fonts.css
apps/web/src/styles/fonts/ibm-plex-mono-400.woff2
apps/web/src/styles/fonts/ibm-plex-mono-500.woff2
apps/web/src/styles/fonts/inter-variable.woff2
apps/web/src/styles/tokens.css
apps/web/tsconfig.json
apps/web/vite.config.ts
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md
```

## Verification
On the committed tree (6234b9b), with no stand-ins. Output is trimmed to the lines that matter; stack frames are cut.

```
$ pnpm install
Scope: all 5 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
exit=0

$ pnpm --filter "@avel/web..." build
apps/web build: Error: Could not resolve entry for router entry: router in .../apps/web/src
apps/web build: Failed
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 build: `vite build`
exit=1

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
apps/web typecheck: Error: Could not resolve entry for router entry: router in .../apps/web/src
apps/web typecheck: Failed
exit=1

$ pnpm lint
apps/web/src/styles/tokens.css: parse: Enable `tailwindDirectives` in the css parser options (the @theme blocks)
apps/web/src/styles/tokens.css format: Code formatting aborted due to parsing errors.
Checked 135 files in 68ms. No fixes applied.
Found 3 errors.
exit=1

$ pnpm --filter @avel/web test
> vitest run
vite.config.ts (60:52) [UNRESOLVED_IMPORT] Could not resolve '@avel/contract-mock' in vite.config.ts
Startup Error: Could not resolve entry for router entry: router in .../apps/web/src
exit=1

$ git diff --name-only main...HEAD   # before this report's commit
apps/web/.gitignore
apps/web/package.json
apps/web/src/routes/__root.tsx
apps/web/src/styles/app.css
apps/web/src/styles/fonts.css
apps/web/src/styles/fonts/ibm-plex-mono-400.woff2
apps/web/src/styles/fonts/ibm-plex-mono-500.woff2
apps/web/src/styles/fonts/inter-variable.woff2
apps/web/src/styles/tokens.css
apps/web/tsconfig.json
apps/web/vite.config.ts
exit=0   (only Part 5 paths)
```

The task verifies, on the committed tree:

```
$ python3 -I -c "...NEMI-02's check..."
533 library tokens, 0 missing []
exit=0

$ grep -rl 'data-theme' apps/web/src/routes/__root.tsx
apps/web/src/routes/__root.tsx
exit=0

$ pnpm exec biome check --css-parse-tailwind-directives=true apps/web
Checked 7 files in 8ms. No fixes applied.
exit=0
```

With the temporary stand-ins (Deviation 4), before they were removed:

```
$ pnpm --filter "@avel/web..." build
apps/web build: ✓ built in 121ms
exit=0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
apps/web typecheck$ node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
apps/web typecheck: Done
exit=0

$ AVEL_API=mock vite dev --port 5391
VITE v8.3.6  ready in 417 ms

$ built server fetch() in process, GET /, by Cookie header
(none)                   404 <html lang="en" data-theme="light">
avel-theme=night         404 <html lang="en" data-theme="night">
x=1; avel-theme=night    404 <html lang="en" data-theme="night">
avel-theme=dark          404 <html lang="en" data-theme="light">
avel-theme=light         404 <html lang="en" data-theme="light">
(404: no index route yet; the shell renders either way)

$ AVEL_API=mock pnpm --filter @avel/web build && grep -rlE '__mock|0193a000-0000-7000-8000-000000000001|contract-mock' apps/web/dist
build=0; grep found nothing (exit 1)
```
