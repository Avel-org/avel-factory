status: done
ticket: T-F1

# T-F1 tests · Fenn · completion report

## Pre-flight

Run on the start commit `91c4888` plus my test files, with Node 24.22 on PATH (the shell's default `pnpm` is the Windows one), after `pnpm install --frozen-lockfile`, `pnpm --filter @avel/contract build` and `pnpm --filter @avel/db build`. Neither package is built on a fresh checkout, and `pnpm typecheck` fails in tools/docs until `@avel/db` is built.

| Command | Result |
| --- | --- |
| `pnpm --filter @avel/web exec vite build` | exit 1, as expected: `Cannot resolve entry module index.html` (the app isn't built yet) |
| `pnpm typecheck` | green (after `@avel/db` was built) |
| `pnpm lint` | green, 180 files, no warnings |
| `vitest run && playwright test` | vitest: 5 files fail (3 tests fail, 4 files can't import the missing modules); playwright is not reached because `&&` stops. I ran playwright on its own: 14 of 14 fail |
| `vitest run` | fails (see Failing first) |
| `playwright test` | 14 failed |
| `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit` | fails: apps/web has no tsconfig.json yet. It's the builder's, so I did not add one |

I also ran the unit tests once against a throwaway stub of src (deleted before commit, never committed). All 21 passed, so the unit tests can pass. I couldn't do the same for the e2e specs without building the whole TanStack Start app (see Limitations).

## Failing first

Unit (vitest), all on missing product code:

```
FAIL test/foundation.test.ts            Cannot find module '../src/lib/utils'
FAIL test/home-loader-states.test.ts    Cannot find module '../src/data/client'
FAIL test/home-loader.test.ts           Cannot find module '../src/data/client'
FAIL test/home-view.test.ts             Cannot find module '../src/home/HomeView'
FAIL test/hygiene.test.ts > apps/web/src exists and has the files this ticket adds
     AssertionError: expected [] to include 'home/HomeView.tsx'
FAIL test/hygiene.test.ts > no file uses dangerouslySetInnerHTML or sets innerHTML
     AssertionError: expected 0 to be greater than 0
FAIL test/hygiene.test.ts > no file imports classic zod (only zod/mini is allowed)
     AssertionError: expected 0 to be greater than 0
Test Files  5 failed (5)
```

End to end (playwright), all 14 fail: the dev server has no app, so `/` has no h1 or html attributes (the heading waits time out; the server-HTML checks get an empty or 404 body), and the build fails:

```
✘ budget.spec.ts      the JavaScript / loads is at most 150 KB gzipped   (vite build: Cannot resolve entry module index.html)
✘ budget.spec.ts      no built file contains the mock's operator id      (same build failure)
✘ home.spec.ts        T-F1-06 HTML before hydration has the h1, count and title
✘ home.spec.ts        T-F1-06 with scripts off
✘ home.spec.ts        T-F1-06 hydrated page keeps the same content
✘ home.spec.ts        T-F1-07 no cookie: light; avel-theme=night: night
✘ home.spec.ts        T-F1-07 page background differs between light and night
✘ home.spec.ts        T-F1-08 light 390x844 / light 1440x900 / night 390x844 / night 1440x900   (4)
✘ home.spec.ts        T-F1-09 the page's text has no '$'
✘ states.spec.ts      error state in the browser (alert, Try again)
✘ states.spec.ts      error state in the server's HTML
14 failed
```

## What changed

- `apps/web/vitest.config.ts`: includes `test/**` only, the React plugin for `.tsx`, and an `@` alias to `src` (shadcn's alias, which the builder's files will use).
- `apps/web/playwright.config.ts`: starts `vite dev` twice: with `AVEL_API=mock` and with no mock. Ports come from a hash of the worktree path (D5). Video and screenshot are on for every test.
- `apps/web/e2e/support/ports.ts`: the three ports (mock dev, bare dev, preview).
- `apps/web/e2e/support/page.ts`: the axe check (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa), screenshot attachments, the server-HTML text extractor and the world's count.
- `apps/web/e2e/home.spec.ts`: T-F1-06, 07, 08 (4 combinations) and 09.
- `apps/web/e2e/states.spec.ts`: the error state in the browser, against the dev server with no mock behind `/api`. This also covers WCAG, no `$`, and that "Try again" makes the browser ask route 52 again.
- `apps/web/e2e/budget.spec.ts`: T-F1-10. It runs `vite build` then `vite preview`, sums the gzipped JS (HTML script tags, preloads, inline `import()`s, the scripts the browser really fetches, and inline script bytes), allows at most 150 KiB, warns over 130 KiB, and scans `dist` for the mock's operator id.
- `apps/web/test/home-loader.test.ts`: T-F1-01. `createClient` lists route 52 over `createMock({ world: true }).fetch`; `loadHome` returns ready with the world's count; it sets `more` when `nextCursor` is non-null.
- `apps/web/test/home-loader-states.test.ts`: T-F1-02. Empty when route 52 has no rows. `failNext(52)`, a network failure and a non-JSON body all give `{ kind: 'error' }` without throwing.
- `apps/web/test/home-view.test.ts`: T-F1-03. Each state's copy and role through `react-dom/server`, the "+" suffix, the Try again button, and `HomeLoading`'s `role="status"`.
- `apps/web/test/foundation.test.ts`: T-F1-04. `tokens.css` is byte for byte the handoff's, `components.json` points at `src/styles/app.css`, and `app.css` imports tokens and maps shadcn's variables to `--av-*` with no hard-coded hex. `cn()` merges conflicting classes.
- `apps/web/test/hygiene.test.ts`: T-F1-05. `src` must exist with the ticket's files, and no `dangerouslySetInnerHTML`, `innerHTML` or classic zod import.

## Contract to files

- T-F1-01: `home-loader.test.ts`. T-F1-02: `home-loader-states.test.ts`. T-F1-03: `home-view.test.ts`. T-F1-04: `foundation.test.ts`. T-F1-05: `hygiene.test.ts`.
- T-F1-06, 07, 08, 09: `home.spec.ts` plus `states.spec.ts`. T-F1-10: `budget.spec.ts`.
- E15 (plain text, no money): `home.spec.ts` T-F1-09, the `$` checks in `states.spec.ts`, and `hygiene.test.ts`. E16 (budget): `budget.spec.ts`. E17 and F6 (WCAG, screenshot and video): `support/page.ts`, `home.spec.ts` and `playwright.config.ts`.
- Approvals never ask for a password: not touched. The page has no approval, so nothing to test.

## Deviations

- Playwright starts a second dev server with no mock, which the task doc doesn't mention, to reach the error state in a browser. A browser test can't call `failNext` on the dev server's mock. The state itself is also covered against `contract-mock` in the unit tests.
- The budget spec starts its own build and preview, not from `webServer`, so a failed build fails the budget tests one by one instead of aborting the whole Playwright run.
- Budget unit: 150 KB is taken as 150 × 1024 bytes. A stricter 150,000 would need a decision from Zero.
- I didn't add `todo`, `.skip` or `.only`. The `forbidOnly` setting is on.

## Limitations

- I could not run the e2e specs against a working app, because T-F1 isn't built. Selectors and server-HTML regexes follow the task doc's copy and could still be too strict for valid markup. Expect `test-dispute` traffic here.
- `home-view.test.ts` calls `HomeView({ state, onRetry })` as a plain function and walks the returned element tree to find the Try again `onClick`. A `HomeView` that calls hooks fails that one test; the builder should keep `HomeView` a pure view, as the task doc's seam says.
- `createClient`'s `baseUrl` has to be the origin only (e.g. `http://mock.test`): the contract's route paths already start with `/api`. I checked this with the throwaway stub.
- Untested here: the `Loading…` state in a browser (the view's markup is covered by the unit test), `?` pages beyond the first, the production build's rendering of the error state, and `tsc -p tsconfig.json`, which needs the builder's tsconfig.
- Playwright writes `test-results/` and `dist/` under `apps/web`; the root `.gitignore` doesn't list `test-results/`, and I may not edit it. I removed both before committing.
- Two dev servers share Vite's dependency cache; if that ever flakes, `cacheDir` is the builder's `vite.config.ts` to set.
- Node: the shell's `pnpm` wouldn't run until I put `~/.nvm/versions/node/v24.22.2/bin` on PATH.

## Messages received

None.

## Lock line

LOCKLINE
