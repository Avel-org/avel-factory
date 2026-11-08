status: routed (Step 1, sprint-00 D47)
severity: P3
title: `missions.kind`'s freeze can be bypassed in two updates by clearing `onboarding_started_at` first. The build does what contract.md says; the gap is in the contract
reviewer: Brennan (review-spec), agent-brennan-m2-db-review-spec (a1)
under review: 0eb89e5 (base ad6d8bf)
for: INT and Axis (contract.md section 6). Not a defect in Soap's build, and it doesn't block the m2 merge.

## Where
- `packages/db/drizzle/0002_hand_written.sql:81`: `CREATE TRIGGER missions_frozen BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION freeze_after_set('onboarding_started_at', 'kind');`
- `packages/db/drizzle/0000_functions.sql:158`: `IF old_row ->> gate IS NULL THEN RETURN NEW;`. The freeze reads only the old row's gate column, and nothing stops the gate column itself from going back to null.
- `packages/db/drizzle/0001_schema.sql:807-808`: `missions_draft_not_started_ck` and `missions_started_ck` let `onboarding_started_at` be null when `state` is `draft` (or `cancelled`). Nothing in the map freezes `missions.onboarding_started_at` (its `freeze_once_set` triggers are on `attempts`, `module_runs` and `mission_pauses` only).

## What it breaks
- **CR-13** (`docs/design/Change requests CR-1 to 13.md`, line 285): a mission's project kind is "chosen when the mission is created and frozen once onboarding starts". Line 297 says the same: "`missions.kind` is frozen once `onboarding_started_at` is set (a freeze trigger, like the others in the schema)".
- **Step 0 and Step 1 plan, done-when 3:** "changing a mission's kind after onboarding starts is refused".
- **contract.md section 6** defines `freeze_after_set` as refusing a change "once the old row's gate column is non-null". The build matches that wording exactly. But as written, the rule holds only while the gate column stays set, and the schema lets it be cleared.

## Evidence
On a scratch database migrated with `migrate:up` at 0eb89e5 (postgres:17-alpine, from `scripts/pg-local.sh`):
```
insert into missions (..., kind, client_kind, state, ..., onboarding_started_at)
  values (..., 'internal', 'internal', 'onboarding', ..., now());
-- 1: change kind directly while onboarding has started
update missions set kind='template' where id=...;
ERROR:  missions.kind is frozen once onboarding_started_at is set
-- 2: clear onboarding_started_at (state back to draft), kind unchanged
update missions set state='draft', onboarding_started_at=null where id=...;
UPDATE 1
-- 3: now change kind
update missions set kind='template' where id=...;
UPDATE 1
 kind     | state | onboarding_started_at
 template | draft |
```
The locked done-when 3 and 9 tests pass, because they try only the one-step change (step 1).

## Why it's P3
- The mission state machine lives in the server, and Step 1's plan says "constraints are never duplicated in code as the only guard". A server that never moves a mission back to `draft` never reaches step 2. So no route can trigger this today.
- But CR-13 asks for a database rule ("a freeze trigger, like the others"), and this one can be undone with plain SQL. That matters most for `internal` and `template` missions, whose metrics CR-13 splits out.

## What fixing it means
INT decides; it's a contract change, so the fix starts in contract.md section 6, not in the build. Either option needs its own done-when 9 or done-when 3 case:
- **Option A (one more map-style trigger):** `missions_started_frozen BEFORE UPDATE ... EXECUTE FUNCTION freeze_once_set('onboarding_started_at')`, so once onboarding starts it can't be cleared, and `missions_frozen` then holds for good. It reuses an existing function. Check first that no state the map allows needs `onboarding_started_at` cleared: `missions_draft_not_started_ck` would then make a started mission unable to return to `draft`, which is CR-13's intent.
- **Option B (no schema change):** INT records in `decisions.md` that the freeze holds while `onboarding_started_at` is set, and that keeping it set is the server state machine's job. Done-when 3's wording stays as is.
