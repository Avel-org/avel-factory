# The dispatch kit (Phase 1)

Nov 5, 2026 · @javaris

The factory's dispatch, built early (CR-16 item 3). A sprint's plan goes in, and agent-dispatch's package comes out. You start agents from that package and never paste a prompt. Step 8 hardens the same renderer and templates into the `factory` module's renderer: byte-identical output, golden tests and the full Gate 1.

| Piece | What it does |
| --- | --- |
| `docs/agent-dispatch/` | agent-dispatch, vendored unchanged (`VENDORED.md`: source, commit, licence) |
| `docs/agent-dispatch/<team>/sprint-NN/plan.toml` | The sprint's plan. The lead writes it |
| `scripts/render.py` | Checks the plan and renders the package |
| `scripts/dispatch.sh <team>/sprint-NN` | Starts every dispatch that's ready, up to the 3 slots, and nothing while a module waits to merge |
| `scripts/agent.sh` | Opens one dispatch. It refuses a task doc that isn't committed or isn't what was rendered |
| `.claude/commands/dispatch.md` | `/dispatch <team>/sprint-NN/<task doc>`: read the task doc, follow its Activation |

## A sprint, start to finish
1. **Plan:** the lead runs `scripts/render.py --new backend/sprint-01`, then fills in `plan.toml` with you (Gate 0).
2. **Render:** `scripts/render.py backend/sprint-01`. If a check fails, it writes nothing. Read `DISPATCH.md` and the task docs, then commit the folder. Agents' worktrees are made from commits.
3. **Start:** `scripts/dispatch.sh backend/sprint-01` (add `--dry-run` first to see what would start). Run it again whenever something lands: it starts what has become ready and says what the rest are waiting for.
4. **Lock:** when a module's tests are merged, add the line from the test writer's report to `locks.md` and commit it. The next `dispatch.sh` starts the build.
5. **Merge:** the merge board (`p` in INT) shows what's READY. You merge, one module at a time, in `DISPATCH.md`'s merge order.
6. **Change something:** edit `plan.toml`, re-render, commit, and start a new attempt. Never edit a rendered file: `agent.sh` refuses it, and `render.py --check` flags it.

## What gets rendered

| File | agent-dispatch template | CR-16 kind |
| --- | --- | --- |
| `codebase-analysis.md` | playbook Phase 1 | `codebase_analysis` |
| `DISPATCH.md`: goals, done-when, chains, dispatches, territory map, order, merge order | `templates/dispatch.md` | `dispatch_md` |
| `agent-<agent>-<module>-<role>.md`, one per dispatch | `templates/agent.md` + `templates/activation.md` | `task_doc` |
| `DISPATCH-PROMPTS.md`: every activation prompt | `templates/activation.md` | `prompts_archive` |
| `MANIFEST.json`: each file's sha256, the plan's, and `packageSha256` | (CR-16 manifest) | |

Completion reports, `locks.md` and `findings/` are never rendered: the agents and you write them.

**A task doc** has agent-dispatch's seven parts, then its activation prompt as the last section (CR-16, Activation):
1. Identity
2. Context (the agent file, the codebase analysis, the sources, then the task doc itself)
3. Domain
4. Tasks and chains
5. Territory (what it may change, and every other dispatch's paths with their owner)
6. Execution protocol (by kind: build, test, contract, review)
7. Completion (the verification commands, then the report outline with the CR-10 sections: pre-flight, contract to files, deviations, limitations)

## The plan file
`scripts/render.py --new <team>/<sprint>` writes a commented starter. The fields:

- **Top:** `team`, `sprint`, `lead` (axis or zero), `step`, `title`, `goals`, `done_when` (the step plan's tests), `sources`.
- **`[commands]`:** `build` and `test` are required; `typecheck` and `lint` are optional. They run in every task doc's Part 7.
- **`[analysis]`:** `stack`, `layout`, `conventions`, `notes`, for `codebase-analysis.md`.
- **`[[chain]]`** (optional): `id`, `priority`, `title`, `vector`, `signal`, `fix`, `verify`.
- **`[[dispatch]]`:**
  - `agent`, `module`, `role`, `domain` and `territory` (globs, repo-relative). Reviewers have no territory: they write only their report and `findings/<module>-<agent>-*.md`.
  - `after`: task names that must be merged first, or `<team>/<sprint>/<task>` for another sprint.
  - `context`: `{ path, why }` entries. `chains`, `verify` and `notes` are optional.
  - **`[[dispatch.task]]`**, one or more: `title` and `verify` are required; `priority`, `current`, `required` and `expected` are optional.

## What the renderer refuses (Gate 1, by hand)
- An agent in a role it doesn't take on that team (the roster: Soap, Iyo, Atlas and Ghost build backend; Rigg tests it; Axis writes the API contract and reviews backend; and so on).
- A name that doesn't read back as `agent-<agent>-<module>-<role>` (the merge board's pattern).
- A build, test or contract dispatch with no territory, or a reviewer with one.
- A path the team never touches (backend: `apps/web/**`, `packages/contract-mock/**`; frontend: `packages/{server,db,contract}/**`), and any path in `.claude/` or `docs/agent-dispatch/`.
- Two dispatches that write the same paths. A module's builder and its test writer may share a folder: the tests are locked before the build starts, and the builder's task doc lists them as off limits.
- `after` naming a dispatch that isn't there, waiting on itself, or a loop.
- A missing title, `done_when`, `build` or `test` command, domain, task, or task `verify`.

## When a dispatch is ready (`render.py --ready`, the scheduler's rule)
Nothing waits for a wave. A dispatch starts when its own rule is met (build plan, section 3):
- **Test and contract dispatches:** once their `after` tasks are merged.
- **Builds:** once the module's tests are merged and the module is named in `locks.md`, and their `after` tasks are merged.
- **Reviews and red team:** once the module's build (or, with no build, its contract) has a completion report. They start at that attempt's result commit.
- **A dispatch with any attempt** is skipped: retries are yours, `scripts/agent.sh <team> <sprint> <task> <n+1>`.

## Changes from agent-dispatch
- **Generated, never written:** every file comes from the plan, and the manifest proves it.
- **Activation last** in each task doc, plus the prompts archive.
- **No waves and no LEAD merging:** dispatches start on their own rule, and merging is yours (the integrator's job, later).
- **Dropped** (Oct 31): the intensity protocol and the mesh-mode keywords.
- **Branches and worktrees** are `<team>/<sprint>/<task>-a<n>` and `../avel-wt/<team>-<sprint>-<task>-a<n>` (`scripts/agent.sh`), not `sprint-XX/<agent>`.
- **Test writers** follow the fail-first, then lock rule (Canon onboarding), and reviewers start from the diff.
- **Completion reports** add the CR-10 sections and a `verdict:` line, which the merge board reads.
