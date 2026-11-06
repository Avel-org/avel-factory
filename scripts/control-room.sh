#!/usr/bin/env bash
# Open the "avel" control room from any shell: INT (the dashboard,
# scripts/dashboard.py) plus the whole roster,
# grouped into team tabs, each agent in its own pane:
#   LEADS     AXIS | ZERO
#   BACKEND   SOAP | IYO       over  ATLAS | RIGG
#   GHOST     GHOST (works for both teams)
#   FRONTEND  NEMI | FANTEM    over  LEON | FENN
#   REVIEW    BRENNAN | ZANE   over  LEAH | BREACH
# At most 2 panes across and 4 per tab, so no session gets squished.
# Ctrl+a then z zooms a pane to the full tab and back. Same as Ctrl+a then v
# inside WezTerm. If the workspace is already open, it only adds the team
# tabs that are missing.
# Every crew agent except the leads runs in its own worktree,
# ../avel-wt/crew-<agent> (scripts/worktrees.sh crew); Axis and Zero run in
# the main checkout. Dispatch attempts that still have a worktree get their
# tab back, resuming their last conversation (scripts/worktrees.sh dispatch).
#
# Usage: scripts/control-room.sh
#        scripts/control-room.sh --arrange   # regroup the running crew sessions into this layout
set -euo pipefail

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
# shellcheck source=lib/wezterm.sh
source "$repo/scripts/lib/wezterm.sh"

# Team tabs: rows separated by "/", panes by spaces; agent:fallback-model.
groups=(
  "LEADS=axis:opus zero:opus"
  "BACKEND=soap:opus iyo:opus / atlas:opus rigg:sonnet"
  "GHOST=ghost:opus"
  "FRONTEND=nemi:opus fantem:opus / leon:opus fenn:sonnet"
  "REVIEW=brennan:opus zane:sonnet / leah:sonnet breach:sonnet"
)

# bash -lc skips ~/.bashrc, so load nvm: plugin hooks need node.
nvm='[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"; '

# Each crew agent's worktree (made if missing). Leads aren't listed: main checkout.
declare -A crew_cwd=()
while IFS=$'\t' read -r a p; do crew_cwd[$a]=$p; done < <("$repo/scripts/worktrees.sh" crew)

# A dispatch tab reopened after a restart: same agent and title, its last conversation.
resume_cmd() { # <agent> <title>
  printf '%sexport AVEL_FROM=%q AVEL_BASE=$(git merge-base main HEAD); claude --agent %s -n %q --continue; exec bash' \
    "$nvm" "$2" "$1" "$2"
}

crew_cmd() { # <agent> <model> <TITLE>
  printf '%sexport AVEL_FROM=%s; if [ -f .claude/agents/%s.md ]; then claude --agent %s -n %s; else claude --model %s -n %s; fi; exec bash' \
    "$nvm" "$3" "$1" "$1" "$3" "$2" "$3"
}

# Start one agent's session: in a new tab (no split args) or a split of a pane.
# With --arrange, an agent that's already open in its own tab is moved instead.
arrange=false; [[ ${1:-} == --arrange ]] && arrange=true
existing() { $arrange && [[ -n ${crew_pane[$1]:-} ]] && echo "${crew_pane[$1]}"; }
start() { # <agent:model> <tab|split pane-id dir percent>
  local name=${1%%:*} model=${1#*:} title; title=${1%%:*}; title=${title^^}
  local move; move=$(existing "$title" || true)
  if [[ $2 == tab ]]; then
    if [[ -n $move ]]; then echo "$move"; return; fi   # already its own tab: reuse it
    wezterm.exe cli spawn --pane-id "$int" --domain-name WSL:Ubuntu --cwd "${crew_cwd[$name]:-$repo}" -- bash -lc "$(crew_cmd "$name" "$model" "$title")" | tr -d '\r'
  elif [[ -n $move ]]; then
    wezterm.exe cli split-pane --pane-id "$3" "--$4" --percent "$5" --move-pane-id "$move" >/dev/null
    echo "$move"
  else
    wezterm.exe cli split-pane --pane-id "$3" "--$4" --percent "$5" --cwd "${crew_cwd[$name]:-$repo}" -- bash -lc "$(crew_cmd "$name" "$model" "$title")" | tr -d '\r'
  fi
}

# --arrange: find every running crew session by its pane title ("✳ SOAP"),
# give each one its own tab, then let the loop below regroup them by pane ID.
# Moving panes keeps the sessions running.
declare -A crew_pane=()
if $arrange; then
  crew=" $(printf '%s\n' "${groups[@]}" | sed 's/^[^=]*=//; s/:[a-z]*//g; s|/||g' | tr '\n' ' ' | tr a-z A-Z) "
  while IFS=$'\t' read -r id name; do
    [[ $crew == *" $name "* ]] && crew_pane[$name]=$id
  done < <(wezterm.exe cli list --format json | python3 -c '
import json, re, sys
for p in json.load(sys.stdin):
    if p["workspace"] == "avel":
        print(p["pane_id"], re.sub(r"^[^A-Za-z0-9]+", "", p["title"]).strip(), sep="\t")')
  # In roster order, so the team tabs come out in order too.
  for name in $crew; do
    [[ -n ${crew_pane[$name]:-} ]] || continue
    wezterm.exe cli move-pane-to-new-tab --pane-id "${crew_pane[$name]}" >/dev/null
    wezterm.exe cli set-tab-title --pane-id "${crew_pane[$name]}" "$name"
  done
fi

open=$(avel_tabs | cut -f2)
# Team tabs hold several panes, so check them by tab title, not session name.
tab_titles=$(wezterm.exe cli list --format json | python3 -c '
import json, sys
print("\n".join({p["tab_title"] for p in json.load(sys.stdin) if p["workspace"] == "avel"}))')
int=$(avel_tabs | awk -F'\t' '$2 == "INT" { print $1; exit }')
if [[ -z $int ]]; then
  int=$(wezterm.exe cli spawn --new-window --workspace avel --domain-name WSL:Ubuntu --cwd "$repo" -- bash -lc "${nvm}export AVEL_FROM=INT; python3 scripts/dashboard.py; exec bash" | tr -d '\r')
  wezterm.exe cli set-tab-title --pane-id "$int" INT
fi

added=()
for g in "${groups[@]}"; do
  tab=${g%%=*} spec=${g#*=}
  $arrange || ! grep -qx "$tab" <<<"$tab_titles" || continue
  # First the left pane of every row, top to bottom (each split off the one
  # above it, so rows span the full width), then the rest of each row.
  IFS=/ read -ra rows <<<"$spec"
  leads=()
  for ((r = 0; r < ${#rows[@]}; r++)); do
    read -ra row <<<"${rows[r]}"
    if (( r == 0 )); then
      p=$(start "${row[0]}" tab); wezterm.exe cli set-tab-title --pane-id "$p" "$tab"
    else
      rest=$(( ${#rows[@]} - r ))
      p=$(start "${row[0]}" split "${leads[r-1]}" bottom $(( 100 * rest / (rest + 1) )))
    fi
    leads+=("$p")
  done
  for ((r = 0; r < ${#rows[@]}; r++)); do
    read -ra row <<<"${rows[r]}"
    cur=${leads[r]}
    for ((i = 1; i < ${#row[@]}; i++)); do
      n=$(( ${#row[@]} - i ))
      cur=$(start "${row[i]}" split "$cur" right $(( 100 * n / (n + 1) )))
    done
  done
  added+=("$tab")
done
# Dispatch attempts whose worktree is still there but whose tab is gone.
open_now=$(avel_tabs | cut -f2)
while IFS=$'\t' read -r title agent path; do
  grep -qxF "$title" <<<"$open_now" && continue
  p=$(wezterm.exe cli spawn --pane-id "$int" --cwd "$path" -- bash -lc "$(resume_cmd "$agent" "$title")" | tr -d '\r')
  wezterm.exe cli set-tab-title --pane-id "$p" "$title"
  added+=("$title")
done < <("$repo/scripts/worktrees.sh" dispatch)
wezterm.exe cli activate-pane --pane-id "$int"
if (( ${#added[@]} )); then echo "opened: ${added[*]}"; else echo "every team tab is already open"; fi
echo "the tabs are in the avel workspace: in WezTerm press Ctrl+a then w, and pick avel (maximize the window: Win+Up)"
