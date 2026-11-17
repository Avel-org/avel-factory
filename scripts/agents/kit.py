#!/usr/bin/env python3
"""The kit a dispatched session runs with, taken from main rather than from the ticket branch.

  scripts/agents/kit.py <agent> <out dir>

A worktree checks out the ticket's branch, and a branch cut before a kit change keeps the old
.claude/agents/<agent>.md and .claude/settings.json: Fenn's T-F5 tests a2 (Nov 17) started on a
branch from before #23 and had no SendMessage. So scripts/agent.sh passes these instead:
  <out>/agents.json     the agent's identity from main, for `claude --agents`
  <out>/settings.json   main's settings, its hooks pointed at the main checkout's scripts, for
                        `claude --settings`. They load beside the branch's project settings:
                        permissions add up, and an older branch's hooks run too (they only write
                        the same state). Turning the project source off would drop CLAUDE.md.
"""

import json
import os
import re
import subprocess
import sys


def show(root, path):
    out = subprocess.run(["git", "show", f"main:{path}"], cwd=root, capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f"kit.py: main has no {path}")
    return out.stdout


def identity(text, agent):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        sys.exit(f"kit.py: .claude/agents/{agent}.md has no frontmatter")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    out = {"description": meta.get("description", agent), "prompt": m.group(2).strip() + "\n"}
    if meta.get("tools"):
        out["tools"] = [t.strip() for t in meta["tools"].split(",") if t.strip()]
    if meta.get("model"):
        out["model"] = meta["model"]
    return out


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: kit.py <agent> <out dir>")
    agent, out = sys.argv[1], sys.argv[2]
    root = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=os.path.dirname(os.path.abspath(__file__)),
                          capture_output=True, text=True, check=True).stdout.strip()
    os.makedirs(out, exist_ok=True)
    agents = {agent: identity(show(root, f".claude/agents/{agent}.md"), agent)}
    with open(os.path.join(out, "agents.json"), "w") as f:
        json.dump(agents, f, indent=1)
    settings = show(root, ".claude/settings.json").replace("$CLAUDE_PROJECT_DIR/scripts/", f"{root}/scripts/")
    json.loads(settings)  # still valid JSON
    with open(os.path.join(out, "settings.json"), "w") as f:
        f.write(settings)


if __name__ == "__main__":
    main()
