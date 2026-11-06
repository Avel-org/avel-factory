<!-- Seeded from "docs/design/Roster setup and sessions.md" (Nov 4, 2026), section "Sessions". Keep the two in step; matches claude/Roster.md. -->

# Sessions

While the factory is built by hand, each Claude Code session stands in for one thing the factory will do itself. Keep them separate for the same reasons the factory does: fresh context per attempt, no agent grading its own work, and one writer per branch.

## The four kinds of session

| Session | Where it runs | How many | What it does | What it never does |
| --- | --- | --- | --- | --- |
| **Lead** (one per team) | The main checkout, on `main` | 1 backend (Axis), 1 frontend (Zero) | Plans the sprint with you, writes the contract slice or UI contract, runs the renderer to produce the dispatch package | Builds a module, reviews its own contract |
| **Agent** (one per dispatch) | Its own worktree, on its attempt branch | One per running dispatch, up to 6 at once across both teams | Works one task doc: tests, a build, or a review | Takes a second dispatch, pushes, edits outside its territory |
| **Review** | Its own worktree, checked out at the builder's result commit | One per reviewer per module | Writes the review report and findings | Edits code |
| **Integration** (you, or your own session) | The main checkout | 1 | Merges in dependency order, runs the full tests after each merge, records decisions | Merges without green tests |

## Opening an agent session
1. **Generate first, never paste:** the lead session renders the package into `docs/agent-dispatch/<team>/sprint-NN/`, and you approve it (Gate 0, then the Gate 1 checklist).
2. **Start what's ready:** `scripts/dispatch.sh <team>/sprint-NN` runs `scripts/agent.sh` once for each dispatch whose start rule is met (tests first, the build once its tests are locked, reviews once the build has its report), up to the 6 slots. Run it again whenever something lands. The kit is described in `docs/agent-dispatch/avel/dispatch-kit.md`. Each dispatch gets its worktree and branch, and Claude Code starts in its own WezTerm tab as the agent (`claude --agent <name>`) with `/dispatch <team>/sprint-NN/<task doc>`.
   - **For one agent:** `scripts/agent.sh <team> sprint-NN <task doc> [attempt] [start-commit]`. A retry is the same command with the next attempt number. A reviewer gets the builder's result commit as its start commit.
3. **In order:** test writers first (Rigg, Fenn). Lock their tests (`locks.md`), then start the builder. Reviewers start once the builder's report is in.
4. **One session is one attempt.** A retry is a new session in a fresh worktree, started from the right commit for its ladder step, given only the error output, never the old transcript. Don't continue a failed session.

## Good practices
- **Fresh context, always.** No `/clear` and no reusing a session for different work. If an attempt runs long, the agent finishes its current chain, commits a checkpoint and reports, and the next attempt resumes from that commit.
- **Fix the page, not the chat.** When an agent gets something wrong that it could get wrong again, add one line to the **Learned** section of `.claude/agents/<name>.md` while you route the finding, and commit it with the merge. Next attempt, the rule is already there.
- **The task doc is the whole briefing.** If you find yourself typing extra instructions into an agent session, the task doc is missing something: fix the plan, re-render, and start a new attempt. Your corrections then end up in the record.
- **Reviews in their own sessions.** Never ask a builder's session to review its own work, and don't run a reviewer as a subagent of the builder's session: the builder would decide what the reviewer sees.
- **Subagents only where the task doc allows them,** inside the same cap.
- **Permissions on.** Keep Claude Code's permission prompts on for Bash. The repo's `.claude/settings.json` allows the build, test and lint commands and local git commits, and denies `git push`, force operations and network fetches. Never run agent sessions with permission checks skipped.
- **Keep your own credentials out.** Once the factory and `avel login` exist, don't sign in to the CLI inside agent worktrees: an agent could use your session to approve something. Your CLI session belongs to the integration session only.
- **Record as you go.** At the end of each session, write its `/cost` to `cost.md`. Every decision goes in `decisions.md`, and every finding is a file.
- **Six at a time.** Match the factory's limit: at most 6 dispatch sessions (agent and review, the tabs ending in `a<attempt>`) across both teams. INT and the standing crew tabs don't count. `scripts/agent.sh` refuses a seventh. More sessions means more merge conflicts and more of your attention.
- **Close cleanly.** After a module lands, remove its worktree (`git worktree remove`). Keep the branch until the sprint closes.

## WezTerm layout
Everything runs in one WezTerm workspace, `avel`, opened with **Ctrl+a, then v** inside WezTerm, or `scripts/control-room.sh` from any shell. It starts **INT**, the operator's tab: the dashboard (`scripts/dashboard.py`) on top, and under it **INT**, your own Claude session (`.claude/agents/int.md`). From INT you message the crew (`scripts/tell.sh`) and start dispatches (`scripts/agent.sh`), and the leads message you back there with `scripts/tell.sh INT "..."` (shown as `[from AXIS] ...`). The dashboard shows every session by team with its status and for how long, the dispatch tabs with their branch and last commit, and the latest events. Keys: ↑↓ or j/k, 1–9, Enter opens zoomed, g opens in its grid, t tells (`scripts/tell.sh`), v reopens closed team tabs, a rearranges, q quits to a shell. **p** switches to the merge board (`scripts/merge_board.py`): every module in the sprint folders with its attempt branches (the local stand-in for PRs), reports, reviews, locks and open findings, marked READY, IN REVIEW, BUILDING, TESTS, WAITING or MERGED, with the merge checklist for the selected module. There, Enter opens the diff in a new tab, o opens the report, and m opens a merge tab with `git merge --no-ff <branch> && pnpm test` typed but not run. Then the whole roster in team tabs, each agent in its own pane, each running as its agent in its own worktree, `../avel-wt/crew-<agent>` on branch `crew/<agent>` (Axis and Zero stay in the main checkout, on `main`): **LEADS** (Axis, Zero), **BACKEND** (Soap, Iyo over Atlas, Rigg), **GHOST**, **FRONTEND** (Nemi, Fantem over Leon, Fenn) and **REVIEW** (Brennan, Zane over Leah, Breach). At most 2 panes across and 4 per tab, and the window opens maximized, so no session is squished. **Ctrl+a, then a** lists every session with its team and status (● working, ○ idle); pick one and it opens zoomed. **Ctrl+a, then z** zooms the current pane to the full tab and back; **Ctrl+a, then h/j/k/l** moves between panes, and the panes you're not in are dimmed. It also opens by itself when a WezTerm shell enters the repo (a `PROMPT_COMMAND` hook in `~/.bashrc`), and every new WezTerm shell starts in the repo (`default_cwd` on the `WSL:Ubuntu` domain in `.wezterm.lua`), so opening WezTerm opens the control room. Pressing it again with the workspace open adds back any team tab you closed. `scripts/worktrees.sh crew` makes any missing crew worktree from `main` each time the control room opens, and fast-forwards a clean crew branch with no commits of its own to `main`, so the crew starts from the latest agent files and docs. Dispatch attempts whose worktree is still there reopen as their tabs, resuming their last conversation (`scripts/worktrees.sh dispatch`), so a restart loses nothing. Worktrees are made from commits: commit `.claude/`, `scripts/` and `docs/` first, or the worktrees get no agent files (`scripts/doctor.sh` checks). Real work still goes through dispatch tabs, each in its own worktree. `scripts/agent.sh` adds one tab per dispatch, titled `<AGENT> <module>-<role> a<attempt>` (for example `SOAP m2-build a1`). Tabs are colored by team: leads yellow, backend steel blue, frontend sage green, Ghost teal, reviewers violet, INT amber, dispatch red (the "Rinnegan" palette; the dashboard uses the same colors). The WezTerm config holds the roster's names and colors; `Ctrl+a t` lists the tabs.
- **Opening an agent without typing the script:** **Ctrl+a, then s** lists the other agents. Pick one, then one of its task docs from the sprint folders (with its next attempt number), and it opens through `scripts/agent.sh`, with the same worktree, tab, color and limit of 6. A review or red-team doc asks for the builder's result commit first. Errors, such as no task doc yet or 6 already open, show as a notification.

## Messages between sessions
`scripts/tell.sh <name> "<message>"` types one line into another session (a crew pane such as `AXIS`, or a dispatch tab), signed with the sender (`[from AXIS] …`), and appends it to `docs/agent-dispatch/messages.md`.
- **Only when you say so.** Sessions message the crew only when you ask, and each such send asks for your approval. The one exception is a report to you: `scripts/tell.sh INT "..."` is in the allow list of `.claude/settings.json`, so a lead can tell you it's blocked, needs a decision or is done without waiting on a prompt.
- **Coordination only:** start, stop, commit a checkpoint and report, "tests locked at <sha>", "your reviewer is done". A message never carries new instructions or scope. If an agent needs to know something its task doc doesn't say, the task doc is missing it: fix the plan, re-render, and start a new attempt.
- **No messages to reviewers about the builder's work.** A reviewer sees only its task doc and the commit, so the builder never decides what the reviewer sees.

## A typical backend sprint (one build step)
1. **Lead session (Axis):** `contract.md` for the step, then Brennan reviews it in a review session. The renderer writes the package.
2. **Agent session (Rigg):** the done-when tests, which must fail. You lock them.
3. **Agent sessions (Soap, Iyo or Atlas),** one per module, in parallel where territories and dependencies allow.
4. **Review sessions:** Axis and Brennan on every module; Zane, Leah and Breach where a trigger applies.
5. **Integration session:** findings decided, modules merged one at a time with the full tests after each, the step closed with `SPRINT-ASSESSMENT.md`.

The frontend runs the same way: Zero leads, Fenn writes the tests, and Nemi, Fantem, Leon and Ghost build.

- **Operator tools:** NEEDS YOU, the event log and `scripts/watch.sh`, stalls, toasts and tab badges, cost records, `scripts/doctor.sh`, the locked-test check and the Enclosure Grid theme (Ctrl+a, then e) are in [operator-tools.md](operator-tools.md).
