#!/usr/bin/env python3
"""OSA's merge tool: CR-36's conditions, checked by code, and CR-41's merge with Javaris's approval.

  scripts/agents/merge.py check <pr> [<pr> ...]                    report each PR, merge nothing
  scripts/agents/merge.py merge <pr> [<pr> ...]                    merge each one that meets every CR-36 condition
  scripts/agents/merge.py merge <pr> [<pr> ...] --approved "TEXT"  CR-41: Javaris approved these PRs, in his words
  scripts/agents/merge.py merge <pr> [<pr> ...] --standing          CR-45 decision 3, as CR-50 decision 3 holds it:
                                                                   waives only condition 2 (rigor) for a reviewed
                                                                   ticket PR, with a G7 pass for full rigor

The conditions (CR-36, section 1):
  1  CI green on the head, every required check, none re-run (H4, H5, H6)        always required
  2  standard rigor: not a full-rigor ticket, no code-owner review required       Javaris's approval covers it
  3  a ticket's review report has a verdict of pass (G3, G5)                       Javaris's approval covers it
  4  mergeable and CLEAN against main                                             always required
  5  a squash merge: the PR title as the header, the PR's Refs: line as the body  always required
  6  a ticket PR from dispatch: a t/<id>-<slug> branch                            Javaris's approval covers it
  7  not a guardrail or design PR (labels contract or schema, the lockfile,       Javaris's approval covers it
     .github, .claude, .agents, scripts, docs/design, AGENTS.md; an agent's
     .agents/memory/<agent>.md lines are exempt, CR-46 B4)
  8  no "hold" label and no review asking for changes                             always required

With --approved, TEXT must be Javaris's own words from OSA's session, quoted as he wrote them, and they
must cover every PR named. The tool posts them on each PR before merging it, with the head it approved and
the conditions his approval covered. The merge is pinned to that head (--match-head-commit), so a push after
the approval fails the merge and OSA asks again.

PRs merge in the order given, one at a time and back to back (CR-45 decision 6). Before each merge the
tool checks main: if main's latest finished run of any workflow failed, nothing more merges (H5). After the
last merge it waits for main's CI on that commit. A cancelled run on main was superseded by a newer push
(the CI workflow cancels in progress), so it isn't a failure. The tool never updates a branch, re-runs a
check or resolves a conflict: a PR that fails a condition is reported with where it goes (L2), and the rest
of the list doesn't merge.
"""

import argparse
import glob
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from zoneinfo import ZoneInfo

GH = os.environ.get("AVEL_GH", "gh")
CENTRAL = ZoneInfo("America/Chicago")
TICKET_BRANCH = re.compile(r"^t/([A-Z]\d+)-[a-z0-9-]+$")
GUARDED_PREFIXES = (".github/", ".claude/", ".agents/", "scripts/", "docs/design/")
GUARDED_FILES = {"AGENTS.md", "pnpm-lock.yaml"}
GUARDED_LABELS = {"contract", "schema"}
# CR-46 B4: an agent's memory lines merge with its ticket's PR; the lock check holds them to one line.
MEMORY = re.compile(r"^\.agents/memory/[a-z0-9]+\.md$")
WAIVABLE = {2, 3, 6, 7}
# CR-50 decision 3: the standing approval waives rigor only; the review, the ticket branch and the guardrails hold.
STANDING_WAIVABLE = {2}
G7_PASS = re.compile(r"\bG7\b.{0,200}\bpass\b|\bpass\b.{0,200}\bG7\b", re.I | re.S)
ROUTE = {1: "the lane's lead", 3: "the lane's lead", 4: "the lane's lead", 6: "the lane's lead",
         8: "the lane's lead", 2: "Javaris, as a decision", 7: "Javaris, as a decision", 5: "OSA (fix the PR text)"}
MAIN_CI_TIMEOUT = int(os.environ.get("AVEL_MERGE_CI_TIMEOUT", "1800"))
POLL = float(os.environ.get("AVEL_MERGE_POLL", "20"))


class GhError(Exception):
    pass


def gh(*args, parse=True):
    out = subprocess.run([GH, *args], capture_output=True, text=True, timeout=120)
    if out.returncode != 0:
        raise GhError(f"gh {' '.join(args[:3])}: {out.stderr.strip() or out.stdout.strip()}")
    return json.loads(out.stdout) if parse else out.stdout


def git(root, *args):
    out = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, timeout=30)
    return out.stdout.strip() if out.returncode == 0 else ""


def repo_root():
    here = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    return git(here, "rev-parse", "--show-toplevel") or here


def common_dir(root):
    path = git(root, "rev-parse", "--git-common-dir") or ".git"
    return path if os.path.isabs(path) else os.path.normpath(os.path.join(root, path))


def guarded(files, labels):
    """Condition 7: the guardrail and design paths and labels this PR touches."""
    hits = sorted({f for f in files if (f in GUARDED_FILES or f.startswith(GUARDED_PREFIXES)) and not MEMORY.match(f)})
    return [f"label {l}" for l in sorted(set(labels) & GUARDED_LABELS)] + hits


def refs_line(body):
    """Condition 5: the PR body's last Refs: line."""
    lines = [l.strip() for l in (body or "").splitlines() if l.strip().startswith("Refs:")]
    return lines[-1] if lines else None


def build_doc(root, ticket):
    """The ticket's rendered build doc on main's checkout: (path, rigor), or (None, None)."""
    for path in sorted(glob.glob(os.path.join(root, "docs", "agent-dispatch", "*", "sprint-*", "agent-*-build.md"))):
        try:
            with open(path, encoding="utf-8") as f:
                head = f.read(2000)
        except OSError:
            continue
        if re.search(r"(?m)^ticket: " + re.escape(ticket) + r"$", head):
            rigor = re.search(r"(?m)^rigor: (\w+)$", head)
            return path, rigor.group(1) if rigor else None
    return None, None


def review_verdict(root, doc_path, ticket):
    """Condition 3: (attempt, status, verdict) of the ticket's latest review report copy."""
    parts = doc_path.split(os.sep)
    lane, sprint = parts[-3], parts[-2]
    pattern = os.path.join(common_dir(root), "avel", "reports", f"{lane}-{sprint}-agent-*-{ticket.lower()}-review.a*.md")
    best = None
    for path in glob.glob(pattern):
        m = re.search(r"\.a(\d+)\.md$", path)
        if m and (best is None or int(m.group(1)) > best[0]):
            best = (int(m.group(1)), path)
    if not best:
        return None
    with open(best[1], encoding="utf-8") as f:
        text = f.read(4000)
    status = re.search(r"(?m)^status: (\S+)", text)
    verdict = re.search(r"(?m)^verdict: (\S+)", text)
    head = None
    try:  # CR-50 decision 3: the commit the review read, kept beside its report copy by agent.sh
        with open(best[1][:-3] + ".head", encoding="utf-8") as f:
            head = f.read().strip() or None
    except OSError:
        pass
    return best[0], status.group(1) if status else None, verdict.group(1) if verdict else None, head


def run_git(root, *args):
    return subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, timeout=30)


def moved_since_review(root, reviewed, head):
    """Why the PR's head isn't the commit its review read, or None. A clean merge of main, or a commit
    touching only a sprint's locks.md, may follow the review; anything else needs a new review."""
    if reviewed == head:
        return None
    if run_git(root, "merge-base", "--is-ancestor", reviewed, head).returncode != 0:
        return f"the head {head[:7]} isn't built on the reviewed commit {reviewed[:7]}"
    for sha in run_git(root, "rev-list", f"{reviewed}..{head}").stdout.split():
        parents = run_git(root, "rev-list", "--parents", "-n", "1", sha).stdout.split()[1:]
        if len(parents) > 1 and any(run_git(root, "merge-base", "--is-ancestor", p, "origin/main").returncode == 0
                                    for p in parents[1:]):
            continue
        files = run_git(root, "diff-tree", "--no-commit-id", "--name-only", "-r", sha).stdout.split()
        if files and all(f.endswith("/locks.md") for f in files):
            continue
        return f"commit {sha[:7]} came after the review (only main merges and locks.md commits may)"
    return None


def reruns(sha):
    """Condition 1, H5: workflows on this head that ran more than once (attempt 2 or later)."""
    runs = gh("run", "list", "--commit", sha, "--json", "name,attempt")
    return sorted({f"{r['name']} (attempt {r['attempt']})" for r in runs if r.get("attempt", 1) > 1})


def assess(root, number):
    """Every CR-36 condition for one PR: {'pr': ..., 'fails': {n: reason}, 'notes': [...]}."""
    pr = gh("pr", "view", str(number), "--json",
            "number,title,state,isDraft,baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus,"
            "labels,files,body,reviews,comments")
    fails, notes = {}, []
    labels = [l["name"] for l in pr.get("labels", [])]
    files = [f["path"] for f in pr.get("files", [])]
    if pr["state"] != "OPEN" or pr.get("isDraft") or pr["baseRefName"] != "main":
        fails[4] = f"state {pr['state']}{', draft' if pr.get('isDraft') else ''}, base {pr['baseRefName']}"

    # 1: CI
    try:
        checks = gh("pr", "checks", str(number), "--required", "--json", "name,bucket")
    except GhError:
        checks = gh("pr", "checks", str(number), "--json", "name,bucket")
    bad = [f"{c['name']}={c['bucket']}" for c in checks if c["bucket"] not in ("pass", "skipping")]
    if not checks:
        fails[1] = "no checks reported"
    elif bad:
        fails[1] = "not green: " + ", ".join(bad)
    else:
        again = reruns(pr["headRefOid"])
        if again:
            fails[1] = "re-run (H5): " + ", ".join(again)

    # 6, 2, 3: the ticket
    m = TICKET_BRANCH.match(pr["headRefName"])
    ticket = f"T-{m.group(1)}" if m else None
    if not ticket:
        fails[6] = f"not a ticket branch ({pr['headRefName']})"
    else:
        doc, rigor = build_doc(root, ticket)
        if not doc:
            fails[6] = f"no rendered build doc for {ticket} on main"
        else:
            if rigor != "standard":
                fails[2] = f"{ticket} is rigor {rigor}"
                g7 = [c for c in pr.get("comments", []) if G7_PASS.search(c.get("body") or "")]
                notes.append(f"{ticket} G7 second review: {'a pass is on the PR' if g7 else 'no pass on the PR yet'}")
                a_g7 = bool(g7)
            else:
                a_g7 = True
            found = review_verdict(root, doc, ticket)
            if not found:
                fails[3] = f"no review report for {ticket}"
            else:
                attempt, status, verdict, reviewed = found
                notes.append(f"{ticket} review a{attempt}: status {status}, verdict {verdict}"
                             + (f", read {reviewed[:7]}" if reviewed else ""))
                if status != "done" or verdict != "pass":
                    fails[3] = f"review a{attempt} is status {status}, verdict {verdict}"
                elif reviewed:
                    why = moved_since_review(root, reviewed, pr["headRefOid"])
                    if why:
                        fails[3] = f"review a{attempt}: {why}"

    # 4: mergeable
    if pr.get("mergeable") != "MERGEABLE" or pr.get("mergeStateStatus") != "CLEAN":
        fails.setdefault(4, f"{pr.get('mergeable')} / {pr.get('mergeStateStatus')}")

    # 5: Refs
    refs = refs_line(pr.get("body"))
    if not refs:
        fails[5] = "no Refs: line in the PR text"

    # 7: guardrails
    hits = guarded(files, labels)
    if hits:
        shown = hits[:6] + ([f"and {len(hits) - 6} more"] if len(hits) > 6 else [])
        fails[7] = "touches " + ", ".join(shown)

    # 8: hold
    latest = {}
    for r in pr.get("reviews", []):
        latest[r.get("author", {}).get("login")] = r.get("state")
    asking = sorted(a for a, s in latest.items() if s == "CHANGES_REQUESTED")
    if "hold" in labels:
        fails[8] = "hold label"
    elif asking:
        fails[8] = "changes requested by " + ", ".join(asking)

    return {"pr": pr, "refs": refs, "fails": fails, "notes": notes, "g7": locals().get("a_g7", False)}


def describe(a, approved, standing=False):
    pr, fails = a["pr"], a["fails"]
    if standing:
        hard = {n: r for n, r in fails.items() if n not in STANDING_WAIVABLE}
        if 2 in fails and not a.get("g7"):
            hard[2] = fails[2] + ", and no G7 second-review pass is on the PR"
        approved = None
        lines = [f"#{pr['number']} {pr['title']}", f"  head {pr['headRefOid'][:7]} on {pr['headRefName']}"]
        lines += [f"  {n}" for n in a["notes"]]
        for n in sorted(fails):
            covered = " (covered by the standing approval)" if n not in hard else f" -> {ROUTE[n]}"
            lines.append(f"  condition {n} fails: {hard.get(n, fails[n])}{covered}")
        lines.append("  can merge" if not hard else "  can't merge")
        return "\n".join(lines), not hard
    hard = {n: r for n, r in fails.items() if n not in WAIVABLE or not approved}
    lines = [f"#{pr['number']} {pr['title']}", f"  head {pr['headRefOid'][:7]} on {pr['headRefName']}"]
    lines += [f"  {n}" for n in a["notes"]]
    for n in sorted(fails):
        covered = " (covered by Javaris's approval)" if approved and n in WAIVABLE else f" -> {ROUTE[n]}"
        lines.append(f"  condition {n} fails: {fails[n]}{covered}")
    lines.append("  can merge" if not hard else "  can't merge")
    return "\n".join(lines), not hard


def approval_comment(a, text):
    now = datetime.now(CENTRAL).strftime("%b %-d, %Y %H:%M %Z")
    covered = [f"{n} ({a['fails'][n]})" for n in sorted(a["fails"]) if n in WAIVABLE]
    body = [f"**Merged by OSA with Javaris's approval (CR-41).**", "",
            f"Javaris, in OSA's session, {now}:", "", "> " + "\n> ".join(text.splitlines()), "",
            f"- Approved head: {a['pr']['headRefOid']}",
            "- CR-36 conditions his approval covers: " + ("; ".join(covered) if covered else "none, every condition held"),
            "- Held, as always required: 1 (CI green, no re-runs), 4 (mergeable, clean), 5 (squash with the Refs: line), 8 (no hold)"]
    return "\n".join(body)


def standing_comment(a):
    now = datetime.now(CENTRAL).strftime("%b %-d, %Y %H:%M %Z")
    return "\n".join([
        "**Merged by OSA under Javaris's standing approval** (CR-45 decision 3, as CR-50 decision 3 holds it, "
        f"accepted Nov 21), {now}.", "",
        f"- Merged head: {a['pr']['headRefOid']}",
        "- Waived: condition 2 (rigor) only. Held: the review passed with no P0 or P1, on this head or before only "
        "main merges and locks.md commits (3); the G7 second review passed (full rigor); CI green, mergeable, the "
        "Refs: line, a ticket branch, no guardrail path, no hold (1, 4 to 8)."])


def wait_for_main(sha):
    deadline = time.time() + MAIN_CI_TIMEOUT
    while time.time() < deadline:
        runs = gh("run", "list", "--commit", sha, "--json", "name,status,conclusion")
        if runs and all(r["status"] == "completed" for r in runs):
            # cancelled: a newer push to main superseded the run (ci.yml cancels in progress)
            bad = [f"{r['name']}={r['conclusion']}" for r in runs
                   if r["conclusion"] not in ("success", "skipped", "cancelled")]
            return (False, ", ".join(bad)) if bad else (True, ", ".join(r["name"] for r in runs))
        time.sleep(POLL)
    return False, f"main's CI on {sha[:7]} didn't finish in {MAIN_CI_TIMEOUT} s"


def main_red():
    """Each workflow's latest finished, not-superseded run on main; the failed ones (H5, CR-45 decision 6)."""
    runs = gh("run", "list", "--branch", "main", "--limit", "30", "--json", "name,status,conclusion,headSha")
    latest = {}
    for r in runs:  # newest first
        if r["status"] != "completed" or r["conclusion"] in ("cancelled", "skipped"):
            continue
        latest.setdefault(r["name"], r)
    return [f"{n}={r['conclusion']} on {r['headSha'][:7]}" for n, r in latest.items() if r["conclusion"] != "success"]


def merge_one(a, approved, standing=False):
    pr = a["pr"]
    if standing:
        gh("pr", "comment", str(pr["number"]), "--body", standing_comment(a), parse=False)
    elif approved:
        gh("pr", "comment", str(pr["number"]), "--body", approval_comment(a, approved), parse=False)
    gh("pr", "merge", str(pr["number"]), "--squash", "--subject", f"{pr['title']} (#{pr['number']})",
       "--body", a["refs"], "--match-head-commit", pr["headRefOid"], parse=False)
    sha = gh("pr", "view", str(pr["number"]), "--json", "mergeCommit")["mergeCommit"]["oid"]
    return sha


def main(argv=None):
    p = argparse.ArgumentParser(description="CR-36 checks and merges, and CR-41's merge with Javaris's approval")
    p.add_argument("action", choices=["check", "merge"])
    p.add_argument("prs", nargs="+", type=int)
    p.add_argument("--approved", help="Javaris's words approving these PRs, quoted as he wrote them (CR-41)")
    p.add_argument("--standing", action="store_true",
                   help="CR-45 decision 3 as CR-50 decision 3 holds it: waive only rigor, for reviewed ticket PRs")
    args = p.parse_args(argv)
    if args.standing and args.approved is not None:
        p.error("--standing and --approved don't go together")
    if args.approved is not None and not args.approved.strip():
        p.error("--approved needs Javaris's words")
    root = repo_root()

    for i, number in enumerate(args.prs):
        try:
            a = assess(root, number)
        except GhError as e:
            print(f"#{number}: {e}")
            return 1
        text, ok = describe(a, args.approved, args.standing)
        print(text)
        if args.action == "check":
            continue
        if not ok:
            rest = args.prs[i + 1:]
            print(f"stopped at #{number}; not merged: {', '.join(f'#{n}' for n in [number, *rest])}")
            return 1
        red = main_red()
        if red:
            print(f"  main is red ({', '.join(red)}): nothing merges until it's green (H5)")
            print(f"stopped; not merged: {', '.join(f'#{n}' for n in args.prs[i:])}")
            return 1
        try:
            sha = merge_one(a, args.approved, args.standing)
        except GhError as e:
            print(f"  merge failed: {e}")
            return 1
        if i < len(args.prs) - 1:
            print(f"  merged as {sha[:7]}; main's CI is checked before the next merge and after the last (CR-45)")
            continue
        print(f"  merged as {sha[:7]}; waiting for main's CI")
        green, detail = wait_for_main(sha)
        if not green:
            print(f"  main is not green after #{number}: {detail}")
            return 1
        print(f"  main green: {detail}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
