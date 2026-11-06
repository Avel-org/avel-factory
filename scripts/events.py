#!/usr/bin/env python3
"""The factory's event log for Phase 1: one JSON line per thing that happened.

The scripts, the dashboard and the Claude Code hooks append here, so the
operator (and later, Ghost's contract mock and the `events` module) can replay
what happened. Kinds keep entity names, as the web app's live layer does
(`attempt.started`, `message.sent`); see docs/agent-dispatch/avel/operator-tools.md.

Usage:
  scripts/events.py emit <kind> [--actor NAME] [--subject TYPE:REF] [key=value ...]
  scripts/events.py tail [-n N] [--kind K] [--actor A] [--since 10m] [--json]
  scripts/events.py watch [same filters]       follow new events (scripts/watch.sh)

The log lives in the main checkout, wherever it's written from (a worktree, a
hook, INT): docs/agent-dispatch/records/events.jsonl. Each line:
  {"seq": 12, "at": "2026-11-04T20:05:52Z", "kind": "attempt.started",
   "actor": "SOAP", "subject": {"type": "attempt", "ref": "backend/sprint-01/..."},
   "data": {...}}
seq is gapless and increasing, so a reader resumes after the last seq it saw.
"""
import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main_checkout(start=None):
    """The main checkout's path, from a worktree or the main checkout itself."""
    cwd = str(start or HERE)
    try:
        out = subprocess.run(["git", "-C", cwd, "worktree", "list", "--porcelain"],
                             capture_output=True, text=True, timeout=5).stdout
        first = out.splitlines()[0]
        if first.startswith("worktree "):
            return Path(first[len("worktree "):])
    except Exception:
        pass
    return HERE.parent


def state_dir(start=None):
    """Untracked, shared by every worktree: <main>/.git/avel/."""
    d = main_checkout(start) / ".git" / "avel"
    d.mkdir(parents=True, exist_ok=True)
    return d


def records_dir(start=None):
    d = main_checkout(start) / "docs" / "agent-dispatch" / "records"
    d.mkdir(parents=True, exist_ok=True)
    return d


def log_path(start=None):
    return records_dir(start) / "events.jsonl"


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _last_seq(f):
    f.seek(0, os.SEEK_END)
    size = f.tell()
    f.seek(max(0, size - 8192))
    for line in reversed(f.read().splitlines()):
        try:
            return int(json.loads(line)["seq"])
        except Exception:
            continue
    return 0


def emit(kind, actor=None, subject=None, data=None, start=None):
    """Append one event under a lock and return it. Never raises: logging must
    not break the script or hook that calls it."""
    try:
        path = log_path(start)
        with open(path, "a+", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            event = {"seq": _last_seq(f) + 1, "at": now_iso(), "kind": kind,
                     "actor": actor or os.environ.get("AVEL_FROM") or "operator"}
            if subject:
                event["subject"] = subject
            if data:
                event["data"] = data
            f.seek(0, os.SEEK_END)
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
            f.flush()
        return event
    except Exception as e:  # pragma: no cover
        print(f"events: couldn't log {kind}: {e}", file=sys.stderr)
        return None


def read(start=None, after_seq=0):
    try:
        with open(log_path(start), encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line)
                except ValueError:
                    continue
                if e.get("seq", 0) > after_seq:
                    yield e
    except FileNotFoundError:
        return


def parse_age(text):
    m = re.fullmatch(r"(\d+)([smhd])", text or "")
    if not m:
        raise argparse.ArgumentTypeError("use a number and s, m, h or d, e.g. 10m")
    return int(m.group(1)) * {"s": 1, "m": 60, "h": 3600, "d": 86400}[m.group(2)]


def epoch(at):
    try:
        return datetime.strptime(at, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).timestamp()
    except Exception:
        return 0.0


# Colors match the dashboard: team colors for who, gate colors for outcomes.
KIND_COLOR = {
    "attempt": 111, "message": 252, "session.waiting": 221, "session.stalled": 210,
    "session.idle": 247, "session.resumed": 247, "lock.violated": 210, "lock.overridden": 221,
}


def color_for(kind):
    for prefix in (kind, kind.split(".")[0]):
        if prefix in KIND_COLOR:
            return KIND_COLOR[prefix]
    return 252


def fmt(e, color=True):
    local = datetime.fromtimestamp(epoch(e["at"])).strftime("%H:%M:%S")
    subj = e.get("subject") or {}
    ref = subj.get("ref", "")
    data = e.get("data") or {}
    detail = data.get("text") or data.get("message") or data.get("summary") or ""
    if not detail and data:
        detail = " ".join(f"{k}={v}" for k, v in data.items() if not isinstance(v, (dict, list)))[:120]
    parts = [f"{e['seq']:>5}", local, f"{e['kind']:<18}", f"{e.get('actor', ''):<16}", ref, detail]
    line = "  ".join(p for p in parts if p != "")
    if not color:
        return line
    return f"\033[38;5;{color_for(e['kind'])}m{line}\033[0m"


def matches(e, a, since):
    if a.kind and not any(e["kind"] == k or e["kind"].startswith(k.rstrip("*").rstrip(".") + ".")
                          for k in a.kind):
        return False
    if a.actor:   # who did it, or the session it's about
        want = {x.upper() for x in a.actor}
        subj = e.get("subject") or {}
        about = subj.get("ref", "").upper() if subj.get("type") == "session" else ""
        if e.get("actor", "").upper() not in want and about not in want:
            return False
    if since and epoch(e["at"]) < since:
        return False
    return True


def cli(argv=None):
    p = argparse.ArgumentParser(prog="events.py", description="The factory's event log.")
    sub = p.add_subparsers(dest="cmd", required=True)
    pe = sub.add_parser("emit", help="append one event")
    pe.add_argument("kind")
    pe.add_argument("--actor")
    pe.add_argument("--subject", help="TYPE:REF, e.g. attempt:backend/sprint-01/agent-soap-m2-build-a1")
    pe.add_argument("data", nargs="*", help="key=value pairs")
    for name in ("tail", "watch"):
        pt = sub.add_parser(name, help="show events" if name == "tail" else "follow new events")
        pt.add_argument("-n", type=int, default=20, help="how many past events to show first")
        pt.add_argument("--kind", action="append", help="a kind or a prefix: attempt, session.waiting")
        pt.add_argument("--actor", action="append", help="an agent or tab name: what it did, or what happened to it")
        pt.add_argument("--since", type=parse_age, help="only newer than this, e.g. 30m, 2h")
        pt.add_argument("--json", action="store_true", help="raw JSON lines")
    a = p.parse_args(argv)

    if a.cmd == "emit":
        subject = None
        if a.subject:
            t, _, ref = a.subject.partition(":")
            subject = {"type": t, "ref": ref}
        data = dict(kv.split("=", 1) for kv in a.data if "=" in kv)
        e = emit(a.kind, a.actor, subject, data or None, start=Path.cwd())
        return 0 if e else 1

    since = time.time() - a.since if a.since else 0
    color = sys.stdout.isatty() and not a.json
    show = (lambda e: json.dumps(e, ensure_ascii=False)) if a.json else (lambda e: fmt(e, color))
    past = [e for e in read(Path.cwd()) if matches(e, a, since)]
    for e in past[-a.n:] if a.n else []:
        print(show(e), flush=True)
    if a.cmd == "tail":
        return 0
    last = max([e["seq"] for e in read(Path.cwd())] or [0])
    if color:
        print(f"\033[38;5;243mwatching {log_path(Path.cwd())} · Ctrl+c to stop\033[0m", flush=True)
    try:
        while True:
            time.sleep(1)
            for e in read(Path.cwd(), after_seq=last):
                last = e["seq"]
                if matches(e, a, since):
                    print(show(e), flush=True)
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    sys.exit(cli())
