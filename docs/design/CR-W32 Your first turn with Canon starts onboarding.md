# CR-W32: your first turn with Canon starts onboarding

Nov 21, 2026 · drafted by Zero · **accepted Nov 21** (Javaris, to OSA: "approve 1 to 3 with your recommendations", with the sprint 13/14 re-plan, #95). Axis signed the contract half on Nov 21, with four changes that are in this text (I3).

**What:** a mission leaves `draft` for `onboarding` when the operator sends Canon the mission's first turn (route 34). "Onboarding starts" means exactly two things: `missions.state` moves from `draft` to `onboarding`, and `onboarding_started_at` is set. Nothing else marks it. Route 34 is the only way out of `draft`. Answering Q-0.1a (route 44) on a draft mission sets the mission's kind and doesn't move its state.

The onboarding session already exists in `draft`. Route 20 creates it with its opener (message 0) and opens Q-0.1a (CR-W22; `questions.session_id` points at `onboarding_sessions`). In Canon onboarding v0.5's stage state machine, creating the session moves it from `opener` to `discovery`. The first turn doesn't create the session or change its stage. It doesn't touch any checkpoint either: 0.1, the Brief, is written at the end of Discovery, by Canon or route 39. If the journey shows 0.1 as current, that comes from the session's stage, not from an empty checkpoint row.

**The move:**
- It's conditional on `state = 'draft'`. It commits in the same transaction as the operator's message and the events, with `seq` taken last (AGENTS.md, Durable work).
- A second turn, or two first turns at once, never moves it twice. `CANON_BUSY` still covers a reply in flight.
- A first turn that fails before its commit leaves the mission in `draft`.

**Where route 34 is allowed:** in `draft` and `onboarding`. From `approved` onward it's refused with `MISSION_NOT_IN_SCOPING`: `approved`, `rendered`, `running`, `reviewing`, `deciding`, `awaiting_release`, `refreshing`, `delivering`, `delivered`, `closed` and `cancelled`.

**Why:** no doc says what starts onboarding.
- Route 20 creates a mission "as a draft with a name; Canon asks first whether it's a client project or a template" (CR-W22), and opens Q-0.1a.
- DATABASE.md's lifecycle rule only says `onboarding_started_at` is set "once onboarding starts (never in `draft`)".
- CR-W22 lets `kind` stay null until Q-0.1a is answered, as long as it's set "before the mission leaves onboarding". So onboarding can start before Q-0.1a is answered. The start isn't the Q-0.1a answer, and nothing else names it.
- contract-mock answers route 34 on a draft mission with `MISSION_NOT_IN_SCOPING`, and only its seed moves a mission into `onboarding` (T-F23 build a1's report, Limitations). So a project made through New project can never be onboarded, and the first mission stops at its first screen: New project (T-F17), then Onboarding (T-F18).
- The export already behaves this way: `logic.js`'s `startInterview` moves draft to onboarding on the first turn.

**Touches:**
- **The design:** this CR adds the rule beside DATABASE.md's lifecycle row for `missions`, and beside route 34 in `API routes.md`. The frozen docs aren't edited (E7); this CR overrides them (I1).
- **The contract (Axis's lane):** route 34's summary gains "on a draft mission, your first turn starts onboarding". It's a `fix(contract)` to 1.0.2 (the contract is at 1.0.1 since T-B6), with `openapi.json` regenerated, in backend T-B25 by a sprint-06 amendment after this CR is accepted, labelled `contract` with `cr = "CR-W32"` (I3). No schema or catalog change.
- **contract-mock:** T-F24 (frontend sprint-13) builds it. Route 34's first turn on a draft moves the mission to `onboarding` and sets `onboardingStartedAt` in the same call. On route 63 it emits `missions.mission.changed` and the turn's `onboarding.message.created`, and nothing for checkpoints.
- **The server:** the Canon module, in whichever step builds route 34, under "The move" above.
- **The web:** T-F18 (frontend sprint-14). Onboarding on a fresh draft is its "empty (a fresh draft)" state, and sending the first message starts the interview.

**Not changed:** Q-0.1a still opens on route 20 and stays answerable on route 44 in `draft` or `onboarding`. `kind` still has to be set before the mission leaves onboarding, and it still freezes at plan approval (CR-W22).

**Decided:** accepted as written. The alternative, that answering Q-0.1a starts onboarding, was declined: it would make the operator choose a kind before Canon has said anything, and it doesn't match the export.
