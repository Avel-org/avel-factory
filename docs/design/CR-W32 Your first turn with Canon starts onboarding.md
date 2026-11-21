# CR-W32: your first turn with Canon starts onboarding

Nov 21, 2026 · drafted by Zero · **proposed** (Javaris accepts; Axis's lane signs the contract half, I3)

**What:** a mission leaves `draft` for `onboarding` when the operator sends Canon the mission's first turn (route 34). That turn sets `onboarding_started_at` and drafts checkpoint 0.1. Until then, route 34 is the only way out of `draft`. Answering Q-0.1a (route 44) on a draft mission sets the mission's kind and doesn't move its state.

**Why:** no doc says what starts onboarding.
- Route 20 creates a mission "as a draft with a name; Canon asks first whether it's a client project or a template" (CR-W22), and opens Q-0.1a.
- DATABASE.md's lifecycle rule only says `onboarding_started_at` is set "once onboarding starts (never in `draft`)".
- CR-W22 lets `kind` stay null until Q-0.1a is answered, as long as it's set "before the mission leaves onboarding". So onboarding can start before Q-0.1a is answered. The start isn't the Q-0.1a answer, and nothing else names it.
- contract-mock answers route 34 on a draft mission with `MISSION_NOT_IN_SCOPING`, and only its seed moves a mission into `onboarding` (T-F23 build a1's report, Limitations). So a project made through New project can never be onboarded, and the first mission stops at its first screen: New project (T-F17), then Onboarding (T-F18).
- The export already behaves this way: `logic.js`'s `startInterview` moves draft to onboarding on the first turn.

**Touches:**
- **The design:** this CR adds the rule beside DATABASE.md's lifecycle row for `missions`, and beside route 34 in `API routes.md`. The frozen docs aren't edited (E7); this CR overrides them (I1).
- **The contract (Axis's lane):** route 34's summary gains "on a draft mission, your first turn starts onboarding". `MISSION_NOT_IN_SCOPING` then covers only states after onboarding. No schema or catalog change.
- **contract-mock:** T-F24 (frontend sprint-13) builds it. Route 34's first turn on a draft moves the mission to `onboarding` in the same call, emits `missions.mission.changed` and `onboarding.checkpoint.changed` on route 63, and drafts checkpoint 0.1 (the world's `startOnboarding`, today seed-only).
- **The server:** the Canon module, in whichever step builds route 34. One transaction holds the state move, `onboarding_started_at`, checkpoint 0.1's draft and their events (AGENTS.md, Durable work).
- **The web:** T-F18 (frontend sprint-14). Onboarding on a fresh draft is its "empty (a fresh draft)" state, and sending the first message starts the interview.

**Not changed:** Q-0.1a still opens on route 20 and stays answerable on route 44 in `draft` or `onboarding`. `kind` still has to be set before the mission leaves onboarding, and it still freezes at plan approval (CR-W22).

**Decision asked:** accept CR-W32 as written. The alternative is that answering Q-0.1a starts onboarding. That would make the operator choose a kind before Canon has said anything, and it doesn't match the export.
