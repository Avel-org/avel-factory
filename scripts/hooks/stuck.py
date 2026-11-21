#!/usr/bin/env python3
"""Claude Code PostToolUseFailure hook on Bash: notice an agent repeating the same failure (CR-46 B6).

A failed Bash call (a non-zero exit; Claude Code hands the hook `error`, whose first line is
"Exit code N") is kept as a hash of the command and the first line of its output. The last 5 are
kept per session in <git common dir>/avel/logs/stuck-<session_id>.json. When the same pair is 3 of
them, the session is told to stop changing code and report `stuck`.

Only active in a dispatch ($AVEL_TURN_LIMIT is set). A hook that fails says nothing.
"""

import hashlib
import json
import os
import re
import subprocess
import sys

KEEP = 5
REPEATS = 3
MESSAGE = ("You've hit the same failure 3 times. Stop changing code. Write your report with status stuck, "
           "the command and the error, and message OSA.")


def signature(command, error):
    """A hash of the command and the first line of what it printed, after the "Exit code N" line."""
    lines = [l.strip() for l in (error or "").splitlines() if l.strip()]
    if lines and re.match(r"^Exit code \d+$", lines[0]):
        lines = lines[1:]
    first = lines[0] if lines else ""
    return hashlib.sha256(f"{' '.join(command.split())}\0{first}".encode()).hexdigest()[:16]


def state_file(cwd, session_id):
    out = subprocess.run(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], cwd=cwd,
                         capture_output=True, text=True, timeout=5)
    d = os.path.join(out.stdout.strip(), "avel", "logs")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, f"stuck-{re.sub(r'[^A-Za-z0-9_-]', '', session_id or '') or 'unknown'}.json")


def record(path, sig):
    """Adds sig to the session's last failures and returns how many of them are sig."""
    try:
        with open(path) as f:
            last = json.load(f)
    except (OSError, ValueError):
        last = []
    last = (last + [sig])[-KEEP:]
    tmp = f"{path}.{os.getpid()}.tmp"
    with open(tmp, "w") as f:
        json.dump(last, f)
    os.replace(tmp, path)
    return last.count(sig)


def main():
    if not os.environ.get("AVEL_TURN_LIMIT"):
        return
    try:
        hook = json.load(sys.stdin)
        if hook.get("tool_name") != "Bash" or hook.get("is_interrupt"):
            return
        cwd = hook.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
        command = (hook.get("tool_input") or {}).get("command") or ""
        n = record(state_file(cwd, hook.get("session_id")), signature(command, hook.get("error") or ""))
    except Exception:
        return
    if n >= REPEATS:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUseFailure", "additionalContext": MESSAGE}}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
