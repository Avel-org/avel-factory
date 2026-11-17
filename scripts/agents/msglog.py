#!/usr/bin/env python3
"""The message log for CR-37: every message OSA sends to or receives from a session, kept outside git.

  scripts/agents/msglog.py sent --to <name> [--ticket T-B1]        the text on stdin
  scripts/agents/msglog.py received --from <name> [--ticket T-B1]  the text on stdin
  scripts/agents/msglog.py hook                                    PostToolUse on SendMessage (OSA's seat)

Each entry is appended to <git common dir>/avel/messages/<lane>-<sprint>-<ticket>.md, with the time,
the direction, the other session and the full text. The ticket is --ticket, or else the first ticket
ID in the text; its lane and sprint come from the plan that holds it. A message with no ticket goes to
general.md. Nothing here is ever committed (CR-37 safeguard 1).

The hook logs OSA's outgoing messages by itself, and only in OSA's seat ($AVEL_SEAT is OSA). OSA logs
each message it receives with `received`, since an incoming message isn't a tool call. The hook never
fails a call: every error is swallowed.
"""

import argparse
import fcntl
import glob
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

TICKET = re.compile(r"\bT-[A-Z]\d+\b")


def repo_root():
    here = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    out = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=here, capture_output=True, text=True, timeout=5)
    return out.stdout.strip() if out.returncode == 0 else here


def common_dir(root):
    out = subprocess.run(["git", "rev-parse", "--git-common-dir"], cwd=root, capture_output=True, text=True, timeout=5)
    path = out.stdout.strip() if out.returncode == 0 else ".git"
    return path if os.path.isabs(path) else os.path.normpath(os.path.join(root, path))


def where(root, ticket):
    """(lane, sprint) of the plan that holds this ticket, or None."""
    pattern = re.compile(r'(?m)^\s*id\s*=\s*"' + re.escape(ticket) + r'"')
    for plan in sorted(glob.glob(os.path.join(root, "docs", "agent-dispatch", "*", "sprint-*", "plan.toml"))):
        try:
            with open(plan, encoding="utf-8") as f:
                if pattern.search(f.read()):
                    parts = plan.split(os.sep)
                    return parts[-3], parts[-2]
        except OSError:
            continue
    return None


def append(direction, other, text, ticket=None, root=None):
    root = root or repo_root()
    ticket = ticket or (TICKET.search(text).group(0) if TICKET.search(text) else None)
    found = where(root, ticket) if ticket else None
    name = f"{found[0]}-{found[1]}-{ticket}.md" if found else (f"{ticket}.md" if ticket else "general.md")
    folder = os.path.join(common_dir(root), "avel", "messages")
    os.makedirs(folder, exist_ok=True)
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    arrow = f"OSA → {other}" if direction == "sent" else f"{other} → OSA"
    entry = f"## {stamp} · {arrow} ({direction})\n\n{text.rstrip()}\n\n"
    path = os.path.join(folder, name)
    with open(path, "a", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.write(entry)
    return path


def hook():
    if os.environ.get("AVEL_SEAT", "").upper() != "OSA":
        return
    data = json.load(sys.stdin)
    if data.get("tool_name") != "SendMessage":
        return
    ti = data.get("tool_input") or {}
    text = ti.get("message")
    if not isinstance(text, str):
        text = json.dumps(text, ensure_ascii=False)
    append("sent", str(ti.get("to") or "?"), text)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "hook":
        try:
            hook()
        except Exception:
            pass
        return
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sent")
    s.add_argument("--to", required=True)
    s.add_argument("--ticket")
    r = sub.add_parser("received")
    r.add_argument("--from", dest="sender", required=True)
    r.add_argument("--ticket")
    a = ap.parse_args()
    text = sys.stdin.read()
    if not text.strip():
        sys.exit("msglog.py: no message text on stdin")
    other = a.to if a.cmd == "sent" else a.sender
    print(append(a.cmd, other, text, a.ticket))


if __name__ == "__main__":
    main()
