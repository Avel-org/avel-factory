# Factory records

Nov 4, 2026 · @javaris

How dispatch is generated, started and logged, in agent-dispatch's layout. In the repo this lives at `docs/agent-dispatch/avel/`, next to the vendored agent-dispatch framework, with `.claude/commands/dispatch.md`, `.claude/agents/`, `.claude/settings.json` and `scripts/dispatch.sh` at the root (the "dispatch-kit" zip). The teams and the session rules are in `claude/Roster setup and sessions.md`; the routes that serve the package are in `claude/CR-16 Dispatch package contract.md`.

## `avel/README.md`

`docs/agent-dispatch/` is [agent-dispatch](https://github.com/robertohluna/agent-dispatch) (MIT), vendored at the commit in `VENDORED_FROM`. The factory follows it, with the changes below. Where this file and the framework disagree, this file wins; where this file and the factory design disagree, the design wins.

### What the factory changes

1. **Code renders the documents.** In agent-dispatch, the ORCHESTRATOR writes DISPATCH.md, the task docs and the activation prompts. In the factory, code renders them from the approved plan, byte-identical every time, and hashes them. Canon plans (Gate 0) and you approve. A model never picks agents or work.
2. **The activation is built into the task doc.** Each task doc is agent-dispatch's seven parts, with its activation prompt as the last section, and `DISPATCH-PROMPTS.md` archives them all. Starting an agent takes one line, never a pasted prompt:
   - **In a factory room,** the runner sends the activation prompt as the agent's first message. Nothing is pasted.
   - **On your machine,** `/dispatch <team>/sprint-NN/<task-doc>` in Claude Code, or `scripts/dispatch.sh <team>/sprint-NN` to open every agent in its own worktree.
3. **Dropped:** the intensity protocol and the mesh-mode keywords in `config/dispatch-styles.md` (design decision, Oct 31). Rendered activations never include them. Sub-agents are used only where a task doc allows them, inside the same cap.
4. **Waves are computed, not waited for.** A module starts as soon as its own dependencies have landed, up to 6 dispatches at once.
5. **Tests come first and are locked.** Test writers (Fenn, Rigg) run before the builder, and their tests must fail first. A builder can't edit a locked test.
6. **LEAD is code.** The integrator merges one module at a time as an integration commit, and the mission branch moves only when Gate 2 is green. You release.
7. **Grading is the gate.** Sprint assessment becomes `decide()` at Gate 5 and a hashed receipt.

### Teams and sessions
- **`avel/roster.md`:** the backend and frontend teams in this one repo: who leads, who builds, who tests, the territories, and the rules between teams. The agent setups are in `.claude/agents/`.
- **`avel/sessions.md`:** how to open Claude sessions (lead, agent, review, integration) and the good practices that keep them honest.
- **`.claude/settings.json`:** the permission allow and deny lists every session starts with.

### Names

| agent-dispatch | AVEL factory |
| --- | --- |
| Sprint | Mission (while building the factory by hand: one sprint per build step) |
| ORCHESTRATOR, Wave 0 | Canon (Gate 0), then code renders |
| ORCHESTRATOR, Wave 6 | Gate 5: `decide()` and the receipt |
| `codebase-analysis.md` | `codebase_analysis` |
| `DISPATCH.md` | `mission_docs` |
| `agent-[X]-[domain].md`, plus its activation prompt | `task_docs`, with the activation built in |
| Chain and execution trace | `plan_modules.trace` and the task doc's tasks |
| Territory | `write_paths` and `forbidden_paths` |
| Worktree and `sprint-XX/agent` branch | A room and the attempt branch `mission/<id>/<module>/<role>-a<n>` |
| Retry protocol: 3 tries, then parked | The retry ladder: Retry 1–3, then parked (a proposal to you) |
| Converge, at most 3 | Converge proposals, at most 3 |
| Carry-forward, `REGISTRY.md` | Closeout items |
| Gates 0–5 | Gates 0–5, same names |
| DATA, BACKEND | Soap (`data`, `api`) |
| SERVICES | Iyo (`services`, `ai`) |
| INFRA | Atlas (`infra`, `maintenance`, `docs`) |
| FRONTEND | Leon (`frontend`), Fantem (`frontend-components`), Ghost (`frontend-data`) |
| DESIGN | Nemi (`design-system`) |
| QA | Fenn (frontend tests), Rigg (backend tests); reviews go to Brennan, Zane and Leah |
| RED TEAM | Breach |
| LEAD | The integrator (code), plus Axis and Zero as reviewers |

### The sprint folder

While the factory is built by hand, each team runs its own sprints, one per build step: `docs/agent-dispatch/backend/sprint-NN/` and `docs/agent-dispatch/frontend/sprint-NN/` (see `avel/roster.md` and `avel/sessions.md`). From agent-dispatch:

| File | Template |
| --- | --- |
| `codebase-analysis.md` | the playbook's Phase 1 |
| `DISPATCH.md` | `templates/dispatch.md` |
| `agent-<agent>-<module>-<role>.md`: the task doc, activation prompt as its last section | `avel/templates/task-doc.md` (agent-dispatch's `templates/agent.md`, AVEL form) |
| `DISPATCH-PROMPTS.md`: every activation prompt, archived | the playbook's Phase 8 |
| `agent-<agent>-<module>-<role>-completion.md` (a reviewer's review report too) | `avel/templates/completion.md` (agent-dispatch's `templates/completion.md`, plus the CR-10 sections) |
| `red-team-findings.md` | `templates/red-team-findings.md` |
| `SPRINT-ASSESSMENT.md` | `templates/sprint-assessment.md` |
| `../REGISTRY.md` (one per team) | `templates/sprint-registry.md` |

The factory adds files that agent-dispatch doesn't have:

| File | Template | In the factory it becomes |
| --- | --- | --- |
| `contract.md` (Axis's slice of the contract) | `avel/templates/step-contract.md` | The locked API contract (CR-8) |
| `findings/F-NNN.md` | `avel/templates/finding.md` | `findings` |
| `escalations/E-NNN.md` | `avel/templates/escalation.md` | `proposals` |
| `dependency-requests/D-NNN.md` | `avel/templates/dependency-request.md` | `dependency_requests` |
| `locks.md` | `avel/templates/test-locks.md` | `test_locks`, `locked_scripts` |
| `decisions.md` | `avel/templates/decision.md` | Your decisions on proposals and findings |
| `cost.md` | `avel/templates/cost-log.md` | The `attempts` cost columns |

### Starting agents without pasting
- **The next ready jobs:** `scripts/dispatch.sh backend/sprint-01` opens up to 2 agents (`--max N` to change), test writers first. Each gets a worktree, a database and a WezTerm tab labelled like `A · Soap · platform · build`. It uses tmux when you're inside tmux, and otherwise prints the commands. `--status` shows what's done, running, ready and waiting.
- **One job:** `scripts/dispatch.sh backend/sprint-01 --only agent-soap-platform-build`, or in its worktree run `/dispatch backend/sprint-01/agent-soap-platform-build`.
- **Other tools** (Codex, Cursor and others): the one line is the same: "Read `docs/agent-dispatch/backend/sprint-01/agent-soap-platform-build.md` in full and follow it exactly."

## Template: `avel/templates/task-doc.md`

````markdown
---
sprint: NN
module: ""              # factory module: platform, events, gate, ...
agent: ""               # roster name: Soap, Iyo, Atlas, Rigg, Fenn, Axis, Brennan, Zane, Leah, Breach, ...
role: build             # build | test-unit | test-e2e | api-contract | ui-contract | review-backend | review-frontend | review-spec | review-security | review-a11y-perf | red-team
work_kind: api          # api | data | services | ai | infra | maintenance | docs | design-system | frontend | frontend-components | frontend-data
branch: ""              # <team>/sprint-NN/<module>/<role>-a1  (in the factory: mission/<id>/<module>/<role>-a<n>); not for reviewers
needs: ""               # task docs that must finish first, comma-separated; the first is the one this builds on or reviews
start_commit: ""        # optional; default: the HEAD of the first `needs` job
review_commit: ""       # reviewers only, optional; default: the HEAD of the first `needs` job
cap_minutes: 60
cap_dollars: 4
version: 1
hash: ""                # sha256 of this file once frozen; a change is a new version
---

# <Agent> · <module> · <role>

## Role
2–3 sentences: what this dispatch builds, tests or reviews this sprint, what done looks like, and how it fits with the other agents.

## Context: read before coding (in this order)
1. `AGENTS.md`: build, test and generate commands; traps
2. `docs/agent-dispatch/<team>/sprint-NN/contract.md`, sections: …: the locked contract slice you implement
3. Reference pattern: `path/to/file.ts` lines X–Y: how this codebase already does this
4. `path/to/source.ts`: why
5. This document

Anything you open beyond this list is allowed, but note it in your report.

## Contract excerpts
The exact slices of the contract this dispatch implements, pasted with their source paths. You're graded against this text.

## Cross-agent context
- Depends on: <modules or agents, and what each provides>
- Depended on by: <who uses your output>

## Files owned (territory)
```
packages/server/src/modules/<module>/**
```
**Do not touch:** every locked test path (`locks.md`), `packages/contract/**` (Axis; propose changes through an escalation), `packages/db/**` (Soap, `data`), and other modules' folders (their owners). Reading anything is fine.

## Chains
### <ID>-01: <title> (P1)
- **Serves:** R…, S…
- **Vector:** <entry point> → <function> → <function> → <fix site>
- **Signal:** what's missing or broken, and how you know
- **Current state:** what exists now (snippet if useful)
- **Required change:** what to build or fix, exactly
- **Reference pattern:** `path:lines`
- **Done means:** locked tests <names> pass; contract items <…>
- **Constraints:** each with its rule ID where one exists
- **Out of scope:** what not to touch or add, even if it looks helpful

### <ID>-02: …

## Execution protocol
- **Before each chain:** read the vector end to end, read 3–5 nearby files and match them, and list the callers of what you change.
- **After each chain:** typecheck, lint, the affected locked tests, then the rules check. Trim failure output to about 2,000 tokens. A green chain ends with a checkpoint commit: `sprint-NN/<module>: <ID>-0n <summary>`.
- **Stop rules:**
  - the same verification error 3 times in a row: stop, park the chain in your report, and move on;
  - a contract that looks wrong: file an escalation (`escalations/E-NNN.md`); never work around it;
  - a needed package: file a dependency request (`dependency-requests/D-NNN.md`); never install it;
  - a critical issue outside your chains: record it under P0 discoveries, commit, and don't fix it outside your territory.

## Pre-flight, then completion
1. Full verification: build, typecheck, lint, every locked test, the rules check.
2. Check your diff against the pre-flight checklist in the completion template.
3. Write `agent-<agent>-<module>-<role>-completion.md` from `avel/templates/completion.md`, then commit.

## Activation prompt (sent by the runner)

The runner sends this as the agent's first message; it's also archived in `DISPATCH-PROMPTS.md`. On your machine, `/dispatch` sends it for you.

You are **<AGENT>**, the <role> agent on the AVEL factory (`avel-factory`: Node 22, Hono, oRPC, Zod 4, Drizzle, Postgres, Vitest).

Your branch: `<branch>`. Your working directory is this worktree. Work only here.

Read this whole task doc first, then the files under **Context**, in order, before writing any code. Match the codebase; the codebase doesn't match you.

Follow this document exactly. It's frozen: if something in it looks wrong, escalate (see **Stop rules**) instead of working around it. When you're done, write your completion report at `docs/agent-dispatch/<team>/sprint-NN/agent-<agent>-<module>-<role>-completion.md` and commit it to your branch.
````

## Template: `avel/templates/completion.md`

````markdown
---
sprint: NN
module: ""
dispatch_role: build
agent: ""
attempt: a1
attempt_kind: initial   # initial | retry_1 | retry_2 | retry_3 | fix | rework
task_doc_version: 1
task_doc_hash: ""
start_commit: ""
result_commit: ""
status: complete        # complete | partial | blocked
started_at: ""
ended_at: ""
skills_opened: []       # every skill actually opened
---

# <Agent> · <module>: Sprint NN completion report

> Branch: `<branch>` · Status: **COMPLETE** | **PARTIAL** | **BLOCKED**

## Summary
2–3 sentences: what was done, what wasn't and why, any surprises.

## Chains completed
| Chain | Status | Commit | Serves |
| --- | --- | --- | --- |
| X-01 | COMPLETE | `abc1234` | R1, S1 |

## Contract map
Each contract item from the task doc → the files that implement it.
| Contract item | Files |
| --- | --- |
| `POST /api/clients` output `ClientDto` | `modules/onboarding/clients.routes.ts`, `modules/onboarding/client.mapper.ts` |

## Verification (paste the commands and trimmed output)
```text
$ pnpm typecheck
…
$ pnpm --filter @avel/server test
…
```

## Pre-flight checklist
- [ ] Full verification green: build, typecheck, lint, every locked test, the rules check
- [ ] Every contract item implemented
- [ ] No file changed outside the territory
- [ ] No TODOs, placeholders or commented-out code
- [ ] Nothing hard-coded that a token, config or contract enum covers
- [ ] No secrets or personal data in logs
- [ ] No new package without a dependency request
- [ ] Every error path returns the contract's error body with its request ID

## Deviations from the contract
None, or each one with its reason. (A deviation without an escalation is a finding.)

## Parked chains
Each parked chain: what was tried (3 approaches), why each failed, what it needs.

## Known limitations

## For test writers only
- Each new test failed on the start commit: the test name and its failure line.
- Assertion count per file.

## P0 discoveries
Anything that blocks or endangers other modules.

## Issues for others
| For | Issue | Evidence |
| --- | --- | --- |

## Dependency requests and escalations filed
- `D-…`, `E-…`
````

## Template: `avel/templates/step-contract.md`

````markdown
---
step: NN
title: ""
author: Axis
checked_by: Brennan
checked_at: ""          # set when Brennan accepts the slice
contract_version: ""    # packages/contract version this quotes
state: draft            # draft | locked
---

# Step NN contract

## Scope
What this step builds, in one paragraph. Quote the build order's line for this step from the design doc.

## Routes
| Method | Path | Input DTO | Output DTO | Errors (codes) | Step-up | Idempotent |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | no | yes |

Quote each DTO and error from `packages/contract` with its file path. Don't paraphrase.

## Events
| Kind | Emitted when | Payload fields |
| --- | --- | --- |

## Tables
| Table | Owner module | Read or write | Constraints relied on (CHECKs, unique indexes) |
| --- | --- | --- | --- |

## Requirements
- **R1:** (EARS form, for example: "When a write arrives without an Idempotency-Key, the server shall answer 400 BAD_REQUEST with details `{ field: 'Idempotency-Key' }`.")

## Scenarios
| ID | Requirement | Level | Given | When | Then |
| --- | --- | --- | --- | --- | --- |
| S1 | R1 | integration | | | |

## Checks (done when)
| ID | Kind | Spec |
| --- | --- | --- |
| CK1 | test | `pnpm --filter @avel/server test -- <file>` passes |

## Out of scope
What this step must not touch or add.

## Doc gaps found
Anything the docs don't answer. Each becomes a change request before building, never a guess.
````

## Template: `avel/templates/finding.md`

````markdown
---
id: F-NNN
step: NN
module: ""
source: review              # review | gate | checkpoint
source_role: review-security
filed_by: ""                # Axis | Brennan | Zane | Leah | Breach | Fenn (exploratory) | Zero
check_id: ""                # a rule or check ID, if one applies (e.g. B8, CK3)
target_ref: ""              # path:line, or R/S/CK label: where the problem is
kind: security              # requirement | security | scope | advisory
route: rework               # rework | proposal | receipt  (set by you, not the reviewer)
state: open                 # open | triage | confirmed | disputed | dismissed | fixed | accepted
reviewed_commit: ""
tries: 0
fixed_by_check: ""          # the regression test or check that proves the fix
---

# F-NNN: <one-line title>

## What's wrong
One paragraph: what the code does, and what the contract, doc or standard requires instead.

## Evidence
- **Location:** `path:line`
- **Rule or source:** contract excerpt, DATABASE.md section, ASVS item, WCAG criterion or budget, quoted
- **Reproduce:**
  ```text
  command or request
  ```
- **Observed:**
  ```text
  output or response
  ```
- **Expected:**

## Proposed regression check
The test or rule that fails now and passes once fixed. A finding is closed only by this check passing.

## History (append only)
- YYYY-MM-DD HH:MM · <who> · state → … · reason
````

## Template: `avel/templates/escalation.md`

````markdown
---
id: E-NNN
step: NN
module: ""
filed_by: ""
kind: contract_change     # contract_change | test_change | dispute | suppression
target: ""                # the contract item, locked test, finding ID or rule ID
change_type: ""           # contract changes only: additive | breaking
state: open               # open | resolved | expired
filed_at: ""
---

# E-NNN: <one-line title>

## What I need
One paragraph.

## Why
Evidence: what fails or what's wrong, with `path:line`, test output or the doc section.

## Options
| Option | Effect | Cost |
| --- | --- | --- |
| A | | |
| B | | |

## Who decides
- **Additive contract change:** the lead (Axis or Zero) and Brennan both accept.
- **Breaking contract change, acceptance-test change:** you.
- **Locked-test dispute:** Brennan.
- **Dispute over a finding:** see the dispute table in the roster.

## Resolution (filled by whoever decides; also logged in decisions.md)
- Choice:
- Reason:
- Decided by, at:
````

## Template: `avel/templates/dependency-request.md`

````markdown
---
id: D-NNN
step: NN
module: ""
filed_by: ""
name: ""               # package name
version: ""            # exact version, pinned
new_to_factory: true   # not already used anywhere in avel-factory
state: open            # open | approved | rejected | expired
filed_at: ""
---

# D-NNN: <package>@<version>

## Why it's needed
What it does for which task (T…), and why the stack or an existing package can't do it.

## Alternatives considered
- Writing it ourselves: …
- An existing dependency: …

## Risk
Licence, maintainers, install scripts, size, transitive dependencies. Zane reviews new-to-factory packages.

## Resolution
- Choice: approved | rejected
- Reason:
- Landed as a dependency commit: `sha` (only `package.json` and the lockfile change)
````

## Template: `avel/templates/decision.md`

````markdown
# decisions.md (append-only; yours)

One entry per decision. Every finding route, escalation, dependency request, override and merge gets one.

```text
## YYYY-MM-DD HH:MM · <ID: F-003, E-001, D-002, merge, override>
- Subject: <one line>
- Choice: <confirm | dismiss | accept | route rework | approve | reject | option A …>
- Reason: <required for dismiss, accept, override and every escalation>
- Effect: <e.g. fix attempt a2 for platform/build; verdict capped at pass; contract v0.7.1>
- Minutes: <your minutes on this decision>
```

**Meaning of the choices, matching the factory:**
- **Confirm** a finding: it goes to a fix attempt (before the module lands) or rework (after).
- **Dismiss:** with a reason; the finding stays on record.
- **Accept:** you keep the problem knowingly; in the factory this caps the verdict at pass.
- **Override:** logged with a reason; in the factory, only Gates 3 and 4 can be overridden.
````

## Template: `avel/templates/test-locks.md`

````markdown
# locks.md (yours; append-only)

Written when you lock a module's tests, before its build starts. The CI lock check reads the paths and hashes listed here and fails any build commit that changes them.

```text
## <module> · locked YYYY-MM-DD HH:MM at <commit>
| Path | sha256 | Assertions | Failed first (test name → failure line) | Scenario |
| --- | --- | --- | --- | --- |
| packages/server/test/platform/idempotency.test.ts | … | 9 | "replays the first response" → expected 201, got 404 | S3 |

Locked scripts (package.json, by value):
| Name | sha256 of value |
| --- | --- |
| test | … |

Flake check: 3 runs at lock time, same result each run: yes / no
Released: <date and reason, only through an approved test change (E-…)>
```
````

## Template: `avel/templates/cost-log.md`

````markdown
# cost.md (yours)

Before Step 2 the model proxy doesn't exist, so cost is logged by hand (Claude Code's `/cost` at the end of each session). From Step 2 the proxy meters it; copy its totals here until the receipts exist.

| Date | Module | Role | Agent | Attempt | Model | Tokens in | Tokens out | Cache read | Cache write | Dollars | Source | Wall minutes | Your minutes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | a1 | Opus 5.5 | | | | | | /cost | | |

**Step total:** $… · your minutes …
Compare each attempt against the factory's caps: $4 per attempt, $15 per module.
````

## `.claude/commands/dispatch.md`

````markdown
---
description: Start a dispatched agent from its task doc (activation built in)
argument-hint: <team>/sprint-NN/agent-<agent>-<module>-<role>
---

Read `docs/agent-dispatch/$ARGUMENTS.md` in full. It is your task doc. Its last section, "Activation prompt", is your activation: follow it as if it were sent to you as this message.

Then:
1. Check where you are. A builder or test writer must be on the branch named in its front matter (`git branch --show-current`). A reviewer must be on a detached checkout (`git branch --show-current` prints nothing). If not, stop and say so.
2. Read every file in its Context section, in order.
3. Follow the task doc exactly: chains in order, verification after each chain, its stop rules and its territory.
4. Finish with the pre-flight and your completion report, saved as `<this task doc's name>-completion.md` in the same folder. Builders and test writers commit it to their branch; reviewers leave it uncommitted.

Do not edit the task doc, the contract slice or any locked test. Do not push.
````

## `scripts/dispatch.sh`

```bash
#!/usr/bin/env bash
# Open the next ready dispatches of a sprint, each in its own worktree and its own terminal tab.
# Nothing is pasted: each agent starts with its model and `/dispatch <task doc>`.
#
#   scripts/dispatch.sh backend/sprint-01                  # up to 2 agents running, as WezTerm tabs
#   scripts/dispatch.sh backend/sprint-01 --max 1
#   scripts/dispatch.sh frontend/sprint-01 --only agent-fenn-approval-page-test-unit
#   scripts/dispatch.sh backend/sprint-01 --status         # what's done, running, ready, waiting
#   scripts/dispatch.sh backend/sprint-01 --dry-run
#   options: --max N (default 2) · --only <task doc> · --term wezterm|tmux|print · --status · --dry-run
#
# A task doc is docs/agent-dispatch/<team>/<sprint>/agent-<agent>-<module>-<role>.md. Its front matter:
#   agent:          roster name (its model comes from .claude/agents/<agent>.md)
#   role:           test-unit | test-e2e | build | review-* | red-team | ...
#   branch:         the attempt branch to create (not used by reviewers)
#   needs:          task docs that must be finished first, comma-separated (the first one is the one it builds on)
#   start_commit:   optional; where the branch starts (default: the HEAD of the first `needs` job, else HEAD)
#   review_commit:  optional, reviewers only (default: the HEAD of the first `needs` job), checked out detached
#
# State comes from the files:
#   done      its -completion.md exists, on main or committed in its own worktree
#   running   its worktree exists, with no completion report yet
#   ready     everything in `needs` is done
# Test writers open first, then builders, then reviewers.
# Each worktree gets its own database in .env.local. It never pushes and never deletes anything.
set -euo pipefail

usage() { sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
[[ $# -ge 1 ]] || usage
sprint="$1"; shift
max=2; only=""; term=""; dry_run=0; status_only=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max) max="${2:?--max needs a number}"; shift 2 ;;
    --only) only="${2:?--only needs a task doc name}"; only="${only%.md}"; shift 2 ;;
    --term) term="${2:?--term needs wezterm, tmux or print}"; shift 2 ;;
    --status) status_only=1; shift ;;
    --dry-run) dry_run=1; shift ;;
    -h|--help) usage ;;
    *) echo "unknown option: $1" >&2; usage ;;
  esac
done
[[ "$max" =~ ^[0-9]+$ ]] || { echo "--max must be a number" >&2; exit 2; }

repo_root="$(git rev-parse --show-toplevel)"
dir="${repo_root}/docs/agent-dispatch/${sprint}"
[[ -d "$dir" ]] || { echo "no such sprint folder: docs/agent-dispatch/${sprint}" >&2; exit 2; }
repo_name="$(basename "$repo_root")"
parent="$(dirname "$repo_root")"
team="${sprint%%/*}"
slug="${sprint//\//-}"
pg_base="${AVEL_PG_BASE:-postgres://postgres@localhost:5432}"

if [[ -z "$term" ]]; then
  if [[ -n "${WEZTERM_PANE:-}" ]] && command -v wezterm >/dev/null 2>&1; then term=wezterm
  elif [[ -n "${TMUX:-}" ]]; then term=tmux
  else term=print; fi
fi

field() { # field <file> <key>: one value from the front matter, without quotes or comments
  awk -v k="$2" '
    NR == 1 && $0 != "---" { exit }
    NR > 1 && $0 == "---" { exit }
    { i = index($0, ":"); if (i == 0) next
      key = substr($0, 1, i - 1); val = substr($0, i + 1)
      if (key != k) next
      sub(/[[:space:]]+#.*$/, "", val); gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
      gsub(/["\047\[\]]/, "", val); print val; exit }' "$1"
}
rank() { # test writers first, then builders and contracts, then reviews
  case "$1" in
    test-unit|test-e2e) echo 1 ;;
    api-contract|ui-contract|build|"") echo 2 ;;
    *) echo 3 ;;
  esac
}
short_role() { case "$1" in test-unit|test-e2e) echo tests ;; review-*|red-team) echo review ;; *) echo "$1" ;; esac; }
run() { if [[ $dry_run -eq 1 ]]; then echo "+ $*"; else "$@"; fi; }
tree_of() { echo "${parent}/${repo_name}-${team}-${1}"; }
is_done() { # its completion report is on main, or committed in its own worktree
  [[ -f "$dir/${1}-completion.md" || -f "$(tree_of "$1")/docs/agent-dispatch/${sprint}/${1}-completion.md" ]]
}
head_of() { # the commit a later job builds on or reviews: the job's worktree HEAD, else main's HEAD
  local t; t="$(tree_of "$1")"
  if [[ -d "$t" ]]; then git -C "$t" rev-parse HEAD; else git -C "$repo_root" rev-parse HEAD; fi
}

# Collect the task docs and their state.
shopt -s nullglob
declare -a ready=()
running=0
printf '%-48s %-8s %s\n' "TASK DOC" "STATE" "DETAIL" > /tmp/dispatch-status.$$
for doc in "$dir"/agent-*.md; do
  name="$(basename "$doc" .md)"
  [[ "$name" == *-completion ]] && continue
  tree="$(tree_of "$name")"
  state=""; detail=""
  if is_done "$name"; then state=done
  elif [[ -d "$tree" ]]; then state=running; running=$((running + 1)); detail="$tree"
  else
    waiting=()
    IFS=',' read -ra needs <<< "$(field "$doc" needs)"
    for n in "${needs[@]}"; do
      n="$(echo "$n" | xargs)"; n="${n%.md}"
      [[ -z "$n" ]] && continue
      is_done "$n" || waiting+=("$n")
    done
    if [[ ${#waiting[@]} -gt 0 ]]; then state=waiting; detail="needs ${waiting[*]}"
    else state=ready; ready+=("$(rank "$(field "$doc" role)") $name"); fi
  fi
  printf '%-48s %-8s %s\n' "$name" "$state" "$detail" >> /tmp/dispatch-status.$$
done
if [[ $status_only -eq 1 ]]; then cat /tmp/dispatch-status.$$; rm -f /tmp/dispatch-status.$$; exit 0; fi
rm -f /tmp/dispatch-status.$$

# Pick what to open.
declare -a pick=()
if [[ -n "$only" ]]; then
  [[ -f "$dir/${only}.md" ]] || { echo "no such task doc: ${only}.md" >&2; exit 2; }
  pick=("$only")
else
  slots=$((max - running))
  if [[ $slots -le 0 ]]; then echo "${running} agent(s) already running (max ${max}). Nothing opened."; exit 0; fi
  while read -r _ n; do
    [[ -n "$n" ]] && pick+=("$n")
    [[ ${#pick[@]} -ge $slots ]] && break
  done < <(printf '%s\n' "${ready[@]+"${ready[@]}"}" | sort -k1,1n -k2,2)
fi
[[ ${#pick[@]} -gt 0 ]] || { echo "Nothing ready in ${sprint} (${running} running). Try --status."; exit 0; }

letters=(A B C D E F G H)
i=$running
for name in "${pick[@]}"; do
  doc="$dir/${name}.md"
  agent_raw="$(field "$doc" agent)"; agent="$(echo "$agent_raw" | tr '[:upper:]' '[:lower:]')"
  role="$(field "$doc" role)"; module="$(field "$doc" module)"
  branch="$(field "$doc" branch)"; start="$(field "$doc" start_commit)"; review="$(field "$doc" review_commit)"
  tree="$(tree_of "$name")"
  first_need="$(field "$doc" needs | cut -d, -f1 | xargs)"; first_need="${first_need%.md}"
  # Defaults: a builder starts from its test writer's commit; a reviewer reviews its builder's commit.
  [[ -z "$start" && -n "$first_need" ]] && start="$(head_of "$first_need")"
  [[ -z "$review" && -n "$first_need" ]] && review="$(head_of "$first_need")"
  model=""
  [[ -n "$agent" && -f "$repo_root/.claude/agents/${agent}.md" ]] && model="$(field "$repo_root/.claude/agents/${agent}.md" model)"

  # The worktree: reviewers are detached at the builder's commit; everyone else gets a new branch.
  if [[ ! -d "$tree" ]]; then
    case "$role" in
      review-*|red-team)
        [[ -n "$review" ]] || { echo "skip ${name}: a reviewer needs review_commit" >&2; continue; }
        run git -C "$repo_root" worktree add --detach "$tree" "$review" ;;
      *)
        [[ -n "$branch" ]] || { echo "skip ${name}: no branch in front matter" >&2; continue; }
        if ! git -C "$repo_root" show-ref --verify --quiet "refs/heads/${branch}"; then
          run git -C "$repo_root" branch "$branch" "${start:-HEAD}"
        fi
        run git -C "$repo_root" worktree add "$tree" "$branch" ;;
    esac
  fi

  # Its own database, so parallel test runs never collide. (Keep .env.local in .gitignore.)
  db="avel_$(echo "${team}_${name#agent-}" | tr -c 'a-zA-Z0-9\n' '_' | tr '[:upper:]' '[:lower:]')"; db="${db:0:63}"
  if [[ $dry_run -eq 1 ]]; then echo "+ write ${tree}/.env.local (DATABASE_URL=${pg_base}/${db})"
  elif [[ ! -f "$tree/.env.local" ]]; then
    printf 'DATABASE_URL=%s/%s\n' "$pg_base" "$db" > "$tree/.env.local"
    command -v createdb >/dev/null 2>&1 && createdb --maintenance-db="${pg_base}/postgres" "$db" 2>/dev/null || true
  fi

  slot="${letters[$((i % ${#letters[@]}))]}"; i=$((i + 1))
  label="${slot} · ${agent_raw:-?} · ${module:-?} · $(short_role "$role")"
  launch="claude${model:+ --model $model} '/dispatch ${sprint}/${name}'"

  case "$term" in
    wezterm)
      if [[ $dry_run -eq 1 ]]; then echo "+ wezterm tab \"${label}\": cd ${tree} && ${launch}"
      else
        pane="$(wezterm cli spawn --cwd "$tree" -- bash -lc "$launch")"
        wezterm cli set-tab-title --pane-id "$pane" "$label"
      fi ;;
    tmux)
      if [[ $dry_run -eq 1 ]]; then echo "+ tmux window \"${label}\": cd ${tree} && ${launch}"
      else tmux new-window -n "$label" -c "$tree" "$launch"; fi ;;
    print)
      echo "# ${label}"; echo "cd \"$tree\" && ${launch}" ;;
    *) echo "unknown --term: $term" >&2; exit 2 ;;
  esac
  echo "opened: ${label}"
done
```
