#!/usr/bin/env bash
# Open one dispatch: a fresh worktree, the agent's identity, its task doc as the first message.
# One session is one attempt (Build rules D1, D4). Nothing is pasted. A session that crashed or was cut
# off with no report is resumed as the same attempt (CR-46 B2); a new attempt follows a lead's review.
#
#   scripts/agent.sh <lane> <sprint> <task doc> [attempt]          open it in a new WezTerm tab
#   scripts/agent.sh --here <lane> <sprint> <task doc> [attempt]   run it in this terminal (the lane loop)
#   scripts/agent.sh --here --headless <lane> <sprint> <doc> [n]   run it with no one watching (claude -p)
#   scripts/agent.sh --docs <agent>                                what can be opened by hand (the picker)
#   scripts/agent.sh --here --resume <lane> <sprint> <doc>        resume a crashed attempt in its worktree
#   scripts/agent.sh --here --auto-resume <lane> <sprint> <doc>   the lane loop's one resume, only if the
#                                                                  attempt changed its worktree and wasn't resumed
#   scripts/agent.sh --prune                                       remove the worktrees of merged tickets
#
#   The attempt is always the next one; naming it confirms a retry. It refuses: a task doc that isn't
#   committed or isn't what the plan renders, a dispatch that isn't ready (a stopped or done one only as a
#   named retry, the lead's call), a seat already busy
#   (one builder and one checker per lane, 4 at most, B7), and anything while .git/avel/paused exists (J4).
#   Worktrees: ../<repo>-wt/<lane>-<sprint>-<ticket>-<role>-a<n>, kept when the session ends, so a crashed
#   session can still be found and resumed. --prune removes them once their ticket is merged and nothing in
#   them is uncommitted. Branch per ticket: t/<id>-<slug>.
set -euo pipefail

die() { echo "agent.sh: $*" >&2; exit 1; }

root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$root"
render() { python3 scripts/render.py "$@"; }
state=$(git rev-parse --git-common-dir); [[ $state = /* ]] || state="$root/$state"; state="$state/avel"
mkdir -p "$state/running" "$state/reports" "$state/logs"

# --prune: remove the kit's worktrees whose ticket is merged (render.py --merged) and that hold no
# uncommitted work. The attempt's own completion report and findings don't count: a review's are
# uncommitted by design, and both were copied to $state/reports when the session ended. A running
# session's worktree is never removed.
prune_worktrees() {
  local base_dir wt name lane sprint tl role n tid left removed=0 kept=0
  base_dir="$(dirname "$root")/$(basename "$root")-wt"
  while read -r wt; do
    name=$(basename "$wt")
    [[ $wt == "$base_dir/$name" && $name =~ ^([a-z]+)-(sprint-[0-9]+)-(t-[a-z][0-9]+)-([a-z0-9-]+)-a([0-9]+)$ ]] || continue
    lane=${BASH_REMATCH[1]} sprint=${BASH_REMATCH[2]} tl=${BASH_REMATCH[3]} role=${BASH_REMATCH[4]} n=${BASH_REMATCH[5]}
    tid=$(echo "$tl" | tr a-z A-Z)
    if compgen -G "$state/running/$lane-$sprint-agent-*-$tl-$role.a$n" >/dev/null; then
      echo "kept $wt: its session is running"; kept=$((kept + 1)); continue
    fi
    if ! render --merged "$tid" >/dev/null; then
      echo "kept $wt: $tid isn't merged"; kept=$((kept + 1)); continue
    fi
    left=$(git -C "$wt" status --porcelain 2>/dev/null) || { echo "kept $wt: git status fails there"; kept=$((kept + 1)); continue; }
    left=$(grep -v -E "^.. docs/agent-dispatch/$lane/$sprint/(agent-[a-z0-9]+-$tl-$role-completion\.md|findings/)" <<<"$left" || true)
    if [[ -n $left ]]; then
      echo "kept $wt: $tid is merged, but it has uncommitted work:"; sed 's/^/    /' <<<"$left" | head -5
      kept=$((kept + 1)); continue
    fi
    [[ -x $wt/scripts/pg-local.sh ]] && "$wt/scripts/pg-local.sh" stop >/dev/null 2>&1 || true
    if git worktree remove --force "$wt"; then
      echo "removed $wt: $tid is merged and nothing in it is uncommitted"; removed=$((removed + 1))
    fi
  done < <(git worktree list --porcelain | sed -n 's/^worktree //p')
  "$root/scripts/pg-local.sh" prune >/dev/null 2>&1 || true
  echo "pruned $removed worktree(s), kept $kept"
}

here=0 headless=0 resume=0 auto=0
while [[ ${1:-} == --* ]]; do
  case $1 in
    --here) here=1 ;;
    --headless) headless=1 ;;
    --resume) resume=1 ;;
    --auto-resume) resume=1 auto=1 ;;
    --docs) render --docs "${2:?--docs <agent>}"; exit 0 ;;
    --prune) prune_worktrees; exit 0 ;;
    -h|--help) sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option $1" ;;
  esac
  shift
done
[[ $# -ge 3 ]] || die "usage: scripts/agent.sh [--here] [--headless] [--resume] <lane> <sprint> <task doc> [attempt]"
lane=$1 sprint=$2 doc=${3%.md} want=${4:-}

eval "$(render --info "$lane/$sprint" "$doc")"
title="$(echo "$AGENT" | tr a-z A-Z) $TICKET-$KIND"

# Not --here: open a new tab that runs --here inside a tmux session, and return. Closing the tab only
# detaches the session: tmux ls lists them, tmux attach -t <name> reattaches. No tmux: the tab runs --here
# itself, as before. No WezTerm: the tmux session starts detached.
if (( ! here )); then
  # tmux and wezterm cli spawn both start a fresh environment, so the AVEL_* settings are passed on explicitly.
  envs=""
  while IFS='=' read -r k v; do envs+=" $k=$(printf %q "$v")"; done < <(env | grep -E '^AVEL_[A-Z0-9_]*=' | grep -v '^AVEL_SEAT=' || true)
  # The tab closes when the session ends. If agent.sh refuses to start, the reason stays up for a minute.
  # A plain if, not a $( && || ) that ends non-zero under set -e: that exited silently (Nov 21).
  flag=""
  if (( auto )); then flag=--auto-resume; elif (( resume )); then flag=--resume; fi
  # tmux and wezterm cli spawn start a login shell that doesn't load nvm, so node (which pnpm and the hooks
  # need) was missing in hand-started sessions: T-F23 build a2's done check failed on it (Nov 21). Load it first,
  # as tools/wezterm/avel.lua does for the seats.
  cmd="[ -s \"\$HOME/.nvm/nvm.sh\" ] && . \"\$HOME/.nvm/nvm.sh\"; cd $(printf %q "$root") && ${envs:+env$envs }scripts/agent.sh --here ${flag:+$flag }$lane $sprint $doc $want || { echo; echo 'This tab closes in 60 seconds.'; sleep 60; }"
  session="" tabcmd=$cmd
  if command -v tmux >/dev/null 2>&1; then
    session=$(echo "avel-$AGENT-$TICKET-$KIND" | tr A-Z a-z)
    tmux has-session -t "=$session" 2>/dev/null && die "tmux session $session is already running: tmux attach -t $session"
    # Started from inside the tab, so the hooks see that tab's pane id (tmux keeps its first client's).
    tabcmd="exec tmux new-session -A -s $session -e \"WEZTERM_PANE=\$WEZTERM_PANE\" $(printf %q "bash -lc $(printf %q "$cmd")")"
  fi
  domain=${AVEL_WSL_DOMAIN:-WSL:Ubuntu}
  for wt in wezterm.exe wezterm; do
    if command -v "$wt" >/dev/null 2>&1; then
      args=(cli spawn)
      [[ $wt == wezterm.exe ]] && args+=(--domain-name "$domain")
      if pane=$("$wt" "${args[@]}" -- bash -lc "$tabcmd" 2>/dev/null); then
        "$wt" cli set-tab-title --pane-id "$pane" "$title" >/dev/null 2>&1 || true
        echo "opened $title in a new tab${session:+ (tmux session $session)}"
        exit 0
      fi
    fi
  done
  if [[ -n $session ]]; then
    tmux new-session -d -s "$session" "bash -lc $(printf %q "$cmd")" || die "tmux couldn't start $session"
    echo "No WezTerm to open a tab in, so $title started in tmux session $session. Attach with:"
    echo "  tmux attach -t $session"
  else
    echo "No WezTerm to open a tab in. Run it yourself:"
    echo "  scripts/agent.sh --here $lane $sprint $doc $want"
  fi
  exit 0
fi

[[ -e $state/paused ]] && die "the build is paused ($(cat "$state/paused" 2>/dev/null || true)). Remove .git/avel/paused to resume (J4)."
problems=$(render --verify "$lane/$sprint" 2>&1) || die "$problems"

# One start at a time: the readiness, slot and attempt checks and the marker happen under one lock.
exec 9>"$state/start.lock"
flock 9
start_file() { echo "$state/logs/$lane-$sprint-$doc.a$1.start"; }
if (( resume )); then
  # CR-46 B2: the same attempt, in the same worktree. Only a stopped dispatch whose attempt left no report.
  read -r st _ < <(render --state "$lane/$sprint" "$doc")
  [[ $st == stopped || ( $st == needs-javaris && $auto == 0 ) ]] ||
    { (( auto )) && exit 0; die "$doc is $st: only a stopped attempt with no report is resumed"; }
  eval "$(render --last "$lane/$sprint" "$doc")" || die "$doc has no attempt to resume"
  n=$LAST_ATTEMPT wt=$LAST_WORKTREE base=$LAST_BASE
  [[ $HAS_REPORT == 0 ]] || { (( auto )) && exit 0; die "a$n of $doc left a report: a new attempt is the lead's call (scripts/agent.sh $lane $sprint $doc $((n + 1)))"; }
  [[ -d $wt ]] || { (( auto )) && exit 0; die "a$n's worktree $wt is gone, so it can't be resumed: a new attempt is the lead's call"; }
  if (( auto )); then
    # The lane loop resumes once, and only an attempt that got somewhere: commits or changes since it started.
    (( RESUMES == 0 )) || { echo "$doc a$n was resumed once already: the lead decides (K2, L3)"; exit 0; }
    start_head=$(sed -n 2p "$(start_file "$n")" 2>/dev/null || true)
    if [[ -z $(git -C "$wt" status --porcelain 2>/dev/null) && ( -z $start_head || $(git -C "$wt" rev-parse HEAD) == "$start_head" ) ]]; then
      echo "$doc a$n left nothing in its worktree to resume from: the lead decides"; exit 0
    fi
  fi
  slot=$(render --slots "$lane" "$SEAT" "$WEIGHT" 2>&1) || die "$slot"
  if [[ $CHECKOUT != detached ]] && ! git -C "$wt" symbolic-ref -q HEAD >/dev/null; then
    # A finished session left the worktree detached (A3); take the branch back, at the attempt's own commit.
    [[ $(git -C "$wt" rev-parse HEAD) == $(git rev-parse "$BRANCH") ]] ||
      die "$BRANCH has moved on since a$n stopped (to $(git rev-parse --short "$BRANCH")): a new attempt is the lead's call"
    git -C "$wt" checkout -q "$BRANCH" 2>/dev/null ||
      die "$BRANCH is checked out somewhere else: free it, then resume"
  fi
  mode=resumed
else
  read -r st n < <(render --state "$lane/$sprint" "$doc")
  case $st in
    ready) ;;
    stopped) [[ -n $want ]] || die "$doc stopped on an earlier attempt. A retry is the lead's call: scripts/agent.sh $lane $sprint $doc $n" ;;
    done) [[ -n $want ]] || die "$doc is done (a$((n - 1))). Another attempt after a review is the lead's call: scripts/agent.sh $lane $sprint $doc $n" ;;
      needs-javaris) [[ -n $want ]] || die "$doc failed twice (K2, L3, CR-46 B6): Javaris decides. Only a named attempt starts it: scripts/agent.sh $lane $sprint $doc $n" ;;
    *) die "$doc is $st, not ready. scripts/render.py --status $lane/$sprint says why." ;;
  esac
  [[ -z $want || $want == "$n" ]] || die "the next attempt of $doc is a$n, not a$want"
  slot=$(render --slots "$lane" "$SEAT" "$WEIGHT" 2>&1) || die "$slot"

  base_dir="$(dirname "$root")/$(basename "$root")-wt"
  tl=$(echo "$TICKET" | tr A-Z a-z)
  wt="$base_dir/$lane-$sprint-$tl-$ROLE-a$n"
  [[ -e $wt ]] && die "$wt already exists"
  mkdir -p "$base_dir"
  git rev-parse --verify -q main >/dev/null || die "there's no main branch yet"

  # A branch can be checked out in one worktree at a time: free it from a finished attempt's worktree.
  # Only a worktree the kit made for this ticket is removed. Any other (a lead's, Javaris's) is left
  # alone: on Nov 17 the lane loop removed the worktree Zero was locking T-F9 from.
  free_branch() {
    local other
    other=$(git worktree list --porcelain | awk -v b="refs/heads/$BRANCH" '/^worktree /{w=$2} $0=="branch "b{print w}')
    [[ -z $other ]] && return 0
    [[ $other == "$root" ]] && die "$BRANCH is checked out in the main checkout: switch it back to main"
    if [[ ! $other =~ ^"$base_dir/$lane-$sprint-$tl-"[a-z0-9-]+-a[0-9]+$ ]]; then
      die "$BRANCH is checked out in $other, which the kit didn't make. Whoever is using it checks out another branch or detaches it, then retry."
    fi
    if [[ -n $(git -C "$other" status --porcelain) ]]; then
      die "$BRANCH is checked out in $other, which has uncommitted work. Commit or remove it first."
    fi
    git worktree remove "$other"
  }

  # The session reads its task doc from the branch, so the branch must hold main's copy of it: a branch
  # cut before a re-plan would hand the agent the old ticket (T-F5 tests a2, Nov 17). The lead merges main in.
  if git rev-parse --verify -q "$BRANCH" >/dev/null &&
     [[ $(git rev-parse -q --verify "$BRANCH:$DOC_PATH" 2>/dev/null) != $(git rev-parse "main:$DOC_PATH") ]]; then
    die "$BRANCH has a different $DOC_PATH from main's (the ticket was re-rendered after the branch was cut). The lead merges main into $BRANCH first."
  fi

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
  # Clear Postgres containers left by attempts whose worktree is gone (a crash skips their stop).
  "$root/scripts/pg-local.sh" prune >/dev/null 2>&1 || true
  base=$(git merge-base main "$BRANCH")
  mode=$( (( headless )) && echo headless || echo interactive)
fi
render --record "$lane/$sprint" "$doc" "$n" "$wt" "$base" "$mode"
marker="$state/running/$lane-$sprint-$doc.a$n"
printf '{"pid": %d, "lane": "%s", "sprint": "%s", "doc": "%s", "attempt": %d, "seat": "%s", "weight": %d}\n' \
  $$ "$lane" "$sprint" "$doc" "$n" "$SEAT" "$WEIGHT" >"$marker"
flock -u 9

# A report already in the worktree (an earlier attempt's, on the branch or carried over by a rebuild)
# isn't this attempt's. Its hash is taken now, so the done flag (scripts/hooks/session.py) and the
# copy kept when the session ends both ignore it while it's unchanged.
# Kept with the worktree's head in <state>/logs, so a resume (B2) compares against the first start's report.
if (( resume )) && [[ -f $(start_file "$n") ]]; then
  REPORT_START=$(sed -n 1p "$(start_file "$n")")
else
  REPORT_START=$( [[ -f $wt/$REPORT ]] && sha256sum "$wt/$REPORT" | cut -d' ' -f1 || true )
  printf '%s\n%s\n' "$REPORT_START" "$(git -C "$wt" rev-parse HEAD)" >"$(start_file "$n")"
fi

# When the session ends: drop the marker and keep a copy of this attempt's report (a reviewer's stays
# uncommitted). The worktree stays, so a crashed or cut-off session can be found again; --prune removes it
# once the ticket is merged. The branch stays too; the next attempt makes a fresh worktree.
# CR-50 decision 3: a finished review is posted to its ticket's PR, so the verdict doesn't live only in
# .git/avel on this machine. Only where origin is GitHub and the PR is open; never when the text looks like
# it holds a secret (then it's logged and left for OSA).
post_review() {
  git -C "$root" remote get-url origin 2>/dev/null | grep -q 'github.com' || return 0
  command -v gh >/dev/null 2>&1 || return 0
  local pr body
  pr=$(timeout 30 gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number' 2>/dev/null) || return 0
  [[ -n $pr ]] || return 0
  body=$(mktemp)
  {
    echo "**${AGENT^}'s review of $TICKET (review a$n), posted by the kit (CR-50 decision 3).**"
    echo
    echo "Reviewed head: $(git -C "$wt" rev-parse HEAD)"
    echo
    echo "<details><summary>Review report</summary>"; echo; cat "$wt/$REPORT"; echo; echo "</details>"
    for f in "$wt/$FINDINGS"/"$(echo "$TICKET" | tr A-Z a-z)"-*.md; do
      [[ -f $f ]] || continue
      echo; echo "<details><summary>$(basename "$f")</summary>"; echo; cat "$f"; echo; echo "</details>"
    done
  } >"$body"
  if grep -q -i -E 'sk-ant|ghp_|github_pat_|AKIA[0-9A-Z]{12}|BEGIN (RSA|OPENSSH|EC) PRIVATE|api[_-]?key *[:=] *[A-Za-z0-9]{16,}' "$body"; then
    echo "not posting the review to #$pr: its text looks like it holds a secret (OSA checks it)"
  else
    timeout 30 gh pr comment "$pr" --body-file "$body" >/dev/null 2>&1 && echo "review posted to #$pr"
  fi
  rm -f "$body"
}

finish() {
  rm -f "$marker"
  if [[ -f $wt/$REPORT && $(sha256sum "$wt/$REPORT" | cut -d' ' -f1) != "$REPORT_START" ]]; then
    cp "$wt/$REPORT" "$state/reports/$lane-$sprint-$doc.a$n.md"
    echo "report: $(grep -m1 -i '^status:' "$wt/$REPORT" || echo 'no status line')"
    if [[ $KIND == review ]]; then
      # CR-50 decision 3: the commit the review read, which merge.py holds the PR's head to.
      git -C "$wt" rev-parse HEAD >"$state/reports/$lane-$sprint-$doc.a$n.head" 2>/dev/null || true
      post_review || true
    fi
  elif [[ -f $wt/$REPORT ]]; then
    # Nov 17: a2 of T-B3's build was killed by a crash, and a1's report on the branch was kept as a2's.
    echo "no report from a$n: $REPORT is an earlier attempt's, unchanged. The lead decides what's next"
  else
    echo "no report at $REPORT: the lead decides what's next"
  fi
  if [[ -d $wt/$FINDINGS ]]; then
    mkdir -p "$state/reports/$lane-$sprint-$doc.a$n-findings"
    cp -r "$wt/$FINDINGS/." "$state/reports/$lane-$sprint-$doc.a$n-findings/"
  fi
  # The worktree's Postgres is throwaway: stop it even when the worktree stays, or every
  # attempt leaves a container running (they took the machine out of memory on Nov 17).
  [[ -x $wt/scripts/pg-local.sh ]] && "$wt/scripts/pg-local.sh" stop >/dev/null 2>&1 || true
  # Free the branch for the lead (a lock line) and the next attempt; the worktree and its changes stay.
  [[ $CHECKOUT == detached ]] || git -C "$wt" checkout -q --detach 2>/dev/null || true
}
trap finish EXIT

limits=$(python3 -c 'import json;l=json.load(open("scripts/agents/limits.json"))["agent_session"];print(l["turns"],l["minutes"])')
read -r turns minutes <<<"$limits"
name="$title a$n"
export AVEL_SEAT="$name"
# The turn limit for an interactive session (CR-37): scripts/hooks/turns.py reads these.
export AVEL_TURN_LIMIT="$turns" AVEL_REPORT="$wt/$REPORT"
# The push guard (scripts/hooks/push_guard.py, CR-46 B3): only a build pushes, and only its own branch.
export AVEL_BRANCH="$BRANCH" AVEL_KIND="$KIND"

# The session's identity and settings come from main, not from the ticket branch, which may predate a
# kit change (scripts/agents/kit.py). --agents outranks the branch's .claude/agents; --settings adds
# main's allowlist and hooks to the branch's (the project source stays on, or CLAUDE.md isn't loaded).
kit="$state/kit/$lane-$sprint-$doc.a$n"
python3 scripts/agents/kit.py "$AGENT" "$kit" || die "can't build the session's kit from main"
kitargs=(--agents "$(cat "$kit/agents.json")" --settings "$kit/settings.json")

cd "$wt"
if [[ -f package.json ]]; then
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || echo "warning: pnpm install failed in $wt; the session's first test run will show why"
  # Workspace packages resolve to their dist/, so typecheck and test fail in a fresh worktree until a build.
  pnpm build >/dev/null 2>&1 || echo "warning: pnpm build failed in $wt"
fi
# A resume continues the attempt's own conversation in its worktree (claude --continue).
resume_args=() first="/dispatch $lane/$sprint/$doc" prompt=$ACTIVATION
if (( resume )); then
  resume_args=(--continue)
  first="You were interrupted. Check git log and git status in this worktree, then continue your task doc ($DOC_PATH) from where you stopped."
  prompt=$first
  echo "$name: resuming a$n in $wt"
fi
echo "$name: $DOC_PATH on $( [[ $CHECKOUT == detached ]] && echo "a detached checkout of $BRANCH" || echo "$BRANCH" ), model $MODEL, at most $minutes minutes"
if (( headless )); then
  log="$state/logs/$lane-$sprint-$doc.a$n.log"
  timeout "${minutes}m" claude -p "${kitargs[@]}" "${resume_args[@]}" --agent "$AGENT" --model "$MODEL" --max-turns "$turns" "$prompt" >"$log" 2>&1 \
    || echo "the session ended with an error or hit its limit: $log"
else
  # A finished session ends itself: the Stop hook (scripts/hooks/session.py) raises the flag once the
  # report is final, and 15 seconds later, if no new turn has lowered it, the session is closed. A build's
  # done check (done_check.py) holds the flag while its checks run, and lowers it if it blocks the stop.
  export AVEL_DONE_FLAG="$state/logs/$lane-$sprint-$doc.a$n.done"
  # The hook compares the report against the one the worktree held at the start (REPORT_START above).
  export AVEL_REPORT_START="$REPORT_START"
  rm -f "$AVEL_DONE_FLAG"
  (
    while sleep 5; do
      kill -0 $$ 2>/dev/null || exit 0
      [[ -e $AVEL_DONE_FLAG ]] || continue
      # The done check (scripts/hooks/done_check.py, CR-46 B5) may still be running its checks.
      # At most 15 minutes: a done check killed by its hook timeout would leave .checking behind (Nov 21 review).
      for _ in $(seq 180); do [[ -e $AVEL_DONE_FLAG.checking ]] || break; sleep 5; done
      sleep 15
      [[ -e $AVEL_DONE_FLAG && ! -e $AVEL_DONE_FLAG.checking ]] || continue
      echo; echo "$name: the report is in; closing the session."
      pkill -TERM -P $$ -x timeout
      exit 0
    done
  ) &
  watcher=$!
  printf '\033]0;%s\007' "$name"
  timeout --foreground "${minutes}m" claude "${kitargs[@]}" "${resume_args[@]}" --agent "$AGENT" --model "$MODEL" -n "$name" "$first" \
    || echo "the session ended (or hit its $minutes-minute limit)"
  kill "$watcher" 2>/dev/null || true
  rm -f "$AVEL_DONE_FLAG"
fi
