# CR-22: Rooms on MIOSA, with checks inside the room (proposed)

Nov 9, 2026 · @javaris

Proposed, not yet accepted. Numbered after the repo's CR-20 and the suggested CR-21 (demo slice first). When accepted, it moves into `claude/Change requests.md` with your decisions in its log.

- **What:** run attempt rooms on MIOSA's $20 Developer plan behind the existing `compute` interface, launch the agent headless with permissions skipped, and add three checks inside the room. The gates don't change.
- **Why:**
  - Each room is a MIOSA microVM, so skipping permissions inside it is safe for internal and template work.
  - The in-room checks catch failures before Gate 2, so fewer attempts burn a ladder step.
  - The Sandbox doc's MIOSA figures are out of date (below).
- **Touches:**
  - Sandbox doc: the providers table, "How each fits the factory", "Moving off Docker", open questions.
  - Design doc Main: `compute` module, build Step 2.
  - Tables: none. `attempts.compute` already allows `'miosa'`; `plan_modules.write_paths` and `forbidden_paths` already exist; a failed result uses `attempts.outcome = 'failed'` with `failure_note`.

## 1. Corrected MIOSA figures (from miosa.ai/pricing, Nov 9)

| | Sandbox doc said (Oct 31) | Pricing page says (Nov 9) |
| --- | --- | --- |
| Developer plan | $20, $20 credit | $20, $20 credit (unchanged) |
| Sandboxes at once | 5 | 50 |
| Running total | 16 vCPU / 32 GB | 64 vCPU / 128 GB |
| Largest machine | 4 vCPU / 8 GB | 4 vCPU / 8 GB |
| Medium (4 vCPU / 8 GB) | $0.1785 an hour | $0.1785 an hour |
| Fits the factory? | Only with 4 dispatches | Yes: 6 dispatch rooms plus the integration room |

Still open: the API docs list a default of 10 concurrent sandboxes per tenant, the pricing page contradicts itself on whether builds are billed, and isolation, regions, egress controls and SOC 2 aren't published.

## 2. Room settings on MIOSA

1. **Lifetime:** the sandbox timeout is set above the 60-minute attempt cap, so AVEL ends the attempt first. Idle pausing is turned off, because an agent waiting on the model may count as idle.
2. **Long commands run detached.** MIOSA's exec defaults to a 30-second timeout.
3. **No model key in the room.** `ANTHROPIC_BASE_URL` points at the model proxy, `ANTHROPIC_AUTH_TOKEN` is the attempt's dispatch token, and `ANTHROPIC_API_KEY` is set empty. If it's set, Claude Code skips the proxy.
4. **The proxy and git server are reachable from MIOSA** over TLS, and each still requires the attempt's own token. Git pushes only the attempt branch, as today.
5. **The agent runs as a non-root user.** Claude Code refuses to skip permissions as root outside a recognized sandbox.
6. **Client missions stay off MIOSA** until it publishes egress controls and a SOC 2. This matches the Sandbox doc's existing overflow rule. Internal and template missions (CR-13) can use it now.

## 3. The launch command

```
claude -p "$(cat TASK.md)" --dangerously-skip-permissions \
  --output-format stream-json --verbose \
  --max-turns 80 --max-budget-usd 4
```

`--max-budget-usd` is a backup only. The proxy stays the meter of record and ends the attempt as `capped`.

## 4. Three checks inside the room

1. **Result check (runner).** An attempt fails if the final result has `is_error: true` or a non-empty `permission_denials`. A headless run can exit 0 and report success while the work wasn't done. Hitting `--max-turns` also counts as failed.
2. **Stop hook (in the room's settings).** The agent can't finish while typecheck, lint or the locked tests fail. The hook checks `stop_hook_active` and lets the second stop through, so it can't loop. This is a pre-check: Gate 2 still runs in its fresh room and decides.
3. **Pre-tool hook.** Refuses edits to locked test paths, `.git`, and any path outside the module's `write_paths` or inside its `forbidden_paths`, with a message saying why. The existing file guards stay; the hook gives the agent the answer immediately instead of at review.

## Tests ("done when")

- A room started with `ANTHROPIC_API_KEY` set fails startup.
- A result with a permission denial ends the attempt as `failed` with a `failure_note`, never as passed.
- The Stop hook blocks once on a failing test, then allows the stop.
- The pre-tool hook refuses a write to a locked test and to a forbidden path.
- An attempt still running at 60 minutes is ended by AVEL, not by MIOSA's timeout.
- The isolation suite runs inside a MIOSA room and records what it can and can't block.

## Your decisions

- [ ] Accept CR-22.
- [ ] Concurrency for the demo: 2 or 3 dispatch rooms at once (recommended), raised once integration wait times are measured.
- [ ] Ask MIOSA support: the concurrent limit for your account, build billing, egress controls, SOC 2.
