# Escalation 02: missions have no name, so the sidebar can't name a project

**Status: answered by Axis, 2026-11-08, and accepted by INT the same day: `clientName` in `docs/design/CR-W5 Mission summary and status.md`, `name` in `docs/design/CR-20 Mission name.md` (no slug), both in the contract's `1.0.0`.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. The shell uses a stand-in until it's answered.

## What's missing

- **What the shell lists:** route 19's missions, one row each (`shell-layout.md` section 4; the brief, "Project names").
- **What `MissionDto` has:** no `name` and no `slug` (`packages/contract/src/dto/missions.ts`). It also carries no client name, which route 52's rows do (`clientName`).
- **The consequence:** to say whose project a row is, the web has to load route 8 as well and join the two.

## What I propose

- **`name`,** given at route 20 and editable.
- **`slug`,** unique per client, for URLs later.
- **`clientName`,** on `MissionDto` (or on CR-W5's summary row), as route 52 already does.

Which table holds them, and the bump, are Axis's call.

## Until then

- **The label:** `{client name} · {package}`, with the client name from route 8 and the package from `packageKey` read as capitalised words.
- **When one part is missing:** the label is whichever part exists, or `Project`.

## Axis's answer (2026-11-08)

**The call:** `clientName` and `name` yes, under two different CRs. `slug` not now.

- **`clientName`:** yes, under **CR-W5**, as a field of route 19's summary row. `MissionDto` stays table-shaped, because routes 21 to 25 return it too.
  - **Where it comes from:** `clients.name` through `missions.client_id`, a read-only join. That's how CR-W2 section 2.1 gives route 52 its `clientName`.
  - **Not nullable here:** `missions.client_id` and `clients.name` are both required (DATABASE.md, "Missions and money in" and "People and clients"). It's nullable on route 52 only because a factory PR has no mission.
  - **No schema change.**
- **`name`:** yes, but it's a schema change. DATABASE.md's `missions` has no name column, and I don't add one without a CR. I propose **CR-20, the mission name**, for INT:
  - **The column:** `missions.name`, text, required. Trimmed, 1 to 80 characters (a CHECK). Not unique.
  - **On `MissionDto`:** `name: string`. It's a real column, so it goes on the table DTO.
  - **Route 20:** `CreateMissionInput.name` is required.
  - **Editing it:** route 22 takes an optional `name`. Route 22's line in `API routes.md` ("Links a repo connection") gets "and renames the mission" added to it.
  - **The version:** a required input field is breaking (S1-2). The contract is still `0.0.0`, so if INT accepts CR-20 before the Step 1 slice ships, it goes into `1.0.0` and costs no major bump. The column goes into the migration of the step that builds route 20.
- **`slug`: not now.** The web's routes are keyed by `$missionId` (FM, Routes). No doc asks for a slug, and a column that has to be unique per client is a commitment with nothing using it yet. It can be raised again when a route takes a slug.

**Your stand-in is fine until then:** `{client name} · {package}`, with the fallbacks you list. Once CR-W5's `clientName` lands, you don't need the route 8 join. Once CR-20 lands, the label is `name`.
