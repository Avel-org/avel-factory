#!/usr/bin/env bash
# The loop a builder or checker seat runs (tools/wezterm/avel.lua, tabs 4 and 5).
# It waits for the agent's next ready task doc in its lane's rendered sprints (oldest first), then opens it here
# through scripts/agent.sh: a fresh worktree and session, one dispatch each (Build rules D1).
# A session that ended with no report, having changed its worktree, is resumed here once as the same
# attempt (CR-46 B2). Anything else that stopped is never retried here: the lead decides (K2, L3).
#
#   scripts/agents/lane.sh backend soap
#   Ctrl+C leaves the loop and drops you to a shell in this pane.
set -uo pipefail

lane=${1:?usage: lane.sh <lane> <agent>} agent=${2:?usage: lane.sh <lane> <agent>}
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$root" || exit 1
state=$(git rev-parse --git-common-dir); [[ $state = /* ]] || state="$root/$state"; state="$state/avel"
name=$(echo "$agent" | tr a-z A-Z)
trap 'echo; echo "$name: loop stopped"; exit 0' INT

last=
say() { [[ $1 != "$last" ]] && { echo "$(date +%H:%M) $name: $1"; last=$1; }; }

while true; do
  if [[ -e $state/paused ]]; then
    say "paused: $(cat "$state/paused" 2>/dev/null) (remove .git/avel/paused to resume)"
    sleep 30; continue
  fi
  next=$(python3 scripts/render.py --next "$lane" "$agent" 2>/dev/null)
  if [[ -z $next ]]; then
    sprint=$(ls -d "docs/agent-dispatch/$lane"/sprint-* 2>/dev/null | tail -1)
    if [[ -z $sprint ]]; then say "no $lane sprint yet"
    else say "nothing ready in ${sprint##*/} (scripts/dispatch.sh $lane/${sprint##*/} --status)"; fi
    sleep 30; continue
  fi
  IFS=$'\t' read -r sprint doc n <<<"$next"
  echo "$(date +%H:%M) $name: starting $doc a$n in 5 seconds (Ctrl+C to stop the loop)"
  sleep 5
  scripts/agent.sh --here "$lane" "$sprint" "$doc" "$n"
  # A crash or a cut-off with no report: one resume of the same attempt, if it got somewhere.
  scripts/agent.sh --here --auto-resume "$lane" "$sprint" "$doc"
  last=
  echo "$(date +%H:%M) $name: session over. Looking for the next one."
  sleep 5
done
