# Codebase analysis: frontend/sprint-04

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

TanStack Start on Vite 8, React 19, Tailwind v4, the oRPC client over @avel/contract, contract-mock in dev and tests. Vitest 5 (node, react-dom/server) and Playwright with axe-core. No jsdom

## Layout

apps/web after T-F1 to T-F3: src/kit (AppShell with the sheet, Icon, kit.css), src/modules/system/nav.ts, src/routes/_shell.tsx with / at routes/_shell/index.tsx, src/home (loadHome, HomeView), src/data/client.ts, src/styles. T-F1's to T-F3's locked tests stay on main and must keep passing

## Conventions

- AGENTS.md and Build rules E4: strict TypeScript, Biome with no warnings, no console.log
- E15: no money, no '$'
- shell-layout.md section 0: nothing moves at hydration, every width is a media query, preferences are cookies the server reads, nothing is measured until the user acts

## Notes

- Still out of the shell: project rows, their badges and avel-project (routes 19 and 8), the pages, sign-in, the live footer (S9), the highlight's glide (S4 needs two routes) and focus mode (waits for Canon, E8)

## Commands

```sh
pnpm --filter @avel/web exec vite build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
