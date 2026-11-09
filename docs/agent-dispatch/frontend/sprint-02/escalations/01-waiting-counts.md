# Escalation 01: the waiting counts the shell shows have no total from the server

**Status: open.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. The shell uses a stand-in until it's answered.

## What's missing

The sidebar's Decisions badge, each project's badge and the phone tab's badge show how much is waiting (`shell-layout.md` section 4; Int's brief, "Waiting counts").
- **Route 52** returns pages, with no total.
- **Route 19's `MissionDto`** has no needs-you count.
- **FM** (Data layer, Contract change requests) names both as CR-W5: summary fields on the mission list, including a needs-you count, and `GET /api/status`.

## What I propose

- **A total of what's waiting,** for the operator, on CR-W5's `GET /api/status`.
- **A `needsYouCount` per mission,** in CR-W5's summary on route 19's rows.

## Until then

- **What's counted:** the rows route 52 has loaded, in total and by `missionId`, with `+` while `nextCursor` isn't null (AP §5's count rule).
- **Where it's past one page:** a badge reads, for example, `50+`.
