#!/usr/bin/env python3
"""The AVEL build team's dispatch renderer (Build rules C1, D1, H6, M).

A sprint's plan goes in, and agent-dispatch's package comes out. Each ticket in the plan
renders into three task docs: the checker's tests, the builder's build, and the checker's
review. The output depends only on the plan and this file, byte for byte.

  scripts/render.py --new <lane>/sprint-NN          write a starter plan.toml and locks.md
  scripts/render.py --check <lane>/sprint-NN [...]  check plans (and overlap across them); write nothing
  scripts/render.py <lane>/sprint-NN                check, then render the package
  scripts/render.py --verify <lane>/sprint-NN       the package is committed and matches a fresh render
  scripts/render.py --status <lane>/sprint-NN       every dispatch: merged, done, running, ready, waiting, stopped
  scripts/render.py --ready <lane>/sprint-NN        ready dispatches: <lane> <sprint> <doc> <attempt>, tab-separated

Used by scripts/agent.sh, scripts/dispatch.sh and scripts/agents/lane.sh:
  --next <lane> <agent>    the agent's next ready dispatch in the lane's rendered sprints, oldest first
  --docs <agent>           the agent's dispatches that can be opened by hand (ready or stopped)
  --info <lane>/<sprint> <doc>                       a task doc's front matter, as shell assignments
  --state <lane>/<sprint> <doc>                      its state and next attempt number
  --slots <lane> <seat> [weight]                     exit 0 if a session of that weight may start (B7), else say why
  --merged <ticket>                                  exit 0 if the ticket is merged on main (agent.sh --prune)
  --last <lane>/<sprint> <doc>                       its latest attempt, as shell assignments (agent.sh --resume)
  --record <lane>/<sprint> <doc> <attempt> <worktree> <base> <mode>   log an attempt

State lives in <git common dir>/avel/: attempts.jsonl, running/, reports/, paused.
Lead-written files in the sprint folder: plan.toml, locks.md. Never rendered.
"""

import argparse
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
from datetime import datetime, timezone

try:
    import tomllib
except ModuleNotFoundError:  # Python 3.10
    try:
        import tomli as tomllib
    except ModuleNotFoundError:
        sys.exit("render.py needs Python 3.11+, or the tomli package (sudo apt install python3-tomli)")

RENDERER = "avel-render 5"
# A package keeps the renderer it was rendered with, so a kit change never invalidates one in flight:
# --verify renders it again with the version its MANIFEST.json names. 2 adds the "Messages received"
# report section (CR-37) and the comma-separated lock line. 3 puts every build on Opus (Javaris, Nov 18:
# "builders should be on opus not sonnet"); before 3, only a full-rigor build was. 4: a build pushes its
# branch and opens the PR once its report says done (CR-46 B3); before 4, every dispatch was told not to push.
RENDERERS = ("avel-render 1", "avel-render 2", "avel-render 3", "avel-render 4", "avel-render 5")
# 5: a full-rigor review runs on Sonnet too (Javaris, Nov 21: "I agree with the 4 improvements"); the other lead's
# second review (G7) stays the backstop. Like the Opus builds of 3, a session starts on the current renderer's
# model (--info), so reviews of packages rendered with 1 to 4 start on Sonnet while their docs keep saying Opus.
OPUS_REVIEWS_BEFORE = ("avel-render 1", "avel-render 2", "avel-render 3", "avel-render 4")
# The renderers whose activation tells every dispatch "Don't push."
NO_PUSH_BEFORE = ("avel-render 1", "avel-render 2", "avel-render 3")
# The renderers that gave a standard-rigor build Sonnet.
OPUS_BUILDS_BEFORE = ("avel-render 1", "avel-render 2")
HERE = os.path.dirname(os.path.abspath(__file__))


def git(*args, cwd=None, check=False):
    out = subprocess.run(["git", *args], cwd=cwd or ROOT, capture_output=True, text=True)
    if check and out.returncode != 0:
        raise SystemExit("git " + " ".join(args) + ": " + out.stderr.strip())
    return out


def find_root():
    out = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=HERE, capture_output=True, text=True)
    return out.stdout.strip() if out.returncode == 0 else os.path.dirname(HERE)


ROOT = os.environ.get("AVEL_ROOT_OVERRIDE") or find_root()
DISPATCH = os.path.join(ROOT, "docs", "agent-dispatch")


def state_dir():
    out = git("rev-parse", "--git-common-dir")
    common = out.stdout.strip() if out.returncode == 0 else os.path.join(ROOT, ".git")
    if not os.path.isabs(common):
        common = os.path.normpath(os.path.join(ROOT, common))
    path = os.path.join(common, "avel")
    for sub in ("running", "reports"):
        os.makedirs(os.path.join(path, sub), exist_ok=True)
    return path


def load_json(name):
    with open(os.path.join(ROOT, "scripts", "agents", name)) as f:
        return json.load(f)


class PlanError(Exception):
    pass


# ------------------------------------------------------------------ globs and paths

def glob_regex(glob):
    out, i = "", 0
    while i < len(glob):
        c = glob[i]
        if glob.startswith("**/", i):
            out += "(?:.*/)?"
            i += 3
            continue
        if glob.startswith("**", i):
            out += ".*"
            i += 2
            continue
        if c == "*":
            out += "[^/]*"
        elif c == "?":
            out += "[^/]"
        elif c == "{":
            end = glob.index("}", i)
            out += "(?:" + "|".join(re.escape(p) for p in glob[i + 1:end].split(",")) + ")"
            i = end
        else:
            out += re.escape(c)
        i += 1
    return re.compile("^" + out + "$")


def literal(glob):
    m = re.search(r"[*?\[{]", glob)
    return glob if not m else glob[:m.start()]


def overlaps(a, b):
    """Could glob a and glob b match the same file? Conservative: when both are wild, a shared prefix counts."""
    la, lb = literal(a), literal(b)
    wild_a, wild_b = la != a, lb != b
    if not wild_a and not wild_b:
        return a == b
    if not wild_a:
        return bool(glob_regex(b).match(a))
    if not wild_b:
        return bool(glob_regex(a).match(b))
    return la.startswith(lb) or lb.startswith(la)


def within(p, area):
    """Is every file glob p can match inside area (a folder glob ending in /**)?"""
    return area.endswith("/**") and (p == area or p.startswith(area[:-2]))


def bad_path(p):
    return p.startswith("/") or ".." in p.split("/") or p.strip() != p or p == ""


# ------------------------------------------------------------------ the plan

TICKET_FIELDS = {"id", "slug", "title", "goal", "rigor", "refs", "depends_on", "labels", "cr",
                 "may_change", "must_not_change", "context", "verify", "notes", "tests"}
TOP_FIELDS = {"lane", "sprint", "step", "title", "goals", "done_when", "sources", "commands",
              "analysis", "ticket"}


def parse_target(target):
    parts = target.strip("/").split("/")
    if len(parts) != 2 or not re.fullmatch(r"sprint-\d{2}", parts[1]):
        raise SystemExit(f"expected <lane>/sprint-NN, got {target!r}")
    return parts[0], parts[1]


def folder(lane, sprint):
    return os.path.join(DISPATCH, lane, sprint)


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def load_plan(lane, sprint, roster):
    """Read and check one sprint's plan. Returns (plan, warnings); raises PlanError listing every problem."""
    path = os.path.join(folder(lane, sprint), "plan.toml")
    if not os.path.exists(path):
        raise PlanError(f"{rel(path)} doesn't exist. Start one with: scripts/render.py --new {lane}/{sprint}")
    with open(path, "rb") as f:
        raw = f.read()
    try:
        plan = tomllib.loads(raw.decode())
    except Exception as e:
        raise PlanError(f"{rel(path)}: {e}")
    errors, warnings = [], []
    seats = roster["lanes"].get(lane)
    if not seats:
        raise PlanError(f"unknown lane {lane!r}: expected one of {', '.join(roster['lanes'])}")

    for k in plan:
        if k not in TOP_FIELDS:
            errors.append(f"unknown field {k!r} at the top of the plan")
    if plan.get("lane", lane) != lane:
        errors.append(f"lane is {plan.get('lane')!r} but the folder is {lane}")
    if plan.get("sprint", sprint) != sprint:
        errors.append(f"sprint is {plan.get('sprint')!r} but the folder is {sprint}")
    for k in ("title",):
        if not str(plan.get(k, "")).strip():
            errors.append(f"missing {k}")
    if not plan.get("done_when"):
        errors.append("missing done_when (the step plan's tests this sprint serves)")
    cmds = plan.get("commands", {})
    for k in ("build", "test"):
        if not str(cmds.get(k, "")).strip():
            errors.append(f"missing commands.{k}")

    tickets = plan.get("ticket", [])
    if not tickets:
        errors.append("no [[ticket]] entries")
    if len(tickets) > 6:
        errors.append(f"{len(tickets)} tickets: a cycle has 3 to 6 (B1); split the sprint")
    elif 0 < len(tickets) < 3:
        warnings.append(f"{len(tickets)} tickets: a cycle usually has 3 to 6 (B1)")

    ids = {}
    prefix = seats["prefix"]
    contract = roster["contract_paths"]
    never = roster["never"] + seats["never"]
    # A lane's exceptions to its never list and to I3's paths, each needing a label and an accepted CR.
    allow = seats.get("allow", {})
    for n, t in enumerate(tickets, 1):
        where = f"ticket {n}"
        tid = str(t.get("id", ""))
        if tid:
            where = tid
        for k in t:
            if k not in TICKET_FIELDS:
                errors.append(f"{where}: unknown field {k!r}")
        if not re.fullmatch(re.escape(prefix) + r"\d+", tid):
            errors.append(f"{where}: id must look like {prefix}<n> (C6)")
        elif tid in ids:
            errors.append(f"{where}: id used twice (C6: never reused)")
        ids[tid] = t
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(t.get("slug", ""))):
            errors.append(f"{where}: slug must be lowercase words joined by hyphens, like db-errors")
        for k in ("title", "goal"):
            if not str(t.get(k, "")).strip():
                errors.append(f"{where}: missing {k}")
        rigor = t.setdefault("rigor", "standard")
        if rigor not in ("standard", "full"):
            errors.append(f"{where}: rigor must be standard or full")
        for k in ("refs", "depends_on", "labels", "may_change", "must_not_change", "verify", "notes", "context"):
            t.setdefault(k, [])
            if not isinstance(t[k], list):
                errors.append(f"{where}: {k} must be a list")
        t.setdefault("cr", "")
        if not t["may_change"]:
            errors.append(f"{where}: may_change is empty: the builder needs a territory")
        if not t["verify"]:
            errors.append(f"{where}: verify is empty: name the commands that prove it")
        for c in t["context"]:
            if not isinstance(c, dict) or not c.get("path") or not c.get("why"):
                errors.append(f"{where}: each context entry needs a path and a why")
        tests = t.get("tests")
        if not isinstance(tests, dict):
            errors.append(f"{where}: missing [ticket.tests] (the checker writes them first, B2)")
            tests = t["tests"] = {"role": seats["test_roles"][0], "paths": [], "behaviours": []}
        tests.setdefault("role", seats["test_roles"][0])
        if tests["role"] not in seats["test_roles"]:
            errors.append(f"{where}: tests.role must be one of {', '.join(seats['test_roles'])} on {lane}")
        if not tests.get("paths"):
            errors.append(f"{where}: tests.paths is empty")
        if not tests.get("behaviours"):
            errors.append(f"{where}: tests.behaviours is empty: list what the tests prove")
        tests.setdefault("paths", [])
        tests.setdefault("behaviours", [])
        # CR-42 item 5: guard tests (accessibility, budgets, standing rules, regressions) may pass on main.
        # The behaviours stay fail-first, so a ticket always has at least one test that fails first.
        tests.setdefault("guards", [])
        if not isinstance(tests["guards"], list) or not all(isinstance(g, str) and g.strip() for g in tests["guards"]):
            errors.append(f"{where}: tests.guards must be a list of behaviours, one line each")

        for p in t["may_change"] + tests["paths"] + t["must_not_change"]:
            if bad_path(p):
                errors.append(f"{where}: {p!r} isn't a repo-relative path")
        for p in t["may_change"] + tests["paths"]:
            granted = next((a for a in allow if within(p, a)), None)
            if granted:
                label, cr = allow[granted]["label"], allow[granted]["cr"]
                if label not in t["labels"] or str(t["cr"]).strip() != cr:
                    errors.append(f"{where}: {p} needs labels = [\"{label}\"] and cr = \"{cr}\" ({allow[granted]['why']})")
                continue
            for nv in never:
                if overlaps(p, nv):
                    errors.append(f"{where}: {p} is never changed by the {lane} lane's agents ({nv})")
            for cp, label in contract.items():
                if overlaps(p, cp):
                    if lane != "backend":
                        errors.append(f"{where}: {p}: only the backend lane changes {cp} (I3)")
                    elif label not in t["labels"] or not str(t["cr"]).strip():
                        errors.append(f"{where}: {p} needs labels = [\"{label}\"] and the accepted cr it implements (I3)")
        for p in tests["paths"]:
            if any(overlaps(p, m) for m in t["must_not_change"]):
                errors.append(f"{where}: a test path is also in must_not_change")

        text = " ".join([str(t.get("title", "")), str(t.get("goal", ""))] + t["may_change"]).lower()
        if rigor == "standard":
            hits = sorted({w for w in roster["full_rigor_words"] if re.search(r"(?<![a-z])" + re.escape(w), text)})
            if hits:
                warnings.append(f"{tid}: mentions {', '.join(hits)}: is it a C4 area? It's marked standard")

    # dependencies inside this sprint: known, not itself, no loop
    for tid, t in ids.items():
        for d in t["depends_on"]:
            if d == tid:
                errors.append(f"{tid}: depends on itself")
            elif d not in ids:
                if re.fullmatch(r"T-[BF]\d+", d):
                    warnings.append(f"{tid}: depends on {d}, which isn't in this sprint (it must be merged first)")
                else:
                    errors.append(f"{tid}: depends_on {d!r} isn't a ticket id")
    order, seen, stack = [], set(), set()

    def visit(tid):
        if tid in stack:
            raise PlanError(f"dependency loop through {tid}")
        if tid in seen:
            return
        stack.add(tid)
        for d in ids[tid]["depends_on"]:
            if d in ids:
                visit(d)
        stack.discard(tid)
        seen.add(tid)
        order.append(tid)

    try:
        for t in tickets:
            if t.get("id") in ids:
                visit(t["id"])
    except PlanError as e:
        errors.append(str(e))

    if errors:
        raise PlanError("\n".join(f"{rel(path)}: {e}" for e in errors))
    plan["_lane"], plan["_sprint"], plan["_order"] = lane, sprint, order
    plan["_sha"] = hashlib.sha256(raw).hexdigest()
    plan["_seats"] = seats
    return plan, warnings


def territory_clashes(plans):
    """Tickets that may run together never share a file: builder paths and test paths, across every plan given.
    A merged ticket (its build report on main, ticket_merged) can't run again, so it clashes with nothing.
    Nor do two tickets chained by depends_on, directly or through others: every dispatch of the later one,
    its tests included, waits for the earlier one to merge, so they never run together (B7; CR-42 item 4)."""
    deps = {t["id"]: set(t["depends_on"]) for plan in plans for t in plan["ticket"]}

    def reaches(a, b, seen=None):
        seen = set() if seen is None else seen
        for d in deps.get(a, ()):
            if d == b or (d not in seen and not seen.add(d) and reaches(d, b, seen)):
                return True
        return False

    owned = []
    for plan in plans:
        for t in plan["ticket"]:
            if ticket_merged(t["id"]):
                continue
            for p in t["may_change"]:
                owned.append((t["id"], "builds", p))
            for p in t["tests"]["paths"]:
                owned.append((t["id"], "tests", p))
    errors = []
    for i, (ta, ka, pa) in enumerate(owned):
        for tb, kb, pb in owned[i + 1:]:
            if ta != tb and overlaps(pa, pb) and not (reaches(ta, tb) or reaches(tb, ta)):
                errors.append(f"{ta} ({ka} {pa}) and {tb} ({kb} {pb}) could change the same files")
    return errors


# ------------------------------------------------------------------ rendering

GUARD_LINE = (" Guard tests are the exception (CR-42): accessibility, budget, standing-rule and regression checks"
              " may already pass on `main`, and your report lists them as passing.")
ROLE_LINE = {
    "tests": "You write this ticket's acceptance tests before anything is built. They must fail on `main`, and once the lead locks them, they decide whether the build is done.",
    "build": "You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.",
    "review": "You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.",
}


def tid_l(tid):
    return tid.lower()


def branch_of(t):
    return f"t/{t['id'][2:]}-{t['slug']}"


def dispatches(plan, renderer=RENDERER):
    """The three dispatches of each ticket, in dependency order.

    The model is the one a session starts on (cmd_info, the latest rule) or, for an older package, the one
    its docs were rendered with (render_package). Builds are always Opus from avel-render 3; tests are
    Sonnet, and a review is Opus only for full rigor."""
    s = plan["_seats"]
    out = []
    for tid in plan["_order"]:
        t = next(x for x in plan["ticket"] if x["id"] == tid)
        role = t["tests"]["role"]
        full = t["rigor"] == "full"
        base = {"ticket": t, "branch": branch_of(t)}
        out.append(dict(base, kind="tests", role=role, agent=s["checker"], seat="checker", model="sonnet",
                        doc=f"agent-{s['checker']}-{tid_l(tid)}-{role}", checkout="branch"))
        out.append(dict(base, kind="build", role="build", agent=s["builder"], seat="builder",
                        model="opus" if full or renderer not in OPUS_BUILDS_BEFORE else "sonnet",
                        doc=f"agent-{s['builder']}-{tid_l(tid)}-build", checkout="branch"))
        out.append(dict(base, kind="review", role="review", agent=s["checker"], seat="checker",
                        model="opus" if full and renderer in OPUS_REVIEWS_BEFORE else "sonnet",
                        doc=f"agent-{s['checker']}-{tid_l(tid)}-review", checkout="detached"))
    return out


def cap(s):
    return s[:1].upper() + s[1:]


def bullets(items, fmt="- {}"):
    return "\n".join(fmt.format(i) for i in items) if items else "- (none)"


def code_list(items):
    return "\n".join(f"- `{i}`" for i in items) if items else "- (none)"


def sprint_path(plan):
    return f"docs/agent-dispatch/{plan['_lane']}/{plan['_sprint']}"


def report_path(plan, d):
    return f"{sprint_path(plan)}/{d['doc']}-completion.md"


def activation(plan, d, renderer=RENDERER):
    t, s = d["ticket"], plan["_seats"]
    me = cap(d["agent"])
    doc = f"{sprint_path(plan)}/{d['doc']}.md"
    who = {"tests": f"the {plan['_lane']} checker", "build": f"the {plan['_lane']} builder",
           "review": f"the {plan['_lane']} checker"}[d["kind"]]
    lines = [
        f"You are {me}, {who} on the AVEL build team (`.claude/agents/{d['agent']}.md`). "
        f"Your lead is {cap(s['lead'])}.",
        f"Your task is ticket {t['id']}, \"{t['title']}\": the {d['kind']} dispatch. "
        f"Your whole briefing is `{doc}`. Read it in full, then its Context in order, before you change anything.",
    ]
    if d["kind"] == "tests" and t["tests"]["guards"]:
        lines.append(f"Write the acceptance tests on branch `{d['branch']}`, only in the test paths in Part 5. "
                     "Prove each behaviour test fails on the ticket's start commit, and paste that output into your report. "
                     "Guard tests may pass there (CR-42); report each one's result too.")
    elif d["kind"] == "tests":
        lines.append(f"Write the acceptance tests on branch `{d['branch']}`, only in the test paths in Part 5. "
                     "Prove each one fails on the ticket's start commit, and paste that output into your report.")
    elif d["kind"] == "build":
        lines.append(f"Work on branch `{d['branch']}`. Make the locked tests pass, changing only the files in Part 5. "
                     "Never edit a locked test. Run the verification after each task.")
    else:
        lines.append("You're on a detached checkout of the builder's result. Review the diff against the ticket, "
                     "the locked tests and the rules. Every finding cites evidence and a severity.")
    if renderer in NO_PUSH_BEFORE:
        lines.append("If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, "
                     "needs-dependency or out-of-scope. Don't start a new approach on your own.")
    else:  # CR-46 B6 adds stuck: the same failure three times
        lines.append("If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, "
                     "needs-dependency, out-of-scope or stuck. Don't start a new approach on your own.")
    end = "committed to the branch" if d["kind"] != "review" else "left uncommitted"
    if d["kind"] == "build" and renderer not in NO_PUSH_BEFORE:
        lines.append(f"End with your completion report at `{report_path(plan, d)}`, {end}. Once it says done, push "
                     f"the branch (`git push -u origin {d['branch']}`) and open its PR with `gh pr create`, the report "
                     "as its description. Push nothing else, and never merge.")
    else:
        lines.append(f"End with your completion report at `{report_path(plan, d)}`, {end}. Don't push.")
    return " ".join(lines)


def front_matter(plan, d):
    t = d["ticket"]
    after = []
    for x in dispatches(plan):
        if x["ticket"] is t and ((d["kind"] == "build" and x["kind"] == "tests") or
                                 (d["kind"] == "review" and x["kind"] == "build")):
            after.append(x["doc"])
    fields = [
        ("doc", d["doc"]), ("ticket", t["id"]), ("lane", plan["_lane"]), ("sprint", plan["_sprint"]),
        ("agent", d["agent"]), ("seat", d["seat"]), ("kind", d["kind"]), ("role", d["role"]),
        ("rigor", t["rigor"]), ("model", d["model"]), ("branch", d["branch"]), ("checkout", d["checkout"]),
        ("after", "[" + ", ".join(after) + "]"),
        ("depends_on", "[" + ", ".join(t["depends_on"]) + "]"),
        ("report", report_path(plan, d)),
    ]
    return "---\n" + "".join(f"{k}: {v}\n" for k, v in fields) + "---\n"


def task_doc(plan, d, all_plans_owned, renderer=RENDERER):
    t, s, lane = d["ticket"], plan["_seats"], plan["_lane"]
    cmds = plan["commands"]
    kind = d["kind"]
    me = cap(d["agent"])
    sp = sprint_path(plan)
    out = [front_matter(plan, d), ""]
    out.append(f"# {t['id']} · {kind} · {me}: {t['title']}")
    out.append("")
    out.append("<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, "
               "re-render, commit, and start a new attempt. -->")
    out.append("")
    out.append("| | |\n| --- | --- |")
    out.append(f"| Lane | {lane} · lead {cap(s['lead'])} |")
    out.append(f"| Sprint | {plan['_sprint']} · Step {plan.get('step', '?')} |")
    out.append(f"| Ticket | {t['id']} · rigor {t['rigor']} |")
    out.append(f"| Dispatch | {d['role']} · {me} ({d['seat']}) · model {d['model']} |")
    checkout = f"`{d['branch']}`" if d["checkout"] == "branch" else f"a detached checkout of `{d['branch']}`'s head"
    out.append(f"| Works on | {checkout} |")
    out.append(f"| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |")
    out.append("")

    out.append("## 1. Identity\n")
    out.append(f"You are **{me}** (`.claude/agents/{d['agent']}.md`). Lead: {cap(s['lead'])}. "
               f"Builder: {cap(s['builder'])}. Checker: {cap(s['checker'])}.\n")
    out.append(ROLE_LINE[kind] + (GUARD_LINE if kind == "tests" and t["tests"]["guards"] else "") + "\n")

    out.append("## 2. Context: read these first, in order\n")
    ctx = [
        (f".claude/agents/{d['agent']}.md", "who you are, and your always and never"),
        ("AGENTS.md", "the rules for the code itself"),
        ("docs/design/Build rules.md", "how work moves from a ticket to main; cite rules by ID"),
        (f"{sp}/codebase-analysis.md", "the codebase in short"),
    ]
    for c in plan.get("sources", []):
        ctx.append((c["path"], c["why"]))
    for c in t["context"]:
        ctx.append((c["path"], c["why"]))
    if kind in ("build", "review"):
        for p in t["tests"]["paths"]:
            ctx.append((p, "the locked acceptance tests: they define done"))
    if kind == "review":
        build = next(x for x in dispatches(plan) if x["ticket"] is t and x["kind"] == "build")
        ctx.append((report_path(plan, build), "the builder's completion report"))
        if t["rigor"] == "full":
            ctx.append(("docs/review/security-checklist.md", "full rigor: work through it item by item"))
    ctx.append((f"{sp}/{d['doc']}.md", "this document: follow it exactly"))
    for i, (p, why) in enumerate(ctx, 1):
        out.append(f"{i}. `{p}`: {why}")
    out.append("")

    out.append("## 3. Domain\n")
    out.append(f"**Goal:** {t['goal']}\n")
    if t["refs"]:
        out.append("**Refs:**\n" + bullets(t["refs"]) + "\n")
    if t["depends_on"]:
        out.append("**Merged before this starts:** " + ", ".join(t["depends_on"]) + "\n")
    if t["labels"]:
        out.append("**Labels:** " + ", ".join(t["labels"]) + (f" · implements {t['cr']}" if t["cr"] else "") + "\n")
    if t["notes"]:
        out.append("**Notes from the lead:**\n" + bullets(t["notes"]) + "\n")

    out.append("## 4. Tasks\n")
    test_cmd = cmds["test"]
    behaviours = t["tests"]["behaviours"]
    for i, b in enumerate(behaviours, 1):
        n = f"{t['id']}-{i:02d}"
        if kind == "tests":
            out.append(f"### {n}: a failing test for: {b}\n")
            out.append(f"- **Write:** one test, in the test paths, that proves this behaviour.")
            out.append(f"- **Verify:** `{test_cmd}` runs it, and it **fails** on the start commit for the right reason.\n")
        elif kind == "build":
            out.append(f"### {n}: make it true: {b}\n")
            out.append(f"- **Verify:** its locked test passes: " + ", ".join(f"`{v}`" for v in t["verify"]) + "\n")
        else:
            out.append(f"### {n}: check: {b}\n")
            out.append("- Is it built, and does a locked test actually prove it? Cite the test and the code.\n")
    for i, g in enumerate(t["tests"]["guards"], 1):
        n = f"{t['id']}-G{i:02d}"
        if kind == "tests":
            out.append(f"### {n}: a guard test for: {g}\n")
            out.append(f"- **Write:** one test, in the test paths, that holds this rule.")
            out.append(f"- **Verify:** `{test_cmd}` runs it. It may pass on the start commit (a guard, CR-42); "
                       "report whether it passed or failed there.\n")
        elif kind == "build":
            out.append(f"### {n}: keep it true: {g}\n")
            out.append(f"- **Verify:** its locked test passes: " + ", ".join(f"`{v}`" for v in t["verify"]) + "\n")
        else:
            out.append(f"### {n}: check: {g}\n")
            out.append("- Does a locked guard test hold it after the build? Cite the test.\n")
    if kind == "review":
        out.append(f"### {t['id']}-R: the rules\n")
        out.append("- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).")
        out.append("- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.")
        out.append("- No secret anywhere in the diff, tests, logs or report (E6).")
        if t["rigor"] == "full":
            out.append("- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.")
        out.append("")

    out.append("## 5. Territory\n")
    if kind == "tests":
        out.append("**You may change** (and create):\n" + code_list(t["tests"]["paths"]))
        out.append(f"- `{report_path(plan, d)}` (your report)\n")
    elif kind == "build":
        out.append("**You may change** (and create):\n" + code_list(t["may_change"]))
        out.append(f"- `{report_path(plan, d)}` (your report)\n")
        out.append("**Locked: never change** (A3, F2):\n" + code_list(t["tests"]["paths"]) + "\n")
    else:
        out.append("**You change no file** except your report and findings, both left uncommitted:")
        out.append(f"- `{report_path(plan, d)}`")
        out.append(f"- `{sp}/findings/{tid_l(t['id'])}-{d['agent']}-NN.md`, one per finding\n")
        out.append("**The build's territory**, for checking the diff:\n" + code_list(t["may_change"]) + "\n")
    never = t["must_not_change"] + plan["_seats"]["never"]
    out.append("**Never change, whatever the task says:**\n" + code_list(never))
    out.append("- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`\n")
    others = [(o_id, k, p) for (o_id, k, p) in all_plans_owned if o_id != t["id"]]
    if others:
        out.append("**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):\n")
        out.append("| Ticket | Kind | Paths |\n| --- | --- | --- |")
        grouped = {}
        for o_id, k, p in others:
            grouped.setdefault((o_id, k), []).append(p)
        for (o_id, k), ps in sorted(grouped.items()):
            out.append(f"| {o_id} | {k} | " + ", ".join(f"`{p}`" for p in ps) + " |")
        out.append("")

    out.append(f"## 6. Execution protocol: {kind}\n")
    common_start = [
        "Confirm where you are (`/dispatch` checks the branch or the detached checkout).",
        "Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).",
        f"Run `{test_cmd}` once before you change anything, so you know the starting state.",
    ]
    if kind == "tests":
        steps = common_start + [
            "Write one test per task in Part 4, in the test paths only. Real Postgres; `TestClock` and the Clock, Ids and Random services; never sleep on the wall clock (E10, F4).",
            "Every route gets the four from E13: the happy path with its DTO checked, the error body with `requestId`, the idempotent replay, the stale `rowVersion`." if plan["_lane"] == "backend" else
            "Cover every state the screen names (loading, empty, error, ready) against `contract-mock`. Every end-to-end test runs the WCAG 2.2 AA check and records a screenshot (E17, F6).",
            "No `.skip`, `.only` or `todo` (F3).",
            "Run them and confirm **every one fails**, for the reason the behaviour isn't built yet. A test that passes now is your bug (B2).",
            "Commit the tests and your report to the branch. The lead reviews them and writes the lock line.",
        ]
    elif kind == "build":
        steps = common_start + [
            "Read the locked tests before any code. They're the definition of done.",
            "Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: " + t["id"] + "`).",
            "Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).",
            "If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).",
            "When every task passes, run all of Part 7's commands, then write and commit your report.",
        ]
    else:
        steps = [
            "You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.",
            "Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).",
            "Run Part 7's commands yourself. A red command is a finding.",
            "Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.",
            "List what you checked and what you couldn't reach. Leave everything uncommitted.",
        ]
    for i, s_ in enumerate(steps, 1):
        out.append(f"{i}. {s_}")
    out.append("")

    out.append("## 7. Completion\n")
    out.append("**Verification** (run every one, in order, and paste the results into your report):\n")
    out.append("```sh")
    for k in ("build", "typecheck", "lint", "test"):
        if cmds.get(k):
            out.append(cmds[k])
    for v in t["verify"]:
        out.append(v)
    out.append("```\n")
    out.append(f"**Your report:** `{report_path(plan, d)}`. Its first lines are:\n")
    out.append("```")
    out.append("status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope"
               + ("" if renderer in NO_PUSH_BEFORE else " | stuck"))
    if kind == "review":
        out.append("verdict: pass | changes | block")
    out.append(f"ticket: {t['id']}")
    out.append("```\n")
    sections = ["Pre-flight: each verification command and its result",
                "What changed: every file, and why",
                "Contract to files: which requirement each change serves",
                "Deviations: anything done differently from this document, and why",
                "Limitations: what isn't covered, or couldn't be checked"]
    v1 = renderer == "avel-render 1"
    if kind == "tests":
        sections.insert(1, "Failing first: the output of the behaviour tests failing on the start commit, and each guard "
                           "test's result there (behaviour or guard, per test)" if t["tests"]["guards"] else
                        "Failing first: the output of the tests failing on the start commit")
        if v1:
            sections.append(f"Lock line, for the lead to copy into locks.md: `- {t['id']}: <test paths> @ <your last commit>`")
        else:
            sections.append(f"Lock line, for the lead to copy into locks.md: `- {t['id']}: <path>, <path> @ <branch tip>`, "
                            "the test paths separated by commas. The lead fills in the branch tip after your report commit")
    if kind == "review":
        sections = ["Pre-flight: each verification command and its result",
                    "Findings: one line each, with its severity and its file under findings/",
                    "Checked: what you checked, and against which rule",
                    "Not reached: what you couldn't check, and why"]
    if not v1:
        sections.append("Messages received: every instruction OSA relayed, who it came from, and what you did with it "
                        "(followed, or refused and why); \"None\" if there were none (CR-37)")
    out.append("Then these sections:\n" + bullets(sections) + "\n")

    out.append("## Activation prompt\n")
    out.append("> " + activation(plan, d, renderer) + "\n")
    return "\n".join(out)


def render_package(plan, owned, renderer=RENDERER):
    lane, sprint = plan["_lane"], plan["_sprint"]
    files = {}
    a = plan.get("analysis", {})
    ca = [f"# Codebase analysis: {lane}/{sprint}", "",
          "<!-- Rendered from plan.toml [analysis]. Never edit this file. -->", ""]
    for k, title in (("stack", "Stack"), ("layout", "Layout")):
        if a.get(k):
            ca += [f"## {title}", "", str(a[k]).strip(), ""]
    for k, title in (("conventions", "Conventions"), ("notes", "Notes")):
        if a.get(k):
            ca += [f"## {title}", "", bullets(a[k]), ""]
    ca += ["## Commands", "", "```sh"] + [f"{plan['commands'][k]}  # {k}" for k in ("build", "typecheck", "lint", "test")
                                           if plan["commands"].get(k)] + ["```", ""]
    files["codebase-analysis.md"] = "\n".join(ca)

    ds = dispatches(plan, renderer)
    s = plan["_seats"]
    dm = [f"# DISPATCH: {lane}/{sprint}: {plan['title']}", "",
          "<!-- Rendered by scripts/render.py from plan.toml. Never edit this file. -->", "",
          f"Lead: {cap(s['lead'])} · builder: {cap(s['builder'])} · checker: {cap(s['checker'])} · Step {plan.get('step', '?')}", ""]
    if plan.get("goals"):
        dm += ["## Goals", "", bullets(plan["goals"]), ""]
    dm += ["## Done when", "", bullets(plan["done_when"]), ""]
    dm += ["## Tickets", "", "| Ticket | Title | Rigor | Branch | Depends on |", "| --- | --- | --- | --- | --- |"]
    for tid in plan["_order"]:
        t = next(x for x in plan["ticket"] if x["id"] == tid)
        dm.append(f"| {tid} | {t['title']} | {t['rigor']} | `{branch_of(t)}` | {', '.join(t['depends_on']) or '—'} |")
    dm += ["", "## Dispatches", "",
           "Each ticket runs tests, then build (once its tests are in `locks.md`), then review (once the build has a report).", "",
           "| Task doc | Agent | Kind | Model |", "| --- | --- | --- | --- |"]
    for d in ds:
        dm.append(f"| `{d['doc']}.md` | {cap(d['agent'])} | {d['kind']} | {d['model']} |")
    dm += ["", "## Territory map", "", "| Ticket | Builds | Tests |", "| --- | --- | --- |"]
    for tid in plan["_order"]:
        t = next(x for x in plan["ticket"] if x["id"] == tid)
        dm.append(f"| {tid} | " + ", ".join(f"`{p}`" for p in t["may_change"]) + " | "
                  + ", ".join(f"`{p}`" for p in t["tests"]["paths"]) + " |")
    dm += ["", "## Merge order", "", "One ticket at a time, squash-merged with `Refs: <ticket>` (H1 to H3):", ""]
    dm += [f"{i}. {tid}" for i, tid in enumerate(plan["_order"], 1)]
    dm += ["", "## Commands", "", "```sh"] + [plan["commands"][k] for k in ("build", "typecheck", "lint", "test")
                                             if plan["commands"].get(k)] + ["```", ""]
    files["DISPATCH.md"] = "\n".join(dm)

    prompts = [f"# Activation prompts: {lane}/{sprint}", "",
               "<!-- Every task doc's activation prompt, archived. Rendered; never edit. -->", ""]
    for d in ds:
        files[d["doc"] + ".md"] = task_doc(plan, d, owned, renderer)
        prompts += [f"## {d['doc']}", "", "> " + activation(plan, d, renderer), ""]
    files["DISPATCH-PROMPTS.md"] = "\n".join(prompts)

    manifest = {"renderer": renderer, "plan_sha256": plan["_sha"], "lane": lane, "sprint": sprint,
                "files": {n: hashlib.sha256(files[n].encode()).hexdigest() for n in sorted(files)}}
    manifest["packageSha256"] = hashlib.sha256(
        "".join(f"{n} {h}\n" for n, h in manifest["files"].items()).encode()).hexdigest()
    files["MANIFEST.json"] = json.dumps(manifest, indent=2, sort_keys=True) + "\n"
    return files


def owned_paths(plans):
    out = []
    for plan in plans:
        for t in plan["ticket"]:
            for p in t["may_change"]:
                out.append((t["id"], "builds", p))
            for p in t["tests"]["paths"]:
                out.append((t["id"], "tests", p))
    return out


# ------------------------------------------------------------------ state

def read_attempts():
    path = os.path.join(state_dir(), "attempts.jsonl")
    out = []
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                try:
                    out.append(json.loads(line))
                except Exception:
                    pass
    return out


def running_markers():
    d = os.path.join(state_dir(), "running")
    live = []
    for name in sorted(os.listdir(d)):
        p = os.path.join(d, name)
        try:
            with open(p) as f:
                info = json.load(f)
            os.kill(int(info["pid"]), 0)
            live.append(info)
        except ProcessLookupError:
            os.remove(p)  # the session is gone; its marker is stale
        except Exception:
            pass
    return live


_MAIN_REPORTS = None


def ticket_merged(tid):
    """True when the ticket's build report is in main's tree. Only the ticket's own squash merge brings
    it there: the builder commits it on the ticket branch. A `Refs:` line is no proof, since a plan,
    CR or docs commit can name a ticket too (T-B5 looked merged on Nov 17 from a plan commit's Refs)."""
    global _MAIN_REPORTS
    if _MAIN_REPORTS is None:
        out = git("ls-tree", "-r", "--name-only", "main", "--", "docs/agent-dispatch")
        _MAIN_REPORTS = out.stdout.splitlines() if out.returncode == 0 else []
    pat = re.compile(r"^docs/agent-dispatch/[^/]+/sprint-\d{2}/agent-[a-z0-9]+-" + re.escape(tid_l(tid))
                     + r"-build-completion\.md$")
    return any(pat.match(p) for p in _MAIN_REPORTS)


LOCK_LINE = re.compile(r"^\s*[-*]\s*(?P<id>T-[A-Z]\d+)\s*:\s*(?P<paths>.*?)\s*@\s*(?P<sha>[0-9a-f]{7,40})"
                       r"(?P<relock>\s+\(F2 relock\))?\s*$")


def lock_line_problem(line):
    """Why a locks.md line that names a ticket isn't a valid lock line, or None. The format is
    `- T-B1: <path>, <path> @ <sha>`, optionally ending `(F2 relock)` (Build rules F2)."""
    m = LOCK_LINE.match(line)
    if not m:
        return "it isn't `- <ticket>: <path>, <path> @ <sha>`"
    paths = [p.strip() for p in m.group("paths").split(",")]
    if not all(paths):
        return "it has an empty path: separate the paths with commas"
    spaced = [p for p in paths if re.search(r"\s", p)]
    if spaced:
        return f"`{spaced[0]}` has a space: separate the paths with commas, not spaces"
    return None


def lock_line_mismatch(t, line):
    """Why a well-formed lock line doesn't lock t, or None (CR-50 decision 5): its commit must be on the
    ticket's branch, and each path one of the ticket's test paths. Otherwise a stale or hand-made line
    would start a build that only fails later, in CI's lock check."""
    m = LOCK_LINE.match(line)
    sha, paths = m.group("sha"), [p.strip() for p in m.group("paths").split(",")]
    if git("cat-file", "-e", f"{sha}^{{commit}}").returncode != 0:
        return f"its commit {sha} isn't in this repo"
    if git("merge-base", "--is-ancestor", sha, branch_of(t)).returncode != 0:
        return f"its commit {sha} isn't on {branch_of(t)}"
    globs = [glob_regex(g) for g in t["tests"]["paths"]]
    stray = [p for p in paths if not any(re.fullmatch(g, p) for g in globs)]
    if stray:
        return f"`{stray[0]}` isn't one of {t['id']}'s test paths"
    return None


def lock_state(plan, t):
    """(locked, why): whether t's lock line is in locks.md, on the ticket's branch (where the lead
    commits it) or in the working copy. A malformed line doesn't lock, and says why."""
    path = os.path.join(folder(plan["_lane"], plan["_sprint"]), "locks.md")
    texts = []
    out = git("show", f"{branch_of(t)}:{rel(path)}")
    if out.returncode == 0:
        texts.append(out.stdout)
    if os.path.exists(path):
        with open(path) as f:
            texts.append(f.read())
    mine = re.compile(r"^\s*[-*]?\s*" + re.escape(t["id"]) + r"\s*:")
    problem = None
    for text in texts:
        for line in text.splitlines():
            if not mine.match(line):
                continue
            why = lock_line_problem(line) or lock_line_mismatch(t, line)
            if why is None:
                return True, ""
            problem = problem or why
    if problem:
        return False, f"{t['id']}'s lock line in locks.md is malformed: {problem}"
    return False, f"for {t['id']}'s lock line in locks.md"


def locked(plan, t):
    return lock_state(plan, t)[0]


def report_status(plan, d, attempt=None):
    """(status, verdict) from the report of the dispatch's latest attempt, or None.

    Only that attempt's own copy counts. An earlier attempt's report says nothing about the latest
    (Nov 17: T-B3's build a2, killed by a crash, read as a1's test-dispute). Files in the reports
    folder that aren't an attempt's copy are ignored.
    """
    text = None
    sd = os.path.join(state_dir(), "reports")
    prefix = f"{plan['_lane']}-{plan['_sprint']}-{d['doc']}.a"
    copies = {}
    for f in (os.listdir(sd) if os.path.isdir(sd) else []):
        m = re.fullmatch(re.escape(prefix) + r"(\d+)\.md", f)
        if m:
            copies[int(m.group(1))] = f
    if attempt is None:
        key = (plan["_lane"], plan["_sprint"], d["doc"])
        attempt = max((a["attempt"] for a in read_attempts() if (a["lane"], a["sprint"], a["doc"]) == key),
                      default=None)
    if attempt is not None:
        if attempt in copies:
            with open(os.path.join(sd, copies[attempt])) as f:
                text = f.read()
    elif copies:
        with open(os.path.join(sd, copies[max(copies)])) as f:
            text = f.read()
    elif d["kind"] != "review":
        out = git("show", f"{d['branch']}:{report_path(plan, d)}")
        if out.returncode == 0:
            text = out.stdout
    if text is None:
        return None
    st = re.search(r"(?mi)^\s*status:\s*([a-z-]+)", text)
    vd = re.search(r"(?mi)^\s*verdict:\s*([a-z-]+)", text)
    return (st.group(1) if st else "unknown", vd.group(1) if vd else None)


MAX_FAILED = 2  # K2 and L3: a dispatch that failed twice isn't started a third time as it is (CR-46 B6)


def failed_attempts(plan, d, mine):
    """Attempts of this dispatch that ended without a done report. A resume is the same attempt (B2), and
    the latest attempt doesn't count yet while it can still be resumed: no report, never resumed, and
    its worktree still there (a crash is what a resume is for)."""
    nums = sorted({x["attempt"] for x in mine})
    failed = 0
    for a in nums:
        rep = report_status(plan, d, a)
        if rep and rep[0] == "done":
            continue
        rows = [x for x in mine if x["attempt"] == a]
        resumable = (a == nums[-1] and not rep and not any(x.get("mode") == "resumed" for x in rows)
                     and os.path.isdir(rows[0].get("worktree") or ""))
        failed += 0 if resumable else 1
    return failed


def dispatch_states(plan):
    attempts = read_attempts()
    live = {(m["lane"], m["sprint"], m["doc"]) for m in running_markers()}
    rows = []
    ds = dispatches(plan)
    for d in ds:
        t = d["ticket"]
        key = (plan["_lane"], plan["_sprint"], d["doc"])
        mine = [a for a in attempts if (a["lane"], a["sprint"], a["doc"]) == key]
        n = max([a["attempt"] for a in mine], default=0)
        rep = report_status(plan, d)
        if ticket_merged(t["id"]):
            state, why = "merged", ""
        elif key in live:
            state, why = "running", f"a{n}"
        elif rep and rep[0] == "done":
            state, why = "done", f"a{n}" + (f" · verdict {rep[1]}" if rep[1] else "")
        elif n >= MAX_FAILED and failed_attempts(plan, d, mine) >= MAX_FAILED:
            # CR-46 B6 with K2 and L3: two failed attempts, and nothing starts a third by itself.
            state, why = "needs-javaris", f"{MAX_FAILED} attempts failed (last a{n}: {rep[0] if rep else 'no report'}): K2, L3"
        elif rep:
            state, why = "stopped", f"{rep[0]} (a{n}): the lead decides"
        elif n:
            state, why = "stopped", f"no report (a{n}): the lead decides"
        else:
            waits = [dep for dep in t["depends_on"] if not ticket_merged(dep)]
            sib = {x["kind"]: x for x in ds if x["ticket"] is t}
            if waits:
                state, why = "waiting", "for " + ", ".join(waits) + " to merge"
            elif d["kind"] == "build" and not (report_status(plan, sib["tests"]) or ("",))[0] == "done":
                state, why = "waiting", "for the tests' report"
            elif d["kind"] == "build" and not lock_state(plan, t)[0]:
                state, why = "waiting", lock_state(plan, t)[1]
            elif d["kind"] == "review" and not (report_status(plan, sib["build"]) or ("",))[0] == "done":
                state, why = "waiting", "for the build's report"
            else:
                state, why = "ready", ""
        rows.append((d, state, why, n + 1))
    return rows


def package_problems(lane, sprint):
    """Why this sprint's package can't be dispatched: not rendered, not committed, or not what the plan renders."""
    f = folder(lane, sprint)
    man = os.path.join(f, "MANIFEST.json")
    if not os.path.exists(man):
        return [f"{lane}/{sprint} isn't rendered: scripts/render.py {lane}/{sprint}"]
    roster = load_json("roster.json")
    try:
        plan, _ = load_plan(lane, sprint, roster)
    except PlanError as e:
        return [str(e)]
    try:
        with open(man) as fh:
            renderer = json.load(fh).get("renderer", RENDERER)
    except Exception:
        renderer = RENDERER
    if renderer not in RENDERERS:
        return [f"{lane}/{sprint} was rendered by {renderer}, which this render.py doesn't know: re-render"]
    files = render_package(plan, owned_paths([plan]), renderer)
    problems = []
    for name, body in files.items():
        p = os.path.join(f, name)
        if not os.path.exists(p):
            problems.append(f"{name} is missing: re-render")
            continue
        with open(p, encoding="utf-8") as fh:
            if fh.read() != body:
                problems.append(f"{name} differs from a fresh render (edited, or the plan changed): re-render and commit")
    names = list(files) + ["plan.toml"] + (["locks.md"] if os.path.exists(os.path.join(f, "locks.md")) else [])
    paths = [rel(os.path.join(f, n)) for n in names]
    tracked = git("ls-files", "--", *paths).stdout.split()
    for p in paths:
        if p not in tracked:
            problems.append(f"{p} isn't committed")
    if git("diff", "--quiet", "HEAD", "--", *paths).returncode != 0:
        problems.append(f"{lane}/{sprint} has uncommitted changes: commit the folder first")
    return problems


def current_sprint(lane, rendered_only=False):
    d = os.path.join(DISPATCH, lane)
    if not os.path.isdir(d):
        return None
    names = sorted(n for n in os.listdir(d) if re.fullmatch(r"sprint-\d{2}", n)
                   and os.path.exists(os.path.join(d, n, "MANIFEST.json" if rendered_only else "plan.toml")))
    return names[-1] if names else None


# ------------------------------------------------------------------ commands

STARTER = '''# {lane}/{sprint}: the sprint's plan. {lead} writes it; Javaris approves it (Build rules B1).
# Each [[ticket]] renders into three task docs: {checker}'s tests, {builder}'s build, {checker}'s review.
# Check it:   scripts/render.py --check {lane}/{sprint}
# Render it:  scripts/render.py {lane}/{sprint}   (after approval), then commit the folder.

lane = "{lane}"
sprint = "{sprint}"
step = 1
title = "Step 1: <what this cycle delivers>"
goals = ["<one line a person would notice>"]
done_when = ["<the step plan's test this sprint serves, e.g. Step 0 and Step 1 plan, test 6>"]
sources = [
  {{ path = "docs/design/Step 0 and Step 1 plan.md", why = "the step's tests" }},
]

[commands]
build = "pnpm build"
typecheck = "pnpm typecheck"
lint = "pnpm lint"
test = "pnpm test"

[analysis]
stack = "Node 22, Hono, oRPC, Zod 4, Drizzle on node-postgres, Postgres, Effect 4 inside the server"
layout = "packages/contract, packages/contract-mock, packages/db, packages/server, apps/web"
conventions = ["AGENTS.md is the rulebook"]
notes = []

[[ticket]]
id = "{prefix}1"                     # never reused (C6)
slug = "short-name"                  # the branch is t/<id without T->-<slug>
title = "<what it does>"
goal = "<one sentence a person would notice>"
rigor = "standard"                   # or "full" for a C4 area
refs = ["<plan, test number>"]
depends_on = []                      # ticket ids merged first
labels = []                          # "contract" or "schema" for I3 tickets, with cr = "CR-NN"
may_change = ["<globs the builder may change>"]
must_not_change = []
context = [
  {{ path = "<file>", why = "<why the agent reads it>" }},
]
verify = ["<the command that proves it>"]
notes = []

[ticket.tests]
role = "{test_role}"
paths = ["<the test files {checker} writes>"]
behaviours = [
  "<one behaviour per test>",
]
# guards = ["<a rule that may already hold on main: accessibility, a budget, a standing rule, a regression (CR-42)>"]
'''

LOCKS = '''# Locks: {lane}/{sprint}

The lead adds one line per ticket once the checker's tests are committed and reviewed, copied
from the tests report. The build starts once its line is here (Build rules B2, B3, H6).

One line per ticket: the test paths separated by commas, then @ and the tip of the tests dispatch's
branch after the checker's report commit. Run check-locks on the branch before the build starts.
If a locked test changes after a test-dispute (F2), the checker commits the fix and the lead adds a
second line for the ticket ending (F2 relock), at the new tip. Lines are only ever added.

<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ abc1234 -->
<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ def5678 (F2 relock) -->
'''


def cmd_new(target):
    lane, sprint = parse_target(target)
    roster = load_json("roster.json")
    s = roster["lanes"].get(lane) or sys.exit(f"unknown lane {lane}")
    f = folder(lane, sprint)
    os.makedirs(f, exist_ok=True)
    p = os.path.join(f, "plan.toml")
    if os.path.exists(p):
        sys.exit(f"{rel(p)} already exists")
    with open(p, "w") as fh:
        fh.write(STARTER.format(lane=lane, sprint=sprint, lead=cap(s["lead"]), builder=cap(s["builder"]),
                                checker=cap(s["checker"]), prefix=s["prefix"], test_role=s["test_roles"][0]))
    lp = os.path.join(f, "locks.md")
    if not os.path.exists(lp):
        with open(lp, "w") as fh:
            fh.write(LOCKS.format(lane=lane, sprint=sprint))
    print(f"wrote {rel(p)} and {rel(lp)}")


def cmd_check(targets, write=False):
    roster = load_json("roster.json")
    plans, failed = [], False
    for target in targets:
        lane, sprint = parse_target(target)
        try:
            plan, warnings = load_plan(lane, sprint, roster)
            plans.append(plan)
            for w in warnings:
                print(f"warning: {lane}/{sprint}: {w}", file=sys.stderr)
        except PlanError as e:
            print(e, file=sys.stderr)
            failed = True
    if failed:
        sys.exit(1)
    lanes_given = {p["_lane"] for p in plans}
    extra = []
    for lane in roster["lanes"]:
        if lane not in lanes_given:
            cur = current_sprint(lane, rendered_only=True)
            if cur:
                try:
                    p, _ = load_plan(lane, cur, roster)
                    extra.append(p)
                except PlanError:
                    pass
    clashes = territory_clashes(plans + extra)
    if clashes:
        print("\n".join("overlap: " + c for c in clashes), file=sys.stderr)
        sys.exit(1)
    if not write:
        for p in plans:
            print(f"{p['_lane']}/{p['_sprint']}: ok, {len(p['ticket'])} tickets, {3 * len(p['ticket'])} dispatches")
        return
    for plan in plans:
        f = folder(plan["_lane"], plan["_sprint"])
        files = render_package(plan, owned_paths([plan]))
        old = os.path.join(f, "MANIFEST.json")
        if os.path.exists(old):
            with open(old) as fh:
                for name in json.load(fh).get("files", {}):
                    if name not in files and os.path.exists(os.path.join(f, name)):
                        os.remove(os.path.join(f, name))
        for name, body in files.items():
            with open(os.path.join(f, name), "w", encoding="utf-8", newline="\n") as fh:
                fh.write(body)
        lp = os.path.join(f, "locks.md")
        if not os.path.exists(lp):
            with open(lp, "w") as fh:
                fh.write(LOCKS.format(lane=plan["_lane"], sprint=plan["_sprint"]))
        man = json.loads(files["MANIFEST.json"])
        print(f"rendered {rel(f)}: {len(files)} files, package {man['packageSha256'][:12]}. Read it, then commit the folder.")


def load_for_state(target):
    lane, sprint = parse_target(target)
    roster = load_json("roster.json")
    try:
        plan, _ = load_plan(lane, sprint, roster)
    except PlanError as e:
        sys.exit(str(e))
    return plan


def cmd_status(target):
    plan = load_for_state(target)
    problems = package_problems(plan["_lane"], plan["_sprint"])
    print(f"{plan['_lane']}/{plan['_sprint']}: {plan['title']}")
    for p in problems:
        print(f"  ! {p}")
    for d, state, why, _ in dispatch_states(plan):
        print(f"  {state:<8} {d['doc']:<34} {why}")


def cmd_ready(target):
    plan = load_for_state(target)
    if package_problems(plan["_lane"], plan["_sprint"]):
        return
    for d, state, _, n in dispatch_states(plan):
        if state == "ready":
            print(f"{plan['_lane']}\t{plan['_sprint']}\t{d['doc']}\t{n}")


def cmd_state(target, doc):
    plan = load_for_state(target)
    for d, state, _, n in dispatch_states(plan):
        if d["doc"] == doc:
            print(f"{state}\t{n}")
            return
    sys.exit(f"no task doc {doc} in {target}")


def rendered_sprints(lane):
    d = os.path.join(DISPATCH, lane)
    if not os.path.isdir(d):
        return []
    return sorted(n for n in os.listdir(d) if re.fullmatch(r"sprint-\d{2}", n)
                  and os.path.exists(os.path.join(d, n, "MANIFEST.json")))


def cmd_next(lane, agent):
    """The agent's next ready dispatch in any of the lane's rendered sprints, oldest sprint first. Several
    sprints are in flight at once (frontend 12 to 14, Nov 20), and the newest-only search left sprint-12
    and 13 work ready with no session (Nov 21)."""
    for sprint in rendered_sprints(lane):
        try:
            plan = load_for_state(f"{lane}/{sprint}")
        except SystemExit:
            continue
        if package_problems(lane, sprint):
            continue
        for d, state, _, n in dispatch_states(plan):
            if state == "ready" and d["agent"] == agent:
                print(f"{sprint}\t{d['doc']}\t{n}")
                return


def cmd_docs(agent):
    roster = load_json("roster.json")
    for lane in roster["lanes"]:
        d = os.path.join(DISPATCH, lane)
        if not os.path.isdir(d):
            continue
        for sprint in sorted(os.listdir(d)):
            if not os.path.exists(os.path.join(d, sprint, "MANIFEST.json")):
                continue
            try:
                plan, _ = load_plan(lane, sprint, roster)
            except PlanError:
                continue
            for x, state, _, n in dispatch_states(plan):
                if x["agent"] == agent and state in ("ready", "stopped"):
                    print(f"{lane}\t{sprint}\t{x['doc']}\t{n}")


def package_renderer(plan):
    """The renderer a rendered package names in its MANIFEST.json (the current one if it has none)."""
    try:
        with open(os.path.join(folder(plan["_lane"], plan["_sprint"]), "MANIFEST.json")) as fh:
            return json.load(fh).get("renderer", RENDERER)
    except Exception:
        return RENDERER


def cmd_info(target, doc):
    plan = load_for_state(target)
    for d in dispatches(plan):
        if d["doc"] == doc:
            vals = {"AGENT": d["agent"], "SEAT": d["seat"], "KIND": d["kind"], "ROLE": d["role"],
                    "TICKET": d["ticket"]["id"], "BRANCH": d["branch"], "CHECKOUT": d["checkout"],
                    "MODEL": d["model"], "RIGOR": d["ticket"]["rigor"], "REPORT": report_path(plan, d),
                    "FINDINGS": f"{sprint_path(plan)}/findings", "ACTIVATION": activation(plan, d, package_renderer(plan)),
                    "DOC_PATH": f"{sprint_path(plan)}/{d['doc']}.md", "WEIGHT": str(weight(plan, d))}
            for k, v in vals.items():
                print(f"{k}={shlex.quote(v)}")
            return
    sys.exit(f"no task doc {doc} in {target}")


def weight(plan, d):
    """B7: a session that runs the web's Playwright suite counts as two. That's an e2e tests dispatch, and a
    build or review in a sprint whose test command runs Playwright; a unit tests dispatch counts as one."""
    if d["kind"] == "tests":
        return 2 if d["role"] == "test-e2e" else 1
    return 2 if "playwright" in (plan.get("commands", {}).get("test") or "") else 1


def cmd_slots(lane, seat, incoming="1"):
    limits = load_json("limits.json")["sessions"]
    live = running_markers()
    used = sum(int(m.get("weight", 1)) for m in live)
    if used + int(incoming) > limits["total"]:
        sys.exit(f"{used} of {limits['total']} session slots are in use and this one needs {incoming} "
                 f"(B7: a session running the web's Playwright suite counts as two)")
    same = [m for m in live if m["lane"] == lane and m["seat"] == seat]
    cap_ = limits["per_lane"].get(seat, 1)
    if len(same) >= cap_:
        sys.exit(f"the {lane} {seat} is already running {same[0]['doc']} a{same[0]['attempt']} (B7)")


def cmd_record(target, doc, attempt, worktree, base, mode):
    lane, sprint = parse_target(target)
    row = {"lane": lane, "sprint": sprint, "doc": doc, "attempt": int(attempt), "worktree": worktree,
           "base": base, "mode": mode, "started": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    with open(os.path.join(state_dir(), "attempts.jsonl"), "a") as f:
        f.write(json.dumps(row, sort_keys=True) + "\n")


def cmd_last(target, doc):
    """The doc's latest attempt, for agent.sh --resume (CR-46 B2): its number, worktree, base and
    first mode, how many times it was resumed, and whether it left a report. Exit 1 if it never ran."""
    lane, sprint = parse_target(target)
    rows = [a for a in read_attempts() if (a["lane"], a["sprint"], a["doc"]) == (lane, sprint, doc)]
    if not rows:
        sys.exit(f"{doc} has never run")
    n = max(a["attempt"] for a in rows)
    mine = [a for a in rows if a["attempt"] == n]
    first = next((a for a in mine if a.get("mode") != "resumed"), mine[0])
    copy = os.path.join(state_dir(), "reports", f"{lane}-{sprint}-{doc}.a{n}.md")
    vals = {"LAST_ATTEMPT": str(n), "LAST_WORKTREE": first.get("worktree", ""), "LAST_BASE": first.get("base", ""),
            "LAST_MODE": first.get("mode", ""), "RESUMES": str(sum(a.get("mode") == "resumed" for a in mine)),
            "HAS_REPORT": "1" if os.path.exists(copy) else "0"}
    for k, v in vals.items():
        print(f"{k}={shlex.quote(v)}")


def cmd_verify(target):
    lane, sprint = parse_target(target)
    problems = package_problems(lane, sprint)
    if problems:
        sys.exit("\n".join(problems))
    print(f"{lane}/{sprint}: committed and matches a fresh render")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group()
    for flag in ("--new", "--verify", "--status", "--ready", "--docs"):
        g.add_argument(flag, metavar="X")
    g.add_argument("--check", action="store_true")
    g.add_argument("--next", nargs=2, metavar=("LANE", "AGENT"))
    g.add_argument("--info", nargs=2, metavar=("TARGET", "DOC"))
    g.add_argument("--state", nargs=2, metavar=("TARGET", "DOC"))
    g.add_argument("--slots", nargs="+", metavar="LANE SEAT [WEIGHT]")
    g.add_argument("--merged", metavar="TICKET")
    g.add_argument("--last", nargs=2, metavar=("TARGET", "DOC"))
    g.add_argument("--record", nargs=6, metavar=("TARGET", "DOC", "N", "WORKTREE", "BASE", "MODE"))
    ap.add_argument("targets", nargs="*")
    a = ap.parse_args()
    if a.new:
        cmd_new(a.new)
    elif a.check:
        cmd_check(a.targets or ap.error("--check needs <lane>/sprint-NN"))
    elif a.verify:
        cmd_verify(a.verify)
    elif a.status:
        cmd_status(a.status)
    elif a.ready:
        cmd_ready(a.ready)
    elif a.docs:
        cmd_docs(a.docs)
    elif a.next:
        cmd_next(*a.next)
    elif a.info:
        cmd_info(*a.info)
    elif a.state:
        cmd_state(*a.state)
    elif a.slots:
        cmd_slots(*a.slots)
    elif a.record:
        cmd_record(*a.record)
    elif a.last:
        cmd_last(*a.last)
    elif a.merged:
        # agent.sh --prune: exit 0 when the ticket's squash merge is on main, 1 when it isn't
        merged = ticket_merged(a.merged.upper())
        print("merged" if merged else "not merged")
        sys.exit(0 if merged else 1)
    elif a.targets:
        cmd_check(a.targets, write=True)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
