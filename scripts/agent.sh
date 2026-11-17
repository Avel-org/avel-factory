#!/usr/bin/env bash
# Open one dispatch: a fresh worktree, the agent's identity, its task doc as the first message.
# One session is one attempt (Build rules D1, D4). Nothing is pasted, and nothing is resumed.
#
#   scripts/agent.sh <lane> <sprint> <task doc> [attempt]          open it in a new WezTerm tab
#   scripts/agent.sh --here <lane> <sprint> <task doc> [attempt]   run it in this terminal (the lane loop)
#   scripts/agent.sh --here --headless <lane> <sprint> <doc> [n]   run it with no one watching (claude -p)
#   scripts/agent.sh --docs <agent>                                what can be opened by hand (the picker)
#
#   The attempt is always the next one; naming it confirms a retry. It refuses: a task doc that isn't
#   committed or isn't what the plan renders, a dispatch that isn't ready (a stopped or done one only as a
#   named retry, the lead's call), a seat already busy
#   (one builder and one checker per lane, 4 at most, B7), and anything while .git/avel/paused exists (J4).
#   Worktrees: ../<repo>-wt/<lane>-<sprint>-<ticket>-<role>-a<n>, removed when the session ends unless it
#   left uncommitted work (AVEL_KEEP_WORKTREE=1 keeps it). Branch per ticket: t/<id>-<slug>.
set -euo pipefail

die() { echo "agent.sh: $*" >&2; exit 1; }

root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$root"
render() { python3 scripts/render.py "$@"; }
state=$(git rev-parse --git-common-dir); [[ $state = /* ]] || state="$root/$state"; state="$state/avel"
mkdir -p "$state/running" "$state/reports" "$state/logs"

here=0 headless=0
while [[ ${1:-} == --* ]]; do
  case $1 in
    --here) here=1 ;;
    --headless) headless=1 ;;
    --docs) render --docs "${2:?--docs <agent>}"; exit 0 ;;
    -h|--help) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option $1" ;;
  esac
  shift
done
[[ $# -ge 3 ]] || die "usage: scripts/agent.sh [--here] [--headless] <lane> <sprint> <task doc> [attempt]"
lane=$1 sprint=$2 doc=${3%.md} want=${4:-}

eval "$(render --info "$lane/$sprint" "$doc")"
title="$(echo "$AGENT" | tr a-z A-Z) $TICKET-$KIND"

# Not --here: open a new tab that runs --here, and return.
if (( ! here )); then
  # wezterm cli spawn starts a fresh login shell, so the AVEL_* settings are passed on explicitly.
  envs=""
  while IFS='=' read -r k v; do envs+=" $k=$(printf %q "$v")"; done < <(env | grep -E '^AVEL_[A-Z0-9_]*=' | grep -v '^AVEL_SEAT=' || true)
  # The tab closes when the session ends. If agent.sh refuses to start, the reason stays up for a minute.
  cmd="cd $(printf %q "$root") && ${envs:+env$envs }scripts/agent.sh --here $lane $sprint $doc $want || { echo; echo 'This tab closes in 60 seconds.'; sleep 60; }"
  domain=${AVEL_WSL_DOMAIN:-WSL:Ubuntu}
  for wt in wezterm.exe wezterm; do
    if command -v "$wt" >/dev/null 2>&1; then
      args=(cli spawn)
      [[ $wt == wezterm.exe ]] && args+=(--domain-name "$domain")
      if pane=$("$wt" "${args[@]}" -- bash -lc "$cmd" 2>/dev/null); then
        "$wt" cli set-tab-title --pane-id "$pane" "$title" >/dev/null 2>&1 || true
        echo "opened $title in a new tab"
        exit 0
      fi
    fi
  done
  echo "No WezTerm to open a tab in. Run it yourself:"
  echo "  scripts/agent.sh --here $lane $sprint $doc $want"
  exit 0
fi

[[ -e $state/paused ]] && die "the build is paused ($(cat "$state/paused" 2>/dev/null || true)). Remove .git/avel/paused to resume (J4)."
problems=$(render --verify "$lane/$sprint" 2>&1) || die "$problems"

# One start at a time: the readiness, slot and attempt checks and the marker happen under one lock.
exec 9>"$state/start.lock"
flock 9
read -r st n < <(render --state "$lane/$sprint" "$doc")
case $st in
  ready) ;;
  stopped) [[ -n $want ]] || die "$doc stopped on an earlier attempt. A retry is the lead's call: scripts/agent.sh $lane $sprint $doc $n" ;;
  done) [[ -n $want ]] || die "$doc is done (a$((n - 1))). Another attempt after a review is the lead's call: scripts/agent.sh $lane $sprint $doc $n" ;;
  *) die "$doc is $st, not ready. scripts/render.py --status $lane/$sprint says why." ;;
esac
[[ -z $want || $want == "$n" ]] || die "the next attempt of $doc is a$n, not a$want"
slot=$(render --slots "$lane" "$SEAT" 2>&1) || die "$slot"

base_dir="$(dirname "$root")/$(basename "$root")-wt"
tl=$(echo "$TICKET" | tr A-Z a-z)
wt="$base_dir/$lane-$sprint-$tl-$ROLE-a$n"
[[ -e $wt ]] && die "$wt already exists"
mkdir -p "$base_dir"
git rev-parse --verify -q main >/dev/null || die "there's no main branch yet"

# A branch can be checked out in one worktree at a time: free it from a finished attempt's worktree.
free_branch() {
  local other
  other=$(git worktree list --porcelain | awk -v b="refs/heads/$BRANCH" '/^worktree /{w=$2} $0=="branch "b{print w}')
  [[ -z $other ]] && return 0
  [[ $other == "$root" ]] && die "$BRANCH is checked out in the main checkout: switch it back to main"
  if [[ -n $(git -C "$other" status --porcelain) ]]; then
    die "$BRANCH is checked out in $other, which has uncommitted work. Commit or remove it first."
  fi
  git worktree remove "$other"
}

case $KIND in
  tests)
    git rev-parse --verify -q "$BRANCH" >/dev/null || git branch "$BRANCH" main
    free_branch
    git worktree add -q "$wt" "$BRANCH" ;;
  build)
    git rev-parse --verify -q "$BRANCH" >/dev/null || die "$BRANCH doesn't exist: the tests come first"
    free_branch
    git worktree add -q "$wt" "$BRANCH" ;;
  review)
    git rev-parse --verify -q "$BRANCH" >/dev/null || die "$BRANCH doesn't exist"
    git worktree add -q --detach "$wt" "$BRANCH" ;;
esac
base=$(git merge-base main "$BRANCH")
render --record "$lane/$sprint" "$doc" "$n" "$wt" "$base" "$( (( headless )) && echo headless || echo interactive)"
marker="$state/running/$lane-$sprint-$doc.a$n"
printf '{"pid": %d, "lane": "%s", "sprint": "%s", "doc": "%s", "attempt": %d, "seat": "%s"}\n' \
  $$ "$lane" "$sprint" "$doc" "$n" "$SEAT" >"$marker"
flock -u 9

# When the session ends: drop the marker, keep a copy of the report (a reviewer's stays uncommitted),
# then remove the worktree if nothing would be lost. The branch stays; the next attempt makes a fresh one.
cleanup() {
  cd "$root" || return 0
  local left
  left=$(git -C "$wt" status --porcelain 2>/dev/null) || return 0
  if [[ $KIND == review ]]; then
    # A reviewer's report and findings are uncommitted by design, and were copied to $state/reports above.
    left=$(grep -v -F -e "$REPORT" -e "${FINDINGS%/}/" <<<"$left" || true)
  fi
  if [[ -n $left ]]; then
    echo "kept $wt: it has uncommitted work"
    return 0
  fi
  git worktree remove --force "$wt" && echo "removed $wt"
}
finish() {
  rm -f "$marker"
  if [[ -f $wt/$REPORT ]]; then
    cp "$wt/$REPORT" "$state/reports/$lane-$sprint-$doc.a$n.md"
    echo "report: $(grep -m1 -i '^status:' "$wt/$REPORT" || echo 'no status line')"
  else
    echo "no report at $REPORT: the lead decides what's next"
  fi
  if [[ -d $wt/$FINDINGS ]]; then
    mkdir -p "$state/reports/$lane-$sprint-$doc.a$n-findings"
    cp -r "$wt/$FINDINGS/." "$state/reports/$lane-$sprint-$doc.a$n-findings/"
  fi
  [[ ${AVEL_KEEP_WORKTREE:-} == 1 ]] || cleanup
}
trap finish EXIT

limits=$(python3 -c 'import json;l=json.load(open("scripts/agents/limits.json"))["agent_session"];print(l["turns"],l["minutes"])')
read -r turns minutes <<<"$limits"
name="$title a$n"
export AVEL_SEAT="$name"
# The turn limit for an interactive session (CR-37): scripts/hooks/turns.py reads these.
export AVEL_TURN_LIMIT="$turns" AVEL_REPORT="$wt/$REPORT"

# The session's identity and settings come from main, not from the ticket branch, which may predate a
# kit change (scripts/agents/kit.py). --agents outranks the branch's .claude/agents; --settings adds
# main's allowlist and hooks to the branch's (the project source stays on, or CLAUDE.md isn't loaded).
kit="$state/kit/$lane-$sprint-$doc.a$n"
python3 scripts/agents/kit.py "$AGENT" "$kit" || die "can't build the session's kit from main"
kitargs=(--agents "$(cat "$kit/agents.json")" --settings "$kit/settings.json")

cd "$wt"
if [[ -f package.json ]]; then
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || echo "warning: pnpm install failed in $wt; the session's first test run will show why"
fi
echo "$name: $DOC_PATH on $( [[ $CHECKOUT == detached ]] && echo "a detached checkout of $BRANCH" || echo "$BRANCH" ), model $MODEL, at most $minutes minutes"
if (( headless )); then
  log="$state/logs/$lane-$sprint-$doc.a$n.log"
  timeout "${minutes}m" claude -p "${kitargs[@]}" --agent "$AGENT" --model "$MODEL" --max-turns "$turns" "$ACTIVATION" >"$log" 2>&1 \
    || echo "the session ended with an error or hit its limit: $log"
else
  # A finished session ends itself: the Stop hook (scripts/hooks/session.py) raises the flag once the
  # report is final, and 15 seconds later, if no new turn has lowered it, the session is closed.
  export AVEL_DONE_FLAG="$state/logs/$lane-$sprint-$doc.a$n.done" AVEL_KIND="$KIND"
  rm -f "$AVEL_DONE_FLAG"
  (
    while sleep 5; do
      kill -0 $$ 2>/dev/null || exit 0
      [[ -e $AVEL_DONE_FLAG ]] || continue
      sleep 15
      [[ -e $AVEL_DONE_FLAG ]] || continue
      echo; echo "$name: the report is in; closing the session."
      pkill -TERM -P $$ -x timeout
      exit 0
    done
  ) &
  watcher=$!
  printf '\033]0;%s\007' "$name"
  timeout --foreground "${minutes}m" claude "${kitargs[@]}" --agent "$AGENT" --model "$MODEL" -n "$name" "/dispatch $lane/$sprint/$doc" \
    || echo "the session ended (or hit its $minutes-minute limit)"
  kill "$watcher" 2>/dev/null || true
  rm -f "$AVEL_DONE_FLAG"
fi
