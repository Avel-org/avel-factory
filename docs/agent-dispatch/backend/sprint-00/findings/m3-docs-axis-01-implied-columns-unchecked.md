status: routed (Step 1, sprint-00 D57)
severity: P3
module: m3-docs
reviewer: AXIS (review-backend), attempt a1, at c595719

# DATABASE.md's implied-column sentence is wrong for 7 tables, and the drift check can't see it

## What

`docs/design/DATABASE.md:44` (added in 43a455a, Step 0 item 5) says:

> Every table has a `created_at timestamptz` column, and unless a `key (…)` is shown, an `id uuid` (UUIDv7, time-ordered) primary key. Every table that rows can change in also has `row_version` and `updated_at`, moved on each update by the `touch_updated_at` trigger; that's what the API's stale-version 409 checks. The specs leave those columns out.

The schema says otherwise:

- **No `created_at`:** `agent_traces`, `events` and `webhook_deliveries` (they use `at` and `received_at`).
- **`updated_at` and no `row_version`:** `users`, `auth_sessions`, `auth_accounts` and `auth_verifications`. Their rows change (Better Auth updates them), so "every table that rows can change in also has `row_version`" is false. A Step 1 builder who reads this could expect a stale-version 409 on these tables.

The drift check doesn't catch this, by construction. `tools/docs/src/drift.ts:27` treats `created_at`, `row_version` and `updated_at` as implied on every table, and `drift.ts:124` skips them in the schema-to-doc direction. Nothing checks that an implied column exists. So the check stays green on this sentence, and it would also stay green if a table lost (or gained) any of the three columns.

## Evidence

Read through `tools/docs/src/schema.ts`'s `readSchema()` (the same reader drift uses), at c595719 after `pnpm build`:

```
$ node --experimental-strip-types <scratch>/implied.ts
created_at missing on: agent_traces events webhook_deliveries
row_version missing on: activity_log agent_configs agent_traces auth_accounts auth_passkeys auth_sessions auth_verifications check_results ... users webhook_deliveries
updated_at missing on: activity_log agent_configs agent_traces auth_passkeys check_results ... webhook_deliveries
```

(The `row_version` and `updated_at` lists are identical except for `users`, `auth_sessions`, `auth_accounts` and `auth_verifications`, which have `updated_at` only.)

`pnpm --filter @avel/docs drift` reports `no drift` at c595719.

## Breaks

- Step 0 item 5 ("DATABASE.md updated to the schema"): the notation paragraph misstates the schema.
- DATABASE.md, Source of truth: the doc says the drift check compares "each table's columns by name ... both ways", but three columns are never compared in either direction.

## What fixing it means

Both of these, by ATLAS in `docs/design/DATABASE.md` and `tools/docs/src/drift.ts`:

1. Line 44 names the exceptions: the three tables with no `created_at` and the columns they use instead, and the fact that Better Auth's tables have `updated_at` and no `row_version` (no stale-version check on them).
2. The drift check checks the implied columns against a stated rule, not just skips them. For example: `created_at` must exist unless the table is a listed exception; `row_version` and `updated_at` must exist together, except on the listed Better Auth tables. Or a table without them must list its time column in its spec. A planted case (dropping `created_at` from a table the doc implies has it) then fails.

Severity is P3: no route depends on it yet, and the `db` suite (done-when 9) tests `touch_updated_at` where it exists. It shouldn't wait past Step 1, where the stale-version 409 is built.
