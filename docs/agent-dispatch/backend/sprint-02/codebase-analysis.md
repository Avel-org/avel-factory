# Codebase analysis: backend/sprint-02

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

Node 22.12+, pnpm 10 workspace, TypeScript 7.0.2, Biome, Vitest 5; Hono 4.13.16, oRPC 1.16.2, Zod 4, Effect 4.1.1 inside packages/server; Drizzle 0.45.4 and node-postgres 8.23.1 in packages/db; Postgres 17

## Layout

packages/contract, packages/contract-mock, packages/db (schema and migrations), packages/server (src/platform: app, effect-handler, errors, ids, logger, request-id, from T-B1), tools/repo-checks (the lock check, T-B0), tools/docs, apps/web

## Conventions

- AGENTS.md is the rulebook: API rules (errors, writes) and Writing Effect rules 1 to 10
- packages/server/src/platform/errors.ts holds the one table from a tagged error to a contract code; a tag with no row doesn't compile through effectHandler (T-B1)
- Real Postgres in tests (E10): scripts/pg-local.sh locally, the postgres service in CI; DATABASE_URL points at it. Each test file makes its own database and migrates it with pnpm --filter @avel/db migrate:up, as packages/db/test/helpers/db.ts does
- Exact versions only in package.json (no ^ or ~)

## Notes

- This sprint starts after sprint-01's T-B0 and T-B1 merged (both on main, Nov 17)
- Lock each ticket at the head of its tests dispatch (after the checker's report commit), and run check-locks on the branch before the build starts (T-B0 review, t-b0-rigg-01)
- Spike 1 check 5 (the reaper under TestClock) is not in this cycle: Javaris chose option A on Nov 17. A reaper is part of the jobs engine (C4), and E9 puts spike 2 (DBOS) before it, so check 5 joins the jobs and events tests written right before spike 2 and is proved once over whichever engine wins
- Backlog, not this cycle: T-B1 review P3s (effectHandler's Promise<any> loses the compile-time DTO check; no lint rule for Writing Effect rule 2; an abort may log a false defect; an OpenAPIHandler per request; any UUID version accepted)

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm test  # test
```
