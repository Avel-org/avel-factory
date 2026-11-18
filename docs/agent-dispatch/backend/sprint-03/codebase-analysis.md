# Codebase analysis: backend/sprint-03

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

Node 22.12+, pnpm 10 workspace, TypeScript 7.0.2, Biome, Vitest 5; Hono 4.13.16, oRPC 1.16.2, Zod 4, Effect 4.1.1 inside packages/server; Drizzle 0.45.4 and node-postgres 8.23.1; Postgres 17

## Layout

packages/contract, packages/db (schema and migrations), packages/server (src/platform: app, effect-handler, errors, ids, logger, request-id; src/platform/db: db, tx, events, errors from T-B3 and T-B4), tools/repo-checks, apps/web

## Conventions

- AGENTS.md is the rulebook: API rules (DTOs, errors, writes, step-up, rate limits) and Writing Effect rules 1 to 10
- packages/server/src/platform/errors.ts holds the one table from a tagged error to a contract code; a tag with no row doesn't compile through effectHandler (T-B1)
- Db.withTransaction gives a program Tx and maps database violations to tagged errors (T-B3, T-B4); Events.append needs Tx
- Tests run against real Postgres from scripts/pg-local.sh; test/db/support/database.ts makes a migrated database per file (T-B3)

## Notes

- One builder at a time (B7): T-B11, then T-B8, then T-B9, then T-B10. Rigg writes the next ticket's tests while Soap builds, once the ticket it depends on is merged
- T-B8 to T-B10 are full rigor (C4: tokens, sign-in, step-up, sessions): Javaris merges, and Axis's second review follows the security checklist. T-B11 is standard but contract-labelled: Zero signs off (I3)

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm test  # test
```
