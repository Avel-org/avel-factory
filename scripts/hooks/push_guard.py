#!/usr/bin/env python3
"""Claude Code PreToolUse hook: a dispatched session pushes only its own ticket branch (CR-46 B3), and never
writes a sprint's locks.md (CR-50 decision 5).

The allowlist lets `git push origin t/...` and `gh pr create` through, but it can't tell one ticket's
branch from another's. This hook can: scripts/agent.sh exports $AVEL_BRANCH and $AVEL_KIND.

  - Only a build dispatch pushes or opens a PR; tests and review dispatches never do.
  - A push is exactly `git push [-u|--set-upstream] origin <its branch>` (or `HEAD:<its branch>`), on its
    own: no force, no delete, no other refspec, not chained after another command.
  - `gh pr create` may not name another branch with --head.

The lock line is the lead's (D6). A dispatch may read locks.md, but an Edit or Write of it, or a shell command
that names it other than to read it, is refused: a builder writing its own relock line would unfreeze its
locked tests, since the lock check skips a commit that touches only locks.md.

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


READS = re.compile(r"^\s*(cat|grep|rg|head|tail|less|wc|ls|diff|sed\s+-n|git\s+(show|log|diff|blame|grep|status))\b")


def locks_refusal(tool, tool_input):
    """The hook's output when this call would write a locks.md, or None."""
    why = ("A sprint's locks.md is the lead's (Build rules D6, CR-50 decision 5): a dispatch reads it and never "
           "changes it. Put the lock line your report asks for in your completion report.")
    if tool in ("Edit", "Write", "MultiEdit"):
        if (tool_input.get("file_path") or "").endswith("locks.md"):
            return deny(why)
        return None
    if tool == "Bash":
        command = tool_input.get("command") or ""
        if "locks.md" in command:
            parts = [p for p in re.split(r"&&|\|\||;|\|", command) if p.strip()]
            if not all(READS.match(p) for p in parts) or re.search(r"(^|[^>])>{1,2}\s*\S*locks\.md", command):
                return deny(why)
    return None


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
        tool, tool_input = hook.get("tool_name"), hook.get("tool_input") or {}
        out = locks_refusal(tool, tool_input)
        if out is None and tool == "Bash":
            out = decide(tool_input.get("command") or "", os.environ.get("AVEL_BRANCH", ""),
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
