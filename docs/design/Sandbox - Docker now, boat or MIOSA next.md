# Agent Sandboxes: Docker Now, Boat or MIOSA Next

Oct 31, 2026 · @javaris

The factory runs agents in hardened Docker rooms on a dedicated host now, and can move to cloud machines later. The design grades A after three review rounds (C+, then B+); the grade holds once the isolation suite passes on the real host.

- **Now:** one gVisor room per dispatch on a dedicated US server, plus an integration room that lands only the exact commit it tested.
- **Trust boundaries:** no model key in a room, an offline package cache, a per-dispatch token revoked on every exit, and an isolation suite that blocks the build.
- **Host:** an 8 vCPU / 32 GB dedicated-CPU server to start, from about $64 to $166 a month depending on the provider.
- **Later:** the same rooms on cloud machines behind the `compute` interface. Boat first (about 555 machine-hours for $20), MIOSA as the alternative (about 112 hours for $20).
- **Not now:** computer-use agents for clients. They need per-client virtual machines and compliance work of their own.

## The strategy now: Docker rooms

Every dispatch runs in its own hardened room on a dedicated factory host, and every finished module is tested in a separate integration room before it lands. The room code, check runner and file guards exist in avel-server; the hardening below was added on Oct 31 after the first review.

| Part | Rule | Status |
| --- | --- | --- |
| Host | A dedicated Linux server in a US region that runs only the factory and its rooms, never your laptop. A default-deny firewall on the Docker bridges backs up the proxy | Decided; provider not chosen |
| Runtime | gVisor for every room, the integration room included; no added privileges; read-only root filesystem; limits on processes, memory, CPU and disk; no Docker socket; images pinned by digest | New |
| Model key | Stays on the host. A proxy adds it, allows only the messages endpoint, requires the dispatch's token, and enforces the 500,000-token cap itself | New |
| Tokens | One per dispatch, revoked on every exit: finish, kill, crash, or leftover | New |
| Network | Its own internal network. The only way out is an egress proxy to the model proxy and an offline package cache filled from the lockfile. The proxy answers DNS, blocks the metadata address, and logs every request per dispatch | Partly ported (registry-only proxy) |
| Git | Clones over HTTP with no shared files, and pushes only its own branch with a per-room credential. The mission repo is never mounted | New |
| File guards | Refuse path traversal, symlinks and writes to `.git` | Ported as-is |
| Lifetime | Killed at 60 minutes. Every retry gets a fresh room and clone. Parking records the branch head and destroys the room. Leftovers are cleaned after a restart | New |
| Integration room | Fresh, with no network and no repo credential. Restores the locked tests and their config, and counts the locked tests that ran and passed against the manifest. Only the orchestrator moves the branch, one commit at a time | New |
| Proof | An isolation suite inside a real room must fail every escape attempt. It blocks the build in CI, and runs on the production host at startup and nightly | New |

Up to 6 dispatch rooms plus the integration room run at once, which needs a runner pool. The old code assumed 1–2 jobs at a time.

## Where the host comes from

Start with one dedicated-CPU server of 8 vCPU / 32 GB in a US region, and move to 16 / 64 if rooms queue. Agents spend most of their time waiting on the model, so 7 rooms rarely need a full core each; builds and tests are the bursts. gVisor runs on an ordinary cloud server without special hardware.

| Option | Size | Per month | Notes |
| --- | --- | --- | --- |
| Hetzner Cloud CCX33, Ashburn or Hillsboro | 8 dedicated vCPU / 32 GB | $165.99 | After Hetzner's June 15, 2026 price rise |
| Hetzner Cloud CCX43, Ashburn or Hillsboro | 16 dedicated vCPU / 64 GB | $329.49 | Same |
| 3HCloud dedicated, Dallas | 8 dedicated vCPU / 32 GB | $64, storage extra | Closest to Austin. Figure from a comparison post; confirm on 3HCloud's site |
| 3HCloud dedicated, Dallas | 16 dedicated vCPU / 64 GB | $128, storage extra | Same |

Hetzner's cheaper bare-metal servers are in Germany and Finland only, so they don't meet the US-region rule. Client apps never run on this host; they go on separate hosting.

## Cloud providers compared

Boat is about five times cheaper per hour than MIOSA at the same machine size, and it says plainly that each sandbox is a full virtual machine. MIOSA's edge is published limits, desktops for later, and hosting for the factory itself in one place.

|  | [boat](https://boat.dev) $20 plan | [MIOSA](https://miosa.ai/pricing) Developer | [MIOSA](https://miosa.ai/pricing) Business |
| --- | --- | --- | --- |
| Monthly minimum | $20 | $20 | $500 |
| What the minimum buys | 2,000,000 VM-seconds, about 555 hours of a 4 vCPU / 8 GB machine | $20 of usage credit | $500 of usage credit |
| 4 vCPU / 8 GB, per hour | $0.036 | $0.1785 | $0.1785 |
| 8 vCPU / 16 GB, per hour | $0.072 | Not allowed (4 vCPU / 8 GB max) | $0.357 |
| Running at once | 100 to 2,000 sandboxes, by plan | 16 vCPU / 32 GB in total; 5 sandboxes, 3 desktops | 64 vCPU / 128 GB in total; 25 sandboxes, 20 desktops |
| Isolation | Full Ubuntu virtual machine (hypervisor not named) | Not stated | Not stated |
| Desktop for computer use | Yes, 60fps virtual desktop | Yes, "computers" at about half a sandbox's price | Yes |
| Idle behaviour | Stops after 1 hour by default; you can override it | Pauses after 30 idle minutes (accounts opened since Oct 11, 2026) | Same |
| Regions | EU only: Germany, Finland, France | Not stated | Not stated |
| SOC 2 or BAA | Not mentioned | Not mentioned | Not mentioned; BYOC on AWS or Google Cloud by consultation |
| Also hosts | Snapshots and disk-level forks ($0.056 a day per snapshot) | Apps, Postgres, previews, snapshots | Same, plus 10 seats |

For reference, E2B and Daytona charge about $0.05 per vCPU-hour, which puts their 4 vCPU machine near $0.20 an hour plus memory. Boat is the cheapest of the group by a wide margin, and also the youngest: a 3-person team in Paris.

## How each fits the factory

The factory needs 7 machines at its peak: 6 dispatch rooms plus the integration room. Boat and MIOSA Business hold that easily; MIOSA Developer tops out at 5 machines, so it caps you at 4 dispatches.

The cost column assumes a mid-size mission of about 20 machine-hours at 4 vCPU / 8 GB: roughly 16 dispatches of up to an hour each, plus the integration room. That's an estimate until real missions are metered.

| Option | Machines at once | Largest machine | Compute for a 20-hour mission | Fits the factory? |
| --- | --- | --- | --- | --- |
| Docker on your machine | Limited by your machine | Your machine | $0 extra | Yes, while you're the only user and your machine stays on |
| Docker on a VPS | Limited by the VPS | The VPS | The VPS bill, whatever its size | Yes, and the factory keeps running when your laptop sleeps |
| boat $20 plan | 100+ | 8 vCPU / 16 GB | About $0.72, inside the 555 included hours | Yes, with room to spare |
| MIOSA Developer | 5 | 4 vCPU / 8 GB | About $3.57, inside the $20 credit | Only with the cap lowered to 4 dispatches |
| MIOSA Business | 25 | 8 vCPU / 16 GB | About $3.57, inside the $500 credit | Yes, but $500 a month before you need it |

Compute is small next to model spend: a dispatch can use up to 500,000 weighted tokens, which costs more than its machine-hour on any of these. Boat's EU-only regions add some latency to each model call from Europe, which matters little for agents that spend most of their time waiting on the model.

## Moving off Docker

The rest of the factory only ever talks to the `compute` interface, so switching to boat or MIOSA is a new adapter, not a redesign. The interface stays small:

| Call | What it does |
| --- | --- |
| `createRoom(spec)` | Start a room from a stack image, with size, limits, network allowlist, secrets and a time limit |
| `exec(room, cmd)` | Run a command, streaming output to the event stream |
| `syncRepo(room, branch)` | Clone the mission repo into the room, and later push the room's branch back |
| `stop(room)` / `resume(room)` | Pause billing and keep the disk |
| `destroy(room)` | Remove it and everything in it |

What changes per provider:

- **Stack images become snapshots.** A Docker base image becomes a saved machine per stack that each room forks from.
- **The mission repo has to be reachable.** On Docker it sits on the host. In the cloud, rooms pull and push over SSH or HTTPS to the factory server, each with a credential that only works for its own branch.
- **The network allowlist moves.** Docker enforces it with a network and proxy. Neither boat nor MIOSA documents egress controls, so the factory would enforce it inside each machine until they do.
- **Time limits get set on every room.** Boat stops machines after 1 hour by default and MIOSA pauses them after 30 idle minutes. Both must be set longer than the 60-minute dispatch cap.
- **Desktops come for free.** Both providers have them, which is what the later computer-use phase needs.

## Strategy grade: A for the design, up from C+

An independent reviewer graded the first version C+, the second B+, and the current design A. The grade covers the design only: it holds once build step 3 is done and the isolation suite passes on the real production host.

| Round | Grade | What moved it |
| --- | --- | --- |
| 1 | C+ | The right shape, but plain Docker, an undecided host, the model key inside the room, and network limits nobody had tested |
| 2 | B+ | All six must-fixes in. Retries still reused a possibly compromised room, the package cache could leak data, and the key proxy and the integration verdict could be abused |
| 3 | A | Every trust boundary is enforced outside the room: the key proxy, the offline package cache, a reporter the factory controls with an exact test count, only the orchestrator moving the branch, and the isolation suite in CI and on the host |

**To keep in mind while building (none blocks the A):**

- A package the factory has never used needs your approval, and one dispatch can request at most 3 new ones. Otherwise dependency requests become a way out for a compromised builder.
- The test-count check is a tamper signal, not proof. Restoring the locked tests and checking their hashes carries the weight.
- Patch the host and gVisor on a schedule. The nightly isolation run proves things work today, not that the host is current.

**Deferred on purpose:** a warm dependency layer per mission, installing first and then cutting the network to the model only, and the second model vendor. They're about speed, not safety.

**Reviewer positions now in the design:** integration stays serial, with batching dropped; the second vendor is built last; cloud vendors come later; rooms run on a dedicated host.

**On vendors:** use boat or MIOSA only for overflow until each puts its isolation and a SOC 2 in writing. Computer-use agents for clients are a separate product needing per-client virtual machines, BAAs from both the compute and model vendors, session recording and a credential vault.

## Open questions

- [ ] Which provider for the dedicated host: Hetzner in Ashburn or Hillsboro, 3HCloud in Dallas, or another US provider?
- [ ] Boat: which hypervisor isolates each machine, and does it have egress controls or a US region on its roadmap?
- [ ] MIOSA: are sandboxes virtual machines or containers, and does an agent waiting on the model count as idle?
- [ ] Either provider: SOC 2 or a BAA, before any client data from healthcare or finance touches a room.
- [ ] MIOSA: the price table says builds are free, but the FAQ says they're billed per minute. Which is right?

## Sources

- [boat.dev](https://boat.dev): pricing, sizes, regions, snapshots
- [boat docs: quickstart](https://docs.boat.dev/): virtual machine isolation, time limit, API
- [MIOSA pricing](https://miosa.ai/pricing): plans, limits, rates, idle pause, BYOC
- [MIOSA](https://miosa.ai/): sandboxes, computers, SDKs
- [Bug0: E2B vs Vercel Sandbox vs Daytona vs Modal](https://bug0.com/blog/ai-sandbox-coding-agents): E2B and Daytona per-vCPU rates
- [EveryDev: boat](https://www.everydev.ai/tools/boat): team size and location
- [Hetzner US CCX prices after June 15, 2026, and 3HCloud comparison](https://dev.to/m_maksimovic_/affordable-alternative-to-hetzner-for-us-companies-3ad9): host prices (a comparison post; confirm on each provider's site)
- [Hetzner locations](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/): US regions in Ashburn and Hillsboro
- [gVisor at Tencent, April 2026](https://gvisor.dev/blog/2026/04/23/scaling-agentic-rl-sandboxes-to-the-millions-with-gvisor-at-tencent/): gVisor correctness on agent workloads
