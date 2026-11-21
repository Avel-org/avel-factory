#!/usr/bin/env python3
"""Claude Code hook: the turn limit for an interactive builder or checker session (CR-37, Build rules D2).

Called from .claude/settings.json as:
  turns.py pre    PreToolUse   refuse the call once the session is out of turns
  turns.py post   PostToolUse  warn the session in its last 20 turns

Only active when $AVEL_TURN_LIMIT is set, which scripts/agent.sh does for every dispatch; a lead,
OSA or a hand-started session is never capped by it. A turn is one assistant message that calls a
tool, counted from the hook input's transcript (the unit --max-turns counts in print mode).

  turns <  limit - 20   allowed
  limit - 20 .. limit   allowed, with a warning after each call: finish the chain and write the report
  limit .. limit + 20   grace: only writing $AVEL_REPORT, `git add`/`git commit`, and messaging OSA
  limit + 20 and on     every call is refused (CR-46 B1: 20 and 20, so a working session isn't cut short)

`timeout --foreground` in agent.sh stays the backstop. A hook must never stop a session by accident:
if the transcript can't be read, the call is allowed and the problem is logged to
<git common dir>/avel/logs/turns.log.

The hook runs twice per tool call, so it doesn't re-read the whole transcript each time (A9): it keeps
{offset, ids, anonymous} per session in <git common dir>/avel/logs/turns-<session_id>.json and reads
only the bytes after the offset. A transcript that shrank or no longer matches the bytes the cache was
taken from is read in full again. A cache that can't be read or written only costs that full read.
"""

import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

WARN = 20
GRACE = 20
REPORT_TOOLS = {"Write", "Edit", "MultiEdit"}
GIT_ONLY = re.compile(r"^\s*git\s+(add|commit)\b[^;|&`$<>]*(\s*&&\s*git\s+(add|commit)\b[^;|&`$<>]*)*\s*$")


def logs_dir(cwd):
    """<git common dir>/avel/logs, made if missing, or None outside a git checkout."""
    out = subprocess.run(["git", "rev-parse", "--git-common-dir"], cwd=cwd, capture_output=True,
                         text=True, timeout=5)
    common = out.stdout.strip()
    if out.returncode != 0 or not common:
        return None
    if not os.path.isabs(common):
        common = os.path.normpath(os.path.join(cwd, common))
    folder = os.path.join(common, "avel", "logs")
    os.makedirs(folder, exist_ok=True)
    return folder


def log(problem, cwd):
    try:
        folder = logs_dir(cwd)
        if not folder:
            return
        with open(os.path.join(folder, "turns.log"), "a") as f:
            stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
            f.write(f"{stamp} {os.environ.get('AVEL_SEAT', '?')}: {problem}\n")
    except Exception:
        pass


def scan(lines, ids, anonymous):
    """Adds the tool-calling assistant messages in `lines` to (ids, anonymous). A message's blocks may be
    written as several lines that share its id, so ids are counted once."""
    for line in lines:
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
    return anonymous


def count_turns(path):
    """Assistant messages that call a tool, from a full read of the transcript."""
    ids = set()
    with open(path, encoding="utf-8") as f:
        anonymous = scan(f, ids, 0)
    return len(ids) + anonymous


TAIL = 256  # the bytes before the cached offset, hashed to notice a transcript that was rewritten


def _tail_hash(f, offset):
    start = max(0, offset - TAIL)
    f.seek(start)
    return hashlib.sha256(f.read(offset - start)).hexdigest()


def count_turns_cached(path, cache_file):
    """count_turns, reading only what was appended since the cache was written. Only complete lines
    are counted and cached; a line still being written is read on the next call."""
    state = None
    try:
        with open(cache_file, encoding="utf-8") as c:
            state = json.load(c)
    except (OSError, ValueError):
        pass
    with open(path, "rb") as f:
        size = os.fstat(f.fileno()).st_size
        ids, anonymous, offset = set(), 0, 0
        if (isinstance(state, dict) and state.get("path") == path and 0 <= state.get("offset", -1) <= size
                and _tail_hash(f, state["offset"]) == state.get("tail")):
            ids, anonymous, offset = set(state.get("ids") or []), int(state.get("anonymous") or 0), state["offset"]
        f.seek(offset)
        chunk = f.read(size - offset)
        end = chunk.rfind(b"\n") + 1  # 0 when no complete line was appended
        anonymous = scan(chunk[:end].decode("utf-8", errors="replace").splitlines(), ids, anonymous)
        offset += end
        tail = _tail_hash(f, offset)
    try:
        tmp = f"{cache_file}.{os.getpid()}.tmp"
        with open(tmp, "w", encoding="utf-8") as c:
            json.dump({"path": path, "offset": offset, "tail": tail, "ids": sorted(ids), "anonymous": anonymous}, c)
        os.replace(tmp, cache_file)  # atomic, so a pre and a post hook running at once never see half a file
    except OSError:
        pass
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


def decide(mode, hook, limit, report, cache_file=None):
    """The hook's JSON output for this call, or None to say nothing."""
    path = hook["transcript_path"]
    turns = count_turns_cached(path, cache_file) if cache_file else count_turns(path)
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
        cache_file = None
        sid = re.sub(r"[^A-Za-z0-9_-]", "", str(hook.get("session_id") or ""))
        if sid:
            try:
                folder = logs_dir(cwd)
                cache_file = folder and os.path.join(folder, f"turns-{sid}.json")
            except Exception:
                cache_file = None
        out = decide(mode, hook, limit, os.environ.get("AVEL_REPORT", ""), cache_file)
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
