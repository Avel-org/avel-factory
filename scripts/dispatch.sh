#!/usr/bin/env bash
# Start every dispatch in a sprint that's ready now, the way the factory's
# scheduler will: a module's tests first, its build once they're merged and
# locked, its reviews once the build has its report (checked out at the
# build's result commit). Up to the 6 slots; scripts/agent.sh opens each one.
# Retries are never automatic: a dispatch with an attempt is skipped.
#
# Usage: scripts/dispatch.sh <team>/<sprint> [--dry-run]
#   scripts/dispatch.sh backend/sprint-01             start what's ready
#   scripts/dispatch.sh backend/sprint-01 --dry-run   only say what would start, and what's waiting
set -euo pipefail

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
target=${1:-}
[[ $target =~ ^(backend|frontend)/(sprint-[0-9]{2})/?$ ]] || { sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
team=${BASH_REMATCH[1]} sprint=${BASH_REMATCH[2]}
dry=false; [[ ${2:-} == --dry-run ]] && dry=true

# The package on main must be exactly what its plan renders.
python3 "$repo/scripts/render.py" "$team/$sprint" --check >/dev/null || {
  python3 "$repo/scripts/render.py" "$team/$sprint" --check >&2; exit 1; }

lines=$(python3 "$repo/scripts/render.py" --ready "$team/$sprint")
started=0
while IFS=$'\t' read -r state name a b; do
  case $state in
    READY)
      if $dry; then echo "would start  $name (from ${b:0:12})"; continue; fi
      if out=$("$repo/scripts/agent.sh" "$team" "$sprint" "$name" "$a" "$b" 2>&1 </dev/null); then
        echo "$out"; started=$((started + 1))
      else
        echo "not started  $name: $out" >&2
        [[ $out == *"already open"*"6"* || $out == 6* ]] && break
      fi ;;
    WAIT) echo "waiting      $name: $a" ;;
    SKIP) echo "skipped      $name: $a" ;;
  esac
done <<<"$lines"
$dry || echo "started $started"
