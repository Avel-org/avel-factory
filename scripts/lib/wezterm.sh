# Shared helpers for the WezTerm session scripts. Source, don't run.

# Sessions in the "avel" workspace, one per line: <pane_id><TAB><name>
# A tab with one pane is named by its tab title (INT, dispatch tabs such as
# "SOAP m2-build a1"). In a team tab (LEADS, BACKEND, FRONTEND, REVIEW) each
# pane is named by its pane title, which Claude Code sets to its session name
# ("✳ AXIS" gives AXIS). The INT tab has two panes: the dashboard on top
# (scripts/dashboard.py titles its pane DASHBOARD) and the operator's own
# Claude session below it, named INT.
avel_tabs() {
  wezterm.exe cli list --format json | python3 -c '
import json, re, sys
from collections import Counter
panes = [p for p in json.load(sys.stdin) if p["workspace"] == "avel"]
per_tab = Counter(p["tab_id"] for p in panes)
for p in panes:
    if p["tab_title"] == "INT":   # the dashboard over the operator session
        name = "DASHBOARD" if p["title"].strip() == "DASHBOARD" else "INT"
    elif per_tab[p["tab_id"]] == 1 and p["tab_title"]:
        name = p["tab_title"]
    else:
        name = re.sub(r"^[^A-Za-z0-9]+", "", p["title"]).strip()
    if name:
        print(p["pane_id"], name, sep="\t")'
}

# Pane ID of the session whose name is exactly $1, or a unique case-insensitive prefix of one.
avel_pane_for() {
  local want=$1 exact prefix
  exact=$(avel_tabs | awk -F'\t' -v t="$want" '$2 == t { print $1 }')
  if [[ -n $exact ]]; then echo "$exact"; return; fi
  prefix=$(avel_tabs | awk -F'\t' -v t="$want" 'index(tolower($2), tolower(t)) == 1 { print $1 }')
  case $(printf '%s' "$prefix" | grep -c .) in
    1) echo "$prefix" ;;
    0) echo "no tab named '$want' in the avel workspace" >&2; return 1 ;;
    *) echo "'$want' matches more than one tab; use the full title" >&2; return 1 ;;
  esac
}
