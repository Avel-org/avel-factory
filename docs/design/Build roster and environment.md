# Build roster and environment

Nov 15, 2026 · @javaris · goes with `Build rules.md`

Who's on the team that builds AVEL, which WezTerm tab each one lives in, what each one needs from the outside world, and every key you'll need, step by step.

## The roster, tab by tab

Your five seats are OSA, the two leads and the two building tabs, plus a sixth tab for you. Each building tab holds its lane's **builder and checker side by side**, so you watch both halves of a ticket in one place.

| Tab | Who | Runs as | Model | Works in | Key file | Holds | Never |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 OSA | Operator agent | OSA, always on | DeepSeek V4.1 Flash, Kimi K2.6 for briefs (MIOSA AI, CR-29) | The checkout, read only | `osa.env` | Its MIOSA key; a GitHub token that files issues and reads PRs | Pushes, merges, approves, writes code |
| 2 Axis | Backend lead | Claude Code, interactive | Opus | Its own worktree, `../avel-factory-wt/axis` | `leads.env` | The leads' GitHub token (can merge standard PRs) | Reviews or merges its own work |
| 3 Zero | Frontend lead | Claude Code, interactive | Opus | `../avel-factory-wt/zero` | `leads.env` | The same | The same |
| 4 Backend | Soap, builder (left); Rigg, checker (right) | One dispatch per session: the lane loop opens each ready task doc in the agent's pane with `claude --agent <name>` and `/dispatch` | Sonnet; Opus on full-rigor tickets | The ticket's worktree | `agents.env` | The agents' GitHub token (push `t/*` branches, open PRs) | Merges; the builder never edits the checker's tests |
| 5 Frontend | Fantem, builder (left); Fenn, checker (right) | The same | Sonnet; the builder on Opus for full rigor | The ticket's worktree | `agents.env` | The same | The same |
| 6 Ops | You | Your shell | — | The checkout | Your own logins | Everything | — |

### The layout

```
 ┌ 1 OSA ┬ 2 Axis ┬ 3 Zero ┬ 4 Backend ┬ 5 Frontend ┬ 6 Ops ┐
 4 Backend:   ┌──────────────┬──────────────┐   6 Ops:  ┌─────────────────────────────┐
              │ builder      │ checker      │           │ Postgres up, then a shell   │
              │ (lane loop)  │ (lane loop)  │           ├─────────────────────────────┤
              └──────────────┴──────────────┘           │ git status, then a shell    │
                                                         └─────────────────────────────┘
```

### Setting it up

WezTerm runs on Windows, and the repo and every session run in WSL (Ubuntu).

1. **Clone the repo in WSL** at `/home/jt0629/projects/avel-factory`, the old repo's path once it's deleted.
2. **Give the leads their worktrees:**

   ```sh
   git worktree add --detach ../avel-factory-wt/axis main
   git worktree add --detach ../avel-factory-wt/zero main
   ```

3. **Make the key files** in WSL's `~/.config/avel/` (section "Keys" below), then `chmod 600 ~/.config/avel/*.env`.
4. **Your WezTerm config** is `C:\Users\javar\.wezterm.lua`. Sections 1 to 5 are your own settings, and section 6 loads the team part from the repo over `\\wsl.localhost`:
   - The team part is `tools/wezterm/avel.lua`: the tabs, seats, colours, picker, switcher and badges. The roster changes there, through a reviewed PR.
   - If WSL isn't running or the repo isn't cloned, WezTerm still starts, and leader then v tells you why.
5. **Leader (Ctrl+a) then v** opens the "avel" workspace, or switches back to it, adding any tab that's missing. Opening a WSL shell in the repo does the same (`__avel_auto` in `~/.bashrc`).
   - **Leader then 1 to 6** jumps between tabs.
   - **Leader then a** lists every seat with its status; **leader then z** zooms a seat and back.
   - **Leader then s** opens one task doc by hand, in its own tab.
6. **Badges and toasts** come from the session hooks: `scripts/hooks/session.py`, wired in `.claude/settings.json`. A dot on a tab means a session needs you; a tick means a turn finished that you haven't looked at.

- **The building tabs show a shell until ticket T-B0 lands.** That ticket writes the dispatch kit (`scripts/render.py`, `dispatch.sh`, `agent.sh`) and `scripts/agents/lane.sh`, the loop each pane runs. The loop asks `dispatch.sh` for its agent's next ready task doc, then opens it in the pane through `agent.sh`: a fresh worktree, then `claude --agent <name> "/dispatch <task doc>"`, under the `Build rules.md` limits.
- **How each seat is set up** (`Agents, identities and system prompts.md`):
  - OSA and the leads start with their system prompts from `.agents/system/`. Until a lead's checkout has its file, a short brief stands in.
  - The builders and checkers start with their identities from `.claude/agents/`, and get their work only through dispatch.
- **No key is ever in the Lua file or the repo.** Each pane loads its own key file when it starts.

## What I'd add

1. **The Ops tab for you.** It's already in the layout: Postgres, servers, git and `avel` live there, so the agents' tabs stay theirs.
2. **Names for the four helpers** (done Nov 15). They carry the names their roles have in the mission roster, so there's one vocabulary:
   - backend: **Soap** builds and **Rigg** checks;
   - frontend: **Fantem** builds and **Fenn** checks.

   Each has an identity file in `.claude/agents/`.
3. **Zane, on call, for full-rigor security reviews.**
   - He's headless, with no tab, and runs only when a full-rigor PR is ready.
   - He takes over step 2 of `Build rules.md` G7 from the other lane's lead, so both leads keep planning.
   - Step 1 is mostly full rigor (sign-in, step-up, jobs, events), so this pays for itself early. It costs about one Opus session per full-rigor PR.
   - Recommended. If you say yes, G7 changes to name him.
4. **No more writers yet.** Add a lane only when the queue is empty and your reviews keep up (`AVEL agent system.md` §10).
5. **Later: run the lanes in sandboxes** (MIOSA rooms, once CR-22 is accepted), so building continues when your laptop sleeps.

## The outside environment

| What | Why | When | What you set up |
| --- | --- | --- | --- |
| **Your machine** | Where the team runs | Now | WezTerm, Git, Docker, Node 22.12+, pnpm 10, Claude Code, GitHub CLI (`gh`), OSA, the MIOSA CLI |
| **GitHub** | The repo and the board: issues, PRs, Actions | When you create the repo | The new private `avel-factory` repo and the private factory repo (`factory.yaml`, skills, rules). A machine user `avel-bot` for the agents. Branch protection on `main` with the required checks, and CODEOWNERS for full-rigor paths. |
| **Anthropic Console** | Model access | Now (build team); Step 2 (factory) | Two workspaces, each with a monthly spend limit: **avel-build** for the team's sessions, and **avel-factory** for the factory's model proxy. Or your Claude plan's login for the team, with no key. |
| **MIOSA** | OSA's models now; sandboxes later | Now | The Developer plan, and a service account for OSA with an AI gateway budget |
| **AWS** | KMS: envelope encryption and the receipt signing key | Steps 3 and 4 | An account, two KMS keys, and two IAM principals (below) |
| **A Linux host** | gVisor rooms and the isolation suite | Step 2 | Undecided (CR-3). gVisor runs only on Linux, so if your machine is a Mac, rooms run on a Linux VM or host. CI already runs on Linux. |
| **npm** | Publishing the `avel` CLI (`npm i -g avel`) | Step 5 | An npm account or org, and a publish token for CI |
| **Domain** (`avelco.dev`) | The control room's address and TLS | When the factory is hosted | DNS records for the host |
| **Later** | Upload storage, voice transcription, mail | Step 7, and later | Each provider is still to be chosen (open items below) |

## Keys

### A. The build team, on your machine (needed now)

| Key | For | Scope | Lives in |
| --- | --- | --- | --- |
| **Claude Code sign-in** | Axis, Zero, the builders and checkers | Either your Claude plan's login (nothing to store), or `ANTHROPIC_API_KEY` from the **avel-build** Console workspace with a monthly spend limit | `leads.env`, `agents.env` (only if you use the key) |
| **`MIOSA_API_KEY` for OSA** | OSA's models | A service-account key (`miosa service-account new osa`, then `miosa service-account key new`), with a gateway budget set to CR-29 decision 4 ($30 a month recommended) | `osa.env`, wherever OSA's provider setting reads it |
| **GitHub token: OSA** | Filing tickets, reading PRs and CI | Fine-grained, the `avel-factory` repo only: Issues read and write; Pull requests, Actions, Contents and Metadata read. **No Contents write**, so it can't push or merge (rule A1). | `osa.env` as `GH_TOKEN` |
| **GitHub token: agents** | Builders and checkers push their ticket branches and open PRs | `avel-bot`, fine-grained, that repo only: Contents and Pull requests read and write; Issues and Metadata read. Branch protection keeps it off `main` except through a PR. | `agents.env` as `GH_TOKEN` |
| **GitHub token: leads** | Merging standard PRs | The same as the agents' token. Full-rigor merges are held for you by CODEOWNERS: you own those paths, and "require review from code owners" is on. | `leads.env` as `GH_TOKEN` |

- **The dollar limits in `Build rules.md` D2 need API billing.** On a Claude plan, the turn and time limits still hold, and the plan's own usage limits apply.
- **Every GitHub token expires within 90 days.** OSA warns you a week before.
- **For Step 1 itself you need nothing more.** `BETTER_AUTH_SECRET` is generated locally (`openssl rand -base64 32`), and the operator password is typed at the seed's prompt.

### B. The factory server, step by step

These are the variables in `.env.example`.

| Step | Key | What it is | Held by |
| --- | --- | --- | --- |
| 1 | `DATABASE_URL` | Postgres | The server |
| 1 | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Sign-in's signing secret and the public base URL | The server |
| 1 | `AVEL_OPERATOR_EMAIL` | Read once by the seed (the password is typed, never stored) | The seed |
| 1 | `AVEL_FACTORY_REPO_URL`, `AVEL_FACTORY_REPO_TOKEN` | The private factory repo, read-only (Contents read, that repo) | The server |
| 1 | `GITHUB_WEBHOOK_SECRET` | Verifies the factory repo's webhooks | The server |
| 2 | `ANTHROPIC_API_KEY` | The factory's model key, from the **avel-factory** workspace with a spend limit (the backstop) | **The model proxy only** |
| 2 | `MIOSA_API_KEY` | Rooms on MIOSA, if CR-22 is accepted (internal and template missions only) | The compute adapter |
| 3 | `AVEL_RECEIPT_SIGNING_KEY_ID` | An asymmetric KMS key that signs receipts; the private key never leaves KMS | The gate |
| 4 | `AVEL_KMS_KEY_ID`, `AWS_REGION`, `AWS_PROFILE` | The envelope key for the `secrets` table | Two IAM principals (below) |
| 5 | `NPM_TOKEN` | Publishes the CLI | A CI secret, on the publish job only |
| 7 | `AVEL_BLOB_STORE`, `AVEL_TRANSCRIBE_*` | Upload storage, and voice-to-text for Canon (CR-W19) | The server |
| Later | `OPENAI_API_KEY` or another vendor's key | A second vendor for Retry 3 (CR-5) | The model proxy only |

- **Two AWS principals for Step 4:**
  - **avel-server** may encrypt (`kms:GenerateDataKey`), and may decrypt only secrets tagged as read tokens.
  - **avel-delivery** may decrypt write tokens.

  The tag is a KMS encryption context (for example `purpose=write`) checked in each principal's key policy. That's how "only the delivery worker decrypts client write tokens" is enforced by AWS, not just by code.
- **Client GitHub tokens are never environment variables.** You enter them in the app, with step-up, and they're stored envelope-encrypted.

### C. CI (GitHub Actions)

- **No secrets to build and test.** Postgres runs as a service container.
- **`NPM_TOKEN` from Step 5,** on the publish job only.
- **The secret scan** needs no key.

### Rules for every key

1. **One key, one holder.** Each key belongs to one process or one role, and nothing else gets a copy.
2. **The factory's model key never goes in your shell profile.** Claude Code reads `ANTHROPIC_API_KEY` too, so your build sessions would bill the factory's key, and the key would reach places it shouldn't.
3. **Least scope, and an expiry.** Each token gets only the permissions in its row above, on only the repos named, and expires within 90 days.
4. **Key files live outside the repo,** in `~/.config/avel/`, mode 600. The repo has only `.env.example`, and `.gitignore` refuses `.env*`.
5. **A leak stops the cycle** (`Build rules.md` J4): OSA pauses every session, and you rotate the key before work resumes.

## The model path (decided Nov 15)

- **Now:**
  - OSA runs on MIOSA (CR-29).
  - Axis, Zero, Soap, Rigg, Fantem and Fenn run on Claude, through your Claude plan.
- **The goal:** every build agent on MIOSA-backed models, when it's affordable and when the numbers prove it.
- **How a builder moves over** (the roster's rule): only when its live numbers on the same work match or beat Claude. Those numbers are first-attempt pass rate, blocking findings per PR, and cost per merged PR.
- **The trial, when you're ready:**
  1. Start with one seat: Soap's standard tickets (never full rigor), on Kimi K2.7 Code through MIOSA's gateway.
  2. Claude Code speaks Anthropic's API, and MIOSA's gateway speaks OpenAI's, so the trial seat needs a harness that speaks OpenAI's (for example OSA's own, or the CR-5 adapter once it exists). Its task docs and `/dispatch` stay exactly the same.
  3. Run it side by side with Claude Soap on comparable tickets for a cycle or two. OSA's digest shows both seats' numbers.
  4. You decide from the digest. The checkers move last, because they decide what "done" means.
- **Cost:** the trial runs on MIOSA credit under OSA's gateway budget, or a separate one for the trial seat. Set it before the first run.

## Open items

- [ ] **OSA's start command,** passed as `osa_cmd`.
- [ ] **Zane on call** for full-rigor security reviews (recommended).
- [x] **Names for the four helpers:** Soap, Rigg, Fantem and Fenn by default, each with its identity file in `.claude/agents/` (Nov 15). Renaming one means renaming its file and the `agents` option in `avel.lua`.
- [x] **Claude for the builders (decided Nov 15).** The leads, builders and checkers stay on Claude through your Claude plan's login. The plan (Max or Ultra) is still to pick; Ultra is recommended for six seats. On a plan, D2's turn and time limits hold, and its dollar limits don't.
- [ ] **Trial MIOSA's models for builders** (the goal: MIOSA-backed agents, once it's affordable and proven). See "The model path" above.
- [ ] **Which blob store** the Drive storage port uses (confirm from avel-server before Step 7).
- [ ] **The transcription provider** for voice (Step 7).
- [ ] **The factory's Linux host** (Step 2, CR-3).
- [ ] **The CODEOWNERS paths** for full rigor (written in T-B0, from `Build rules.md` C4).
