#!/usr/bin/env python3
"""Claude Code hook: record this session's state for the WezTerm control room and for OSA.

Called from .claude/settings.json as:  session.py <event>
  start   SessionStart       -> active
  prompt  UserPromptSubmit   -> active
  tool    PostToolUse        -> active (a permission prompt was answered and the tool ran)
  notify  Notification       -> waiting (a prompt needs you; its message is shown in the toast)
  stop    Stop               -> idle (the turn is done)
  end     SessionEnd         -> the entry is removed

Writes <git common dir>/avel/sessions.json, shared by every worktree of the repo, keyed by the
WezTerm pane ($WEZTERM_PANE), so tools/wezterm/avel.lua can badge the right tab:
  { "<pane id>": { "name": "SOAP T-B3-build a1", "state": "waiting", "since": "...", "msg": "..." } }
The name comes from $AVEL_SEAT (set by the seat or by scripts/agent.sh).

A hook must never get in a session's way: every failure is swallowed and it always exits 0.
Nothing from the hook input is stored except the notification's message, cut to 200 characters.
"""

import fcntl
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone

STATE = {"start": "active", "prompt": "active", "tool": "active", "notify": "waiting", "stop": "idle"}
KEEP_FOR = timedelta(hours=24)


def git_common_dir(cwd):
    out = subprocess.run(
        ["git", "rev-parse", "--git-common-dir"], cwd=cwd, capture_output=True, text=True, timeout=5
    )
    if out.returncode != 0:
        return None
    path = out.stdout.strip()
    return path if os.path.isabs(path) else os.path.normpath(os.path.join(cwd, path))


def main():
    event = sys.argv[1] if len(sys.argv) > 1 else ""
    pane = os.environ.get("WEZTERM_PANE")
    if not pane or (event not in STATE and event != "end"):
        return  # not in WezTerm, or an event we don't track

    try:
        hook = json.load(sys.stdin)
    except Exception:
        hook = {}
    cwd = os.environ.get("CLAUDE_PROJECT_DIR") or hook.get("cwd") or os.getcwd()
    common = git_common_dir(cwd)
    if not common:
        return

    folder = os.path.join(common, "avel")
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, "sessions.json")
    now = datetime.now(timezone.utc)

    with open(os.path.join(folder, "sessions.lock"), "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            with open(path) as f:
                data = json.load(f)
            if not isinstance(data, dict):
                data = {}
        except Exception:
            data = {}

        # Drop entries older than a day: WezTerm reuses pane ids after a restart.
        for key in list(data):
            try:
                if now - datetime.fromisoformat(data[key]["since"]) > KEEP_FOR:
                    del data[key]
            except Exception:
                del data[key]

        if event == "end":
            data.pop(pane, None)
        else:
            entry = {
                "name": os.environ.get("AVEL_SEAT") or "CLAUDE",
                "state": STATE[event],
                "since": now.isoformat(timespec="seconds"),
            }
            if event == "notify":
                entry["msg"] = str(hook.get("message") or "")[:200]
            data[pane] = entry

        fd, tmp = tempfile.mkstemp(dir=folder, prefix=".sessions.")
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, indent=1, sort_keys=True)
        os.replace(tmp, path)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
