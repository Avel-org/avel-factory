# Control Room against contract 1.0.0: what's still open

Nov 13, 2026 · from the alignment of the Control Room prototype with `@avel/contract` 1.0.0

The Control Room now reads only what contract 1.0.0 defines. The contract wins wherever it and the design disagreed. Where a screen still needs something the contract lacks, this list is the change request; nothing below is faked with a route of its own.

## Change requests for the backend

| # | What the screen needs | Why | Today |
| --- | --- | --- | --- |
| 1 | **Running rooms across missions** (Gap 4, still open): `GET /api/rooms?state=running` with slots | The Live rack and each agent's live status need every room at once | The rack is built from `factory.dispatch.changed` and `runner.attempt.*` |
| 2 | **A client's timeline** (CR-W23, new): route 93 `?clientId=`, or a client activity read | Route 93 takes no client, so nothing returns a client's history | The client page labels its timeline as sample data |
| 3 | **A plain title on findings**: `FindingDto.plain { title }` | `FindingDto` has no human line; the list needs one per row | The title comes from `evidence.summary` when present, else "Requirement finding on M3" |
| 4 | **Skill roles**: `PUT /api/skills/{id}/roles` | Attaching a skill to roles from the Library or the roster card | Skills are attached inside the roster draft sent with `PUT /api/roster` (route 48) |
| 5 | **The roster's inner shape** | The contract fixes only `{ version, roster }` | The prototype's teams, agents, work kinds and disputes are its own |
| 6 | **A layer filter on route 78** (Library CR 11) | Client knowledge is the Library filtered to `layer=client` | The page filters in the browser |
| 7 | **Library item content and roles** (Library CR 1, 5, 7, 8) | `SkillDto` returns a path and a hash, not the text, and no roles that load it | Sample content; skills now have per-version results (route 115) |
| 8 | **Template results** (Library CR 4, 6) | Built from it, first-try pass, time, AI against cap | Sample figures, as shares of the cap |
| 9 | **contract-mock's money labels** | The budget-raise fixture puts dollar amounts in its evidence and choice labels, against the no-money rule | The prototype's copy writes them as shares of the cap; the mock itself should change |
| 10 | **Evidence proofs**: what `detailRef` opens | `evidence[].detailRef` is a ref with no route to read it | A local fixture keyed by `detailRef` |
| 11 | **Suggested reasons** | Nothing in the contract suggests a reason | Removed; only OSA's `reasonDraft` (CR-29) offers one, behind its flag |
| 12 | **The dispatch package's evidence lines** | The `dispatch_package_commit` decision's evidence text isn't specified | Written to match the plain templates |
| 13 | **Package of a mission in its list row** shows as a label | `MissionListRowDto.package` is the enum value | Fine as is; noted so the label map stays in the web |
| 14 | **History on main and the agent trail** (CR-W24, new): a landing's `title`, `diff` and `by` on `IntegrationCommitDto`; every try on route 55; optional machine detail on `AgentStepDto` | The commit graph needs a human line and a diff stat per landing, and every module's tries in one read | The graph is worked out from route 55's `baseSha`/`commitSha` and route 108's attempts; titles and diff stats are sample data under `_cr` |
| 15 | **Canon's turn, step by step** (CR-W25, new): a `data-canon-step` part on route 34's stream, `steps` and `totalMs` on `MessageDto`, and optionally Canon's current step on `StatusDto` | The chat header, Canon's message and the phone dock show what Canon is doing while it's his turn | The mock sends the step parts itself; the text stream, first-word time and filing events are contract 1.0.0 |
| 16 | **Ask why only where it's needed** (CR-W26, new): `DecideProposalInput.reason` optional for the recommended choice, `reasonRequired` per choice, and a `REASON_REQUIRED` (422) error | Taking the agent's recommendation should be one tap; a reason is needed only when going against it, for a pass approval, and for checkpoint changes | The prototype follows the rule already; its "What this sends" omits the reason that 1.0.0 still requires |
| 17 | **The crew** (CR-W27, new): `GET /api/missions/{id}/crew` with who delegated to whom, `factory.crew.changed`; optional context use, agent-to-agent messages and tools; pause / resume / stop one attempt | Factory Live's Crew view and each project's Watch page show the whole team as a live tree | The lead is inferred from the roster; modules, builders, testers, reviewers, cost against the cap and the live line are contract 1.0.0 |
| 18 | **One tap when it's clean** (CR-W28, new): a `summary { clean, checks, review, openQuestions, modules, waves, tests }` on checkpoint decisions; `acceptedFindings` on the pass approval so the reason given when accepting a finding isn't asked again; a real `DoctorDto` | A clean checkpoint should approve in one tap with nothing to read; one accepted finding shouldn't need two reasons; "Run doctor" has nothing to show | The web computes the clean summary from the draft (0.2 only); the pass still asks for its reason, now on the Release page too; "Run doctor" is still a placeholder |

## CR-29 (OSA), proposed and behind a flag

Contract 1.1.0 doesn't exist yet. With the flag off nothing below is visible or called. With it on, the screens use these assumed names, listed in `contract/cr-29-assumed.json`:

- **Routes:** `assistant.writeBrief` (PUT `/api/decision-briefs/{ref}`), `assistant.createTask`, `assistant.listTasks`, `assistant.updateTask` (`/api/assistant/tasks`), and `operator.setFocus` / `operator.getFocus` (`/api/operator/focus`). CR-29 gives the methods and paths; the procedure names are the prototype's guesses.
- **Fields:** `PendingDecisionDto.brief`, `StatusDto.terminal`, `StatusDto.assistant { session, spendUsed, spendCap }` (the cap is CR-29's open decision 4; the web shows a percent only), `AssistantTaskDto`, `OperatorFocusDto`, and `ActivityLogActorKind` gaining `assistant`.
- **Events:** `cli.brief.prepared`, `cli.assistant_task.created`, `cli.assistant_task.changed`, `cli.focus.changed`, `cli.assistant.paused`.
- **Pause** uses route 5, `DELETE /api/cli/sessions/{sessionId}`, on the assistant's session; resuming needs a fresh `avel login --as assistant`.

## CR-34 (One upload inbox, rev 2), proposed

Designed in the prototype on sample data; nothing is called. The assumed names are in `contract/cr-34-assumed.json`:

- **Fields:** `StatusDto.inboxCount`; upload `state` and `scanStatus`; inbox items with a suggestion and a 14-day expiry; files with versions, links (waiting, active, refused, removed), readers and receipts; the module reading list in tokens; the package re-render; `Receipt.inputs`.
- **Errors:** `UPLOAD_LIMIT`, `UPLOAD_HASH_MISMATCH`, `UPLOAD_FLAGGED`.
- **Routes and events:** the revision doesn't name them yet. The screens need create (resumable), list inbox, file, discard, get file, new version, unlink and purge, and an event per upload state change so the tray and Drive stay live.

## Held

- **CR-28**, the learning layer: not drafted. Its place in the Factory nav group is reserved in the code, and nothing is built for it.

## How the rules are checked

- `npm run build` runs `tools/check-contract.mjs` first. The build fails on any route, procedure, query key or event that isn't in contract 1.0.0, or in the CR-29 list.
- `tests/e2e/audit-contract-rules.cjs`:
  - **No money:** no `$` in any page's text; no `$` with a number, or `USD`, anywhere in the sources or sample data.
  - **Untrusted text:** an HTML payload typed into OSA's task box, a lead's notes and a finding's reason renders as text, never as markup.
  - **All 10 kinds:** every decision kind renders from contract-mock's fixtures, including a returned one.
  - **No polling:** every timer is labelled as an on-screen clock or the mock replaying a stream, and the prototype makes no network calls.
  - **The check itself:** `check-contract` must fail on a made-up route and event.
