# API routes: the 119 operations of contract 1.0.0

Nov 12, 2026 · updated for @javaris

**What this is:** every route in the contract, numbered. The numbers are the ones the other docs cite (route 19 is the missions list, route 52 the pending decisions), so they never change; new routes get the next number.

**Checked against the contract on Nov 12 (contract 1.0.0):** this table and `docs/generated/openapi.json` list the same 119 operations, method for method and path for path: the 99 below less routes 69 and 70, CR-16's 3 (100 to 102), and the web's CRs' 19 (104 to 122). Number 103 stays reserved for CR-W2's single factory-change read. A CI check should compare them on every PR, the way the ERD is checked, so this doc can't drift.

**What changed on Nov 12 (Contract response to CR-W1 to W22):**
- **Withdrawn with Business (CR-W20 section 3):** routes 69 (`GET /api/metrics`) and 70 (`POST /api/payments`). Their numbers aren't reused.
- **19 routes added,** numbered 104 to 122: see [Added in contract 1.0.0](#added-in-contract-100).
- **Changed shapes:** route 19 returns `MissionListRowDto`; route 20 takes a name and an optional client; route 21 returns gates with counts, the onboarding journey and typed deliveries; route 33 returns `CanonMessageDto`; route 34 streams Canon's reply (an event iterator); route 44 takes `choice` (an option or `other`, with `answer`); route 52 returns the pending-decisions union of ten kinds; routes 53 and 54 return `ProposalViewDto`; route 61 adds proof files, the signature and `verified { signature, checkedAt }`; route 64 takes `view=steps`; route 88 returns `TemplateViewDto` with `docs`.

**What changed on Nov 9:**
- **CR-16's three dispatch-package routes are in the contract,** numbered 100 to 102 (CR-16 was accepted Nov 6; the project's docs index still lists it as proposed).
- **Accepted but not in the contract yet:** CR-20 (the mission name), CR-W5 (the mission list's summary and `GET /api/status`) and CR-W2 (the pending-decision row). All built in 1.0.0: see [Accepted, now built](#accepted-now-built).
- **Proposed, not counted:** CR-17 (agent access, Nov 4), the routes CR-25 would add, and two gaps found while mapping the shell's pages. See [Proposed, not counted](#proposed-not-counted).

**Corrections from the API reference (its review questions), still in force:**
- **Q4:** the version you approve travels in the request body (`rowVersion`, `version`, `receiptHash`, `headSha`), not in `If-Match`.
- **Q5:** the Library routes are written out per kind (skills, kb-entries, rules, templates): 16 routes.
- **Q7:** `DELETE /api/factory/changes/{changeId}` (close a factory PR without merging) was cut.

**Outside the contract** (Hono routes, not counted): `/api/auth/*` (Better Auth), `POST /api/webhooks/github`, `/git/missions/{missionId}.git`.

**Rules on every write:** an `Idempotency-Key` is required; approvals, decisions, releases, overrides and acceptances carry the version they apply to (a stale one gets 409); overrides, decisions, acceptances and pass approvals take a written reason. **Step-up** is marked only where the design requires it: credential actions. Every list takes the contract's cursor (`cursor`, `limit` of at most 100) and returns `nextCursor`.

Key: **R** read, **W** write.

## Auth (5)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 1 | W | `POST /api/cli/device-logins` | Starts a CLI login with a device code and a short user code |
| 2 | W | `POST /api/cli/device-logins/{userCode}/approvals` | You approve it in the web app. **Step-up.** |
| 3 | W | `POST /api/cli/sessions` | The CLI polls with its device code and gets its session once approved. Never replayable: a replayed key gets 409, and the token is never returned again. |
| 4 | R | `GET /api/cli/sessions` | List CLI sessions (stored hashed, 12 hours, operator scope) |
| 5 | W | `DELETE /api/cli/sessions/{sessionId}` | Revoke a session |

## Health (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 6 | R | `GET /api/health` | Health |
| 7 | R | `GET /api/doctor` | Database, Docker and gVisor, proxies, token expiry dates, the last isolation run; also room health |

## Clients and repos (10)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 8 | R | `GET /api/clients` | List clients; the internal client only with `?kind=internal` |
| 9 | W | `POST /api/clients` | Create a client |
| 10 | R | `GET /api/clients/{clientId}` | One client |
| 11 | W | `PATCH /api/clients/{clientId}` | Edit a client |
| 12 | R | `GET /api/repo-connections` | List connections |
| 13 | W | `POST /api/repo-connections` | One per client, with a read token and a write token limited to that client's repos. **Step-up.** |
| 14 | W | `PATCH /api/repo-connections/{connectionId}` | Edit its `repos[]`. **Step-up.** |
| 15 | W | `DELETE /api/repo-connections/{connectionId}` | Revokes both tokens; the record stays for history |
| 16 | W | `POST /api/repo-connections/{connectionId}/verifications` | Checks both tokens and their scopes |
| 17 | W | `POST /api/repo-connections/{connectionId}/rotations` | Replaces the read or the write token without changing the connection. **Step-up.** |

## Packages (1)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 18 | R | `GET /api/packages` | A paged list; read-only (packages change through a factory PR) |

## Missions (16)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 19 | R | `GET /api/missions` | List missions as `MissionListRowDto` (name, client, gate strip with counts, deadline, plain); `?kind=client\|internal\|template\|unset` |
| 20 | W | `POST /api/missions` | A new mission starts as a draft with a name and an optional client; Canon asks first whether it's a client project or a template (CR-W22) |
| 21 | R | `GET /api/missions/{missionId}` | State, gate strip, onboarding progress and checkpoints, why, deliveries |
| 22 | W | `PATCH /api/missions/{missionId}` | Links a repo connection |
| 23 | W | `POST /api/missions/{missionId}/pauses` | Pause |
| 24 | W | `DELETE /api/missions/{missionId}/pauses/{pauseId}` | Resume (ends that pause row; pauses are independent rows, not a stack, per the schema) |
| 25 | W | `POST /api/missions/{missionId}/cancellations` | Cancel |
| 26 | W | `POST /api/missions/{missionId}/context-runs` | Read the context again after it was blocked |
| 27 | W | `POST /api/missions/{missionId}/readiness-waivers` | Proceed on a partial readiness result, with a reason |
| 28 | W | `POST /api/missions/{missionId}/finalizations` | Approval #1, with the plan version |
| 29 | W | `POST /api/missions/{missionId}/pass-approvals` | The receipt hash and a reason |
| 30 | W | `POST /api/missions/{missionId}/releases` | Approval #2, with the receipt hash and, for a pass, the pass approval ID |
| 31 | W | `POST /api/missions/{missionId}/refreshes` | Refresh onto a newer client main |
| 32 | W | `POST /api/missions/{missionId}/budget-increases` | Opens a budget-increase proposal naming the module or mission budget and the amount |
| 33 | R | `GET /api/missions/{missionId}/messages` | Canon chat history, from the onboarding messages table |
| 34 | W | `POST /api/missions/{missionId}/messages` | Your turn with Canon; his reply streams back as it's written, and aborting the request stops it (CR-W19) |

## Gate 0 (11)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 35 | R | `GET /api/missions/{missionId}/uploads` | List uploads |
| 36 | W | `POST /api/missions/{missionId}/uploads` | Upload |
| 37 | W | `DELETE /api/uploads/{uploadId}` | Refused once an approved fact cites the upload |
| 38 | W | `PATCH /api/checkpoints/{checkpointId}/sections/{sectionKey}` | Edit one section |
| 39 | W | `POST /api/checkpoints/{checkpointId}/drafts` | Generate |
| 40 | W | `POST /api/checkpoints/{checkpointId}/approvals` | Approve |
| 41 | W | `POST /api/checkpoints/{checkpointId}/change-requests` | Ask for changes |
| 42 | W | `POST /api/checkpoints/{checkpointId}/reopenings` | Reopen |
| 43 | W | `PATCH /api/facts/{factId}` | Confirm or reject |
| 44 | W | `POST /api/questions/{questionId}/answers` | Answer with an option, or `other` in your own words (CR-W19) |
| 45 | W | `PUT /api/missions/{missionId}/secrets/{secretName}` | Write-only. **Step-up.** (Step 4, per CR-1.) |

## Plan and roster (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 46 | R | `GET /api/missions/{missionId}/plan` | `?version=` |
| 47 | R | `GET /api/roster` | The roster |
| 48 | W | `PUT /api/roster` | Replaces the whole roster as a new version, filed as a factory-repo PR; running missions keep theirs |

## Dispatches (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 49 | R | `GET /api/missions/{missionId}/dispatches` | With DISPATCH.md |
| 50 | R | `GET /api/dispatches/{dispatchId}` | Task doc versions, attempts, room |
| 51 | W | `POST /api/dispatches/{dispatchId}/overrides` | Start, retry, park or cancel by hand, with a reason |

## Decisions (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 52 | R | `GET /api/pending-decisions` | Everything waiting on you: proposals of every kind, plus open factory PRs. Its row is the 10-kind `PendingDecisionDto` union (CR-W2) |
| 53 | R | `GET /api/proposals/{proposalId}` | One proposal |
| 54 | W | `POST /api/proposals/{proposalId}/decisions` | Choose an option, with a reason |

## Gates and findings (6)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 55 | R | `GET /api/missions/{missionId}/gates` | Every gate evaluation and integration commit |
| 56 | R | `GET /api/integration-commits/{integrationCommitId}` | Results and log |
| 57 | W | `POST /api/missions/{missionId}/overrides` | Gates 3 and 4 only; caps the verdict at pass. Gates 1, 2 and 5 are refused. |
| 58 | R | `GET /api/missions/{missionId}/findings` | List findings |
| 59 | W | `PATCH /api/findings/{findingId}` | Confirm or dismiss, with a reason |
| 60 | W | `POST /api/findings/{findingId}/acceptances` | Accept with a reason; caps the verdict at pass; refused for an integrity failure at Gate 5 |

## Receipts and delivery (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 61 | R | `GET /api/receipts/{receiptId}` | `?verify=1` rechecks the hash |
| 62 | R | `GET /api/deliveries/{deliveryId}/archive` | The zip |

## Events and traces (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 63 | R | `GET /api/events/stream` | Server-sent events through oRPC's event iterator, for all missions or one (`?missionId=`); resumes from `Last-Event-ID` (the event's `seq`), replaying up to 30 days. The web opens one global stream per tab |
| 64 | R | `GET /api/traces/stream` | `?attemptId=` or `?sessionId=`; `view=steps` for the module page's live feed; resumes from `Last-Event-ID` (the trace ID) |

## Your work (4)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 65 | W | `POST /api/operator/events` | Commits from the git hook, CLI activity heartbeats, hand-entered time |
| 66 | W | `PATCH /api/time-entries/{timeEntryId}` | Confirm or edit |
| 67 | R | `GET /api/notes` | Your notes |
| 68 | W | `POST /api/notes` | Add a note, from the web or CLI |

## Metering (0, withdrawn)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 69 | R | ~~`GET /api/metrics`~~ | Withdrawn in contract 1.0.0 (CR-W20 section 3) |
| 70 | W | ~~`POST /api/payments`~~ | Withdrawn in contract 1.0.0 (CR-W20 section 3) |

## Factory repo (3)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 71 | R | `GET /api/factory/versions` | Merged commits, which missions are on each, and knowledge releases |
| 72 | R | `GET /api/factory/changes` | Open PRs |
| 73 | W | `POST /api/factory/changes/{changeId}/merges` | Approve and merge |

## Library (18)
The same four routes for each kind. Creating or changing an item opens a factory PR; approving, retiring or promoting one is merging that PR.

| # | | Route | What it does |
| --- | --- | --- | --- |
| 74–77 | R/W | `GET`, `POST /api/library/skills`; `GET`, `PATCH /api/library/skills/{itemId}` | Skills: create, or upload a skill folder; each records its source (upload, written or import) |
| 78–81 | R/W | the same for `/api/library/kb-entries` | Knowledge entries |
| 82–85 | R/W | the same for `/api/library/rules` | Rules |
| 86–89 | R/W | the same for `/api/library/templates` | Project templates |
| 90 | R | `GET /api/rules/{rulesVersion}/bundle` | What `avel check` runs |
| 91 | R | `GET /api/missions/{missionId}/closeout-items` | Confirmed findings and lesson candidates to write up |

## Evals, later (1)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 92 | R | `GET /api/eval/configs` | Live results per config |

## Audit (1)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 93 | R | `GET /api/activity` | The activity log, overrides included |

## Agent, host tool server only (6)
Called only through the host tool server with a dispatch token, which is checked against the token's dispatch and role.

| # | | Route | What it does |
| --- | --- | --- | --- |
| 94 | W | `POST /api/agent/reports` | Completion report |
| 95 | W | `POST /api/agent/findings` | Reviewers only |
| 96 | W | `POST /api/agent/dependency-requests` | At most 3 new packages per dispatch |
| 97 | W | `POST /api/agent/escalations` | Test disputes, test changes, suppressions, contract changes |
| 98 | W | `POST /api/agent/progress-notes` | Progress notes |
| 99 | R | `GET /api/agent/kb-entries?query=` | The kb-search tool: read-only, scoped to the mission's client, its stack and global entries; logged in the trace |

## Dispatch package (3)
From CR-16; in the contract.

| # | | Route | What it does |
| --- | --- | --- | --- |
| 100 | R | `GET /api/missions/{missionId}/dispatch-package` | The package manifest (`DispatchPackageDto`) |
| 101 | R | `GET /api/missions/{missionId}/dispatch-package/files?path=` | One file, `text/markdown` |
| 102 | R | `GET /api/missions/{missionId}/dispatch-package/archive` | The deterministic zip |

**Total in the groups above: 102 numbered, of which 69 and 70 are withdrawn. With the 19 below, contract 1.0.0 has 119.**

## Added in contract 1.0.0
From the web's CRs (Contract response to CR-W1 to W22). None takes a step-up; every write takes an `Idempotency-Key`.

| # | | Route | What it does | CR |
| --- | --- | --- | --- | --- |
| 104 | R | `GET /api/status` | Slots, what needs you and alerts, for the top bar and `avel watch` | CR-W5 |
| 105 | R | `GET /api/missions/{missionId}/messages/{messageId}/stream` | Re-attach to a Canon reply still streaming; `STREAM_GONE` once finished | CR-W19 |
| 106 | W | `POST /api/missions/{missionId}/transcriptions` | A recorded clip in, its transcript streamed back for review | CR-W19 |
| 107 | R | `GET /api/receipts/{receiptId}/artifacts/{key}` | One proof file's bytes, at most 2 MB | CR-W21 |
| 108 | R | `GET /api/missions/{missionId}/modules/{moduleRef}` | One module run: ladder, cost against its cap, attempts, findings | CR-W21 |
| 109 | R | `GET /api/attempts/{attemptId}/steps?after=` | An attempt's agent steps, oldest first | CR-W21 |
| 110 | R | `GET /api/library/templates/sources/{missionId}` | A delivered project to cut a template from | CR-W21, CR-W22 |
| 111 | R | `GET /api/library/template-drafts/{draftId}` | A template draft | CR-W21 |
| 112 | W | `PUT /api/library/template-drafts/{draftId}` | Create or save a draft, bound to its `rowVersion` | CR-W21 |
| 113 | W | `POST /api/library/template-drafts/{draftId}/pull-requests` | Check the draft and open its factory PR | CR-W21 |
| 114 | W | `POST /api/missions/{missionId}/dispatch-package/commits` | Confirm the package commit, bound to `packageHash` | CR-W11 |
| 115 | R | `GET /api/library/skills/{itemId}/results` | Results per version and a baseline without the skill | CR-W16 |
| 116 | R | `GET /api/eval/runs/{runId}` | One eval run and its results | CR-W16 |
| 117 | R | `GET /api/leads` | Leads with their derived stage | CR-W17 |
| 118 | W | `POST /api/leads` | A new client with status lead, and its lead | CR-W17 |
| 119 | W | `POST /api/leads/{leadId}/closures` | Close a lead as lost, with why | CR-W17 |
| 120 | R | `GET /api/followups/{followupId}` | A follow-up's draft | CR-W17 |
| 121 | W | `POST /api/followups/{followupId}/sends` | Approve a follow-up or upkeep offer, bound to `draftHash` | CR-W17 |
| 122 | R | `GET /api/pipeline` | Every client's derived stage | CR-W17 |

## Accepted, now built

Everything this section listed on Nov 9 shipped in contract 1.0.0 (Contract response to CR-W1 to W22):
- **CR-20:** missions have a `name` (no slug), on routes 19, 21 and 52.
- **CR-W5:** route 19 returns `MissionListRowDto`, and `GET /api/status` is route 104 (not 103).
- **CR-W2:** route 52 returns the 10-kind union; routes 53 and 54 return `ProposalViewDto`; a `ref` is `<kind>:<id>`.

## Proposed, not counted

Shapes are drafts; numbers are given only when a change request is accepted. CR-17 is from Nov 4; the rest were suggested on Nov 9 in the change package.

| From | Route | What it does |
| --- | --- | --- |
| CR-17 | every route | Each route is tagged with which identities may call it (operator, agent, runner) and how far an agent reaches (`own_attempt`, `own_dispatch`, `own_mission`, `role:<judge roles>`). Untagged routes refuse agents. New error codes `AGENT_NOT_PERMITTED` and `AGENT_SCOPE` |
| CR-25 | `POST /api/receipts/{receiptId}/shares` | Create a client-facing link to a receipt (token stored only as a hash) |
| CR-25 | `DELETE /api/receipt-shares/{shareId}` | Revoke that link |
| CR-25 | `GET /r/{token}` | The public receipt page: verdict, commit, gates and tests, hash check; never cost. Outside sign-in, rate-limited |
| CR-25 | ~~`GET /api/missions/{missionId}/margin`~~ | Withdrawn: no money in the control room (CR-W20 section 3) |
| CR-25 | `GET /api/missions/{missionId}/previews` | Preview links per landed commit |
| CR-25 | ~~`POST /api/missions/{missionId}/templates`~~ | Covered by routes 110 to 113 (CR-W21 template authoring) |
| CR-25 | `POST /api/closeout-items/{itemId}/drafts` | Draft a rules PR from a lesson |
| CR-24, CR-25 | `GET /api/notifications` | Notifications sent to you, with their state |
| Page map, gap 4 | `GET /api/rooms?state=running` | Running rooms across missions, for Factory live and the slot rack (the deferred part of CR-W5) |
| Page map, gap 5 | ~~`GET /api/module-runs/{moduleRunId}`~~ | Covered by route 108 (CR-W21) |

CR-26 (Retro) adds no routes: Canon starts his runs from the context stage, and route 26 re-runs the context.

## Deliberately not routes (from the design)
Starting a dispatch, retrying, integrating, merging and running a gate. The scheduler and integrator do those from events; a person can trigger one only through a logged override. The model proxy and the egress proxy are separate services on the host. Rooms have no routes for changing them; the proposed rooms list above is read-only.
