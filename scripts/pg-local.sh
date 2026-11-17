#!/usr/bin/env bash
# A throwaway local Postgres in Docker, for tests that need a real database.
# One container per checkout (each worktree gets its own), its data on a
# tmpfs, and a free host port picked by Docker, so it never clashes with
# another worktree or with a Postgres already on 5432.
#
# Usage: scripts/pg-local.sh start   start it (or keep it running) and print its DATABASE_URL
#        scripts/pg-local.sh url     print its DATABASE_URL; exit 1 if it isn't running
#        scripts/pg-local.sh stop    remove it and its data; a no-op if it isn't running
#   export DATABASE_URL=$(scripts/pg-local.sh start)
#   Every command is idempotent. The URL goes to stdout and everything else to stderr.
#   Overrides: PG_LOCAL_NAME (container name), PG_LOCAL_IMAGE (default postgres:17-alpine),
#   PG_LOCAL_PORT (a fixed host port instead of a free one).
set -euo pipefail

usage() { sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 1; }

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
slug=$(basename "$repo" | sed 's/[^A-Za-z0-9_.-]/-/g')
name=${PG_LOCAL_NAME:-avel-pg-$slug}
image=${PG_LOCAL_IMAGE:-postgres:17-alpine}
port=${PG_LOCAL_PORT:-}
user=avel password=avel db=avel
ready_timeout=60

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

wait_ready() {
  local i
  # Over TCP, so the official image's init server (socket only) doesn't count as ready.
  for ((i = 0; i < ready_timeout * 2; i++)); do
    if docker exec "$name" pg_isready -q -h 127.0.0.1 -U "$user" -d "$db" 2>/dev/null; then
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
      --label avel.pg-local="$repo" \
      --tmpfs /var/lib/postgresql/data:rw \
      -e POSTGRES_USER="$user" -e POSTGRES_PASSWORD="$password" -e POSTGRES_DB="$db" \
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
  url
}

stop() {
  need_docker
  lock
  if [[ -n $(state) ]]; then
    echo "pg-local: removing $name" >&2
    docker rm -f "$name" >/dev/null
  else
    echo "pg-local: $name isn't running" >&2
  fi
}

case ${1:-} in
  start) start ;;
  url)
    need_docker
    [[ $(state) == running ]] || die "$name isn't running: scripts/pg-local.sh start"
    url
    ;;
  stop) stop ;;
  *) usage ;;
esac
