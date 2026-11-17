# CR-33: Running several missions at once (accepted)

Nov 14, 2026 · @javaris · lands across Steps 2, 5, 7, 8 and 9b; nothing changes in Step 1

**Accepted Nov 14** with every recommendation:
- the 6 slots are for the whole factory;
- spare slots go round in least-slack order;
- no rush flag for now;
- time spent waiting on the vendor's rate limit doesn't count toward the 60-minute clock;
- a vendor outage ends the attempt as `infra_lost` after 10 minutes;
- at most 3 missions build at once;
- two missions writing the same files in one repo get a warning and your choice at 0.4.

- **What:** make the factory run two or more missions at the same time without one starving, blocking or confusing the other. Each mission already has its own data. This CR shares out what they have in common:
  - the 6 dispatch slots;
  - the host's rooms;
  - the model key behind the proxy;
  - the deadline estimate;
  - a client repo two missions both write to;
  - your attention, in Decisions and in the terminal.
- **Why:**
  - The design says "up to 6 at once" but never says whether that's per mission or for the whole factory.
  - The scheduler's order (dependency depth, then module ref) only works inside one mission, so a big mission could take every slot.
  - Every capacity figure (6 dispatch rooms plus one integration room, the critical path "run at up to 6 at once") was sized for one mission.
- **Touches:**
  - Design doc Main: the scheduler (`tick()` steps 3 to 5), Cost control (the proxy), Factory as code (new `factory.yaml` keys), Live metrics (slots in use).
  - After Canon: how slots are counted.
  - Sandbox doc: "How each fits the factory" (the peak machine count).
  - Canon Onboarding doc: check B7 (critical path), and a new overlap check beside B8.
  - `Roster.md` (Parallel work, item 1), `Dispatch concept.md` (Who starts one), `Jobs and workers.md` (the scheduler row).
  - CR-14 and CR-29: which mission a terminal command acts on.
  - `API routes.md`: route 52's order, route 104's slots, and the proposed rooms list (page map gap 4).
  - DATABASE.md: `mission_pauses` gets one new kind and one column. Nothing else in the schema changes: `missions.deadline_at` and `clock_paused_ms` already exist, and `rooms.kind` already separates dispatch, check and integration rooms.
  - Contract: additive only (the next minor version).
- **Build order:** nothing here touches Step 1. Each part lands with the step that builds the code it changes (the table at the end).

## What's already safe between missions (unchanged)

- **Code:**
  - Each mission has its own repo and branch (`/git/missions/{missionId}.git`).
  - An attempt can push only its own branch, `mission/<id>/<module>/<role>-a<n>`.
- **Landing:** each mission has its own integrator. The unique index `integration_commits (mission_id) WHERE state = 'testing'` makes landing serial per mission, so two missions land at the same time without touching each other.
- **Money:** budgets are per mission ($150) and per module ($15), and `budget_reservations` are tied to the mission. One mission can't spend another's money.
- **Factory changes:** each mission pins `factory_commit` and its roster, so a factory PR merged halfway through doesn't reach a running mission.
- **Clients:**
  - Each client has one repo connection, with tokens limited to that client's repos.
  - Client knowledge and rules carry `client_id`.
  - Delivery checks that the mission's client owns the target repo.
- **Proposals:** they belong to one mission, and the open-proposal unique indexes are per mission.
- **Live view:** the event stream filters by `missionId`.

## 1. Slots are factory-wide and shared fairly

- **The 6 slots are for the whole factory,** set by `slots.max` in `factory.yaml`, and never more than the host's dispatch rooms (section 2). A slot is held from `starting` through `reporting`, as today.
- **A mission is active** when it's past Gate 1 and has a dispatch that is `ready`, `starting`, `running` or `reporting`.
- **How the scheduler hands out free slots,** on each tick:
  1. **Everyone gets one first.** Any active mission with no running dispatch gets one slot before any mission gets a second.
  2. **Spare slots, one at a time, in slack order.** Slack is the time left to `deadline_at` (adjusted by `clock_paused_ms`), minus the remaining critical path at the work kinds' median dispatch time (45 minutes until there's history). Least slack goes first. After each slot, go to the next mission in that order, and wrap around.
  3. **Ties and missing deadlines:** a mission without a deadline goes after every mission with one. Ties go to the earlier `approved_at`, then the lower mission id.
  4. **Inside a mission, nothing changes:** dependency depth, then module ref.
- **No preemption.** A running attempt is never stopped to free a slot. Shares change only when the next dispatch starts.
- **The same state gives the same order.** The rule is a pure function in the scheduler's decide step, tested with fixture tables like the rest of `tick()`.
- **Showing why something waits:** a ready dispatch says what it's waiting for: `slot`, `room` or `budget`. When it's `slot`, the DTO names the missions holding slots. This is a derived field with no column.

## 2. Rooms for landing and checking are held back

- **The problem:** the Sandbox doc sizes the peak at 7 machines, 6 dispatch rooms plus one integration room, which fits one mission. With two missions building, a busy one could fill the host. The other mission's finished work then couldn't get a Gate 3 check room or an integration room, so nothing would land.
- **The rule:**
  - Each mission past Gate 1 holds back one integration room and one check room from the host's total (`rooms.max` in `factory.yaml`).
  - Dispatch slots are whatever is left, up to `slots.max`. That is `min(slots.max, rooms.max − 2 × missions building)`.
  - A held-back room is used only by its own mission.
- **Example:** a host that fits 10 rooms, with two missions building, gives 6 dispatch slots. With three missions, it gives 4.
- **The cap on missions building:** `missions.max_building` in `factory.yaml` (decision 7). A finalized mission beyond the cap stays at Gate 1 passed and waits its turn, in `approved_at` order. Checkpoint 0.3 shows its expected start, so you can tell the client before you finalize.

## 3. The model proxy takes turns

- **The problem:** every mission (and Canon) shares one model key through the proxy. The design tracks "rate-limit headroom", but I found no rule for what happens when the vendor refuses requests.
- **Taking turns:**
  - The proxy keeps one queue per mission, in memory, since the proxy is one process and there's no Redis. Canon's sessions sit in their own mission's queue.
  - When the vendor's limit is close, it serves the queues in turn, so one mission's flood can't hold back another.
  - Its limit on requests in flight is `proxy.max_in_flight` in `factory.yaml`.
- **A vendor refusal costs the attempt nothing:**
  - A rate limit or overload answer is retried inside the proxy with backoff, honouring the vendor's `retry-after`.
  - Nothing is charged for it, and the request's reservation is held, not settled.
  - It never counts toward the $4 cap or a ladder step.
- **The clock:** time a request spends waiting on the vendor's limit doesn't count toward the attempt's 60-minute clock (decision 5). This works like the existing rule that the clock stops while a dispatch waits on a dependency.
- **An outage:** if the vendor keeps refusing for 10 minutes (decision 6), the runner ends the attempt as `infra_lost`. That's a free retry (no ladder step), and it raises the existing provider-outage alert.

## 4. The deadline check knows about other missions

- **B7** (the critical path fits the package deadline) assumes the mission gets all 6 slots. With other missions running, that promises an earlier finish than the factory can give.
- **The change:** at 0.3 and at Gate 1, B7 uses the share the mission will actually get. That is the dispatch slots from section 2, divided by the missions building plus this one, rounded down, at least 1. If it would wait for a place to build (section 2), the wait is added.
- **It stays advisory until calibrated,** as B7 is today. It shows "estimate: shares change as other missions finish".

## 5. Two missions writing to one client repo

- **What's covered today:** the refresh at release. If the client's main has moved (say mission A's PR was merged), mission B re-runs Gates 2, 4 and 5 and asks for a new release approval.
- **What isn't:** two missions editing the same files would only collide at the end.
- **New check B9, at 0.4 and at Gate 1, beside B8:**
  - It runs when another open mission (approved and not yet delivered) uses the same repo connection and target repo, and their plans' `write_paths` overlap.
  - It opens a finding with the overlapping paths and the other mission's name. It doesn't block.
- **Your choice, at 0.4:**
  - **Run after:** the mission is held by a new pause kind, `after_mission`, which names the other mission (`mission_pauses.after_mission_id`). The pause closes in the same transaction that records the other mission's delivery. When it starts, it starts from the client's new main.
  - **Run in parallel:** accept the overlap with a reason, and let the release refresh handle it.

## 6. Decisions ranked across missions

- **The order** route 52 uses across every mission, which `avel next` and the control room both follow:
  1. Release and pass approvals waiting on you.
  2. Anything blocking a mission's critical path: parked modules, dependency and contract-change proposals on the critical path.
  3. The rest, least slack first (section 1).
  4. Then the oldest.
- **Additive:** route 52 takes an optional `?missionId=` filter.
- **The control room** (a CR-W note for the frontend session once this is accepted):
  - Every decision card leads with the client and mission name, which `mission.{name, clientName}` already carries.
  - The approve button names the mission ("Release Acme booking").
  - Each mission has a steady colour or initial, used everywhere.
  - Approvals are already bound to the version you saw, so a stale approval is refused either way.
- **OSA's digests** (CR-29) group items by mission, in the same order.

## 7. The terminal acts on the right mission

- **Inside a folder linked with `avel link`,** the folder's mission wins over the shared focus (CR-29).
  - A write aimed at a different mission needs `--mission <id>`.
  - Without the flag, it's refused with `MISSION_MISMATCH` (a new error code), naming both missions.
- **Outside a linked folder,** commands follow the focus, as CR-29 says. Every write prints the mission's name before it runs.
- **Your minutes:** the activity signal carries the linked folder's mission, so `human_time` and each receipt count your minutes against the right mission. Outside a linked folder, the focus decides.

## 8. Seeing all missions at once

- **Route 104 (`GET /api/status`):** slots in use, split by mission ("4/6: Acme 3, Bolt 1"), plus the held-back rooms and any mission waiting for a place to build.
- **The rooms list:** this CR accepts the proposed `GET /api/rooms?state=running` (page map gap 4). It's read-only, across missions, and backs the slot rack. It takes the next route number on acceptance.
- **The live metrics' "slots in use (x/6)"** becomes per mission and factory-wide.

## Tests ("done when")

1. **Fair start:** with mission A at 8 ready modules and B at 2, B gets a slot on the first tick, and the total never passes `slots.max`.
2. **Slack order and determinism:** spare slots go round in least-slack order; the same fixture state gives the same assignment on every run.
3. **No preemption:** no running attempt is stopped to give a slot to another mission.
4. **Held-back rooms:** with `rooms.max` reached by A's dispatches, B's finished attempt still gets its check room and integration room and lands.
5. **The building cap:** a mission past `missions.max_building` waits at Gate 1 passed and starts, in `approved_at` order, when a building mission finishes.
6. **Proxy turns:** while A floods the proxy under a simulated vendor limit, B's requests are still served.
   - A vendor rate-limit answer charges nothing and uses no cap or ladder step.
   - Ten minutes of refusals end the attempt `infra_lost`, with no ladder step.
7. **B7 with company:** with one other mission building, 0.3's critical-path estimate uses the reduced share and says so.
8. **Overlap:** a second mission on the same repo with overlapping `write_paths` gets the B9 finding.
   - "Run after" opens an `after_mission` pause.
   - That pause closes in the same transaction as the first mission's delivery.
9. **Ranking:** route 52 returns a fixture's cross-mission items in the section 6 order, and `?missionId=` filters them.
10. **Terminal:** in a folder linked to A with the focus on B, a write goes to A.
    - A write to B without `--mission` gets `MISSION_MISMATCH`.
    - The minutes are recorded against A.

## Where each part is built

| Part | Built in |
| --- | --- |
| Proxy turns, vendor refusals, held reservations (3) | Step 2 (the model proxy), with the reservation rules in Step 8 |
| Held-back rooms and `rooms.max` (2) | Step 2 (rooms), used by the scheduler in 9b |
| Fair slots, the building cap, the waiting reason (1, 2) | 9b (scheduler) |
| B7 with company, B9 and the `after_mission` pause (4, 5) | Step 7 (Gate 0) and Step 8 (Gate 1) |
| Route 52's order and filter (6) | The step that builds route 52 (Step 6 or 7, per CR-31) |
| Terminal rule and `MISSION_MISMATCH` (7) | Step 5 (CLI) |
| Route 104 split, the rooms list (8) | Step 5, and the web app in Step 11 |

## Schema and contract changes

- **`mission_pauses`:** a new kind `after_mission`, and a column `after_mission_id → missions` (RESTRICT), with a CHECK: `(kind = 'after_mission') = (after_mission_id IS NOT NULL)`, and a mission can't wait on itself.
- **`factory.yaml`:** `slots.max` (6), `rooms.max` (the host), `missions.max_building` (3), `proxy.max_in_flight`, `proxy.outage_after` (10 minutes).
- **Contract (additive):**
  - the dispatch's waiting reason;
  - route 52's `?missionId=`;
  - route 104's per-mission slots;
  - the rooms list;
  - the error code `MISSION_MISMATCH`;
  - B9 in the check catalog.

## Your decisions

- [x] **1.** Accept CR-33 (Nov 14).
- [x] **2.** The 6 slots are for the whole factory (Nov 14).
- [x] **3.** Spare slots go round in least-slack order (Nov 14).
- [x] **4.** No manual "rush" flag for now; revisit after the first two missions run together (Nov 14).
- [x] **5.** Time waiting on the vendor's rate limit doesn't count toward the 60-minute clock (Nov 14).
- [x] **6.** A vendor outage ends the attempt as `infra_lost` after 10 minutes (Nov 14).
- [x] **7.** `missions.max_building` is 3, never more than the dispatch slots; 2 if CR-22's demo setting of 2 or 3 rooms is taken (Nov 14).
- [x] **8.** Two missions writing the same files in one repo: warn, and you choose at 0.4 (Nov 14).

## Follow-ups

- A CR-W note for the frontend session: decision cards lead with the client and mission, the approve button names the mission, each mission has a steady colour or initial, and the slot rack shows shares by mission (sections 6 and 8).
- When each step lands, its part of this CR is applied to the docs it touches (the list under **Touches**), in the same PR as the code.
