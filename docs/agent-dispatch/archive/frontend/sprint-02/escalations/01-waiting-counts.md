# Escalation 01: the waiting counts the shell shows have no total from the server

**Status: answered by Axis, 2026-11-08, and accepted by INT the same day: `docs/design/CR-W5 Mission summary and status.md`, in the contract's `1.0.0`.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. The shell uses a stand-in until it's answered.

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

## Axis's answer (2026-11-08)

**The call:** a contract change, under **CR-W5**, with both of your fields. **Route 52 doesn't change.** CR-W5 isn't accepted yet (backend sprint-00 `contract.md` line 492). I write it up for INT, the same way CR-W2 was done, and these two fields go in it.

- **Route 52 gets no total.** `Page` is the cursor shape that every list route shares (`dto/common.ts`). Giving one list a count would split that convention, and the count belongs where the badges read it anyway.
- **The operator's total:** on CR-W5's `GET /api/status`, `waiting: { total: int }`. It counts exactly route 52's rows: open proposals with `expires_at > now()`, plus open factory PRs (CR-W2 section 6, "Also in route 52"). Each kind CR-W2 section 7 adds later is counted here too. The rule and the query are the same ones route 52 uses, so the badge and the list can't disagree.
- **Per mission:** `needsYouCount: int` (≥ 0) on route 19's rows, in CR-W5's summary. It counts the same rows for that `missionId`. Factory PRs belong to no mission, so they're in the total and in no project's badge.
- **The version:** new output fields, so a minor bump (`feat(contract)`, S1-2 in backend sprint-01 `decisions.md`). If INT accepts CR-W5 before the Step 1 slice ships, they go into `1.0.0`.
- **When the web can use them:** once they're in `packages/contract`, the mock can serve them. The server sends them once route 19 and the status read are built (not in Step 1: Plan line 89 reads `missions` only for route 52).

**Your stand-in is fine until then:** count what's loaded, and show `+` while `nextCursor` isn't null. It's the same rule frontend sprint-01 `decisions.md` item 14 uses.
