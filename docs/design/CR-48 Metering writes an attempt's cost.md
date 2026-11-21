# CR-48: Metering writes an attempt's cost

Nov 20, 2026 · drafted by Axis for Javaris · **accepted Nov 21 by Javaris, via OSA** ("Approve", backend sprint-06's decision 5). It names an exception to one owner per table (I3), so it's built in a `schema` ticket. No contract change, so it doesn't need Zero's sign-off.

- **What:** the ownership exception for metering's money columns names every column metering writes:
  - `reserved_micros` and `spent_micros` on `missions` and `module_runs`;
  - `reserved_micros` and `cost_micros` on `attempts`.

  Today the exception names only `reserved_micros` and `spent_micros`, and `owners.ts`'s comment names only the `missions` pair.
- **Why:**
  - **The $4 cap is a database rule.** `attempts_cap_ck` holds `reserved_micros + cost_micros <= cap_micros` (DATABASE.md, Required only in some states). The model proxy reserves a request's maximum cost before sending it and settles the real cost after (Design v0.6 Main, Cost control; AGENTS.md, Model calls). The CHECK refuses a reservation past the cap only if that reservation moves `attempts.reserved_micros` in the same transaction as the `budget_reservations` row, and settling moves `attempts.cost_micros`. So metering writes both.
  - **`attempts` names its spend `cost_micros`, not `spent_micros`.** Read literally, today's exception covers `attempts.reserved_micros` but not `attempts.cost_micros`. That would leave the runner (owner of `attempts`) settling a cost that only the proxy knows.
  - **One writer for money.** If the runner wrote `cost_micros`, a request's reservation and its settlement would be written by two modules, and a lost attempt's release would need both. Metering, the meter of record, writes all three tables' money columns; the runner never does.
- **Not changed:** no table, column, CHECK or index. `attempts` stays the runner's table for everything else (`outcome`, `ended_at`, `failure_note` and the rest). The contract and its events don't change.

## Touches

| Doc or code | Change |
| --- | --- |
| `DATABASE.md`, Ownership | "…and the `reserved_micros` and `spent_micros` columns, which metering writes" becomes "…and the money columns, which metering writes: `reserved_micros` and `spent_micros` on `missions` and `module_runs`, and `reserved_micros` and `cost_micros` on `attempts` (CR-48)" |
| `packages/db/src/owners.ts` | The header comment's exceptions name the same columns (a comment only; no code, no migration) |

**Owner:** `metering` (`Backend modules and build plan.md` section 4).
**Where it's built:** backend sprint-06, T-B22 (the model proxy), labelled `schema` with `cr = "CR-48"`. Sprint-06's plan is amended so T-B22's Territory holds those two files before its tests start.

## If it's rejected

The runner owns `attempts.cost_micros`, and the proxy hands each settled cost to the runner, through an event or a job, to write. The settlement then commits separately from the `budget_reservations` row, so `attempts_cap_ck` can't refuse an overspend at the moment it happens. That would need its own CR on how the cap is kept.
