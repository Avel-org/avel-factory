# Codebase analysis: frontend/sprint-03

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

TanStack Start on Vite 8, React 19, Tailwind v4, the oRPC client over @avel/contract, contract-mock in dev and tests. Vitest 5 (node, react-dom/server) and Playwright with axe-core. No jsdom

## Layout

apps/web after T-F1 and T-F2: src/kit (AppShell, Icon, kit.css), src/modules/system/nav.ts (navFromRoutes), src/routes/_shell.tsx with / at routes/_shell/index.tsx, src/home, src/data/client.ts, src/styles. T-F1's and T-F2's locked tests stay on main and must keep passing

## Conventions

- AGENTS.md and Build rules E4: strict TypeScript, Biome with no warnings, no console.log
- E15: no money, no '$'
- shell-layout.md section 0: nothing moves at hydration, every width is a media query, nothing is measured until the user acts

## Notes

- Out of T-F3, for T-F4: the rail's collapse toggle, ⌘B and Ctrl+B, the collapsed tooltip, data-rail and the avel-rail cookie, and the Decisions badge (route 52 in _shell's loader)
- Still out: project rows and avel-project, the pages, sign-in, the live footer (S9), the highlight's glide (S4 needs two routes), and focus mode (E8, Javaris Nov 17: it comes with Canon onboarding, port step 6, the first route that turns it on)

## Commands

```sh
pnpm --filter @avel/web exec vite build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
