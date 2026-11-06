# AVEL API and Data Reference

Nov 1, 2026 · @javaris

## How to read this

Every request follows one path: a **route** takes an input, the server reads or writes **tables**, and it answers with a **DTO**. **Checks** in the database refuse bad data no matter which route wrote it.

| Term | What it is here | Where it lives in code |
| --- | --- | --- |
| Route | One URL and method, such as `POST /api/missions/{missionId}/releases`. It names its input, its output DTO and the errors it can return. | `packages/contract/src/routes` |
| DTO | The public shape a route returns or accepts. It's never a raw table row: no secrets, hashes or internal columns. | `packages/contract/src/dto` |
| Table | Where data is stored. Every column is marked required or optional (`?`). | `packages/db` (Drizzle) and `docs/DATABASE.md` |
| Check | A database rule that refuses bad rows, such as "a landed module must have its landed commit". Includes unique indexes and delete rules. | Drizzle schema and migrations |

Conventions used throughout:

- Paths are lowercase plural nouns with named IDs, such as `{missionId}`. An action is something you create, so a release is `POST .../releases`.
- Money is in whole micro-dollars (`*Micros`; 1,000,000 = $1). Times carry a time zone. IDs are UUIDv7.
- Writes send the row's version back. A stale version gets 409, and a move the state machine doesn't allow gets 422.
- Password re-entry (marked **Password** below) applies only to credentials: secrets, repo connections and CLI logins. Approvals never ask.
- Nothing a receipt depends on is ever deleted. Removing something is a status change: archived, revoked, removed or destroyed.

The routes and DTOs below are generated from the contract code, and the tables and checks from the schema, so this page matches what gets built.

Each part has its own tab: Routes (99 routes by group), DTOs (85 output and 56 input shapes, plus value lists), Tables (every table by domain) and Checks (CHECKs, unique indexes, delete rules and busy-query indexes).

## Questions for your review

Eight calls worth a second look. Each gives what the contract does now and the alternative.

1. **The Decisions queue is `GET /api/pending-decisions`.** The nav still says Decisions. Alternative: name the route `/api/decisions` to match the nav, at the cost of clashing with `POST /api/proposals/{proposalId}/decisions`.
2. **Pause is `POST /api/missions/{missionId}/pauses`; resume is `DELETE .../pauses/{pauseId}`.** Alternative: `PATCH .../pauses/{pauseId}` setting `endedAt`, which reads less like deleting history.
3. **Approvals are separate nouns:** `finalizations`, `pass-approvals`, `releases`, checkpoint `approvals`, factory `merges`. Each has its own typed body. Alternative: one generic `POST /approvals` with a `kind` field, which is shorter but loosely typed.
4. **The version you approved travels in the body** (`rowVersion`, `version`, `receiptHash`, `headSha`), so it's typed and validated. Alternative: the standard `If-Match` header, which caches and proxies understand but the typed client can't check.
5. **Library routes are written out per kind** (`skills`, `kb-entries`, `rules`, `templates`), 16 routes with their own schemas. Alternative: one `/api/library/{kind}` route set, 4 routes with a loose body.
6. **Three routes live outside the contract** (`/api/auth/*`, the GitHub webhook and git over HTTP), so they don't appear in the typed client or the generated API docs. Alternative: add stub entries to the contract for documentation only.
7. **99 operations after cutting 10** (skill sources, rooms, agents list, package by key, events page, closing a factory PR). Any more to cut?
8. **Display state is worked out by the server, not stored.** `displayState` is `state`, or `paused` or `blocked_on_you` when a pause is open. Alternative: store it on the mission row, which is faster to filter on but can drift from the pauses.
