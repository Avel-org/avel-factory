#!/usr/bin/env bash
# Type one message into a running session's tab, and log it.
#
# Usage: scripts/tell.sh <tab> "<message>"
#        scripts/tell.sh --list
#   scripts/tell.sh SOAP "Tests are locked at 3c91e07. Start the build."
#   <tab> is the full tab title, or a prefix that matches exactly one tab.
#
# For coordination only: start, stop, checkpoint, "tests locked", "report now".
# INT is the operator's own session (under the dashboard): the crew reports
# there with scripts/tell.sh INT "...".
# New instructions go in the task doc (fix the plan, re-render, new attempt).
set -euo pipefail

repo=$(git rev-parse --show-toplevel)
# shellcheck source=lib/wezterm.sh
source "$repo/scripts/lib/wezterm.sh"

if [[ ${1:-} == --list ]]; then
  avel_tabs | cut -f2
  exit 0
fi
[[ $# -eq 2 && -n $2 ]] || { sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

pane=$(avel_pane_for "$1")
to=$(avel_tabs | awk -F'\t' -v p="$pane" '$1 == p { print $2 }')
from=${AVEL_FROM:-operator}
[[ $to != "$from" ]] || { echo "that's your own tab" >&2; exit 1; }
[[ $to != DASHBOARD ]] || { echo "that's the dashboard: anything typed there is read as keys. Send to INT" >&2; exit 1; }

msg=$(printf '%s' "$2" | tr '\r\n' '  ')
wezterm.exe cli send-text --pane-id "$pane" --no-paste "[from $from] $msg"
sleep 0.3
wezterm.exe cli send-text --pane-id "$pane" --no-paste $'\r'

# The log sits in the main checkout, wherever the sender runs.
main=$(git -C "$repo" worktree list --porcelain | awk 'NR == 1 { print $2 }')
log="$main/docs/agent-dispatch/messages.md"
mkdir -p "$(dirname "$log")"
[[ -f $log ]] || printf '# Messages between sessions\n\nWritten by scripts/tell.sh. One line per message.\n\n' > "$log"
printf -- '- %s · %s → %s · %s\n' "$(date '+%Y-%m-%d %H:%M')" "$from" "$to" "$msg" >> "$log"
python3 "$main/scripts/events.py" emit message.sent --actor "$from" --subject "session:$to" "to=$to" "text=$msg" || true
echo "sent to '$to'"
