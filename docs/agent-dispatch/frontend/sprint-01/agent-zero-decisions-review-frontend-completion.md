# ZERO: decisions review-frontend, completion report

verdict: FAIL

## Summary
I reviewed Leon's decisions a2 (base b97076e to d480f0e: 016a230, f63a06e, d480f0e) against UI contract section 5 (revision 9), reading every line of the module. Leon's own code has no open finding. The route, the module's files, each row's props, the reason step, route 54's input, every 5.3 and 5.4 state and every copy string match section 5. There's no `fetch(`, no server list data in state, and `index.ts` is light. The verdict is FAIL because the task's expected result isn't met: the locked UC-31 fails on the phone (finding 01). INT's Factory PR screenshot is a real kit defect (finding 02). Both fixes sit in the kit and in my contract, not in `apps/web/src/modules/decisions/**`. INT's phone dialog screenshot matches DL and the contract, so it isn't a finding (see Limitations).

## Pre-flight
- Part 2 files, all read: `.claude/agents/zero.md`, `codebase-analysis.md`, `docs/ui-contracts/decisions-approval-page.md` (sections 0, 4, 5 and 8 in full; the rest skimmed), `CR-W2 Pending decisions.md`, `decisions.md` (Revisions 7 to 9, the size study, INT's answers), `Frontend Map v0.6.md`, the design library v1.1 (DL's `Go`, `Uo`, `n$` and the overlay CSS, extracted from source), `Step 0 and Step 1 plan.md`, and this task doc. The Read first files `API and data reference.md` and `CR-16 Dispatch package contract.md` are present. None is missing.
- Branch `frontend/sprint-01/agent-zero-decisions-review-frontend-a1`, start commit d480f0e, `AVEL_BASE` b97076e.
- Part 7 commands: all available. The worktree had no `node_modules`, so I ran `pnpm install --frozen-lockfile --offline` first, and the build before the tests: `@avel/contract`'s `dist` must exist before vitest can resolve it.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE (review complete; verdict FAIL on UC-31) | this report's commit |

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/decisions-zero-01-uc31-phone-grid-fails-before-hydration.md`: P1. UC-31 (locked) fails on the phone: the server draws the desk actions, and the test reads the grid before hydration. Owner: Fantem and Zero, as INT has chosen (D11 as a `kit.css` rule).
- `docs/agent-dispatch/frontend/sprint-01/findings/decisions-zero-02-factory-pr-card-empty-facts-rule.md`: P2. The Factory PR card draws two rules with an empty gap before "Open on GitHub": the kit's empty `<dl class="av-dt-facts">`. Owner: Fantem and Zero (a new section 4 D-row).

## Contract to files
Each item is checked by reading the diff, plus the commands in Verification.
- **Section 5, Route:** `ssr: true`, the loader catches, `ensureInfiniteQueryData` with `limit` 50 always sent, and `useSuspenseInfiniteQuery` on the same options. Files: `routes/index.tsx:13-27`, `api.ts:10-37`, `DecisionsScreen.tsx:339`.
- **Module shape:** `api.ts`, `decisions.ts`, `screens/DecisionsScreen.tsx`, `index.ts` (named exports, no screen) and `screens.ts` (`DecisionsScreen`, `loadDecisionsScreen`, `decisionsScreenStylesheets`). The route imports only `screens.ts`.
- **Layout:** `data-ui="DecisionsPage"`, `Home`, the `h1`, the lead line's three forms, the `h2` with the count and `+`, the `<ul aria-label="Waiting for you">`, and `Load more` as a secondary `Button`. File: `DecisionsScreen.tsx:184-253` and `369-439`.
- **Styles and loading:** `decisions.css` is static; `head` links the kit's and the module's sheets; `ReasonDialog` is lazy and prefetched after the list renders. Build: `ReasonDialog-*.js` is its own 1.52 kB chunk.
- **The hydration marker:** `useSyncExternalStore` with the server snapshot false, and no `useEffect`. File: `DecisionsScreen.tsx:163-194`.
- **5.1, rows:** the variant map, the generic `decision`, no `idLabel`, `Waiting {formatAgo}`, `Version {n}`, evidence, consequence and labels. The unreadable-options row is Locked with the † reason. The factory row has `#{prNumber}`, the `Commit` sha binding, `Open on GitHub` and `seen`. `now` is `dataUpdatedAt`. File: `decisions.ts:34-88`, `DecisionsScreen.tsx:464-472`.
- **5.2, deciding:**
  - The dialog copy for both choices, word for word, with `destructive` false and `minLength` 3 (`decisions.ts:90-113`).
  - Confirm closes the dialog, makes a new key, and sets `approving` or `rejecting` synchronously.
  - The input is `{ proposalId, version, choice, reason }`, from the row captured at tap time. The reason is trimmed by the kit (`ReasonDialog.tsx:52`).
  - On 2xx: `approvedAt = formatClock(resolvedAt)`, and route 52 is invalidated after `--av-d-punch`.
  - Retry re-sends the same `vars`. Offline gives `You're offline.` (`DecisionsScreen.tsx:589-679`).
- **5.3, every `UiError.kind`:**
  - `stale`, with and without a version. A null version reads the thrown message: Ghost's w0-data a2, which adds `UiError.stale.message`, isn't on main, so this follows INT's answer.
  - `notAllowedNow` with its three reasons, and `notFound`. `badRequest` on the reason (the dialog reopens with `defaultReason`, the error and the ID) and otherwise.
  - `signedOut` as a page-level 401 with no action. `forbidden`.
  - `rateLimited`, with a countdown and with none. `idempotencyConflict`.
  - `inProgress` at 500ms, 1s and 2s, then `network`. `conflict` and `unprocessable` with their † titles.
  - `network` and `server`: the band with Retry and the chip.
  - Request IDs are drawn everywhere 5.3 lists. File: `DecisionsScreen.tsx:553-821`.
- **5.4:** Loading; the empty card's copy; first-load signed-out, network/server, and other status with its title and `body = message`; the refetch-failed band with `lastGoodAge` and the ID; the unreadable band (`role="alert"`, plural); `Retry loading more` with the chip. File: `DecisionsScreen.tsx:267-333` and `392-452`.
- **5.5:** the `staleVersion` banner above the header, with the † message and `Reload`. File: `DecisionsScreen.tsx:195-203`.
- **No fetch:** there's no `fetch(` call in the module. The task's literal `! grep -rn 'fetch('` exits 1, because it matches the six `refetch(` and `afterRefetch(` lines. A word-boundary grep, `grep -rnP '(?<![A-Za-z])fetch\('`, lists nothing. The pattern is my plan's defect, not Leon's (Deviations).
- **No server data in state** (Decisions, "Revision 9", judged by reading):
  - `useState` holds `signedOut` (a request ID), `settledElsewhere` (a flag), `dialog` and `outcome`.
  - `dialog.row` and `Attempt.row` are the row as drawn at tap time. FM 205 and 5.2 require that snapshot, because the body comes from the row as drawn and never from a refetch. They're never used to draw the list: the card always draws from the query's `row`.
  - Verdict: compliant.
- **`index.ts` light:** it re-exports `api.ts` and `decisions.ts` only (query options, mutation, renderers and copy). No screen, and no kit runtime import: `decisions.ts` imports kit types only.
- **Section 8, Zero's zod check:** `grep -rnE "from ['\"]zod(/v4)?['\"]" apps/web/src/modules apps/web/src/routes` lists nothing.

## Deviations
- **Extra commands:** I ran `pnpm install --frozen-lockfile --offline`, and the build before the tests, so the commands could run in a fresh worktree.
- **Extra measurement:** to check INT's two screenshots, I ran a scratch Playwright script in the session scratchpad, outside the repo, against a dev server on port 4199 with `AVEL_API=mock`, then stopped the server.
- **The fetch check:** ZERO-01's `! grep -rn 'fetch('` also matches `refetch(`, so it fails on correct code. I judged the rule with a word-boundary grep instead. I'll fix the pattern in `plan.toml` (`(?<![A-Za-z])fetch\(`, or `-w`) and re-render.
- **The file list:** `git diff --name-only main...HEAD` lists Leon's eight files as well as mine. My branch starts at his result commit, which isn't on main yet. My own changes are `d480f0e..HEAD`, listed under Files changed.

## Limitations
- **INT's phone dialog screenshot (centred, where a1 was a bottom sheet): not a finding.**
  - **a2 is DL's Dialog, as the contract specifies.** In Chromium at 390x844, the dialog is at x=16, y=256, 358x332. The scrim has `align-items: center`, `padding: 16px` and `position: fixed`.
  - **That's DL's `.av-scrim` word for word** (DL line 645). DL's `Go` always draws in `Uo` with `size: "sm"`. Section 4 ports `ReasonDialog` with R1 to R6 only, and leaves out DL's Sheet rules (`kit.css:10-11`).
  - **a1's "bottom sheet" was the unstyled page.** Leah's a1 finding 02 measured it at 390x166 at y=678 on a 390x844 viewport: full width, flush with the bottom, with no 16px scrim padding. So `.av-scrim` wasn't applied, and the portal's `div` sat at the end of `body`. That's the "stylesheets not linked" defect a2 fixed.
  - **If INT wants a bottom sheet on a phone,** that's a new design decision: DL's `.av-sheet[data-side="bottom"]` exists (DL lines 661-664). It would be a contract change (section 4) and a kit change, not a fix to this module.
- **Known and being planned by INT, not refiled:**
  - `/`'s first load is 173.94 kB gzip (154.68 + 15.87 + 3.39), over the 160 kB budget. S1-6 and Nemi's stub plugin come next.
  - The lazy `ReasonDialog` imports `kit/ReasonDialog` past `kit/index.ts` (`DecisionsScreen.tsx:101-106`). It breaks FM's index-only rule, as Leon reports. INT is planning the kit-side loader.
- **A contract gap, mine:** if the `ReasonDialog` chunk fails to load, the lazy component throws to the page's first-load boundary, so the whole list is replaced by `Couldn't load`. Section 5 has no copy or state for this case. I'll propose one in the next contract revision. It's not a finding against Leon.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Fantem:**
  - finding 02 (DecisionTag's empty facts list);
  - finding 01's kit side (D11 as a `kit.css` media rule, per INT);
  - Leon's report notes `HashChip` computes `IBM Plex Mono` 400, not 500, because `kit.css`'s `[data-ui="HashChip"]` sets no weight. I didn't measure this. It goes to Leah's re-review.
- **Zero (me):** contract section 4 rows for findings 01 and 02, a 5.x line for a failed `ReasonDialog` chunk, and the `fetch(` pattern in this review's verify in `plan.toml`.
- **Leon:** nothing to fix in a2's code.

## Files changed
`git diff --name-only d480f0e..HEAD` (my changes):
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-decisions-review-frontend-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/decisions-zero-01-uc31-phone-grid-fails-before-hydration.md
docs/agent-dispatch/frontend/sprint-01/findings/decisions-zero-02-factory-pr-card-empty-facts-rule.md
```
`git diff --name-only main...HEAD` also lists Leon's diff, which is under review and not mine:
```
apps/web/src/modules/decisions/api.ts
apps/web/src/modules/decisions/decisions.css
apps/web/src/modules/decisions/decisions.ts
apps/web/src/modules/decisions/index.ts
apps/web/src/modules/decisions/screens.ts
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx
apps/web/src/routes/index.tsx
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md
```

## Verification
```
$ pnpm --filter "@avel/web..." build
exit=0
packages/contract build: Done
apps/web build: dist/client/assets/decisions-BpPPU4Jm.css     1.54 kB │ gzip:   0.54 kB
apps/web build: dist/client/assets/kit-DDPuOw4w.css          17.31 kB │ gzip:   3.75 kB
apps/web build: dist/client/assets/app-CCOL2GSK.css          31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/ReasonDialog-I_m4HCea.js   3.50 kB │ gzip:   1.52 kB
apps/web build: dist/client/assets/jsx-runtime-Wy9s6hX0.js    8.91 kB │ gzip:   3.39 kB
apps/web build: dist/client/assets/routes-Cosr3y1m.js        46.49 kB │ gzip:  15.87 kB
apps/web build: dist/client/assets/index-DimhTn_r.js        493.83 kB │ gzip: 154.68 kB
apps/web build: ✓ built in 499ms
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
exit=0
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
exit=0
> biome check .
Checked 205 files in 116ms. No fixes applied.

$ pnpm --filter @avel/web test
exit=0
 Test Files  14 passed (14)
      Tests  190 passed (190)

$ pnpm --filter @avel/web exec playwright test        # ZERO-01's verify
exit=1
  ✓  1 [phone] UC-29 (2.8s)
  ✓  2 [phone] UC-30 (2.3s)
  ✘  3 [phone] UC-31: on a phone the actions are D11's two-column grid, 44px tall, and the reason input is 16px
  ✓  4 [desk] UC-29 (2.0s)
  ✓  5 [desk] UC-30 (2.6s)
  -  6 [desk] UC-31
    Expected: "grid"  Received: "flex"   (e2e/decisions.spec.ts:125)
  1 failed, 1 skipped, 4 passed (13.8s)

$ ! grep -rn 'fetch(' apps/web/src/modules/decisions   # ZERO-01's verify, literal
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:357:    const result = await query.refetch();
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:363:    const result = await query.refetch();
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:418:            onAction={() => void query.refetch()}
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:647:    if (await refetch()) setOutcome(null);
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:671:          review: () => void afterRefetch(() => reviewRow(row.ref)),
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:672:          refresh: () => void afterRefetch(refreshList),
exit=1   (every match is TanStack Query's refetch; the pattern is mine and too loose)

$ grep -rnP '(?<![A-Za-z])fetch\(' apps/web/src/modules/decisions   # the intended check
(no output; exit 1 = no fetch call)

$ git diff --name-only main...HEAD
(listed under Files changed: Leon's 8 paths under review, plus my 3 from Part 5)
```
