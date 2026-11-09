# Escalation 03: the missions list doesn't say which onboarding step a project is on

**Status: open.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. The shell leaves the step out until it's answered.

## What's missing

- **What the brief and DL draw:** a project in onboarding shows its step beside its name (DL: `N of 5`, from Canon's five steps).
- **What the web would need:** the step is on route 21 only (`MissionDetailDto.onboarding.session.stage`). The sidebar would have to load every project one by one, which FM's Performance budgets rule out ("never one request per mission").
- **Why the web can't map it:** turning `Stage` into a step number is display state, which FM says the server sends ("displayed, never computed").

## What I propose

Each route 19 row carries its onboarding step, in CR-W5's summary or CR-W9's `plain` block. For example, `onboarding: { step: 1..5, of: 5 } | null`, or a plain label.

## Until then

- The sidebar draws no step meta (S7).
