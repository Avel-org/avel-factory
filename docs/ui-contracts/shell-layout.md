# UI contract: the shell layout (frontend sprint-02)

Zero, 2026-11-08. **Revision 1, for Brennan's one review.** Replaces `app-shell.md`; follows `docs/design/AVEL Shell Layout brief v1.9.md`. Companion: `kit-v1.9.md`. Decisions: sprint-02's `decisions.md`.

## 0. Rules and scope

- **DL** is `docs/design/AVEL Enclosure Grid · Design library v1.9.html`. It wins over everything earlier (Int).
- **Values** are DL's final cascade (the last DL rule for that element at that width) or a token, with the DL class in a comment.
- **Markup, ARIA and copy** are DL's functions', word for word: the `.lib-app` render, the rail `QV`, the header `_me`, the palette `Fme`, the tab bar `jme`, preferences `AU`. Departures: S1 to S13 (section 7). † copy is this contract's.
- **Nothing moves at hydration.** Every width is a media query. Preferences are cookies the server reads. Nothing is measured until the user acts.
- **Out of sprint-02:**
  - the ten pages section 4 marks 03 (sprint-03, each one entering the nav when its route exists);
  - the rail's live footer (W2's stream, S9);
  - the auth guard (W5).

## 1. Frame

| Width | Sidebar | Menu button | Sheet | Tab bar |
| --- | --- | --- | --- | --- |
| 1024px and wider | `--rail-w` column (264px, 64px collapsed) | no | never drawn | no |
| 761 to 1023px | no | yes | from the menu button | no |
| 760px and narrower | no | no | from More | yes; `main`'s bottom padding (`[data-tabbar]`) |
| Focus mode, any width | no | yes | at every width | no |

- **The rounded canvas (S1).** At 1024px and wider, the app is one viewport-high grid.
  - The sidebar sits on the floor, which takes `.lib-aside`'s background.
  - The page column is the canvas: `margin: var(--canvas-inset)` on every side but the sidebar's, `border-radius: var(--radius-dialog)`, `background: var(--av-page-bg)` and `box-shadow: 0 0 0 1px var(--av-hairline)`.
  - The canvas is the scroller, with `overscroll-behavior: contain` and `scroll-padding-top: 76px` , and it clips the sticky header to its radius.
  - Below 1024px the window scrolls.
- **On the `AppShell` element, in the server's HTML (S2):**
  - `data-rail="collapsed"`;
  - `data-focus`;
  - `data-tabbar`, whenever focus mode is off;
  - `data-hydrated`, for tests only, set in a commit after hydration (AP §5).

  DL's `html[data-…]` selectors are keyed on this element.
- **The sheet:** a dialog (`aria-modal`, `aria-label="Navigation"`), `inert` while closed.
  - Opening it focuses its close button and traps Tab inside.
  - Escape, the scrim, the close button and any link close it, and focus returns to the opener (`useDialogFocus`).

## 2. Sidebar (`QV`), header (`_me`), tab bar (`jme`)

**Sidebar, from the top:**
1. **The rail head:** the brand link to `/`, with the 32px mark and `AVEL`, and no sub line (S3).
   - **Open:** the collapse toggle sits beside the brand.
   - **In the sheet:** `.lib-rail-close` (`Close navigation`) replaces it.
2. **`Jump to ⌘K`:** opens the palette.
3. **The nav:** `nav "Screens"`, with section 4's groups.
   - An empty group isn't drawn.
   - The current row has `aria-current="page"`.
   - Project rows follow New project. The open project draws its pages as `.lib-nav-child` rows on DL's tree line.
4. **The highlight (S4):** in the server's HTML, the current row draws `.lib-nav-indicator`'s look itself. On a client navigation it glides from the old row to the new one with the Web Animations API (`translateY`, 260ms, `--av-ease`). Under reduced motion, nothing moves.
5. **Collapsed** (`.lib-rail[data-collapsed]`): DL's rules apply, and the tooltip comes from each item's rect when it's hovered or focused.
   - ⌘B or Ctrl+B toggles it, and so does the toggle.
   - The 240ms grid transition runs only on a toggle.

**Header:**
- **The parts:** the menu button, the breadcrumb, `Jump to`, the Theme and Depth radio groups, the phone-only Display button and its panel, and the progress line.
- **The progress line** shows how far the scroller is scrolled, and is 0 in the server's HTML.
- **A Theme or Depth switch** behaves as DL's `setPrefs`: a view-transition reveal from the button, or `.lib-theme-fade`, and nothing under reduced motion.
- **What a switch sets:** the `<html>` attribute and its cookie.

**Tab bar:** Decisions, Project, Release and More, as `jme` draws them.
- **Project:** goes to the last project opened (the `avel-project` cookie), or to `/missions`. It's current on `/missions` and on every project page but Release.
- **Release:** goes to that project's `…/release`, or to `/missions`. It's drawn only once its route exists (S8).
- **More:** a button that opens the sheet.
- **The grid:** one column per tab.
- **The Decisions badge:** sr-only text `waiting`† (S10).

## 3. Kit (Fantem, `apps/web/src/kit/**`)

```ts
type ShellItem = { id: string; label: string; href: string; icon?: IconName;
  badge?: { text: string; label: string }; meta?: string; children?: ShellItem[] };
type AppShellProps = {
  groups: { label: string; items: ShellItem[] }[];
  tabs: { id: string; label: string; href: string; icon: IconName; badge?: ShellItem["badge"] }[];
  currentId: string | null; crumbs: { label: string; href?: string }[];
  collapsed: boolean; onCollapsedChange(next: boolean): void;
  theme: "light" | "night"; depth: "flat" | "glass";
  onTheme(t: "light" | "night", from: HTMLElement): void; onDepth(d: "flat" | "glass", from: HTMLElement): void;
  onJump(): void; focus?: boolean; children: React.ReactNode;
  renderLink(p: { href: string; className: string; "aria-current"?: "page"; onClick?(): void; children: React.ReactNode }): React.ReactNode;
};
```

- **`ScreenHeader`** is DL's `ea` header (`.scr-head`): `{ eyebrow?, title, lead?, side? }`, with the title as the `h1`. It has no spec button (S11).
- **`JumpPalette`** is DL's `Fme`: `{ items: { id; group; label; icon; kbd?; keys?; run(): void }[]; onClose }`, with DL's matching, keys and copy, and focus returned to the opener.
  - **Loading:** only through `loadJumpPalette()` in `kit/index.ts`, so it's out of the first load (as AP's R7).
- **`Icon`** adds `menu`, `plus`, `search`, `panel-left`, `chevron-right`, `sun`, `moon`, `square`, `layers`, `corner-down-left`, `loader`, `x`, and section 4's nav icons.
- **`kit.css`** holds the shell's DL rules and S1's canvas, with every hover rule under `(hover: hover) and (pointer: fine)`.

## 4. Nav model (Leon, `system`)

**Entries come from routes.** A route's `staticData.nav = { group, order, label, icon }` (or `projectPage = { order, label }`) puts it in the sidebar, in the palette's `Screens` group and in the crumbs. `ShellLayout` reads them from the router's route tree, so an entry appears exactly when its route file exists (the brief).

| Group | Entries, in order: label · route · module · icon · sprint |
| --- | --- |
| Decide | Decisions · `/` · decisions · `inbox` · built |
| Projects | All projects · `/missions` · missions · `layout-grid` · 02; New project · `/missions/new` · onboarding · `plus` · 03; then project rows |
| Watch | Factory live · `/live` · events · `radio` · 03 |
| Business | Business · `/business` · metering · `wallet` · 03; Clients · `/clients` · clients · `building` · 02 |
| Factory | Client knowledge · `/library/client` · knowledge · `book-open`; Library · `/library/skills` · knowledge · `boxes`; Factory versions · `/factory` · knowledge · `git-branch`; Agent roster · `/roster` · roster · `group`; Activity · `/activity` · audit · `activity`: all 03. Settings · `/settings` · system · `gauge` · 02 |
| Project pages | Progress · `/missions/$missionId` · missions · 02; Watch the work · `…/live` · factory; Release · `…/release` · delivery; Dispatch · `…/dispatch` · factory; Plan · `…/plan` · plan; Gates and integration · `…/gates` · gate; Findings · `…/findings` · gate: all 03 |

Labels are DL's ("Gates and integration", not the brief's "Gates"). Icons are from DL's registry (S5).

**Project rows** come from route 19's first page, through `missions`' `index.ts`, in its order, leaving out `closed` and `cancelled`.
- **Label (S6):** `{client name} · {package}`.
  - The client name comes from route 8, through `clients`' `index.ts`.
  - The package is the contract's `Package` key, read as capitalised words (`landing_page` → `Landing page`†). Any other key is shown as it is.
  - No package gives the client alone. No client found gives the package alone, or `Project`†.
- **Onboarding** (`draft`, `onboarding`): `message-circle`. It links to `…/onboarding` once that route exists, or to Progress until then. No `N of 5` (S7).
- **Building** (every other state): `list-checks`. It links to Progress, with its badge, and its children while it's open.

**Counts (escalation 01).**
- **Decisions:** route 52's loaded rows, then `+` while `nextCursor` isn't null (AP §5). The badge is labelled `{text} waiting`.
- **A project:** its rows by `missionId`, with the same `+`. The badge is labelled `{text} for you`.
- **No badge:** for 0, with no data, or on an error.

**`_shell`** (`ssr: true`):
- its loader awaits routes 52, 19 and 8. A failure is swallowed, and that part isn't drawn.
- It reads the cookies `avel-rail` (`open` or `collapsed`) and `avel-project` (a UUID).
- `__root` reads `avel-theme` and `avel-depth` (`flat` or `glass`) onto `<html>`. Depth defaults to `glass`, as in DL. The theme defaults to light (S12).
- The client writes each cookie with `path=/; max-age=31536000; samesite=lax`.

**Crumbs, title and palette:**
- **Crumbs:** a top-level page is `[label]`. A project page is `[All projects, {project}, {page}]`, the first two as links. Progress stops at `{project}`.
- **The document title:** `{last crumb} · AVEL`†.
- **The palette:**
  - `Actions`: `Review what's waiting ({n})` or `Open Decisions`, and `Start a new project` once `/missions/new` exists;
  - `Screens`: the nav entries;
  - `Settings`: DL's theme, sidebar and depth actions, with `T`, `⌘B` and `D`.
- **Keys:** ⌘K, Ctrl+K and `/` open the palette.

## 5. Sprint-02's pages

Each page is `ScreenHeader`, its content, and then `WidgetState` `empty` (with no action) when there's nothing to show.

| Page (module) | Eyebrow, title, lead | Content | Empty: icon, title, message |
| --- | --- | --- | --- |
| All projects (missions) | `Projects`, `All projects`, DL's `what` | One link per project row | `layout-grid`, `No projects yet`†, `A project appears here once you start one with Canon.`† |
| Progress (missions) | `Project`, the project label or `Project`† | none | `list-checks`, `No parts yet`, `Parts appear here once the plan is approved.` (DL) |
| Clients (clients) | `Business`, `Clients`, DL's `what` | Route 8's names | `building`, `No clients yet`†, `A client appears here when you start their first project.`† |
| Settings (system) | `Factory`, `Settings`, DL's `what` | The Theme and Depth groups | `key-round`, `No CLI sessions`†, `A session appears here when you sign in with the avel CLI.`† |

## 6. Routes in sprint-02 (Leon's `system` dispatch, `routes/**`)

| URL | File | Renders |
| --- | --- | --- |
| (layout) | `_shell.tsx` | `system`'s `ShellLayout` |
| `/` | `_shell/index.tsx` | moved from `index.tsx`; the head gains `Decisions · AVEL` |
| `/missions` | `_shell/missions/index.tsx` | `missions`' All projects |
| `/missions/$missionId` | `_shell/missions/$missionId/index.tsx` | `missions`' Progress (S13) |
| `/clients` | `_shell/clients/index.tsx` | `clients`' Clients |
| `/settings` | `_shell/settings.tsx` | `system`'s Settings |

- **Why system writes them:** `missions` and `clients` are built before the shell, so `system` writes their route files. From sprint-03, each module writes its own.
- **The SSR mode:** `ssr: true` on every route.

## 7. Departures from DL and FM

- **S1.** The rounded inset canvas. DL declares the tokens for "the app canvas", but draws no rule (Int).
- **S2.** DL's `html[data-*]` attributes go on the element in the server's HTML.
- **S3.** None of the library's own parts: version line, mode switch, planned rows, Preview, simulator, back-to-top.
- **S4.** The highlight glides only on client navigations.
- **S5.** Icons for the entries DL leaves planned.
- **S6.** The `Client · Package` label (escalation 02).
- **S7.** No `N of 5` (escalation 03).
- **S8.** The Release tab once its route exists.
- **S9.** No footer before W2.
- **S10.** sr-only text on the tab badge.
- **S11.** No spec button.
- **S12.** Light by default, because the server can't read the OS preference.
- **S13.** Progress at `/missions/$missionId` (DL), not FM's index redirect.

## 8. Budget

- **`/`** passes procedures rule 7's size check. Every build that changes `/`'s JavaScript reports the figure. If it fails, INT schedules rule 7's fix.
- **Layout shift** stays under 0.02 at 390x844 and 1280x800 on `/` and `/missions` (AP §6).

## 9. Scenarios (Fenn)

Tests land as `test.fails` until their build merges (rule 1).

**Unit:**
- **SH-01** The brand, the groups and items in order, `aria-current`, the crumbs.
- **SH-02** Badges and their labels: nav, project rows, tab.
- **SH-03** The sheet: closed and `inert` in `renderToString`; opens; focus and trap; the four ways to close; focus returned.
- **SH-04** Collapse: `data-rail` in the server's HTML; the toggle's label and `aria-expanded`; ⌘B; the tooltip on hover and on focus.
- **SH-05** `data-focus` and `data-tabbar`; no tab bar in focus mode.
- **SH-06** `kit.css` read as text: section 1's breakpoints, the canvas, the hover gate, the `[data-ui="AppShell"]` keys.
- **SH-07** ScreenHeader.
- **SH-08** JumpPalette through `loadJumpPalette`: matching, the keys, the empty copy, focus returned.
- **SH-10** ShellLayout, mock: entries only for routes that exist; section 4's order, icons and hrefs; project rows from routes 19 and 8 (labels, links, counts, children); tabs from `avel-project`; crumbs and titles.
- **SH-11** Section 5's pages, empty and with rows.
- **SH-14** `data-hydrated`: absent in the server's HTML and the hydration render, present after the commit.

**End to end:**
- **SH-20** At 1280:
  - `/` server-rendered in the canvas: radius and inset, the badge in the server's HTML, no tab bar;
  - a nav click doesn't reload;
  - a collapse survives a reload with nothing moving.
- **SH-21** At 900: the sheet.
- **SH-22** At 390:
  - the tabs and More;
  - 44px targets;
  - the Display panel;
  - no sideways scroll.
- **SH-23** Theme and Depth set their cookies, and a reload paints them from the server's HTML.
- **SH-24** Nothing moves at hydration (UC-32's method) on `/` and `/missions`, comparing drawn elements only:
  - at 1280: the Decisions row, the header, the `h1`;
  - at 900: the header, the menu button, the `h1`;
  - at 390: the header, the tab bar, its Decisions tab, the `h1`.
- **SH-26** ⌘K and `/` open the palette, and Enter navigates.

`kit-v1.9.md` holds SH-09, SH-12, SH-13 and SH-25.
