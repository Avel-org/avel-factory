# Codebase analysis: frontend/sprint-04

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

TanStack Start on Vite 8, React 19, Tailwind v4, the oRPC client over @avel/contract, contract-mock in dev and tests (routes 8 and 19 with the sample world's missions and clients). Vitest 5 (node, react-dom/server) and Playwright with axe-core. No jsdom

## Layout

apps/web after T-F1, T-F2 and T-F5: src/kit (AppShell, ScreenHeader, WidgetState, Icon, kit.css), src/modules/system/nav.ts, src/routes/_shell.tsx and its pages, src/home, src/data/client.ts (route 52 only, narrowed for the budget), src/styles. Earlier tickets' locked tests stay on main and must keep passing

## Conventions

- AGENTS.md and Build rules E4: strict TypeScript, Biome with no warnings, no console.log
- E15: no money, no '$'; client names and package keys are plain text, never HTML
- shell-layout.md section 0: nothing moves at hydration, every width is a media query

## Notes

- Reading the prototype: a bundler page, never run. Extract the JSON string in <script type="__bundler/template"> as data (T-F5's plan shows one way) and read NAV, PAGES, missionRow, missionDot and DOTS, and the --cr-id rules
- Out of T-F6: New project and its + link (no /missions/new route yet, S17), project badges, Step N of 5 (S7), project page trees, the Project tab and avel-project, the real All projects and Progress content

## Commands

```sh
pnpm --filter @avel/web exec vite build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
