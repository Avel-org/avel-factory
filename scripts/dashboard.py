#!/usr/bin/env python3
"""The avel control room dashboard: the top of the INT tab.

The INT tab is the operator's: this dashboard on top, and under it INT, the
operator's own Claude session (.claude/agents/int.md), which sends messages to
the crew and starts dispatches, and where the crew's messages to INT land.

NEEDS YOU comes first, as the web app's Decisions home does: sessions waiting
on a permission prompt, stalled sessions (working with no tool activity for 10
minutes, the factory's stall rule), modules ready to merge, locked tests that
an attempt changed, open findings, and reviews waiting to start. Enter on one
opens the session, or the merge board at that module.

Then every session in the "avel" WezTerm workspace, in roster order and grouped
by team tab, with its status (working, idle, no Claude), for how long, and the
open dispatch tabs with their branch and last commit. The latest events
(scripts/watch.sh) sit at the bottom.

Session state comes from the Claude Code hooks (scripts/hooks/session.py) in
.git/avel/sessions.json; a session started before the hooks existed shows no
waiting or stall until it restarts.

Keys: up/down or j/k select · 1-9 jump to a row · Enter open zoomed ·
g open in its grid · t tell (scripts/tell.sh) · v reopen missing team tabs ·
a rearrange the crew · p merge board · r refresh · q quit

p switches to the merge board (scripts/merge_board.py): every module in the
sprint folders with its attempt branches (the local stand-in for PRs), reports,
reviews, locks and findings, and whether it's ready to merge. There, Enter
opens the selected diff in a new tab, o opens the report, and m opens a merge
tab with the command typed but not run. p goes back.

Usage: scripts/dashboard.py   (scripts/control-room.sh and Ctrl+a v start it)
Keep the crew in step with scripts/control-room.sh and the WezTerm config.
"""
import curses
import json
import locale
import os
import re
import subprocess
import time
from pathlib import Path

import events
import merge_board

SCRIPTS = Path(__file__).resolve().parent
REPO = Path(os.environ.get("AVEL_REPO") or SCRIPTS.parent)   # AVEL_REPO: point at another checkout
REFRESH = 2.0          # seconds between WezTerm polls
GIT_REFRESH = 10.0     # seconds between git lookups for dispatch tabs
SLOTS = 6              # the factory's limit on dispatch sessions
STALL = 600            # seconds without tool activity before a working session is stalled

# Team tabs in roster order: (tab, team color key, [(agent, role)]).
GROUPS = [
    ("LEADS", "leads", [("AXIS", "backend lead: api contract"), ("ZERO", "frontend lead: ui contract")]),
    ("BACKEND", "backend", [("SOAP", "builds api, data"), ("IYO", "builds services, ai"),
                            ("ATLAS", "builds infra, docs"), ("RIGG", "backend tests")]),
    ("GHOST", "both", [("GHOST", "builds data layers, cli (both teams)")]),
    ("FRONTEND", "frontend", [("NEMI", "builds design system"), ("FANTEM", "builds shared components"),
                              ("LEON", "builds one module"), ("FENN", "frontend tests")]),
    ("REVIEW", "review", [("BRENNAN", "spec review"), ("ZANE", "security review"),
                          ("LEAH", "a11y and performance review"), ("BREACH", "red team")]),
]
TEAM_OF = {"INT": "you", "DASHBOARD": "you"}
for _tab, _team, _members in GROUPS:
    for _name, _ in _members:
        TEAM_OF[_name] = _team
ROLE_OF = {n: r for _, _, m in GROUPS for n, r in m}
DISPATCH_RE = re.compile(r"^([A-Z]+) (\S+) a(\d+)$")   # "SOAP m2-build a1"

# The "Rinnegan" palette from ~/.wezterm.lua (AVEL_TEAM_COLOR and P), as the
# nearest xterm-256 colors. Keep in step with the WezTerm tab colors:
#   you #e0a46d amber, leads #e8cb85 yellow, backend #9cb0d4 steel blue,
#   frontend #a9c8a4 sage, both #a9cdd2 teal, review #c4b8ea violet,
#   dispatch/warn #e0555e red, text #c9c9d1 silver, dim #6e6e7a.
COLORS = {
    "you": 179, "leads": 186, "backend": 110, "frontend": 151, "both": 152, "review": 183,
    "dispatch": 167, "working": 186, "idle": 247, "shell": 243, "dim": 243, "text": 252,
    "title": 179, "warn": 203,
    # Gate colors from the Enclosure Grid design library (dark): team colors say
    # who, gate colors say whether the work passed. pass #68d3a0, warn #f2c662,
    # block #f6958b, pending #b9bac1, accent #74b8fc (in progress).
    "pass": 79, "gwarn": 221, "block": 210, "pending": 250, "accent": 111,
    "READY": 79, "IN REVIEW": 221, "BUILDING": 111, "TESTS": 111, "WAITING": 250, "MERGED": 79,
    "ok": 79, "no": 210,
}
STATUS = {"working": ("●", "working"), "idle": ("○", "idle"), "shell": ("·", "no claude")}


def wez(*args, timeout=5):
    return subprocess.run(["wezterm.exe", "cli", *args], capture_output=True, text=True, timeout=timeout)


def status_of(title):
    """Claude Code titles its pane "✳ NAME" when idle and a spinner glyph while working."""
    if not title:
        return "shell"
    if title[0] == "✳":
        return "idle"
    if title[0].isalnum():
        return "shell"
    return "working"


def ago(seconds):
    seconds = int(seconds)
    if seconds < 60:
        return f"{seconds}s"
    if seconds < 3600:
        return f"{seconds // 60}m"
    return f"{seconds // 3600}h{seconds % 3600 // 60:02d}m"


class State:
    def __init__(self):
        self.sessions = {}      # name -> dict(pane, title, tab, status)
        self.order = []
        self.since = {}         # name -> (status, time it took that status)
        self.git = {}           # dispatch title -> "branch · last commit"
        self.git_at = 0.0
        self.error = ""
        self.me = os.environ.get("WEZTERM_PANE", "")
        self.polled_at = 0.0
        self.hooks = {}         # name -> sessions.json entry (state, since, beat, msg)
        self.board = []         # merge_board modules, for NEEDS YOU
        self.board_at = 0.0
        self.stalled = {}       # name -> the beat it stalled at (logged once per stall)

    def poll(self):
        try:
            panes = json.loads(wez("list", "--format", "json").stdout or "[]")
            self.error = ""
        except Exception as e:  # WezTerm busy or gone: keep the last view
            self.error = f"wezterm cli list failed: {e}"
            return
        panes = [p for p in panes if p["workspace"] == "avel"]
        per_tab = {}
        for p in panes:
            per_tab[p["tab_id"]] = per_tab.get(p["tab_id"], 0) + 1
        sessions, order, now = {}, [], time.time()
        for p in panes:
            if str(p["pane_id"]) == self.me:
                continue
            title = p["title"] or ""
            if p["tab_title"] == "INT":   # this dashboard over the operator's session
                name = "DASHBOARD" if title.strip() == "DASHBOARD" else "INT"
            elif per_tab[p["tab_id"]] == 1 and p["tab_title"]:
                name = p["tab_title"]
            else:
                name = re.sub(r"^[^A-Za-z0-9]+", "", title).strip()
            if not name or name in sessions:
                continue
            st = status_of(title)
            sessions[name] = dict(pane=p["pane_id"], title=title, tab=p["tab_title"], status=st,
                                  zoomed=p.get("is_zoomed", False))
            order.append(name)
            prev = self.since.get(name)
            if not prev or prev[0] != st:
                self.since[name] = (st, now)
        self.sessions, self.order = sessions, order
        self.polled_at = now
        if now - self.git_at > GIT_REFRESH:
            self.git_at = now
            self.git = self.dispatch_git()
        try:
            self.hooks = json.loads((REPO / ".git" / "avel" / "sessions.json").read_text() or "{}")
        except (OSError, ValueError):
            self.hooks = {}
        if now - self.board_at > GIT_REFRESH:
            self.board_at = now
            try:
                self.board = merge_board.load(REPO)
            except Exception as e:
                self.error = f"merge board: {e}"
        self.check_stalls(now)

    def stall_age(self, name, now=None):
        """Seconds since a working session's last tool activity, if past STALL."""
        s, h = self.sessions.get(name), self.hooks.get(name) or {}
        if not s or s["status"] != "working" or not h.get("beat"):
            return None
        age = (now or time.time()) - h["beat"]
        return age if age > STALL else None

    def check_stalls(self, now):
        for name in self.order:
            age = self.stall_age(name, now)
            beat = (self.hooks.get(name) or {}).get("beat")
            if age is None:
                self.stalled.pop(name, None)
            elif self.stalled.get(name) != beat:
                self.stalled[name] = beat
                events.emit("session.stalled", actor="INT", subject={"type": "session", "ref": name},
                            data={"summary": f"no tool activity for {ago(age)}", "seconds": int(age)},
                            start=REPO)

    def needs(self):
        """What's waiting on the operator, most urgent first: (text, color, target).
        A target is a session name or "board:<module>"."""
        out = []
        for name in self.order:
            h = self.hooks.get(name) or {}
            if name in self.sessions and h.get("state") == "waiting":
                msg = h.get("msg") or "waiting for you"
                out.append((0, f"{name}: {msg}  ({ago(time.time() - h.get('since', time.time()))})", "gwarn", name))
            age = self.stall_age(name)
            if age is not None:
                out.append((1, f"{name} stalled: working, no tool activity for {ago(age)}", "block", name))
        for m in self.board:
            ref = f"board:{m.team}/{m.sprint}/{m.module}"
            if m.lock_breaks:
                out.append((2, f"{m.module}: {len(m.lock_breaks)} locked test change(s) on "
                               f"{m.lock_breaks[0][0].rsplit('/', 1)[-1]}", "block", ref))
            if m.status == "READY":
                out.append((3, f"{m.module}: ready to merge (Enter, then m)", "pass", ref))
            if m.findings_open:
                out.append((4, f"{m.module}: {m.findings_open} open finding(s) to route", "block", ref))
            if m.build and m.build.reported and m.status != "MERGED":
                for r in m.of("review"):
                    if not r.attempts and not r.reported:
                        out.append((5, f"{m.module}: start {r.agent.upper()} {r.role} (Ctrl+a s, needs the build SHA)",
                                    "gwarn", ref))
        out.sort(key=lambda x: x[0])
        return [x[1:] for x in out]

    def dispatch_git(self):
        """Branch and last commit for each open dispatch tab, from its worktree."""
        out = {}
        try:
            porcelain = subprocess.run(["git", "-C", str(REPO), "worktree", "list", "--porcelain"],
                                       capture_output=True, text=True, timeout=5).stdout
        except Exception:
            return out
        trees = {}
        for block in porcelain.strip().split("\n\n"):
            fields = dict(line.split(" ", 1) for line in block.splitlines() if " " in line)
            if "branch" in fields:
                trees[fields["branch"].removeprefix("refs/heads/")] = fields["worktree"]
        for name in self.order:
            m = DISPATCH_RE.match(name)
            if not m:
                continue
            agent, rest, attempt = m.groups()
            suffix = f"/agent-{agent.lower()}-{rest}-a{attempt}"
            for branch, path in trees.items():
                if branch.endswith(suffix):
                    log = subprocess.run(["git", "-C", path, "log", "-1", "--format=%h %s (%cr)"],
                                         capture_output=True, text=True, timeout=5).stdout.strip()
                    out[name] = f"{branch} · {log}"
        return out

    def rows(self):
        """The list, in order: ("header", tab, team, members) or ("agent", name, team)."""
        rows, listed = [], set()
        listed.update(("INT", "DASHBOARD"))   # the operator's own tab: right below this
        needs = self.needs()
        rows.append(("header", "NEEDS YOU", "you", [t for _, _, t in needs if t]))
        for text, color, target in needs[:8] or [("nothing needs you", "dim", None)]:
            rows.append(("need", text, color, target))
        if len(needs) > 8:
            rows.append(("need", f"… {len(needs) - 8} more", "dim", None))
        for tab, team, members in GROUPS:
            rows.append(("header", tab, team, [n for n, _ in members]))
            for n, _ in members:
                listed.add(n)
                rows.append(("agent", n, team) if n in self.sessions else ("closed", n, team))
        dispatch = [n for n in self.order if n not in listed and DISPATCH_RE.match(n)]
        rows.append(("header", "DISPATCH", "dispatch", dispatch))
        for n in dispatch:
            rows.append(("agent", n, TEAM_OF.get(n.split()[0], "dispatch")))
        return rows


def recent_events(n):
    """The last n events, read from the end of the log."""
    try:
        with open(events.log_path(REPO), "rb") as f:
            f.seek(0, os.SEEK_END)
            start = max(0, f.tell() - 16384)
            f.seek(start)
            lines = f.read().decode("utf-8", "replace").splitlines()
            if start:
                lines = lines[1:]   # the first line is cut
    except OSError:
        return []
    out = []
    for line in lines[-n:]:
        try:
            out.append(json.loads(line))
        except ValueError:
            pass
    return out


def event_color(kind):
    if kind in ("session.waiting", "lock.overridden"):
        return "gwarn"
    if kind in ("session.stalled", "lock.violated"):
        return "block"
    if kind.startswith("attempt."):
        return "accent"
    return "dim"


def messages(n):
    log = REPO / "docs" / "agent-dispatch" / "messages.md"
    try:
        return [l[2:] for l in log.read_text().splitlines() if l.startswith("- ")][-n:]
    except OSError:
        return []


class UI:
    def __init__(self, scr):
        self.scr = scr
        self.st = State()
        self.sel = 0
        self.mode = "sessions"      # or "board"
        self.bsel = 0
        self.board = []
        self.board_at = 0.0
        self.flash = ""
        self.flash_at = 0.0
        curses.curs_set(0)
        curses.use_default_colors()
        self.pairs = {}
        for i, (k, c) in enumerate(COLORS.items(), start=1):
            curses.init_pair(i, c if curses.COLORS >= 256 else -1, -1)
            self.pairs[k] = curses.color_pair(i)
        scr.timeout(250)

    def say(self, text):
        self.flash, self.flash_at = text, time.time()

    def put(self, y, x, text, attr=0):
        h, w = self.scr.getmaxyx()
        if y < 0 or y >= h or x >= w:
            return
        try:
            self.scr.addnstr(y, x, text, max(0, w - x - 1), attr)
        except curses.error:
            pass

    def selectable(self, rows):
        return [i for i, r in enumerate(rows) if r[0] == "agent" or (r[0] == "need" and r[3])
                or (r[0] == "header" and r[3] and r[1] != "NEEDS YOU")]

    def draw(self):
        if self.mode == "board":
            return self.draw_board()
        scr, st = self.scr, self.st
        scr.erase()
        h, w = scr.getmaxyx()
        rows = st.rows()
        sel_rows = self.selectable(rows)
        if sel_rows:
            self.sel = max(0, min(self.sel, len(sel_rows) - 1))
        shown = [r[1] for r in rows if r[0] == "agent"]
        working = sum(1 for n in shown if st.sessions[n]["status"] == "working")
        dispatch = sum(1 for n in st.order if DISPATCH_RE.match(n))
        self.put(0, 1, "AVEL CONTROL ROOM", self.pairs["title"] | curses.A_BOLD)
        summary = (f"{len(shown)} sessions · {working} working · "
                   f"{dispatch}/{SLOTS} dispatch slots · {time.strftime('%H:%M:%S')}")
        self.put(0, max(20, w - len(summary) - 2), summary, self.pairs["dim"])
        self.put(1, 0, "─" * (w - 1), self.pairs["dim"])

        # The list takes what's left after the events panel.
        msg_lines = max(3, min(8, h // 5)) if h >= 20 else 0
        list_h = max(1, h - 3 - (msg_lines + 2 if msg_lines else 0))
        y, chosen_row = 2, sel_rows[self.sel] if sel_rows else -1
        # Scroll so the selection stays visible.
        start = max(0, chosen_row - list_h + 1) if chosen_row >= list_h else 0
        number = 0
        for i, row in enumerate(rows):
            is_sel = i == chosen_row
            if row[0] == "agent":
                number += 1
            if i < start or y >= 2 + list_h:
                continue
            mark = curses.A_REVERSE if is_sel else 0
            if row[0] == "need":
                _, text, color, target = row
                self.put(y, 3, "›" if target else " ", self.pairs[color])
                self.put(y, 5, text, self.pairs[color] | mark)
            elif row[0] == "header" and row[1] == "NEEDS YOU":
                self.put(y, 1, "NEEDS YOU", self.pairs["you"] | curses.A_BOLD)
                n = len(st.needs())
                self.put(y, 14, f"{n} item{'s' if n != 1 else ''}" if n else "all clear", self.pairs["dim"])
            elif row[0] == "header":
                _, tab, team, members = row
                if tab == "DISPATCH":
                    count = f"{len(members)}/{SLOTS} open"
                else:
                    open_ = [n for n in members if n in st.sessions]
                    busy = sum(1 for n in open_ if st.sessions[n]["status"] == "working")
                    count = f"{len(open_)}/{len(members)} open · {busy} working"
                self.put(y, 1, f"{tab:<12}", self.pairs[team] | curses.A_BOLD | mark)
                self.put(y, 14, count, self.pairs["dim"])
            elif row[0] == "closed":
                _, name, team = row
                self.put(y, 3, "–", self.pairs["dim"])
                self.put(y, 5, f"{name:<20}", self.pairs["dim"])
                self.put(y, 26, "not open", self.pairs["dim"])
                if w > 60:
                    self.put(y, 44, "closed, or not running as its agent", self.pairs["dim"])
            else:
                _, name, team = row
                s = st.sessions[name]
                icon, label = STATUS[s["status"]]
                since = st.since.get(name, (None, time.time()))[1]
                role = ROLE_OF.get(name) or ("you: your own session" if name == "INT" else st.git.get(name, s["tab"]))
                key = f"{number}" if number <= 9 else " "
                self.put(y, 1, key, self.pairs["dim"])
                self.put(y, 3, icon, self.pairs[s["status"]])
                self.put(y, 5, f"{name:<20}", self.pairs.get(team, self.pairs["text"]) | curses.A_BOLD | mark)
                hk = st.hooks.get(name) or {}
                if hk.get("state") == "waiting":
                    self.put(y, 26, f"needs you {ago(time.time() - hk.get('since', time.time()))}", self.pairs["gwarn"])
                elif st.stall_age(name) is not None:
                    self.put(y, 26, f"stalled {ago(st.stall_age(name))}", self.pairs["block"])
                else:
                    self.put(y, 26, f"{label} {ago(time.time() - since)}", self.pairs[s["status"]])
                if w > 60:
                    self.put(y, 44, role, self.pairs["dim"])
            y += 1

        # Messages between sessions.
        if msg_lines:
            my = 2 + list_h
            self.put(my, 0, "─" * (w - 1), self.pairs["dim"])
            self.put(my, 2, " events (scripts/watch.sh) ", self.pairs["title"])
            recent = recent_events(msg_lines)
            for j, e in enumerate(recent):
                self.put(my + 1 + j, 2, events.fmt(e, color=False), self.pairs[event_color(e["kind"])])
            if not recent:
                for j, line in enumerate(messages(msg_lines) or ["none yet"]):
                    self.put(my + 1 + j, 2, line, self.pairs["dim"])
        self.footer(h, w, st)
        scr.refresh()
        return rows, sel_rows

    def footer(self, h, w, st):
        if self.mode == "board":
            long_ = "↑↓ select  Enter diff  o report  m merge tab  p sessions  r refresh  q quit"
            short = "↑↓ Enter diff  o  m  p  q"
        else:
            long_ = "↑↓ select  1-9 jump  Enter zoomed  g grid  t tell  v  a  p merge board  q quit"
            short = "↑↓ Enter zoom  g  t  v  a  p board  q"
        if self.flash and time.time() - self.flash_at < 5:
            self.put(h - 1, 1, self.flash, self.pairs["warn"])
        elif st.error:
            self.put(h - 1, 1, st.error, self.pairs["warn"])
        else:
            self.put(h - 1, 1, long_ if w > len(long_) + 2 else short, self.pairs["dim"])

    # ---------------- merge board ----------------
    def board_rows(self):
        rows, last = [], None
        for m in self.board:
            if (m.team, m.sprint) != last:
                rows.append(("sprint", m.team, m.sprint))
                last = (m.team, m.sprint)
            rows.append(("module", m))
            for t in m.tasks:
                rows.append(("task", m, t))
        return rows

    def draw_board(self):
        scr = self.scr
        scr.erase()
        h, w = scr.getmaxyx()
        if time.time() - self.board_at > GIT_REFRESH:
            try:
                self.board = merge_board.load(REPO)
            except Exception as e:
                self.say(f"merge board: {e}")
            self.board_at = time.time()
        rows = self.board_rows()
        sel_rows = [i for i, r in enumerate(rows) if r[0] in ("module", "task")]
        if sel_rows:
            self.bsel = max(0, min(self.bsel, len(sel_rows) - 1))
        counts = {}
        for m in self.board:
            counts[m.status] = counts.get(m.status, 0) + 1
        self.put(0, 1, "MERGE BOARD", self.pairs["title"] | curses.A_BOLD)
        summary = " · ".join(f"{n} {k.lower()}" for k, n in counts.items()) or "no modules yet"
        summary += f" · {time.strftime('%H:%M:%S')}"
        self.put(0, max(14, w - len(summary) - 2), summary, self.pairs["dim"])
        self.put(1, 0, "─" * (w - 1), self.pairs["dim"])
        prev_lines = max(6, min(14, h // 3)) if h >= 22 else 0
        list_h = max(1, h - 3 - (prev_lines + 2 if prev_lines else 0))
        if not rows:
            msgs = ["No modules yet. The board fills in from the sprint folders",
                    "(docs/agent-dispatch/<team>/sprint-NN/: task docs, completion reports,",
                    "locks.md, findings/) and from the attempt branches scripts/agent.sh",
                    "creates (<team>/<sprint>/agent-<agent>-<module>-<role>-a<N>).",
                    "", "Render a sprint package, start its dispatches, and they show up here."]
            for j, line in enumerate(msgs):
                self.put(3 + j, 2, line, self.pairs["dim"])
            self.footer(h, w, self.st)
            scr.refresh()
            return rows, sel_rows
        chosen = sel_rows[self.bsel] if sel_rows else -1
        start = max(0, chosen - list_h + 1) if chosen >= list_h else 0
        y = 2
        for i, row in enumerate(rows):
            if i < start or y >= 2 + list_h:
                continue
            mark = curses.A_REVERSE if i == chosen else 0
            if row[0] == "sprint":
                _, team, sprint = row
                self.put(y, 1, f"{team} {sprint}", self.pairs[team] | curses.A_BOLD)
            elif row[0] == "module":
                m = row[1]
                b = m.build
                latest = b.latest if b else None
                reviews = m.of("review")
                done = sum(1 for r in reviews if r.reported)
                self.put(y, 2, f"{m.status:<10}", self.pairs[m.status] | curses.A_BOLD)
                self.put(y, 13, f"{m.module:<14}", self.pairs["text"] | curses.A_BOLD | mark)
                if latest:
                    info = (f"{b.agent.upper()} a{latest.attempt}  +{latest.added} −{latest.removed}  "
                            f"{latest.files} files  {latest.ahead} commits")
                else:
                    info = "no build attempt yet"
                tail = (f" · tests {'locked' if m.locked else 'not locked'} · reviews {done}/{len(reviews)}"
                        f" · findings {m.findings_open} open")
                self.put(y, 28, info, self.pairs["dim"])
                if w > 28 + len(info) + len(tail) + 2:
                    self.put(y, 28 + len(info), tail, self.pairs["dim"])
            else:
                m, t = row[1], row[2]
                a = t.latest
                team = merge_board.kind_of(t.role)
                color = self.pairs.get(TEAM_OF.get(t.agent.upper(), "text"), self.pairs["text"])
                self.put(y, 6, f"{t.kind:<8}", self.pairs["dim"])
                self.put(y, 15, f"{t.agent.upper():<8}", color | mark)
                self.put(y, 24, f"{t.role:<17}", self.pairs["dim"])
                att = f"a{a.attempt}  {a.ahead} ahead" if a else ("filed on main" if t.reported else "not started")
                self.put(y, 42, f"{att:<16}", self.pairs["dim"])
                rep = "report ✓" if t.reported else "report –"
                self.put(y, 59, rep, self.pairs["ok" if t.reported else "dim"])
                if t.verdict:
                    self.put(y, 69, t.verdict, self.pairs["ok" if t.verdict in ("PASS", "DONE", "APPROVED") else "no"])
            y += 1

        if prev_lines:
            py = 2 + list_h
            self.put(py, 0, "─" * (w - 1), self.pairs["dim"])
            row = rows[chosen] if chosen >= 0 else None
            if row and row[0] == "module":
                m = row[1]
                self.put(py, 2, f" {m.module}: ready to merge? ", self.pairs["title"])
                lines = [(("✓ " if ok else "✗ ") + label, "ok" if ok else "no") for label, ok in m.checklist()]
                if m.status == "READY" and m.build and m.build.latest:
                    lines.append((f"m opens a merge tab: git merge --no-ff {m.build.latest.branch}", "dim"))
                for j, (line, c) in enumerate(lines[:prev_lines]):
                    self.put(py + 1 + j, 2, line, self.pairs[c])
            elif row and row[0] == "task":
                t = row[2]
                a = t.latest
                self.put(py, 2, f" {t.name} ", self.pairs["title"])
                if a:
                    stat = merge_board.git(REPO, "diff", "--stat", f"main...{a.branch}").splitlines()
                    lines = [a.branch, a.last, ""] + stat[-(prev_lines - 3):]
                else:
                    lines = ["No attempt branch yet: start it with Ctrl+a s or scripts/agent.sh."]
                for j, line in enumerate(lines[:prev_lines]):
                    self.put(py + 1 + j, 2, line, self.pairs["text"] if j else self.pairs["dim"])
        self.footer(h, w, self.st)
        scr.refresh()
        return rows, sel_rows

    def board_target(self, rows, sel_rows):
        """The selected module and task (a module stands for its build)."""
        if not sel_rows:
            return None, None
        row = rows[sel_rows[self.bsel]]
        if row[0] == "module":
            return row[1], row[1].build
        return row[1], row[2]

    def spawn_tab(self, title, cmd):
        r = wez("spawn", "--pane-id", self.st.me or "0", "--cwd", str(REPO), "--", "bash", "-lc", cmd)
        pane = r.stdout.strip()
        if pane:
            wez("set-tab-title", "--pane-id", pane, title)
        else:
            self.say(f"couldn't open a tab: {r.stderr.strip()[:80]}")

    def board_key(self, ch, rows, sel_rows):
        m, t = self.board_target(rows, sel_rows)
        a = t.latest if t else None
        if ch in (curses.KEY_DOWN, ord("j")):
            self.bsel = min(self.bsel + 1, max(0, len(sel_rows) - 1))
        elif ch in (curses.KEY_UP, ord("k")):
            self.bsel = max(self.bsel - 1, 0)
        elif ch in (curses.KEY_ENTER, 10, 13):
            if not a:
                return self.say("nothing to diff: no attempt branch yet")
            # Titles never end in "a<N>", so agent.sh doesn't count them as dispatches.
            self.spawn_tab(f"DIFF {m.module} {t.agent.upper()}-a{a.attempt}",
                           f"git -c color.ui=always diff --stat main...{a.branch}; echo; "
                           f"git -c color.ui=always diff main...{a.branch} | less -R; exit")
        elif ch == ord("o"):
            if not t or not t.reported:
                return self.say("no report yet")
            path = f"docs/agent-dispatch/{t.team}/{t.sprint}/{t.name}-completion.md"
            show = f"less -R {path}" if t.report_on_main else f"git show {a.branch}:{path} | less -R"
            self.spawn_tab(f"REPORT {m.module} {t.agent.upper()}", f"{show}; exit")
        elif ch == ord("m"):
            if not m or m.status != "READY":
                return self.say("not ready to merge: see the checklist below")
            branch = m.build.latest.branch
            cmd = f"git merge --no-ff {branch} && pnpm test"
            self.spawn_tab(f"MERGE {m.module}",
                           "echo 'Merge " + m.module + ": check the command, then press Enter (Ctrl+c to cancel).'; "
                           f"read -e -i {json.dumps(cmd)} -p '$ ' c && eval \"$c\"; exec bash")
        elif ch == ord("r"):
            self.board_at = 0.0
        return None

    def open_board(self, ref):
        """Switch to the merge board with a module (team/sprint/module) selected."""
        self.mode, self.board_at = "board", 0.0
        try:
            self.board = merge_board.load(REPO)
            self.board_at = time.time()
        except Exception as e:
            self.say(f"merge board: {e}")
        selectable = [r for r in self.board_rows() if r[0] in ("module", "task")]
        for i, r in enumerate(selectable):
            if r[0] == "module" and f"{r[1].team}/{r[1].sprint}/{r[1].module}" == ref:
                self.bsel = i
        return "refresh"

    def current(self, rows, sel_rows):
        if not sel_rows:
            return None, None
        row = rows[sel_rows[self.sel]]
        if row[0] == "agent":
            return row[1], "agent"
        if row[0] == "need":
            return row[3], "need"
        first = next((n for n in row[3] if n in self.st.sessions), None)
        return first, "header"

    def open(self, name, zoom):
        s = self.st.sessions.get(name)
        if not s:
            return
        pane = str(s["pane"])
        wez("zoom-pane", "--pane-id", pane, "--unzoom")
        wez("activate-pane", "--pane-id", pane)
        if zoom:
            wez("zoom-pane", "--pane-id", pane, "--zoom")

    def prompt(self, label):
        h, w = self.scr.getmaxyx()
        self.put(h - 1, 0, " " * (w - 1))
        self.put(h - 1, 1, label, self.pairs["title"])
        curses.echo()
        curses.curs_set(1)
        self.scr.timeout(-1)
        try:
            raw = self.scr.getstr(h - 1, 2 + len(label), max(1, w - len(label) - 4))
        finally:
            curses.noecho()
            curses.curs_set(0)
            self.scr.timeout(250)
        return raw.decode("utf-8", "replace").strip()

    def run_script(self, *args):
        r = subprocess.run([str(SCRIPTS / args[0]), *args[1:]], capture_output=True, text=True,
                           cwd=REPO, env={**os.environ, "AVEL_FROM": "INT"}, timeout=120)
        out = (r.stdout + r.stderr).strip().splitlines()
        self.say(out[0] if out else f"{args[0]} done")

    def loop(self):
        last = 0.0
        while True:
            if time.time() - last > REFRESH:
                self.st.poll()
                last = time.time()
            rows, sel_rows = self.draw()
            # Handle every key that's waiting before drawing again, so holding
            # j or k doesn't lag behind.
            ch = self.scr.getch()
            while ch != -1:
                result = self.handle(ch, rows, sel_rows)
                if result == "quit":
                    return
                if result == "refresh":
                    last = 0.0
                self.scr.timeout(0)
                ch = self.scr.getch()
            self.scr.timeout(250)

    def handle(self, ch, rows, sel_rows):
        if ch in (ord("q"), ord("Q")):
            return "quit"
        if ch == ord("p"):
            self.mode = "board" if self.mode == "sessions" else "sessions"
            self.board_at = 0.0
            return "refresh"
        if self.mode == "board":
            return self.board_key(ch, rows, sel_rows)
        name, kind = self.current(rows, sel_rows)
        if ch in (curses.KEY_DOWN, ord("j")):
            self.sel = min(self.sel + 1, max(0, len(sel_rows) - 1))
        elif ch in (curses.KEY_UP, ord("k")):
            self.sel = max(self.sel - 1, 0)
        elif ord("1") <= ch <= ord("9"):
            agents = [i for i, r in enumerate(rows) if r[0] == "agent"]
            n = ch - ord("1")
            if n < len(agents):
                self.sel = sel_rows.index(agents[n])
                self.open(rows[agents[n]][1], zoom=True)
        elif ch in (curses.KEY_ENTER, 10, 13):
            if kind == "need" and name and name.startswith("board:"):
                return self.open_board(name.removeprefix("board:"))
            self.open(name, zoom=(kind in ("agent", "need")))
        elif ch == ord("g"):
            self.open(name, zoom=False)
        elif ch == ord("t") and name and kind == "agent" and name != "INT":
            msg = self.prompt(f"tell {name}: ")
            if msg:
                self.run_script("tell.sh", name, msg)
        elif ch == ord("v"):
            self.run_script("control-room.sh")
            return "refresh"
        elif ch == ord("a"):
            self.run_script("control-room.sh", "--arrange")
            return "refresh"
        elif ch == ord("r"):
            return "refresh"
        return None


def main(scr):
    UI(scr).loop()


if __name__ == "__main__":
    locale.setlocale(locale.LC_ALL, "")
    print("\033]2;DASHBOARD\007", end="", flush=True)   # pane title: scripts find it by this
    curses.wrapper(main)
