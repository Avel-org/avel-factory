# Codebase analysis: frontend/sprint-02

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

TanStack Start on Vite 8, React 19, Tailwind v4, shadcn/ui, the oRPC client over @avel/contract, contract-mock in dev and tests. Vitest 5 (node, react-dom/server) and Playwright with axe-core. No jsdom

## Layout

apps/web from T-F1: src/routes (__root.tsx, index.tsx), src/home (the Decisions view), src/data/client.ts, src/styles (tokens.css, app.css), src/lib/utils.ts. T-F1's locked tests under apps/web/test and apps/web/e2e stay on main and must keep passing

## Conventions

- AGENTS.md and Build rules E4: strict TypeScript, Biome with no warnings, no console.log
- E15: no money, no '$'; untrusted text is plain text
- shell-layout.md section 0: nothing moves at hydration, every width is a media query, preferences are cookies the server reads

## Notes

- Out of T-F2, for T-F3: the menu button, More and the sheet; the collapse toggle, ⌘B and Ctrl+B, the collapsed tooltip and the avel-rail cookie; focus mode; the Decisions badge (route 52 in _shell's loader); the highlight's glide (S4 needs two routes)
- Out of the shell for now: the project rows, avel-project and routes 19 and 8 (no project page exists to link to); ScreenHeader and SegmentedControl (no page uses them yet); the pages; sign-in and the auth guard; the rail's live footer (S9)

## Commands

```sh
pnpm --filter @avel/web exec vite build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
