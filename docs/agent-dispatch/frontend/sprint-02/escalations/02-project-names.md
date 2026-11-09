# Escalation 02: missions have no name, so the sidebar can't name a project

**Status: open.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. The shell uses a stand-in until it's answered.

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
