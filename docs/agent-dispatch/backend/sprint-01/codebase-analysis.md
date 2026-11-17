# Codebase analysis: backend/sprint-01

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

Node 22.12+, pnpm 10 workspace, TypeScript 7, Biome, Vitest 5; Hono, oRPC 1.16.2 (implement(contract) through OpenAPIHandler under /api), Zod 4 (zod/mini in the contract), Effect 4 inside packages/server

## Layout

packages/contract (the oRPC contract 1.0.0), packages/contract-mock, packages/db (schema, migrations), tools/docs (generated docs); new this sprint: tools/repo-checks (T-B0) and packages/server (manifest in T-B0, code in T-B1)

## Conventions

- AGENTS.md is the rulebook: API rules (errors, headers) and Writing Effect (rules 1 to 10)
- packages/server layout: src/platform/** for the shell, middleware and Effect services; src/modules/<module>/** for the 20 modules of Backend modules and build plan. CODEOWNERS (T-B0) relies on it
- Packages run TypeScript with node --experimental-strip-types, like tools/docs; tsconfig copies tools/docs/tsconfig.json
- Exact versions only in package.json (no ^ or ~), as in every existing package

## Notes

- Out of scope this cycle (next cycle): the Db service, database errors, idempotency, auth. So CR-30 spike 1 checks 2 (withTransaction, commitWithEvents) and 5 (the reaper under TestClock) move to the Db ticket
- T-B1 depends on T-B0: it needs T-B0's packages/server/package.json and the installed dependencies

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm test  # test
```
