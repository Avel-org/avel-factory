# Components

What the prototype is built from, and what each piece becomes in `apps/web` with shadcn/ui. "Build it" means there's no shadcn piece that fits; make it a component in `apps/web/src/components` from the prototype's markup and CSS. Class names below are the prototype's, so you can find each piece in `src/styles`.

## The shell

| Prototype                                   | What it does                                                                                                                    | In apps/web                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Sidebar` (`.lib-rail`, `.lib-nav`)         | Decisions, Live, Clients; projects with their status note and badge; the Factory group; the account foot                        | shadcn **Sidebar**. Rows put the name first; the status note shrinks before the name does |
| `Topbar` (`.lib-topbar`)                    | Breadcrumb, the factory pulse ("1 room running · 1 parked"), Search ⌘K. On a phone: back link and search                        | Build it: a sticky bar. Search opens the command palette                                  |
| `TabBar` (`.lib-tabbar`)                    | The phone's five tabs: Decisions, Live, the current project, Release, More                                                      | Build it. At most five; the project tab carries the project's name                        |
| `PageMasthead` (`.cr-mast`)                 | A project's title, state, gate bar, client and deadline line, Watch the work, the ••• menu, and the project tabs                | Build it. Tabs are links: shadcn **Tabs** styling over TanStack Router links              |
| Gate bar (`.cr-gates`, `gates.css`)         | Six gates as one track. Passed is full green; the current gate fills as its work lands; later gates are empty; one summary line | Build it. Reads `MissionSummaryDto.gates[]` with counts (CR-W18 §5)                       |
| `CommandPalette` (`.cmdk`)                  | ⌘K: pages, projects, decisions, clients, agents, Library entries; g-chords                                                      | shadcn **Command** in a **Dialog**                                                        |
| Sheets (`src/kit/sheet.js`)                 | Bottom and side sheets: focus moves in, the page behind goes inert, Escape closes, focus returns, drag to close                 | shadcn **Sheet** (Radix Dialog). Keep the drag handle on phone sheets                     |
| Toasts and the undo snackbar (`.dec-snack`) | "Answered Q-0.2 · Undo · 6s"                                                                                                    | **Sonner**, with an action button and a 6-second duration                                 |

## Controls

| Prototype                                                                              | In apps/web                                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `.av-btn` with `data-variant` primary, secondary, ghost, danger and `data-size` sm, md | shadcn **Button** with the same variants. Press scales to 0.96; one primary per view                   |
| `.av-tag` with `data-tone` verified, accent, pending, needs, stopped                   | shadcn **Badge**, with variants for the tones                                                          |
| `.lib-seg` segmented control (radios use `aria-checked`, tabs use `aria-selected`)     | shadcn **ToggleGroup** for a choice; **Tabs** when it switches a panel                                 |
| `FilterBar` (`src/kit/FilterBar.jsx`)                                                  | **Popover** + **Command** for each facet, a **Sheet** of filters on a phone, a sort **DropdownMenu**   |
| Fields (`.cr-input`, textareas)                                                        | shadcn **Input**, **Textarea**, **Select**. Focus shows a darker edge, never a blue ring (`focus.css`) |
| Project menu (`.cr-ctl-menu`)                                                          | shadcn **DropdownMenu**. Cancel opens a confirm that needs a reason                                    |
| Tables (`.op-tr`, `.kb-table`)                                                         | shadcn **Table**. Numbers right-aligned and tabular                                                    |

## Docs and code

| Prototype                                            | In apps/web                                                                                                                                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CodeBlock` (`src/kit/Code.jsx`)                     | Build it. A file name or language, Copy, line numbers, colours and diffs. The tokenizer is about 80 lines; keep it, or use **Shiki** at build time if bundle size allows. Always render code as text |
| `Markdown` (`src/kit/Markdown.jsx`)                  | Build it, or use `react-markdown` with HTML off. It must render fences with a file name, `[!NOTE]`/`[!TIP]`/`[!WARNING]` callouts and tables                                                         |
| Template docs (`TemplateDocs` in `TemplatePage.jsx`) | Build it. The same component renders the template page and the live preview while you write a template                                                                                               |
| "On this page"                                       | Build it. A scroll spy on headings; hidden under 1200px                                                                                                                                              |

## Screens with their own pieces

| Prototype                                                      | In apps/web                                                                                                                                                                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision card and queue (`.cr-dq-row`, `.cr-dc`)               | Build it. Approve needs the reason field only when `requiresReason` is set (CR-W18 §4)                                                                                                                                             |
| Canon's dock (`CanonDock.jsx`, `canon-dock.css`)               | Build it on `useChat` from `@ai-sdk/react` with the oRPC transport (CR-W19 §4). What you type stays in the component's own state. The question deck, the relay line with its local preview (`src/app/relay.js`), and hold to relay |
| Margin notes on the checkpoint (`.cd-margin`)                  | Build it. The same answer action as the deck                                                                                                                                                                                       |
| Receipt (`ReceiptPage.jsx`, `receipt.css`)                     | Build it. The paper uses a CSS mask for the torn edge. The proof check recomputes SHA-256 with WebCrypto (`src/kit/sha256.js` has the fallback). The stamp is SVG                                                                  |
| Module page (`ModulePage.jsx`, `module.css`)                   | Build it. The retry ladder, cost against the cap, the live feed of agent steps from the event stream, and the attempts timeline                                                                                                    |
| Template authoring (`TemplateNewPage.jsx`, `template-new.css`) | Build it. The form autosaves; the checklist blocks the PR until the docs meet CR-W20                                                                                                                                               |

## Motion

Use the tokens in `tokens.css` (`--duration-*`, `--ease-*`) and the rules in `src/styles/motion.css`:

- Page changes use the View Transitions API: the page eases in from 8px below, and the sidebar and a project's header stay put. TanStack Router has `defaultViewTransition`.
- Lists arrive top to bottom, 35ms apart, at most 6 steps.
- Values that change (gates, meters, checks) animate the change with transform, never the layout.
- Live things breathe; things that finish pop once.
- Everything switches off under `prefers-reduced-motion`.

## Accessibility rules the prototype already meets

- Zero failures in the axe-core scan of every screen, in light and night, on desk and phone. `npm run test:e2e -- audit-axe` runs it.
- Every pointer target is at least 24px, except links inside sentences.
- Clicking never shows a focus ring; the keyboard always does.
- Dialogs and sheets trap focus and give it back on close.
- Live regions announce Canon's replies, proof check results and new agent steps, politely.

## Added for contract 1.0.0

| Prototype piece | Where | Becomes |
| --- | --- | --- |
| `OsaBar` (`src/shell/OsaBar.jsx`) | Every page, only behind the CR-29 flag | A `Card` with a `Switch` (Follow OSA, off by default), a `Button` that opens a `Textarea` form (Ask OSA), and a task list of `Badge` + text. Task text renders as text only |
| OSA brief | Decision cards, behind the flag | A bordered `Card` labelled "Prepared by OSA"; "Written for an earlier version" when its bound version is behind the item's |
| OSA in Settings | Settings, behind the flag | A section with the session state, "Pause OSA" (route 5 on the assistant's session) and a meter of model use against its cap. No dollars |
| Pipeline stages and Add a lead | Clients | `Badge` counts per stage; a `Form` with `Input`, `Select` (LeadSource) and `Textarea` |
| Close as lost | A lead's page | `Select` of LeadLostReason, then a confirm `Button` (route 119) |
| Proof consent | A client's page | A `Button` that records or withdraws consent (PATCH route 11) |
| Accept a finding | Findings | A `Button` that opens a reason `Textarea`; route 60. Hidden for an integrity failure at Gate 5 |
| Results by version | A skill's Library page | A `Table` (version, attempts, first try, findings) and a baseline line, from route 115 |

## The taste pass (`src/styles/taste.css`, `src/kit/Roll.jsx`, `src/lib/live.js`)

One rule: motion means something. Every effect is CSS (transform, opacity, gradients) or a few lines of JS, and stops under `prefers-reduced-motion` while the colours, edges and labels stay.

| Effect | What it means | In the real app |
| --- | --- | --- |
| Text boxes: one hairline edge, no inner shadow; a beam runs once around the edge on focus, settles as an accent edge with a breathing halo; red edge and one shake when invalid. On a phone: pill fields and selects at 48px, deep rounded text areas | Where you're typing | shadcn `Input`, `Textarea`, `Select` with these classes in `tokens.css`; coss ui fields as the base if you want more variants |
| One heartbeat (`--beat`, set from the rooms running) on live dots; it stops, and the dot turns amber, when the stream stalls | Work is happening now | A `LiveDot` component reading the event stream state |
| Event sweep: a thin light across the top on each event, at most one a second | An event just arrived | `sawLiveEvent()` called from the event stream hook |
| Gate conveyor: light runs along the current gate's rail; a passed gate scans once | This gate is being worked | Magic UI's Border Beam idea, done in CSS |
| Busy rooms: a slow scan line down a building room, a working light on the agent line; a parked room is still, with a red edge | A room is building or stuck | `RoomCard` variants |
| Floor and machines: a dot-grid floor, cards with a lit top edge and a long soft shadow; night adds an ambient glow | Depth, the factory floor | Tokens only |
| Glowing status dots in tags | State at a glance | shadcn `Badge` variant |
| Rolling numbers (`Roll`) on badges, counts and the daily line | A value changed | NumberFlow (`@number-flow/react`) |
| Approve press, the next card sliding up, a draining line under Undo | You just decided | Motion (`motion/react`) for the press and the slide; CSS for the drain |
| Cards and lists arrive in order | Page continuity | Motion, or the View Transitions already used |
| The factory at rest (idle machines breathing) when nothing needs you | Quiet, not empty | An inline SVG, or a Rive file later |

## Notch 2 (`src/styles/notch.css`)

| Piece | What changed | In the real app |
| --- | --- | --- |
| The blue | Cobalt replaces the bright system blue in light and night (`tokens.css` updated) | Tokens only |
| Primary button | Tonal: cobalt wash, greyish-blue outline, cobalt label; a sheen crosses it on hover; presses to 97% | shadcn `Button` variant `default` restyled |
| Clicked text boxes | Neutral: darker edge, a bright segment runs once around, a lift and a grey halo. No blue | `Input`, `Textarea`, `Select` |
| Decisions header | Same anatomy as other pages: title and "14 waiting" on the left, today's progress on the right, date and urgency below | The shared `PageHeader` |
| Next decision | A slow light travels its edge while it waits on you | Magic UI Border Beam, or this CSS |
| Cards | A soft light follows the pointer on desk (`installSpotlight` in `src/lib/live.js`) | Magic UI Magic Card idea |
| Terminals | Faint scanlines and glowing output | `RoomTerminal` |
| Running time bars | Stripes travel while the attempt runs | `Progress` variant |
| Top bar and Live | Three activity bars move with the heartbeat while rooms run | `LiveDot` sibling |
| Floor | A still grain over the canvas | Tokens only |
| New rows | The newest event and decision glow once | Motion or CSS |
| Gates | Passed gates glow green; the current fill breathes | `GateStrip` |
| Entrances (desk) | Titles and cards come into focus (blur to sharp) | Motion |
| Sidebar | Cobalt brand tile with the stream's heartbeat; 36px items with a cobalt edge on the current page; project dots as status lights; phase pills; cobalt counts; the account as a raised card | shadcn `Sidebar` restyled |
| Layout | Tablet titles clear the menu button; a project's gate strip gets the full width up to 1180px; phone tags keep their size; page tabs fade at the edge | Layout rules in the shell |

## Finish pass (`src/styles/finish.css`, loaded last)

| Piece | What it is | Build with |
|---|---|---|
| Library overview | Release as a pill chip, three stat cards (icon tile, number, label), each section a grid of cards (icon tile, name, one-line blurb, count chip, arrow on hover) under a heading with a hairline to the edge | shadcn `Card`, `Badge` |
| Library rail | No counts; 36px items, cobalt edge on the current page | shadcn `Sidebar` sub-nav |
| Sidebar | No numbers on screen (screen readers still hear "14 waiting on you"); phase words ("Scoping", "Draft") have no tile; the current link has no tile either, just a short cobalt bar on the left, the blue icon and a darker label. The Library menu matches | shadcn `Sidebar`, `SidebarMenuButton` with `isActive` |
| Labels | Kind chips are soft filled pills with no border; status tags lose the hard edge; "Next up" carries a dot; key/value keys 12px muted; table headers 12px, one line | shadcn `Badge` variants |
| Small fixes | Findings route on its own line; retry-ladder note wraps; activity times don't split; phone hero puts expiry on the first line and the project on its own line | — |
| Library search | Magnifier and field only, no placeholder; the label is screen-reader text. Soft fill at rest, a raised plate on focus | shadcn `Input` with a leading icon |
| Daylight (light mode) | A cool cobalt wash and a hint of violet over the warm floor; cards, the hero and the top-bar pills are white plates with a lit top edge and a long soft shadow; the next decision gets a cobalt-tinted edge and shadow. Night is unchanged | tokens `--d-card`, `--d-ring`, `--d-drop`, `--d-lit` |

## Trail kit (`src/kit/Trail.jsx`, `src/styles/trail.css`, data from `src/app/history.js`)

| Piece | What it is | Build with |
|---|---|---|
| `TNode` | One set of markers for the trail and the graph: done (check on soft cobalt), failed / rejected (x), running (thinking orb), needs you (solid cobalt, breathing ring), parked (pause), not started (hollow), approval ahead (dashed), not landed yet (dashed cobalt), head (cobalt ring), commit / merge / branch dot (lane colour), collapsed count | Plain elements; `thinking-orbs` 0.3.2 for running |
| `AgentTrail` | Module page "Where M3 is": tests locked → each try → your call → land on main → gates. The rail bends out to the running try's steps and back; finished tries fold away and open on a tap; the running status word shimmers; the step waiting on you opens inline with the ask, a reason box when the kind needs one, and Approve | shadcn `Collapsible` per row, `Button`, `Textarea` |
| `CommitGraph` | "History on main" on the project overview and "What ships" on Release: newest first, main in cobalt, each module's tries on its own lane in the module's colour with curves at the fork and the merge, the branch name as a tag, the head ringed, older history folded into a count. Hover (desk) or tap (phone) opens the commit card: who, commit or checkpoint, files changed, when, branch, result | shadcn `HoverCard` on desk, `Collapsible` on phone; lanes are SVG per row |
| Retro terminal | The module's live feed types each new line in, ends with a blinking cobalt block cursor and a faint glow on night; the Live room terminals get the cursor; Release's delivery steps read as a terminal log | CSS only; stops under reduced motion |

Lane colours: `--cg-m1` … `--cg-m6` for lines and dots, `--cg-t-m1` … for tag text (AA on their tint in both themes). Data: CR-W24.

## Navigation pass (`src/styles/nav.css`)

| Piece | What it is | Build with |
|---|---|---|
| Breadcrumb | One system. Top-level pages show none. Every other page shows its whole path in the top bar, links up and the current place as plain text: Projects › Spring launch site › Build › M3, Library › Skills › entry, Clients › Blume Studio. Phones show a back link to the parent (‹ Build). Long names shrink with an ellipsis only when the bar runs out of room | shadcn `Breadcrumb` (`BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`) |
| Page tabs | 34px on desk, 40px on phone, 13px, an underline only on the current tab; on phones the strip scrolls with soft edges and the current tab centres itself | shadcn `Tabs` (line variant) or a nav of links |
| Switches | Every segmented control is one compact size: 26px buttons in a 30px track (30px buttons on phones) | shadcn `ToggleGroup` |
| Phone dock | A floating bar above the page with a cobalt lens that slides to where you are. Live states instead of numbers: a breathing pip on Decisions when items wait, activity bars on Live while a room runs, the project's gates as a ring (Canon's orb while it's his turn), a green pip on Release when it's ready. Each state is in the item's accessible name | Custom on shadcn primitives; `thinking-orbs` for Canon |
| Canon's turn | A presence pill in the chat header (orb state, word, step, live clock); the turn's steps in his message as they happen; folded to "4 steps · 1.9 s" when done. Data: CR-W25 | shadcn AI: Message, Message Scroller, Trace (Reasoning, Tool) |
| Typing cursor | One cursor everywhere text types in: `.tt-cursor` (module feed, Live terminals and computer view, Release delivery log, Canon's streaming reply). The older carets are removed | — |

## Empty states (`src/kit/EmptyState.jsx`, art from `src/kit/EmptyArt.jsx`)

One component wherever there's nothing to show. It has Rico UI's instrument-panel scene, a title, one line and at most one action. The scene is decorative, so it's hidden from screen readers; the words carry the meaning. Sizes: `md` (240×180) for a page or a card, `sm` (160×120) inside a panel. All the scenes share a 5.6-second loop that stops under reduced motion.

| Scene | Used for |
|---|---|
| nothing | Decisions when clear ("Nothing needs you"), no plan yet, a new project |
| emptyList | No findings, no receipt yet, gates, a project's progress, Health not checked |
| emptyFolder | Projects, Clients, Library, Templates, the roster, nothing dispatched yet |
| noResults | Any filter or search with no match (Library, Templates, Projects, Live's events) |
| noCommands | The ⌘K palette with no match; no CLI sessions |
| noTabs | Live and a project's live view when no room is running |
| noNotifications | Activity with nothing new |
| blockedPage | No such module, template not found, 404 |
| sessionExpired | 401 |
| accessDenied | 403 |
| loadFailed | Every other error (400, 409, 422, 429, 5xx) |
| offline | Kept for a full-page offline state (today offline is the top-bar notice) |

Build with: Rico UI's block for the art inside shadcn's `Empty` (`EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`).

## Crew (`src/kit/Crew.jsx`, `src/styles/crew.css`, data from `src/app/crew.js`)

A project's agent team as a live tree: the lead on top, one card per module (its builder), and the test writer and reviewers hanging under each module on a rail. Cards show the agent, model, status pill (Working with the orb, Done, Needs you, Idle), the current line (typing in from the step stream on the running card), AI used against its cap as a bar, the try and the tests. Working cards glow, and a pulse runs down the wire from the lead. Tapping a card opens its details (now, running time, AI used, try) with links to the module or the waiting decision. Factory Live gets Rooms / Crew / Canvas with a project picker; each project's Watch page shows its own crew. On a phone it's one column. Data: CR-W27.

Build with: shadcn `Card`, `Popover` (desk) / `Collapsible` (phone), `Command` for the project picker; wires in CSS.

## Bottleneck pass (Nov 14, see `bottleneck-audit.md`)

| Piece | What changed | Build with |
|---|---|---|
| Clean checkpoint | A checkpoint with no failing check, every finding settled and no open question reads "… is clean", with a Clean tag, a four-line summary and a "See the breakdown" link. It's one tap. Scope's approve bar shows the same Clean line. Data: CR-W28 §1 | shadcn `Badge` (success tone) |
| Decision foot | On a laptop the answer bar sticks to the bottom of the screen while the item is in view. After you decide, the next item's title is scrolled into view and takes focus (`tabIndex=-1`) | CSS `position: sticky`; focus with `preventScroll` |
| Release bar | A pending pass is accepted right there: reason box ("It goes on the release record"), Accept the pass, then Release. "Open it in Decisions" stays as a link | shadcn `Textarea`, `Button` |
| Start the interview | New project's Start Canon and a draft's Start the interview open Canon's interview with the first question waiting | — |
| Ask Canon for a change | Replaces "Rewrite a section": opens the interview line with the checkpoint named | — |
| Module waiting card | The decision's title only, no raw ref; jumps to the ask in the trail | — |

## Desktop pass (Nov 14, evening; `src/styles/desk.css`)

- **Top bar:** scrolls away with the page. No sticky slab, no background, no condensed title.
- **Search:** the icon alone (36px circle); ⌘K still opens the palette. The accessible name stays "Search".
- **Pointer light:** off everywhere (it followed the cursor over cards).
- **List rows (Clients and other `a.op-row`):** hover is a neutral wash, no tinted tile and no accent bar.
- **Canon:** the interview runs the screen's height when pinned; the conversation keeps at least 220px above the question card; Scope in focus mode uses the full width; the approve bar sits flush on the card's edge.
- **Live:** event-river times on one line, more room around the project filters; Crew cards wrap their title and live line instead of cutting them; Canvas keeps its meters and layout controls on one row.
- **Release:** at 1240px and up the receipt and "What ships" sit side by side.
- **Decisions:** queue titles wrap to two lines on a laptop; the sticky answer bar uses the card's own surface.

## Agents (Nov 14, late; `src/pages/roster/AgentParts.jsx`, `src/styles/agents.css`)

The team canvas (dot grid, lanes, relation edges, side inspector) is gone.

| Piece | What it is | Build with |
|---|---|---|
| Agent card | 20px-radius card, the whole card a link to `/roster/<agent>`. Round avatar (filled for builders, accent ring for leads, outline for checkers, dashed for Canon), name, what it does, status pill (Working pulses, Waiting on you, Parked, Idle), a dark pill with the live command when it's working, work-kind pills, model pill and effort, a chevron that nudges on hover | shadcn `Card` as an `<a>`, `Badge` for pills, `Avatar` |
| Team group | Team name, a count pill and the team's rule, then a card grid (`auto-fill, minmax(272px, 1fr)`) | CSS grid |
| Agent overview `/roster/<agent>` | Breadcrumb Agents › name; page title is the agent, the lead is what it does. A hero card (avatar, status and role pills, what it's on, time, the live line), Recent work (its landings and tries across projects, each linking to the module), Works with (reviewed by, reviews, disputes go to with the "through" note, settles disputes for, same team, all as linked agent pills), Setup and Skills on the side, previous and next agent at the foot | shadcn `Card`, `Badge`, `Avatar`; links, not buttons |
| Change this agent | Starts a roster draft for that agent; Setup turns into the model, effort and work-kind fields, Skills gains attach and detach. The draft bar and review are the same as before | — |

Data: route 47 (roster), route 55 and 108 (recent work, via CR-W24's history), Gap 4 (live status). Nothing new in the contract.

## Uploads (CR-34 One upload inbox, rev 2, proposed; Nov 15)

Files: `src/app/uploads.js` (state and view values), `src/pages/uploads/UploadLayer.jsx` (drop target, tray, filing sheet), `src/pages/uploads/UploadsPages.jsx` (Drive, file page, file lists), `src/pages/uploads/UploadStates.jsx` (state sheet at `/drive/states`), `src/styles/uploads.css`, sample data `src/mock/uploads.json`. The spec's examples are mapped onto the prototype's projects: Acme Dental → Blume Studio, Booking app → Spring launch site, Northside Barbers → GTS Diesel, Landing page → Fleet portal. The file names are the spec's.

Rules the pieces keep: file names and contents are text, never markup; nothing uploaded is rendered inline (a thumbnail is a type icon, Open means Download); no password prompts; budgets are tokens or a percent, never money; where a file will go is on screen before it's dropped.

### New components, and why nothing existing fit

| Component | What it is | Why it's new | Build with |
|---|---|---|---|
| `DropTarget` | Full-window overlay while dragging, naming the place first: "Drop to add to M3 · Spring launch site", "Drop to add to Blume Studio’s files", or "Drop to put in Drive". Counts a folder's files | Nothing in the kit listens to the whole window or covers it without taking focus. A sheet or dialog would steal focus mid-drag | `role="status"` overlay; window `dragenter/over/leave/drop` |
| `UploadTray` | Bottom-right card (a bottom sheet on a phone) with one `TrayRow` per upload: progress, every status and error, retry, Go to Secrets, the duplicate choice, an inline reading-list reason for module drops. Shows only while you upload from the page you're on; it closes on a new page and leaves nothing behind (no folded pill). Progress stays on the file's Drive row | Toasts vanish and hold no actions; the Dock is the prototype's own controls. Uploads outlive the page, so this sits outside any page | shadcn `Card`, `Progress`, `Button` |
| `FilingSheet` | Right side panel (full screen on a phone): destination cards for Client, Project, Module, Library, Repo with their fields, "What filing will do", the batching note, the scope question that turns the action into "Open a re-entry proposal", and the footer listing what's missing | The existing sheets show one record. This one is a form across five destination types, each with its own fields and rules | shadcn `Sheet` (`side="right"`, `bottom` on phone), `Checkbox`, `Input`, `Select`, `RadioGroup`, `Command` for module search |
| `FileThumb` | Type icon in a tinted square: image, document, archive, video, audio, data, folder | No existing icon tile carries a file kind, and uploaded content must never be the thumbnail source | Lucide icons |
| `ScanTag`, `LinkTag` | Scan result (Scan clean, Scanning, Held) and link state (Waiting, Active, Refused, Removed) | Thin wrappers over `.av-tag` that fix the tone per state so every screen agrees | shadcn `Badge` |
| Drive page `/drive` | Held items first, then "Waiting for a place" with select-all; each row has File (takes the suggestion), Change…, Discard (asks twice); filters: sent by, type, flagged, expiring soon; sort newest or expiring; sticky bulk bar | Uses `FilterBar` and `EmptyState` from the kit; only the row is new | shadcn `Card`, `Checkbox`, `Button` |
| File page `/files/:id` | Header (thumbnail, name, type, size, sender, scan, Download), Where it's used (with Unlink locked when a receipt or approved fact depends on it, and the refused link's two fixes), Read by and Receipts, Facts (short SHA-256 with copy), Versions with Upload new version, Purge at the client's request (reason required). A purged file shows name, hash and reason only | Same `lib-card` sections as the module page; nothing existing had a versions timeline for a file | shadcn `Card`, `Badge`, `Textarea` |

### Additions to existing screens

| Screen | Addition |
|---|---|
| Client page | Overview / Files tabs; Files lists the brand kit and other files, each with where it's used |
| Project | Files tab: "Gate 0 sources" and "Project files, not yet linked" |
| Module page | Inputs: each linked file with its reading-list line, listed or available only, page range, first read; the reading-list meter (amber past 80%, "Over budget: Gate 1 will flag it" past 100%); Add a file |
| Canon, checkpoint 0.1 | "Client files offered" as checkboxes: "Canon will read the ones you keep" |
| Decisions, package card | "Re-rendered for 3 new files" with the files listed |
| Receipt | Inputs: name, version, short hash, where it went. A Your view / Public view switch; the public view shows the count and hashes only |

The state sheet at `/drive/states` shows every tray status and error, every link state, scan tags, meters at 38%, 87% and 104%, and loading, empty, error and live for each region.

Data: CR-34 (proposed). The names the screens assume are in `contract/cr-34-assumed.json`. Nothing is called; it runs on `src/mock/uploads.json`.

### Nov 16 changes

- "To file" is now **Drive** (`/drive`; `/to-file` still opens it), with a drive icon in the nav.
- The top bar's count badge and upload button are gone. Drive's own Upload button is the way in without dragging, and the only way on a phone.
- The folded upload pill is gone: the tray appears when you drop files and disappears when you close it or leave the page.
