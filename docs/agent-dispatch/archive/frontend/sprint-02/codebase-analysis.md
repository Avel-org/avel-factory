# Codebase analysis: frontend sprint-02

Rendered by `scripts/render.py` from `plan.toml` (`[analysis]` and `[commands]`).

## Stack

A pnpm workspace in TypeScript (Biome, Vitest; tsconfig.base.json strict). apps/web is TanStack Start (React 19 with the React Compiler, Vite, file routes, selective SSR), TanStack Query through oRPC's TanStack Query utils over @avel/contract (zod/mini), Tailwind v4 over the design library's tokens, lucide-react icons one by one. Tests: Vitest with Testing Library and jsdom, Playwright end to end, all against packages/contract-mock (Frontend Map v0.6).

## Layout

- apps/web/src/routes: __root.tsx (theme cookie, font preloads, app.css) and index.tsx (the decisions screen), which moves under the new _shell layout this sprint
- apps/web/src/modules/decisions: the approval page; new this sprint: modules/system (the shell's nav model and Settings), modules/missions (route 19, All projects, Progress), modules/clients (route 8, Clients)
- apps/web/src/kit: Enclosure Grid components with data-ui names, and kit.css
- apps/web/src/data and apps/web/src/lib: the data core (Ghost's); apps/web/src/styles: tokens, fonts and app.css (Nemi's)
- apps/web/test and apps/web/e2e: Fenn's (docs/agent-dispatch/frontend/sprint-01/locks.md holds the locks)
- packages/contract-mock: the contract mock (Ghost's); packages/contract: the backend's, read-only here

## Conventions

- The UI contracts are the spec: shell-layout.md and kit-v1.9.md, over the approval page contract. Names, props, copy and states as they give them; a † string is the contract's own
- Every value is the design library v1.9's final cascade for that element, or a --av-*/shell token, with the DL class in a comment; never invent a value. DL v1.9 wins over anything earlier
- Nothing reads the viewport in JavaScript, and nothing in the shell moves at hydration: widths are media queries, preferences are cookies the server reads
- Screens never call fetch and never keep server data in state; a module imports the kit, the data core and other modules only through their index.ts (Frontend Map v0.6)
- A file under a lock in locks.md changes only in a commit made with AVEL_LOCK_OVERRIDE set, and only when the task doc says so

## Commands

- **build:** `pnpm --filter "@avel/web..." build`
- **lint:** `pnpm lint`
- **test:** `pnpm --filter @avel/web test`
- **typecheck:** `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`

## Notes

- Scenario IDs SH-01 to SH-14 and SH-20 to SH-25, with no SH-08 (shell-layout.md section 9, kit-v1.9.md section 4) and UC-01 to UC-32 (the approval page contract) name every test. A dispatch that meets something the contracts leave open stops and reports it under Deviations.
- packages/contract is the backend's. The API gaps are escalations 01 to 03 in docs/agent-dispatch/frontend/sprint-02/escalations/, with the stand-ins the contract gives; never edit the contract.
- Procedures rule 1: main stays green. Fail-first tests land as test.fails until their build merges. Rule 7: / must pass the 150 KB size check. Every build that changes /'s JavaScript reports its figure.
