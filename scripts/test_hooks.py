#!/usr/bin/env python3
"""Tests for the CR-37 hooks: scripts/hooks/turns.py and scripts/agents/msglog.py.

  python3 -m unittest scripts/test_hooks.py
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TURNS = os.path.join(KIT, "scripts/hooks/turns.py")
MSGLOG = os.path.join(KIT, "scripts/agents/msglog.py")
SESSION = os.path.join(KIT, "scripts/hooks/session.py")


def transcript(path, turns, split=False):
    """A transcript with `turns` assistant messages that call a tool, plus noise that doesn't count."""
    with open(path, "w") as f:
        f.write(json.dumps({"type": "user", "message": {"content": "go"}}) + "\n")
        f.write(json.dumps({"type": "assistant", "message": {"id": "text-only", "content": [{"type": "text"}]}}) + "\n")
        for i in range(turns):
            blocks = [{"type": "tool_use", "name": "Bash"}]
            f.write(json.dumps({"type": "assistant", "message": {"id": f"m{i}", "content": blocks}}) + "\n")
            if split:  # a second block of the same message, written as its own line
                f.write(json.dumps({"type": "assistant", "message": {"id": f"m{i}", "content": blocks}}) + "\n")
            f.write(json.dumps({"type": "user", "message": {"content": [{"type": "tool_result"}]}}) + "\n")


class Turns(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="avel-turns-")
        subprocess.run(["git", "init", "-q", self.tmp], check=True)
        self.t = os.path.join(self.tmp, "t.jsonl")
        self.report = os.path.join(self.tmp, "report.md")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_hook(self, mode, turns, tool="Bash", tool_input=None, limit="20", split=False, path=None):
        if path is None:
            transcript(self.t, turns, split)
        env = dict(os.environ, AVEL_REPORT=self.report, CLAUDE_PROJECT_DIR=self.tmp)
        env.pop("AVEL_TURN_LIMIT", None)
        if limit is not None:
            env["AVEL_TURN_LIMIT"] = limit
        hook = {"transcript_path": path or self.t, "tool_name": tool,
                "tool_input": tool_input or {"command": "pnpm test"}}
        out = subprocess.run([sys.executable, TURNS, mode], input=json.dumps(hook), capture_output=True,
                             text=True, env=env)
        self.assertEqual(out.returncode, 0, out.stderr)
        return json.loads(out.stdout) if out.stdout.strip() else None

    def denied(self, out):
        return bool(out) and out["hookSpecificOutput"].get("permissionDecision") == "deny"

    def test_no_limit_set_means_no_cap(self):
        self.assertIsNone(self.run_hook("pre", 500, limit=None))

    def test_under_the_limit_is_allowed_and_quiet(self):
        self.assertIsNone(self.run_hook("pre", 10))
        self.assertIsNone(self.run_hook("post", 10))

    def test_the_last_five_turns_warn(self):
        out = self.run_hook("post", 15)
        self.assertIn("5 turns left of 20", out["hookSpecificOutput"]["additionalContext"])
        self.assertIn("1 turn left", self.run_hook("post", 19)["hookSpecificOutput"]["additionalContext"])
        self.assertIsNone(self.run_hook("pre", 19))

    def test_split_messages_count_once(self):
        self.assertIsNone(self.run_hook("pre", 19, split=True))
        self.assertTrue(self.denied(self.run_hook("pre", 20, split=True)))

    def test_at_the_limit_only_the_report_git_and_osa(self):
        self.assertTrue(self.denied(self.run_hook("pre", 20)))  # pnpm test
        self.assertTrue(self.denied(self.run_hook("pre", 20, "Read", {"file_path": self.report})))
        self.assertTrue(self.denied(self.run_hook("pre", 20, "Write", {"file_path": os.path.join(self.tmp, "x.ts")})))
        self.assertIsNone(self.run_hook("pre", 20, "Write", {"file_path": self.report}))
        self.assertIsNone(self.run_hook("pre", 21, "Edit", {"file_path": self.report}))
        self.assertIsNone(self.run_hook("pre", 22, "Bash", {"command": "git add report.md && git commit -m 'report'"}))
        self.assertTrue(self.denied(self.run_hook("pre", 22, "Bash", {"command": "git commit -m x; rm -rf src"})))
        self.assertIsNone(self.run_hook("pre", 23, "SendMessage", {"to": "OSA", "message": "stopped on turns"}))

    def test_after_the_grace_turns_everything_is_refused(self):
        out = self.run_hook("pre", 25, "Write", {"file_path": self.report})
        self.assertTrue(self.denied(out))
        self.assertIn("grace", out["hookSpecificOutput"]["permissionDecisionReason"])

    def test_an_unreadable_transcript_allows_and_logs(self):
        out = self.run_hook("pre", 0, path=os.path.join(self.tmp, "missing.jsonl"))
        self.assertIsNone(out)
        with open(os.path.join(self.tmp, ".git/avel/logs/turns.log")) as f:
            self.assertIn("couldn't count turns", f.read())


class MsgLog(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="avel-msg-")
        subprocess.run(["git", "init", "-q", self.tmp], check=True)
        plan = os.path.join(self.tmp, "docs/agent-dispatch/backend/sprint-02")
        os.makedirs(plan)
        with open(os.path.join(plan, "plan.toml"), "w") as f:
            f.write('[[ticket]]\nid = "T-B4"\n')
        self.msgs = os.path.join(self.tmp, ".git/avel/messages")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_log(self, args, text, seat=None):
        env = dict(os.environ, CLAUDE_PROJECT_DIR=self.tmp)
        env.pop("AVEL_SEAT", None)
        if seat:
            env["AVEL_SEAT"] = seat
        return subprocess.run([sys.executable, MSGLOG, *args], input=text, capture_output=True, text=True, env=env)

    def read(self, name):
        with open(os.path.join(self.msgs, name)) as f:
            return f.read()

    def test_received_goes_to_the_tickets_file_with_lane_and_sprint(self):
        out = self.run_log(["received", "--from", "soap"], "T-B4 build: needs-cr, report at x.md")
        self.assertEqual(out.returncode, 0, out.stderr)
        body = self.read("backend-sprint-02-T-B4.md")
        self.assertIn("soap → OSA (received)", body)
        self.assertIn("needs-cr, report at x.md", body)

    def test_sent_with_no_ticket_goes_to_general_and_appends(self):
        self.run_log(["sent", "--to", "rigg"], "first")
        self.run_log(["sent", "--to", "rigg"], "second")
        body = self.read("general.md")
        self.assertLess(body.index("first"), body.index("second"))
        self.assertIn("OSA → rigg (sent)", body)

    def test_the_hook_logs_osas_sendmessage_only(self):
        call = json.dumps({"tool_name": "SendMessage", "tool_input": {"to": "soap", "message": "T-B4: carry on"}})
        self.run_log(["hook"], call, seat="SOAP T-B4-build a1")
        self.assertFalse(os.path.exists(self.msgs))
        out = self.run_log(["hook"], call, seat="OSA")
        self.assertEqual(out.returncode, 0)
        self.assertIn("T-B4: carry on", self.read("backend-sprint-02-T-B4.md"))

    def test_the_hook_never_fails_a_call(self):
        out = self.run_log(["hook"], "not json", seat="OSA")
        self.assertEqual(out.returncode, 0)


class DoneFlag(unittest.TestCase):
    """session.py's stop event raises $AVEL_DONE_FLAG only for a report this attempt wrote."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="avel-done-")
        self.flag = os.path.join(self.tmp, "a2.done")
        self.report = os.path.join(self.tmp, "report.md")
        env = dict(os.environ, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@example.com",
                   GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@example.com")
        self.env = env
        subprocess.run("git init -q && git commit -q --allow-empty -m init", cwd=self.tmp, shell=True, env=env, check=True)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def commit_report(self, text):
        with open(self.report, "w") as f:
            f.write(text)
        subprocess.run("git add report.md && git commit -qm report", cwd=self.tmp, shell=True, env=self.env, check=True)

    def stop(self, start=""):
        env = dict(self.env, AVEL_DONE_FLAG=self.flag, AVEL_REPORT=self.report, AVEL_KIND="tests",
                   AVEL_REPORT_START=start, CLAUDE_PROJECT_DIR=self.tmp)
        env.pop("WEZTERM_PANE", None)
        subprocess.run([sys.executable, SESSION, "stop"], input="{}", text=True, env=env, cwd=self.tmp, check=True)
        return os.path.exists(self.flag)

    def sha(self):
        import hashlib
        with open(self.report, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()

    def test_a_committed_report_of_this_attempt_raises_the_flag(self):
        self.commit_report("status: done\n")
        self.assertTrue(self.stop())

    def test_an_earlier_attempts_report_does_not(self):
        # Nov 17: T-F9 tests a2 started on a branch holding a1's committed "blocked" report and was closed.
        self.commit_report("status: blocked\n")
        self.assertFalse(self.stop(start=self.sha()))

    def test_rewriting_the_earlier_report_does(self):
        self.commit_report("status: blocked\n")
        start = self.sha()
        self.commit_report("status: done\n")
        self.assertTrue(self.stop(start=start))

    def test_an_uncommitted_report_does_not(self):
        with open(self.report, "w") as f:
            f.write("status: done\n")
        self.assertFalse(self.stop())


if __name__ == "__main__":
    unittest.main()
