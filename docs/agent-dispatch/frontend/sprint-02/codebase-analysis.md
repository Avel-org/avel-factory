# Codebase analysis: frontend sprint-02

Rendered by `scripts/render.py` from `plan.toml` (`[analysis]` and `[commands]`).

## Stack

A pnpm workspace in TypeScript (Biome, Vitest; tsconfig.base.json strict). apps/web is TanStack Start (React 19 with the React Compiler, Vite, file routes, selective SSR), TanStack Query through oRPC's TanStack Query utils over @avel/contract (zod/mini), Tailwind v4 over the design library's tokens, lucide-react icons one by one. Tests: Vitest with Testing Library and jsdom, Playwright end to end, all against packages/contract-mock (Frontend Map v0.6).

## Layout

- apps/web/src/routes: __root.tsx (Nemi's: theme cookie, font preloads, app.css); index.tsx renders the decisions screen, and moves under the new _shell layout this sprint
- apps/web/src/modules/decisions: the approval page (api.ts, decisions.ts, screens/, index.ts, screens.ts, decisions.css); apps/web/src/modules/system: new this sprint, the shell's navigation and the stub screens
- apps/web/src/kit: Enclosure Grid components with data-ui names, and kit.css
- apps/web/src/data and apps/web/src/lib: the data core (Ghost's); apps/web/src/styles: tokens, fonts and app.css (Nemi's)
- apps/web/test and apps/web/e2e: Fenn's, locked before the builds (docs/agent-dispatch/frontend/sprint-01/locks.md holds sprint-01's locks)
- packages/contract-mock: the contract mock (Ghost's); packages/contract: the backend's, read-only here

## Conventions

- The UI contracts are the spec: docs/ui-contracts/app-shell.md for the shell, and docs/ui-contracts/decisions-approval-page.md (revision 15) for the page. Names, props, copy and states as they give them; a † string is the contract's own
- Every colour, size, radius and duration is a --av-* token or the design library's own literal for that element, with its source in a comment; never invent a value
- Nothing in the shell reads the viewport in JavaScript: every width is a CSS media query on the server's HTML (app-shell.md section 1)
- Screens never call fetch and never keep server data in state; a module imports the kit, the data core and other modules only through their index.ts (Frontend Map v0.6)
- A file under a lock in locks.md changes only in a commit made with AVEL_LOCK_OVERRIDE set, and only when the task doc says so

## Commands

- **build:** `pnpm --filter "@avel/web..." build`
- **lint:** `pnpm lint`
- **test:** `pnpm --filter @avel/web test`
- **typecheck:** `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`

## Notes

- The contracts' scenario IDs (SH-01 to SH-24 here, UC-01 to UC-32 in the approval page contract) name every test. A dispatch that meets something the contract leaves open stops and reports it under Deviations.
- packages/contract is the backend's: an API change you need is an escalation in docs/agent-dispatch/frontend/sprint-02/escalations/, written by Zero, never an edit.
- /'s first load is 149.30 kB gzip on main before the shell, against a 150 kB budget. Every build reports it from its own build, as app-shell.md section 6 asks.
