#!/usr/bin/env bash
# A throwaway local Postgres in Docker, for tests that need a real database.
#
# Shared (the default, PG_LOCAL_SHARED=1): one container, avel-pg-shared, for every checkout, held to
# 2 GB of memory with its data on a tmpfs. Each checkout gets its own database, avel_<slug> (the
# folder's name and a hash of its path), made on first start. stop drops only that database; prune drops
# the databases whose checkout is gone. Four worktrees used to mean four 512 MB containers (WSL ran out of
# memory on Nov 17).
# Per checkout (PG_LOCAL_SHARED=0): one container per checkout, 512 MB, and the database avel.
# Either way Docker picks a free host port, so it never clashes with a Postgres already on 5432.
#
# Usage: scripts/pg-local.sh start   start it (or keep it running) and print this checkout's DATABASE_URL
#        scripts/pg-local.sh url     print that DATABASE_URL; exit 1 if it isn't running
#        scripts/pg-local.sh stop    shared: drop this checkout's database. Per checkout: remove the container
#        scripts/pg-local.sh prune   drop what belongs to checkouts that are gone (databases and containers)
#   export DATABASE_URL=$(scripts/pg-local.sh start)
#   Every command is idempotent. The URL goes to stdout and everything else to stderr.
#   Overrides: PG_LOCAL_SHARED (1 or 0), PG_LOCAL_NAME (container name), PG_LOCAL_IMAGE (default
#   postgres:17-alpine), PG_LOCAL_PORT (a fixed host port instead of a free one).
set -euo pipefail

usage() { sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 1; }

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
slug=$(basename "$repo" | sed 's/[^A-Za-z0-9_.-]/-/g')
shared=${PG_LOCAL_SHARED:-1}
[[ $repo != *"'"* ]] || { echo "pg-local: a checkout path with a ' in it isn't supported: $repo" >&2; exit 1; }
image=${PG_LOCAL_IMAGE:-postgres:17-alpine}
port=${PG_LOCAL_PORT:-}
user=avel password=avel
ready_timeout=60
# The cap for the container. The tmpfs data counts against the memory cap too.
if [[ $shared == 1 ]]; then
  name=${PG_LOCAL_NAME:-avel-pg-shared}
  mem_cap=2g
  # This checkout's database: its folder name, plus a hash of its path so two folders of the same name differ.
  db="avel_$(basename "$repo" | tr A-Z a-z | sed 's/[^a-z0-9_]/_/g' | cut -c1-40)_$(printf %s "$repo" | sha256sum | cut -c1-6)"
  # The label is a path that stays while any checkout does (the main checkout), so an older pg-local.sh
  # on another branch, whose prune removes a container whose labelled checkout is gone, leaves it alone.
  common=$(git -C "$repo" rev-parse --path-format=absolute --git-common-dir)
  label=$(dirname "$common")
else
  name=${PG_LOCAL_NAME:-avel-pg-$slug}
  mem_cap=512m
  db=avel
  label=$repo
fi

die() { echo "pg-local: $*" >&2; exit 1; }

need_docker() {
  command -v docker >/dev/null || die "docker isn't installed"
  docker info >/dev/null 2>&1 || die "the Docker daemon isn't reachable (docker info fails)"
}

# The container's state: running, exited, created and so on, or empty if there's none.
state() { docker inspect --format '{{.State.Status}}' "$name" 2>/dev/null || true; }

url() {
  local hostport
  hostport=$(docker port "$name" 5432/tcp 2>/dev/null | head -1) \
    || die "$name has no published port"
  [[ -n $hostport ]] || die "$name has no published port"
  echo "postgres://$user:$password@127.0.0.1:${hostport##*:}/$db"
}

# A query on the shared server's maintenance database, through the container's own psql.
q() { docker exec -i "$name" psql -X -q -A -t -v ON_ERROR_STOP=1 -U "$user" -d postgres -c "$1"; }

# Shared mode: make this checkout's database if it's missing, noting its checkout for prune.
ensure_db() {
  [[ $shared == 1 ]] || return 0
  if [[ -z $(q "select 1 from pg_database where datname = '$db'") ]]; then
    echo "pg-local: creating database $db for $repo" >&2
    q "create database \"$db\"" >/dev/null
    q "comment on database \"$db\" is 'pg-local:$repo'" >/dev/null
  fi
}

wait_ready() {
  local i
  # Over TCP, so the official image's init server (socket only) doesn't count as ready.
  for ((i = 0; i < ready_timeout * 2; i++)); do
    if docker exec "$name" pg_isready -q -h 127.0.0.1 -U "$user" -d postgres 2>/dev/null; then
      return 0
    fi
    [[ $(state) == running ]] || die "$name stopped while starting: docker logs $name"
    sleep 0.5
  done
  die "$name wasn't ready after ${ready_timeout}s: docker logs $name"
}

# One start or stop at a time per container, so two test runs starting it at
# once don't race for the name (where flock exists; it does on Linux and CI).
lock() {
  command -v flock >/dev/null || return 0
  exec 9>"${TMPDIR:-/tmp}/$name.lock"
  flock -w 120 9 || die "timed out waiting for another pg-local on $name"
}

start() {
  need_docker
  lock
  local s
  s=$(state)
  if [[ -n $s && $s != running ]]; then
    # A leftover from a crash or a host restart: it's throwaway, so start fresh.
    echo "pg-local: removing the $s container $name" >&2
    docker rm -f "$name" >/dev/null
    s=
  fi
  if [[ -z $s ]]; then
    echo "pg-local: starting $name ($image)" >&2
    if ! docker run -d --rm --name "$name" \
      --label avel.pg-local="$label" --label avel.pg-local.shared="$shared" \
      --memory "$mem_cap" --memory-swap "$mem_cap" \
      --tmpfs "/var/lib/postgresql/data:rw,size=$mem_cap" \
      -e POSTGRES_USER="$user" -e POSTGRES_PASSWORD="$password" -e POSTGRES_DB=avel \
      -p "127.0.0.1:${port}:5432" \
      "$image" >/dev/null; then
      # Without flock, another start may have won the race for the name; that one is
      # fine to use once it's running.
      local i
      for ((i = 0; i < 20; i++)); do
        [[ $(state) == running ]] && break
        sleep 0.5
      done
      [[ $(state) == running ]] || die "docker run failed for $name"
    fi
  fi
  wait_ready
  ensure_db
  url
}

stop() {
  need_docker
  lock
  if [[ $shared == 1 ]]; then
    if [[ $(state) == running ]] && [[ -n $(q "select 1 from pg_database where datname = '$db'") ]]; then
      echo "pg-local: dropping database $db" >&2
      q "drop database if exists \"$db\" with (force)" >/dev/null
    else
      echo "pg-local: $db isn't there" >&2
    fi
    return 0
  fi
  if [[ -n $(state) ]]; then
    echo "pg-local: removing $name" >&2
    docker rm -f "$name" >/dev/null
  else
    echo "pg-local: $name isn't running" >&2
  fi
}

# Every container is labelled with its checkout's path. Remove the ones whose checkout
# is gone: a finished attempt's worktree, or a session that crashed before its stop.
prune() {
  need_docker
  local n path sh removed=0 d dropped=0
  # The shared server: drop each checkout database whose checkout is gone. A test database (per test
  # file, random name) left by a run that crashed is dropped once nothing uses it and it's 6 hours old.
  if [[ $(docker inspect --format '{{.State.Status}}' avel-pg-shared 2>/dev/null) == running ]]; then
    local name=avel-pg-shared
    while IFS='|' read -r d path; do
      [[ -n $d ]] || continue
      path=${path#pg-local:}
      if [[ ! -d $path ]]; then
        echo "pg-local: dropping database $d ($path is gone)" >&2
        q "drop database if exists \"$d\" with (force)" >/dev/null && dropped=$((dropped + 1))
      fi
    done < <(q "select datname || '|' || shobj_description(oid, 'pg_database') from pg_database where shobj_description(oid, 'pg_database') like 'pg-local:%'")
    while read -r d; do
      [[ -n $d ]] || continue
      echo "pg-local: dropping test database $d (unused for 6 hours)" >&2
      q "drop database if exists \"$d\" with (force)" >/dev/null && dropped=$((dropped + 1))
    done < <(q "select datname from pg_database d where not datistemplate and datname not in ('postgres', 'avel')
                and coalesce(shobj_description(oid, 'pg_database'), '') not like 'pg-local:%'
                and not exists (select 1 from pg_stat_activity a where a.datid = d.oid)
                and (pg_stat_file('base/' || oid || '/PG_VERSION')).modification < now() - interval '6 hours'")
    echo "pg-local: dropped $dropped database(s) on avel-pg-shared" >&2
  fi
  while IFS='|' read -r n sh path; do
    [[ -n $n ]] || continue
    [[ $sh == 1 ]] && continue  # the shared server stays; its databases were pruned above
    if [[ -z $path || ! -d $path ]]; then
      echo "pg-local: removing $n (${path:-its checkout} is gone)" >&2
      docker rm -f "$n" >/dev/null
      removed=$((removed + 1))
    fi
  done < <(docker ps -a --filter label=avel.pg-local --format '{{.Names}}|{{.Label "avel.pg-local.shared"}}|{{.Label "avel.pg-local"}}')
  echo "pg-local: pruned $removed container(s)" >&2
}

case ${1:-} in
  start) start ;;
  url)
    need_docker
    [[ $(state) == running ]] || die "$name isn't running: scripts/pg-local.sh start"
    [[ $shared != 1 || -n $(q "select 1 from pg_database where datname = '$db'") ]] ||
      die "$db isn't on $name: scripts/pg-local.sh start"
    url
    ;;
  stop) stop ;;
  prune) prune ;;
  *) usage ;;
esac
