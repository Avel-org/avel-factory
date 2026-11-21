#!/usr/bin/env python3
"""What the build's sessions cost, from their Claude Code transcripts (Build rules K3, O).

  scripts/agents/cost.py                     every attempt in .git/avel/attempts.jsonl
  scripts/agents/cost.py --since 2026-11-21  attempts started on or after a date (an ISO prefix)
  scripts/agents/cost.py --json              the same, as JSON, for a digest

It's the API-equivalent cost: the tokens each session used, at list prices. On a Claude plan that isn't
what was billed. Each attempt's transcripts are ~/.claude/projects/<its worktree path, non-alphanumerics as
'-'>/*.jsonl; a message's usage is counted once (by message id and request id). Cache writes are priced at
1.25 x input (5-minute TTL) or 2 x input (1-hour TTL).

Prices: per million tokens, from the claude-api skill's model table (cached 2026-11-03). Update PRICES when
they change.
"""

import argparse
import collections
import glob
import json
import os
import re
import subprocess
import sys

PRICES = {  # input, output, cache read ($ per 1M tokens)
    "opus": (4.00, 20.00, 0.20),
    "sonnet": (2.00, 10.00, 0.10),
    "haiku": (0.10, 0.50, 0.01),
}
KIND = re.compile(r"-(t-[a-z]\d+)-(test-unit|test-e2e|build|review)$")


def tier(model):
    return next((t for t in PRICES if t in (model or "")), None)


def transcript_dir(worktree, root):
    return os.path.join(root, re.sub(r"[^A-Za-z0-9]", "-", worktree))


def cost_of(folder):
    """(usd, {component: usd}, model calls) for one attempt's transcripts."""
    seen, parts, calls = set(), collections.Counter(), 0
    for f in glob.glob(os.path.join(folder, "*.jsonl")):
        with open(f, errors="replace") as fh:
            for line in fh:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if d.get("type") != "assistant":
                    continue
                m = d.get("message") or {}
                u = m.get("usage") or {}
                key = (m.get("id"), d.get("requestId"))
                t = tier(m.get("model"))
                if not u or not t or key in seen:
                    continue
                seen.add(key)
                calls += 1
                pi, po, pr = PRICES[t]
                cc = u.get("cache_creation") or {}
                w1h = cc.get("ephemeral_1h_input_tokens", 0)
                w5m = cc.get("ephemeral_5m_input_tokens", 0) if cc else u.get("cache_creation_input_tokens", 0)
                parts["output"] += u.get("output_tokens", 0) * po / 1e6
                parts["cache read"] += u.get("cache_read_input_tokens", 0) * pr / 1e6
                parts["cache write"] += (w5m * pi * 1.25 + w1h * pi * 2) / 1e6
                parts["input"] += u.get("input_tokens", 0) * pi / 1e6
    return sum(parts.values()), parts, calls


def merged_tickets(repo):
    out = subprocess.run(["git", "-C", repo, "log", "--format=%s", "main"], capture_output=True, text=True)
    return set(re.findall(r"^(T-[A-Z]\d+):", out.stdout, re.M))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--since", default="")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--projects", default=os.path.expanduser("~/.claude/projects"))
    a = ap.parse_args()
    repo = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True,
                          cwd=os.path.dirname(os.path.abspath(__file__))).stdout.strip()
    common = subprocess.run(["git", "-C", repo, "rev-parse", "--path-format=absolute", "--git-common-dir"],
                            capture_output=True, text=True).stdout.strip()
    path = os.path.join(common, "avel", "attempts.jsonl")
    rows = [json.loads(l) for l in open(path)] if os.path.exists(path) else []
    rows = [r for r in rows if r.get("started", "") >= a.since]
    done, per_ticket, per_kind, parts, missing = set(), collections.Counter(), collections.defaultdict(list), \
        collections.Counter(), 0
    for r in rows:
        wt = r.get("worktree", "")
        if wt in done:  # a resumed attempt shares its worktree's transcripts
            continue
        done.add(wt)
        folder = transcript_dir(wt, a.projects)
        if not os.path.isdir(folder):
            missing += 1
            continue
        usd, p, _ = cost_of(folder)
        parts.update(p)
        m = KIND.search(r["doc"])
        if m:
            per_ticket[m.group(1).upper()] += usd
            per_kind[m.group(2)].append(usd)
    merged = sorted(per_ticket[t] for t in merged_tickets(repo) if t in per_ticket)
    med = lambda v: sorted(v)[len(v) // 2] if v else 0.0
    report = {
        "attempts": len(done), "without_transcript": missing, "total_usd": round(sum(parts.values()), 2),
        "components_usd": {k: round(v, 2) for k, v in parts.most_common()},
        "per_kind": {k: {"n": len(v), "median_usd": round(med(v), 2), "mean_usd": round(sum(v) / len(v), 2)}
                     for k, v in sorted(per_kind.items())},
        "merged_tickets": {"n": len(merged), "median_usd": round(med(merged), 2),
                           "mean_usd": round(sum(merged) / len(merged), 2) if merged else 0.0},
    }
    if a.json:
        print(json.dumps(report, indent=1))
        return
    print(f"{report['attempts']} attempts ({missing} without a transcript): ${report['total_usd']:.2f} API-equivalent")
    print("  by part: " + ", ".join(f"{k} ${v:.2f}" for k, v in report["components_usd"].items()))
    for k, v in report["per_kind"].items():
        print(f"  {k:9s} n={v['n']:3d}  median ${v['median_usd']:.2f}  mean ${v['mean_usd']:.2f}")
    mt = report["merged_tickets"]
    print(f"  merged tickets: {mt['n']}, median ${mt['median_usd']:.2f}, mean ${mt['mean_usd']:.2f} (every attempt counted)")


if __name__ == "__main__":
    sys.exit(main())
