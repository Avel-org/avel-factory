# CR-35: The context layer, the factory's memory across missions (proposed)

Nov 15, 2026 · @javaris

Proposed, not yet accepted. When accepted, it moves into `Change requests.md` with your decisions in its log.

- **What:** a layer that remembers what past missions learned, and gives it to Canon and the agents before they start. It works in two places:
  - **At Gate 0,** Canon draws on past work to propose facts, risks and reference code, which you approve as usual.
  - **At render,** each dispatch gets a small **context package** of approved knowledge, written into its task doc and hashed with it.
- **Why:**
  - What an agent knows when it starts decides most of its first-try pass rate, its retries and its cost, which is your margin.
  - Today an agent gets its task doc, the reading list Canon tagged, and whatever it finds with `kb-search` mid-run.
  - Nothing brings in, by itself:
    - code that already passed the gates for a similar module;
    - findings that keep coming back for this kind of work;
    - this client's confirmed facts from earlier missions;
    - the lessons that measurably helped.
- **What it isn't:** a live memory service inside rooms, or a second store of truth. The factory's Postgres stays the source of truth. The layer is an index built from it, and can be rebuilt from it at any time.
- **Touches:**
  - Design doc Main: modules (`knowledge` gains the context index), data flow, dispatch (the task doc), cost control (a `context` budget scope).
  - Canon Onboarding doc: 0.2 to 0.4 draw on the index.
  - CR-10: the task doc gains a "Known from past work" section after the reading list.
  - CR-16: the dispatch package carries each context package.
  - CR-28: the learning curve measures packages on and off.
  - CR-33: none.
  - CR-34: a purge removes the file from the index, and a scan must be clean before indexing.
  - DATABASE.md: 2 new tables, 1 pinned column on `missions`, 1 budget scope.
  - `Outside sources and what we took.md`: OptimalEngine moves to "Testing" (spike 3).
  - Contract: additive only (the next minor version).
- **Build order:** nothing in Steps 1 to 7.
  - Step 8 renders an empty "Known from past work" section, so the task doc's shape is fixed early.
  - The index, the packages and spike 3 come in Step 12, with knowledge and the learning layer.
  - Packages go live per work kind only once they've proved themselves (section 7).

## 1. The rules it follows

1. **Built before an attempt, never during.** Packages are made at render. Rooms still have no network. `kb-search` through the host tool server stays as it is, scoped and logged, for anything the package didn't cover.
2. **The same inputs give the same package, byte for byte.** A package depends only on the plan version, the factory commit, the knowledge release, the rules version and the **pinned index version** (section 4). A re-render (a late file, CR-34) gives the same package.
3. **Hashed and on the receipt.** The package sits inside the task doc, so the task doc's hash covers it. Each attempt's receipt line shows exactly what the agent was given.
4. **Only approved knowledge goes in:**
   - confirmed facts;
   - approved knowledge entries in the pinned release;
   - merged lessons;
   - findings fixed by a passing regression check;
   - code that landed and passed Gate 5.

   Pending claims, open findings, drafts and inbox files never go in.
5. **Client walls.** Cross-mission sources are limited to the same client's delivered missions, plus internal and template missions (CR-13). Never another client's.
6. **Metered.** Any model call the layer makes (embeddings while indexing) goes through the model proxy, charged to a `context` budget scope. Choosing a package at render uses no model in v1.
7. **Kept to size.** A package uses at most 25% of the module's reading-list budget (15,000 of CR-34's 60,000 tokens).
8. **Untrusted text stays text.** Indexed text is plain text, secret-scanned, and never treated as an instruction.

## 2. At Gate 0: Canon draws on past work

During 0.2 to 0.4, Canon can query the index (same client and templates only) and propose:
- **facts** from the client's earlier missions ("their brand colours", "they use Stripe"), each citing its source mission and fact ID;
- **risks** from findings that recurred on similar work;
- **reference code** for a module: paths and commit SHAs from the client's delivered missions or a template, written into `plan_modules.reference_paths`.

These are proposals, approved by you like any other checkpoint content. Once approved, they're frozen in the plan, the same as everything else at 0.4. The index is never consulted again for that plan version.

## 3. At render: the context package

Each dispatch's task doc gains one section after the reading list: **"Known from past work."** It holds, each item with its source ID and in a fixed order:

| Part | What | Chosen by |
| --- | --- | --- |
| Pitfalls | The 5 most frequent fixed findings for this work kind, role and stack, each with what fixed it and the check that proved it | Finding signatures (CR-24) counted in the pinned index |
| Knowledge | Approved knowledge entries matching the module's work kind, stack and requirements, beyond those already on the reading list | Full-text and tag match, ranked by a fixed formula |
| Client facts | Confirmed facts about this client that touch the module's requirements | Tag and text match |
| Lessons | Merged lessons for this work kind and role, with their verdicts | Scope match, "helped" first |

- **Size tiers.** Each item carries a short form (its title and first sentence, or its defined summary field) and a pointer to the full text in the room. That's the idea taken from OptimalEngine's token tiers. In v1 the short form is a fixed extract, not model-written (decision 4).
- **Ranking is a pure function,** unit-tested with fixture tables like the scheduler's decide step. Ties break on ID.
- **The package is also stored on its own** (`context_packages`), so the learning layer can tell which knowledge an attempt was given.

## 4. The index and its versions

- **Built from Postgres only:**
  - confirmed facts;
  - approved knowledge entries;
  - lessons and their verdicts;
  - fixed findings with their signatures;
  - landed and verified code, by path and SHA (not copied).
- **Built in versions.** A job rebuilds it nightly and whenever a knowledge release or a lesson merges. Each version is immutable (`context_index_versions`), with a hash of its contents.
- **Pinned per mission** at finalize, as `missions.context_index_version`, like `kb_release`. A running mission never sees a newer index; a new mission gets the latest.
- **Purges propagate.**
  - A CR-34 purge, or a removed knowledge entry, drops the item from the next version.
  - A pinned older version keeps only the hash and ID of a purged item, never its text. That's the same rule receipts follow.
- **Embeddings are optional** (pgvector), computed while indexing through the proxy, charged to `context`. They're off in v1. Full-text search and tags come first.

## 5. The engine: Postgres first, OptimalEngine on trial

- **One interface,** `ContextEngine`, with two calls:
  - `retrieve(query, scope, indexVersion)` for Canon;
  - `package(dispatch, indexVersion, budget)` for render.
- **Adapter A, Postgres:** full-text search and tags now, pgvector later. It's built first and is always available.
- **Adapter B, OptimalEngine (spike 3):** it already models sources, claims, facts and context packages with permissions and token tiers. It passes only if all of these hold:
  1. **Our Postgres stays the source of truth.** OptimalEngine is a derived index, rebuilt from it, holding nothing we can't regenerate.
  2. **Its model calls go through our proxy** (a configurable base URL), metered under `context`.
  3. **Same package for the same inputs:** two runs on one index version give byte-identical packages.
  4. **Client walls:** one workspace per client, and a test proving one client's query never returns another's item.
  5. **Purges propagate** within one index rebuild.
  6. **It runs as a host service** beside the model proxy, never inside the main service or a room.
  7. **It does better than adapter A** on the same eval tasks (section 7), not just as well.

  If any check fails, adapter A is the layer.
- **GBrain doesn't fit here.** It's a personal memory, better suited to OSA (see `Outside sources and what we took.md`).

## 6. Schema and contract changes

- **`context_index_versions`, new and immutable:** `built_at`, `factory_commit`, `kb_release`, counts per source, `sha256`, `engine` (`postgres` or `optimal_engine`).
- **`context_packages`, new and immutable:** `dispatch_id`, `task_doc_version`, `index_version → context_index_versions`, `items` (JSON: each item's source kind, source ID and tier), `tokens`, `sha256`. One per (dispatch, task doc version).
- **`missions.context_index_version`,** set at finalize. A CHECK makes it set once the mission is approved, like `kb_release`.
- **`budget_reservations.scope`** gains `context`.
- **Events:** `knowledge.context_index.built` and `factory.context_package.rendered`.
- **Contract:**
  - the dispatch DTO gains `contextPackage` (item count, tokens, hash, and the items' source references);
  - the module page shows "What this agent was given";
  - no new write routes.

## 7. Proving it works before it's on

- **Off by default, per work kind.** Packages are rendered and stored but left out of the task doc until a work kind is switched on in `factory.yaml`.
- **Shown by the learning curve (CR-28):** first-try pass rate, attempts per landed module and findings per module, with packages on and off. The two guards are watched too, the Gate 5 verified rate and reviewer findings per module, so an easier-looking win can't hide.
- **Confirmed by evals** once they run: the same eval tasks with and without packages. A work kind is switched on only when pass rate goes up and the guards hold (decision 8).
- **Spike 3 uses the same eval tasks** to compare adapter A with adapter B.

## Tests ("done when")

1. **Deterministic:** two renders of the same dispatch on the same pinned index version give byte-identical task docs, and a re-render after a late file gives the same package.
2. **On the receipt:** an attempt's task doc hash changes when its package changes, and the receipt's attempt line names the package hash.
3. **Approved only:** a pending claim, an open finding, a draft knowledge entry and an inbox file never appear in a package.
4. **Client walls:** a mission for client B never gets an item from client A, in a package or from Canon's retrieval. Template and internal items are allowed.
5. **Pinned:** a running mission keeps its index version after a newer one is built, and a new mission gets the newer one.
6. **Purges:** a purged file or removed knowledge entry is gone from the next index version, and the pinned older version keeps only its hash and ID.
7. **Size:** a package never passes 25% of its module's reading-list budget, and items are cut lowest-ranked first.
8. **Metered:** embedding calls go through the proxy under `context`, and a spent `context` budget stops embedding without stopping renders.
9. **Off by default:** a work kind not switched on stores its package but leaves it out of the task doc.
10. **Canon's proposals:** a fact Canon proposes from a past mission cites its source mission and fact ID, and nothing from the index enters the plan without your approval at its checkpoint.

## Your decisions

- [ ] **1.** Accept CR-35.
- [ ] **2.** Both entry points: Canon at Gate 0 and packages at render (recommended), or render only.
- [ ] **3.** Cross-mission sources only from the same client's missions plus internal and template missions (recommended). Never other clients.
- [ ] **4.** Short forms are fixed extracts in v1, not model-written summaries (recommended); model summaries only after an eval shows they help.
- [ ] **5.** Build the Postgres adapter first, and trial OptimalEngine in spike 3 before choosing (recommended).
- [ ] **6.** A `context` budget of $10 a month for indexing (recommended), or another amount.
- [ ] **7.** A package may use at most 25% of a module's reading-list budget (recommended), or another share.
- [ ] **8.** Switch packages on per work kind only after the learning curve shows first-try pass rate up with both guards steady (recommended), or switch on for everything at once.
