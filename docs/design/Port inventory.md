# Port inventory: what moves from the Command Center

> Exported from the AVEL Software Factory design doc (Port inventory tab, rev 51) on Nov 1, 2026.

**Verdict:** carry over the engine parts, rebuild the cockpit, and start the UI fresh. From avel-server, the gate, the Docker rooms and check runner, the delivery guards, the pure libraries, client records and Drive storage move over. That's about 14,600 of 42,700 lines as-is or with named changes, including the client and Drive code moved back in on Oct 31. From avel-web, no code moves: the UI and its design system are rebuilt from scratch, and what avel-web taught is kept as rules for the new one. Everything built around you doing each step by hand stays behind, as does consent. The factory starts with a fresh database schema and one shared contract package, which also ends avel-web's type errors.

|  | Port as-is | Port with changes | Reference only | Leave behind |
| --- | --- | --- | --- | --- |
| avel-server (lines) | 1,600 | 13,000 | 14,400 | 13,700 |
| avel-web (lines) | 0 | 0 | 27,700 | 51,700 |

Both scans were read-only, at avel-server `b680edc` and avel-web `fa08ea9`. No builds or type checks were run. The counts include the Nov 1 review, which moved the gate core, check runner, token usage and delivery guards from as-is to with changes, and added clients, Drive and three missed modules to the port list. The second Nov 1 review moved the citation check to with changes (40 lines) and moved `src/routes/files.ts` (526 lines, an intake route) from Drive storage to reference only.

## The line that decides what moves

The Command Center is a cockpit: you fly every step. The factory is a production line: you approve what goes in and what comes out. A piece of the Command Center moves over only if it works on the production line *without you in the loop*, and only if it fits the factory's decisions. Nothing moves just because it exists.

| Verdict | Meaning |
| --- | --- |
| **Port as-is** | A self-contained library with a narrow interface, which works unchanged in the factory |
| **Port with changes** | The core is right, but it needs named changes to fit the factory |
| **Reference only** | The code is rewritten, and only its ideas and tests are reused |
| **Leave behind** | Command Center-only (manual steps), superseded, or against a factory decision |

What automatically means **leave behind**:

- screens or routes for creating and starting dispatches by hand (they become logged overrides only);
- hand-written plans;
- the AI-consent gating;
- anything tied to the Atlas map;
- anything that lets a model choose agents or work.

## avel-server (b680edc)

About a third of avel-server carries over: the pure libraries, the sandboxing, and the gate. Orchestration, routes and the database schema are built around the cockpit (manual dispatch, waves, Canon briefing clients, client tenancy, consent), so they're rewritten, using the old code as reference. None of the 60 migrations or 35 tables carry over: the factory starts a fresh schema.

| Verdict | Lines (approx., of 42,700) |
| --- | --- |
| Port as-is | 1,600 |
| Port with changes | 13,000 |
| Reference only | 14,400 |
| Leave behind | 13,700 |

| Area | Verdict | Factory module | What changes |
| --- | --- | --- | --- |
| Clock, ids, canonical JSON, tokens, logger, envelope, pagination, the idempotency header schema (10 lines), determinism script | **Port as-is** | contract | The idempotency store itself (`idempotency_keys`, with the body hash and the stored response) is new code, built in Step 1. avel-server has only the header schema and per-table unique keys. |
| Gate core: `decide()` v4, types, config, and the producers for secret scan, dependencies, protected paths and brief checks | **Port with changes** | gate | The parity baseline for v5, but its types import contracts that stay behind: `playbook` (`src/lib/gate/types.ts`, `config.ts`), `contract/gate` (`IGNORED_OVERRIDE_WHYS`, `REASON_EFFECTS`, the decide rules) and `contract/agent` (`FindingSeverity`, `FindingStatus`, the old finding lifecycle) in `types.ts`, `shared/status` (`CompletionStatus`), `intake` (`producers/brief-checks.ts`), and `agent-template`, `lib/roles`, `rooms/checkpoint` and `rooms/globs` (`producers/test-glob.ts`). Replace those imports with the plan tables and the new finding schema. The parity tests pin v4's exact inputs and verdicts, but not the old finding statuses, which v5 replaces. |
| Check runner and Docker runner (pinned image, registry-only proxy, no network) | **Port with changes** | runner, gate | Today it allows only `registry.npmjs.org`, pins pnpm and uses one image (`src/gateways/docker-check-runner.ts`). It becomes per-stack images by digest, run under gVisor, with packages from the offline cache. |
| Room primitives (path, symlink and `.git` refusals) | **Port as-is** | runner, compute | — |
| Delivery guards, blast radius, lifecycle; export zip, tree and order | **Port with changes** | delivery | guards.ts imports exportTargetKind from contract/mission, which stays behind. Replace that import with the factory's mission type. |
| Harness interface, step recording, token usage, prices | **Port with changes** | harness, metering | Cache writes are counted once, at the 1-hour price (`src/lib/prices.ts`, `src/runner/sdk-usage.ts`). Split 5-minute and 1-hour writes. The model proxy becomes the meter of record; the harness's own count is kept only as a cross-check. |
| Error union and status mapping, middleware, DB core | **Port with changes** | contract | Keep the mechanism. Drop most of the 94 cockpit-specific reasons and the role families. The error union becomes the one error contract (`{ code, message, details?, requestId }`), declared as typed oRPC errors. The legacy ts-rest route contracts in `src/contract/` port with changes: their Zod schemas carry over, upgraded to Zod 4, and the contracts are rewritten with `@orpc/contract` as noun routes (see API routes in the main tab). |
| Auth (Better Auth, allowlist by id) | **Port with changes** | contract, cli | Switch to email and password, invite-only, with one account (you) for now, plus an optional passkey and a 15-minute lockout after 10 failed sign-ins. Drop GitHub sign-in. Add the CLI's device-code login (12-hour sessions) and single-use step-up grants for credential actions only, as the API routes section of the main tab defines them. Approvals never ask for a password. |
| Activity log (append-only) | **Port with changes** | audit | New action list, plus the override log |
| Gate producers: test globs, spec check, prior findings, judge coverage (`producers/judge-coverage.ts`, 82 lines) | **Port with changes** | gate, knowledge | Read the plan tables, include `e2e/` and `fixtures/`, and use the new finding lifecycle. Judge coverage ports too: it's exported from `producers/index.ts` and wired into `gate/config.ts` (`judgeCoverageGate`) and `receipt/build.ts`, so Step 3's parity receipts need it. It keys to the new roster instead of roster entries. |
| Receipt (v5) | **Port with changes** | gate | Becomes v6: the evidence floor, e2e, and the ID chain |
| Worktree provider, sources, snapshot | **Port with changes** | compute, integrator | Each room clones the mission repo over HTTP with no shared files, and pushes with a per-attempt credential limited to that attempt's own branch (`mission/<id>/<module>/<role>-a<n>`). The mission repo is never mounted into a room. Drop the Windows-only paths |
| Agent rooms (Docker) | **Port with changes** | compute | One room per dispatch, an integration room, and a check room per attempt where Gate 3 runs with no agent and no network. They sit behind the compute interface, so boat (first) or MIOSA can replace Docker later |
| Agent SDK harness and its tools (already an in-process MCP server) | **Port with changes** | harness | Its control-plane tools move to the host tool server. The second vendor comes later. |
| Budget | **Port with changes** | runner | Replace the estimate-based ceilings with a 60-minute cap and a dollar cap per attempt ($4 by default, priced from `price_table` and set in `factory.yaml`). Token counts are kept for display only. |
| Plan checks, repo read | **Port with changes** | plan | Add dependencies, scenarios and check kinds. Drop the roster "cut" logic. |
| Export packaging, GitHub writer, repo policy, the webhook signature check (`signatureMatches` in `src/routes/github-webhook.ts`) | **Port with changes** | delivery | Package from the mission branch. Task docs replace `.avel/dispatches`. The writer has never run against GitHub. The webhook's constant-time HMAC check ports; the route around it is rewritten, and deliveries are deduplicated on `X-GitHub-Delivery`. |
| Skills: contract, content hash, tiers, routes, sources, the skill\_read tool, SKILLS.md | **Port with changes** | knowledge | Keep the layers, types, hashes and approval. Deliver through the Agent SDK's skills from outside the client repo, and keep `skill_read` only for the second vendor. Skills live in the factory repo and are selected by `factory.yaml`. Proving each skill in evals waits until evals are turned on. |
| Clients and connections | **Port with changes** | onboarding, delivery | Keep client records and the GitHub connection (about 620 lines). Each client has its own repo connection, and each connection holds two secrets in the server's write-only secrets interface: a read-only token, for onboarding's repo read and mirroring into the mission repo, and a write token, used only by delivery. Each has its own expiry. Rotating a token replaces the secret without changing the connection. This reverses avel-server's rule of storing only an environment-variable name and refusing pasted tokens (`src/contract/connection.ts`). Drop engagements and client-scoped tenancy, since you're the only user. That means re-keying: the legacy `connection` table hangs off a nullable `engagement_id` (`src/db/schema/platform.ts`), and the factory keys it by `client_id`, one connection per client. |
| Drive storage (blob gateway, schema) | **Port with changes** | onboarding | Becomes the store for Gate 0 uploads, linked to the session and the mission (about 310 lines: `src/db/schema/drive.ts`, `src/gateways/blob.ts`). Drop the client and engagement scoping: row-level security on `avel.client_id` and blob keys under `clients/<id>/` (also in `src/db/tx.ts`). Key uploads by mission. The old files route (`src/routes/files.ts`, 526 lines) is an intake route built on `intakeFileContract` and `withClientScope`, so it's reference only, like the other routes. |
| Integration planner (src/lib/gate/integration/plan.ts, 174 lines) | **Port with changes** | integrator | Keep the path-overlay planner. It already orders closed dispatches by `closedAt`, then id, and turns each into path-level write and delete operations, with conflicts reported by path. It has no wave code. The integrator wraps it to apply one attempt's commits at a time onto the current branch head as one integration commit. |
| Citation check (src/lib/canon/citations.ts, 40 lines) | **Port with changes** | onboarding | Keep only the quote matcher: a non-empty quote must appear verbatim, with line endings the only thing normalized. Its imports (`./knowledge`, 221 lines, and `./search-results`, 66 lines) belong to Canon fetch and client memory, which stay behind, so replace them with the uploads and message tables. Add what onboarding rule 4 needs and the old check lacks: citing a `message_id`, and checking a `[start, end]` span against the stored text. |
| Document parsing and blob upkeep (src/lib/documents.ts, src/db/blob-sweep.ts, src/db/blob-lock.ts, about 320 lines) | **Port with changes** | onboarding | PDF and DOCX parsing for uploads, plus orphan-blob sweeps and upload locks. Add Markdown, plain text and images, and a parse status. |
| Database schema and migrations | **Reference only** | all | Reuse the trigger, check-constraint and backfill patterns |
| Runner orchestration (`runner.ts`), brief renderer | **Reference only** | factory, runner | Rewritten for the scheduler and the 7-part task doc. The hashing functions carry over. |
| Gate job and gate routes | **Reference only** | factory, gate | One job at a time today. Reuse the semantics for a moved commit, an interruption and a timeout. |
| Canon's model loop | **Reference only** | onboarding | Reuse the claim-once turn and the SDK wrapper |
| Roles, identity generator, playbook | **Reference only** | roster, packages | Keep the rule that no side grades its own work. The idea of gate policy per playbook becomes the package profiles, defined in `factory.yaml`. |
| Findings and agent API, export routes, the webhook route | **Reference only** | gate, delivery | Rewritten for the new finding schema and the host tool server. The webhook has never received a real delivery; only its signature check ports (see Export packaging). |
| Canon fetch, chat and client memory; intake routes | **Leave behind** | — | Canon interviews only the operator, and Gate 0 replaces intake |
| Consent (Oct 28 merge) | **Leave behind** | — | The factory has no consent step |
| Presets, coherence, roster routes, agent templates | **Leave behind** | — | Built on cuts and waves, and Canon recommends the roster, which conflicts with "no model picks agents" |
| Proposals route, missions and dispatch routes, firm | **Leave behind** | — | A stub, and manual create and start |
| Knowledge entries (no write path), seed catalog | **Leave behind** | — | The three-layer knowledge base (global, stack, client) is a new design |

**Tests worth carrying over:**

- the gate unit suite, about 3,000 lines (`tests/unit/gate/`), which becomes the v4 parity baseline; the 1,430-line gate API test is reference only;
- the tests for the Docker check runner, agent rooms, room tools and worktrees;
- delivery and export;
- repo read, with its fixtures, and plan checks;
- budget, usage, steps and prices, plus the fake harness;
- foundation: envelope, errors, determinism, a real-socket server test, auth;
- database setup and migration-from-empty;
- the API test helpers.

Runner and dispatch API tests are reference only: they're tied to cockpit tables.

## avel-web (fa08ea9)

**No avel-web code moves over.** The UI is rebuilt from scratch, with a new design system. About two-thirds of avel-web's roughly 79,500 lines are Command Center screens for steps the factory automates or drops. The rest (design tokens, primitives, API client, shell, panels) is reference only. What carries over is what it taught, kept as rules for the new UI:

| Lesson | Where it came from | Rule for the new UI |
| --- | --- | --- |
| Shared contract types | The API client and response checks (`src/lib/api/`) | The API client is oRPC's typed client, built from the shared `contract` package, and every response is checked against it. |
| No unhandled errors | `error-map.ts` | Every error code maps to a message on screen. A new code breaks the build until the UI handles it. |
| Four states per region | Region states and panels | Every region of a screen handles loading, empty, error and ready, plus a live state. |
| One "needs you" inbox | The needs-you inbox | Everything waiting on you shows in one place, fed by the event stream. |
| One live feed | Six polling loops | The web view and `avel watch` read the same SSE event stream. No polling. |
| Streaming chat | Canon's chat polls every second | Canon's Gate 0 chat streams over SSE. |
| Guard tests | Navigation, icons, palette, fonts, error map, API keys | Conventions are enforced by tests that fail the build. |
| Real interaction tests | About 35,000 lines of screen tests that only render strings | Test what a person does (click, type, see the result), not rendered strings. |

**Why the type errors happen, and how the factory ends them.** avel-web links the server's contract as live source code from a sibling folder, and that link doesn't resolve in its own CI. So server changes reach the web app with nothing checking them. One concrete break: the Oct 28 consent merge added error and readiness codes that the web app's exhaustive maps don't handle. A shared, versioned `contract` package in the same workspace makes every contract change type-check on both sides at once. The exhaustive maps then become the useful part: a new case breaks the build until the UI handles it.

**What the new UI has to build that never existed:**

- an SSE client and event schema (today: six polling loops, and no SSE on the server either);
- the checkpoint review UI (0.1–0.4);
- the gate strip and module rows;
- live feeds for findings, rules and knowledge;
- the receipt's ID-chain table;
- knowledge-base and rules review;
- metrics charts (no chart library is installed).

## Docs and decisions worth carrying over

- **Carry over:**
  - `SANDBOX.md`, minus the Windows-specific parts.
  - `BLAST-RADIUS.md`.
  - `EXPORT-ENGINE.md` §13.
  - `DEV-TIPS.md`.
  - The six rules and the database traps from `CLAUDE.md`.
  - `CLIENT-CONTRACT-CONFORMANCE.md`, the problem the black-box alignment check answers.
  - `GOLDEN-FIXTURE.md`, the method only: golden tests for DISPATCH.md and the task docs, written by someone who never sees the renderer.
- **Keep in part:**
  - `ROSTER-V2.md`: the rule that no side grades its own work, the merge rules, and the known flaws. Not the named agents or the cuts.
  - `DECISIONS-V2.md`: the gate as a pure function, no inference in the gate, agents as callers.
- **Archive as evidence:** `SURPRISES.md`, `COST-LOG.md`.
- **Retire:** `COMMAND-CENTER`, `STATE`, `ROUTES`, `BUILDING-AVEL-WEB`, the `DAY-ONE` docs, `MISSION-001`, `COUNSELOS-STATE`, `STEP-9-PLAN`, `TEMPLATE-BOOKING`, `STUDY-GUIDE`, `SHADCN-PRINCIPLES`, `DESIGN-PLUGINS`, `LOGO-BRIEF`, and avel-web's AVEL-DESIGN.md (the UI starts fresh).

## Port order and risks

**Order.** Porting follows the single build order in the main tab, so each piece lands on something already tested. Steps are named as well as numbered, because the build order is renumbered as it changes:

- **Step 1 (scaffold):** pure libraries, error mechanism, middleware, DB core, test helpers, auth with email and password, step-up for credential actions, the CLI's device-code login, the activity log, and the new idempotency store.
- **Step 2 (host and rooms):** room primitives, agent rooms, the worktree provider, sources and snapshot with per-attempt push branches, the check runner rebuilt for per-stack images under gVisor.
- **Step 3 (gate v4 parity):** `decide()`, producers and receipt, with their cockpit imports replaced by fixture stubs until the plan tables arrive in Step 6 (plan, roster, packages), and the gate unit suite.
- **Step 4 (runner, harness, delivery):** the harness interface and fake harness, the Agent SDK harness with its control-plane tools moved to the host tool server, usage and prices with split cache writes, budget caps, export, guards, blast radius, clients and per-client connections with the write-only secrets interface, repo policy (`src/db/repo-policy.ts`, `src/routes/repo-policies.ts`), the GitHub writer. Delivery needs the client's own connection and its write token to open a PR.
- **Step 6 (plan, roster, packages):** plan checks and repo read.
- **Step 7 (Gate 0 with Canon):** Drive storage, document parsing, the citation check's quote matcher.
- **Step 9a (tests pipeline, integrator, Gate 2):** the integration planner.
- **The skills step (skills, knowledge):** the skill library, skill sources and `SKILLS.md`, indexed from the factory repo. The eval code waits for the Later steps.

Everything else is new code: events and the CLI (Step 5); render, Gate 1 and the price table and reservations (Step 8); the scheduler, ladder and Gate 3 check room (Step 9b); Gate 4, rework, decide() v5 and refresh (Step 9c); the rest of metering and receipts; the web app; the dry run and the first real mission.

**Top risks:**

1. **The gate's types pull in cockpit contracts** (playbook, `contract/gate`, the old finding statuses in `contract/agent`, shared status, intake brief, roles, room globs). Port or adapt those types deliberately, pin v4's exact inputs in the parity tests, and don't let the parity tests pin the old finding statuses.
2. **The concurrency assumptions are too low.** Gate jobs, Canon turns and check runs are limited to one or two at a time, and the runner assumes a single server process. The factory runs up to 6 modules at once, so the runner pool becomes required, not nice-to-have.
3. **Some paths have never run for real.** The GitHub writer has never written, and the webhook has never received a delivery. DNS isolation is asserted, not proven. Room paths are Windows-specific. Treat these as untested, not ported.
4. **Cockpit assumptions are scattered through the code:** consent gating, client tenancy, Canon's roster recommendation, waves, manual create and start, estimate-based ceilings. Porting any route or table can drag one in, which is why routes and schema are reference only.
5. **The web tests give false comfort.** They render to strings with no interaction, and the design rule "never say Live" was built for polling. The factory view needs real interaction tests and a new live state.

## Settled on Oct 31

- **Clients:** the factory keeps client records, for receipts, repo access and payments.
- **Uploads at Gate 0:** onboarding takes document uploads, and the old Drive storage is the starting point.
- **GitHub access:** fine-grained tokens, two per repo connection: a read-only token and a write token. Only delivery holds write tokens. Each client has its own connection. For repos you make in Avel-org, each client gets its own token pair with Avel-org as the owner, limited to that client's repos. If a client keeps their own GitHub, they make the tokens and give them to you, because a fine-grained token can't reach a repo you only collaborate on. At delivery the factory checks that the mission's client owns the connection and that the target repo is in its list. `avel doctor` warns before a token expires. A GitHub App can come later if client volume makes tokens a chore. (Per-client pairs were settled on Nov 1.)
- **Compute:** Docker rooms now, one per dispatch. Boat is the first cloud provider when you move off Docker, with MIOSA's Developer plan as the alternative.
- **Users:** you only, with email and password sign-in. Roles and other developers come later.
- **UI:** a fresh start, with a new design system. No avel-web code is ported.
