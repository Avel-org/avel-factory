# Codebase analysis: frontend/sprint-01

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

TanStack Start on Vite 8, React 19, Tailwind v4, shadcn/ui, the oRPC client (OpenAPILink) over @avel/contract 1.0.0, served in dev and tests by @avel/contract-mock. Vitest 5 and Playwright with axe-core

## Layout

apps/web is new: T-B0 leaves only its package.json (name @avel/web, its dependencies, sideEffects, and the scripts dev, preview, test and e2e; no build or typecheck script yet, so main stays green before T-F1). packages/contract (the contract), packages/contract-mock (createMock: routes 8, 19, 52 to 54 and the sample world), packages/db

## Conventions

- AGENTS.md and Build rules E4: strict TypeScript, Biome with no warnings, no console.log
- E15: agent, client and Canon text is plain text, never HTML; no money anywhere, no '$'
- The web imports zod only as zod/mini (decisions-approval-page.md section 3, revision 9)
- @avel/contract-mock is for the dev server under AVEL_API=mock and the tests only, never a production build

## Notes

- The old 45-file apps/web in ~/projects/avel-wt is built on contract 0.0.0 and isn't a source (handoff README; docs/design/README.md). Don't read it or copy from it
- Out of this sprint: the shell layout and sign-in (next cycle, E14), the event stream hook and the full error map (port step 1's other half, with the data core of decisions-approval-page.md section 3), fonts, the React Compiler, TanStack Query, and TanStack DB (E18: CR-W23 isn't accepted)

## Commands

```sh
pnpm --filter @avel/web exec vite build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
