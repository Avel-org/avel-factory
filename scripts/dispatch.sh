#!/usr/bin/env bash
# Start a sprint's ready dispatches (Build rules M3), or show where every dispatch stands.
# With the seat panes open, the lane loops already start work: use this for --status, or when
# nobody is watching (--term headless).
#
#   scripts/dispatch.sh backend/sprint-01 --status        done, running, ready, waiting, stopped
#   scripts/dispatch.sh backend/sprint-01 --dry-run       what would start
#   scripts/dispatch.sh backend/sprint-01                 start what's ready, each in a new WezTerm tab
#   scripts/dispatch.sh backend/sprint-01 --term headless run them with no one watching (claude -p, logged)
#   scripts/dispatch.sh backend/sprint-01 --only agent-soap-t-b3-build
#   options: --max N (default 2) · --only <task doc> · --term wezterm|headless|print · --status · --dry-run
#
#   Run it again whenever something lands. Each start goes through scripts/agent.sh, which enforces
#   the session limits (B7), so a busy seat is skipped with its reason.
set -euo pipefail

die() { echo "dispatch.sh: $*" >&2; exit 1; }
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$root"

[[ $# -ge 1 && $1 != -* ]] || { sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
target=$1; shift
max=2 only= term=wezterm status=0 dry=0
while [[ $# -gt 0 ]]; do
  case $1 in
    --max) max=${2:?}; shift ;;
    --only) only=${2%.md}; shift ;;
    --term) term=${2:?}; shift ;;
    --status) status=1 ;;
    --dry-run) dry=1 ;;
    *) die "unknown option $1" ;;
  esac
  shift
done

if (( status )); then exec python3 scripts/render.py --status "$target"; fi
problems=$(python3 scripts/render.py --verify "$target" 2>&1) || die "$problems"

started=0
while IFS=$'\t' read -r lane sprint doc n; do
  [[ -z $doc ]] && continue
  [[ -n $only && $doc != "$only" ]] && continue
  (( started >= max )) && { echo "skipped $doc: --max $max reached"; continue; }
  if (( dry )); then
    echo "would start $doc a$n"
  else
    case $term in
      wezterm) scripts/agent.sh "$lane" "$sprint" "$doc" "$n" || continue ;;
      headless)
        log="$(git rev-parse --git-common-dir)/avel/logs/$lane-$sprint-$doc.a$n.out"
        mkdir -p "$(dirname "$log")"
        nohup scripts/agent.sh --here --headless "$lane" "$sprint" "$doc" "$n" >"$log" 2>&1 &
        sleep 2
        if ! kill -0 $! 2>/dev/null; then echo "$doc didn't start: $(tail -1 "$log")"; continue; fi
        echo "started $doc a$n headless (log: $log)" ;;
      print) echo "scripts/agent.sh --here $lane $sprint $doc $n" ;;
      *) die "--term is wezterm, headless or print" ;;
    esac
  fi
  started=$(( started + 1 ))
done < <(python3 scripts/render.py --ready "$target")

(( started )) || echo "nothing is ready. scripts/dispatch.sh $target --status says why."
