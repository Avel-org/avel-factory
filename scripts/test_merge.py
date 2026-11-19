#!/usr/bin/env python3
"""Tests for OSA's merge tool, scripts/agents/merge.py (CR-36 and CR-41).

  python3 scripts/test_merge.py

Each test builds a throwaway git repo holding one rendered build doc and, if the test needs one, a review
report copy in .git/avel/reports, and puts a fake `gh` on AVEL_GH that serves PRs from a JSON state file
and records every call.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MERGE = os.path.join(KIT, "scripts", "agents", "merge.py")

FAKE_GH = r'''#!/usr/bin/env python3
import json, os, sys
state_path = os.environ["FAKE_GH_STATE"]
state = json.load(open(state_path))
args = sys.argv[1:]
with open(os.environ["FAKE_GH_LOG"], "a") as log:
    log.write(json.dumps(args) + "\n")
def out(x):
    print(json.dumps(x)); sys.exit(0)
if args[:2] == ["pr", "view"]:
    pr = state["prs"][args[2]]
    if args[-1] == "mergeCommit":
        out({"mergeCommit": {"oid": pr["mergeCommit"]}})
    out(pr["view"])
if args[:2] == ["pr", "checks"]:
    if "--required" in args:
        print("no required checks reported"); sys.exit(1)
    out(state["prs"][args[2]]["checks"])
if args[:2] == ["run", "list"]:
    out(state["runs"].get(args[args.index("--commit") + 1], []))
if args[:2] == ["pr", "comment"]:
    sys.exit(0)
if args[:2] == ["pr", "merge"]:
    pr = state["prs"][args[2]]
    head = args[args.index("--match-head-commit") + 1]
    if head != pr["view"]["headRefOid"]:
        print("head moved"); sys.exit(1)
    pr["view"]["state"] = "MERGED"
    json.dump(state, open(state_path, "w"))
    sys.exit(0)
print("unexpected: " + " ".join(args)); sys.exit(2)
'''

GREEN = [{"name": "build, typecheck, lint, test", "bucket": "pass"}, {"name": "lock check", "bucket": "pass"}]


def pr(number, branch, files, title="T-X1: a thing", labels=(), body="Text.\n\nRefs: T-X1", head=None):
    head = head or f"{number:040d}"
    return {"view": {"number": number, "title": title, "state": "OPEN", "isDraft": False, "baseRefName": "main",
                     "headRefName": branch, "headRefOid": head, "mergeable": "MERGEABLE", "mergeStateStatus": "CLEAN",
                     "labels": [{"name": l} for l in labels], "files": [{"path": f} for f in files], "body": body,
                     "reviews": []},
            "checks": GREEN, "mergeCommit": f"m{number:039d}"}


class MergeTool(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.root = os.path.join(self.tmp, "repo")
        os.makedirs(os.path.join(self.root, "docs", "agent-dispatch", "backend", "sprint-09"))
        subprocess.run(["git", "init", "-q", self.root], check=True)
        self.doc("T-X1", "standard")
        self.gh = os.path.join(self.tmp, "gh")
        with open(self.gh, "w") as f:
            f.write(FAKE_GH)
        os.chmod(self.gh, 0o755)
        self.state_path = os.path.join(self.tmp, "state.json")
        self.log = os.path.join(self.tmp, "gh.log")
        open(self.log, "w").close()
        self.state = {"prs": {}, "runs": {}}

    def doc(self, ticket, rigor):
        path = os.path.join(self.root, "docs", "agent-dispatch", "backend", "sprint-09",
                            f"agent-soap-{ticket.lower()}-build.md")
        with open(path, "w") as f:
            f.write(f"---\ndoc: agent-soap-{ticket.lower()}-build\nticket: {ticket}\nrigor: {rigor}\n---\n")

    def review(self, ticket, attempt, status="done", verdict="pass"):
        d = os.path.join(self.root, ".git", "avel", "reports")
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, f"backend-sprint-09-agent-rigg-{ticket.lower()}-review.a{attempt}.md"), "w") as f:
            f.write(f"status: {status}\nverdict: {verdict}\nticket: {ticket}\n")

    def add(self, p, main_ci=("success",)):
        self.state["prs"][str(p["view"]["number"])] = p
        self.state["runs"][p["mergeCommit"]] = [{"name": f"CI{i}", "status": "completed", "conclusion": c, "attempt": 1}
                                                for i, c in enumerate(main_ci)]

    def run_tool(self, *args):
        with open(self.state_path, "w") as f:
            json.dump(self.state, f)
        env = dict(os.environ, AVEL_GH=self.gh, FAKE_GH_STATE=self.state_path, FAKE_GH_LOG=self.log,
                   CLAUDE_PROJECT_DIR=self.root, AVEL_MERGE_POLL="0", AVEL_MERGE_CI_TIMEOUT="5")
        out = subprocess.run([sys.executable, MERGE, *args], cwd=self.root, env=env, capture_output=True, text=True)
        return out.returncode, out.stdout + out.stderr

    def calls(self, verb):
        with open(self.log) as f:
            return [json.loads(l) for l in f if json.loads(l)[:2] == ["pr", verb]]

    def test_a_clean_standard_ticket_pr_merges_without_approval(self):
        self.review("T-X1", 1)
        self.add(pr(7, "t/X1-a-thing", ["packages/server/src/a.ts"]))
        code, out = self.run_tool("merge", "7")
        self.assertEqual(code, 0, out)
        merge = self.calls("merge")[0]
        self.assertEqual(merge[merge.index("--subject") + 1], "T-X1: a thing (#7)")
        self.assertEqual(merge[merge.index("--body") + 1], "Refs: T-X1")
        self.assertIn("--squash", merge)
        self.assertEqual(merge[merge.index("--match-head-commit") + 1], f"{7:040d}")
        self.assertEqual(self.calls("comment"), [])

    def test_a_design_pr_needs_approval_and_records_his_words(self):
        self.add(pr(8, "rules/x", ["docs/design/Build rules.md", "AGENTS.md"], title="Build rules: x", body="Refs: G5"))
        code, out = self.run_tool("merge", "8")
        self.assertEqual(code, 1, out)
        self.assertIn("condition 7 fails", out)
        self.assertIn("Javaris, as a decision", out)
        self.assertEqual(self.calls("merge"), [])

        code, out = self.run_tool("merge", "8", "--approved", "merge 8 yes")
        self.assertEqual(code, 0, out)
        comment = self.calls("comment")[0]
        body = comment[comment.index("--body") + 1]
        self.assertIn("> merge 8 yes", body)
        self.assertIn(f"Approved head: {8:040d}", body)
        self.assertIn("7 (touches", body)
        self.assertEqual(len(self.calls("merge")), 1)

    def test_a_full_rigor_ticket_needs_approval(self):
        self.doc("T-X2", "full")
        self.review("T-X2", 1)
        self.add(pr(9, "t/X2-big", ["packages/server/src/b.ts"], title="T-X2: big", body="Refs: T-X2"))
        code, out = self.run_tool("check", "9")
        self.assertIn("condition 2 fails: T-X2 is rigor full", out)
        code, out = self.run_tool("merge", "9", "--approved", "yes 9")
        self.assertEqual(code, 0, out)

    def test_red_ci_is_never_covered_by_approval(self):
        p = pr(10, "rules/y", ["AGENTS.md"], body="Refs: G1")
        p["checks"] = [{"name": "build, typecheck, lint, test", "bucket": "fail"}]
        self.add(p)
        code, out = self.run_tool("merge", "10", "--approved", "merge it")
        self.assertEqual(code, 1, out)
        self.assertIn("condition 1 fails", out)
        self.assertEqual(self.calls("merge"), [])
        self.assertEqual(self.calls("comment"), [])

    def test_a_rerun_check_is_never_covered_by_approval(self):
        self.review("T-X1", 1)
        p = pr(11, "t/X1-a-thing", ["a.ts"])
        self.add(p)
        self.state["runs"][p["view"]["headRefOid"]] = [{"name": "CI", "attempt": 2, "status": "completed", "conclusion": "success"}]
        code, out = self.run_tool("merge", "11", "--approved", "yes")
        self.assertEqual(code, 1, out)
        self.assertIn("re-run (H5): CI (attempt 2)", out)

    def test_hold_and_a_missing_refs_line_are_never_covered(self):
        self.add(pr(12, "rules/z", ["AGENTS.md"], labels=["hold"], body="Refs: G1"))
        self.add(pr(13, "rules/w", ["AGENTS.md"], body="no refs here"))
        code, out = self.run_tool("check", "12", "13")
        self.assertIn("condition 8 fails: hold label", out)
        self.assertIn("condition 5 fails", out)
        code, out = self.run_tool("merge", "12", "--approved", "yes")
        self.assertEqual(code, 1, out)
        code, out = self.run_tool("merge", "13", "--approved", "yes")
        self.assertEqual(code, 1, out)
        self.assertEqual(self.calls("merge"), [])

    def test_a_review_without_a_pass_needs_approval(self):
        self.review("T-X1", 1, verdict="pass")
        self.review("T-X1", 2, status="blocked", verdict="")
        self.add(pr(14, "t/X1-a-thing", ["a.ts"]))
        code, out = self.run_tool("merge", "14")
        self.assertEqual(code, 1, out)
        self.assertIn("condition 3 fails: review a2", out)

    def test_prs_merge_in_order_and_stop_when_main_goes_red(self):
        self.review("T-X1", 1)
        self.add(pr(15, "t/X1-a-thing", ["a.ts"]), main_ci=("success", "failure"))
        self.add(pr(16, "t/X1-a-thing", ["b.ts"]))
        code, out = self.run_tool("merge", "15", "16")
        self.assertEqual(code, 1, out)
        self.assertIn("main is not green after #15", out)
        self.assertIn("not merged: #16", out)
        self.assertEqual([c[2] for c in self.calls("merge")], ["15"])

    def test_a_failed_condition_stops_the_rest_of_the_list(self):
        self.review("T-X1", 1)
        self.add(pr(17, "rules/v", ["AGENTS.md"], body="Refs: G1"))
        self.add(pr(18, "t/X1-a-thing", ["a.ts"]))
        code, out = self.run_tool("merge", "17", "18")
        self.assertEqual(code, 1, out)
        self.assertIn("not merged: #17, #18", out)
        self.assertEqual(self.calls("merge"), [])

    def test_an_empty_approval_is_refused(self):
        self.add(pr(19, "rules/u", ["AGENTS.md"], body="Refs: G1"))
        code, out = self.run_tool("merge", "19", "--approved", "  ")
        self.assertEqual(code, 2, out)
        self.assertEqual(self.calls("merge"), [])


if __name__ == "__main__":
    unittest.main()
