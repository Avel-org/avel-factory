status: open
severity: P3
title: The names table adds `usage_log.vendor` with no type, nullability or default
reviewer: Brennan (review-spec), agent-brennan-slice-review-spec (a2)
under review: 5e45543

## Where
- `contract.md:425` (at 5e45543), in section 6's names table: `| usage_log | column | vendor | CR-5 |`.
- `contract.md:393`, the Step 0 row quoted byte for byte: "`usage_log`: add `vendor`".

## What it breaks
- **Every other new column in the table has a full definition:**
  - `clients.kind`: "`kind text NOT NULL`, no default (D20)" (`:426`);
  - `missions.kind` and `client_kind`: "`text NOT NULL` ... no defaults (D20)" (`:430`);
  - `missions.design_system_*`: "`text` ... both optional" (`:437`);
  - `templates.source_mission_id`: "`uuid`, optional" (`:443`);
  - `design_systems`: every column's type (`:446`).
- **`vendor` gets only a name.** No source gives the rest:
  - CR-5 says only "`usage_log` has `model` but no `vendor` (add it)" (`Change requests CR-1 to 13.md`:68).
  - `Schema vs DATABASE.md.md`:81 and :98 name the column and nothing else.
  - DATABASE.md has no `usage_log.vendor`.
- **Why it matters:** Soap (m2) would have to choose the type, whether it's required, and the default. Done-when 8 lists each difference from the map "against the CR that changed it", so Rigg can't write the column's test first. The section 6 rule this slice set itself, after finding 03, is that m2 builds from section 6 and invents nothing.

## Evidence
```
$ grep -n "vendor" docs/agent-dispatch/backend/sprint-00/contract.md docs/agent-dispatch/backend/sprint-00/decisions.md
contract.md:393:| `usage_log`: add `vendor` | CR-5 |
contract.md:425:| `usage_log` | column | `vendor` | CR-5 |
$ python3 -I ... (the map's ERD: every column named vendor, and usage_log.model)
attempts     vendor  text  required=True  default=None
price_table  vendor  text  required=True  default=None  (part of the key (vendor, model, valid_from))
usage_log    model   text  required=True  default=None
```

## What fixing it means
- Give the row a definition. The map suggests one: `vendor text NOT NULL`, no default, matching `attempts.vendor` and `price_table.vendor` (CR-5: "`price_table` and `attempts` already carry `vendor`"), and `usage_log.model`.
- Mark it as derived from the map, the way `design_systems`' rows say "as `templates_*`". If Axis picks something else, record it as a D entry.
- **What this blocks:** nothing in m1. No DTO in section 4 reads `usage_log`. Fix it before Soap's m2 and Rigg's m2 tests start.
