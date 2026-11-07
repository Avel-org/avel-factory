status: open
severity: P3
title: Route 52's "typed placeholder" fixes a discriminator (`source: 'proposal' | 'factory_change'`) that no doc defines
reviewer: Brennan (review-spec), agent-brennan-m1-contract-review-spec (a1)
under review: 0dce235 (base 6186c57)

## Where
- `packages/contract/src/dto/decisions.ts:35` to `:38`:
  ```ts
  export const PendingDecisionDto = z.discriminatedUnion("source", [
    z.object({ source: z.literal("proposal"), proposal: ProposalDto }),
    z.object({ source: z.literal("factory_change"), change: FactoryChangeDto }),
  ]);
  ```
- It's used by route 52, `GET /api/pending-decisions` (`packages/contract/src/routes/decisions.ts:16`).
- Axis's report, A8: "route 52 (`PendingDecisionDto`, a union on `source: 'proposal' | 'factory_change'`, my discriminator)".

## What it breaks
- **contract.md section 4, item 6:** "route 52's pending-decision union [is] named but [has] no field list: CR-W2 and CR-W5 aren't accepted. They get typed placeholders, and Step 1's routes 52 to 54 decide them."
- **Rule 1:** "Every field traces to a column in the map ... or to a word in its route's row in section 2. A field with neither is left out and listed as open."
  - `source` isn't a column on `proposals`, and no row uses the word.
  - The literals `proposal` and `factory_change` aren't values in any map list or in section 3.
- **It's more than a placeholder.** Every other placeholder in the diff is a `Placeholder` (a JSON record), or a known field plus one (A8). This one fixes:
  - a wire discriminator;
  - two literal values;
  - two property names (`proposal`, `change`).
- **It already differs from the request it stands in for.** CR-W2 (Frontend Map v0.6, line 468) asks for "a discriminated union that carries ... a stable `ref`, kind, target IDs, the version or hash to bind, a summary ...". If CR-W2 is accepted, `source`, `proposal` and `change` all change.
- **Why it matters:** the web builds against the contract and its mock. A shape that looks decided will be coded against, then broken when Step 1 decides it.

## Evidence
```
$ grep -rn '"source"\|factory_change' packages/contract/src/dto/decisions.ts
packages/contract/src/dto/decisions.ts:35:export const PendingDecisionDto = z.discriminatedUnion("source", [
packages/contract/src/dto/decisions.ts:37:  z.object({ source: z.literal("factory_change"), change: FactoryChangeDto }),
$ grep -n "CR-W2" "docs/design/AVEL Web App — Frontend Map v0.6.md"
468:| CR-W2 | Pending decisions as a discriminated union that carries everything for one-tap approval: a stable `ref`, kind, target IDs, ...
$ grep -c 'factory_change' "docs/design/AVEL Database Map.html" docs/agent-dispatch/backend/sprint-00/contract.md "docs/design/API routes.md"
docs/design/AVEL Database Map.html:0
docs/agent-dispatch/backend/sprint-00/contract.md:0
docs/design/API routes.md:0
```

## What fixing it means
Either of these:
- **Make it a placeholder like the others:** `PendingDecisionDto = Placeholder`, so route 52 returns `Page(Placeholder)`. Keep the open note pointing at CR-W2 and Step 1's routes 52 to 54.
- **Or keep the union and record it** as a decision (INT copies A8 into `decisions.md` with the discriminator named). Pass it to Zero through INT as provisional, so the mock doesn't treat it as settled.

**What it blocks:** nothing in Step 0. Settle it before the web's Decisions screen or Step 1's item 13 (the approval page) is built on route 52.
