status: needs-cr
ticket: T-F2

# T-F2 build: completion report (Fantem)

Stopped with one failing locked test, `T-F2-06` (the canvas hairline). The cause is a bug in T-F1's `apps/web/src/styles/app.css`, outside my territory. Everything else passes. Checkpoint commit: `cf10db7`.

## The change request

`app.css` defines a cycle in light mode:
- `@theme inline { --color-border: var(--border) }`
- `:root { --border: var(--av-hairline) }`
- `tokens.css`: `--av-hairline: var(--color-border)`

Tailwind's `@theme inline` replaces the light `--color-border: #e6e4e2` with `var(--border)`, so in light mode `--av-hairline` is invalid. Night is unaffected, because night re-declares `--color-border` as a literal. In light, every `var(--av-hairline)` is therefore empty, including the canvas's `box-shadow: 0 0 0 1px var(--av-hairline)`. The computed shadow is `none`, and `frame.spec.ts:71` expects `0px 0px 0px 1px`.

I confirmed this by appending `:root{--av-hairline:#e6e4e2}` to kit.css temporarily. The test then passed. I reverted it, because kit.css must not redefine `--av-*`.

**Ask:** let someone with `app.css` in territory break the cycle, for example by dropping `--border: var(--av-hairline)` and `--input`'s twin, or pointing `--border` at `var(--color-border-strong)`. No change to kit.css or any test is needed. With that, T-F2-06 should pass. The same cycle blanks the header's and the sidebar's hairlines in light.

## Pre-flight

| Command | Result |
| --- | --- |
| `pnpm --filter @avel/web exec vite build` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass, no warnings |
| `pnpm --filter @avel/web exec vitest run` | 44/44 pass |
| `pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit` | pass |
| `pnpm --filter @avel/web exec playwright test` | 28 pass, 1 fail (T-F2-06 shadow, above) |

I did not run the combined `vitest && playwright` line as a separate step, because it repeats the two lines above.

The worktree had no `node_modules` or package builds. I ran `pnpm install --offline --frozen-lockfile` and built `@avel/contract`, `@avel/contract-mock` and `@avel/db`. Nothing tracked changed. I did not start Postgres: `pg-local.sh start` ran, and the web tests don't use it.

## What changed

- `apps/web/src/kit/Icon.tsx`: the inbox icon and the brand mark, as inline SVG nodes copied from the DL's registry, with Lucide's ISC notice in the header comment.
- `apps/web/src/kit/AppShell.tsx`: the rail, the header (breadcrumb and progress line) and the tab bar.
  - The AppShell element carries `data-ui="AppShell"` and `data-tabbar`.
  - `data-hydrated` is set in an effect after hydration.
  - The progress line starts at `scaleX(0)` and follows the canvas, or the window below 1024px. It is measured only on scroll.
- `apps/web/src/kit/kit.css`: the DL's shell rules and S1's canvas. Hover rules are gated, nothing moves under reduced motion, focus rings show on keyboard focus only, and widths are media queries.
  - `--rail-w` and `--canvas-inset` are declared on the AppShell element, because tokens.css lacks them and is off limits.
- `apps/web/src/modules/system/nav.ts`: `navFromRoutes`, plus the `staticData.nav` typing. The tab bar lists `/` only (S17).
- `apps/web/src/routes/_shell.tsx`: the layout (`ssr: true`) that links kit.css and renders AppShell.
- `apps/web/src/routes/_shell/index.tsx`: moved from `routes/index.tsx` with `staticData.nav` added. The loader, view and title are unchanged.
- `apps/web/src/routeTree.gen.ts`: regenerated.

## Contract to files

| Requirement | Files |
| --- | --- |
| S1 canvas | `kit.css` |
| S2 data attributes | `AppShell.tsx` |
| S3 brand | `AppShell.tsx` |
| S4 current row look | `kit.css` |
| S14 header | `AppShell.tsx` |
| S15 nav label | `AppShell.tsx` |
| S17 tabs | `nav.ts` |
| Section 4 nav from routes | `nav.ts`, `_shell/index.tsx` |

## Deviations

- The shell's content wrapper is a `div.lib-main`, not a `main`, because T-F1's `HomeView` already renders its own `<main>` and I can't edit `src/home`. The tab-bar padding sits on `[data-tabbar] .lib-main`, which the test allows.
- The current row's look comes from `.lib-nav-item[aria-current]`, with no `.lib-nav-indicator` element. That's as the task doc says for this ticket.
- The tab bar and the rail both carry `aria-label="Main"`. Only one of them shows at a time.

## Limitations

- Light-mode hairlines are blank until the cycle above is fixed.
- No end-to-end screenshot of the finished page, because T-F2-06 fails. The Playwright run attached screenshots under `apps/web/test-results/`, which is untracked.

## Messages received

1. OSA, relayed from Zero: write the DL's `#000` mask colour as `black`. **Followed.**
2. OSA, relayed from Zero: build the tabs at the DL's 52px. **Followed**, with `min-height: 52px`.
3. OSA: port 5173 is OSA's dev server. **Left alone.** My tests use the config's own ports.
