# AVEL Shell Layout: from the design library v1.9

Nov 8, 2026 · Int

The shell is the one in the published design library artifact (v1.9), `docs/design/AVEL Enclosure Grid · Design library v1.9.html`. The UI contract will specify that shell as it is. Below it is laid out concretely, with the handful of artifact-only pieces translated for the real app.

Int's decisions (2026-11-08):
- **The artifact wins everywhere.** Where v1.9 and anything earlier (v1.1, v1.8, a contract, the built kit) disagree, v1.9 is right.
- **Real pages with empty states, no stubs.** Every page in the nav is a real page: its header and an empty-state message component. No placeholder screens and no "Not built yet".
- **The shell has rounded corners.**
- **The sidebar is well designed, neat, organised and professional.**

## Layout

- **Desk (1024px and wider):** two columns, the sidebar at 264px and the page.
  - The sidebar collapses to a 64px icon rail with ⌘B or its panel button. It slides open and closed, and the choice is remembered.
- **Tablet (761–1023px):** no sidebar column. A menu button in the header opens the same sidebar as a sheet from the left (320px, or 88% of a narrow screen), over a dimmed page, with a close button.
- **Phone (760px and narrower):** the tab bar at the bottom replaces the menu button. "More" opens the same sidebar sheet.
- **Focus mode for Canon onboarding:** the sidebar steps away so the conversation gets the full width. The menu button brings the sidebar back as a sheet, on desk too.

## Sidebar

From the top:

1. **Brand:** the AVEL mark (32px) with the word "AVEL", and the collapse button beside it.
2. **"Jump to ⌘K":** a 34px search field that opens the command palette.
3. **The navigation,** in the artifact's groups, each separated by a hairline under a small 12px group label:

| Group | Items, as the artifact draws them |
| --- | --- |
| Decide | Decisions, with an amber count badge |
| Projects | All projects, New project, then each project. Onboarding projects show "Step N of 5" beside the name. Building projects show a count badge and, under the open project, its pages as a tree: Progress, Watch the work, Release, Dispatch, Plan, Gates, Findings |
| Watch | Factory live |
| Business | Business, Clients |
| Factory | Client knowledge, Library, Factory versions, Agent roster, Activity, Settings |

4. **Rows:**
   - Top-level rows are 34px tall, with 13.5px text and a 16px icon.
   - Project pages under a project are 30px rows on a tree line. The current one gets a short accent bar.
   - The current page is shown in darker text, medium weight, with an accent-coloured icon. A soft highlight slides to it whenever you move.
5. **Collapsed:** icons only, with each name in a tooltip to the right on hover or focus.
6. **Footer:** a live dot and its status line.

## Header

- 56px tall, sticky and slightly see-through, with side padding that grows with the screen (12–28px).
- **Left:**
  - the menu button, below 1024px;
  - then the breadcrumb in 13px: earlier steps are links in grey, the current page is darker and medium weight, and each step fades in. On screens 420px or narrower, only the current page shows.
- **Right:**
  - "Jump to ⌘K". Below 761px the label and ⌘K hide, leaving the icon at 40px.
  - Light / Night.
  - Flat / Glass. Below 761px, both switches fold into one Display button that opens a small panel.
- A 2px accent line along the bottom edge. In the artifact it shows how far down the page you've scrolled.

## Phone tab bar

- Four tabs: Decisions · Project · Release · More.
  - Decisions carries its waiting count as an 18px badge.
  - The current tab is darker, with an accent icon.
- Each tab is at least 52px tall. The bar is see-through and clears the phone's home bar, and the page gets bottom padding so nothing hides behind it.

## What changes from the artifact

These pieces exist only because the artifact is a design library. The real app drops or swaps them:

| In the artifact | In the app |
| --- | --- |
| The Screens / Library switch | Gone: the app has only screens |
| "Simulator live" and Show/Hide in the footer | The live connection status in the same spot: "Live", "Reconnecting…", "Offline" (event stream, W2) |
| "Show planned screens" and dimmed "planned" rows | Gone: a page appears in the sidebar and ⌘K once it's built |
| The Preview group (Phone, Screen map) and "Control room v1.9" under the brand | Gone |
| One sample project (Landing page) and one onboarding (Fleet portal) | Your real projects from the missions list (route 19), each with its pages under it when open |
| The Project and Release tabs, which open the sample project | Project opens the project you last had open (or the project list if none); Release opens that project's release page |
| Theme and Flat/Glass saved in the browser's own storage | Saved in cookies, like the theme already is, so the first paint is right |

## What the contract needs for this

- **Waiting counts:** the Decisions badge and each project's badge are counted from the Decisions list (route 52), shown as "50+" past a page, until CR-W5's status read sends a total.
- **Project names:** missions have no name or slug in the contract today, so a row would read "Client · Package" until that's added.
- **"Step N of 5"** for onboarding projects needs each project's onboarding step in the missions list (CR-W5's summary row or CR-W9's plain block). Otherwise the sidebar would have to load every project one by one.

## Next

Write `docs/ui-contracts/shell-layout.md` from the artifact, with every value taken from v1.9, and refresh the repo's copy of the design library from v1.1 to v1.9 so the agents work from the same source (done 2026-11-08).
