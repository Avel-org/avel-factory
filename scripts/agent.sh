#!/usr/bin/env bash
# Open one dispatch as its own agent session: a fresh worktree and a named,
# team-colored WezTerm tab in the "avel" workspace.
#
# Usage: scripts/agent.sh <team> <sprint> <task-doc> [attempt] [start-commit]
#        scripts/agent.sh --docs <agent>
#   scripts/agent.sh backend sprint-01 agent-rigg-m2-test-unit
#   scripts/agent.sh backend sprint-01 agent-soap-m2-build 2               # retry, fresh worktree
#   scripts/agent.sh backend sprint-01 agent-brennan-m2-review-spec 1 <builder-sha>
#   --docs lists an agent's task docs, one per line: <team> <sprint> <task-doc> <next attempt>
#   (the WezTerm picker, Ctrl+a s, uses it).
set -euo pipefail

usage() { sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)

# Next attempt for a task doc: one more than its highest attempt branch.
next_attempt() { # <team> <sprint> <task>
  local n
  n=$(git -C "$repo" branch --list "$1/$2/$3-a*" --format='%(refname:short)' \
    | sed -n 's/.*-a\([0-9]\{1,\}\)$/\1/p' | sort -n | tail -1)
  echo $(( ${n:-0} + 1 ))
}

if [[ ${1:-} == --docs ]]; then
  [[ -n ${2:-} ]] || usage
  shopt -s nullglob
  for f in "$repo"/docs/agent-dispatch/{backend,frontend}/sprint-*/agent-"${2,,}"-*.md; do
    [[ $f == *-completion.md ]] && continue
    rel=${f#"$repo"/docs/agent-dispatch/}
    t=${rel%%/*} rest=${rel#*/} sp=${rest%%/*} doc=$(basename "$f" .md)
    printf '%s\t%s\t%s\t%s\n' "$t" "$sp" "$doc" "$(next_attempt "$t" "$sp" "$doc")"
  done
  exit 0
fi

[[ $# -ge 3 ]] || usage
team=$1 sprint=$2 task=${3%.md} attempt=${4:-1} base=${5:-main}
# shellcheck source=lib/wezterm.sh
source "$repo/scripts/lib/wezterm.sh"

[[ $team == backend || $team == frontend ]] || { echo "team must be backend or frontend" >&2; exit 1; }
[[ $task =~ ^agent-([a-z]+)-(.+)$ ]] || { echo "task doc must be named agent-<agent>-<module>-<role>" >&2; exit 1; }
agent=${BASH_REMATCH[1]} rest=${BASH_REMATCH[2]}

doc="docs/agent-dispatch/$team/$sprint/$task.md"
[[ -f $repo/$doc ]] || { echo "no task doc at $doc: render the package first" >&2; exit 1; }

int_pane=$(avel_pane_for INT) || { echo "open the control room first: Ctrl+a then v, or scripts/control-room.sh" >&2; exit 1; }

# Six at a time across both teams, counting reviews (the factory's 6 slots).
# Only dispatch tabs count ("<AGENT> <module>-<role> a<N>"), not INT or the
# standing crew tabs that Ctrl+a v opens (one word: "AXIS", "SOAP", ...).
running=$(avel_tabs | awk -F'\t' '$2 ~ / a[0-9]+$/' | grep -c . || true)
if (( running >= 6 )); then
  echo "6 agent sessions are already open. Close one (after its report) before starting another." >&2
  exit 1
fi

title="${agent^^} $rest a$attempt"
if avel_tabs | awk -F'\t' -v t="$title" '$2 == t { found = 1 } END { exit !found }'; then
  echo "a tab named '$title' is already open" >&2
  exit 1
fi

wt="$(dirname "$repo")/avel-wt/$team-$sprint-$task-a$attempt"
branch="$team/$sprint/$task-a$attempt"
git -C "$repo" worktree add -q -b "$branch" "$wt" "$base"

# Model and tools come from the agent file. Before the agent files exist,
# fall back to the roster's model.
case $agent in
  rigg|fenn|zane|leah|breach) model=sonnet ;;
  *) model=opus ;;
esac
prompt="/dispatch $team/$sprint/$task"
# What a reviewer diffs against: where the attempt's branch left main.
# For a builder or test writer this is just its start commit.
avel_base=$(git -C "$repo" merge-base main "$base")
cmd="[ -s \"\$HOME/.nvm/nvm.sh\" ] && . \"\$HOME/.nvm/nvm.sh\"
export AVEL_FROM=$(printf %q "$title") AVEL_BASE=$avel_base
if [ -f .claude/agents/$agent.md ]; then
  claude --agent $agent -n $(printf %q "$title") $(printf %q "$prompt")
else
  claude --model $model -n $(printf %q "$title") $(printf %q "$prompt")
fi
exec bash"

pane=$(wezterm.exe cli spawn --pane-id "$int_pane" --cwd "$wt" -- bash -lc "$cmd" | tr -d '\r')
wezterm.exe cli set-tab-title --pane-id "$pane" "$title"
python3 "$repo/scripts/events.py" emit attempt.started --actor "${AVEL_FROM:-operator}" --subject "attempt:$branch" \
  "agent=${agent^^}" "team=$team" "sprint=$sprint" "task=$task" "attempt=$attempt" "base=$avel_base" "worktree=$wt" || true
echo "opened '$title' on $branch in $wt"
