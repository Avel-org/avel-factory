status: open
severity: P3
title: `DecisionTag` draws the request ID chip twice when a `stale` card also has `actionsDisabledReason`, and draws the footer chip for any disabled reason, not only a 429 countdown
reviewer: Zero (review-frontend), agent-zero-w0-kit-review-frontend (a1)
under review: 3cb8f64 (base 61d37ca)
for: Fantem (`apps/web/src/kit/DecisionTag.tsx`). It doesn't block the w0-kit merge: no locked test combines the two, but the page will.

## Where
- `apps/web/src/kit/DecisionTag.tsx:394-395`: in `stale`, the chip is drawn under the stale note (`{requestId ? <RequestIdChip …/> : null}`).
- `apps/web/src/kit/DecisionTag.tsx:167` and `:262-264`: `decidable` is `!done && state !== "notAllowed"`, so it's true in `stale`. The footer then draws a second chip whenever `requestId && actionsDisabledReason != null && decidable`.
- The same footer condition draws the chip for any `actionsDisabledReason`, for example 5.2's `You're offline.`, not only a countdown.

## What it breaks
- **UI contract section 4, D14:** `requestId` draws the chip under the stale note (`stale`), the Locked reason (`notAllowed`), **or** the countdown (`actionsDisabledReason` from a 429). That's one place per state, and the countdown place is for a 429 only.
- **UI contract section 4, "The request ID, everywhere it's shown":** "Tests find it by that `aria-label`". With two chips, `getByLabelText("Copy {id}")` throws on multiple matches.
- **Section 5.2 step 5** gives every row `actionsDisabledReason: "You're offline."`, and section 5.3 gives a `stale` row its `requestId`. A row that goes stale and then loses the network gets both, so the page will reach this case.

## Evidence
A scratch render (`renderToStaticMarkup`, run through vitest from the scratchpad, not committed) of `<DecisionTag layout="desk" variant="plan" title="T" approveLabel="Approve" rejectLabel="Reject" requestId="req_0123456789abcdef" …/>`, counting `aria-label="Copy req_0123456789abcdef"`:
```
PROBE stale -> 1 chip(s)
PROBE stale + offline -> 2 chip(s)      # state "stale", actionsDisabledReason "You're offline."
PROBE seen + 429 -> 1 chip(s)           # state "seen", actionsDisabledReason "Retry in 5s"
```
The locked kit tests (`pnpm exec vitest run test/kit`: 68 passed) don't cover the combined case.

## What fixing it means
- At most one request ID chip per card: the stale note's in `stale`, the Locked reason's in `notAllowed`, and otherwise the one under the countdown.
- The kit can't tell a 429 countdown from the offline reason by its props, so either:
  - draw the footer chip only when the state is `seen` (the state 5.3 gives a 429), or
  - leave the footer chip out in `stale`.
  
  Either way, the kit draws exactly one chip. If the contract's "from a 429" needs a prop to say so, that's a contract change: send it back to Zero rather than inventing one.
