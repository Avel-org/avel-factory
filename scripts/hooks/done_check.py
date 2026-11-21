#!/usr/bin/env python3
"""Claude Code Stop hook: a build that says "done" has passing checks (CR-46 B5).

Only active in a dispatch ($AVEL_TURN_LIMIT is set), for a build ($AVEL_KIND is build: a tests
dispatch's tests fail on purpose, and a review changes no code), once its report ($AVEL_REPORT) says
`status: done`. It then runs the checks (`pnpm typecheck`, then `vitest related --run` on the files the
branch changed, per package); $AVEL_DONE_CHECK_CMD replaces them in the kit's tests.

  checks pass                    the stop goes ahead
  checks fail, blocked < 2       the stop is blocked with the failing output: fix it, then finish
  checks fail, otherwise         the stop goes ahead (no trap): the report's status becomes
                                 `stopped (checks failing)`, committed, and OSA's message log says so

"Otherwise" is a stop that a Stop hook already continued ($stop_hook_active), or a third failing stop.
While it runs it holds $AVEL_DONE_FLAG.checking, so agent.sh doesn't close the session under it, and a
block lowers $AVEL_DONE_FLAG (scripts/hooks/session.py raised it for the same stop). A hook that fails
allows the stop: CI and the review still check everything.
"""

import json
import os
import re
import subprocess
import sys

MAX_BLOCKS = 2
TAIL = 60  # lines of failing output handed back to the session


def sh(cmd, cwd, timeout=540, env=None):
    r = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), capture_output=True, text=True, timeout=timeout,
                       env=env)
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def report_done(report):
    try:
        with open(report, encoding="utf-8") as f:
            m = re.search(r"(?mi)^\s*status:\s*([a-z-]+)", f.read())
    except OSError:
        return False
    return bool(m) and m.group(1).lower() == "done"


def changed_by_package(cwd):
    """{package dir: [changed .ts/.tsx/.js files, relative to it]} since the branch left main."""
    _, base = sh(["git", "merge-base", "main", "HEAD"], cwd, 30)
    base = base.strip().splitlines()[0] if base.strip() else "HEAD"
    _, committed = sh(["git", "diff", "--name-only", base, "HEAD"], cwd, 30)
    _, uncommitted = sh(["git", "status", "--porcelain"], cwd, 30)
    files = set(committed.split()) | {l[3:] for l in uncommitted.splitlines() if len(l) > 3}
    out = {}
    for f in sorted(files):
        m = re.match(r"^((?:apps|packages|tools)/[^/]+)/(.+\.(?:ts|tsx|js|jsx|mjs))$", f)
        if m and os.path.exists(os.path.join(cwd, f)):
            out.setdefault(m.group(1), []).append(m.group(2))
    return out


def run_checks(cwd):
    """(ok, output) for the checks this hook stands for."""
    custom = os.environ.get("AVEL_DONE_CHECK_CMD")
    if custom:
        code, out = sh(custom, cwd)
        return code == 0, out
    env = dict(os.environ)
    if not env.get("DATABASE_URL") and os.path.exists(os.path.join(cwd, "scripts/pg-local.sh")):
        # The URL is the last line on stdout; pg-local's progress goes to stderr.
        r = subprocess.run(["scripts/pg-local.sh", "start"], cwd=cwd, capture_output=True, text=True, timeout=120)
        if r.returncode == 0 and r.stdout.strip():
            env["DATABASE_URL"] = r.stdout.strip().splitlines()[-1]
    code, out = sh(["pnpm", "typecheck"], cwd, env=env)
    if code != 0:
        return False, "$ pnpm typecheck\n" + out
    for pkg, files in changed_by_package(cwd).items():
        code, out = sh(["pnpm", "exec", "vitest", "related", "--run", *files], os.path.join(cwd, pkg), env=env)
        if code != 0:
            return False, f"$ (cd {pkg} && pnpm exec vitest related --run {' '.join(files)})\n" + out
    return True, ""


def mark_failing(report, cwd):
    with open(report, encoding="utf-8") as f:
        text = f.read()
    text = re.sub(r"(?mi)^(\s*status:\s*)done\b.*$", r"\1stopped (checks failing)", text, count=1)
    with open(report, "w", encoding="utf-8") as f:
        f.write(text)
    sh(["git", "commit", "-q", "-m", "report: stopped, checks failing (CR-46 B5)", "--", report], cwd, 30)
    ticket = re.search(r"(?m)^\s*ticket:\s*(T-[A-Z]\d+)", text)
    msg = (f"{os.environ.get('AVEL_SEAT', 'a session')} stopped with checks failing after the done check blocked "
           f"its stop (CR-46 B5). Report: {report}" + (f" ({ticket.group(1)})" if ticket else ""))
    msglog = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "agents", "msglog.py")
    try:
        subprocess.run([sys.executable, msglog, "received", "--from", os.environ.get("AVEL_SEAT", "session")],
                       input=msg, text=True, capture_output=True, timeout=30, cwd=cwd)
    except Exception:
        pass


def count_file(cwd, session_id):
    _, common = sh(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], cwd, 10)
    d = os.path.join(common.strip(), "avel", "logs")
    os.makedirs(d, exist_ok=True)
    sid = re.sub(r"[^A-Za-z0-9_-]", "", session_id or "") or "unknown"
    return os.path.join(d, f"done-check-{sid}.count")


def decide(hook, cwd):
    report = os.environ.get("AVEL_REPORT", "")
    if os.environ.get("AVEL_KIND") != "build" or not report_done(report):
        return None
    ok, output = run_checks(cwd)
    if ok:
        return None
    cf = count_file(cwd, hook.get("session_id"))
    try:
        blocks = int(open(cf).read().strip() or 0)
    except (OSError, ValueError):
        blocks = 0
    if hook.get("stop_hook_active") or blocks >= MAX_BLOCKS:
        mark_failing(report, cwd)
        return None
    with open(cf, "w") as f:
        f.write(str(blocks + 1))
    flag = os.environ.get("AVEL_DONE_FLAG")
    if flag:
        try:
            os.remove(flag)
        except OSError:
            pass
    tail = "\n".join(output.strip().splitlines()[-TAIL:])
    return {"decision": "block", "reason":
            "Your report says done, but the checks fail (CR-46 B5). Fix this, commit, and finish again; if you "
            "can't, set your report's status to the stop status that fits.\n\n" + tail}


def main():
    if not os.environ.get("AVEL_TURN_LIMIT"):
        return
    flag = os.environ.get("AVEL_DONE_FLAG")
    checking = f"{flag}.checking" if flag else None
    try:
        hook = json.load(sys.stdin)
        cwd = hook.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
        if checking:
            open(checking, "w").close()
        out = decide(hook, cwd)
    except Exception:
        return
    finally:
        if checking:
            try:
                os.remove(checking)
            except OSError:
                pass
    if out:
        print(json.dumps(out))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
