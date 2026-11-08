# BRENNAN: decisions review-spec, completion report

verdict: PASS

## Summary
I reviewed Leon's decisions a2 (`b97076e..d480f0e`: 016a230, f63a06e and the d480f0e report) against CR-W2 route 54 and section 2.2's row, UI contract revision 9 section 5, and FM's Writes.

- BRENNAN-01's three points all hold:
  - the body comes from the row as it was drawn;
  - a stale version is never re-sent;
  - nothing is derived on the client beyond what section 5 allows.
- The locked screen tests pass: 37 of 37.
- INT's two screenshot issues both come from the kit, not this diff:
  - the Factory PR card's double rule is finding 01 (P3, contract and kit);
  - the phone dialog sitting in the middle of the screen is DL's Dialog working as designed. a1's "bottom sheet" was the dialog drawn with no styles.

## Pre-flight
- **Part 2 files, all present and read:**
  - `.claude/agents/brennan.md`
  - `codebase-analysis.md`
  - the UI contract: sections 0 to 1 and 4 to 5 in full, and 8
  - `CR-W2 Pending decisions.md`: sections 2.2, 5 and 6
  - the sprint's `decisions.md`: skimmed
  - Frontend Map v0.6: Writes and Errors by code, lines 198 to 226
  - the design library: DecisionTag's `dl`, and ReasonDialog (`Go`, which draws in `Uo`, size `sm`)
  - `Step 0 and Step 1 plan.md`: skimmed
  - this task doc
- **brennan.md's Read first:** all five design docs are present. I read the parts that touch the page and skimmed the rest. The backend docs don't bear on this frontend diff.
- **Branch:** `frontend/sprint-01/agent-brennan-decisions-review-spec-a1`, at d480f0e. `AVEL_BASE` is b97076e.
- **Part 7 commands:** all available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | this report's commit |

What I checked for BRENNAN-01, with evidence:
- **Approve what you saw** (5.2 step 2; FM "Approve what you saw").
  - `DecisionsScreen.tsx:693-694`: the tap stores the rendered `row` in the dialog state.
  - `:629-642`: `confirm` builds `{ proposalId, version, choice, reason }` from that stored row (`drawn`), with a fresh `newIdempotencyKey()`. Nothing is read from the cache at send time.
  - The reason is trimmed by `kit/ReasonDialog.tsx:52`.
  - `choice` is the row's `approve.choice` or `reject.choice` (CR-W2 2.2: "the exact string route 54 accepts").
- **Retry** (5.2 step 4): `:670` re-sends `outcome.attempt`, which is the same `vars`: the same body and the same key.
  - The `inProgress` re-sends (`:609-621`) use the same `vars` after 500ms, 1s and 2s, then end as `network`.
  - The reason-400 reopen (`:559-570`) leads to a new `confirm`, so a new key.
- **A stale version is never re-sent** (5.3 `stale`; FM "In short" item 5).
  - `failureView`'s `stale` branch (`:758-766`) offers only `onReview`, with no retry.
  - `DecisionTag.tsx:144` disables both buttons in `stale`.
  - Review (`:362-367`, `:646-648`) refetches. Only on success does it clear the outcome, so the row is drawn fresh from the server at the new version, and the next tap is a new intent from that row.
  - With `currentVersion` null, the row is drawn as `conflict`, with the thrown error's message (`:759`). Revision 9 allows that until `UiError.stale.message` lands.
  - The locked UC-15 asserts exactly one route 54 request (`errors.test.tsx:41`).
- **Nothing derived on the client beyond the count.**
  - The count is `rows.length`, with `+` while `nextCursor` isn't null (`:369-371`, `:398`). The lead line comes from that count (`:250-253`).
  - Every other value is one section 5 names:
    - `age` from `dataUpdatedAt` (5.1 `now`);
    - `lastGoodAge` (5.4);
    - `approvedAt` from the response's `resolvedAt` (5.2 step 3);
    - settled-elsewhere when a Review refetch no longer lists the ref (5.3).
  - `decisions.ts` maps every field straight from the row, as 5.1's table does.
  - No cost is drawn, and no state is kept that the server doesn't send.
- **Route and module (section 5):**
  - `ssr: true`, with a loader that catches its prefetch;
  - `limit` 50, always sent;
  - `routes/index.tsx` imports only `screens.ts`;
  - `decisionsScreenStylesheets` is linked from `head`;
  - `ReasonDialog` is loaded through `React.lazy`, with a prefetch after the list renders;
  - `useHydrated` is a `useSyncExternalStore` with snapshots `false` and `true`, and no effect;
  - the phone query is `(max-width: 899px)`;
  - offline sets `actionsDisabledReason` (`:677-679`).
  - All match.

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/decisions-brennan-01.md`: P3. A factory PR card draws an empty facts block, so two rules with a gap before "Open on GitHub". The owners are Zero and Fantem, not Leon.

## Contract to files
| Item | Files |
| --- | --- |
| 5 Route, loader, module | `apps/web/src/routes/index.tsx`, `modules/decisions/{api,screens,index}.ts` |
| 5.1 Row drawing | `modules/decisions/decisions.ts` |
| 5.2 Deciding, 5.3 errors | `modules/decisions/screens/DecisionsScreen.tsx:474-821` |
| 5.4 List states, 5.5 banner, count | `DecisionsScreen.tsx:184-452` |
| Styles and loading, hydration marker | `decisions.css`, `screens.ts`, `DecisionsScreen.tsx:96-178` |
| Locked tests UC-11 to UC-28 | `apps/web/test/modules/decisions/*`: 37/37 pass |

## Deviations
- I added INT's two screenshot checks to the review, at INT's request in this session. Both are written up under Issues for other agents.
- I didn't re-file the three items INT says are already being planned:
  - UC-31's wait order;
  - the 173.94 kB first load;
  - the deep `kit/ReasonDialog` import (`DecisionsScreen.tsx:101-105`, Leon's Deviation 1, which breaks FM's "only through `index.ts`" rule until the kit gives a lazy entry).
- I didn't rerun the Playwright suite. It isn't in Part 7.

## Limitations
- **INT's screenshots:** I checked them from the source, the CSS and DL, not in a browser.
- **A dialog open across a background refetch:** if route 52 is refetched while the dialog is open (say, another row's punch invalidates the list), the card behind the dialog shows the new version, but Confirm sends the version that was on screen at the tap.
  - The server then answers `STALE_VERSION`, and the row shows the stale state. That follows 5.2's "never from a refetch", and nothing stale is re-sent.
  - I note it, and it isn't a finding.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT, the Factory PR double rule:** see finding 01.
  - The cause is `DecisionTag.tsx:315` always drawing `.av-dt-facts`, whose `border-top` is at `kit.css:866-873`, above `.av-dt-foot`'s own `border-top` (`kit.css:916-918`).
  - DL draws the `dl` the same way. It shows only now because a2 is the first build that links `kit.css`.
  - Zero adds a section 4 rule, and Fantem makes the fix.
- **INT, the phone dialog in the middle of the screen:** not a defect against the docs as written.
  - DL's ReasonDialog (`Go`) draws in DL's centred Dialog (`Uo`, size `sm`).
  - `kit.css:11-19` (`.av-scrim`: flex, centred) ports it word for word.
  - `kit.css:10` says the Sheet rules were left out.
  - Section 4 R1 to R6 names no phone sheet.
  - **a1's "bottom sheet" was the dialog with no styles at all:** nothing linked `kit.css` in a1 (`git grep -n kitStylesheetHref 080ca45 -- apps/web/src` finds only `kit/index.ts`). So the portal's markup sat in normal flow at the end of `body`.
  - **If INT wants a bottom sheet on phones:** FM line 209 says "open a reason sheet", and DL has a `Sheet` (`data-side="bottom"`, `.av-sheet`). That's a contract decision (Zero, section 4) and a kit change (Fantem), not a fix for Leon.
- **Leon, follow-up (already known):** switch `:759` to `UiError.stale.message` when Ghost's w0-data a2 lands.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-brennan-decisions-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/decisions-brennan-01.md
```
These are the paths this branch adds. `git diff --name-only main...HEAD` also lists Leon's eight paths, because his branch isn't merged to main yet (output below).

## Verification
```
$ pnpm --filter @avel/web exec vitest run test/modules/decisions
 Test Files  4 passed (4)
      Tests  37 passed (37)

$ pnpm --filter "@avel/web..." build            # exit 0
apps/web build: dist/client/assets/index-DimhTn_r.js                 493.83 kB │ gzip: 154.68 kB
apps/web build: ✓ built in 581ms
apps/web build: dist/server/assets/ReasonDialog-DxtD8UaD.js                  5.85 kB │ gzip:  2.01 kB
apps/web build: dist/server/assets/routes-C8B0LD8Z.js                       48.57 kB │ gzip: 13.80 kB
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.19 kB
apps/web build: ✓ built in 209ms

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck   # exit 0
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint                                      # exit 0
Checked 205 files in 110ms. No fixes applied.

$ pnpm --filter @avel/web test                   # exit 0
 Test Files  14 passed (14)
      Tests  190 passed (190)

$ git diff --name-only main...HEAD
GITDIFF_PLACEHOLDER
```
