#!/usr/bin/env python3
"""Claude Code hook for every factory session (.claude/settings.json).

One script for four hook events. It reads the hook's JSON on stdin and:
  UserPromptSubmit  marks the session active             (event session.resumed)
  PostToolUse       heartbeat: the stall clock restarts  (no event: too frequent)
  Notification      a permission or input prompt: marks the session waiting
                    (event session.waiting); WezTerm toasts it and badges the tab
  Stop              the turn finished: marks the session idle (event session.idle),
                    and rewrites the session's cost record from its transcript

Session state: <main>/.git/avel/sessions.json, keyed by session name (AVEL_FROM:
"SOAP", "SOAP m2-build a1"). The dashboard reads it for NEEDS YOU and stalls,
and ~/.wezterm.lua reads it for toasts and tab badges.
Cost records: docs/agent-dispatch/records/costs/<session_id>.json.

Session caps (docs/agent-dispatch/avel/procedures.md, rule 4): a dispatch session
(its name ends in " a<N>") gets $4 or 60 minutes from its first prompt, whichever
comes first. Its cost is re-read from the transcript at most every 2 minutes. At
the cap the hook logs session.over_cap once, and tells the session to stop and
write its completion report: on PostToolUse it prints that to stderr and exits 2,
which Claude Code shows to the model (the tool has already run, so nothing is
blocked). It repeats every 10 minutes while the session keeps working.

A session without AVEL_FROM (not started by the control room) is ignored.
Apart from the cap message, the hook exits 0 and prints nothing.
"""
import fcntl
import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import events  # noqa: E402

PRICES = Path(__file__).resolve().parent.parent / "lib" / "prices.json"
CAP_USD = 4.0          # procedures.md rule 4
CAP_SECONDS = 3600
COST_EVERY = 120       # seconds between transcript re-reads
NUDGE_EVERY = 600
DISPATCH_RE = re.compile(r" a\d+$")


def update_state(name, change):
    """Read-modify-write sessions.json under a lock. change(entry) edits in place
    and returns the previous state."""
    path = events.state_dir() / "sessions.json"
    with open(path, "a+", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.seek(0)
        try:
            data = json.loads(f.read() or "{}")
        except ValueError:
            data = {}
        entry = data.setdefault(name, {})
        before = entry.get("state")
        change(entry)
        f.seek(0)
        f.truncate()
        f.write(json.dumps(data, indent=1, ensure_ascii=False))
    return before


def usage_by_model(transcript):
    """Token totals per model. A message's usage repeats on every streamed line
    with the same message id, so the last line per id counts once."""
    last = {}
    with open(transcript, encoding="utf-8", errors="replace") as f:
        for line in f:
            if '"usage"' not in line:
                continue
            try:
                d = json.loads(line)
            except ValueError:
                continue
            m = d.get("message")
            if d.get("type") != "assistant" or not isinstance(m, dict) or not m.get("usage"):
                continue
            last[m.get("id") or id(d)] = (m.get("model") or "unknown", m["usage"], d.get("timestamp"))
    totals, first_at, last_at = {}, None, None
    for model, u, at in last.values():
        t = totals.setdefault(model, {"input": 0, "output": 0, "cache_write_5m": 0,
                                      "cache_write_1h": 0, "cache_read": 0, "messages": 0})
        cc = u.get("cache_creation") or {}
        w5, w1 = cc.get("ephemeral_5m_input_tokens"), cc.get("ephemeral_1h_input_tokens")
        if w5 is None and w1 is None:          # no split: count it all as 5-minute writes
            w5, w1 = u.get("cache_creation_input_tokens", 0), 0
        t["input"] += u.get("input_tokens", 0)
        t["output"] += u.get("output_tokens", 0)
        t["cache_write_5m"] += w5 or 0
        t["cache_write_1h"] += w1 or 0
        t["cache_read"] += u.get("cache_read_input_tokens", 0)
        t["messages"] += 1
        if at:
            first_at = min(first_at or at, at)
            last_at = max(last_at or at, at)
    return totals, first_at, last_at


def price(totals):
    try:
        table = json.loads(PRICES.read_text())
    except Exception:
        return None, {}
    mult = table["cache_write_multiplier"]
    total, per = 0.0, {}
    for model, t in totals.items():
        p = table["models"].get(model)
        if not p:
            per[model] = None
            continue
        usd = (t["input"] * p["input"] + t["output"] * p["output"] + t["cache_read"] * p["cache_read"]
               + t["cache_write_5m"] * p["input"] * mult["5m"]
               + t["cache_write_1h"] * p["input"] * mult["1h"]) / 1_000_000
        per[model] = round(usd, 4)
        total += usd
    return round(total, 4), per


def record_cost(name, hook):
    transcript = hook.get("transcript_path")
    sid = hook.get("session_id")
    if not transcript or not sid or not os.path.isfile(transcript):
        return
    totals, first_at, last_at = usage_by_model(transcript)
    if not totals:
        return
    usd, per = price(totals)
    cwd = hook.get("cwd") or os.getcwd()
    branch = ""
    try:
        import subprocess
        branch = subprocess.run(["git", "-C", cwd, "branch", "--show-current"],
                                capture_output=True, text=True, timeout=3).stdout.strip()
    except Exception:
        pass
    rec = {
        "session_id": sid, "name": name, "branch": branch, "cwd": cwd,
        "first_at": first_at, "last_at": last_at, "updated_at": events.now_iso(),
        "tokens": totals, "cost_usd": usd, "cost_usd_by_model": per,
        "priced_with": "scripts/lib/prices.json (API-equivalent, not a subscription bill)",
    }
    d = events.records_dir() / "costs"
    d.mkdir(exist_ok=True)
    tmp = d / f".{sid}.json.tmp"
    tmp.write_text(json.dumps(rec, indent=1))
    tmp.replace(d / f"{sid}.json")


def main():
    name = os.environ.get("AVEL_FROM", "").strip()
    if not name or name == "INT":
        return
    try:
        hook = json.load(sys.stdin)
    except ValueError:
        return
    kind = hook.get("hook_event_name", "")
    now = time.time()
    subject = {"type": "session", "ref": name}

    if kind == "PostToolUse":
        dispatch = bool(DISPATCH_RE.search(name))
        cost = {}
        if dispatch:
            t = hook.get("transcript_path")
            st = {}
            update_state(name, lambda e: st.update(e))
            if t and os.path.isfile(t) and now - st.get("cost_at", 0) >= COST_EVERY:
                totals, _, _ = usage_by_model(t)
                usd, _ = price(totals)
                cost = {"cost_usd": usd or 0.0, "cost_at": now}
        nudge = []

        def beat(e):
            e["beat"] = now
            if e.get("state") == "waiting":    # a tool ran, so the prompt was answered
                e.update(state="active", since=now, msg="")
            if not dispatch:
                return
            e.setdefault("started", now)
            e.update(cost)
            usd, mins = e.get("cost_usd", 0.0), (now - e["started"]) / 60
            if usd >= CAP_USD or mins >= CAP_SECONDS / 60:
                first = "capped" not in e
                if first or now - e.get("nudged", 0) >= NUDGE_EVERY:
                    e.setdefault("capped", now)
                    e["nudged"] = now
                    nudge.append((first, usd, mins))
        update_state(name, beat)
        if nudge:
            first, usd, mins = nudge[0]
            if first:
                events.emit("session.over_cap", actor=name, subject=subject,
                            data={"cost_usd": round(usd, 2), "minutes": round(mins)})
            return (f"Session cap reached: ${usd:.2f} and {mins:.0f} minutes against the cap of "
                    f"${CAP_USD:.0f} or {CAP_SECONDS // 60} minutes (docs/agent-dispatch/avel/procedures.md, rule 4). "
                    "Stop starting new work. Commit what is done, write your completion report as Part 7 of "
                    "your task doc says (status PARTIAL if the work isn't finished, with what is left), "
                    "commit it, tell INT, and end. The next attempt starts from your report, not from this session.")

    elif kind == "UserPromptSubmit":
        def active(e):
            e.update(state="active", since=now, beat=now, msg="", session_id=hook.get("session_id"))
            if DISPATCH_RE.search(name):
                e.setdefault("started", now)
        if update_state(name, active) != "active":
            events.emit("session.resumed", actor=name, subject=subject)

    elif kind == "Notification":
        msg = (hook.get("message") or "").strip()
        ntype = hook.get("notification_type") or ""
        # "Claude is waiting for your input" after 60s idle is not a blocker:
        # Stop already marked the turn done. Permission prompts are.
        idle_prompt = ntype == "idle_prompt" or "waiting for your input" in msg.lower()
        state = "idle" if idle_prompt else "waiting"

        def wait(e):
            if state == "idle" and e.get("state") == "idle":
                return
            e.update(state=state, since=now, msg=msg[:200])
        before = update_state(name, wait)
        if state == "waiting" and before != "waiting":
            events.emit("session.waiting", actor=name, subject=subject,
                        data={"message": msg[:200], "type": ntype or "notification"})

    elif kind == "Stop":
        def idle(e):
            e.update(state="idle", since=now, beat=now, msg="")
        if update_state(name, idle) != "idle":
            events.emit("session.idle", actor=name, subject=subject)
        record_cost(name, hook)


if __name__ == "__main__":
    try:
        cap = main()
        if cap:
            print(cap, file=sys.stderr)
            sys.exit(2)
    except Exception as e:  # never block a session
        try:
            with open(events.state_dir() / "hook-errors.log", "a") as f:
                f.write(f"{events.now_iso()} {os.environ.get('AVEL_FROM', '?')}: {e!r}\n")
        except Exception:
            pass
    sys.exit(0)
