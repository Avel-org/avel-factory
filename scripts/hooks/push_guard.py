#!/usr/bin/env python3
"""Claude Code PreToolUse hook on Bash: a dispatched session pushes only its own ticket branch (CR-46 B3).

The allowlist lets `git push origin t/...` and `gh pr create` through, but it can't tell one ticket's
branch from another's. This hook can: scripts/agent.sh exports $AVEL_BRANCH and $AVEL_KIND.

  - Only a build dispatch pushes or opens a PR; tests and review dispatches never do.
  - A push is exactly `git push [-u|--set-upstream] origin <its branch>` (or `HEAD:<its branch>`), on its
    own: no force, no delete, no other refspec, not chained after another command.
  - `gh pr create` may not name another branch with --head.

Only active when $AVEL_TURN_LIMIT is set (every dispatch); a lead, OSA or Javaris is never limited by it.
A hook that fails allows the call: GitHub's branch protection and the lock check stay the real guards.
"""

import json
import os
import re
import shlex
import sys

PUSH = re.compile(r"(^|[;&|`(]\s*|\s)git\s+push\b")
PR = re.compile(r"(^|[;&|`(]\s*|\s)gh\s+pr\s+create\b")


def deny(why):
    return {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                   "permissionDecisionReason": why}}


def decide(command, branch, kind):
    """The hook's output for this Bash command, or None to allow it."""
    pushes, prs = bool(PUSH.search(command)), bool(PR.search(command))
    if not (pushes or prs):
        return None
    if kind != "build":
        return deny("Only a build dispatch pushes or opens a PR (CR-46 B3). Commit your work to the branch; "
                    "the builder pushes it with the ticket's PR.")
    if not branch:
        return deny("$AVEL_BRANCH isn't set, so this session's ticket branch is unknown: don't push (CR-46 B3).")
    if pushes:
        try:
            words = shlex.split(command)
        except ValueError:
            words = []
        ok = words in (["git", "push", "origin", branch], ["git", "push", "-u", "origin", branch],
                       ["git", "push", "--set-upstream", "origin", branch], ["git", "push", "origin", f"HEAD:{branch}"],
                       ["git", "push", "-u", "origin", f"HEAD:{branch}"])
        if not ok:
            return deny(f"Push only your ticket branch, as its own command: `git push -u origin {branch}` "
                        "(no force, no delete, no other branch, nothing chained; CR-46 B3).")
    if prs:
        head = re.search(r"--head[= ]\s*(\S+)", command)
        if head and head.group(1).strip("'\"") != branch:
            return deny(f"Open the PR for your own branch, {branch}, only (CR-46 B3).")
    return None


def main():
    if not os.environ.get("AVEL_TURN_LIMIT"):
        return
    try:
        hook = json.load(sys.stdin)
        if hook.get("tool_name") != "Bash":
            return
        out = decide((hook.get("tool_input") or {}).get("command") or "", os.environ.get("AVEL_BRANCH", ""),
                     os.environ.get("AVEL_KIND", ""))
    except Exception:
        return
    if out:
        print(json.dumps(out))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
