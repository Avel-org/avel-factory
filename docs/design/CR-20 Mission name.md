# CR-20: the mission name (accepted, contract 1.0.0)

**Accepted by INT, Nov 8, 2026, with no slug.** Written by Axis for INT, from Zero's frontend sprint-02 escalation 02 (`docs/agent-dispatch/frontend/sprint-02/escalations/02-project-names.md`, Axis's answer).

**Why:** the sidebar lists each project by name (`AVEL Shell Layout brief v1.9.md`, lines 32 and 80), and `missions` has no name column (`DATABASE.md`, "Missions and money in").

## What changes

| Where | Change |
| --- | --- |
| `DATABASE.md`, `missions` | Adds `name`: text, required. A CHECK `missions_name_ck` requires `name = btrim(name)` and a length of 1 to 80 characters. Not unique, not frozen, and no default |
| `packages/db` | The column and its CHECK, in the migration of the step that builds route 20. Step 0's migrations stay as merged, and no `missions` row exists outside test seeds before then. **The `DATABASE.md` line lands in that same commit,** because CI's drift check (`.github/workflows/docs.yml`, `tools/docs` `drift`) compares `DATABASE.md` with the schema and would fail on a column the migration doesn't have yet |
| `MissionDto` | `name: string` |
| Route 20, `CreateMissionInput` | `name`: required, trimmed, 1 to 80 characters (`z.string().check(z.trim(), z.minLength(1), z.maxLength(80))`) |
| Route 22, `UpdateMissionInput` | `name`: optional, with the same check. `repoConnectionId` becomes optional too, so a rename doesn't have to resend it. The body has to carry at least one of them, or it's `BAD_REQUEST` with `details` naming the body |
| `API routes.md`, row 22 | "Links a repo connection" becomes "Links a repo connection, or renames the mission", in the Step 1 slice's contract commit. The contract's summary for route 22 and `packages/contract/test/fixtures/expected-routes.ts` follow it word for word |
| The activity log | A rename is a write on route 22, so it's logged as every write is. There's no new event kind |

## The version

**Inside `1.0.0`, with no major bump:**
- **Why it would otherwise be breaking:** a required input field (route 20) is a breaking change under S1-2 (`docs/agent-dispatch/backend/sprint-01/decisions.md`).
- **Why it isn't here:** the contract is still `0.0.0`, and INT put CR-20 into the Step 1 slice's `1.0.0`.
- **The same applies to route 22:** making `repoConnectionId` optional widens an input, which is additive, and it's also inside `1.0.0`.

## Not in this CR

- **No `slug`** (INT). The web's URLs are keyed by `$missionId` (Frontend Map v0.6, Routes). A slug that has to be unique per client is a commitment with nothing using it yet. It's raised again when a route takes one.
- **No `missionName` on route 52.** CR-W2 stays as accepted. Adding it later is a new optional output field, so a minor bump.
- **No name from Canon.** Canon doesn't propose or change the name. You give it at route 20 and edit it at route 22.

## Tests (for the step that builds routes 20 and 22)

- **The CHECK:** the database refuses an empty name, a name with surrounding spaces, and a name of 81 characters, naming `missions_name_ck`.
- **Route 20:** answers `BAD_REQUEST` with no `name`.
- **Route 22 renames:**
  - with `name` alone, it changes the name and leaves `repo_connection_id` as it was;
  - with neither field, it answers `BAD_REQUEST`;
  - with a stale `rowVersion`, it answers 409.
