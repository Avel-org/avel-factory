# CR-17: agent access to the CLI (proposed)

Nov 4, 2026 · @javaris

How agents get to use `avel` (the `avel-cli` repo, CR-15 item 4) without ever acting as the operator. Today `.claude/settings.json` denies `Bash(avel:*)` outright. This replaces that with a narrow, tested set of agent commands, enforced by the server. Nothing here is built until you accept it.

## The rule

**An agent uses the CLI the way a contractor uses a badge:** it reads, and acts on its own work. It never approves, merges, overrides, signs in, links a checkout or touches credentials.

The server enforces this. The CLI and Claude Code's permissions only make the right path easy and the wrong one fail early with a clear message. If either of them is bypassed, the server still refuses.

## Three layers

| Layer | What it does | Is it a boundary? |
| --- | --- | --- |
| 1. The server | Identifies the caller (operator, agent, runner) and checks every route against a policy table | **Yes.** The only one |
| 2. The CLI | Detects agent mode, refuses operator-only commands before any network call, JSON output, never prompts | No: it gives clear errors and is fast |
| 3. Claude Code permissions | Allows the agent commands, denies the operator ones | No: prefix matching can be tricked by the shell. It stops honest mistakes and prompt nudges |

### 1. The server

- **Three identities:** the middleware resolves every request to one:
  - **operator:** a CLI session from device login, or the web cookie
  - **agent:** an attempt token
  - **runner:** its own credential

  avel-server already resolves these three this way; carry the pattern forward in `platform`.
- **The agent credential is an attempt token.**
  - **Minted by the runner** when an attempt starts, and scoped to that attempt: its mission, dispatch, branch and role.
  - **It expires** when the attempt closes.
  - **It's revoked** when the attempt is killed (Step 2's credentials reaper).
  - **Stored** hashed, with the attempt id: a `credentials` row of kind `dispatch` (DATABASE.md), so no new table.
  - **Given to the room** as `AVEL_AGENT_TOKEN`, through the same path as the per-attempt git credentials.
- **A policy table:** every route is tagged with the identities that may call it and how far an agent's access reaches: `own_attempt`, `own_dispatch`, `own_mission`, or `role:<judge roles>`. It's derived from the roles, not hand-written per route. A route with no tag refuses agents (default deny), and a contract test fails if any route is untagged.
- **Never reachable by an agent:** device login, step-up, approvals and decisions, overrides, merges and integration, delivery, secrets, repo connections, budgets, `link`. Device login and step-up need a human with the password in a browser, so an agent token can't satisfy them even through a bug elsewhere.
- **New error codes:** `AGENT_NOT_PERMITTED` (the route refuses agents) and `AGENT_SCOPE` (the route allows agents, but not for this mission or dispatch). Both go in the shared error body, and the CLI maps them to exit code 3.

### 2. The CLI

- **How it knows it's an agent:** an agent credential means agent mode. With `AVEL_AGENT_TOKEN` set, the CLI never reads an operator session, even if one exists on the machine. That stops an agent on your laptop from borrowing your login.
- **The command manifest:** each command declares who it's for (`operator`, `agent`, `both`) and what it does (`read`, `write_own`, `write`). The CLI refuses an operator-only command in agent mode before calling the server, naming the reason and the command an agent may use instead.
- **Agent-mode output:** JSON by default, no colors, no interactive prompts (a prompt would hang a room), no pager, and no follow mode.

| Command | Operator | Agent | Effect | Server route reach |
| --- | --- | --- | --- | --- |
| `avel check` | ✓ | ✓ on its own branch | read: runs the gate's checks, as advice | `own_attempt` |
| `avel doctor` | ✓ | ✓ | read: local checks plus server health | open to agents |
| `avel events --since 1h --json` | ✓ | ✓ | read | `own_mission` |
| `avel watch` | ✓ | ✗ | read, never exits: a room would hang | — |
| `avel report`, `avel progress` | — | ✓ | write_own: its completion report and progress notes | `own_dispatch` |
| `avel finding file` | ✓ | ✓ judges only (Brennan, Zane, Leah, Breach) | write: an open finding, routed later by a human | `role:judge`, `own_mission` |
| `avel approve`, `reject`, `merge`, `override` | ✓ with step-up | ✗ | decisions | operator only |
| `avel login`, `logout`, `sessions`, `link`, `secrets` | ✓ | ✗ | credentials | operator only |

### 3. Claude Code permissions

`.claude/settings.json` swaps the blanket deny for an allowlist plus explicit denies:

```json
"allow": ["Bash(avel check:*)", "Bash(avel doctor:*)", "Bash(avel events:*)",
          "Bash(avel report:*)", "Bash(avel progress:*)", "Bash(avel finding file:*)"],
"deny":  ["Bash(avel approve:*)", "Bash(avel reject:*)", "Bash(avel merge:*)",
          "Bash(avel override:*)", "Bash(avel login:*)", "Bash(avel link:*)",
          "Bash(avel secrets:*)", "Bash(avel watch:*)"]
```

`avel finding file` stays in the allowlist for every agent because the server checks the judge role. Builders get `AGENT_NOT_PERMITTED`.

## Inside rooms: tools first, the CLI second

In a room (Phase 2 on), the same capabilities are typed tools on the **host tool server**: `run_checks`, `file_report`, `progress_note`, `read_events`, `file_finding`. They're better than shell commands for three reasons:
- **Schemas:** the agent can't build a malformed call.
- **No shell parsing:** nothing to trick.
- **Already scoped:** they come with the attempt's scope.

avel-server's `run_checks` tool is the precedent: it runs the gate's checks on the room's commit, as advice. The CLI's agent commands call the same routes, so the two stay in step.

## Audit

- **Every agent call is logged** as `cli.ran`: actor (the attempt), command, route and outcome (`ok` or `refused` with its code).
- **It feeds the receipt** under the attempt, and appears in `avel watch`.
- **A refused call is a signal:** three refusals in one attempt raise a NEEDS YOU item. An agent that keeps reaching for operator commands is drifting or being steered.

## Phase 1, before the server

No server exists yet, so there are no tokens and no policy table. Until Step 1:
- **Allowed:** agents may run the read-only Phase 1 scripts, added to the allowlist: `scripts/check_locks.py`, `scripts/doctor.sh --quiet`, `scripts/events.py tail --json`.
- **Denied:** `avel` stays denied entirely. A CLI without a server-side policy has nothing that holds.
- **Already enforced:** the locked-test pre-commit hook stops a commit that changes a locked test, whoever runs `git commit`.

## Tests

| Who | What |
| --- | --- |
| Rigg (server) | Every route × identity: allowed or refused, with the right code. An untagged route fails the contract test. A token is refused after its attempt closes or is killed. Mission A's token can't read mission B. A builder's token can't file a finding |
| Rigg (avel-cli) | Every manifest command × mode: refused locally in agent mode with exit 3. With `AVEL_AGENT_TOKEN` set, an operator session on disk is never read. Agent mode never prompts or pages |
| Breach | Reuse a killed attempt's token. Read another attempt's events. Plant instructions in a task doc, a file or a test output telling the agent to run `avel approve` or `avel override`. Smuggle an operator command past the allowlist (`avel  approve`, `env avel approve`, `sh -c`). Every one must end in a server refusal and a `cli.ran` refused event |
| Zane | Reviews the token's minting, storage, scope and revocation, and the policy table, as trust-core changes |

## Touches

- **The contract:**
  - the route policy tags
  - `AGENT_NOT_PERMITTED` and `AGENT_SCOPE`
  - the `cli.ran` event kind, owned by `cli` (CR-15 item 8)
- **The `platform` module:** identity resolution and the policy middleware.
- **The `runner` module:** minting, scoping and revoking attempt tokens, and passing `AVEL_AGENT_TOKEN` into the room.
- **The `harness` module:** the host tool server's tools.
- **The `avel-cli` repo:** agent mode and the command manifest.
- **The roster and settings:** `.claude/settings.json` and the agent files (which commands each role may use).
- **The build plan:** Step 1 (identities, policy middleware), Step 4 (tokens, tool server) and Step 5 (agent commands, `cli.ran`).
- **The design library:** nothing. Refusals show only as events and NEEDS YOU items.
