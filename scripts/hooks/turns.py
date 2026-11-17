#!/usr/bin/env python3
"""Claude Code hook: the turn limit for an interactive builder or checker session (CR-37, Build rules D2).

Called from .claude/settings.json as:
  turns.py pre    PreToolUse   refuse the call once the session is out of turns
  turns.py post   PostToolUse  warn the session in its last 5 turns

Only active when $AVEL_TURN_LIMIT is set, which scripts/agent.sh does for every dispatch; a lead,
OSA or a hand-started session is never capped by it. A turn is one assistant message that calls a
tool, counted from the hook input's transcript (the unit --max-turns counts in print mode).

  turns <  limit - 5   allowed
  limit - 5 .. limit   allowed, with a warning after each call: finish the chain and write the report
  limit .. limit + 5   grace: only writing $AVEL_REPORT, `git add`/`git commit`, and messaging OSA
  limit + 5 and on     every call is refused

`timeout --foreground` in agent.sh stays the backstop. A hook must never stop a session by accident:
if the transcript can't be read, the call is allowed and the problem is logged to
<git common dir>/avel/logs/turns.log.
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

WARN = 5
GRACE = 5
REPORT_TOOLS = {"Write", "Edit", "MultiEdit"}
GIT_ONLY = re.compile(r"^\s*git\s+(add|commit)\b[^;|&`$<>]*(\s*&&\s*git\s+(add|commit)\b[^;|&`$<>]*)*\s*$")


def log(problem, cwd):
    try:
        out = subprocess.run(["git", "rev-parse", "--git-common-dir"], cwd=cwd, capture_output=True,
                             text=True, timeout=5)
        common = out.stdout.strip()
        if out.returncode != 0 or not common:
            return
        if not os.path.isabs(common):
            common = os.path.normpath(os.path.join(cwd, common))
        folder = os.path.join(common, "avel", "logs")
        os.makedirs(folder, exist_ok=True)
        with open(os.path.join(folder, "turns.log"), "a") as f:
            stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
            f.write(f"{stamp} {os.environ.get('AVEL_SEAT', '?')}: {problem}\n")
    except Exception:
        pass


def count_turns(path):
    """Assistant messages that call a tool. A message's blocks may be written as several lines that
    share its id, so ids are counted once."""
    ids, anonymous = set(), 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            if entry.get("type") != "assistant":
                continue
            msg = entry.get("message") or {}
            content = msg.get("content")
            if not isinstance(content, list) or not any(
                    isinstance(b, dict) and b.get("type") == "tool_use" for b in content):
                continue
            if msg.get("id"):
                ids.add(msg["id"])
            else:
                anonymous += 1
    return len(ids) + anonymous


def grace_allows(tool, tool_input, report):
    if tool == "SendMessage":
        return True
    if tool in REPORT_TOOLS:
        target = tool_input.get("file_path") or ""
        return bool(report) and os.path.realpath(target) == os.path.realpath(report)
    if tool == "Bash":
        return bool(GIT_ONLY.match(tool_input.get("command") or ""))
    return False


def decide(mode, hook, limit, report):
    """The hook's JSON output for this call, or None to say nothing."""
    turns = count_turns(hook["transcript_path"])
    if mode == "post":
        if limit - WARN <= turns < limit:
            left = limit - turns
            return {"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext":
                    f"{left} turn{'s' if left != 1 else ''} left of {limit} (CR-37): finish the chain you're on, "
                    "write your completion report, commit it and stop."}}
        return None
    if turns < limit:
        return None
    if turns < limit + GRACE and grace_allows(hook.get("tool_name", ""), hook.get("tool_input") or {}, report):
        return None
    if turns < limit + GRACE:
        why = (f"Turn limit reached ({turns} of {limit}, CR-37). Only these are allowed now: writing your report at "
               f"{report or 'your report path'}, `git add` and `git commit` of it, and messaging OSA that you stopped on "
               "your turn limit, with the status of the chain you were on (K1).")
    else:
        why = (f"Turn limit and its {GRACE} grace turns are used up ({turns} of {limit}, CR-37). The session is over: "
               "every call is refused. OSA and the lead read your report.")
    return {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                   "permissionDecisionReason": why}}


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    raw = os.environ.get("AVEL_TURN_LIMIT", "")
    if mode not in ("pre", "post") or not raw:
        return
    cwd = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    try:
        limit = int(raw)
        hook = json.load(sys.stdin)
        out = decide(mode, hook, limit, os.environ.get("AVEL_REPORT", ""))
    except Exception as e:  # never block a session because the hook failed
        log(f"{mode}: allowed, couldn't count turns: {type(e).__name__}: {e}", cwd)
        return
    if out:
        print(json.dumps(out))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
