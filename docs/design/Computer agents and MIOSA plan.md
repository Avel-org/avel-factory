# Computer Agents and the MIOSA Plan

Nov 5, 2026 · @javaris

Agents can run on MIOSA's $20 Developer plan instead of Docker. Code agents go in sandboxes, and a few agents get desktop computers to see the app, reverse-engineer client systems and win clients.

- **MIOSA Developer works:** 50 sandboxes and 5 computers at once. The factory peaks at 7 sandboxes.
- **No Docker needed today:** `scripts/agent.sh` already uses plain git worktrees and local `claude`. MIOSA is for moving agents off the laptop.
- **Computers, not sandboxes, for 3 to 4 agents:** Breach, Fenn's exploratory pass, Zero's visual review, and a new reverse-engineer agent.
- **Money:** free audits bring clients in, and paid discovery turns them into rebuilds. Data migration and retainers follow.
- **The catch:** work inside clients' systems with their data needs per-client machines, a vault, recording, and a SOC 2 report and BAAs. Public-site audits need none of that.

## MIOSA on the $20 Developer plan

These limits come from [miosa.ai/pricing](https://miosa.ai/pricing), read Nov 5, 2026. They have changed since the Oct 31 sandbox doc, which said 5 sandboxes and 16 vCPU and capped us at 4 dispatches.

| Developer plan ($20/mo) | Now |
| --- | --- |
| Sandboxes running at once | 50 |
| Computers running at once | 5 |
| Total running | 64 vCPU / 128 GB |
| Largest machine | 4 vCPU / 8 GB |
| Included usage | $20 credit, then billed at the same rates (no hard stop) |
| Egress | 100 GB/mo |
| Isolation | Firecracker virtual machines (answers an open question in the sandbox doc) |

**Sandboxes vs computers:** a sandbox runs code and processes and includes a browser that scripts like Playwright can drive. A computer is a full Linux desktop (Xfce) with a real browser, desktop streaming and human takeover. Computers always run with a visible desktop (no headless mode), and browser cookies don't persist by default. The two cost the same at the same size.

### Cost

| Size | Machine | Per hour | 7 machines, 8-hour day |
| --- | --- | --- | --- |
| small | 2 vCPU / 4 GB | $0.0893 | about $5 |
| medium | 4 vCPU / 8 GB | $0.1785 | about $10 |

At `small`, the $20 credit lasts about 4 build days, then about $100 to $110 a month at that pace. Model tokens still cost far more than the machines. A stopped machine bills for its disk only.

## MIOSA mode for `scripts/agent.sh` (sketch, not built)

One sandbox per dispatch, so the rule of one session per attempt holds:

1. `miosa create <team>-<sprint>-<task>-a<N> --size small --idle-timeout 2h --ttl 2h --meta branch=<branch> --wait`
2. Clone `Avel-org/avel-factory` at the start commit, check out the attempt branch, and run `pnpm install`.
3. The WezTerm tab runs `miosa console <name> -- claude --agent <agent> "/dispatch ..."`.
4. On finish, push only the attempt branch. Parking records the branch head.
5. `miosa destroy <name> --yes`. Every retry gets a fresh sandbox.

The limit of 6 dispatches and the tab titles stay the same.

### Gaps to close first

| Gap | Why it matters | Plan |
| --- | --- | --- |
| Idle stop | MIOSA's list of what keeps a sandbox awake doesn't include outbound traffic. An agent waiting on the model may look idle, and a stop kills Claude Code | Set `--idle-timeout` and `--ttl` above the 60-minute cap, then test on a real sandbox |
| Dashboard | Our hooks call `scripts/hooks/session.py` in the main checkout, which a sandbox can't reach | A small reporter in the sandbox, or the dashboard reads `miosa list --json` |
| Repo access | A sandbox can't see the laptop's worktrees | Clone from GitHub with a token limited to the attempt branch. Allow `git push` for that branch only in sandbox sessions |
| Model key | Claude Code in a sandbox needs the key, but our design says no model key in a room | Use MIOSA secrets (the sandbox sees a placeholder and the egress proxy swaps in the real value). That's documented only in the SDK, not the CLI. Fine while you're the only user; not for the factory's real dispatch rooms |
| Image | The docs don't say whether git and pnpm are preinstalled (Node is) | First sandbox: `git --version`, `node --version`, `pnpm --version`. Save a snapshot per stack |
| Egress | New sandboxes start in audit-only mode, so nothing is blocked | Switch to enforce with an allowlist (GitHub, the npm registry, the model API) |

## Who gets a computer

A computer is only worth it when an agent needs to **see pixels, keep a logged-in session, or let you take over**. Everything else runs in a sandbox.

| Agent | Fit | Why |
| --- | --- | --- |
| **Reverse engineer** (new) | Best fit | Walks through a client's existing system like a user. See below |
| **Breach** (red team) | Best fit | Attacks our running app like a real user, with logged-in sessions and multi-step flows. You can watch or take over when it finds something |
| **Fenn** (exploratory pass only) | Strong | Its exploratory pass is "use the app like a human." Scripted e2e tests and visual snapshots stay in a sandbox |
| **Zero** (UI review) | Good | Reviews built screens against the design library by looking at them, which catches what a diff can't |
| **Leah** (a11y/perf) | Partial | Lighthouse and Web Vitals run in a sandbox. A computer only helps for keyboard-only and real-screen checks |
| Builders, Axis, Brennan, Zane, Rigg | No | Code and terminal work. A sandbox is cheaper and enough |
| **Client acquisition** (new) | No | Research and writing. See below |

### Splitting the 5 computers

| Computer | Use |
| --- | --- |
| 1 | Reverse engineer |
| 2 | Breach |
| 3 | Fenn's exploratory pass and Zero's visual review, taking turns (they rarely overlap) |
| 4 | Leah, or a spare |
| 5 | Yours: watching sessions and taking over |

## New agent: reverse engineer

**Job:** map a client's existing system so we can rebuild it. The agent clicks through every screen and flow, watches the network calls in DevTools, and works out the data model and API from what it sees. Its output is a rebuild spec covering screens, flows, endpoints and fields. Axis and Zero turn that spec into contracts, so this agent sits upstream of both leads.

| Target | Machine |
| --- | --- |
| Web app or SaaS product | Computer: a real logged-in browser, with human takeover for logins, 2FA and captchas |
| Desktop app | Computer, Linux only. A Windows-only app needs Wine or another provider |
| Binaries or bundled code | Sandbox: Ghidra and jadx run without a screen |

**Rule:** only systems the client owns or has authorized us in writing to analyze. Never a competitor's product: turning someone else's product into a spec to rebuild it raises terms-of-service, copyright and anti-circumvention problems. This rule goes in its task doc, the way Breach is limited to our own app.

## New agent: client acquisition

**Job:** find prospects, read their sites, qualify them, draft personalized outreach and keep the CRM current. All of that runs on web search and APIs, so the agent needs no desktop.

**Rule:** the agent researches and drafts, and **you approve and send**, like the factory's gates.
- **No automating LinkedIn or Sales Navigator.** LinkedIn's terms ban automation and it detects it, so your account could be banned.
- **No automated sending from your accounts.** That brings CAN-SPAM, deliverability and domain-reputation risk.

## Using computer agents to make money

Ranked by how soon each can start.

### 1. Free audits as the sales hook (can start now)
Leah and Fenn review a prospect's **public** website for slow pages, accessibility failures and broken flows. They deliver a short report or screen recording: "Here are 12 things wrong with your site, and here's what a rebuild fixes." This becomes the client-acquisition agent's opener, so outreach starts by handing over something useful instead of a cold email.

**Line:** public pages and normal browsing only. **No security testing without written permission.** Breach probing a site uninvited is unauthorized access, even as a "free audit."

### 2. Paid discovery: map the system and quote the rebuild
The reverse engineer maps the client's existing app and produces the rebuild spec plus a fixed quote. Discovery normally takes a consultant weeks; this takes days. Sell it as a paid first step, with the fee credited toward the rebuild if they sign. A small computer costs about $0.09 an hour, so model tokens are the real cost, and even a heavy session costs far less than discovery sells for.

### 3. Data migration from systems with no API
Rebuilds often get stuck on "our data is trapped in this old tool." A computer agent clicks through the old system's screens and exports to get the data out. The work is tedious, high-value and easy to price, and few agencies automate it.

### 4. Retainers after launch
Ongoing care for apps we've rebuilt: Fenn runs the key user flows nightly, Leah tracks speed, and Breach does a red-team pass every quarter. That's recurring revenue on computers already paid for.

**The loop:** free audits bring prospects in, paid discovery turns the interested ones into rebuilds, and retainers keep them.

### Stay away from
Computer agents on gig platforms, bot accounts, automated social posting, or anything that poses as a human user at scale. It breaks platform terms, is often fraud, gets accounts banned, and puts the agency's name on it.

## The catch

Plays 2, 3 and 4 put agents **inside clients' systems with clients' data**. The sandbox doc parks client-facing computer use under "Not now" on purpose. Before any of those plays, each client needs:

- **Its own machine**, never shared with another client or with factory work
- **A credential vault** for the client's logins, so they never sit in a task doc or env var
- **Session recording** of everything the agent does in the client's system
- **Written authorization** of what the agent may access and analyze
- **For healthcare or finance clients:** a SOC 2 report and BAAs (business associate agreements) from both the compute vendor and the model vendor. MIOSA hasn't stated either one yet

Free audits of public sites (play 1) need none of this, so they can start right away.

## Open questions

- [ ] Which clients come first: local businesses, SaaS startups, or enterprises with legacy systems? This decides which play leads.
- [ ] MIOSA: does a process waiting on the model count as idle? Test it on one sandbox.
- [ ] MIOSA: are git and pnpm in the main image?
- [ ] MIOSA: SOC 2 and BAA status, before any client data.
- [ ] MIOSA: CLI flags for secrets, `persistent` and `always_on` (documented only in the API and SDK).
- [ ] Pricing for paid discovery, audits and retainers.
- [ ] Reverse engineer and client acquisition: add both to the roster as agents 16 and 17, or keep them outside the build crew as a business team?

## Sources

- [MIOSA pricing](https://miosa.ai/pricing): plans, limits, rates
- MIOSA docs on [sandboxes](https://miosa.ai/docs/develop/sandboxes/) (including sizing and timeouts), [computers](https://miosa.ai/docs/computers/overview/), [the CLI](https://miosa.ai/docs/cli) and [known limitations](https://miosa.ai/docs/known-limitations/) (updated Oct 11, 2026)
- `docs/design/Sandbox - Docker now, boat or MIOSA next.md`: the room design, the trust boundaries, and computer use for clients deferred
- `docs/design/Roster setup and sessions.md`: the roster, sessions and the limit of 6
