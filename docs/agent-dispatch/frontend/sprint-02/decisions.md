# Frontend sprint-02: decisions

Zero's record of the choices behind the shell contract (`docs/ui-contracts/app-shell.md`) and this plan, and of INT's decisions. Newest last.

## 2026-11-07: The shell contract, revision 1, and the plan (Zero; INT's brief)

INT's brief: the shell with the sidebar, so every later module drops a screen into it; lean, with one contract up front, few rounds and no studies unless a bar fails; Brennan reviews the contract before anything is built. Int may send his own scope docs for the shell layout, navigation and pages later. If he does, they come in as a revision.

- **The shell is DL's v1.6 layout layer, with three widths:**
  - the rail at 1024px and over;
  - the navigation sheet from a top-bar menu button between 761px and 1023px;
  - the phone tab bar at 760px and under.

  These are DL's own breakpoints for the frame. The approval page's 899px stays the page's content breakpoint, and the two hold at once.
- **What's in sprint-02, and what waits** (contract section 0):
  - **In:** the rail (brand, sections, items, the Decisions badge), the top bar's crumb and menu button, the sheet, the tab bar, the screen header, focus mode and the skip link.
  - **Waits for its wave:** collapse, Jump to, the rail foot, theme and depth controls, the project page tree, per-project entries, the Release tab, the mission badge, and the auth shell.
  - **Never:** DL's "Screens / Library" switch and its planned entries. They belong to the library viewer.
- **Nothing moves at hydration,** by construction:
  - every width is a CSS media query;
  - focus mode is an attribute in the server's HTML (S2);
  - the nav indicator isn't measured (S3);
  - the badge is fetched by the `_shell` loader, so it's in the server's HTML.

  This applies cls-study-leah-01's lesson to the shell from the start, instead of finding it again in a study.
- **The nav is complete from day one:** DL's screen tree, minus what waits. Each entry is a real route with a stub screen (`WidgetState` `empty`, "Not built yet"†, and the wave it comes with). Icons follow DL's own fallback: `circle` where DL's screen list has none (S7). So the shell adds one icon (`menu`), which helps the budget.
- **The tab bar** is Decisions, `Projects`† (to `/missions`) and More. DL's Release tab needs an open project, so it comes with W1's Release (S8).
- **Who owns what:**
  - the kit's `AppShell` and `ScreenHeader` are Fantem's, with plain props and a `renderLink`, so the kit stays router-free;
  - the `system` module and the routes are Leon's: the `_shell` pathless layout, the nav model, the badge read through `decisions`'s `index.ts`, and the stubs;
  - the approval page's follow-up (revision 15, the dialog loader, `ScreenHeader`, padding and stylesheet links) goes to **Ghost**, so it builds side by side with Leon's shell instead of a round after it. FM allows naming another builder for a module. It merges after Leon's.
- **What moved here from sprint-01:**
  - **Revision 15 of the approval page contract applies, as written:** D16 is Fantem's; `layout="desk"`, no viewport read and the marker are Ghost's; UC-32 (5abf046) is cherry-picked by Fenn; and the 4x measure is Leah's.
  - **Leon's deep import of `kit/ReasonDialog`:** it goes, in Ghost's follow-up.
  - **The font fallbacks ship** (INT: decide in the contract). They use Leah's one-method values: sans 107.50%, 90.12%, 22.44% and 0.00%; mono unchanged. They take the swap shift to about 0 where Arial or Liberation resolves, and cost two `@font-face` rules. Nemi builds them from his ac820a7. This retires decisions-leah-07 and cls-study-leah-02 to 04 once it's merged.
  - **w0-split-zane-01 closes, accepted:** the guard's `apps/web/src` scope is by design, and no package defines a server function.
- **The budget stays 150 kB** for `/`'s first load. `/` is at 149.30 kB, so the shell has about 0.7 kB of room, and will likely exceed it.
  - It's built lean, and every build reports the number.
  - If Leah's final measure fails, the cut is the thin oRPC link, measured at −7.7 kB in sprint-01 and parked for W2. It comes as a revision and one Ghost dispatch, and isn't built unless the bar fails. That's INT's rule: no study unless a bar fails.
  - **INT may prefer to set the budget for the shell era now:** for example, plan the thin link up front, or move the number. That's his call, and it changes section 6 only.
- **The auth shell waits:** the session is Better Auth's, outside the contract, and the mock has none. It comes with W5's `/login` and W6.
- **Rounds:**
  - R0: Brennan's review.
  - R1: Fenn's unit tests, Fenn's end-to-end tests and Nemi's fonts, side by side.
  - R2: Fantem's kit.
  - R3: Leon's shell and Ghost's page, side by side, with the shell merged first.
  - My reviews follow each build, and Leah's check comes last.
  - No Zane dispatch: there's no new dependency or credential path.
- **Locks:** Fenn's two test dispatches change sprint-01-locked paths (`test/kit/**`, `test/modules/decisions/**`, `e2e/**`, `playwright.config.ts`) by INT's decision in this plan, each commit under `AVEL_LOCK_OVERRIDE`. INT moves the lines after the merges, and adds one for `test/modules/system/**`.

## 2026-11-08: INT confirms the budget and the builder

- **The budget stays 150 kB** for `/`'s first load. The thin oRPC link is built only if Leah's final measure fails (app-shell.md section 6, unchanged).
- **Ghost builds the decisions follow-up** (app-shell.md section 4), beside Leon's shell, as planned.
- Brennan's shell-uic review a1 is open at 04fac4b.

## 2026-11-08: Revision 2 of the shell contract (Brennan's shell-uic a1, FAIL; INT's decisions on 01 and 04)

Brennan's a1 (report fac0a54) failed revision 1 on one P1, five P2s and one P3. Revision 2 answers all seven (app-shell.md, Appendix A).

- **01, the cascade (INT):** DL's final cascade is the value. That's the v1.6 layer, then Mobile chrome, then v1.7.1, then the v1.8 pass, and the last DL rule for the element wins. There's no S9 exception.
  - **What changes:** `main`'s top padding is 24px (16px under 760px). `ScreenHeader` takes v1.7.1's values: the title `clamp(24px, 2.6vw, 28px)` (24px on a phone), the lead 16px/24px (15px/22px), row gap 4px, and the eyebrow at 12.5px on a phone.
  - **Mobile chrome's** 44px icon buttons under 760px are DL's own, so S6 now covers only what DL leaves at desk size.
  - **On `/`:** the header gets smaller than sprint-01's (28px from 32px, and 16px from 17px). That's accepted with the rule.
- **04, the budget (INT):** 150 kB is the target, and 160 kB the hard ceiling, for `/`'s first load on Leah's final measure.
  - **The rule:** over 150 kB is a P2 finding, and the sprint may close. Over 160 kB blocks the close.
  - **The thin oRPC link** is the cut either way. It comes as a revision, with one dispatch per FM row: Ghost on `data/**`, the decisions builder on `modules/decisions/**`, Leon on `modules/system/**` only if the badge's call changes, and Fenn only if a locked test reads oRPC's keys. It departs from FM line 30 and line 192, which INT approves with the revision. The figure is −7.7 kB alone on the 174.35 kB baseline, and −8.6 kB on the stub, not measured on today's main.
  - **One reporting rule:** every build whose diff changes JavaScript that `/` loads reports `/`'s first load from its own build. In sprint-02 that's Fantem, Leon and Ghost.
- **02, as Brennan's report says:**
  - S7 is reworded: DL's planned entries become real links with `circle`, as the contract's own choice.
  - DL's `Phone`/`Preview` area is never drawn: it's the library viewer's.
  - `.lib-route`'s enter animation waits for W2, on client navigations only.
- **03, as Brennan's report says:**
  - Section 3 names each route file (`missions/index.tsx`, so `/missions` isn't the parent of `/missions/new`; `library/$kind.tsx`; onboarding with no `$missionId` layout until W2).
  - The stubs are recorded as a departure from FM's route ownership.
  - The handover rule: the owning module's dispatch takes over its file in its wave and drops `PlannedScreen`.
- **05, as Brennan's report says:** SH-25 tests D16, with a harness inside Fenn's end-to-end territory: `renderToStaticMarkup` of a desk and a phone tag from their source files. Fantem's scratch-page check is replaced by it, so Fantem now also waits for Fenn's end-to-end tests.
- **06, as Brennan's report says:**
  - SH-12 covers the page on the shell, SH-13 the fonts, and SH-14 the shell's marker.
  - SH-01, SH-03, SH-04 and SH-06 are extended.
  - The chrome reset's scope and section 6's numbers are named as review checks.
- **07, as Brennan's report says:**
  - `/`'s head gains `Decisions · AVEL`.
  - Section 4 names Ghost.
  - The onboarding stub draws `circle`.
  - The 120px bottom padding applies only while the tab bar is drawn (`data-tabbar`, as DL keys it).
  - SH-24 compares only drawn elements, listed per width.
- **The plan:** Brennan's re-review is his shell-uic a2. Fenn's dispatches carry the new IDs, Fantem waits for both test dispatches, and Leah reads the 150/160 table. Nothing else in the order changes.
- **INT stops here for now:** no dispatch until INT is back. Next is Brennan's re-review (shell-uic a2), then R1.

## 2026-11-08: Shell layout from v1.9 (INT: the artifact wins; Int's brief; procedures d28e78c)

`docs/ui-contracts/shell-layout.md` (14,999 bytes) and `kit-v1.9.md` replace `app-shell.md`, which is deleted and was never built. Brennan's shell-uic a2 is withdrawn. The new pair gets one first review (`layout-uic`, procedures rule 2).

**The shell:**
- **What it is:** v1.9's shell as the brief lays it out: the rounded canvas, the 264px sidebar with ⌘B collapse to 64px, Jump to and the ⌘K palette, the brief's five groups, project rows with their page tree, the header with Theme, Depth and Display, the tab bar and focus mode.
- **Preferences** live in cookies: `avel-theme`, `avel-depth` (default glass, as in DL), `avel-rail` and `avel-project`. So the first paint is right and nothing moves at hydration.
- **The rounded shell (S1):** DL declares `--canvas-inset` and `--radius-dialog` for "the app canvas" but draws no rule. At 1024px and wider, the page column is an inset, rounded canvas that scrolls. Below that, the window scrolls, as in DL.
- **The highlight still glides (S4),** but only on client navigations. The server's HTML draws it on the current row.
- **The nav is built from routes' `staticData`,** so a page appears in the sidebar and ⌘K once its route exists (the brief), and later modules add entries without touching `system`. This also replaces the stubs: there's no PlannedScreen and no "Not built yet".

**What's open:**
- **Gaps in DL and FM:**
  - icons for the entries DL leaves planned (S5);
  - "Gates and integration" is kept, because DL's label wins over the brief's "Gates";
  - Progress sits at `/missions/$missionId`, as in DL, and not FM's index redirect (S13);
  - FM names no owner for Watch the work (`…/live`), so it goes to `factory`, beside Dispatch. INT can move it.
- **The live footer waits for W2 (S9).** Without a stream, "Live" would be false.
- **Escalations 01 to 03:** waiting counts, project names and the onboarding step, with stand-ins: loaded rows with `+`, `Client · Package`, and no step.

**Scope:**
- **Sprint-02 builds** the shell, the mock (routes 19 and 8), missions (All projects, Progress), clients, system (Settings), and the approval page and kit on v1.9.
- **Sprint-03 gets** the other ten pages, in rounds of 3: New project, Onboarding, Factory live, Business, Client knowledge, Library, Factory versions, Agent roster, Activity, and the project pages (Watch the work, Release, Dispatch, Plan, Gates and integration, Findings). Each copy table lives in that sprint's contract.
- **Why sprint-02 can't take them:**
  - at most 3 dispatches run at once, and reviews count against that;
  - FM allows one module per dispatch;
  - the sidebar's project rows need `missions` and `clients` before `system`, so `system` writes their route files this sprint.

**v1.9 on the built work (kit-v1.9.md):**
- **The kit:** `busy` and `reasonPlacement` on Button; DecisionTag's busy and reasons; ReasonDialog's tip and `ReasonField`; Dialog's exit and `DialogClose`; hover gating.
- **The tokens:** the night `subtle`, `--av-d-exit`, `--av-ease-in`, and DL's two `--av-page-bg` blocks.
- **`base.css`:** `a:hover` is gated.
- **AP's API-driven departures stay,** because route 54 refuses what DL would allow: D8 keeps `stale` with both buttons disabled, and `notAllowed` with no buttons. INT can overrule.

**The budget:** procedures rule 7's CI check replaces app-shell's 150/160 table and the thin-link cut.

**Rounds:**
- R0: Brennan's review.
- R1: Fenn unit, Fenn e2e, and Ghost's mock.
- R2: Fantem's kit and Nemi's styles.
- R3: Leon's missions and Ghost's clients.
- R4: Leon's system, then Ghost's decisions follow-up.
- R5: Leah.
- My reviews fill the free slots.

**Brennan's app-shell a1 findings:**

| Finding | Where it went |
| --- | --- |
| 01 | Section 0: the final cascade |
| 02 | S3 and S5; `.lib-route` isn't drawn |
| 03 | Section 6: who writes the route files; the nav from routes, with no stubs |
| 04 | Rule 7 replaces the cut |
| 05 | SH-25 |
| 06 | SH-12 to SH-14 |
| 07 | `/`'s title, Ghost named, focus mode's padding through `data-tabbar`, and SH-24's drawn elements |

## 2026-11-08: INT confirms the shell layout's three open calls

- **Sprint-02's scope:** the shell plus All projects, Progress, Clients and Settings. The other ten pages go to sprint-03, and the nav is built from routes.
- **AP's two departures stay,** because route 54 refuses both: `stale` disables Reject too, and `notAllowed` draws no buttons (`kit-v1.9.md` section 1, as written).
- **Watch the work (`…/live`)** goes to `factory`.

The contracts and the plan already say this, so nothing is re-rendered. Next is Brennan's layout-uic review, on Int's word.
