# CR-14: CLI conventions (proposed)

Nov 2, 2026 · @javaris

Proposed, not yet accepted. When you accept it, it moves into `claude/Change requests.md` after CR-13, with your decisions in that doc's log.

- **Source:** `Miosa-osa/miosa-cli-go` at commit `27b63d6` (Nov 1): a Go CLI of about 100k lines. Read: AGENTS.md, README, the error and exit-code code, output selection, login and logout, doctor, the API client (retries), the SSE client, profiles, the link file, and its language and command-contract tests.
- **What AVEL already does better** (keep it):
  - **Stream resume.** `avel watch` resumes from `Last-Event-ID`. Their SSE client has no resume.
  - **Idempotency on every write.** AVEL requires it server-side; theirs covers only some routes.
  - **Step-up on CLI login approval,** and sessions you can list.
- **What:** adopt these conventions for the `avel` CLI.
  1. **Output contract.**
     - Human-readable by default. `--json` on every command prints `{ "data": ... }`. `avel watch --json` prints one event per line (NDJSON).
     - Errors go to stderr. With `--json` they're printed as `{ "error": { code, message, requestId, hints } }`, the contract's error body plus hints.
     - No automatic switch to JSON when output is piped. Their README says output never switches when piped, but their code does switch, and their tests turn the switch off. That's exactly the kind of doc and code drift AVEL forbids.
  2. **Exit codes, documented and tested.** These come from the HTTP status:

     | Code | Meaning | From |
     | --- | --- | --- |
     | 0 | OK | |
     | 1 | General failure (also `avel doctor` or `avel check` failing) | |
     | 2 | Usage error | bad flags or arguments |
     | 3 | Sign-in needed, or step-up needed | 401, 403 |
     | 4 | Not found | 404 |
     | 5 | Conflict: stale `rowVersion`, idempotency conflict, a replayed token route | 409 |
     | 6 | Try again later | 429, 503, and network errors after retries |
     | 7 | Server error | other 5xx |
     | 8 | Not allowed in this state; prints the allowed moves | 422 |

     Code 8 is AVEL's own: their CLI has no state machine to report.
  3. **Every error names the next step.** A CLI-side table maps each contract error code to a hint, for example: "approve the sign-in in the web app", "the plan changed; re-run `avel decisions`", "retry in 12 s". A test walks the contract's error catalog and fails if a code has no hint and no explicit "none". The request ID is shown on every error.
  4. **Writes are safe to retry.**
     - The CLI generates one `Idempotency-Key` per command and reuses it on every retry. `--idempotency-key` overrides it.
     - Reads always retry on 429 and 5xx. Writes retry only with an idempotency key.
     - The CLI honours `Retry-After`, capped at 30 s. `--retries` (default 3) and `--timeout` set the limits.
     - Token routes are never retried (`POST /api/cli/sessions` refuses replays with 409).
  5. **Contract version check.** The CLI sends `User-Agent: avel/<version>` and reads `X-Contract-Version` on each response. A different minor version warns; a different major version refuses with "run `npm i -g avel`". (This one is AVEL's own.)
  6. **Logout ends the session on the server.** `avel logout` calls `DELETE /api/cli/sessions/{sessionId}`, then deletes the local file. If the server can't be reached, it says the session is still live and how to end it from the web app.
  7. **Credentials.**
     - The session lives in `~/.avel/config.toml` with mode 0600.
     - A token is never accepted as an argument and never printed; arguments end up in shell history.
     - Precedence: flag, then `AVEL_TOKEN`, then the profile.
     - **Profiles** (`--profile`, `AVEL_PROFILE`), so local, staging and production servers each keep their own session.
  8. **Link file and names.**
     - `avel link` writes `.avel/link.json` (mission ID, slug, server; never a token). Every command looks for it from the current folder up to the root, and `AVEL_LINK` overrides the search.
     - Commands take a mission or proposal by ID, slug or `current`. An ambiguous name lists the candidates instead of guessing.
  9. **Confirmation for destructive commands.** `avel cancel` and `avel override` ask on a terminal and need `--yes` without one. This is a confirmation, not a password, so the rule that approvals never ask for a password still holds. `approve` and `reject` don't ask.
  10. **`avel doctor` in their form.**
      - Each check is ok, warn or fail, with the exact fix on the same line. `--json` is supported, and the exit code is non-zero on any failure.
      - Add three checks to the design's list: clock skew (it breaks the 12-hour session and webhook signatures), the CLI's contract version against the server's, and the config file's permissions.
  11. **`avel api <METHOD> <path>`.** A raw call to any route in the contract with your session, an idempotency key and the request ID. The typed commands cover only a few routes; this covers the rest without a CLI release.
  12. **Shell completion,** with live mission, module and proposal IDs.
  13. **Generated docs and drift tests.**
      - `docs/cli.md` is generated from the commands, and a test fails when it's stale.
      - A command-contract snapshot (commands, arguments, flags) catches accidental breaking changes.
      - A wording test over help and error text refuses retired terms (`lease`, `Money`, `GTS`, the old `Atlas` map), so CR-2, CR-4 and CR-6 can't creep back.
  14. **AGENTS.md at the repo root:** the build, test and generate commands, a table of generated files and what regenerates each, and a short "traps" list. Our builders read it first (CR-10).
- **Not adopted:**
  - **Telemetry export over OTLP:** our own JSON logger is enough for one operator.
  - **`steer`** (redirecting a running agent mid-attempt): it bypasses the locked task doc and the retry ladder. Pause and override cover it.
  - **Agent-friendly two-step login** (`--no-wait` / `--wait`): no agent should hold an operator session.
  - **Homebrew, an install script and per-platform binaries:** npm only.
  - **A self-update command:** `avel doctor` reports a newer version instead.
- **Parked:** `avel mcp`, an MCP server so your editor's AI can read missions, findings and traces. Read-only only: approvals stay with you.
- **Build order:**
  - **Step 1:** none of this is server work. The routes, the error body and the headers it relies on are already in the Step 1 plan.
  - **Step 5 (Events and the CLI):** a new `packages/cli` with the API client (retries, idempotency keys, request IDs, error parsing, exit codes, the contract-version check), plus everything above.
  - **Step 5 "done when" gains:**
    - each status maps to its exit code;
    - every contract error code has a hint or an explicit none;
    - a write retried after a dropped response returns the first result, with no duplicate row;
    - a token never appears in output or in a process's arguments;
    - after `avel logout`, the old session is refused;
    - every `--json` output validates against its DTO schema;
    - `docs/cli.md` and the command snapshot are current.
- **Decisions for you:**
  - **Auto-JSON when piped:** recommended no.
  - **Exit code 8 for 422:** recommended yes.
  - **Profiles:** recommended yes.
  - **`avel mcp`:** recommended parked.
- **Touches:**
  - design doc Main: the Live view section (setup and commands table), build Step 5;
  - the repo: `packages/cli` (new), `docs/cli.md` (generated), AGENTS.md;
  - contract and tables: none.
