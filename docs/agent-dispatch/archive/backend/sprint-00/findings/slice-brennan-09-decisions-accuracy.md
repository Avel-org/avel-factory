status: fixed (d789a2a: D3 item 1 marked superseded, B7 says five CHECKs)
severity: P3
title: decisions.md: D3 still says the map isn't in the repo, and the B7 recheck miscounts mission_pauses' CHECKs
reviewer: Brennan (review-spec), agent-brennan-slice-review-spec (a2)
under review: 5e45543

## Where (decisions.md at 5e45543)
- **D3, item 1** (line 20): "`AVEL Database Map.html`, for what exists. It isn't in `docs/design/` yet, so until it lands, `Schema vs DATABASE.md.md` stands in". Line 27 says the same: "settled by the map once it lands".
- **B7 recheck** (line 171): "`mission_pauses` has ... with four CHECKs."

## What it breaks
- **D3 is the precedence order** that contract.md:7 cites. The map landed in e1ed7ae, and `decisions.md`:166 says "It replaces the stand-in". D3 itself was never updated, though. It's the same kind of stale entry finding 05 asked to be marked. That fix covered D2, D5 and D6 but not D3. Read alone, D3 tells m1 and m2 that the stand-in still settles what exists.
- **The map gives `mission_pauses` five CHECKs, not four:** `mission_pauses_kind_ck`, `mission_pauses_interrupted_state_ck`, `mission_pauses_proposal_ck`, `mission_pauses_operator_ck` and `mission_pauses_ended_ck`. Rigg's done-when 2 is one test per CHECK, so the count matters if anyone takes it from here instead of the map.

## Evidence
```
$ sed -n '20p;166p;171p' docs/agent-dispatch/backend/sprint-00/decisions.md
  1. **`AVEL Database Map.html`,** for what exists. It isn't in `docs/design/` yet, so until it lands, ...
- **It replaces the stand-in.** ...
  - **B7:** `mission_pauses` has ... with four CHECKs.
$ python3 -I ... (map ERD, mission_pauses.checks)
['mission_pauses_kind_ck', 'mission_pauses_interrupted_state_ck', 'mission_pauses_proposal_ck', 'mission_pauses_operator_ck', 'mission_pauses_ended_ck']
```

## What fixing it means
- Mark D3 item 1 the way D2 and D6 are marked: the map landed in e1ed7ae and replaces the stand-in (line 166).
- Change "four CHECKs" at line 171 to "five", or drop the count.
- Neither change touches contract.md, and neither blocks m1 or m2.
