status: done
ticket: T-F10

# T-F10 · build · Fantem: completion report

Branch `t/F10-control-room-rules`, attempt 3 (worktree `frontend-sprint-11-t-f10-build-a3`). Not pushed.

**Budget (E16, CR-W29 decision 6): `/` loads 225,252 B gzipped, against budget.spec's limit of 225,280 B (220 KB).** budget.spec printed `budget warning: 225252 B gzipped (over 204800)` in the final run (225,251 B in the run before it). That leaves 28 B of headroom. At the start of this attempt the branch measured 225,258 B, and the task doc's T-F8 figure was 225,154 B.

## Starting state

Attempts 1 and 2 left four commits on the branch after the lock (1c8c109, d94511c, 7db5935, 7e8fbb1) but no report. I checked them against the locked tests rather than redoing them. With `pnpm build` run first (CI does that too; `@avel/contract` resolves from `dist/`), vitest passed 47 of 47. The full Playwright run had one T-F10 failure: T-F10-04's Canon message. Run on their own, the three T-F10-04 render tests failed 4 of 12 times (the agent trail and the Canon message). The cause was a timing race at boot. My one new commit (081ade9) fixes it.

## Pre-flight

Every Part 7 command, run in order on 081ade9 with this worktree's Postgres:

| # | Command | Result |
| --- | --- | --- |
| 1 | `pnpm --filter @avel/web exec vite build` | exit 0, `✓ built` |
| 2 | `pnpm typecheck` | exit 0 |
| 3 | `pnpm lint` | exit 0: `Checked 241 files … No fixes applied. Found 6 warnings.` (all in test files; see Limitations) |
| 4 | `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` | exit 0: vitest 8 files, 47 passed; Playwright 303 passed, 1 skipped (18.1 m) |
| 5 | `pnpm --filter @avel/web exec vitest run` | exit 0: 8 files, 47 passed |
| 6 | `pnpm --filter @avel/web exec playwright test` | exit 0: 303 passed, 1 skipped (14.5 m) |
| 7 | `pnpm --filter @avel/web exec vite build` | exit 0 |
| 8 | `pnpm lint` | exit 0, the same 6 warnings |

- **The one skipped test** is T-F7-05 (`e2e/control-room/routes.spec.ts`). It is quarantined on main under F5, issue #57.
- **The locked tests:** all 103 Playwright tests in `e2e/control-room-rules/**` passed in both runs, and so did both files in `test/control-room-rules/**`.
- **Repeat runs:** after the fix, I ran T-F10-04's three render tests six times each, and 18 of 18 passed. Before it, 4 of 12 had failed.

**End-to-end screenshot:** `apps/web/test-results/control-room-rules-untrust-f6d8f-l-text-and-nothing-executes/test-finished-1.png`. It shows M3's trail with the step `reading the client's note: <b>urgent</b> <script>window.__xss=1</script> see [the old form](javascript:window.__xss=1)` as literal text. Every T-F10 test attaches its own screenshot (`no-money-*`, `osa-off-*`, `osa-on-*`, `untrusted-*`) and records a video. `test-results/` is git-ignored, so CI's artifacts carry them for the PR (F6).

## What changed

All in the Part 5 territory. `git diff main...HEAD --name-only` lists only these files, the locked tests, Fenn's test report and `locks.md`.

| File | Commit | Why |
| --- | --- | --- |
| `apps/web/package.json` | 1c8c109 | Adds the one script `"check:contract": "node control-room/tools/check-contract.mjs"`, and nothing else |
| `apps/web/control-room/src/mock/onboarding.json` | d94511c | Checkpoint 0.3's package drops `price` (E15; nothing read it). Operator message seq 5 ends with the driver sheet's notes as pasted: `<b>VIP</b> <script>x()</script> [map](javascript:x())` |
| `apps/web/control-room/src/mock/operations.json` | d94511c | M3's first try gains a `read` step quoting a client's note with `<b>`, `<script>` and a `javascript:` link |
| `apps/web/control-room/src/mock/library.json` | d94511c | Client entry `gts-language`'s content ends with a run sheet note holding the same three |
| `apps/web/control-room/src/pages/project/CanonPage.jsx` | 7db5935 | The interview's message list gets `tabIndex={0}`. With the OSA bar on it scrolls with nothing focusable inside, which failed axe's `scrollable-region-focusable` (E17) |
| `apps/web/control-room/src/app/uploads.js` | 7e8fbb1 | A `who()` helper: with OSA's flag off, what OSA sent shows as yours, so no tray row, Drive row, filter, file or version names OSA (CR-29) |
| `apps/web/control-room/src/pages/uploads/UploadStates.jsx` | 7e8fbb1 | With the flag off, the Drive region's live line drops "OSA" |
| `apps/web/control-room/src/pages/uploads/UploadsPages.jsx` | 7e8fbb1 | Tells the upload states page whether OSA's flag is on |
| `apps/web/control-room/src/app/logic.js` | 081ade9 | A deep link's page now shows its title only together with the page, which removes the boot race (below) |
| `apps/web/control-room/SOURCE.md` | d94511c, 7e8fbb1, 081ade9 | One line, with its reason, for every export file changed above. The listed SHA-256 values stay the copied ones (T-F7-02) |

**The boot race (081ade9).** On a deep link, the control room painted the masthead's `h1` over the page's skeleton for 300 to 600 ms while the page's code loaded. I measured this with a throwaway probe, deleted afterwards. T-F10-04 waits for `[data-ui="Skeleton"]` to be gone and then for an `h1`. The skeleton check passes during the route's "Loading the control room" placeholder (`apps/web/src/routes/index.tsx`, outside my territory, with no `data-ui`). The `h1` then shows while `main` is still only a skeleton, and the test read `main` as `""`. In `logic.js`:
- The world is set only once the first page's code has loaded: `pageReady(page, 9e3)` joins the boot's `Promise.all`. After 9 s the world arrives anyway and the skeleton shows.
- Canon's view joins `VIEWS`, so it preloads like the other pages' views.
- `showMast` needs the world (`c.w && …`).

A route change has worked this way since T-F8 ("the title and the page change together"); this extends it to the first load. Decisions (`#/`) needs no page code, so `/`'s first load is unchanged and measured 6 B smaller than before.

## Contract to files

| Requirement | Served by |
| --- | --- |
| T-F10-01: `check-contract.mjs` exits 0; the index names the same routes and event kinds as `packages/contract` | `package.json` (`check:contract`). The index already matched `packages/contract` (the test compares both lists), so no needs-cr |
| T-F10-02: no `$` amount and no price, margin, invoice or payment field in `src/mock/` | `onboarding.json` (price removed) |
| T-F10-03: no `$` on any route, with OSA on and off (E15) | No `$` was found to remove. `CanonPage.jsx` fixes the axe failure this spec hit with the OSA bar on |
| T-F10-04: `<b>`, `<script>` and a `javascript:` link render as literal text in a trail, a Canon message and a Library entry | `operations.json`, `onboarding.json`, `library.json` (the payloads; the export already renders them as text nodes); `logic.js` (the page is there when its title is) |
| T-F10-05: nothing of OSA without `?osa=1`; the OSA bar with it | `uploads.js`, `UploadStates.jsx`, `UploadsPages.jsx` |
| SOURCE.md record (T-F7-02) | `SOURCE.md` |

## Deviations

- **The boot change in `logic.js` goes beyond what T-F10's tasks name.** It changes the export's first paint on deep links: the masthead waits for the world, and the world waits for the first page's code. The export is changed only where the stack forces it. Here, T-F8's code splitting plus the dev server's on-demand loading made the locked test fail 1 run in 3. I chose the app-side fix over a `test-dispute` because it stays in territory, keeps T-F8's stated intent and fits the budget. Zero may prefer that Fenn also harden the test (see Limitations).
- **Attempts 1 and 2's commits are kept as they were.** I verified them against the locked tests and the territory and changed none of them. They carry the operator's git identity, like the lock commit.

## Limitations

- **Budget headroom is 28 B.** Any byte the next ticket adds to `/` fails budget.spec until T-F12 moves the limit to 235 KB (CR-W29, second amendment).
- **Port collisions:** budget.spec's preview port (38114 in this worktree) collided twice with another session's processes during my runs ("Port 38114 is already in use"). It passed on retry. The cause is the shared machine, not this branch; CI is unaffected.
- **A remaining race in the locked tests.** T-F10-04 (and T-F9's `titled`) still treat "no skeleton, then an `h1`" as "loaded", and the route placeholder carries no `data-ui="Skeleton"`. My change makes the `h1` imply the page on first load. A `toContainText` wait in the test would make that independent of the app. That is for Fenn and Zero; I didn't touch it (A3, F2).
- **Lint warnings in test files:** 4 of the 6 Biome warnings are in T-F10's locked specs: 3 × `useDomNodeTextContent` (`no-money.spec.ts:24`, `osa-flag.spec.ts:22`, `untrusted-text.spec.ts:109`), and `noUnusedVariables` for `OSA_TEXT` in `osa-flag.spec.ts:11`. The other 2 are in `e2e/control-room-budget/budget.spec.ts` (T-F8, on main). Biome exits 0. E4 asks for no warnings, but the T-F10 files are locked to me, so this is for Fenn.
- **The Canon payload is in an operator message** that relays a client's pasted notes, not in a Canon-authored message. The test accepts any message in Canon's interview, and the text is untrusted client text either way.
- **Payload visibility:** in the Canon screenshot, the payload message has scrolled out of the interview list's view. The test checks `main`'s text and markup, not what is in view.
- **Local `main` has moved** (b20bf58, #64) since this branch's base. I didn't merge it, so the diff I checked is against the merge base.

## Messages received

None.
