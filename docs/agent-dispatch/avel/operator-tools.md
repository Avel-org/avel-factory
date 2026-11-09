# Operator tools for Phase 1

Nov 4, 2026 · @javaris

Ten tools that make the control room work like the factory it stands in for. In Phase 1 you're the scheduler and the integrator (Backend modules and build plan, section 2), so each tool brings one of the factory's rules or screens to your terminal now, and tests it on real work before the factory depends on it. Opening and arranging sessions stays in [sessions.md](sessions.md).

| # | Tool | Stands in for | Where |
|---|---|---|---|
| 1 | NEEDS YOU, at the top of INT | the web app's Decisions home | `scripts/dashboard.py` |
| 2 | The event log | the `events` module's stream | `scripts/events.py`, `docs/agent-dispatch/records/events.jsonl` |
| 3 | Stall detection | the 10-minute stall rule | `scripts/dashboard.py`, `scripts/hooks/session.py` |
| 4 | Gate colors on the merge board | the design library's gate tokens | `scripts/dashboard.py`, `scripts/events.py` |
| 5 | Enclosure Grid terminal theme | the design system | `~/.wezterm.lua`, Ctrl+a then e |
| 6 | Toasts and tab badges | decision notifications | `scripts/hooks/session.py`, `~/.wezterm.lua` |
| 7 | Cost records | `metering` and Step 10 receipts | `scripts/hooks/session.py`, `docs/agent-dispatch/records/costs/` |
| 8 | `scripts/doctor.sh` | `avel doctor` | `scripts/doctor.sh` |
| 9 | Locked-test check | Gate 3's territory rule | `scripts/check_locks.py`, the pre-commit hook |
| 10 | `scripts/watch.sh` | `avel watch` | `scripts/watch.sh` |

## Before you start

1. **Commit `scripts/`, `.claude/` and `docs/`.** A dispatch worktree is made from a commit (`git worktree add … main`). Until these are committed, a dispatch has no agent file, no hooks and no scripts, and `agent.sh` quietly falls back to a plain session. `scripts/doctor.sh` flags this.
2. **Restart the sessions.** Claude Code reads its hooks when a session starts. Sessions that were open before the hooks existed show no waiting, stall or cost until they restart. Close the team tabs, then Ctrl+a then v.
3. **Run `scripts/doctor.sh`.** It should end with `all good`.

## How the pieces connect

```
Claude Code session ──hooks──▶ scripts/hooks/session.py
  (AVEL_FROM=SOAP)                ├─▶ .git/avel/sessions.json   (state: active · waiting · idle; heartbeat)
                                  ├─▶ records/events.jsonl      (session.waiting · session.idle · session.resumed)
                                  └─▶ records/costs/<id>.json   (tokens and cost, on every Stop)
agent.sh · tell.sh · check_locks.py · INT ───▶ records/events.jsonl
sessions.json ──read once a second──▶ ~/.wezterm.lua   (toasts, tab badges)
sessions.json + merge board ─────────▶ INT: NEEDS YOU, stalls
events.jsonl ────────────────────────▶ INT's events panel, scripts/watch.sh
```

- **Session names:** every session is known by its `AVEL_FROM` name: `SOAP` for a crew session, `SOAP m2-build a1` for a dispatch. The control room and `agent.sh` set it. A session without one (a plain `claude` in some shell) is ignored.
- **Session state:** it lives in `.git/avel/`, which is untracked and shared by every worktree.
- **Records:** they live in `docs/agent-dispatch/records/` and are meant to be committed. The build plan wants Phase 1 records kept "so they can later be imported as fixtures and replay data".

## 1. NEEDS YOU

The first section of INT lists what's waiting on you, most urgent first:

| Item | Comes from | Enter |
|---|---|---|
| `SOAP: Claude needs your permission to use Bash (2m)` | a Notification hook | opens the session, zoomed |
| `IYO stalled: working, no tool activity for 14m` | the heartbeat (tool 3) | opens the session |
| `m2: 2 locked test change(s) on agent-soap-m2-build-a1` | the lock check (tool 9) | opens the merge board at m2 |
| `m2: ready to merge (Enter, then m)` | the merge board's checklist | opens the merge board at m2 |
| `m2: 1 open finding(s) to route` | `findings/*m2*` without a closed status | opens the merge board at m2 |
| `m2: start BRENNAN review-spec (Ctrl+a s, needs the build SHA)` | a build report with a review that hasn't started | opens the merge board at m2 |
| `SOAP m2-build a1 over its cap ($4.12): end it after its report` | `capped` in sessions.json, set by the session hook at $4 or 60 minutes (procedures.md, rule 4) | opens the session |
| `SOAP m2-build a1 idle 12m: end it, don't resume` | a dispatch session idle past 10 minutes (rule 4) | opens the session |

- **When it's empty:** it says `all clear`.
- **In the session list:** a waiting session reads `needs you 2m`, and a stalled one reads `stalled 14m`.
- **What doesn't count:** Claude Code's 60-second "waiting for your input" reminder. The turn already ended, so the session is idle, not blocked. Only permission and input prompts count.

## 2. The event log

One JSON line per thing that happened, in `docs/agent-dispatch/records/events.jsonl`, wherever it was written from:

```json
{"seq": 8, "at": "2026-11-05T02:21:12Z", "kind": "attempt.started", "actor": "operator",
 "subject": {"type": "attempt", "ref": "backend/sprint-01/agent-soap-m2-build-a1"},
 "data": {"agent": "SOAP", "team": "backend", "sprint": "sprint-01", "attempt": "1", "base": "…", "worktree": "…"}}
```

- **`seq`:** gapless, so a reader resumes after the last `seq` it saw. This is the same promise the factory's stream makes ("a reconnect resumes with no gaps").
- **Kinds:** they keep entity names, as the web app's live layer does (Frontend Map v0.6).

| Kind | Written by | When |
|---|---|---|
| `attempt.started` | `scripts/agent.sh` | a dispatch tab opens on its worktree |
| `message.sent` | `scripts/tell.sh` | a message is typed into a session (still also in `messages.md`) |
| `session.waiting` | the Notification hook | a permission or input prompt |
| `session.resumed` | the UserPromptSubmit hook | you answer, after it was waiting or idle |
| `session.idle` | the Stop hook | a turn finished |
| `session.stalled` | INT | a working session passes 10 minutes with no tool activity (once per stall) |
| `lock.violated` | `scripts/check_locks.py` | a locked test path changed |
| `lock.overridden` | `scripts/check_locks.py` | it changed with `AVEL_LOCK_OVERRIDE` (a test-change decision) |

Write one by hand with `scripts/events.py emit <kind> --subject TYPE:REF key=value …`. These are Phase 1 stand-ins: when the `events` module lands, keep the kinds that match its registry and map the rest.

## 3. Stall detection

- **The rule:** a session is stalled when Claude is working (a spinner in its title) but no tool has run for 10 minutes. The factory uses the same rule (`STALL` in `dashboard.py`, the server's stall number).
- **The heartbeat:** every tool call (the PostToolUse hook), prompt and finished turn restarts it.
- **What happens:** INT shows the stall in NEEDS YOU and in the session's row, and logs `session.stalled` once.
- **The limit:** a long single command (a 12-minute test run) counts as a stall too. That's on purpose, because it's worth a look.

## 4. Gate colors

- **The split:** team colors say who did the work, and gate colors say whether it passed, as in the web app.
- **The colors:** they're the design library's dark gate tokens, as the nearest xterm-256 colors.

| Status | Gate color |
|---|---|
| READY, MERGED, ✓ checklist items | pass `#68d3a0` |
| IN REVIEW, waiting sessions | warn `#f2c662` |
| ✗ checklist items, stalls, locked-test changes, open findings | block `#f6958b` |
| WAITING | pending `#b9bac1` |
| BUILDING, TESTS, `attempt.*` events | accent `#74b8fc` |

- **New checklist item:** the merge board's checklist now includes **no locked test changed** for every locked module (tool 9).

## 5. Enclosure Grid terminal theme

- **The switch:** Ctrl+a then e switches the window between Rinnegan (your theme) and Enclosure Grid, the product's design system.
- **Enclosure Grid colors:** the app background `#141517`, its text `#ededef`, the accent blue `#74b8fc` and no background image. The terminal's red, green and yellow are the gate block, pass and warn colors, so test output reads like the product.
- **The font:** it uses IBM Plex Mono when it's installed (from fonts.google.com, "Install for all users"), otherwise Cascadia Mono. It never asks for a missing font, which would open WezTerm's error window.
- **Which windows:** the switch applies to the current window only. A new window starts in Rinnegan.

## 6. Toasts and tab badges

`~/.wezterm.lua` reads `.git/avel/sessions.json` once a second (over `\\wsl.localhost`) and:

- **A session waiting on a prompt:** shows a toast, `SOAP needs you`, with the prompt, once per prompt. Its tab gets a yellow **●** until the prompt is answered.
- **A session whose turn finished:** its tab gets a green **✓** until you look at it (the tab active in the focused window). A dispatch tab also gets a toast, `SOAP m2-build a1 finished`. Crew tabs don't, or 15 sessions would be too loud.
- **In a team tab:** the badge shows if any of its panes has one, and **●** wins over **✓**.
- **If it breaks:** a reading error goes to WezTerm's log (`avel attention: …`), never to the screen.

## 7. Cost records

- **When:** at the end of every turn, the Stop hook rewrites `docs/agent-dispatch/records/costs/<session_id>.json` from the session's transcript.
- **What's in it:** tokens per model (input, output, 5-minute and 1-hour cache writes, cache reads), the cost in dollars, the branch and the times.
- **No double counting:** each message's usage appears on several transcript lines, so the hook counts each message once.
- **What the numbers mean:** they're API-equivalent prices from `scripts/lib/prices.json` (Anthropic list prices from the Claude API reference, checked Nov 4). They're what the work would cost on the factory's meter, not your Claude Code subscription bill. Update the file when prices change.
- **What it replaces:** this is the build plan's "record it by hand per step (`/cost`)", done for you, with the cost by cache type that Step 10's receipts need.

## 8. `scripts/doctor.sh`

Shaped like `avel doctor`: one line per check, `✓`, `!` or `✗`, and exit 1 if anything is `✗`. `--quiet` shows only problems. It checks:

- **Tools:** wezterm and its mux, node, claude, python 3.13+ and pnpm.
- **Repo:** that scripts, agent files and docs are committed, all 15 agent files, the session hooks, the lock hook, and hook errors (`.git/avel/hook-errors.log`).
- **Worktrees and slots:** stale worktrees, worktrees on merged branches, the INT tab and dispatch slots in use out of 3 (procedures.md, rule 5).
- **Records:** that they're writable, the last event, cost records and the prices file.
- **WezTerm config:** the toasts, the theme toggle and IBM Plex Mono.

## 9. Locked tests

The build plan's Phase 1 rule: once Rigg or Fenn commits a module's tests, they're locked, and no build may change them. A lock is one line in the sprint folder's `locks.md`:

```
- m2 · 3c91e07 · packages/server/test/m2/**, packages/db/test/m2/**
```

The line is the module, the tests commit and the locked paths (`**` spans folders; `|` works in place of `·`). The merge board already counted a module as locked once it was named there. The paths are new.

| Command | What it does |
|---|---|
| `scripts/check_locks.py` | checks `main...HEAD` (or a range you give), exit 1 on a change |
| `scripts/check_locks.py --staged` | checks what's staged: the pre-commit hook runs this |
| `scripts/check_locks.py --list` | every lock it reads |
| `scripts/check_locks.py --install-hook` | installs the pre-commit hook. Every worktree shares it, so a dispatch can't commit a locked test |

- **Where locks are read from:** the main checkout, so a branch made before the lock is still held to it.
- **What's exempt:** the lock's own commit and its ancestors.
- **A deliberate test change:** it's a decision (the web app's "Test change" kind), so make it in the open: `AVEL_LOCK_OVERRIDE="spec changed in CR-17" git commit …`. It goes through, and `lock.overridden` is logged with the reason.

## 10. `scripts/watch.sh`

Shaped like `avel watch`: the last events, then new ones as they're written.

```bash
scripts/watch.sh                          # everything, the last 20 first
scripts/watch.sh --kind session.waiting   # only what needs you
scripts/watch.sh --actor SOAP --since 2h  # what SOAP did, and what happened to it
scripts/watch.sh --kind attempt --json    # raw lines, for jq
scripts/events.py tail --kind lock        # same filters, no follow
```

- **`--kind`:** takes a kind or a prefix (`attempt` matches `attempt.started`).
- **`--actor`:** matches who did it or the session it's about.
- **`--since`:** takes `30m`, `2h` or `1d`.

## Files

| File | What it is |
|---|---|
| `scripts/events.py` | the event log: `emit`, `tail`, `watch` |
| `scripts/watch.sh` | `events.py watch` |
| `scripts/hooks/session.py` | the Claude Code hook: state, heartbeat, events, cost |
| `scripts/lib/prices.json` | prices for the cost records |
| `scripts/check_locks.py` | the locked-test check and its pre-commit hook |
| `scripts/doctor.sh` | the setup check |
| `scripts/dashboard.py`, `scripts/merge_board.py` | INT: NEEDS YOU, stalls, gate colors, lock checklist, events panel |
| `scripts/agent.sh`, `scripts/tell.sh` | now log `attempt.started` and `message.sent` |
| `.claude/settings.json` | the hooks: UserPromptSubmit, PostToolUse, Notification, Stop. They always run the main checkout's `session.py` |
| `~/.wezterm.lua` | toasts, tab badges, Ctrl+a then e |
| `.git/avel/` | untracked state: `sessions.json`, `hook-errors.log` |
| `docs/agent-dispatch/records/` | the records: `events.jsonl`, `costs/` |

## Handoff to avel-cli

The CLI and its TUI live in their own repo, `avel-cli`, in TypeScript with OpenTUI (decided Nov 4; Backend modules and build plan, CR-15 item 4). One repo with two front ends: `avel <command>` for scripts and quick checks, and `avel` with no command (or `avel tui`) for the full-screen control room. Both sit on the same core: the contract client, the event reader and the checks. The tools above are its first spec:

| Phase 1 tool | Becomes in avel-cli | Must stay compatible |
|---|---|---|
| `scripts/watch.sh`, `scripts/events.py` | `avel watch`, and the TUI's event panel | the event shape, `seq` for gapless resume, the kind names, `--kind`/`--actor`/`--since` |
| INT's NEEDS YOU | the TUI's home screen (the web's Decisions list) | the item order: waiting, stalled, locked tests, ready, findings, reviews |
| stall detection | the server's stall number, shown by the TUI | 10 minutes, measured from the last tool activity |
| `scripts/doctor.sh` | `avel doctor` | ✓ ! ✗ lines, exit 1 on ✗, `--quiet` |
| cost records | the TUI's spend view, then `metering` | tokens by model and cache type, API-equivalent prices |
| `scripts/check_locks.py` | `avel check` locks, and the repo's own CI | the `locks.md` line format, the override with a reason |

**Two sources, one reader.** Until Step 5's live stream exists, `avel watch` reads `docs/agent-dispatch/records/events.jsonl`. Afterwards it reads the server's stream. Write the reader against an interface (`after(seq) → events`), so switching is one adapter, and Phase 1 logs stay replayable as fixtures.
