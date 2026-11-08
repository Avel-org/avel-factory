# UI contract: the app shell (frontend sprint-02)

Zero, 2026-11-07. Status: **revision 2, for Brennan's re-review.** Revision 1 (04fac4b) failed Brennan's shell-uic a1 on findings 01 to 07. Revision 2 answers them with INT's decisions on 01 and 04 (Appendix A; Decisions, "Revision 2"). Nothing is built against it until a review of it is merged. It settles the shell's layout questions up front, so sprint-02 is built in as few rounds as the rules allow (INT's brief). It also folds in what moved here from sprint-01: the approval page contract's revision 15, Leon's deep import, the font fallbacks, and w0-split-zane-01. Decisions are in `docs/agent-dispatch/frontend/sprint-02/decisions.md`. If Int sends his own scope docs for the shell, they come in as a revision.

Copy marked † is the shell's own; everything else is the design library's (DL) word for word. Values follow the approval page contract's section 0 rule: a `--av-*` token, or DL's own literal for that element, with its source in a comment.

**DL's final cascade is the value** (revision 2; INT, on shell-uic-brennan-01). DL has one `<style>` block, and its later layers override earlier ones: library.css, then the v1.6 layout layer, then "Mobile chrome", then "v1.7.1", then the v1.8 pass. For each element, the last DL rule that applies at that width wins. A value DL itself overrides later is never the contract's. There's no exception to this rule: where the shell departs from DL, it's a numbered change in section 2, never an older DL value kept.

## 0. Scope and sources

**Sources:**
- **FM:** the Frontend Map v0.6: Routes, Layers, Folder layout, Territories for Gate 1, Performance budgets, and Build order (W0's "auth shell, theme cookie").
- **DL:** the design library v1.1 file. Its "v1.6 layout layer" draws the shell, and its "Mobile chrome", "v1.7.1" and v1.8 layers adjust it (the cascade rule above). The parts: the chrome reset, `.lib-app`, `.lib-aside`, `.lib-rail`, `.lib-topbar`, `.lib-sheet`, `.lib-tabbar`, `.scr-head`, focus mode, and the rail's screen tree (`mw`, `pm`). The rules quoted below are from that file, found by grepping their class names.
- **The approval page contract:** `docs/ui-contracts/decisions-approval-page.md`, revision 15. Section 4 of this contract cites its sections as "AP §N".

**What sprint-02 builds:**
- the shell frame on every screen: rail, top bar, navigation sheet, phone tab bar, screen header and focus mode (sections 1 and 2);
- the `_shell` layout route, the `system` module's navigation, and a stub screen for every screen in the nav, so the nav is complete from day one (section 3);
- the approval page's revision 15, on the shell (section 4);
- the size-matched font fallbacks (section 5).

**What waits, and why:**

| DL part | Waits for | Why |
| --- | --- | --- |
| Rail collapse to icons (Cmd-B, `--rail-w-collapsed`) | W5, with Settings | A preference cookie, read on the server, as the theme is. Nothing in sprint-02 needs it |
| "Jump to" and the command palette (Cmd-K) | W2 | Its actions need missions and the live layer |
| The rail's "Screens / Library" switch | never | It switches the design library's own pages, not the product's |
| The rail foot ("Simulator live") | W2 | In the product it's the stream status, which the live layer owns |
| The top bar's Theme, Depth and Display controls | W5, with Settings | The theme cookie is read today (sprint-01), and Settings writes it. There's no depth token in `tokens.css` |
| A project's page tree (`.lib-nav-children`), and the per-project and per-client entries ("Onboarding: Fleet portal", "Project: Landing page", "Client knowledge: GTS Diesel") | W2 and W4 | They're drawn from missions and clients data |
| "Planned" entries and "Show planned screens" | never | Every entry is a real route with a stub screen (section 3, S7) |
| The `Phone` area, drawn as `Preview`, with its `Phone` and `Screen map` entries | never | They preview the library's own screens at phone width and map its routes. Like the "Screens / Library" switch, they belong to the library viewer |
| `.lib-route`'s enter animation (`lib-route-in`, opacity and a 6px rise) | W2, on client navigations only | On the server's first paint it would hold the content back by `--av-d-arrive`. Sprint-02 draws screens without it |
| The phone tab bar's Release tab | W1's Release, with a project open | `…/release` needs a mission. Until then the bar has no Release tab (S8) |
| The mission badge ("{n} for you") | W2 | It needs CR-W5's needs-you count |
| The auth shell (`beforeLoad` redirecting to `/login?next=`) | W5 (`system`, `/login`) and W6 | The session is Better Auth's, outside the contract, and the contract mock has none. A redirect now would have nothing to read |

## 1. Layout

**The frame** is DL's, keyed on the frame element instead of `<html>`:

```text
a.av-skip "Skip to content"  (to #main)
div[data-ui="AppShell"]                         DL .lib-app
  aside                                         DL .lib-aside: the rail
  div.av-shell-col                              DL .lib-main-col
    header                                      DL .lib-topbar: menu button, crumb
    main#main (tabindex -1)                     DL .lib-main
      {the screen}
  div.av-sheet-scrim + div[role=dialog]         DL .lib-sheet-scrim, .lib-sheet: the rail again
  nav "Main"                                    DL .lib-tabbar
```

**Three widths**, as DL draws them:

| Width | Rail | Top bar | Sheet | Tab bar |
| --- | --- | --- | --- | --- |
| 1024px and over | The aside, `264px` wide (DL's `--rail-w`), sticky, full height | Crumb only | Never shown (`display: none`) | none |
| 761px to 1023px | Hidden | Menu button ("Open navigation") and crumb | Opens from the menu button | none |
| 760px and under | Hidden | Crumb only (the menu button hides, as in DL) | Opens from the tab bar's More | Fixed at the bottom; `main` gets `padding-bottom: 120px` while the tab bar is drawn |

- **The breakpoints are DL's shell breakpoints:** `max-width: 1023px` (the rail goes) and `max-width: 760px` (the tab bar comes). They're separate from the approval page's phone width, `max-width: 899px` (AP §5, "Phone"), which only lays out the page's content. Both hold at once. At 800px, for example, the page draws its phone cards (AP D16) while the shell shows the top bar's menu button and no tab bar.
- **`main`'s padding** is DL's final `.lib-main`: `24px clamp(16px, 4vw, 52px) 160px` (v1.7.1's top). Under `max-width: 760px` the top is `16px` (v1.7.1). The bottom is `120px` only while the tab bar is drawn: DL keys it on `.lib-app[data-tabbar]`, which `AppShell` mirrors as `data-tabbar` on its element. In focus mode there's no tab bar, so the bottom stays `160px`. The screens inside draw no outer padding of their own (section 4).

**Nothing in the shell moves at hydration** (cls-study-leah-01's lesson, applied to the shell). Every width above is decided by CSS media queries on the server's HTML:
- no JavaScript reads the viewport;
- no indicator is measured and moved (S3);
- the badge is in the server's HTML (section 3);
- the sheet is closed in the server's HTML, and only a user's tap opens it.

**Focus mode** (DL's, for Canon onboarding). A route that sets `staticData.focus` draws:
- no aside, at any width;
- no tab bar;
- the top bar's menu button, at every width, opening the sheet (DL: `html[data-focus] .lib-icon-btn.lib-only-narrow { display: inline-grid }`, and the sheet shown at 1024px and over).

`data-focus` goes on the `AppShell` element in the server's HTML, never set on `<html>` by an effect (S2). In sprint-02, only the onboarding stub sets it (section 3).

**Touch sizes.** DL's own phone rules come first: under `max-width: 760px`, "Mobile chrome" makes `.lib-icon-btn` (the menu button, the sheet's close button) `44px` square and the top bar's gap `8px`. The tab bar's tabs are `min-height: 52px`. Under `(pointer: coarse)`, v1.8 makes the skip link at least `44px`.

**K1 on the shell** (the approval page's K1, AP §4; S6) adds what DL leaves at its desk size. Under `max-width: 899px`:
- the nav items in the sheet and the rail are at least `var(--av-touch-min)` (44px) tall;
- the icon buttons between 761px and 899px are at least 44px too.

The drawn icons keep DL's size. At 900px and over, DL's sizes hold: 34px items and 36px icon buttons.

## 2. The kit (Fantem, `apps/web/src/kit/**`)

### `AppShell`

The whole frame, in one component with plain props, so the kit knows nothing about the router (FM, Layers).

```ts
type ShellIcon = "inbox" | "wallet" | "circle" | "list-checks";   // DL's icons for these entries (section 3)

type ShellNavItem = {
  id: string;                         // the nav id a route names in staticData.nav
  label: string;
  href: string;
  icon: ShellIcon;
  badge?: { text: string; label: string };   // "4", "4 waiting"
};

type ShellNavSection = { label: string; items: ShellNavItem[] };

type ShellTab = { id: string; label: string; href: string; icon: ShellIcon; badge?: ShellNavItem["badge"] };

type ShellLinkProps = {
  href: string;
  className: string;
  "aria-current"?: "page";
  "aria-label"?: string;
  onClick?: () => void;               // the sheet closes on a link's click
  children: React.ReactNode;
};

type AppShellProps = {
  sections: ShellNavSection[];
  tabs: ShellTab[];                   // the tab bar's links; AppShell adds More
  currentId: string | null;           // the nav item and tab for the current screen
  crumb: string;                      // the top bar's one crumb (DL: a screen shows its label)
  focus?: boolean;
  renderLink: (props: ShellLinkProps) => React.ReactNode;
  children: React.ReactNode;
};
```

**What it draws:**
- **Brand:** DL's mark (the 18×18 SVG: the rounded square and the "A" paths, values as DL draws them), `AVEL`, and the sub line `Control room` (S1). It's a link to `/`, through `renderLink`.
- **The nav:** `nav` with `aria-label="Screens"` (DL). It holds one `.lib-nav-sec` per section, with its group label (DL's `.lib-nav-group` values), then its items (DL's `.lib-nav-item`): the icon at 16px, the label, and the badge (DL's `.lib-nav-badge`, with `aria-label` = `badge.label`). The current item has `aria-current="page"`.
- **The top bar:** DL's `.lib-topbar` values. It holds the menu button (`aria-label` `Open navigation`, `aria-expanded`), then the crumb in a `nav` with `aria-label="Breadcrumb"`. The crumb is the `.lib-crumb` with `data-last` and `aria-current="page"`.
- **The sheet:** DL's `.lib-sheet` and `.lib-sheet-scrim`, with `role="dialog"`, `aria-modal="true"` and `aria-label="Navigation"`. It holds the close button (`aria-label` `Close navigation`, icon `x`), the brand and the nav.
  - **While it's closed** it's `inert`, so nothing in it takes focus.
  - **Opening it** moves focus to the close button and traps Tab inside the sheet. Escape, the scrim, the close button and any link in it close it, and focus goes back to whatever opened it. Use the kit's `useDialogFocus`.
  - Under `prefers-reduced-motion`, it opens without its slide (DL's `--av-d-sheet` covers this, if the reduced-motion tokens set it to 0).
- **The tab bar:** `nav` with `aria-label="Main"` (DL), one DL `.lib-tab` per `ShellTab`, then `More` (icon `menu`), which opens the sheet. The current tab has `aria-current="page"`. A badge is DL's `.lib-tab-badge`. There's one grid column per tab, More included (S8).
- **The skip link:** DL's `.lib-skip`, `Skip to content`, moving focus to `main#main`. Its final values are v1.8's: `top: -72px`, and `translateY(84px)` on focus.
- **`data-tabbar`** on the `AppShell` element whenever the tab bar is drawn (that is, without `focus`). It's DL's `.lib-app[data-tabbar]` hook for `main`'s 120px bottom padding under 760px.
- **The hydration marker:** `data-hydrated="true"` on the `AppShell` element, absent from the server's HTML and the hydration render, and set in a commit after hydration. It follows the approval page's marker rule (AP §5, revision 15). It's for tests only, and nothing is styled on it.
- **The chrome reset:** DL's v1.6 rules go in `kit.css` scoped under `[data-ui="AppShell"]`, except the ones that are about the document: `::selection`, `:focus-visible`, hidden scrollbars and the form-control resets. Those apply to the document, as in DL.

### `ScreenHeader`

DL's `.scr-head`: `data-ui="ScreenHeader"`, `{ eyebrow?: string; title: string; lead?: string | null; side?: React.ReactNode }`.
- **What it draws:** the eyebrow, the title as the page's `h1`, the side slot, and the lead as a `p`.
- **Layout:** DL's grid (`"eyebrow eyebrow" "title side" "lead lead"`), one column under `max-width: 760px`.
- **Values: DL's final cascade** (revision 2):

  | Part | 761px and over | 760px and under |
  | --- | --- | --- |
  | `.scr-head` | grid, `column-gap: 24px`, `row-gap: 4px` (v1.7.1), `align-items: center` | one column: eyebrow, title, lead, side |
  | `.scr-eyebrow` | `var(--av-muted)`, `13px`, weight 500 | `12.5px` (v1.7.1) |
  | `.scr-title` (`h1`) | `margin: 0`, `clamp(24px, 2.6vw, 28px)` (v1.7.1), line height 1.15, weight 650, `letter-spacing: -0.024em` | `24px` (v1.7.1) |
  | `.scr-lead` | `16px`/`24px`, `margin-top: 2px` (v1.7.1), `var(--av-ink)`, `max-width: 78ch` | `15px`/`22px` (v1.7.1) |
  | `.scr-head-side` | flex, `gap: 10px`, `justify-content: flex-end`, no wrap | `justify-content: flex-start`, wrap, `margin-top: 4px`, `gap: 8px` (v1.7.1) |

  Every screen's header is this component from sprint-02 (section 4). On `/` the title and lead get smaller than sprint-01's (28px from 32px, and 16px from 17px), because they now follow DL's final values.

### Smaller changes

- **Icons:** `Icon` adds `menu`, and nothing else. `inbox`, `wallet`, `circle`, `list-checks` and `x` are already in it. DL's `message-circle` for Canon waits for W4's onboarding screen. The onboarding stub draws `circle` (section 3).
- **D16** (AP §4, revision 15): the desk layout draws the phone layout under `max-width: 899px` from `kit.css` alone, with the same check as AP gives. Fantem builds it here.
- **`kit/index.ts`** exports `AppShell`, `ScreenHeader` and their types by name.

### Changes from DL

| # | Change | Why |
| --- | --- | --- |
| S1 | The brand's sub line is `Control room`, without DL's `v1.8` | The `v1.8` is the library's own version label (FM, Design library follow-ups: "One version label") |
| S2 | `data-focus` goes on the `AppShell` element in the server's HTML, not on `<html>` from an effect. DL's `html[data-focus]` selectors become `[data-ui="AppShell"][data-focus]` | Set by an effect, it would move the layout after hydration |
| S3 | No animated nav indicator. DL's `.lib-nav-indicator` is measured and moved in a layout effect. Here the current item itself draws the indicator's look (`background: var(--av-chip)`, `box-shadow: var(--av-shadow-raised)`) | A measured element is placed after hydration (section 1). The look is the same; the 260ms slide between items goes |
| S4 | Items carry `href` and are links through `renderLink` (DL's are `#` anchors with handlers) | Real routes; the router intercepts the click and the link still works before hydration |
| S5 | The rail draws no modes, search, collapse toggle or foot | Section 0's table |
| S6 | K1's 44px applies to the shell's nav items under `max-width: 899px`, and to its icon buttons between 761px and 899px, where DL's own Mobile chrome rule doesn't reach | DL v1.8's touch rule ("Every target 44px minimum"), as the approval page applies it at its phone width (AP K1) |
| S7 | DL's planned entries become real links. In DL, an `mw` entry with no `id` (All projects, New project, Factory live, Clients, Library, Factory versions, Agent roster, Activity, Settings) is a planned entry: a `span.lib-nav-item.lib-nav-planned` with a `.lib-nav-dot`, its label and `planned`, titled "Planned in the Frontend Map" and hidden until "Show planned screens". Here each is a link (`.lib-nav-item`) to its stub route, with `circle` as its icon. That's the contract's own choice. It borrows DL's fallback for linked entries without an icon in `pm` (`M.icon \|\| "circle"`) | Every entry is a real route from day one (section 3), so none is planned. DL has no icon for these screens yet |
| S8 | The tab bar has one column per tab, and no Release tab until a project is open | DL's `repeat(4, 1fr)` is for its four tabs; Release needs a mission (section 0) |

## 3. The shell route and the `system` module (Leon, `apps/web/src/modules/system/**`, `apps/web/src/routes/**`)

**The routes:**
- **`routes/_shell.tsx`** is a pathless layout route (id `_shell`) under `__root`. Every screen in sprint-02 is under it. A route outside it, such as W5's `/login`, gets no shell.
- `routes/index.tsx` moves to `routes/_shell/index.tsx`. Its URL stays `/`, and its loader and `ssr: true` are unchanged. Its head keeps its stylesheet links and gains the title `Decisions · AVEL`† (the title rule below).
- `__root.tsx` doesn't change. It's Nemi's file, and nothing here needs it.

**`_shell.tsx`:**
- **`ssr: true`.**
- **Its loader** awaits `ensurePendingDecisions(context.queryClient)` (from `decisions`'s `index.ts`), so the badge is in the server's HTML. On `/`, the route's own loader asks for the same query, and the client makes it once. A failed load is swallowed here, as `/` swallows it: the badge just isn't drawn.
- **Its head** links `kitStylesheetHref`, so every screen under it has `kit.css`.
- **Its component** is `system`'s `ShellLayout`, from `screens.ts`, rendering the matched screen in `<Outlet />`.

**`ShellLayout`** builds `AppShell`'s props:
- **The sections and items:** the table below, exactly.
- **`currentId`:** the deepest matched route's `staticData.nav`, or `null`.
- **`crumb`:** the item with that id's label, or else the deepest match's `staticData.title`.
- **`focus`:** the deepest match's `staticData.focus`.
- **`renderLink`:** TanStack Router's `Link`, which preloads on intent (FM, Routes).
- **The badge:** `useQuery(pendingDecisionsOptions(api))` with `api` from the data core. The text is the approval page's count rule (AP §5, "The count"): the rows drawn, then `+` while `nextCursor` isn't null. Its `label` is `{text} waiting` (DL). With 0 rows and no more pages, or no data, or an error, there's no badge. It's on the Decisions item and the Decisions tab.
- **The document title** is `{crumb} · AVEL`†, set in each route's head from the same label. The page needs a title (WCAG 2.4.2), and DL sets none.

**The nav** (DL's screen tree `mw`: its areas, labels and order, minus what section 0 defers):

| Section | Nav id | Label | `href` | Icon | Stub's lead (DL's `what`) | Comes with |
| --- | --- | --- | --- | --- | --- | --- |
| Decide | `decisions` | Decisions | `/` | `inbox` | (the real page) | built |
| Projects | `missions` | All projects | `/missions` | `circle` | Every mission, filter by state, client, package | W2 |
| Projects | `missions-new` | New project | `/missions/new` | `circle` | Pick or create a client, then start Canon | W4 |
| Watch | `live` | Factory live | `/live` | `circle` | Every running builder across projects, and the event river | W2 |
| Business | `business` | Business | `/business` | `wallet` | Cost, budgets, margin, payments: the one place money lives | W5 |
| Business | `clients` | Clients | `/clients` | `circle` | Clients and repo connections, step-up for credentials | W5 |
| Factory | `library` | Library | `/library/skills` | `circle` | Skills, global and stack knowledge, rules, templates | W5 |
| Factory | `factory` | Factory versions | `/factory` | `circle` | Versions and open changes | W5 |
| Factory | `roster` | Agent roster | `/roster` | `circle` | Who the AI builders are and what they do | W5 |
| Factory | `activity` | Activity | `/activity` | `circle` | The audit log, overrides included | W5 |
| Factory | `settings` | Settings | `/settings` | `circle` | Theme, CLI sessions, health | W5 |

- **The tabs:** Decisions (`decisions`, `/`, `inbox`, with the badge) and `Projects`† (`missions`, `/missions`, `list-checks`, DL's Project tab icon), then More. DL's tab is "Project", one project. Until a project can be open, the tab goes to the list, so it's named after DL's "Projects" area.
- **Library's `href`:** FM's route is `/library/$kind`. The nav opens its first kind, `skills` (the API's library kinds: skills, kb-entries, rules, templates).
- **Not in the nav:** `/decisions/$ref` (W1, a sheet over the list), `/cli/approve/$userCode`, and `/login`. Each comes as a route with its screen.

**The route files** (revision 2; shell-uic-brennan-03), all under `apps/web/src/routes/`:

| URL | File | Note |
| --- | --- | --- |
| (layout) | `_shell.tsx` | The pathless layout |
| `/` | `_shell/index.tsx` | Moved from `index.tsx` |
| `/missions` | `_shell/missions/index.tsx` | An index route, so it isn't the parent of the two below. A `missions.tsx` would be, and with no `<Outlet />` in a stub, `/missions/new` would draw All projects |
| `/missions/new` | `_shell/missions/new.tsx` | |
| `/missions/$missionId/onboarding` | `_shell/missions/$missionId/onboarding.tsx` | There's no `$missionId` layout file yet. FM's mission layout (L2, `/missions/$missionId`) comes with W2 as `_shell/missions/$missionId.tsx`, and becomes this route's parent |
| `/live` | `_shell/live.tsx` | |
| `/business` | `_shell/business.tsx` | |
| `/clients` | `_shell/clients/index.tsx` | `/clients/$clientId` comes beside it in W5 |
| `/library/$kind` | `_shell/library/$kind.tsx` | FM's route. Every `kind` draws the Library stub until W5's `knowledge` validates the kind. The nav links `/library/skills` |
| `/factory` | `_shell/factory.tsx` | |
| `/roster` | `_shell/roster.tsx` | |
| `/activity` | `_shell/activity.tsx` | |
| `/settings` | `_shell/settings.tsx` | |

**The stubs are a departure from FM's route ownership** (revision 2; shell-uic-brennan-03). FM gives each route to its module: `/missions` to `missions`; `/missions/new` and onboarding to `onboarding`; `/live` to `events`; `/business` to `metering`; `/clients` to `clients`; `/library/…` and `/factory` to `knowledge`; `/roster` to `roster`; `/activity` to `audit`. Only `/settings` is `system`'s.
- **Who writes them:** in sprint-02, Leon's `system` dispatch writes all ten files, each rendering `system`'s `PlannedScreen`. That's how the nav is complete from day one, with no dead link (INT's brief).
- **The handover rule:** the owning module's dispatch, in its wave, takes over its route file. It replaces the component with its own screen, sets its own loader and SSR mode, keeps the URL and `staticData.nav`, and drops the `PlannedScreen` import. When no route file imports `PlannedScreen`, `system` removes it.

**Stub screens.** Each row but Decisions has its route file (`ssr: true`, no loader) rendering `system`'s `PlannedScreen` with:
- `staticData: { nav: <its id> }`;
- the item's label as `title`;
- its section as `eyebrow`;
- DL's `what` (the table's column) as `lead`;
- its "Comes with" wave.

`PlannedScreen` draws `ScreenHeader`, then the kit's `WidgetState`:
- `state="empty"`, with the item's icon;
- title `Not built yet`†;
- message `This screen comes with {wave} in the Frontend Map's build order.`†, where `{wave}` is `W2 (the live layer)`, `W4 (Canon onboarding)` or `W5 (the rest)`;
- no action.

`empty`, not `notConfigured`: DL's `notConfigured` always draws "Set up", and there's nothing to set up.

**The focus-mode stub:** `/missions/$missionId/onboarding`, with `staticData: { focus: true, title: "Onboarding with Canon" }` (DL's screen-list label). It renders `PlannedScreen` with the icon `circle` (DL's `message-circle` waits for W4, section 2), eyebrow `Projects`, DL's `what` for it ("Talk with Canon; approve the brief, breakdown, team and context, then the plan") and W4. Its `$missionId` isn't read. It's there so focus mode is built and tested now.

**`system`'s surface:**
- `index.ts` exports nothing in sprint-02.
- `screens.ts` exports `ShellLayout` and `PlannedScreen`.
- No `system` file imports another module except through its `index.ts` (FM, What every module looks like). `decisions`'s `index.ts` already exports `pendingDecisionsOptions` and `ensurePendingDecisions`.

## 4. The approval page on the shell (Ghost, `apps/web/src/modules/decisions/**`)

- **Revision 15 of the approval page contract applies from sprint-02**, as written: D16 (Fantem, section 2), every tag drawn with `layout="desk"` and no viewport read in the module (AP §5, "Phone"), the marker rule (AP §5), UC-32 (AP §7), and section 6's measure with the 4x throttle (AP §6, used by Leah's measure in section 6 here).
- **R7's deep import goes** (sprint-01 accepted it for sprint-01 only). The page loads `ReasonDialog` through `loadReasonDialog` from the kit's `index.ts`, and no file in the module imports past `kit/index.ts`.
- **The header is `ScreenHeader`:** eyebrow `Home` and title `Decisions` (DL), and the lead as AP §5 gives it. `.dec-head`, `.dec-eyebrow`, `.dec-title` and `.dec-lead` leave `decisions.css`.
- **`.dec-page` loses its padding:** `main` has it now (section 1). It keeps its flex column, gap and max width.
- **The stylesheets:** `decisionsScreenStylesheets` drops `kitStylesheetHref`, which `_shell`'s head now links, and keeps the module's own sheet.
- **Merge order:** this merges after `system`'s shell (section 3). Merged before it, `/` would lose `kit.css` and its padding.

## 5. Fonts

**The size-matched fallbacks ship** (INT: decided here, no study). They're Nemi's `ac820a7` (`font-fallbacks.css`, imported last in `app.css`), with the sans rule's values from one average-width method for both files (Leah's cls-study a2, findings 03 and 04):
- **The method, for both files:** `size-adjust` = the real face's average advance ÷ the fallback's. The average is weighted over a to z and space, by OS/2 v3's definition of `xAvgCharWidth`, measured from the glyph advances: Inter 972.28 and Arial 904.46 per 2048 units (Arial's stored v3 value is 904, so the method checks).
- **The sans rule:** `size-adjust: 107.50%`, `ascent-override: 90.12%`, `descent-override: 22.44%`, `line-gap-override: 0.00%`. The comment above it gives these inputs. The overrides are worked from the unrounded 1.07498.
- **The mono rule is unchanged** (`99.98%`, `102.52%`, `27.50%`, `0.00%`): both files already use the advance of `0`.
- **The limit:** they apply only where `local("Arial")` / `local("Liberation Sans")` and `local("Courier New")` / `local("Liberation Mono")` resolve. Elsewhere (Android) the stack falls through as before.
- This replaces AP §6's formula text and its "Held" paragraph.

## 6. Budget, measures and loose ends

**The budget for `/`'s first load** (revision 2; INT, on shell-uic-brennan-04) is counted as AP §8 counts it: gzipped JavaScript, every file `/` loads before it can be used.

| Leah's final measure on main | What it means |
| --- | --- |
| 150 kB or under | The target is met |
| Over 150 kB, up to 160 kB | A P2 finding. Sprint-02 may close with it open. The thin oRPC link cut below follows, scheduled by INT |
| Over 160 kB | The hard ceiling is broken. Sprint-02 doesn't close until `/` is at 160 kB or under. The cut is dispatched at once, and if it isn't enough, INT decides the next step |

`/` was 149.30 kB on main before the shell, so the shell has about 0.7 kB of room to the target and 10.7 kB to the ceiling.
- **It's built lean:** no measured indicator, no palette, one new icon, and no client-only state but the sheet's open flag.
- **Who reports the number (one rule):** every build dispatch whose diff changes JavaScript that `/` loads reports `/`'s first load from its own build, counted as AP §8 counts it. In sprint-02 that's Fantem's shell kit, Leon's `system` and Ghost's decisions follow-up. Nemi's fonts change CSS only, so they report nothing. Leah's final measure on main is the one the table above reads.

**The thin oRPC link cut**, if the table calls for it, comes as a revision of this contract, with these dispatches, one FM territory row each:
1. Ghost on `apps/web/src/data/**` (FM: Data core): a thin link in `data/client.ts`, `errors.ts` and a new `thin-link.ts`, replacing `createTanstackQueryUtils`.
2. The decisions module's builder on `apps/web/src/modules/decisions/**` (FM: One module): `api.ts`'s query options and keys, written by hand.
3. Leon on `apps/web/src/modules/system/**` (FM: One module), only if `api`'s type or `pendingDecisionsOptions`'s signature changes for the badge.
4. Fenn under a lock override, only if a locked test reads oRPC's query keys.

- **What it departs from:** FM's data layer. FM line 30 says "Every read and write goes through the typed oRPC client", and FM line 192 says `createTanstackQueryUtils(client)` gives the query options, and "Query keys come from oRPC". The cut keeps the contract's types but replaces oRPC's client and query utilities on the web, so it's a change to FM's data layer, which INT approves with the revision.
- **The figure:** −7.7 kB alone on the 174.35 kB baseline, and −8.6 kB on top of the server-function stub (size-study-leah-03). It hasn't been measured on today's main. The revision measures it first, as sprint-01 decided ("W2, measured first").

**Layout shift under 0.02** (FM) is measured as AP §6 gives it, with the 4x throttle, on:
- `/` at 390x844;
- `/missions` at 390x844 and 1280x800, for the shell alone.

**w0-split-zane-01 closes, accepted:** the `createServerFn` guard scans `apps/web/src` only, by design (AP §6). The web defines no server function anywhere, and `packages/contract` holds schemas only. A server function in a workspace package would be a contract change first, and the guard's scope would change with it.

## 7. Scenarios (Fenn's test IDs)

**Unit** (Vitest and Testing Library, `apps/web/test/**`):

| ID | What it checks |
| --- | --- |
| SH-01 | `AppShell` draws the brand (`AVEL`, `Control room`), one `nav` "Screens" with the sections and items it's given in order, and each item through `renderLink` with its `href`. The current item has `aria-current="page"`, and no other does. The crumb is in a `nav` "Breadcrumb", with `aria-current="page"` and `data-last` |
| SH-02 | A badge draws its text with its `aria-label`. No `badge`, no badge element. The tab bar repeats it on its tab |
| SH-03 | The sheet: in `renderToString`'s HTML it's closed (no `data-open`) and `inert`, and so it is after mount. The menu button (`aria-expanded` false) and More open it. Focus moves to `Close navigation`; Tab stays inside; Escape, the scrim, the close button and a link close it, and focus goes back to the opener |
| SH-04 | `focus` sets `data-focus` on the `AppShell` element. With `focus`, the tab bar isn't drawn and there's no `data-tabbar`; without it, `data-tabbar` is set |
| SH-05 | The skip link `Skip to content` moves focus to `main#main` |
| SH-06 | `kit.css`, read as text, holds DL's final values (section 0's cascade rule): the aside's `264px` column from `min-width: 1024px`; the aside hidden under `max-width: 1023px`; the tab bar under `max-width: 760px`; `main`'s padding `24px clamp(16px, 4vw, 52px) 160px`, `16px` top under 760px, and `120px` bottom keyed on `[data-tabbar]` under 760px; the icon buttons at `44px` under 760px; the shell's K1 rules under `max-width: 899px`; the focus rules keyed on `[data-ui="AppShell"][data-focus]`; and `ScreenHeader`'s values and its one-column rule under 760px (section 2's table) |
| SH-07 | `ScreenHeader` draws the eyebrow, an `h1` title, the lead and the side slot; no `lead`, no `p` |
| SH-08 | `ShellLayout` on the contract mock: the sections, labels, `href`s and icons are section 3's table, in its order, and the tabs are Decisions, `Projects`† and More |
| SH-09 | The badge from route 52 on the mock: `fixtures.step1` → `4` (`4 waiting`); 50 rows with more → `50+`; an empty list → no badge; `failNext(52, …)` → no badge, and the shell still draws |
| SH-10 | `currentId`, the crumb and the document title follow the route: `/` → Decisions; `/missions` → All projects; the onboarding stub → `Onboarding with Canon`, with `focus` |
| SH-11 | Each stub screen draws its `ScreenHeader` (eyebrow, title, lead from the table) and `WidgetState` `empty` with `Not built yet`† and its wave line, and no button |
| SH-12 | The approval page on the shell (section 4): no file under `apps/web/src/modules/decisions` imports from `kit/` except through `kit/index.ts` (the source read as text); the page's header is `ScreenHeader` (`data-ui`, eyebrow `Home`, `h1` `Decisions`, the lead); `decisions.css` (as text) has no `.dec-head`, `.dec-eyebrow`, `.dec-title` or `.dec-lead` rule and no `padding` on `.dec-page`; `decisionsScreenStylesheets` is the module's own sheet only |
| SH-13 | The fonts (section 5): `font-fallbacks.css` read as text has the sans rule (`local("Arial")`, `local("Liberation Sans")`; `107.50%`, `90.12%`, `22.44%`, `0.00%`) and the mono rule unchanged (`local("Courier New")`, `local("Liberation Mono")`; `99.98%`, `102.52%`, `27.50%`, `0.00%`); the four stack variables put each fallback family second; and `app.css` imports it last |
| SH-14 | The shell's marker (section 2): `data-hydrated` is absent from `renderToString`'s HTML of `AppShell`, and absent in the hydration render, and present after `hydrateRoot` has committed |

**End to end** (Playwright, `apps/web/e2e/**`, the phone and desk projects as today, plus a 900x1000 project for the middle width). Section 1's chrome reset scope and section 6's budget and layout shift are review checks (section 8), not tests:

| ID | Flow |
| --- | --- |
| SH-20 | Desk, 1280: `/` server-rendered inside the shell: the aside, the nav with Decisions current and its badge `4` in the server's HTML; no tab bar; no menu button. Click All projects: `/missions`, its stub, the crumb and title change, and nothing reloads |
| SH-21 | 900: no aside; Open navigation opens the sheet; focus is inside it; a link navigates and closes it; Escape closes it and focus returns to the menu button |
| SH-22 | Phone, 390: the tab bar with Decisions current and its badge; More opens the sheet; each nav item and tab is at least 44px tall; no sideways scroll |
| SH-23 | Focus mode: `/missions/m1/onboarding` at 1280 has no aside, the menu button, and opens the sheet; at 390 it has no tab bar |
| SH-24 | Nothing moves at hydration (AP's UC-32 method), on `/` and `/missions`. The rects of drawn elements only, within 1px, with JavaScript off against after the marker (AP §5's `data-hydrated` on `/`'s page root; the `AppShell` element's on `/missions`, section 2). At 1280: the aside's Decisions item, the top bar and the `h1`. At 900: the top bar, the menu button and the `h1`. At 390: the top bar, the tab bar, its Decisions tab and the `h1` |
| SH-25 | D16 (AP §4, revision 15; shell-uic-brennan-05). The harness is inside `apps/web/e2e/**`: the test renders a desk and a phone `DecisionTag` with the same props using `react-dom/server`'s `renderToStaticMarkup`. It imports `DecisionTag` and the row-prop helpers (`proposalTagProps`, `factoryChangeTagProps`) from their source files: a test may import any source file, and `kit/index.ts` carries a `?url` import that Node can't load. If the harness can't load them, Fenn stops and reports it under Deviations, with another harness inside his territory to propose. It sets them into a page that links the dev server's `app.css` and `kit.css`, by the URLs in `/`'s server HTML. The rows: a decidable row with facts, a `factory_change` row, a stale row, and a `notAllowed` row with Refresh list, from `fixtures.step1` and the states D7 to D10 give. At 390: the article, head, title, facts list, footer, and each button and link match within 1px between the two. At 1280: the desk tag's rects are what main draws today. It runs on the phone and desk projects |
| UC-29 to UC-32 | AP's, unchanged in what they check. UC-32 is Fenn's 5abf046, held on `frontend/sprint-01/agent-fenn-decisions-test-e2e-a7`, taken in here |

## 8. What reviewers check

- **Zero (`review-frontend`):** each module against sections 1 to 5. Every value has DL's source and is DL's final value (section 0's cascade rule), and every † string is in this contract. The chrome reset's scope (section 2) is a review check. Nothing is outside its territory.
- **Brennan (`review-spec`):** this contract, and the approval page contract's revision 15 (not reviewed in sprint-01), against FM, DL and AP, before anything is built.
- **Leah (`review-a11y-perf`), once everything is merged:**
  - `/`'s first load at or under 150 kB (section 6);
  - layout shift under 0.02 by section 6's cases;
  - axe on every route at 1280 and 390;
  - the sheet's focus behaviour;
  - the skip link;
  - the tab bar's and nav's targets;
  - AP D16's focus order on a phone (Approve before Reject while Reject is drawn left), as revision 15 asked.
- **Zane:** no dispatch. Sprint-02 adds no dependency, no credential path and no new request header. If a build adds a dependency, that's a deviation, and Zane is dispatched then.

## Appendix A: Brennan's shell-uic a1 findings and where each is answered

Revision 1 (04fac4b) failed shell-uic a1 (report fac0a54) on findings 01 to 07. Revision 2 answers them:

| Finding | Where it's answered |
| --- | --- |
| 01 (P1): v1.6 values overridden by DL's later layers | Section 0: DL's final cascade is the value, with no exception (INT). Section 1: `main`'s padding (24px, 16px under 760px) and the touch sizes from Mobile chrome and v1.8. Section 2: `ScreenHeader`'s table and the skip link. SH-06 checks them |
| 02 (P2): S7 misreads DL's planned entries; `Preview` and `.lib-route` not covered | S7 reworded, as the contract's own choice. Section 0: the `Phone`/`Preview` area is never drawn, and `.lib-route`'s animation waits for W2 |
| 03 (P2): the stub routes' ownership and file names | Section 3: the route file table, the departure from FM's ownership, and the handover rule |
| 04 (P2): the budget cut spans territories, and the reporting rule | Section 6: 150 kB target and 160 kB hard ceiling (INT); the cut's dispatches by FM row; FM line 30 and line 192's departure; the figure as measured; one reporting rule |
| 05 (P2): D16 has no scenario | SH-25, with its harness inside Fenn's territory |
| 06 (P2): sections 4 and 5, and some lines of 1 and 2, have no scenario | SH-12 (section 4), SH-13 (section 5), SH-14 (the marker); SH-01, SH-03, SH-04 and SH-06 extended; the chrome reset's scope and section 6 named as review checks (sections 7 and 8) |
| 07 (P3): five small gaps | 1: `/`'s head gains `Decisions · AVEL` (section 3). 2: section 4 names Ghost. 3: the onboarding stub draws `circle` (sections 2 and 3). 4: 120px only while the tab bar is drawn (`data-tabbar`, sections 1 and 2). 5: SH-24 lists the drawn elements at each width |
