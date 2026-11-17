# Concept: the dispatch (AVEL Factory)

Read this before you touch anything about dispatches. If it disagrees with the attached docs (After Canon, DATABASE.md, the contract), the docs win. Tell me about the conflict.

## What a dispatch is
A dispatch is one job given to one agent: "write the unit tests for module M3", "build M3", "review M3 for security". It's the unit of work the factory schedules, budgets and judges. The chain:

mission → module run → dispatch → attempt → integration commit

- A **module run** is one plan module being built. It has several dispatches: test writers first, then the builder, then reviewers.
- A **dispatch** is the job. It has a role, a frozen agent identity, and a versioned task doc saying exactly what to do.
- An **attempt** is one try at the job, in its own fresh room. A dispatch can take several attempts: the first, retries, fixes, rework.
- A good attempt's commit is applied to the mission branch by the integrator, as an **integration commit**.

Mission-level reviews are dispatches too, with no module run (`module_run_id` is null).

## Roles
`build`, `test-unit`, `test-e2e`, `review-spec`, `review-security`, `red-team`. No agent grades its own work. Test writers lock their tests before the builder starts, and reviewers are always different agents from the builder.

## Who starts one
Code does, never a model and never me by default. The scheduler starts a dispatch when its module's dependencies have landed, the budget can cover it, and a slot is free (at most 6 dispatches run at once). I can step in only through a logged override (start, retry, park or cancel), always with a written reason. Those dispatches are marked `origin = 'override'`.

## Lifecycle (dispatches.state)
pending → ready → starting → running → reporting → succeeded | failed

Side states:
- `waiting_dependency`: asked for a package; resumes when it's added.
- `blocked_on_you`: an escalation or proposal needs me.
- `parked`: out of tries, or budget refused. It records `parked_from`.
- `cancelled`.

Every state change writes an event in the same transaction: `dispatch.ready`, `dispatch.started`, `dispatch.parked`, `attempt.started`, `attempt.ended`. After Canon's dispatch table is the source of truth for every allowed move.

## Attempts
- **Kinds:** `initial`, `retry_1`, `retry_2`, `retry_3`, `fix`, `rework`, `resume`, `infra_restart`.
- **Outcomes:** `passed`, `failed`, `capped`, `budget_parked`, `killed`, `crashed`, `infra_lost`.
- **Before landing:** the retry ladder. Retry 1 starts from the last checkpoint commit. Retries 2 and 3 start from the module's build base commit. Retry 3 is a single attempt.
  - A review finding before landing gets a `fix` attempt from the module's last attempt commit (at most 2 rounds).
- **After landing:** `rework` from the current branch head (2 tries per finding). Never the ladder.
- **Free retries:** `infra_lost`, `resume` and `infra_restart` never use up a ladder step.
- **Caps:**
  - Each attempt is capped at $4 and 60 minutes. Hitting the cap ends it as `capped`, which counts as a ladder failure.
  - The model proxy reserves each request's maximum cost first. If the module budget ($15) or mission budget ($150) can't cover it, the attempt ends as `budget_parked`. That parks the dispatch and uses no ladder step.

## The room and credentials
- **One fresh room per attempt:** Docker plus gVisor, no model key, no client write token, egress only through the proxies.
- **Branches:** the attempt clones over HTTP. It can read the mission's branches and push only its own branch `mission/<id>/<module>/<role>-a<n>`. It never force-pushes.
- **Tokens:** dispatch, git and proxy tokens live in `credentials`. They last the cap time plus 10 minutes, and the reaper revokes them when the attempt ends.

## What the agent can call (host tool server, `/api/agent/*`)
Every call is scoped to the token's dispatch and role:
- completion report (`reports`);
- findings (reviewers only);
- dependency requests (at most 3 new packages per dispatch);
- escalations (test disputes, test changes, suppressions, contract changes);
- progress notes;
- `kb-search` (knowledge for this client, this stack, and global).

File and shell tools run inside the room.

## How it's judged (Gate 3, per role, in a fresh check room with no agent)
- **build:** `avel check` passes and the locked tests pass.
- **test-unit and test-e2e:** the new tests compile, and they fail on the start commit.
- **reviewers:** the report matches the schema, and every finding has a citation that resolves.

## Where it lives
- **Tables:**
  - `dispatches`, plus its versioned `task_docs` (a re-render adds a version and never overwrites);
  - `attempts` and `completion_reports`;
  - `rooms` and `credentials`;
  - `budget_reservations`, `dependency_requests` and `skill_loads`;
  - `agent_traces` (telemetry, kept 30 days).
- **Routes:**
  - `GET /api/missions/{missionId}/dispatches`
  - `GET /api/dispatches/{dispatchId}`, which returns the task doc versions, attempts and room
  - `POST /api/dispatches/{dispatchId}/overrides`
- **Live view:** the event stream (`GET /api/events/stream`) and the trace stream (`GET /api/traces/stream?attemptId=`).

## Rules that never bend
1. Only the factory decides to start a dispatch; the runner carries it out.
2. Only the integrator moves the mission branch.
3. Nothing a receipt depends on is deleted. A cancelled dispatch is a state, not a missing row.
4. Every dollar an attempt spends goes through the model proxy and is recorded against it.
