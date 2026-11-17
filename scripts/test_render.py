#!/usr/bin/env python3
"""Tests for the dispatch kit: scripts/render.py, scripts/agent.sh, scripts/dispatch.sh.

  python3 scripts/test_render.py

Each test builds a throwaway git repo with the kit and the example plan
(docs/agent-dispatch/avel/example-plan.toml), and a fake `claude` on PATH that writes a
completion report, so a whole ticket can run tests -> lock -> build -> review -> merge.
"""

import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["scripts/render.py", "scripts/agent.sh", "scripts/dispatch.sh", "scripts/agents/lane.sh",
         "scripts/agents/roster.json", "scripts/agents/limits.json", "docs/agent-dispatch/avel/example-plan.toml"]

FAKE_CLAUDE = r'''#!/usr/bin/env bash
# Fake claude: find the task doc from the "/dispatch <lane>/<sprint>/<doc>" argument (or the
# activation text), write its report with $FAKE_STATUS, and commit it unless it's a review.
set -e
for a in "$@"; do last=$a; done
doc=$(grep -o 'docs/agent-dispatch/[^` ]*\.md' <<<"$last" | head -1 || true)
[[ -z $doc ]] && doc="docs/agent-dispatch/${last#/dispatch }.md"
report=$(grep -m1 '^report: ' "$doc" | cut -d' ' -f2)
kind=$(grep -m1 '^kind: ' "$doc" | cut -d' ' -f2)
echo "$@" > "$HOME/last-claude-args"
printf 'status: %s\nverdict: pass\n' "${FAKE_STATUS:-done}" > "$report"
if [[ $kind != review ]]; then git add "$report" && git commit -qm "report $kind" ; fi
'''


def sh(cmd, cwd, env=None, check=True):
    out = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, env=env)
    if check and out.returncode != 0:
        raise AssertionError(f"{cmd} failed:\n{out.stdout}\n{out.stderr}")
    return out


class Repo:
    def __init__(self):
        self.tmp = tempfile.mkdtemp(prefix="avel-kit-")
        self.root = os.path.join(self.tmp, "factory")
        os.makedirs(self.root)
        for f in FILES:
            dst = os.path.join(self.root, f)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(KIT, f), dst)
            if f.endswith((".sh", ".py")):
                os.chmod(dst, 0o755)
        bin_ = os.path.join(self.tmp, "bin")
        os.makedirs(bin_)
        fake = os.path.join(bin_, "claude")
        with open(fake, "w") as f:
            f.write(FAKE_CLAUDE)
        os.chmod(fake, os.stat(fake).st_mode | stat.S_IEXEC)
        self.env = dict(os.environ, PATH=bin_ + os.pathsep + os.environ["PATH"], HOME=self.tmp,
                        GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@example.com",
                        GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@example.com")
        self.env.pop("AVEL_ROOT_OVERRIDE", None)
        self.run("git init -q -b main && git add -A && git commit -qm init")

    def run(self, cmd, check=True, env=None):
        return sh(cmd, self.root, dict(self.env, **(env or {})), check)

    def plan(self, text=None, lane="backend", sprint="sprint-01"):
        d = os.path.join(self.root, "docs/agent-dispatch", lane, sprint)
        os.makedirs(d, exist_ok=True)
        if text is None:
            with open(os.path.join(self.root, "docs/agent-dispatch/avel/example-plan.toml")) as f:
                text = f.read()
        with open(os.path.join(d, "plan.toml"), "w") as f:
            f.write(text)
        return d

    def close(self):
        sh(f"git worktree prune", self.root, self.env, check=False)
        shutil.rmtree(self.tmp, ignore_errors=True)


def read(path):
    with open(path, "rb") as f:
        return f.read()


def example():
    with open(os.path.join(KIT, "docs/agent-dispatch/avel/example-plan.toml")) as f:
        return f.read()


class RenderChecks(unittest.TestCase):
    def setUp(self):
        self.r = Repo()

    def tearDown(self):
        self.r.close()

    def check_fails(self, text, needle):
        self.r.plan(text)
        out = self.r.run("python3 scripts/render.py --check backend/sprint-01", check=False)
        self.assertNotEqual(out.returncode, 0, out.stdout)
        self.assertIn(needle, out.stderr)

    def test_example_passes_and_renders_three_docs_a_ticket(self):
        d = self.r.plan()
        self.r.run("python3 scripts/render.py --check backend/sprint-01")
        self.r.run("python3 scripts/render.py backend/sprint-01")
        docs = sorted(f for f in os.listdir(d) if f.startswith("agent-"))
        self.assertEqual(len(docs), 12)
        self.assertIn("agent-soap-t-b3-build.md", docs)
        self.assertIn("agent-rigg-t-b3-review.md", docs)
        with open(os.path.join(d, "agent-soap-t-b3-build.md")) as f:
            body = f.read()
        self.assertIn("model: opus", body)  # full rigor
        self.assertIn("branch: t/B3-db-service", body)
        self.assertTrue(body.rstrip().splitlines()[-1].startswith("> You are Soap"))
        for part in ("## 1. Identity", "## 2. Context", "## 5. Territory", "## 7. Completion", "## Activation prompt"):
            self.assertIn(part, body)

    def test_render_is_byte_identical(self):
        d = self.r.plan()
        self.r.run("python3 scripts/render.py backend/sprint-01")
        first = {f: read(os.path.join(d, f)) for f in os.listdir(d)}
        self.r.run("python3 scripts/render.py backend/sprint-01")
        second = {f: read(os.path.join(d, f)) for f in os.listdir(d)}
        self.assertEqual(first, second)

    def test_overlapping_territories_are_refused(self):
        self.check_fails(example().replace('"packages/server/src/idempotency/**"', '"packages/server/src/http/idem/**"'),
                         "could change the same files")

    def test_forbidden_paths_are_refused(self):
        self.check_fails(example().replace('"packages/server/src/main.ts"', '"apps/web/src/main.ts"'), "never changed")
        self.check_fails(example().replace('"packages/server/src/main.ts"', '".claude/agents/soap.md"'), "never changed")

    def test_schema_paths_need_a_label_and_a_cr(self):
        self.check_fails(example().replace('"packages/server/src/main.ts"', '"packages/db/src/schema.ts"'), "I3")

    def test_unknown_dependency_and_loop(self):
        self.check_fails(example().replace('depends_on = ["T-B1"]\nmay_change = ["packages/server/src/http/**"',
                                           'depends_on = ["B9"]\nmay_change = ["packages/server/src/http/**"'),
                         "isn't a ticket id")
        loop = example().replace('id = "T-B1"\nslug', 'id = "T-B1"\ndepends_on = ["T-B4"]\nslug')
        self.check_fails(loop, "dependency loop")

    def test_missing_tests_are_refused(self):
        self.check_fails(example().replace('paths = ["packages/server/test/spike.test.ts"]', 'paths = []'),
                         "tests.paths is empty")

    def test_cross_lane_overlap_is_refused(self):
        self.r.plan()
        front = example().replace('lane = "backend"', 'lane = "frontend"').replace("T-B", "T-F") \
            .replace('role = "test-unit"', 'role = "test-e2e"')
        self.r.plan(front, lane="frontend")
        out = self.r.run("python3 scripts/render.py --check backend/sprint-01 frontend/sprint-01", check=False)
        self.assertNotEqual(out.returncode, 0)
        self.assertIn("never changed", out.stderr)  # packages/** is off limits to the frontend lane


class Flow(unittest.TestCase):
    """One ticket, end to end, through agent.sh with the fake claude."""

    def setUp(self):
        self.r = Repo()
        self.r.plan()
        self.r.run("python3 scripts/render.py backend/sprint-01")

    def tearDown(self):
        self.r.close()

    def status(self):
        return self.r.run("python3 scripts/render.py --status backend/sprint-01").stdout

    def state(self, doc):
        return self.r.run(f"python3 scripts/render.py --state backend/sprint-01 {doc}").stdout.split()[0]

    def test_refuses_an_uncommitted_package(self):
        out = self.r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit", check=False)
        self.assertNotEqual(out.returncode, 0)
        self.assertIn("isn't committed", out.stderr)

    def test_refuses_an_edited_task_doc(self):
        self.r.run("git add -A && git commit -qm 'render sprint-01'")
        p = os.path.join(self.r.root, "docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b1-test-unit.md")
        with open(p, "a") as f:
            f.write("\nextra instructions\n")
        self.r.run("git commit -qam 'edit a task doc'")
        out = self.r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit", check=False)
        self.assertIn("differs from a fresh render", out.stderr)

    def test_a_ticket_from_tests_to_merge(self):
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        self.assertEqual(self.state("agent-rigg-t-b1-test-unit"), "ready")
        self.assertEqual(self.state("agent-rigg-t-b2-test-unit"), "waiting")  # T-B2 depends on T-B1
        self.assertEqual(self.state("agent-soap-t-b1-build"), "waiting")

        # 1. tests
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit")
        self.assertIn(b"--agent rigg", read(os.path.join(r.tmp, "last-claude-args")))
        self.assertEqual(self.state("agent-rigg-t-b1-test-unit"), "done")
        self.assertIn("lock line", self.status())  # the build waits for locks.md

        # 2. the lead locks the tests
        with open(os.path.join(r.root, "docs/agent-dispatch/backend/sprint-01/locks.md"), "a") as f:
            f.write("- T-B1: packages/server/test/spike.test.ts @ abc1234\n")
        r.run("git commit -qam 'lock T-B1'")
        self.assertEqual(self.state("agent-soap-t-b1-build"), "ready")

        # 3. build (the tests' worktree is freed for the branch automatically)
        r.run("scripts/agent.sh --here backend sprint-01 agent-soap-t-b1-build")
        self.assertEqual(self.state("agent-soap-t-b1-build"), "done")
        self.assertEqual(self.state("agent-rigg-t-b1-review"), "ready")

        # 4. review, on a detached checkout; the report stays uncommitted and is kept by agent.sh
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-review")
        self.assertEqual(self.state("agent-rigg-t-b1-review"), "done")
        self.assertIn("verdict pass", self.status())

        # 5. the lead squash-merges with Refs: T-B1, and T-B2's tests become ready
        r.run("git merge -q --squash t/B1-effect-spike && git commit -qm 'feat(server): spike 1' -m 'Refs: T-B1'")
        self.assertEqual(self.state("agent-soap-t-b1-build"), "merged")
        self.assertEqual(self.state("agent-rigg-t-b2-test-unit"), "ready")

    def test_the_lock_line_is_read_from_the_ticket_branch(self):
        # The lead commits the lock line on the ticket's branch, so a dispatcher on main must see it.
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit")
        self.assertEqual(r.run("git branch --show-current").stdout.strip(), "main")
        wt = [l.split(" ", 1)[1] for l in r.run("git worktree list --porcelain").stdout.splitlines()
              if l.startswith("worktree ")]
        wt = next(w for w in wt if r.run(f"git -C '{w}' branch --show-current").stdout.strip() == "t/B1-effect-spike")
        locks = "docs/agent-dispatch/backend/sprint-01/locks.md"
        self.assertEqual(self.state("agent-soap-t-b1-build"), "waiting")

        def on_branch(text, msg):
            with open(os.path.join(wt, locks), "a") as f:
                f.write(text)
            r.run(f"git -C '{wt}' commit -qam '{msg}'")

        on_branch("<!-- - T-B1: packages/server/test/spike.test.ts @ abc1234 -->\n", "comment only")
        self.assertEqual(self.state("agent-soap-t-b1-build"), "waiting")  # a commented line isn't a lock

        on_branch("- T-B1: packages/server/test/spike.test.ts @ abc1234\n", "lock T-B1")
        with open(os.path.join(r.root, locks)) as f:
            self.assertNotRegex(f.read(), r"(?m)^- T-B1:")  # main's copy has no line
        self.assertEqual(self.state("agent-soap-t-b1-build"), "ready")

    def test_a_done_dispatch_runs_again_only_as_a_named_attempt(self):
        # After a review asks for changes, the build's next attempt is the lead's call (CR-37 kit fixes).
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit")
        self.assertEqual(self.state("agent-rigg-t-b1-test-unit"), "done")
        out = r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit", check=False)
        self.assertNotEqual(out.returncode, 0)
        self.assertIn("the lead's call", out.stderr)
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit 2")
        self.assertIn("a2", r.run("python3 scripts/render.py --status backend/sprint-01").stdout)

    def test_a_lock_line_with_spaces_between_paths_doesnt_lock(self):
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit")
        locks = os.path.join(r.root, "docs/agent-dispatch/backend/sprint-01/locks.md")
        with open(locks, "a") as f:
            f.write("- T-B1: packages/server/test/a.test.ts packages/server/test/b.test.ts @ abc1234\n")
        self.assertEqual(self.state("agent-soap-t-b1-build"), "waiting")
        self.assertIn("separate the paths with commas", self.status())
        with open(locks, "a") as f:
            f.write("- T-B1: packages/server/test/a.test.ts, packages/server/test/b.test.ts @ abc1234\n")
        self.assertEqual(self.state("agent-soap-t-b1-build"), "ready")

    def test_an_f2_relock_line_is_a_lock_line(self):
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit")
        with open(os.path.join(r.root, "docs/agent-dispatch/backend/sprint-01/locks.md"), "a") as f:
            f.write("- T-B1: packages/server/test/a.test.ts @ def5678 (F2 relock)\n")
        self.assertEqual(self.state("agent-soap-t-b1-build"), "ready")

    def test_task_docs_ask_for_the_messages_received_section(self):
        p = os.path.join(self.r.root, "docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build.md")
        self.assertIn("Messages received", read(p).decode())

    def test_a_package_keeps_the_renderer_it_was_rendered_with(self):
        # A package rendered before this kit change still verifies, so work in flight isn't stopped.
        r = self.r
        r.run("python3 - <<'PY'\n"
              "import os, sys\n"
              "sys.path.insert(0, 'scripts')\n"
              "import render\n"
              "plan, _ = render.load_plan('backend', 'sprint-01', render.load_json('roster.json'))\n"
              "files = render.render_package(plan, render.owned_paths([plan]), 'avel-render 1')\n"
              "for name, body in files.items():\n"
              "    open(os.path.join(render.folder('backend', 'sprint-01'), name), 'w').write(body)\n"
              "PY")
        r.run("git add -A && git commit -qm 'a v1 package'")
        out = r.run("python3 scripts/render.py --verify backend/sprint-01")
        self.assertIn("matches a fresh render", out.stdout)
        p = os.path.join(r.root, "docs/agent-dispatch/backend/sprint-01/agent-soap-t-b1-build.md")
        self.assertNotIn("Messages received", read(p).decode())

    def test_a_stopped_dispatch_is_never_restarted_by_itself(self):
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit", env={"FAKE_STATUS": "blocked"})
        self.assertEqual(self.state("agent-rigg-t-b1-test-unit"), "stopped")
        # the loop doesn't pick it up again (and T-B2 and T-B3 wait for T-B1 to merge)
        self.assertEqual(r.run("python3 scripts/render.py --next backend rigg").stdout.strip(), "")
        out = r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit", check=False)
        self.assertIn("the lead's call", out.stderr)
        r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit 2")  # a named retry
        self.assertEqual(self.state("agent-rigg-t-b1-test-unit"), "done")

    def test_one_session_per_seat(self):
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        state = os.path.join(r.root, ".git/avel/running")
        os.makedirs(state, exist_ok=True)
        with open(os.path.join(state, "fake"), "w") as f:
            f.write('{"pid": %d, "lane": "backend", "sprint": "sprint-01", "doc": "x", "attempt": 1, "seat": "checker"}'
                    % os.getpid())
        out = r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit", check=False)
        self.assertIn("already running", out.stderr)

    def test_pause_stops_new_sessions(self):
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        os.makedirs(os.path.join(r.root, ".git/avel"), exist_ok=True)
        with open(os.path.join(r.root, ".git/avel/paused"), "w") as f:
            f.write("suspected leak")
        out = r.run("scripts/agent.sh --here backend sprint-01 agent-rigg-t-b1-test-unit", check=False)
        self.assertIn("paused", out.stderr)

    def test_dispatch_sh_dry_run_and_status(self):
        r = self.r
        r.run("git add -A && git commit -qm 'render sprint-01'")
        self.assertIn("would start agent-rigg-t-b1-test-unit a1",
                      r.run("scripts/dispatch.sh backend/sprint-01 --dry-run").stdout)
        self.assertIn("ready", r.run("scripts/dispatch.sh backend/sprint-01 --status").stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
