# Codebase analysis: backend sprint-00

Rendered by `scripts/render.py` from `plan.toml` (`[analysis]` and `[commands]`).

## Stack

A new TypeScript monorepo on pnpm workspaces. Biome for lint and format, Vitest for tests, Drizzle ORM and drizzle-kit on Postgres, and oRPC contract definitions with Zod schemas (Frontend Map v0.6, CR-W1). Nothing is built yet: Step 0 is the first code in avel-factory. The old schema is lost; its record is docs/design/AVEL Database Map.html, and Step 0 rebuilds packages/db from it (CR-19).

## Layout

- packages/contract: value lists, DTOs and inputs, oRPC routes, the error map, the event-owner map, the completion report schema (src/), and its tests (test/)
- packages/db: the Drizzle schema, the table-owner map, drizzle-kit migrations, and the db suite against real Postgres (test/)
- tools/docs: the ERD and OpenAPI generators and the DATABASE.md drift check; output in docs/generated/
- scripts/pg-local.sh: a local Postgres for tests
- docs/design: the design docs this step is written from (read-only)

## Conventions

- Value lists are text with a CHECK, never Postgres enums, defined once in packages/contract and imported by packages/db (DATABASE.md, Types)
- Every foreign key is ON DELETE RESTRICT except Better Auth's own tables, which cascade from users (DATABASE.md, Foreign-key policy)
- Primary keys are UUIDv7, money is bigint *_micros, and times are timestamptz *_at (DATABASE.md, Types)
- Table, column, CHECK, index and trigger names are the map's, word for word, as contract.md section 6 changes them; never invent a column
- Every mutable table has row_version and updated_at (touch_updated_at); immutable tables refuse updates (refuse_update) (Schema vs DATABASE.md.md, Patterns)
- Package names are @avel/contract and @avel/db (decisions.md, D12)

## Commands

- **build:** `pnpm build`
- **lint:** `pnpm lint`
- **test:** `pnpm test`
- **typecheck:** `pnpm typecheck`

## Notes

- contract.md is the step contract. Its section 7 lists what's still open; a dispatch that meets an open item stops and reports it under Deviations.
