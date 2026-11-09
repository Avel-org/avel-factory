#!/usr/bin/env bash
# Merge one attempt branch into main the way procedures.md asks (rules 1, 5, 6):
#   1. git merge --no-ff --no-commit <branch>, in the main checkout, on main
#   2. pnpm build, typecheck, lint and test on the merged tree; if any fails,
#      git merge --abort, so main stays green and nothing is committed
#   3. the records (messages, events, session costs) go into the merge commit,
#      not into a commit of their own
#   4. every worktree of the module's attempts (builds, tests, reviews) is removed;
#      a worktree with uncommitted changes is kept and named, never forced.
#      The branches stay until the sprint closes.
# Merging stays the operator's call: run it only on Int's word, after the merge
# board shows the module READY.
#
# Usage: scripts/merge.sh <branch> [-m "<merge commit subject>"] [--no-clean]
#   scripts/merge.sh frontend/sprint-02/agent-leon-system-build-a1 -m "Merge system build a1: ..."
set -euo pipefail

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
main=$(git -C "$repo" worktree list --porcelain | sed -n '1s/^worktree //p')
branch=${1:-}
[[ -n $branch && $branch != -* ]] || { sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
shift
msg="" clean=true
while (( $# )); do
  case $1 in
    -m) msg=${2:?-m needs a subject}; shift 2 ;;
    --no-clean) clean=false; shift ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done
[[ -n $msg ]] || msg="Merge $branch"

cd "$main"
[[ $(git branch --show-current) == main ]] || { echo "the main checkout isn't on main" >&2; exit 1; }
git rev-parse -q --verify "refs/heads/$branch" >/dev/null || { echo "no branch $branch" >&2; exit 1; }
[[ ! -e .git/MERGE_HEAD ]] || { echo "a merge is already in progress: finish or abort it first" >&2; exit 1; }

records=(docs/agent-dispatch/messages.md docs/agent-dispatch/records)
other=$(git status --porcelain -- . "${records[@]/#/:!}" | grep -v '^??' || true)
[[ -z $other ]] || { echo "main has changes outside the records; commit or move them first:" >&2; echo "$other" >&2; exit 1; }

echo "== merging $branch"
if ! git merge --no-ff --no-commit "$branch"; then
  git merge --abort 2>/dev/null || true
  echo "merge conflict: aborted, main is unchanged" >&2; exit 1
fi

for step in build typecheck lint test; do
  echo "== pnpm $step"
  if ! pnpm -s "$step"; then
    git merge --abort
    echo "pnpm $step failed on the merged tree: merge aborted, main is unchanged" >&2
    python3 scripts/events.py emit merge.failed --actor INT --subject "branch:$branch" "step=$step" >/dev/null 2>&1 || true
    exit 1
  fi
done

git add -- "${records[@]}"
git commit -q -m "$msg"
sha=$(git rev-parse --short HEAD)
python3 scripts/events.py emit merge.done --actor INT --subject "branch:$branch" "commit=$sha" >/dev/null 2>&1 || true
echo "== merged as $sha (records included)"

$clean || exit 0
# The module's attempts: every worktree on a branch of the same task family,
# <team>/<sprint>/agent-<agent>-<module>-<role>-a<N>, for this module.
module=$(cd scripts && python3 -c '
import sys, merge_board
m = merge_board.BRANCH_RE.match(sys.argv[1])
t = m and merge_board.TASK_RE.match(m.group(3))
print(f"{m.group(1)}/{m.group(2)} {t.group(2)}" if t else "")' "$branch")
[[ -n $module ]] || { echo "not an attempt branch: no worktrees to clean"; exit 0; }
read -r ts mod <<<"$module"
kept=0 removed=0
while read -r path br; do
  [[ $br == "$ts"/agent-* ]] || continue
  name=${br#"$ts"/}; name=${name%-a[0-9]*}
  found=$(cd scripts && python3 -c '
import sys, merge_board
t = merge_board.TASK_RE.match(sys.argv[1]); print(t.group(2) if t else "")' "$name")
  [[ $found == "$mod" ]] || continue
  if git worktree remove "$path" 2>/dev/null; then
    removed=$((removed + 1)); echo "removed worktree $path"
  else
    kept=$((kept + 1)); echo "kept $path: uncommitted changes (check, then git worktree remove --force)"
  fi
done < <(git worktree list --porcelain | awk '/^worktree /{p=$2} /^branch /{sub("refs/heads/","",$2); print p, $2}')
echo "== $mod: $removed worktree(s) removed, $kept kept; branches kept until the sprint closes"
