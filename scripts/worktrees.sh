#!/usr/bin/env bash
# Worktrees for the control room. WezTerm (.wezterm.lua) and
# scripts/control-room.sh call this when they open the avel workspace.
#
# Usage: scripts/worktrees.sh crew       # make sure every standing crew agent has its worktree
#        scripts/worktrees.sh dispatch   # list the dispatch attempts that still have a worktree
#
# crew: each standing crew session except the leads gets its own worktree,
#   ../avel-wt/crew-<agent> on branch crew/<agent>, so no crew session works
#   in the main checkout. Axis and Zero stay in the main checkout on main:
#   they write the contracts and render the packages there. Missing worktrees
#   are made from main. A clean crew branch with no commits of its own is
#   fast-forwarded to main on every load, so the crew always starts from the
#   latest docs and agent files. A crew branch with its own commits or
#   uncommitted changes is left alone, with a warning on stderr.
#   Prints one line per crew agent: <agent><TAB><path>.
#
# dispatch: every worktree on a dispatch branch
#   (<team>/sprint-NN/agent-<agent>-<module>-<role>-a<N>), so its tab can be
#   reopened after a restart. Prints <tab title><TAB><agent><TAB><path>, where
#   the title is the one scripts/agent.sh gives it ("SOAP m2-build a1").
#
# Real work still goes through dispatches (scripts/agent.sh), one fresh
# worktree per attempt. Crew worktrees are for talking to an agent between
# dispatches, away from main.
set -euo pipefail

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
# Always work from the main checkout, even when called from a worktree.
main=$(git -C "$repo" worktree list --porcelain | sed -n '1s/^worktree //p')
wt_root="$(dirname "$main")/avel-wt"

# Keep in step with the team tabs in scripts/control-room.sh and .wezterm.lua.
crew=(soap iyo atlas rigg ghost nemi fantem leon fenn brennan zane leah breach)

case ${1:-} in
  crew)
    git -C "$main" worktree prune
    mkdir -p "$wt_root"
    for a in "${crew[@]}"; do
      wt="$wt_root/crew-$a" branch="crew/$a"
      if [[ ! -e $wt/.git ]]; then
        if git -C "$main" show-ref --verify -q "refs/heads/$branch"; then
          git -C "$main" worktree add -q "$wt" "$branch"
        else
          git -C "$main" worktree add -q -b "$branch" "$wt" main
        fi
      fi
      if [[ -n $(git -C "$wt" status --porcelain) ]]; then
        echo "crew-$a has uncommitted changes: left as it is" >&2
      elif git -C "$main" merge-base --is-ancestor "$branch" main; then
        git -C "$wt" merge -q --ff-only main
      else
        echo "crew/$a has commits that aren't on main: left as it is" >&2
      fi
      printf '%s\t%s\n' "$a" "$wt"
    done
    ;;
  dispatch)
    git -C "$main" worktree list --porcelain | awk '
      /^worktree / { p = substr($0, 10) }
      /^branch /   { b = $2; sub("refs/heads/", "", b); print p "\t" b }' |
    while IFS=$'\t' read -r path branch; do
      [[ -d $path ]] || continue
      [[ $branch =~ ^(backend|frontend)/sprint-[0-9]+/agent-([a-z]+)-(.+)-a([0-9]+)$ ]] || continue
      agent=${BASH_REMATCH[2]} rest=${BASH_REMATCH[3]} n=${BASH_REMATCH[4]}
      printf '%s\t%s\t%s\n' "${agent^^} $rest a$n" "$agent" "$path"
    done
    ;;
  *) sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
