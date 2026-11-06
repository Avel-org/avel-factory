#!/usr/bin/env python3
"""The minimal renderer (CR-16): one sprint's plan file in, its dispatch package out.

Phase 1 stand-in for the `factory` module's renderer (Step 8). It fills
agent-dispatch's templates (docs/agent-dispatch/templates, vendored) with the
factory's changes (docs/agent-dispatch/avel/dispatch-kit.md) from a short plan
file, so no task doc or prompt is ever written by hand.

  docs/agent-dispatch/<team>/<sprint>/plan.toml       in: written by the lead
  docs/agent-dispatch/<team>/<sprint>/
    codebase-analysis.md                              out: the stack and commands
    DISPATCH.md                                       out: goals, chains, dispatches, order
    agent-<agent>-<module>-<role>.md                  out: one task doc per dispatch,
                                                           seven parts, Activation last
    DISPATCH-PROMPTS.md                               out: every activation prompt
    MANIFEST.json                                     out: every file's sha256 and the package's

The same plan always gives the same bytes. Rendering checks the plan first
(roles, roster, territories, dependencies: a hand-run part of Gate 1) and
writes nothing if a check fails. Completion reports are never rendered: the
agents write them.

Usage:
  scripts/render.py <team>/<sprint>            render (or re-render) the package
  scripts/render.py <team>/<sprint> --check    exit 1 if the package on disk isn't what the plan renders
  scripts/render.py --new <team>/<sprint>      write a starter plan.toml to fill in
  scripts/render.py --ready <team>/<sprint>    what can start now (used by scripts/dispatch.sh)
"""
import fnmatch
import hashlib
import json
import re
import subprocess
import sys
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))
import merge_board  # noqa: E402

KIT = "docs/agent-dispatch"
PROJECT = "avel-factory"
ABOUT = ("the AVEL software factory: a TypeScript monorepo (Hono and oRPC server, Drizzle on Postgres, "
         "a React web app) that builds client software through agents and gates")

# Which agent may take which role (Roster setup and sessions; merge_board.ROLES).
ROLE_AGENTS = {
    "build": {"backend": {"soap", "iyo", "atlas", "ghost"}, "frontend": {"nemi", "fantem", "leon", "ghost"}},
    "test-unit": {"backend": {"rigg"}, "frontend": {"fenn"}},
    "test-e2e": {"backend": {"rigg"}, "frontend": {"fenn"}},
    "api-contract": {"backend": {"axis"}},
    "ui-contract": {"frontend": {"zero"}},
    "review-backend": {"backend": {"axis"}},
    "review-frontend": {"frontend": {"zero"}},
    "review-spec": {"backend": {"brennan"}, "frontend": {"brennan"}},
    "review-security": {"backend": {"zane"}, "frontend": {"zane"}},
    "review-a11y-perf": {"backend": {"leah"}, "frontend": {"leah"}},
    "red-team": {"backend": {"breach"}, "frontend": {"breach"}},
}
assert set(ROLE_AGENTS) == set(merge_board.ROLES)
# Territory rule 3 (Roster setup and sessions): what each team never touches.
FORBIDDEN = {
    "backend": ["apps/web/**", "packages/contract-mock/**"],
    "frontend": ["packages/server/**", "packages/db/**", "packages/contract/**"],
}
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SPRINT_RE = re.compile(r"^sprint-\d{2}$")


class PlanError(Exception):
    pass


# ---------------------------------------------------------------- the plan

@dataclass
class Task:
    title: str
    priority: str = "P1"
    current: str = ""
    required: str = ""
    verify: str = ""
    expected: str = ""


@dataclass
class Dispatch:
    agent: str
    module: str
    role: str
    domain: str
    context: list            # [(path, why)]
    territory: list          # globs it may change
    after: list              # task names that must be merged into main first
    chains: list             # chain ids from the plan
    tasks: list              # [Task]
    verify: list             # extra verification commands
    notes: list
    kind: str = ""
    name: str = ""
    locked_out: list = field(default_factory=list)   # [(glob, owner)] other dispatches' paths

    @property
    def title(self):         # the tab title agent.sh gives it, minus the attempt
        return f"{self.agent.upper()} {self.module}-{self.role}"


@dataclass
class Chain:
    id: str
    title: str
    priority: str
    vector: str
    signal: str
    fix: str
    verify: str


@dataclass
class Plan:
    team: str
    sprint: str
    title: str
    lead: str
    step: str
    goals: list
    done_when: list
    sources: list
    commands: dict
    analysis: dict
    chains: dict
    dispatches: list
    folder: str

    def by_name(self, name):
        return next((d for d in self.dispatches if d.name == name), None)


def _list(v, what):
    if v is None:
        return []
    if isinstance(v, str):
        return [v]
    if not isinstance(v, list):
        raise PlanError(f"{what} must be a list")
    return v


def load(team, sprint, repo=REPO):
    folder = f"{KIT}/{team}/{sprint}"
    path = Path(repo) / folder / "plan.toml"
    if not path.is_file():
        raise PlanError(f"no plan at {folder}/plan.toml (start one with: scripts/render.py --new {team}/{sprint})")
    try:
        raw = tomllib.loads(path.read_text())
    except tomllib.TOMLDecodeError as e:
        raise PlanError(f"plan.toml: {e}")
    for k in ("team", "sprint"):
        if raw.get(k) != {"team": team, "sprint": sprint}[k]:
            raise PlanError(f"plan.toml says {k} = {raw.get(k)!r}, but it sits in {folder}")
    chains = {}
    for c in raw.get("chain", []):
        ch = Chain(c.get("id", ""), c.get("title", ""), c.get("priority", "P1"), c.get("vector", ""),
                   c.get("signal", ""), c.get("fix", ""), c.get("verify", ""))
        if not ch.id or ch.id in chains:
            raise PlanError(f"chain {ch.id!r}: every chain needs a unique id")
        chains[ch.id] = ch
    dispatches = []
    for i, d in enumerate(raw.get("dispatch", []), 1):
        where = f"dispatch {i}"
        ctx = []
        for c in _list(d.get("context"), f"{where}: context"):
            if isinstance(c, dict):
                ctx.append((c.get("path", ""), c.get("why", "")))
            elif isinstance(c, list) and len(c) == 2:
                ctx.append((c[0], c[1]))
            else:
                raise PlanError(f"{where}: context entries are {{ path = \"…\", why = \"…\" }}")
        tasks = [Task(t.get("title", ""), t.get("priority", "P1"), t.get("current", ""), t.get("required", ""),
                      t.get("verify", ""), t.get("expected", "")) for t in d.get("task", [])]
        dispatches.append(Dispatch(
            agent=d.get("agent", ""), module=d.get("module", ""), role=d.get("role", ""),
            domain=d.get("domain", "").strip(), context=ctx,
            territory=_list(d.get("territory"), f"{where}: territory"),
            after=_list(d.get("after"), f"{where}: after"), chains=_list(d.get("chains"), f"{where}: chains"),
            tasks=tasks, verify=_list(d.get("verify"), f"{where}: verify"),
            notes=_list(d.get("notes"), f"{where}: notes")))
    return Plan(team=team, sprint=sprint, title=raw.get("title", ""), lead=raw.get("lead", ""),
                step=str(raw.get("step", "")), goals=_list(raw.get("goals"), "goals"),
                done_when=_list(raw.get("done_when"), "done_when"), sources=_list(raw.get("sources"), "sources"),
                commands=raw.get("commands", {}), analysis=raw.get("analysis", {}), chains=chains,
                dispatches=dispatches, folder=folder)


# ---------------------------------------------------------------- checks (Gate 1, by hand)

def expand(glob):
    """packages/{server,db}/test/** -> both paths."""
    m = re.search(r"\{([^{}]*)\}", glob)
    if not m:
        return [glob]
    return [x for alt in m.group(1).split(",") for x in expand(glob[:m.start()] + alt + glob[m.end():])]


def stem(glob):
    """The literal folders before the first wildcard."""
    parts = []
    for p in glob.split("/"):
        if any(ch in p for ch in "*?["):
            break
        parts.append(p)
    return parts


def overlaps(a, b):
    """True if two globs can match the same path. Conservative: a wildcard after
    a shared literal prefix counts as reaching anything below it."""
    for x in expand(a):
        for y in expand(b):
            if x == y or fnmatch.fnmatch(x, y) or fnmatch.fnmatch(y, x):
                return True
            sx, sy = stem(x), stem(y)
            n = min(len(sx), len(sy))
            if sx[:n] != sy[:n]:
                continue
            wild_x, wild_y = len(sx) < len(x.split("/")), len(sy) < len(y.split("/"))
            if (len(sx) <= len(sy) and wild_x) or (len(sy) <= len(sx) and wild_y):
                return True
    return False


def report_path(plan, d):
    return f"{plan.folder}/{d.name}-completion.md"


def findings_glob(plan, d):
    return f"{plan.folder}/findings/{d.module}-{d.agent}-*.md"


def own_paths(plan, d):
    """What a dispatch may write: its territory, plus its report (and a reviewer's findings)."""
    paths = list(d.territory) + [report_path(plan, d)]
    if d.kind == "review":
        paths.append(findings_glob(plan, d))
    return paths


def check(plan):
    errors = []
    if not plan.title:
        errors.append("title is empty")
    if plan.lead not in {"backend": {"axis"}, "frontend": {"zero"}}[plan.team]:
        errors.append(f"lead must be {'axis' if plan.team == 'backend' else 'zero'}, not {plan.lead!r}")
    if not plan.done_when:
        errors.append("done_when is empty: the sprint needs the tests that say it's done")
    for k in ("build", "test"):
        if not plan.commands.get(k):
            errors.append(f"[commands] {k} is missing")
    names = set()
    for i, d in enumerate(plan.dispatches, 1):
        where = f"dispatch {i} ({d.agent} {d.module} {d.role})"
        if d.role not in ROLE_AGENTS:
            errors.append(f"{where}: role must be one of {', '.join(merge_board.ROLES)}")
            continue
        d.kind = merge_board.kind_of(d.role)
        allowed = ROLE_AGENTS[d.role].get(plan.team, set())
        if d.agent not in allowed:
            errors.append(f"{where}: {d.role} on the {plan.team} team is "
                          + (", ".join(sorted(allowed)) if allowed else "not a role this team has"))
        if not NAME_RE.match(d.module) or d.module.endswith(tuple("-" + r for r in merge_board.ROLES)):
            errors.append(f"{where}: module must be lowercase words joined by '-', like m2 or m1-platform")
        d.name = f"agent-{d.agent}-{d.module}-{d.role}"
        m = merge_board.TASK_RE.match(d.name)
        if not m or m.groups() != (d.agent, d.module, d.role):
            errors.append(f"{where}: {d.name} doesn't read back as agent, module and role")
        if d.name in names:
            errors.append(f"{where}: {d.name} is in the plan twice")
        names.add(d.name)
        if not d.domain:
            errors.append(f"{where}: domain is empty (what it owns and builds this sprint)")
        if not d.tasks:
            errors.append(f"{where}: no [[dispatch.task]]")
        for t in d.tasks:
            if not t.title or not t.verify:
                errors.append(f"{where}: every task needs a title and a verify command")
        for c in d.chains:
            if c not in plan.chains:
                errors.append(f"{where}: chain {c!r} isn't in the plan's [[chain]] list")
        if d.kind in ("build", "test", "contract") and not d.territory:
            errors.append(f"{where}: a {d.kind} dispatch needs a territory")
        if d.kind == "review" and d.territory:
            errors.append(f"{where}: reviewers write only their report and findings: drop territory")
        for g in d.territory:
            if g.startswith(("/", "../")) or ".." in g.split("/"):
                errors.append(f"{where}: territory {g!r} must be a repo-relative path")
            for bad in FORBIDDEN[plan.team]:
                if overlaps(g, bad):
                    errors.append(f"{where}: {g} crosses into {bad}, which the {plan.team} team never touches")
            if g.startswith((".claude/", KIT + "/")) or g in (".claude/**", KIT + "/**"):
                errors.append(f"{where}: {g} is in no territory (agent files and the dispatch kit)")
    if errors:
        return errors
    # Dependencies: inside this plan, or another sprint's task as <team>/<sprint>/<name>.
    for d in plan.dispatches:
        for a in d.after:
            if "/" in a:
                if not re.match(r"^(backend|frontend)/sprint-\d{2}/agent-[a-z0-9-]+$", a):
                    errors.append(f"{d.name}: after {a!r} should be <team>/<sprint>/<task name>")
            elif not plan.by_name(a):
                errors.append(f"{d.name}: after {a!r} isn't a dispatch in this plan")
            elif a == d.name:
                errors.append(f"{d.name}: it can't wait on itself")
    seen, stack = set(), set()

    def visit(n):
        if n in stack:
            raise PlanError(f"dependency loop through {n}")
        if n in seen:
            return
        stack.add(n)
        for a in plan.by_name(n).after:
            if "/" not in a and plan.by_name(a):
                visit(a)
        stack.discard(n)
        seen.add(n)
    try:
        for d in plan.dispatches:
            visit(d.name)
    except PlanError as e:
        errors.append(str(e))
    # Territories: one writer per path. A module's builder and its test writer
    # may share a folder: the tests are locked before the build starts, and the
    # builder's task doc lists them as off limits.
    writers = [d for d in plan.dispatches if d.kind != "review"]
    for i, a in enumerate(writers):
        for b in writers[i + 1:]:
            pair = {a.kind, b.kind}
            for ga in a.territory:
                for gb in b.territory:
                    if not overlaps(ga, gb):
                        continue
                    if pair == {"build", "test"}:
                        continue
                    errors.append(f"{a.name} ({ga}) and {b.name} ({gb}) would both write the same paths")
    return errors


def fill_locked_out(plan):
    """Each dispatch's DO NOT list: every other dispatch's paths, with the owner's name."""
    for d in plan.dispatches:
        out = []
        for o in plan.dispatches:
            if o is d:
                continue
            for g in own_paths(plan, o) if o.kind != "review" else []:
                if g.startswith(plan.folder + "/"):
                    continue
                if (g, o.agent.upper()) not in out:
                    out.append((g, o.agent.upper() + (", locked tests" if o.kind == "test" else "")))
        d.locked_out = sorted(set(out))


# ---------------------------------------------------------------- rendering

def bullets(items, indent=""):
    return "\n".join(f"{indent}- {x}" for x in items) if items else f"{indent}- (none)"


def code(cmds):
    return "```bash\n" + "\n".join(cmds) + "\n```"


def verification_cmds(plan, d):
    c = plan.commands
    cmds = []
    for k in ("build", "typecheck", "lint", "test"):
        if c.get(k):
            cmds.append(c[k])
    cmds += d.verify
    return cmds


def task_ids(d):
    return [f"{d.agent.upper()}-{i:02d}" for i in range(1, len(d.tasks) + 1)]


def start_rule(plan, d):
    deps = [a for a in d.after]
    if d.kind == "test":
        why = "first"
    elif d.kind == "build":
        tests = [t.name for t in plan.dispatches if t.module == d.module and t.kind == "test"]
        why = ("once " + ", ".join(f"`{t}`" for t in tests) + " is merged and listed in `locks.md`") if tests \
            else "at once (no test dispatch in this module)"
    elif d.kind == "review":
        target = review_target(plan, d)
        why = (f"once `{target.name}` has its completion report, checked out at its result commit"
               if target else "at once")
    else:
        why = "first"
    if deps:
        why += "; after " + ", ".join(f"`{a}`" for a in deps) + " is merged into main"
    return why


def review_target(plan, d):
    """What a review reads: the module's build, or else its contract."""
    for kind in ("build", "contract"):
        for t in plan.dispatches:
            if t.module == d.module and t.kind == kind and t is not d:
                return t
    return None


PROTOCOL = {
    "build": """\
**Before you change anything, for every chain or task:**
1. Read the vector end to end: what calls this, what it calls, what breaks if it changes.
2. Read 3 to 5 files beside the place you'll change. Match their naming, error handling, imports and signatures exactly. You match the codebase; the codebase doesn't match you.
3. Find every caller and callee of what you change. Know the blast radius first.
4. List the failure modes (empty input, concurrent access, timeouts, partial failure) and handle each one.

**While you work:**
- Keep changes surgical: the task, nothing around it. No refactors, no unassigned features, no TODO placeholders, no swallowed errors.
- Never edit a locked test. If a locked test looks wrong, stop and say so under Deviations in your report; don't change it.
- Run the build and the tests after each meaningful change.

**After each chain or task:** run every command in Part 7's verification. If one fails, fix it before you move on. If it still fails after 3 different approaches, **park** it: write what you tried under Parked chains, commit, and go to the next. Never pile up broken chains.

**A P0 you weren't asked about** (data loss, a security hole, a race, broken auth): stop, write it under P0 discoveries with the full trace, commit what you have. Don't fix anything outside your territory.""",
    "test": """\
**Fail first, then lock.** A test counts only if:
1. it carries one scenario ID (the done-when number or the task ID) in its name;
2. it fails with an assertion, not a syntax, import or setup error;
3. it fails the same way 3 runs in a row.
A test that pins behaviour that already exists must pass instead, and says so in its name.

**While you work:**
- Write tests only, inside your territory. Never write application code to make a test pass or compile; stub through the test helpers instead.
- Test against real Postgres (`scripts/pg-local.sh`), never mocks of the database.
- Match the test patterns already in the repo: helpers, fixtures, naming.

**When the tests are written:** run them 3 times and keep the output. Commit them in one commit, and put its sha in your report: the operator locks your paths at that commit (`locks.md`) before the builder starts. After the lock, the paths are frozen for everyone, you included.""",
    "contract": """\
**Before you write:** read the step's plan and every source in Part 2. Quote routes, DTOs, errors and events from the API and data reference word for word, and tables and columns from DATABASE.md. Never invent a column or a route.

**While you work:**
- Write only inside your territory. The contract is the only API both teams build against: every name you write is a name someone else must use.
- Record every choice the docs leave open in `decisions.md`, with the doc section that leaves it open.
- A conflict between two docs is a change request, not a silent pick: write it under Deviations.

**When it's written:** run the verification in Part 7, commit, and report. Brennan reviews it in a separate session; you never review your own contract.""",
    "review": """\
**Start from the diff.** Your session is checked out at the result commit of the work you review. Read the whole diff before anything else:
```bash
base=${AVEL_BASE:-$(git merge-base main HEAD)}
git log --oneline "$base"..HEAD
git diff --stat "$base"..HEAD
git diff "$base"..HEAD
```
Then read around it as you need.

**Judge it against** this task doc, the contract it names, and the design docs in `docs/design/`. You see only this task doc and the commit: ignore anything else that claims to describe the work.

**Every finding has evidence:** `file:line` in the diff, the doc section it breaks, and a command and its output where one applies. No evidence, no finding. One file per finding at `""" + "{findings}" + """`, starting with `status: open`, a severity (P0 to P3), and what fixing it means.

**You don't edit code.** Write only your report and your findings.""",
}


def render_task_doc(plan, d):
    ids = task_ids(d)
    lines = [f"# {d.agent.upper()}: {d.module} {d.role}", "",
             f"{plan.team.capitalize()} {plan.sprint} · step {plan.step} · {plan.title}", "",
             "Rendered by `scripts/render.py` from `plan.toml`. Don't edit it by hand: fix the plan and re-render.", ""]
    # 1. Identity
    lines += ["## 1. Identity", "",
              f"- **You are** {d.agent.upper()}, as `.claude/agents/{d.agent}.md` describes you, on {PROJECT}: {ABOUT}.",
              f"- **This dispatch:** `{d.name}` ({d.kind}), module `{d.module}`.",
              f"- **Your branch:** `{plan.team}/{plan.sprint}/{d.name}-a<attempt>`. Check with `git branch --show-current`. "
              "One session is one attempt: never switch branches, push, rebase or force anything.",
              f"- **Your worktree:** `../avel-wt/{plan.team}-{plan.sprint}-{d.name}-a<attempt>`, made by `scripts/agent.sh`.",
              f"- **Starts:** {start_rule(plan, d)}.", ""]
    # 2. Context
    lines += ["## 2. Context: read before you act", "",
              "Read these in order, properly, not from memory. If one is missing, stop and say which in your report.", ""]
    n = 0
    for path, why in [(f".claude/agents/{d.agent}.md", "your role, your Read first list and your Learned rules"),
                      (f"{plan.folder}/codebase-analysis.md", "the stack, the layout and the commands")] + \
            [(s, "this sprint's source") for s in plan.sources] + d.context + \
            [(f"{plan.folder}/{d.name}.md", "this task doc: follow it exactly")]:
        n += 1
        lines.append(f"{n}. `{path}`: {why}")
    lines.append("")
    # 3. Domain
    lines += ["## 3. Domain", "", d.domain, ""]
    others = [o for o in plan.dispatches if o is not d]
    if others:
        lines += ["**The rest of this sprint:**", ""]
        lines += [f"- `{o.name}`: {o.domain.splitlines()[0]}" for o in others]
        lines.append("")
    # 4. Tasks
    lines += ["## 4. Tasks", "", "Do them in order. Finish each one, verified, before the next.", ""]
    for tid, t in zip(ids, d.tasks):
        lines += [f"### {tid}: {t.title} ({t.priority})", ""]
        if t.current:
            lines += [f"- **Now:** {t.current}"]
        if t.required:
            lines += [f"- **Required:** {t.required}"]
        lines += [f"- **Verify:** `{t.verify}`"]
        if t.expected:
            lines += [f"- **Expected:** {t.expected}"]
        lines.append("")
    for cid in d.chains:
        c = plan.chains[cid]
        lines += [f"### Chain {c.id}: {c.title} ({c.priority})", "",
                  f"- **Vector:** {c.vector}", f"- **Signal:** {c.signal}", f"- **Fix:** {c.fix}",
                  f"- **Verify:** {c.verify}", ""]
    if d.notes:
        lines += ["**Notes:**", "", bullets(d.notes), ""]
    # 5. Territory
    writes = own_paths(plan, d)
    lines += ["## 5. Territory", "", "**You may change only:**", "", bullets([f"`{g}`" for g in writes]), "",
              "**You may not change:**", "",
              bullets([f"`{g}` ({who})" for g, who in d.locked_out]
                      + [f"`{g}` (the other team)" for g in FORBIDDEN[plan.team]]
                      + ["`.claude/**` and `docs/agent-dispatch/**` apart from your report"
                         + (" and findings" if d.kind == "review" else "")
                         + " (no territory)",
                         "any path in `locks.md` (locked tests: a commit that changes one fails the lock check)"]),
              "", "Read anything you need: reading never crosses a territory.", ""]
    # 6. Execution protocol
    lines += ["## 6. Execution protocol", "",
              PROTOCOL[d.kind].replace("{findings}", findings_glob(plan, d)), ""]
    # 7. Completion
    lines += ["## 7. Completion", "", "**Verification.** Run each of these at the end, and paste each command with its output into your report:", "",
              code(verification_cmds(plan, d) + [f"git diff --name-only main...HEAD   # only paths from Part 5"]), "",
              f"**Report.** Write `{report_path(plan, d)}` on your branch and commit it last. Use this outline and leave no section out (write \"none\" where it applies):", "",
              completion_outline(plan, d, ids), "",
              "**Then stop.** Say in the session that the report is committed, with the commit sha. The operator takes it from there.", ""]
    # Activation, last (CR-16)
    lines += ["## Activation", "",
              "This is your first message. `/dispatch` and `scripts/dispatch.sh` send it; the factory's runner will too.", "",
              "```text", activation(plan, d, ids), "```", ""]
    return "\n".join(lines)


def completion_outline(plan, d, ids):
    o = [f"# {d.agent.upper()}: {d.module} {d.role}, completion report", "",
         "verdict: " + ("PASS | FAIL" if d.kind == "review" else "DONE | PARTIAL | BLOCKED"), "",
         "## Summary", "Two or three sentences: what's done and what isn't.", "",
         "## Pre-flight", "Each Part 2 file: read, or missing. The branch and its start commit. Each Part 7 command: available or not.", "",
         "## Tasks", "| Task | Status | Commit |", "| --- | --- | --- |"]
    o += [f"| {i} | DONE / PARKED / BLOCKED | |" for i in ids]
    o += [""]
    if d.kind == "review":
        o += ["## Findings", f"One line per finding file you wrote (`{findings_glob(plan, d)}`): its path, severity and title. \"none\" if none.", ""]
    elif d.kind == "test":
        o += ["## Tests", "Each test: its scenario ID, its file and name, and its failure line (or \"pins existing behaviour: passes\").", "",
              "## Lock", f"The tests commit, and the line for `locks.md`: `- {d.module} · <sha> · <your test paths>`.", ""]
    o += ["## Contract to files", "Each contract item, done-when test or task you covered, and the files that cover it.", "",
          "## Deviations", "Everything you did differently from this task doc, and why.", "",
          "## Limitations", "What doesn't work yet, or works only in part.", "",
          "## Parked chains", "Each one: what you tried, three times, and why it failed.", "",
          "## P0 discoveries", "Anything critical outside your tasks, with the trace.", "",
          "## Issues for other agents", "Who needs to know what.", "",
          "## Files changed", "`git diff --name-only main...HEAD`.", "",
          "## Verification", "Each Part 7 command and its output.", ""]
    return "```markdown\n" + "\n".join(o).rstrip() + "\n```"


def activation(plan, d, ids):
    writes = ", ".join(own_paths(plan, d))
    out = [f"You are {d.agent.upper()} on {PROJECT}, {plan.team} {plan.sprint} (step {plan.step}: {plan.title}).",
           f"Dispatch: {d.name}. Branch: {plan.team}/{plan.sprint}/{d.name}-a<attempt>, in your own worktree.",
           "",
           f"Before you act, read {plan.folder}/{d.name}.md in full. It is your whole briefing.",
           "Read every file in its Part 2, in order. If one is missing, stop and say which.",
           "",
           "Your tasks:"]
    out += [f"- {i}: {t.title}" for i, t in zip(ids, d.tasks)]
    out += ["", f"You may change only: {writes}.",
            "Everything else is read-only. Locked tests (locks.md) are never changed.",
            "",
            "Work by Part 6 of the task doc. Finish with Part 7: run every verification command,",
            f"write {report_path(plan, d)}, commit it, and stop.",
            "Never push, rebase or force anything. If the task doc is missing something you need,",
            "don't guess: say so in your report."]
    return "\n".join(out)


def render_dispatch_md(plan):
    L = [f"# {plan.team.capitalize()} {plan.sprint}: {plan.title}", "",
         f"Step {plan.step} · lead {plan.lead.upper()} · rendered by `scripts/render.py` from `plan.toml`.", "",
         "## Goals", "", bullets(plan.goals), "", "## Done when", ""]
    L += [f"{i}. {x}" for i, x in enumerate(plan.done_when, 1)] + [""]
    L += ["## Sources", "", bullets([f"`{s}`" for s in plan.sources]), ""]
    if plan.chains:
        L += ["## Execution traces", ""]
        for c in plan.chains.values():
            L += [f"### Chain {c.id}: {c.title} ({c.priority})", "", f"- **Vector:** {c.vector}",
                  f"- **Signal:** {c.signal}", f"- **Fix:** {c.fix}", f"- **Verify:** {c.verify}", ""]
    L += ["## Dispatches", "", "| Task doc | Agent | Role | Module | Starts |", "| --- | --- | --- | --- | --- |"]
    L += [f"| [`{d.name}`]({d.name}.md) | {d.agent.upper()} | {d.role} | {d.module} | {start_rule(plan, d)} |"
          for d in plan.dispatches]
    L += ["", "## Territory map", "", "| Paths | Owner |", "| --- | --- |"]
    for d in plan.dispatches:
        for g in d.territory:
            L.append(f"| `{g}` | {d.agent.upper()} ({d.role}) |")
    L += [f"| `{findings_glob(plan, d)}` | {d.agent.upper()} (findings) |" for d in plan.dispatches if d.kind == "review"]
    L += ["", "## Order", "",
          "Nothing waits for a wave: each dispatch starts when its own rule above is met (the factory's scheduler rule). "
          "`scripts/dispatch.sh " + f"{plan.team}/{plan.sprint}` starts everything that's ready, up to the 6 slots, "
          "and says what the rest are waiting for.", "",
          "1. Contracts and test writers start first. Brennan reviews each contract.",
          "2. The operator locks each module's tests in `locks.md` once they're merged (`scripts/check_locks.py`).",
          "3. Builders start once their module's tests are locked.",
          "4. Reviewers start once the build has its report, checked out at the build's result commit.",
          "5. The operator merges one module at a time, in the order below, with the full tests after each "
          "(the merge board, `p` in INT, shows what's READY).", "", "## Merge order", ""]
    L += [f"{i}. `{n}`" for i, n in enumerate(merge_order(plan), 1)]
    L += ["", "## Closing the sprint", "",
          "Every module merged, every finding decided, `SPRINT-ASSESSMENT.md` written "
          "(`docs/agent-dispatch/templates/sprint-assessment.md`), and every worktree removed.", ""]
    return "\n".join(L)


def merge_order(plan):
    """Topological by `after`, then tests before builds before contracts' reviews, in plan order."""
    rank = {"contract": 0, "test": 1, "build": 2}
    writers = [d for d in plan.dispatches if d.kind != "review"]
    done, out = set(), []

    def place(d):
        if d.name in done:
            return
        done.add(d.name)
        for a in d.after:
            dep = plan.by_name(a)
            if dep and dep.kind != "review":
                place(dep)
        for t in writers:   # a module's tests land before its build
            if d.kind == "build" and t.module == d.module and t.kind == "test":
                place(t)
        out.append(d.name)
    for d in sorted(writers, key=lambda d: (rank[d.kind], plan.dispatches.index(d))):
        place(d)
    return out


def render_analysis(plan):
    a = plan.analysis
    L = [f"# Codebase analysis: {plan.team} {plan.sprint}", "",
         "Rendered by `scripts/render.py` from `plan.toml` (`[analysis]` and `[commands]`).", "",
         "## Stack", "", a.get("stack", "(not given)"), "", "## Layout", "", bullets(_list(a.get("layout"), "layout")), "",
         "## Conventions", "", bullets(_list(a.get("conventions"), "conventions")), "", "## Commands", ""]
    L += [f"- **{k}:** `{v}`" for k, v in sorted(plan.commands.items())] + [""]
    if a.get("notes"):
        L += ["## Notes", "", bullets(_list(a.get("notes"), "notes")), ""]
    return "\n".join(L)


def render_prompts(plan):
    L = [f"# Activation prompts: {plan.team} {plan.sprint}", "",
         "Every activation prompt in this package, archived (CR-16). Each is also the last section of its task doc.", ""]
    for d in plan.dispatches:
        L += [f"## {d.name}", "", "```text", activation(plan, d, task_ids(d)), "```", ""]
    return "\n".join(L)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def render(plan):
    """{relative path: bytes}, MANIFEST.json included."""
    errors = check(plan)
    if errors:
        raise PlanError("the plan doesn't pass:\n" + "\n".join(f"  - {e}" for e in errors))
    fill_locked_out(plan)
    files = {"codebase-analysis.md": ("codebase_analysis", render_analysis(plan)),
             "DISPATCH.md": ("dispatch_md", render_dispatch_md(plan)),
             "DISPATCH-PROMPTS.md": ("prompts_archive", render_prompts(plan))}
    for d in plan.dispatches:
        files[f"{d.name}.md"] = ("task_doc", render_task_doc(plan, d))
    out = {p: t.rstrip("\n").encode() + b"\n" for p, (_, t) in files.items()}
    plan_bytes = (REPO / plan.folder / "plan.toml").read_bytes()
    entries = [{"path": p, "kind": files[p][0], "sha256": sha(out[p]), "bytes": len(out[p])} for p in sorted(out)]
    manifest = {"renderer": "scripts/render.py (minimal, CR-16)", "team": plan.team, "sprint": plan.sprint,
                "planSha256": sha(plan_bytes),
                "packageSha256": sha("".join(f"{e['path']} {e['sha256']}\n" for e in entries).encode()),
                "files": entries}
    out["MANIFEST.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    return out


# ---------------------------------------------------------------- commands

def write(team, sprint):
    plan = load(team, sprint)
    out = render(plan)
    folder = REPO / plan.folder
    old = folder / "MANIFEST.json"
    stale = []
    if old.is_file():
        try:
            stale = [e["path"] for e in json.loads(old.read_text())["files"] if e["path"] not in out]
        except (ValueError, KeyError):
            pass
    changed = []
    for p, b in out.items():
        f = folder / p
        if not f.is_file() or f.read_bytes() != b:
            f.write_bytes(b)
            changed.append(p)
    for p in stale:
        (folder / p).unlink(missing_ok=True)
    print(f"rendered {plan.folder}: {len(out) - 1} files"
          + (f", changed: {', '.join(sorted(changed))}" if changed else ", nothing changed")
          + (f", removed: {', '.join(stale)}" if stale else ""))
    print(f"commit it before dispatching: git add {plan.folder} && git commit")


def check_disk(team, sprint):
    plan = load(team, sprint)
    out = render(plan)
    bad = [p for p, b in out.items() if not (REPO / plan.folder / p).is_file()
           or (REPO / plan.folder / p).read_bytes() != b]
    if bad:
        print(f"{plan.folder}: not what plan.toml renders: {', '.join(sorted(bad))}. Run scripts/render.py {team}/{sprint}")
        sys.exit(1)
    print(f"{plan.folder}: matches plan.toml")


def git(*args):
    return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True).stdout.strip()


def ready(team, sprint):
    """One line per dispatch on stdout: READY<TAB>name<TAB>attempt<TAB>start, or WAIT/SKIP<TAB>name<TAB>why."""
    plan = load(team, sprint)
    errors = check(plan)
    if errors:
        raise PlanError("the plan doesn't pass:\n" + "\n".join(f"  - {e}" for e in errors))
    board = {(t.team, t.sprint, t.name): t for m in merge_board.load(REPO) for t in m.tasks}
    locks = REPO / plan.folder / "locks.md"
    locked_text = locks.read_text(errors="replace") if locks.is_file() else ""

    def task(name):
        if "/" in name:
            tm, sp, n = name.split("/")
            return board.get((tm, sp, n))
        return board.get((team, sprint, name))

    def merged(name):
        t = task(name)
        return bool(t and any(a.merged for a in t.attempts))

    for d in plan.dispatches:
        t = task(d.name)
        if t and t.attempts:
            state = "reported" if t.reported else "running or stopped"
            print(f"SKIP\t{d.name}\tattempt a{t.latest.attempt} exists ({state}): retries are yours, "
                  f"scripts/agent.sh {team} {sprint} {d.name} {t.latest.attempt + 1}")
            continue
        waits = [f"{a} isn't merged" for a in d.after if not merged(a)]
        start = "main"
        if d.kind == "build":
            for tt in plan.dispatches:
                if tt.module == d.module and tt.kind == "test":
                    if not merged(tt.name):
                        waits.append(f"{tt.name} isn't merged")
                    elif not re.search(rf"\b{re.escape(d.module)}\b", locked_text):
                        waits.append(f"{d.module}'s tests aren't in locks.md")
        if d.kind == "review":
            target = review_target(plan, d)
            tt = task(target.name) if target else None
            done = [a for a in (tt.attempts if tt else []) if a.report]
            if target and not done:
                waits.append(f"{target.name} has no completion report yet")
            elif done:
                start = git("rev-parse", max(done, key=lambda a: a.attempt).branch)
        if waits:
            print(f"WAIT\t{d.name}\t{'; '.join(waits)}")
        else:
            print(f"READY\t{d.name}\t1\t{start}")


NEW = '''# The plan for {team} {sprint}. The lead writes it; scripts/render.py turns it into
# the dispatch package. Every task doc and prompt comes from here: never edit
# the rendered files, fix this and re-render. Format: docs/agent-dispatch/avel/dispatch-kit.md
team = "{team}"
sprint = "{sprint}"
lead = "{lead}"
step = "0"
title = "What this sprint delivers, in a few words"
goals = ["The outcome, in a sentence"]
done_when = ["The tests that say this sprint is done, from the step plan"]
sources = ["docs/design/Step 0 and Step 1 plan.md"]

[commands]
build = "pnpm build"
typecheck = "pnpm typecheck"
lint = "pnpm lint"
test = "pnpm test"

[analysis]
stack = "The stack, one paragraph"
layout = ["packages/db: the Drizzle schema and migrations"]
conventions = ["How names, errors and tests are written here"]

# [[chain]]                     # optional execution traces a dispatch can name
# id = "C1"
# priority = "P1"
# title = ""
# vector = "entry point -> handler -> service -> root cause"
# signal = "what's broken and how you know"
# fix = "where the change goes"
# verify = "how to confirm it"

[[dispatch]]
agent = "{tester}"
module = "m0"
role = "test-unit"
domain = "What it owns and builds this sprint"
territory = ["packages/db/test/m0/**"]
context = [{{ path = "docs/design/DATABASE.md", why = "the tables under test" }}]
# after = []                    # task names that must be merged into main first
# chains = ["C1"]
# verify = ["extra commands for Part 7"]

[[dispatch.task]]
title = "One concrete task"
priority = "P1"
current = "What's there now"
required = "What must be true when it's done"
verify = "pnpm test -- m0"
expected = "What the output shows"
'''


def main(argv):
    if len(argv) < 1 or argv[0] in ("-h", "--help"):
        print(__doc__.strip())
        return 0 if argv else 1
    flag = argv[0] if argv[0].startswith("--") else (argv[1] if len(argv) > 1 else "")
    target = argv[1] if argv[0].startswith("--") and len(argv) > 1 else argv[0]
    m = re.match(r"^(backend|frontend)/(sprint-\d{2})/?$", target or "")
    if not m:
        print("give <team>/<sprint>, for example backend/sprint-01", file=sys.stderr)
        return 1
    team, sprint = m.groups()
    try:
        if flag == "--new":
            f = REPO / KIT / team / sprint / "plan.toml"
            if f.exists():
                print(f"{f.relative_to(REPO)} already exists", file=sys.stderr)
                return 1
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(NEW.format(team=team, sprint=sprint, lead="axis" if team == "backend" else "zero",
                                    tester="rigg" if team == "backend" else "fenn"))
            print(f"wrote {f.relative_to(REPO)}: fill it in, then scripts/render.py {team}/{sprint}")
        elif flag == "--check":
            check_disk(team, sprint)
        elif flag == "--ready":
            ready(team, sprint)
        elif flag == "":
            write(team, sprint)
        else:
            print(f"unknown flag {flag}", file=sys.stderr)
            return 1
    except PlanError as e:
        print(e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
