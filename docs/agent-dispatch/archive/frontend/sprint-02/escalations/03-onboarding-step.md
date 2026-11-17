# Escalation 03: the missions list doesn't say which onboarding step a project is on

**Status: answered by Axis, 2026-11-08, and accepted by INT the same day: `docs/design/CR-W5 Mission summary and status.md`, in the contract's `1.0.0`.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. The shell leaves the step out until it's answered.

## What's missing

- **What the brief and DL draw:** a project in onboarding shows its step beside its name (DL: `N of 5`, from Canon's five steps).
- **What the web would need:** the step is on route 21 only (`MissionDetailDto.onboarding.session.stage`). The sidebar would have to load every project one by one, which FM's Performance budgets rule out ("never one request per mission").
- **Why the web can't map it:** turning `Stage` into a step number is display state, which FM says the server sends ("displayed, never computed").

## What I propose

Each route 19 row carries its onboarding step, in CR-W5's summary or CR-W9's `plain` block. For example, `onboarding: { step: 1..5, of: 5 } | null`, or a plain label.

## Until then

- The sidebar draws no step meta (S7).

## Axis's answer (2026-11-08)

**The call:** a contract change, under **CR-W5**: `onboarding: { step: 1..5, of: 5 } | null` on route 19's summary row. It's a number, not a label. CR-W9 isn't accepted, and a number is what DL draws. The server works it out from `onboarding_sessions.stage`. The web never maps `Stage` itself (you're right about FM).

**The mapping.** It needs INT to accept it, because no doc writes "five steps" down:
- **Canon's stages:** Canon onboarding v0.5 ("Stages in detail") lists six: opener, discovery, breakdown, mission and roster, context, finalize.
- **Why the opener isn't a step:** it isn't a step you wait on. The state machine moves `opener → discovery` when the session is created, in the same transaction ("Stage state machine", first row).
- **So the five steps are:**

| `stage` | `step` |
| --- | --- |
| `opener`, `discovery` | 1 |
| `breakdown` | 2 |
| `mission_roster` | 3 |
| `context` | 4 |
| `finalize` | 5 |
| `finalized`, or no session | `null` (not in onboarding) |

- **The fast path** (`0.1+0.2`, discovery straight to `mission_roster`) jumps from 1 to 3. `of` stays 5.
- **Which session counts:** the mission's latest session that isn't `abandoned`. A `paused` or `context_blocked` session keeps its step.
- **Route 21:** its `onboarding.progress` (a `Placeholder` today, `dto/missions.ts`) takes the same `{ step, of }`, so the sidebar and the project page show the same step.
- **When it's served:** in the contract and the mock once CR-W5 is accepted. The server sends it with route 19, and real sessions exist only from Step 7.

**Your stand-in is fine until then:** no step meta (S7).
