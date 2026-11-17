# Codebase analysis: frontend/sprint-03

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

TanStack Start on Vite 8, React 19, Tailwind v4, the oRPC client over @avel/contract, contract-mock in dev and tests. Vitest 5 (node, react-dom/server) and Playwright with axe-core. No jsdom

## Layout

apps/web after T-F1 and T-F2: src/kit (AppShell, Icon, kit.css), src/modules/system/nav.ts (navFromRoutes), src/routes/_shell.tsx with / at routes/_shell/index.tsx, src/home, src/data/client.ts, src/styles. Earlier tickets' locked tests stay on main and must keep passing

## Conventions

- AGENTS.md and Build rules E4: strict TypeScript, Biome with no warnings, no console.log
- E15: no money anywhere, no '$'; agent, client and Canon text is plain text
- shell-layout.md section 0: nothing moves at hydration, every width is a media query

## Notes

- Reading the prototype: it's a bundler page, never run. Its app is the JSON string in <script type="__bundler/template">. Extract it as data, for example `python3 -I -c 'import json,re,sys; h=open(sys.argv[1]).read(); print(json.loads(re.search(r"<script type=\"__bundler/template\"[^>]*>([\s\S]*?)</script>", h).group(1)))' docs/ui-reference/control-room-prototype.html > <your scratch file>`, then read NAV, NAV_LABEL and PAGES in it
- Out of T-F5, for T-F6: the Projects group (its head, the All link, project rows), /missions and /missions/$missionId, the --cr-id colours. Still out: the pages' real content, New project, the Project tab and avel-project; the sheet and More (T-F3), the collapse and the badge (T-F4)

## Commands

```sh
pnpm --filter @avel/web exec vite build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
