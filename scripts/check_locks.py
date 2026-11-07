#!/usr/bin/env python3
"""Locked tests stay locked: the Phase 1 check from the build plan ("a small
CI check fails any build commit that changes a locked test path"), an early
version of Gate 3's territory rule.

A module's tests are locked by a line in its sprint folder's locks.md
(docs/agent-dispatch/<team>/<sprint>/locks.md), one lock per line:

  - m2 · 3c91e07 · packages/server/test/m2/**, packages/db/test/m2/**

module · the tests commit · the locked paths (globs, comma-separated; ** spans
folders). "|" works in place of "·". The merge board already counts a module as
locked once it's named there; the paths are what this check enforces.

Usage:
  scripts/check_locks.py [<range>]       commits in a range, default main...HEAD
  scripts/check_locks.py --staged        what's staged (the pre-commit hook)
  scripts/check_locks.py --list          every lock it reads
  scripts/check_locks.py --install-hook  add the pre-commit hook (all worktrees share it)

A change to a locked path in a commit after the lock fails (exit 1) and logs
lock.violated. The lock's own commit and its ancestors are exempt. A deliberate
test change is a decision, not a fix: set AVEL_LOCK_OVERRIDE="<reason>" for the
one commit, and it's logged as lock.overridden.
"""
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

sys.path.insert(0, str(Path(__file__).resolve().parent))
import events  # noqa: E402

LOCK_RE = re.compile(r"^\s*[-*]\s*`?([A-Za-z0-9][\w.-]*)`?\s*[·|]\s*`?([0-9a-f]{7,40})`?\s*[·|]\s*(.+?)\s*$")
HOOK_MARK = "# avel: locked tests (scripts/check_locks.py)"


@dataclass
class Lock:
    module: str
    commit: str
    globs: list
    source: str     # the locks.md it came from, relative to the repo

    def covers(self, path):
        p = PurePosixPath(path)
        return any(p.full_match(g) or p.full_match(g.rstrip("/") + "/**") for g in self.globs)


def git(cwd, *args, check=False):
    r = subprocess.run(["git", "-C", str(cwd), *args], capture_output=True, text=True, timeout=20)
    if check and r.returncode:
        raise SystemExit(f"git {' '.join(args)}: {r.stderr.strip()}")
    return r.stdout


def locks(repo=None):
    """Every lock, read from the main checkout: locks are recorded on main, and a
    worktree may have branched before its module was locked."""
    main = events.main_checkout(repo)
    out = []
    for f in sorted((main / "docs" / "agent-dispatch").glob("*/sprint-*/locks.md")):
        for line in f.read_text(errors="replace").splitlines():
            m = LOCK_RE.match(line)
            if m:
                globs = [g.strip().strip("`") for g in m.group(3).split(",") if g.strip()]
                out.append(Lock(m.group(1), m.group(2), globs, str(f.relative_to(main))))
    return out


def is_ancestor(cwd, a, b):
    return subprocess.run(["git", "-C", str(cwd), "merge-base", "--is-ancestor", a, b],
                          capture_output=True).returncode == 0


def violations(cwd, rng=None, staged=False, all_locks=None):
    """[(lock, commit or 'staged', path)] for every locked path changed after its lock."""
    all_locks = locks(cwd) if all_locks is None else all_locks
    if not all_locks:
        return []
    found = []
    if staged:
        for path in git(cwd, "diff", "--cached", "--name-only").splitlines():
            for lk in all_locks:
                if lk.covers(path):
                    found.append((lk, "staged", path))
        return found
    rng = rng or "main...HEAD"
    for commit in git(cwd, "rev-list", "--no-merges", rng).split():
        files = git(cwd, "diff-tree", "--no-commit-id", "--name-only", "-r", commit).splitlines()
        for lk in all_locks:
            hits = [p for p in files if lk.covers(p)]
            if hits and not is_ancestor(cwd, commit, lk.commit):
                found.extend((lk, commit[:9], p) for p in hits)
    return found


def install_hook(cwd):
    common = Path(git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir", check=True).strip())
    hook = common / "hooks" / "pre-commit"
    body = (f"#!/usr/bin/env bash\n{HOOK_MARK}\n"
            'main=$(git worktree list --porcelain | sed -n "1s/^worktree //p")\n'
            'exec python3 "$main/scripts/check_locks.py" --staged\n')
    if hook.exists() and HOOK_MARK not in hook.read_text(errors="replace"):
        print(f"{hook} already exists and isn't ours: add this line to it instead:\n"
              f'  python3 "$(git worktree list --porcelain | sed -n "1s/^worktree //p")/scripts/check_locks.py" --staged || exit 1',
              file=sys.stderr)
        return 1
    hook.parent.mkdir(parents=True, exist_ok=True)
    hook.write_text(body)
    hook.chmod(0o755)
    print(f"installed {hook} (every worktree uses it)")
    return 0


def main(argv):
    cwd = Path.cwd()
    if argv[:1] == ["--install-hook"]:
        return install_hook(cwd)
    if argv[:1] == ["--list"]:
        ls = locks(cwd)
        for lk in ls:
            print(f"{lk.module:<12} {lk.commit[:9]}  {', '.join(lk.globs)}   ({lk.source})")
        if not ls:
            print("no locks yet (docs/agent-dispatch/<team>/<sprint>/locks.md)")
        return 0
    staged = argv[:1] == ["--staged"]
    rng = None if staged or not argv else argv[0]
    found = violations(cwd, rng, staged)
    if not found:
        return 0
    branch = git(cwd, "branch", "--show-current").strip()
    by_lock = {}
    for lk, commit, path in found:
        by_lock.setdefault((lk.module, lk.commit), []).append(f"{commit} {path}")
    override = os.environ.get("AVEL_LOCK_OVERRIDE", "").strip()
    kind = "lock.overridden" if override else "lock.violated"
    for (module, commit), hits in by_lock.items():
        events.emit(kind, subject={"type": "module", "ref": module},
                    data={"lock": commit[:9], "branch": branch, "paths": len(hits),
                          "summary": f"{len(hits)} locked path(s) changed on {branch or 'HEAD'}",
                          **({"reason": override} if override else {})}, start=cwd)
    if override:
        print(f"locked tests changed, allowed by AVEL_LOCK_OVERRIDE: {override}", file=sys.stderr)
        return 0
    print("✗ locked tests changed (scripts/check_locks.py):", file=sys.stderr)
    for (module, commit), hits in by_lock.items():
        print(f"  {module}, locked at {commit[:9]}:", file=sys.stderr)
        for h in hits[:20]:
            print(f"    {h}", file=sys.stderr)
    print("Tests are locked once Rigg or Fenn commits them. Change the build, not the tests.\n"
          "A real test change is a decision for the operator: AVEL_LOCK_OVERRIDE=\"<reason>\".",
          file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
