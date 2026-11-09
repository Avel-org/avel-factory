#!/usr/bin/env bash
# Check that the control room and its tools are set up, shaped like the future
# `avel doctor`: one line per check, ✓ ok, ! worth fixing, ✗ broken.
#
# Usage: scripts/doctor.sh          exit 1 if anything is ✗
#        scripts/doctor.sh --quiet  only the ! and ✗ lines
set -uo pipefail

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null) || { echo "✗ not inside the avel-factory repo"; exit 1; }
main=$(git -C "$repo" worktree list --porcelain | sed -n '1s/^worktree //p')
quiet=false; [[ ${1:-} == --quiet ]] && quiet=true
fails=0 warns=0
ok()   { $quiet || printf '\033[38;5;79m✓\033[0m %s\n' "$*"; }
warn() { warns=$((warns + 1)); printf '\033[38;5;221m!\033[0m %s\n' "$*"; }
bad()  { fails=$((fails + 1)); printf '\033[38;5;210m✗\033[0m %s\n' "$*"; }
section() { $quiet || printf '\n\033[1m%s\033[0m\n' "$*"; }

roster=(axis zero soap iyo atlas rigg ghost nemi fantem leon fenn brennan zane leah breach)

section "Tools"
if command -v wezterm.exe >/dev/null; then
  ok "wezterm $(wezterm.exe --version 2>/dev/null | awk '{print $2}')"
  if wezterm.exe cli list >/dev/null 2>&1; then ok "WezTerm mux answers (wezterm.exe cli list)"
  else bad "wezterm.exe cli list fails: start WezTerm, or this shell isn't inside it"; fi
else
  bad "wezterm.exe isn't on PATH (C:\\Program Files\\WezTerm)"
fi
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
if command -v node >/dev/null; then ok "node $(node --version)"; else bad "node not found: install it with nvm (hooks and pnpm need it)"; fi
if command -v claude >/dev/null; then ok "claude $(claude --version 2>/dev/null | awk '{print $1}')"
else bad "claude not found on PATH after loading nvm"; fi
py=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null)
if [[ -n $py ]] && python3 -c 'import sys; sys.exit(sys.version_info < (3, 13))'; then ok "python $py"
else bad "python3 ${py:-missing}: 3.13 or newer is needed (the lock check's ** globs)"; fi
command -v pnpm >/dev/null && ok "pnpm $(pnpm --version)" || warn "pnpm not found: the merge tab runs pnpm test (corepack enable)"

section "Repo"
untracked=$(git -C "$main" status --porcelain -- scripts .claude docs | grep -c '^??' || true)
if (( untracked )); then
  bad "scripts/, .claude/ or docs/ have untracked files ($untracked): worktrees are made from commits, so dispatches get no agent files, hooks or scripts until they're committed"
else ok "scripts, agent files and docs are committed (dispatch worktrees get them)"; fi
missing=()
for a in "${roster[@]}"; do [[ -f $main/.claude/agents/$a.md ]] || missing+=("$a"); done
if (( ${#missing[@]} )); then warn "no agent file for: ${missing[*]} (they run as plain sessions)"
else ok "all ${#roster[@]} agent files in .claude/agents/"; fi
if grep -q 'scripts/hooks/session.py' "$main/.claude/settings.json" 2>/dev/null; then ok "session hooks in .claude/settings.json"
else bad "session hooks missing from .claude/settings.json (NEEDS YOU, stalls, toasts and cost records need them)"; fi
hook="$(git -C "$main" rev-parse --path-format=absolute --git-common-dir)/hooks/pre-commit"
if grep -q 'check_locks.py' "$hook" 2>/dev/null; then ok "locked-test pre-commit hook installed"
else warn "locked-test pre-commit hook not installed: scripts/check_locks.py --install-hook"; fi
if [[ -s $main/.git/avel/hook-errors.log ]]; then
  warn "hook errors logged: $(tail -1 "$main/.git/avel/hook-errors.log") (.git/avel/hook-errors.log)"
fi

section "Worktrees and slots"
prunable=$(git -C "$main" worktree list --porcelain | grep -c '^prunable' || true)
(( prunable )) && warn "$prunable worktree(s) point at missing folders: git worktree prune" || ok "no stale worktrees"
merged=0
while read -r path branch; do
  [[ $path == "$main" || -z $branch ]] && continue
  if git -C "$main" merge-base --is-ancestor "$branch" main 2>/dev/null && \
     [[ $(git -C "$main" rev-list --count "main..$branch" 2>/dev/null) == 0 ]] && \
     [[ $(git -C "$main" rev-list --count "$(git -C "$main" merge-base main "$branch")..$branch") != 0 ]]; then
    merged=$((merged + 1))
  fi
done < <(git -C "$main" worktree list --porcelain | awk '/^worktree /{p=$2} /^branch /{sub("refs/heads/","",$2); print p, $2}')
(( merged )) && warn "$merged worktree(s) on branches already merged into main: remove them with git worktree remove" \
             || ok "no worktrees left on merged branches"
if command -v wezterm.exe >/dev/null && wezterm.exe cli list >/dev/null 2>&1; then
  # shellcheck source=lib/wezterm.sh
  source "$repo/scripts/lib/wezterm.sh"
  tabs=$(avel_tabs 2>/dev/null)
  if [[ -z $tabs ]]; then warn "the avel workspace isn't open: Ctrl+a then v"
  else
    grep -qx $'[0-9]*\tDASHBOARD' <<<"$tabs" && ok "INT dashboard is open" || warn "no dashboard in the INT tab: Ctrl+a then v opens it"
    grep -qx $'[0-9]*\tINT' <<<"$tabs" && ok "INT session is open (under the dashboard)" || warn "no INT session: Ctrl+a then v opens it"
    used=$(awk -F'\t' '$2 ~ / a[0-9]+$/' <<<"$tabs" | grep -c . || true)
    (( used < 3 )) && ok "dispatch slots: $used/3 in use" || warn "dispatch slots: $used/3, all in use"
  fi
fi

section "Records"
rec="$main/docs/agent-dispatch/records"
if mkdir -p "$rec" 2>/dev/null && [[ -w $rec ]]; then ok "records are writable ($rec)"; else bad "can't write $rec"; fi
if [[ -s $rec/events.jsonl ]]; then
  last=$(tail -1 "$rec/events.jsonl" | python3 -c 'import json,sys; e=json.loads(sys.stdin.read()); print(e["seq"], e["kind"], e["at"])' 2>/dev/null)
  ok "event log: $(wc -l < "$rec/events.jsonl") events, last: $last"
else
  warn "no events logged yet (they start with the next dispatch, message or hook)"
fi
n=$(ls "$rec/costs/"*.json 2>/dev/null | wc -l)
(( n )) && ok "$n session cost record(s) in records/costs" || warn "no cost records yet (written when a hooked session finishes a turn)"
[[ -f $repo/scripts/lib/prices.json ]] && ok "prices: scripts/lib/prices.json (checked $(python3 -c "import json;print(json.load(open('$repo/scripts/lib/prices.json'))['_checked'])"))" \
  || bad "scripts/lib/prices.json is missing: cost records can't be priced"

section "WezTerm config"
cfg=$(ls /mnt/c/Users/*/.wezterm.lua 2>/dev/null | head -1)
if [[ -z $cfg ]]; then warn "no .wezterm.lua found under C:\\Users"
else
  grep -q 'avel_attention' "$cfg" && ok "toasts and tab badges are in $cfg" || warn "$cfg has no avel_attention: no toasts or tab badges"
  grep -q 'avel_toggle_theme' "$cfg" && ok "Enclosure Grid theme toggle (Ctrl+a then e)" || warn "$cfg has no theme toggle"
  if ls /mnt/c/Windows/Fonts/IBMPlexMono-Regular.ttf /mnt/c/Users/*/AppData/Local/Microsoft/Windows/Fonts/IBMPlexMono-Regular.ttf >/dev/null 2>&1; then
    ok "IBM Plex Mono is installed (the Enclosure Grid theme uses it)"
  else
    warn "IBM Plex Mono isn't installed: the Enclosure Grid theme falls back to Cascadia Mono (fonts.google.com/specimen/IBM+Plex+Mono)"
  fi
fi

echo
if (( fails )); then printf '\033[38;5;210m%d broken\033[0m, %d to look at\n' "$fails" "$warns"; exit 1; fi
printf '\033[38;5;79mall good\033[0m%s\n' "$( (( warns )) && echo ", $warns to look at")"
