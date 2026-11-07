"""The merge board's data: every module in the sprint folders, with its attempt
branches, reports, reviews, locks and findings, and whether it's ready to merge.

Agents never push, so an attempt branch is the local stand-in for a PR:
  <team>/<sprint>/agent-<agent>-<module>-<role>-a<attempt>   (scripts/agent.sh)
What the board reads, all in docs/agent-dispatch/<team>/<sprint>/:
  agent-<agent>-<module>-<role>.md             a task doc (on main)
  agent-<agent>-<module>-<role>-completion.md  its report (on main, or committed on the branch)
  locks.md                                     a module is locked once it's named there
  findings/*<module>*                          open unless it says "status: routed|fixed|closed|resolved|rejected"
Ready to merge (the build plan's rule, plus the reports): the build attempt has
commits and its report, the tests are locked and no attempt changed them
(scripts/check_locks.py), every review has its report, and no finding is open. Merging stays yours: the board only shows the command.
"""
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_locks  # noqa: E402

ROLES = ["review-a11y-perf", "review-security", "review-backend", "review-frontend", "review-spec",
         "api-contract", "ui-contract", "test-unit", "test-e2e", "red-team", "build"]
TASK_RE = re.compile(r"^agent-([a-z]+)-(.+)-(" + "|".join(map(re.escape, ROLES)) + r")$")
BRANCH_RE = re.compile(r"^(backend|frontend)/(sprint-[^/]+)/(agent-.+)-a(\d+)$")
CLOSED_RE = re.compile(r"^\s*[-*]?\s*\**status\**\s*[:=]\s*\**\s*(routed|fixed|closed|resolved|rejected|wontfix)",
                       re.I | re.M)
VERDICT_RE = re.compile(r"verdict\**\s*[:=]\s*\**\s*([A-Za-z-]+)", re.I)


def kind_of(role):
    if role == "build":
        return "build"
    if role.startswith("test-"):
        return "test"
    if role.startswith("review-") or role == "red-team":
        return "review"
    return "contract"


@dataclass
class Attempt:
    branch: str
    attempt: int
    ahead: int = 0
    behind: int = 0
    files: int = 0
    added: int = 0
    removed: int = 0
    last: str = ""          # "<sha> <subject> (<age>)"
    merged: bool = False
    report: bool = False    # completion report committed on the branch


@dataclass
class Task:
    team: str
    sprint: str
    name: str               # agent-soap-m2-build
    agent: str
    module: str
    role: str
    kind: str
    attempts: list = field(default_factory=list)
    report_on_main: bool = False
    verdict: str = ""

    @property
    def latest(self):
        return max(self.attempts, key=lambda a: a.attempt) if self.attempts else None

    @property
    def reported(self):
        return self.report_on_main or any(a.report for a in self.attempts)


@dataclass
class Module:
    team: str
    sprint: str
    module: str
    tasks: list = field(default_factory=list)
    locked: bool = False
    findings_open: int = 0
    findings_total: int = 0
    lock_breaks: list = field(default_factory=list)   # [(attempt branch, commit, path)]

    def of(self, kind):
        return [t for t in self.tasks if t.kind == kind]

    @property
    def build(self):
        builds = [t for t in self.of("build") if t.attempts] or self.of("build")
        return builds[0] if builds else None

    def checklist(self):
        """(label, done) for each thing the merge rule asks for."""
        b = self.build
        latest = b.latest if b else None
        reviews = self.of("review")
        items = [
            ("build attempt has commits", bool(latest and latest.ahead)),
            ("build report filed", bool(b and b.reported)),
            ("tests locked (locks.md)", self.locked or not self.of("test")),
        ]
        for r in reviews:
            items.append((f"{r.agent.upper()} {r.role} report", r.reported))
        if self.locked:
            n = len(self.lock_breaks)
            items.append(("no locked test changed" if not n else f"{n} locked test change(s): scripts/check_locks.py", n == 0))
        items.append((f"findings routed ({self.findings_open} open)", self.findings_open == 0))
        return items

    @property
    def status(self):
        b = self.build
        latest = b.latest if b else None
        if latest and latest.merged and latest.ahead == 0 and latest.attempt:
            return "MERGED"
        if all(done for _, done in self.checklist()):
            return "READY"
        if b and b.reported:
            return "IN REVIEW"
        if latest:
            return "BUILDING"
        if any(t.attempts for t in self.of("test")):
            return "TESTS"
        return "WAITING"


def git(repo, *args):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, timeout=10)
    return r.stdout.strip() if r.returncode == 0 else ""


def load(repo):
    """Every module with a task doc or an attempt branch, in team/sprint/module order."""
    repo = Path(repo)
    base = repo / "docs" / "agent-dispatch"
    tasks = {}

    def task(team, sprint, name):
        key = (team, sprint, name)
        if key not in tasks:
            m = TASK_RE.match(name)
            if not m:
                return None
            agent, module, role = m.groups()
            tasks[key] = Task(team, sprint, name, agent, module, role, kind_of(role))
        return tasks[key]

    for team in ("backend", "frontend"):
        for sprint_dir in sorted((base / team).glob("sprint-*")):
            for f in sorted(sprint_dir.glob("agent-*.md")):
                if f.stem.endswith("-completion"):
                    t = task(team, sprint_dir.name, f.stem.removesuffix("-completion"))
                    if t:
                        t.report_on_main = True
                        v = VERDICT_RE.search(f.read_text(errors="replace"))
                        t.verdict = v.group(1).upper() if v else t.verdict
                else:
                    task(team, sprint_dir.name, f.stem)

    merged = set(git(repo, "branch", "--merged", "main", "--format=%(refname:short)").splitlines())
    for branch in git(repo, "for-each-ref", "--format=%(refname:short)", "refs/heads/backend",
                      "refs/heads/frontend").splitlines():
        m = BRANCH_RE.match(branch)
        if not m:
            continue
        team, sprint, name, n = m.groups()
        t = task(team, sprint, name)
        if not t:
            continue
        a = Attempt(branch, int(n), merged=branch in merged)
        counts = git(repo, "rev-list", "--left-right", "--count", f"main...{branch}").split()
        if len(counts) == 2:
            a.behind, a.ahead = int(counts[0]), int(counts[1])
        stat = git(repo, "diff", "--shortstat", f"main...{branch}")
        for num, what in re.findall(r"(\d+) (file|insertion|deletion)", stat):
            if what == "file":
                a.files = int(num)
            elif what == "insertion":
                a.added = int(num)
            else:
                a.removed = int(num)
        a.last = git(repo, "log", "-1", "--format=%h %s (%cr)", branch)
        report = f"docs/agent-dispatch/{team}/{sprint}/{name}-completion.md"
        if subprocess.run(["git", "-C", str(repo), "cat-file", "-e", f"{branch}:{report}"],
                          capture_output=True).returncode == 0:
            a.report = True
            if not t.verdict:
                v = VERDICT_RE.search(git(repo, "show", f"{branch}:{report}"))
                t.verdict = v.group(1).upper() if v else ""
        t.attempts.append(a)

    try:
        all_locks = check_locks.locks(repo)
    except Exception:
        all_locks = []
    modules = {}
    for t in tasks.values():
        key = (t.team, t.sprint, t.module)
        modules.setdefault(key, Module(t.team, t.sprint, t.module)).tasks.append(t)
    for (team, sprint, module), m in modules.items():
        folder = base / team / sprint
        locks = folder / "locks.md"
        if locks.is_file():
            m.locked = re.search(rf"\b{re.escape(module)}\b", locks.read_text(errors="replace")) is not None
        for f in sorted((folder / "findings").glob(f"*{module}*")) if (folder / "findings").is_dir() else []:
            if not re.search(rf"(^|[^a-z0-9]){re.escape(module)}([^a-z0-9]|$)", f.name):
                continue
            m.findings_total += 1
            if not CLOSED_RE.search(f.read_text(errors="replace")):
                m.findings_open += 1
        # Locked tests changed on any open attempt branch of this module.
        mine = [lk for lk in all_locks if lk.module == module]
        for t in m.tasks:
            for a in t.attempts:
                if mine and not a.merged:
                    m.lock_breaks += [(a.branch, c, p) for _, c, p in
                                      check_locks.violations(repo, f"main...{a.branch}", all_locks=mine)]
        order = {"build": 0, "test": 1, "contract": 2, "review": 3}
        m.tasks.sort(key=lambda t: (order[t.kind], t.agent))
    return [modules[k] for k in sorted(modules)]
