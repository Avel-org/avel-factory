# Screens

Every screen in the prototype, generated from the page registry in `src/app/logic.js` (`PAGES`) by `tools/make-screens.mjs`. Routes are TanStack Router paths. "Reads and writes" name contract 1.0.0 routes by number. "Open" lists what the contract still lacks, each with its change request (see `cr-list-1-0-0.md`). Nothing polls except the stall check (`StatusDto.stallAfterMs`). Every screen also has the shared states: loading, error, offline and not found.

## Decisions

| | |
| --- | --- |
| Route | `/` |
| What it's for | Everything waiting on you, with what approving does and what it costs. |
| Notes | Home. Server-rendered, under 150 KB of JavaScript, content on screen in 1.5 s on a mid-range phone. |
| Reads and writes | GET /api/pending-decisions (route 52): the 10-kind PendingDecisionDto union<br>GET /api/status (route 104): the waiting total, alerts and stallAfterMs<br>Each card approves through approveCallFor(item, tap): decisions.decide, factory.mergeChange, gate0.approveCheckpoint, missions.finalize, gate0.answerQuestion, missions.approvePass, missions.release, dispatchPackage.commit, followups.send<br>GET /api/proposals/{proposalId} (route 53) for a proposal's full view |
| Stays live with | <owner>.decision.opened, resolved, expired and returned on the global stream<br>A newer event for the same item than its asOfSeq marks the card stale; it refetches before you can decide<br>The stall check: no event for stallAfterMs (600000) flags the stream as stalled. The only timer on this page |
| States | Loading, clear (“Nothing needs you”), error, ready, deciding, decided with a 6 s Undo, came back (previous and plain.returned), stale (409 STALE_VERSION: review the current item first), expired, decided elsewhere. |
| Built in 1.0.0 | **CR-W2**: Route 52 returns the 10-kind PendingDecisionDto union; approveCallFor builds each approve call.<br>**CR-W15**: previous and plain.returned on a decision that came back; <owner>.decision.returned.<br>**CR-W5**: Route 104, GET /api/status: slots, needsYouCount, alerts, stallAfterMs and lastSeq.<br>**CR-27**: <owner>.decision.opened, resolved, expired and returned for the 10 decision owners.<br>**CR-29**: OSA, the operator agent: decision briefs, Ask OSA tasks, shared focus and the terminal-attached view. Contract 1.1.0 doesn’t exist yet; the assumed routes, fields and events are in contract/cr-29-assumed.json. |
| Empty state | **When a project needs you.** Each decision lands here with its evidence, what approving and rejecting will do, the cost impact and when it expires. |
| On a phone | Must be fast and one-handed: the next decision first, approve in one tap, Undo for 6 s. |
| Prototype source | `src/pages/decisions/DecisionsPage.jsx` |

## All projects

| | |
| --- | --- |
| Route | `/missions?kind=&clientId=` |
| What it's for | Every project with its client, state, deadline and gates. |
| Reads and writes | GET /api/missions?kind=&clientId=&limit=&cursor= (route 19): MissionListRowDto rows |
| Stays live with | missions.mission.created, missions.mission.changed, missions.mission.kind_set and missions.mission.closed |
| States | Loading, empty, filtered-empty, error, ready. |
| Built in 1.0.0 | **CR-20**: Mission name on every row, the breadcrumb and the title; routes 19, 21 and 52.<br>**CR-W5**: Route 19 returns MissionListRowDto: name, client, gate strip with counts, modules, deadline, plain.<br>**CR-W18**: Gate strip with runs and counts (gates 2 and 3 run per job).<br>**CR-W22**: Mission kind: client, internal or template, null until Canon’s Q-0.1a is answered and frozen once the plan is approved. Route 19 filters ?kind=client\\|internal\\|template\\|unset. |
| Empty state | **No projects yet.** Pick a client and name the project. Canon starts the interview from there. |
| Prototype source | `src/pages/operations/OpsPages.jsx (Projects)` |

## New project

| | |
| --- | --- |
| Route | `/missions/new?client=` |
| What it's for | Name the project and start Canon. Client project or internal template is Canon’s first question. |
| Reads and writes | POST /api/missions (route 20) with {name, clientId?}; no kind: Canon’s first question decides it |
| Stays live with | Nothing to keep fresh: a form. |
| States | Form, from a client or lead page (that client carried over), saving, error. |
| Built in 1.0.0 | **CR-20**: POST /api/missions takes {name, clientId?}.<br>**CR-W22**: Mission kind: client, internal or template, null until Canon’s Q-0.1a is answered and frozen once the plan is approved. Route 19 filters ?kind=client\\|internal\\|template\\|unset. |
| Prototype source | `src/pages/project/NewProjectPage.jsx` |

## Onboarding

| | |
| --- | --- |
| Route | `/missions/$id/onboarding` |
| What it's for | Four checkpoints with Canon, then the plan. You approve each one. |
| Notes | Focus mode: the sidebar steps away and the menu button brings it back as a sheet. Canon's dock: the question deck, the relay line and hold to relay (CR-W19). |
| Reads and writes | missions.postMessage (route 34): Canon’s reply streams back as CanonStreamChunk, rendered as plain text as it arrives<br>missions.resumeMessage (route 105) and missions.listMessages (route 33)<br>gate0.answerQuestion (route 44) {questionId, rowVersion, choice, answer}: an option, or other in your own words<br>missions.transcribe (route 106): the recorded clip in, its transcript streamed back for review<br>GET /api/missions/{missionId} (route 21) for the onboarding journey and checkpoints; the gate0 upload and checkpoint routes |
| Stays live with | onboarding.fact.proposed and onboarding.message.updated on the mission stream<br>onboarding.checkpoint.changed and onboarding.question.changed<br>onboarding.decision.* for questions answered in Decisions<br>missions.mission.kind_set once Q-0.1a is answered |
| States | Interviewing, Canon writing (Stop), drafting, waiting on you, context blocked, paused, finalized. |
| Built in 1.0.0 | **CR-20**: Mission name on every row, the breadcrumb and the title; routes 19, 21 and 52.<br>**CR-W18**: MissionDetailDto.onboarding, the Gate 0 journey behind “Step N of 5”.<br>**CR-27**: onboarding.checkpoint.changed, onboarding.fact.proposed and onboarding.question.changed.<br>**CR-W18**: Checkpoint sections of FactLineDto, the onboarding journey and rubric suggestions.<br>**CR-W19**: Route 34 streams Canon’s reply as CanonStreamChunk; route 105 resumes it; route 44 takes choice and answer.<br>**CR-W22**: Mission kind: client, internal or template, null until Canon’s Q-0.1a is answered and frozen once the plan is approved. Route 19 filters ?kind=client\\|internal\\|template\\|unset. |
| Empty state | **Canon hasn’t started.** Canon asks first whether it’s a client project or an internal template, then about the work and its limits, and drafts each checkpoint for you to approve. You can add files at any point. |

## Progress

| | |
| --- | --- |
| Route | `/missions/$id` |
| What it's for | Every module with its state, retry step and rounds, and what has shipped. |
| Reads and writes | GET /api/missions/{missionId} (route 21)<br>GET /api/missions/{missionId}/modules/{moduleRef} (route 108) for a module row |
| Stays live with | factory.module.changed, factory.dispatch.changed, runner.attempt.started and runner.attempt.ended<br>gate.receipt.issued and delivery.delivery.changed |
| States | Building, waiting on you, released, closed. |
| Built in 1.0.0 | **CR-20**: Mission name on every row, the breadcrumb and the title; routes 19, 21 and 52.<br>**CR-W18**: Gate strip with runs and counts (gates 2 and 3 run per job).<br>**CR-W21**: Route 108 returns one module run (ladder, cost against its cap, attempts, findings); route 109 and the trace stream give its agent steps.<br>**CR-27**: gate.pass.approved and delivery.delivery.changed. |
| Empty state | **No modules yet.** The plan splits the work into modules. They show here, with their gates and retry step, once the plan is approved. |

## Watch the work

| | |
| --- | --- |
| Route | `/missions/$id/live` |
| What it's for | Up to 6 rooms at once, each held to its attempt cap and 60 minutes an attempt. |
| Reads and writes | GET /api/missions/{missionId}/dispatches (route 49)<br>GET /api/events/stream?missionId= (route 63)<br>GET /api/traces/stream?attemptId=&view=steps (route 64), one per open terminal |
| Stays live with | factory.dispatch.changed, runner.attempt.started and runner.attempt.ended<br>The trace stream (view=steps), at 60 fps with 6 rooms. |
| States | Idle, running, parked. Hidden while a terminal is attached (CR-29), since the terminal shows the live flow. |
| Built in 1.0.0 | **CR-29**: OSA, the operator agent: decision briefs, Ask OSA tasks, shared focus and the terminal-attached view. Contract 1.1.0 doesn’t exist yet; the assumed routes, fields and events are in contract/cr-29-assumed.json. |
| Open | **Gap 4**: Running rooms across missions, with slots (GET /api/rooms?state=running, proposed). Until it lands the rack is built from factory.dispatch.changed and runner.attempt.* events. |
| Empty state | **No rooms running.** A room opens when a module starts: test writers first, then the builder, then reviewers. |
| Prototype source | `src/pages/live/FactoryLivePage.jsx (one project)` |

## Release

| | |
| --- | --- |
| Route | `/missions/$id/release` |
| What it's for | The verdict, the commit and receipt hash, and proof for each acceptance example. |
| Notes | Phone-first. Server-rendered, under 150 KB of JavaScript. |
| Reads and writes | GET /api/missions/{missionId} (route 21)<br>GET /api/receipts/{receiptId}?verify= (route 61)<br>POST /api/missions/{missionId}/pass-approvals (route 29) {receiptHash, reason}<br>POST /api/missions/{missionId}/releases (route 30) {receiptHash, passApprovalId for a pass}: only the commit the receipt names |
| Stays live with | gate.receipt.issued, gate.pass.approved and delivery.delivery.changed |
| States | No receipt yet, verified, pass (needs a pass approval), fail, releasing, released. |
| Built in 1.0.0 | **CR-27**: gate.pass.approved and delivery.delivery.changed.<br>**CR-W21**: Receipt proof artifacts and digests (route 107), ?verify=1, and receiptDigestInput for the check on your device. |
| Empty state | **No receipt yet.** Gate 5 issues a hashed receipt when every module has landed. Verified ships after your release approval. Pass needs a pass approval first. Fail can’t ship. |
| On a phone | Phone first: the receipt card, Check the proof, then release. |
| Prototype source | `src/pages/operations/OpsPages.jsx (Release)` |

## Receipt

| | |
| --- | --- |
| Route | `/missions/$id/receipt` |
| What it's for | What ships, what proves it, and a check you run yourself. |
| Notes | Phone-first. The proof check recomputes every digest on the device with WebCrypto, from receiptDigestInput. |
| Reads and writes | GET /api/receipts/{receiptId}?verify= (route 61)<br>GET /api/receipts/{receiptId}/artifacts/{key} (route 107) |
| Stays live with | gate.receipt.issued and gate.pass.approved |
| States | No receipt, pass, verified, checking, checked, check failed, superseded (RECEIPT_SUPERSEDED). |
| Built in 1.0.0 | **CR-W21**: Receipt proof artifacts and digests (route 107), ?verify=1, and receiptDigestInput for the check on your device. |
| Empty state | **No receipt yet.** Gate 5 issues the receipt when every module has landed. |
| On a phone | The check panel comes first, then the receipt, then the proof files as a swipeable row. |
| Prototype source | `src/pages/operations/ReceiptPage.jsx · src/kit/sha256.js` |

## Module

| | |
| --- | --- |
| Route | `/missions/$id/modules/$ref` |
| What it's for | One module: its runs, the agents working on it right now, its checks and its cost against the cap. |
| Notes | Live: runner.attempt.* and factory.module.changed from the event stream; agent steps from the trace stream with view=steps. |
| Reads and writes | GET /api/missions/{missionId}/modules/{moduleRef} (route 108): ModuleRunViewDto<br>GET /api/attempts/{attemptId}/steps?after= (route 109) to backfill<br>GET /api/traces/stream?attemptId=&view=steps (route 64) for the live feed<br>GET /api/integration-commits/{integrationCommitId} (route 56) for a landing |
| Stays live with | runner.attempt.started and runner.attempt.ended<br>factory.module.changed<br>integrator.commit.changed |
| States | Waiting, running, retrying, parked, landed. |
| Built in 1.0.0 | **CR-W21**: Route 108 returns one module run (ladder, cost against its cap, attempts, findings); route 109 and the trace stream give its agent steps. |
| Empty state | **No such module.** This project's plan has no module with that name. |
| On a phone | Ladder hides its hints; the live feed and attempts stack. |
| Prototype source | `src/pages/operations/ModulePage.jsx` |

## Dispatch

| | |
| --- | --- |
| Route | `/missions/$id/dispatch` |
| What it's for | DISPATCH.md, task docs, completion reports and the package. |
| Reads and writes | GET /api/missions/{missionId}/dispatch-package (route 100), its files (101) and archive (102)<br>POST /api/missions/{missionId}/dispatch-package/commits (route 114) {packageHash}: confirm the commit<br>GET /api/missions/{missionId}/dispatches (route 49) |
| Stays live with | factory.task_doc.rendered, factory.dispatch_package.rendered and integrator.dispatch_package.committed |
| States | Not rendered, rendered, waiting for your confirmation, committing, committed, out of date (409 STALE_VERSION on packageHash), archive building (ARCHIVE_BUILDING). |
| Built in 1.0.0 | **CR-W11**: Route 114 confirms the package commit, bound to packageHash. |
| Empty state | **Not rendered yet.** The dispatch package renders once the plan is approved, and shows as out of date when the plan changes. |
| Prototype source | `src/pages/operations/OpsPages.jsx (Dispatch)` |

## Plan

| | |
| --- | --- |
| Route | `/missions/$id/plan?version=` |
| What it's for | Modules, EARS requirements, given/when/then scenarios and quality targets. |
| Reads and writes | GET /api/missions/{missionId}/plan?version= (route 46) |
| Stays live with | None needed: a plan version never changes, so it is cached forever. |
| States | No plan yet, approved, superseded. |
| Empty state | **No plan yet.** Canon drafts the plan after checkpoint 0.4. Every approved version is kept, and a newer one supersedes it. |
| Prototype source | `src/pages/operations/OpsPages.jsx (Plan)` |

## Gates and integration

| | |
| --- | --- |
| Route | `/missions/$id/gates` |
| What it's for | Gate results for each commit, and the lane where work lands one commit at a time. |
| Reads and writes | GET /api/missions/{missionId}/gates (route 55)<br>GET /api/integration-commits/{integrationCommitId} (route 56) |
| Stays live with | gate.evaluation.recorded and integrator.commit.changed |
| States | None yet, testing, landed, rejected. |
| Built in 1.0.0 | **CR-W18**: Gate strip with runs and counts (gates 2 and 3 run per job).<br>**CR-27**: gate.evaluation.recorded and integrator.commit.changed. |
| Empty state | **No gate results yet.** Results appear when a module’s first commit is tested. The lane shows each commit as queued, testing, landed or rejected. |
| Prototype source | `src/pages/operations/OpsPages.jsx (Gates)` |

## Findings

| | |
| --- | --- |
| Route | `/missions/$id/findings?state=&route=&moduleRunId=` |
| What it's for | What reviewers and gates reported. Confirm, dismiss or accept each, with a reason. |
| Reads and writes | GET /api/missions/{missionId}/findings?state=&route=&moduleRunId= (route 58)<br>PATCH /api/findings/{findingId} (route 59): confirm or dismiss, with a reason<br>POST /api/findings/{findingId}/acceptances (route 60): accept, with a reason; caps the verdict at pass |
| Stays live with | gate.finding.created and gate.finding.changed |
| States | Empty, open, triage. |
| Built in 1.0.0 | **CR-27**: gate.finding.created and gate.finding.changed. |
| Empty state | **No findings.** Nothing has been reported for this project. |
| Prototype source | `src/pages/operations/OpsPages.jsx (Findings)` |

## Live

| | |
| --- | --- |
| Route | `/live` |
| What it's for | Every running room across projects, and the event river. |
| Reads and writes | GET /api/events/stream (route 63)<br>GET /api/status (route 104) for the slots<br>GET /api/traces/stream?attemptId=&view=steps (route 64), one per open terminal |
| Stays live with | factory.dispatch.changed, runner.attempt.started and runner.attempt.ended<br>system.alert.raised and system.alert.cleared |
| States | Quiet, running, full (6 of 6). Hidden while a terminal is attached (CR-29). |
| Built in 1.0.0 | **CR-29**: OSA, the operator agent: decision briefs, Ask OSA tasks, shared focus and the terminal-attached view. Contract 1.1.0 doesn’t exist yet; the assumed routes, fields and events are in contract/cr-29-assumed.json. |
| Open | **Gap 4**: Running rooms across missions, with slots (GET /api/rooms?state=running, proposed). Until it lands the rack is built from factory.dispatch.changed and runner.attempt.* events. |
| Empty state | **Quiet.** Nothing is running. Rooms fill these slots as modules start, across every project. |
| Prototype source | `src/pages/live/FactoryLivePage.jsx` |

## Clients

| | |
| --- | --- |
| Route | `/clients, /clients/$id` |
| What it's for | Everyone you work with or might: active clients, leads, past and lost. |
| Reads and writes | GET /api/clients (route 8); AVEL itself only with ?kind=internal<br>GET /api/clients/{clientId} (route 10), POST /api/clients (route 9)<br>PATCH /api/clients/{clientId} (route 11) {proofConsent}<br>GET /api/pipeline (route 122), GET /api/leads?stage= (route 117), POST /api/leads (route 118), POST /api/leads/{leadId}/closures (route 119)<br>GET /api/followups/{followupId} (route 120), POST /api/followups/{followupId}/sends (route 121) {draftHash, outcome}<br>GET /api/missions?kind=internal (route 19) for AVEL’s own projects<br>Repo connections: list, create, update, revoke, verify, rotate (routes 12 to 17) |
| Stays live with | pipeline.lead.created, pipeline.lead.closed and pipeline.followup.sent<br>pipeline.decision.* for follow-ups and upkeep offers |
| States | Empty, ready, needs step-up (create, update and rotate a repo connection only), unsubscribed (CONTACT_UNSUBSCRIBED). |
| Built in 1.0.0 | **CR-W17**: Leads, follow-ups and upkeep offers: routes 117 to 122; pipeline.* events. |
| Open | **CR-W23**: A client's timeline: route 93 (GET /api/activity) takes no clientId, so nothing reads a client's history yet. Shown from sample data until CR-W23 lands. |
| Empty state | **No clients yet.** Add a client here, or while starting a new project. |
| Prototype source | `src/pages/operations/OpsPages.jsx (Clients, Client)` |

## Client knowledge

| | |
| --- | --- |
| Route | `/library/knowledge?layer=client` |
| What it's for | The Library filtered to each client’s own knowledge: language, rules, journeys and risks. |
| Reads and writes | GET /api/library/kb-entries?cursor=&limit= (route 78), filtered to the client layer in the browser<br>POST /api/library/kb-entries (route 79), GET and PATCH /api/library/kb-entries/{itemId} (routes 80, 81) |
| Stays live with | knowledge.change.opened, knowledge.change.updated and knowledge.change.closed |
| States | Empty, proposed, approved. |
| Open | **Library CR 11**: A layer filter on route 78; until it lands the page filters in the browser. |
| Empty state | **No client knowledge yet.** Canon proposes entries during onboarding. Once approved, every project for that client uses them. |
| Prototype source | `src/pages/library/LibraryPage.jsx` |

## Library

| | |
| --- | --- |
| Route | `/library, /library/all, /library/c/$category, /library/$kind/$itemId` |
| What it's for | The knowledge base the agents learn from: knowledge, skills and rules. Every change is a factory PR you approve. |
| Reads and writes | GET /api/library/skills, /api/library/kb-entries and /api/library/rules (routes 74, 78, 82), merged in the browser until a search across kinds exists<br>GET and PATCH /api/library/skills/{itemId}, /api/library/kb-entries/{itemId}, /api/library/rules/{itemId}<br>GET /api/library/skills/{itemId}/results (route 115) and GET /api/eval/runs/{runId} (route 116)<br>GET /api/missions/{missionId}/closeout-items (route 91) |
| Stays live with | knowledge.change.opened, knowledge.change.updated, knowledge.change.closed and knowledge.release.cut<br>evals.run.started and evals.run.finished |
| States | Empty, ready, nothing matches, proposed, PR open, retired. |
| Built in 1.0.0 | **CR-W16**: Route 115 results per version with a baseline, route 116 the eval run, and evalRun on a factory change. |
| Open | **Library CR 1**: Read an item's content: the get routes return only a path and a hash.<br>**Library CR 5, 7, 8**: Usage per entry, the roles that load it, and version history.<br>**Library CR 2**: A template field on knowledge entries.<br>**Library CR 11**: One search across kinds with facet counts (kind, type, layer, stack, role, status) and sort. |
| Empty state | **The library is empty.** Knowledge, skills and rules land here once their factory PRs merge. Closeout and retries suggest the first entries. |
| Prototype source | `src/pages/library/LibraryPage.jsx · src/kit/Markdown.jsx, Code.jsx` |

## Templates

| | |
| --- | --- |
| Route | `/templates` |
| What it's for | Where projects start. Each template comes from an internal project delivered with a verified receipt. |
| Reads and writes | GET /api/library/templates (route 86)<br>GET /api/missions?kind=template (route 19): template builds, delivered ones ready to publish |
| Stays live with | knowledge.change.opened and knowledge.change.closed for template PRs<br>missions.mission.changed |
| States | Empty, ready, ready to become a template, draft in PR. |
| Open | **Library CR 4, 6**: A template's plan, rules, skills and guide entry, and results from the projects built with it.<br>**Portfolio**: Screenshots captured at the pinned commit; until then the cards draw a preview. |
| Empty state | **No templates yet.** Deliver an internal project with a verified receipt, then make a template from it. |
| Prototype source | `src/pages/templates/TemplatesGalleryPage.jsx` |

## Template

| | |
| --- | --- |
| Route | `/templates/$itemId` |
| Reads and writes | GET /api/library/templates/{itemId} (route 88): TemplateViewDto with docs<br>PATCH /api/library/templates/{itemId} (route 89) |
| Stays live with | knowledge.change.opened and knowledge.change.closed |
| States | Ready, draft in PR, retired. |
| Built in 1.0.0 | **CR-W20**: TemplateViewDto.docs on route 88. |
| Open | **Library CR 6**: Built from it, first-try pass, cost against cap and time. |
| Empty state | **Template not found.** It may have been retired. Go back to Templates. |
| Prototype source | `src/pages/templates/TemplatePage.jsx` |

## New template

| | |
| --- | --- |
| Route | `/templates/new?from=$missionId` |
| Reads and writes | GET /api/library/templates/sources/{missionId} (route 110): a delivered template build to cut it from<br>GET and PUT /api/library/template-drafts/{draftId} (routes 111, 112), each save bound to the rowVersion from the last one<br>POST /api/library/template-drafts/{draftId}/pull-requests (route 113): checks the draft and opens its factory PR; returns {prNumber, decisionRef} |
| Stays live with | Your own saves (a second tab gets 409 STALE_VERSION instead of losing text). |
| States | Writing, saved, ready to open, PR open, docs invalid (TEMPLATE_DOCS_INVALID), slug taken (TEMPLATE_SLUG_TAKEN), not shipped (SOURCE_NOT_SHIPPED), not verified (TEMPLATE_SOURCE_NOT_VERIFIED). |
| Built in 1.0.0 | **CR-W21**: Template drafts: routes 110 to 113, saved against rowVersion.<br>**CR-W20**: TemplateViewDto.docs on route 88. |
| Empty state | **Nothing to make a template from.** Templates come from projects delivered with a verified receipt. |
| On a phone | Write and Preview are tabs. |
| Prototype source | `src/pages/templates/TemplateNewPage.jsx` |

## Factory versions

| | |
| --- | --- |
| Route | `/factory` |
| What it's for | Factory commits, the projects on each, and open factory PRs. |
| Reads and writes | GET /api/factory/versions (route 71)<br>GET /api/factory/changes (route 72)<br>POST /api/factory/changes/{changeId}/merges (route 73) {headSha} |
| Stays live with | knowledge.change.opened, knowledge.change.updated and knowledge.change.closed<br>knowledge.decision.* |
| States | None open, open changes. |
| Empty state | **No open changes.** Changes to the library, the roster or client knowledge open a factory PR here. |

## Agents

| | |
| --- | --- |
| Route | `/roster` |
| What it's for | Who builds, who checks and who leads |
| Reads and writes | GET /api/roster (route 47)<br>PUT /api/roster (route 48): the whole roster as a new version, filed as a factory PR |
| Stays live with | roster.decision.* for the roster PR |
| States | Loading, ready, editing, rule broken, filing, PR open, stale (409), error. |
| Open | **Roster CR**: The roster’s inner shape (teams, agents, workKinds, roles, disputes). The contract only fixes { version, roster }.<br>**Gap 4**: Each agent’s live status, from running rooms.<br>**Roster CR**: Attaching a skill to roles. The old avel-web route isn’t in the contract, so skills attach inside the roster draft sent with PUT /api/roster. |
| Empty state | **No roster saved.** Until a roster is saved, every role runs on the factory defaults. |
| Prototype source | `src/pages/roster/AgentRosterPage.jsx` |

## Activity

| | |
| --- | --- |
| Route | `/activity` |
| What it's for | Who did what, to what, and why. Overrides included. |
| Reads and writes | GET /api/activity?cursor=&limit= (route 93) |
| Stays live with | Refetched when opened. |
| States | Empty, ready. Actors: you, an agent, the system, and OSA (assistant, CR-29). |
| Built in 1.0.0 | **CR-29**: OSA, the operator agent: decision briefs, Ask OSA tasks, shared focus and the terminal-attached view. Contract 1.1.0 doesn’t exist yet; the assumed routes, fields and events are in contract/cr-29-assumed.json. |
| Empty state | **No activity yet.** Every approval, override and change is recorded here with its reason. |

## Settings

| | |
| --- | --- |
| Route | `/settings` |
| What it's for | Display, CLI sessions and health checks. |
| Reads and writes | GET /api/cli/sessions (route 4), DELETE /api/cli/sessions/{sessionId} (route 5)<br>GET /api/health (route 6), GET /api/doctor (route 7)<br>OSA, behind the flag: the assistant session, pause (revokes it) and spend against its cap (CR-29) |
| Stays live with | Refetched when opened.<br>cli.assistant.paused (CR-29) |
| States | Ready, a check failing. |
| Built in 1.0.0 | **CR-29**: OSA, the operator agent: decision briefs, Ask OSA tasks, shared focus and the terminal-attached view. Contract 1.1.0 doesn’t exist yet; the assumed routes, fields and events are in contract/cr-29-assumed.json. |
| Prototype source | `src/pages/settings/SettingsPage.jsx` |

## Not found

| | |
| --- | --- |
| Route | `—` |
| States | 404. |
| Prototype source | `src/pages/GenericPage.jsx` |
