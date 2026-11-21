# CR-46: Sessions that survive and agents that don't loop

Nov 20, 2026 · drafted by OSA at Javaris's request (the repo-fixes work order, Part B) · changes `Build rules.md` D1, D2, D4, D5, D7, K2 and L3, CR-36 condition 7, `scripts/agents/limits.json`, `scripts/agent.sh`, `scripts/agents/lane.sh`, `scripts/agents/kit.py`, `scripts/hooks/turns.py`, `scripts/render.py`, `.claude/settings.json`, `.claude/commands/dispatch.md`, the identity files' "Learned" sections and `tools/repo-checks/src/check-locks.ts`

**Accepted, every decision with OSA's recommendations** (Javaris, Nov 20, to OSA: "i approve all, go with your recommendations"). So:
- B1 keeps D2's cost column as it is: recorded, not enforced, on the Claude plan.
- B3 turns on auto-merge only after a passing review, and adds the push guard.
- B4 takes the H6 and CR-36 condition 7 exemptions for `.agents/memory/`.
- B6 keeps K2's two failed attempts, and a resume isn't an attempt.
- D5 takes the new wording.

Each decision's code landed with its doc edits on `chore/speed-audit`, one commit per decision.

## In short

- **The problem:**
  - Sessions get cut off before they finish. The 120-minute limit is shorter than the median ticket, about 3.3 hours, and a refused tool call at turn 150 looks like a drop.
  - A crashed session can't be resumed: D1 says nothing is resumed.
  - Agents loop on the same failure, and finish with checks red.
  - Every identity file's "Learned" section is still empty after 23 tickets, because adding a lesson takes its own reviewed PR.
- **What's already done (Part A, branch `chore/speed-audit`, no rule change):** CLAUDE.md loads AGENTS.md (A1), and a fresh worktree builds after install (A2). Worktrees stay until their ticket merges (A3). Every seat runs inside tmux (A4). One shared Postgres serves every checkout (A5), and test databases are template clones (A6). The turn hook reads only new bytes (A9), and the allowlist is wider (A10). Turborepo runs build and typecheck (A11).
  - The full suite went from 132–144 s to 92–98 s, with all 1,112 tests passing.
  - Three extra worktrees add no Postgres containers. Before A5, each added a 512 MB container.
- **What this CR decides:** the six rule changes A can't make alone (B1 to B6). B7 is a pointer to CR-47.
- **Prerequisites already in place:** B2 needs A3's kept worktrees. MIOSA needs A3 and B2, because it stops idle machines.

## Decisions

### B1. Limits that don't kill working sessions

- **What:**
  - In `limits.json`, `agent_session.minutes` goes from 120 to 360, and `turns` from 150 to 400.
  - `turns.py` warns from `limit - 20` (now `limit - 5`). It allows grace (the report, its commit and a message to OSA) up to `limit + 20` (now `+ 5`), and refuses only after that.
  - Headless runs keep `--max-turns`.
- **Why:** the median ticket takes about 3.3 hours. At 120 minutes, `timeout` ends a session that's still working, and the next attempt starts over. That costs more than letting the session finish.
- **Touches:**
  - Build rules D2: its table, and the sentence on the hook's 5 and 5 turns;
  - `limits.json`, including its `_note`;
  - `turns.py`: `WARN` and `GRACE`, and its docstring.
- **Tests:** `scripts/test_hooks.py`'s warning and grace tests at the new bounds: a warning at 380 of 400, grace through 420, refusal at 421.
- **Open point:** D2's cost column ($4, or $8 on Opus) doesn't change. A 6-hour Opus session will pass $8. On the Claude plan that cap is recorded, not enforced (`limits.json` note), so nothing stops the session, but the digest will show sessions over their cap. **Javaris: keep the cost cap, raise it, or drop it for the plan?**

### B2. Resume a crashed attempt

- **What:**
  - D1's "No resuming" becomes: "A session that crashed or was cut off is resumed as the same attempt. A new attempt only follows a lead's review."
  - New: `scripts/agent.sh --resume <lane> <sprint> <doc>`. It:
    1. finds the doc's latest row in `attempts.jsonl`;
    2. requires the state `stopped`, no report, and its worktree still there (A3);
    3. takes the seat slot (B7) and writes the running marker under the start lock;
    4. appends a `{"mode": "resumed"}` row with the same attempt number;
    5. checks the branch out again in the worktree, which A3 detaches when a session ends;
    6. runs `claude --continue` with the same kit args, `--agent` and `--model`, and the first message: "You were interrupted. Check git log and git status in this worktree, then continue your task doc from where you stopped."
  - `REPORT_START` is stored at the first start in `<state>/logs/<doc>.a<n>.start`, so a resume compares against the original report.
  - `lane.sh` may resume once on its own, when a session ends with no report and its worktree has commits or changes since the base. After that one try, the lead decides. K2 and L3 still apply.
- **Why:** today a crash at hour 2 throws away two hours of work, and the next attempt redoes it from the task doc. Kept worktrees (A3) and tmux (A4) make the session findable. This makes it resumable.
- **Touches:**
  - Build rules D1, D4 ("each from a fresh worktree" gains "or the same worktree, resumed");
  - `agent.sh`, `lane.sh`, and `render.py` (`--state` reads a resumed row as `running`);
  - the previous OSA session's `pipeline.sh` (scratchpad, not the repo) retries a crashed dispatch as a new attempt. It should call `--resume` instead.
- **Tests:** `scripts/test_render.py`, with the fake claude:
  - a session killed with no report resumes as the same attempt, with `--continue`;
  - a resume is refused for a done dispatch, for a missing worktree, and for a busy seat;
  - `lane.sh` resumes at most once.

### B3. Agents push their own ticket branch

- **What:**
  - Allow `Bash(git push origin t/:*)`, `Bash(git push -u origin t/:*)` and `Bash(gh pr create:*)`.
  - A builder pushes its ticket branch and opens the PR once its report says `done`.
  - Contract and schema PRs (I3) stay manual.
- **Why:** pushing and opening the PR is now OSA's or the lead's job, and each one is a wait. On MIOSA the sandbox can't see the laptop, so it has to push anyway.
- **Touches:**
  - Build rules D7 and H7 ("Javaris says so" becomes this standing yes, for `t/*` branches only);
  - `.claude/settings.json`;
  - `.claude/commands/dispatch.md` ("don't push");
  - the builders' identity files (`soap.md` line 25, "Push, review, or merge", and Fantem's);
  - the activation text in `render.py`, which ends "Don't push." Changing it is a render change, so the version string goes to `avel-render 4`.
- **Tests:** `test_render.py`: the activation text, and the settings that `kit.py` builds.
- **Conflict, needs a decision:** the work order also says to turn on GitHub auto-merge once the required checks pass. A ticket PR goes green before its review exists: CI runs on every PR (Build rules B4), and the checker's review comes after (B5). So auto-merge would merge unreviewed code, which breaks CR-36 condition 3 and CR-45 decision 3. **Recommendation:** no auto-merge at push. OSA turns it on with `gh pr merge --auto` only after the review's verdict is pass with no P0 or P1. That's the same gate as CR-45's standing approval, minus the wait for CI.
- **Note:** a `t/*` push pattern also matches a push of `t/<another ticket>`. A builder works in one ticket's worktree, but the allowlist can't tell. A small PreToolUse check against `$AVEL_BRANCH` would close that gap, if Javaris wants it.

### B4. Memory each agent keeps

- **What:**
  - Add `.agents/memory/<agent>.md` for each builder and checker: short lessons, one line each, at most 60 lines.
  - `kit.py` appends main's copy to the agent's prompt, under "## What you learned on earlier tickets".
  - An agent may add one line to its own file on its ticket branch, when it hits a mistake it would repeat. The line merges with the ticket's PR, so it's reviewed like code.
  - `.gitattributes` gets `.agents/memory/*.md merge=union`.
  - The lead prunes the files at each sprint's end.
  - The "Learned" sections in `.claude/agents/*.md` point at these files.
- **Why:** after 23 tickets every "Learned" section is empty. A lesson needing its own reviewed PR means no lesson is ever written.
- **Touches:** `kit.py`, `.gitattributes`, the five identity files, `Agents, identities and system prompts.md`, and two rules that would otherwise refuse the line:
  - **H6, the lock check:** a builder's commit outside its Territory fails it. `check-locks.ts` must exempt `.agents/memory/<that builder>.md`, and only one added line in it.
  - **CR-36 condition 7:** nothing under `.agents/` may merge under CR-36. As written, every ticket PR with a memory line would need Javaris's own approval. Condition 7 should carve out `.agents/memory/*.md`.
- **Tests:**
  - `tools/repo-checks`: a one-line memory addition passes the lock check; a second line, or another agent's file, fails it;
  - `test_render.py`: the kit's prompt includes main's memory file;
  - `merge.py check` treats a memory line as condition 7-clean.

### B5. "Done" means the checks pass

- **What:** add a Stop hook, `scripts/hooks/done_check.py`. It runs only when `AVEL_TURN_LIMIT` is set and the report says `status: done`.
  - It runs `pnpm typecheck`, plus `vitest related --run` on the changed files.
  - If they fail, it blocks the stop with the failing output, so the agent fixes the problem first.
  - **Loop guard:** with `stop_hook_active: true`, or after it has blocked twice in this session (counted in the state folder), it allows the stop. It then marks the report `status: stopped (checks failing)` and messages OSA.
- **Why:** a `done` report with red checks costs a review round, and then a rebuild.
- **Touches:**
  - `.claude/settings.json` (the Stop hook, with a `timeout` of 600 s, since a typecheck and the related tests can pass the default);
  - Build rules D2 or F (what `done` requires).
- **Tests:** `test_hooks.py`:
  - a failing check blocks once, then twice;
  - the third stop is allowed and marks the report;
  - `stop_hook_active` always allows;
  - no `AVEL_TURN_LIMIT` means no check.
- **Note:** `vitest related` follows imports. It misses a file a test runs as a process, like `src/main.ts` (found in A8). The hook can add the package's tests that spawn processes, or accept the gap, since CI runs everything.

### B6. Stuck detection

- **What:**
  - The PostToolUse hook keeps the last 5 failed Bash calls (exit code not 0), each as a hash of the command and the first error line.
  - When the same pair comes up 3 times, it adds: "You've hit the same failure 3 times. Stop changing code. Write your report with status stuck, the command and the error, and message OSA."
  - A cap on attempts per dispatch. After the cap, `render.py --status` shows the dispatch as `needs-javaris`, and nothing starts it again on its own.
- **Why:** an agent repeating one failing command burns turns and hides that it's stuck.
- **Touches:**
  - `turns.py`, or a new `scripts/hooks/stuck.py`, wired in `.claude/settings.json`;
  - `render.py` (`needs-javaris`);
  - a new report status `stuck`: L2 routes it to the lane's lead, and `/dispatch`'s list of stop statuses needs it.
- **Conflict, needs a decision:** the work order says "at most 3 attempts per dispatch". K2 says a ticket that fails twice isn't started a third time, and L3 says nobody retries a third time. **Recommendation:** keep K2 and L3's limit of two failed attempts, and don't count a B2 resume as an attempt, since it's the same one. Then a dispatch shows `needs-javaris` after its second failure. Three attempts would loosen K2.
- **Tests:** `test_hooks.py` (the same failure 3 times adds the message; different failures don't); `test_render.py` (`needs-javaris` after the cap, and no auto-start).

### B7. Next, as CR-47

These come after CR-46 lands:

- `features.json` and `progress.md` per sprint;
- one session per feature, instead of three per ticket;
- review at milestones;
- mixed models (checkers on Sonnet);
- MIOSA workspaces with snapshots.

### Also: D5's wording (found in A5)

D5 says `pg-local.sh` "runs one Postgres container per checkout". Since A5, it runs one shared container with one database per checkout. The rule (one database per worktree, no collisions) still holds; only the sentence is out of date. **Proposed:** "`scripts/pg-local.sh start` gives each checkout its own database on one shared Postgres container (`PG_LOCAL_SHARED=0`: a container per checkout), so two sessions' tests never collide."

## What Javaris decides

1. B1: accept it, and say what happens to the per-session cost cap (keep, raise or drop on the plan).
2. B2: accept it.
3. B3: accept it, with auto-merge turned on by OSA after the review (recommended) or at push.
4. B4: accept it, with the H6 and CR-36 condition 7 exemptions for `.agents/memory/`.
5. B5: accept it.
6. B6: accept it, with two failed attempts (K2, recommended) or three.
7. D5's wording.
