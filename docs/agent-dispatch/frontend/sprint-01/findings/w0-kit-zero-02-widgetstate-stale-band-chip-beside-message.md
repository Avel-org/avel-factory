status: open
severity: P3
title: `WidgetState` `error` with rows on screen draws the request ID chip beside the stale message, in the status row, not under it (W1)
reviewer: Zero (review-frontend), agent-zero-w0-kit-review-frontend (a1)
under review: 3cb8f64 (base 61d37ca)
for: Fantem (`apps/web/src/kit/WidgetState.tsx`). Placement only; it doesn't block the w0-kit merge.

## Where
- `apps/web/src/kit/WidgetState.tsx:199-209`: in the `error` state with `children` and `lastGoodAge` (DL's stale band), the chip is a sibling in the one `role="status"` flex row, between the message (`flex: "1 1 auto"`) and the Retry button. The message grows to fill the row, so on a desk the chip sits on the message's line, to its right.
- The plain error state (`:229-236`) puts the chip in its own block under the message, as W1 asks. Only the band differs.

## What it breaks
- **UI contract section 4, W1:** "`requestId?: string` draws the request ID chip **under** the `error` state's message."
- **Section 5.4** uses exactly this branch: "Error with data on screen (a refetch failed): the rows stay, under `WidgetState` `error` with `lastGoodAge` … and the failed request's ID as `requestId` (W1)".

## Evidence
The same scratch render as finding 01, of `<WidgetState state="error" lastGoodAge={90000} requestId="req_0123456789abcdef"><ul/></WidgetState>` (styles and SVGs stripped):
```
<div data-ui="WidgetState" data-state="error"><div role="status"><svg/><span>Stale, last good value 1m old</span><span data-ui="HashChip" data-kind="hash" …><span>req</span><span>req_01234567</span><button type="button" aria-label="Copy req_0123456789abcdef" …></button></span><button data-ui="Button" data-variant="ghost" type="button"><svg/>Retry</button></div><div><ul></ul></div></div>
```
The chip is inside the status row, not under the message. UC-10 and UC-27 find the chip by its `aria-label`, so they pass either way.

## What fixing it means
- In the band, draw the chip under the status row (its own line, before the dashed rows), as the plain error state does.
- DL's band row (glyph, message, Retry) stays as it is.
- No new values: reuse the band's own `gap: 10` column.
