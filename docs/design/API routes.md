# API routes: the 99 operations

Nov 5, 2026 · extracted for @javaris

**What this is:** the route list taken from the frozen design doc (Main, "API routes"), with the three corrections that the API and Data Reference's summary page records. Nothing here is new. Every row quotes the design's own wording, and the total comes to exactly 99, which matches the reference's count. That match is the check that nothing was invented or dropped.

**Corrections from the API reference (its review questions):**
- **Q4:** the version you approve travels in the request body (`rowVersion`, `version`, `receiptHash`, `headSha`), not in `If-Match`.
- **Q5:** the Library routes are written out per kind (skills, kb-entries, rules, templates): 16 routes.
- **Q7:** `DELETE /api/factory/changes/{changeId}` (close a factory PR without merging) was cut.

**Outside the contract** (Hono routes, not counted): `/api/auth/*` (Better Auth), `POST /api/webhooks/github`, `/git/missions/{missionId}.git`.

**Not here:** the DTOs (85 output and 56 input shapes in the reference). The design names their fields only in prose, so they still have to be drafted from the schema.

**Rules on every write** (from the design): an `Idempotency-Key` is required; approvals, decisions, releases, overrides and acceptances carry the version they apply to (a stale one gets 409); overrides, decisions, acceptances and pass approvals take a written reason. **Step-up** is marked only where the design requires it: credential actions.

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
| 8 | R | `GET /api/clients` | List clients |
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
| 19 | R | `GET /api/missions` | List missions |
| 20 | W | `POST /api/missions` | A new mission starts as a draft with a client |
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
| 34 | W | `POST /api/missions/{missionId}/messages` | Your turn with Canon; replies stream on the trace stream |

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
| 44 | W | `POST /api/questions/{questionId}/answers` | Answer |
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
| 52 | R | `GET /api/pending-decisions` | Everything waiting on you: proposals of every kind, plus open factory PRs |
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
| 63 | R | `GET /api/events/stream?missionId=` | Server-sent events through oRPC's event iterator; resumes from `Last-Event-ID` (the event's `seq`), replaying up to 30 days |
| 64 | R | `GET /api/traces/stream` | `?attemptId=` or `?sessionId=`; resumes from `Last-Event-ID` (the trace ID) |

## Your work (4)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 65 | W | `POST /api/operator/events` | Commits from the git hook, CLI activity heartbeats, hand-entered time |
| 66 | W | `PATCH /api/time-entries/{timeEntryId}` | Confirm or edit |
| 67 | R | `GET /api/notes` | Your notes |
| 68 | W | `POST /api/notes` | Add a note, from the web or CLI |

## Metering (2)
| # | | Route | What it does |
| --- | --- | --- | --- |
| 69 | R | `GET /api/metrics` | `?missionId=` or by package, and by factory commit |
| 70 | W | `POST /api/payments` | Record a payment |

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

The design writes the Library paths as `/api/library/{kind}`; check the exact per-kind paths (for example `/api/library/kb-entries` or `/api/kb-entries`) against the contract.

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

**Total: 99.**

## Proposed, not counted: CR-16 (3)
| | Route | What it does |
| --- | --- | --- |
| R | `GET /api/missions/{missionId}/dispatch-package` | The package manifest (`DispatchPackageDto`) |
| R | `GET /api/missions/{missionId}/dispatch-package/files?path=` | One file, `text/markdown` |
| R | `GET /api/missions/{missionId}/dispatch-package/archive` | The deterministic zip |

## Deliberately not routes (from the design)
Starting a dispatch, retrying, integrating, merging and running a gate. The scheduler and integrator do those from events; a person can trigger one only through a logged override. The model proxy and the egress proxy are separate services on the host. Rooms have no routes.
