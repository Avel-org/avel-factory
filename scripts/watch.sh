#!/usr/bin/env bash
# Follow the factory's event log as it happens, shaped like the future
# `avel watch`: past events first, then new ones as they're written.
#
# Usage: scripts/watch.sh [-n N] [--kind K] [--actor A] [--since 30m] [--json]
#   scripts/watch.sh                         everything, last 20 first
#   scripts/watch.sh --kind session.waiting  only sessions that need you
#   scripts/watch.sh --actor SOAP --since 2h one agent, the last two hours
#   scripts/watch.sh --kind attempt --json   raw lines, to pipe into jq
# scripts/events.py tail takes the same filters and doesn't follow.
set -euo pipefail
exec python3 "$(dirname "$0")/events.py" watch "$@"
