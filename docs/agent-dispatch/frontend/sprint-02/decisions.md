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
