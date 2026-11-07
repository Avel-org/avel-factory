# Codebase analysis: frontend sprint-01

Rendered by `scripts/render.py` from `plan.toml` (`[analysis]` and `[commands]`).

## Stack

A pnpm workspace in TypeScript (Biome, Vitest; tsconfig.base.json strict). The backend's packages/contract (@avel/contract: oRPC 1.x contract with Zod 4) is what the web imports; it lands with backend sprint-00 m1. The web is new: TanStack Start (React, Vite, file routes, selective SSR), TanStack Query through oRPC's TanStack Query utils, Tailwind v4 over the design library's tokens, lucide-react icons. Tests: Vitest with Testing Library and jsdom, Playwright end to end, all against packages/contract-mock (Frontend Map v0.6).

## Layout

- apps/web/src/routes: thin file routes (__root.tsx is the shell, index.tsx renders the decisions screen)
- apps/web/src/modules/decisions: api.ts, decisions.ts, screens/, index.ts, screens.ts
- apps/web/src/kit: Enclosure Grid components with data-ui names
- apps/web/src/data: the oRPC client, idempotency, toUiError, query defaults, CR-W2's row schema; apps/web/src/lib: time formatting; apps/web/src/router.tsx: getRouter
- apps/web/src/styles: tokens.css and the Tailwind theme
- apps/web/test (unit, component and screen tests, mirroring src) and apps/web/e2e (Playwright): Fenn's, locked before the builds
- packages/contract-mock (@avel/contract-mock): routes 52 to 54 through the contract, fixtures, test controls
- packages/contract (@avel/contract): the backend's, read-only here

## Conventions

- The UI contract (docs/ui-contracts/decisions-approval-page.md) is the spec: names, props, copy and states as it gives them
- Every colour, size, radius and duration is a --av-* token; never invent a value (design library v1.1)
- Screens never call fetch and never keep server data in state; query options come from the module's api.ts (Frontend Map v0.6, Layers)
- A module imports the kit, the data core and other modules only through their index.ts; index.ts exports names only, never screens (Frontend Map v0.6, What every module looks like)
- Display text, progress and state come from the server; the web never derives them (Frontend Map v0.6, line 134)
- Package names are @avel/web and @avel/contract-mock, after @avel/contract and @avel/db (backend D12)

## Commands

- **build:** `pnpm --filter "@avel/web..." build`
- **lint:** `pnpm lint`
- **test:** `pnpm --filter @avel/web test`
- **typecheck:** `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`

## Notes

- The UI contract's scenario IDs (UC-01 to UC-23) name every test. A dispatch that meets something the contract leaves open stops and reports it under Deviations.
- packages/contract is the backend's: an API change you need is an escalation in docs/agent-dispatch/frontend/sprint-01/escalations/, written by Zero, never an edit.
