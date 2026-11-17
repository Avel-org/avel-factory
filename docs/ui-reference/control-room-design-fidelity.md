<!-- Added Nov 17, 2026 by Javaris: "use this as our polishes. we need to replicate the design system and
     design polishes, so save this for implementing design polishes." The source for every design-polish
     ticket in apps/web.
     In this repo: `handoff/` is docs/ui-reference/control-room-handoff/ (components.md, screens.md,
     tokens.css, cr-list-1-0-0.md are there). The prototype is docs/ui-reference/control-room-prototype.html:
     read it as data and never run it in a dispatch. `handoff/design-spec.json`, `tools/design-spec.cjs`
     and the `tests/e2e/audit-*` scripts belong to the prototype's own repo and aren't in this one; a
     ticket that needs them ports them. Where this file and docs/ui-contracts/ or an accepted CR
     disagree, the contract or CR wins (docs/design/README.md), as for the prototype. -->

# AVEL Control Room — design fidelity spec

Nov 17, 2026 · for the coding agent building `avel-factory/apps/web` · written from the prototype's built output, not from memory

This file is everything the prototype's design passes decided, screen by screen, with the values to match. Every number under a "measured" heading was read from the built prototype's computed styles at 1440×900 and 360×780, in light and night. Where this file and the prototype's code disagree, the prototype wins: run it and look.

## 1. How to use this

**Order of truth for how it looks:**

1. The running prototype (`npm run dev`, or `dist/index.html`). Open the same route beside your build.
2. This file, for the values and the decisions behind them.
3. `handoff/components.md` (what each piece becomes in shadcn/ui) and `handoff/screens.md` (routes, data, states).
4. `handoff/tokens.css`. It holds a few older type tokens that the screens no longer use (see 3.2). The type scale in section 2 overrides them.

**Order of truth for data:** `packages/contract`. A screen that needs data the contract lacks gets a change request (`handoff/cr-list-1-0-0.md`), never a faked endpoint.

**What "replicated" means.** For each screen, at 1440 and 360, in light and night:

- The measured values in this file match your build's computed styles (size, line height, weight, padding, gap, radius, colour, shadow).
- The states exist: loading, empty, error, ready, live.
- The audits in section 11 pass against your build.

**The stylesheets load in this order, and later files win.** When you port a component, read its rules in every file, last to first:

`enclosure-grid` → `control-room` → `host` → `knowledge` → `phone` → `operations` → `header` → `sheets` → `canon` → `canon-dock` → `polish` → `gates` → `code` → `receipt` → `module` → `template-new` → `audience` → `motion` → `focus` → `taste` → `notch` → `finish` → `trail` → `nav` → `crew` → `desk` → `agents` → `uploads` → `setup`

`handoff/design-spec.json` is the raw data behind the measured sections. `tools/design-spec.cjs` is the script that made it; change its selectors to yours, run it against your build, and compare the two files.

## 2. Rules that hold on every screen

These are checked by the audit scripts. A screen that breaks one is wrong even if it looks close.

| Rule | Value |
| --- | --- |
| Font sizes | Only 12, 13, 14, 16, 20, 28px. Nothing under 12px at any width |
| Font weights | 400 for text, 500 for labels and titles. 600 only on the card and step titles of the Agents, Drive and Getting started screens. Never 700 |
| Letter spacing | None. No tracking on any text |
| Faces | Inter Variable for everything; IBM Plex Mono for refs, hashes, counts, commands and code, with tabular figures |
| Body text | 14px on 20px on desk |
| Radius | 6 (chips), 8 (small tiles), 10 (controls, nav items), 12 (fields, inner panels, the palette), 14 (cards), 16 (the canvas, the hero card, dialogs), 20 (agent cards), 22 (phone dock), 24 (side sheets), 999 (pills, toasts, phone fields). 2 and 4 only on thin bars and tiny marks. Never 3, 5, 7, 9 or 18 on a filled or shadowed box |
| Spacing | 4px steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| Icons | Lucide, at 12, 14, 16 or 20px. Stroke 1.5px beside regular text, 2px beside 500-weight labels. Gap to its label 6px; 10px in a list row |
| Buttons side by side | 8px apart; 12px between groups |
| One bright button | At most one primary button on a screen at a time. Everything else is secondary or ghost |
| Pointer targets | Every control at least 24px tall. On a phone, anything a finger lands on is at least 44px |
| Focus | A click never shows a ring. The keyboard always does: 2px solid `--av-focus-ring`, 2px offset. Text boxes never turn blue |
| Colour alone | Never carries meaning. A tone always comes with a word, an icon or a shape |
| Money | No `$`, prices, margins or invoices anywhere, sample data included. AI use shows as tokens or a percent of its cap |
| Untrusted text | Anything an agent or a client wrote, and every file name, renders as text. Uploaded files are never rendered inline |
| Passwords | Only credential actions ask for one. Approvals never do |
| Polling | None, except the stall check. Screens stay live from the event stream |
| Reduced motion | Every animation stops; colours, edges and labels stay |

**Breakpoints.** Phone is 760px and under. Tablet is 761 to 1023px. Desk is 1024px and up. A few layouts change again at 1240px and 1360px (named where they apply).

**Themes.** Light is the default. Night is `data-theme="night"` on `<html>`. Design both together: night is not light inverted.

## 3. Tokens

### 3.1 Colour (resolved values)

The blue is cobalt. Semantic names (`--av-*`) are what components use.

| Token | Light | Night |
| --- | --- | --- |
| `--av-accent` | `#284cc3` | `#97b3f4` |
| `--av-accent-hover` | `#2442a0` | `#a6bef4` |
| `--av-accent-line` | `#c3d2fb` | `#7ba1fc / 40%` |
| `--av-accent-tint` | `#edf2ff` | `#7ba1fc / 12%` |
| `--av-band` | `transparent` | `same` |
| `--av-chart-1` | `#2563c4` | `#3779d4` |
| `--av-chart-2` | `#119aa0` | `#1fa2a7` |
| `--av-chart-3` | `#8b5fd6` | `#8a6be0` |
| `--av-chart-4` | `#d0609f` | `#d4648c` |
| `--av-chart-5` | `#8d9097` | `#8c8d95` |
| `--av-chip` | `#f8f7f6` | `#27282c` |
| `--av-control-edge` | `#87878f` | `#76777f` |
| `--av-disabled-bg` | `#e9e7e6` | `#27282c` |
| `--av-disabled-fg` | `#65656b` | `#9e9fa7` |
| `--av-faceplate` | `#f6f5f3` | `#1b1c1f` |
| `--av-faceplate-hover` | `#e9e7e6` | `#27282c` |
| `--av-faceplate-pressed` | `#dddbda` | `#2f3034` |
| `--av-faint` | `#87878f` | `#76777f` |
| `--av-field-edge` | `#101828 / 9%` | `#ffffff / 9%` |
| `--av-field-fill` | `#f6f5f3` | `#ffffff / 4%` |
| `--av-field-focus` | `#3a64e4` | `#7ba1fc` |
| `--av-field-halo` | `#4a76f0 / 25%` | `#7ba1fc / 30%` |
| `--av-flash` | `#111214 / 8%` | `#ededef / 8%` |
| `--av-float` | `#f8f7f6` | `#212226` |
| `--av-floor` | `#f1efee` | `#141517` |
| `--av-focus-ring` | `#3a64e4` | `#3f69e2` |
| `--av-hairline` | `#e6e4e2` | `#ffffff / 7%` |
| `--av-hairline-strong` | `#8d9097 / 35%` | `#94969e / 30%` |
| `--av-hollow` | `#f1efee` | `transparent` |
| `--av-ink` | `#111214` | `#ededef` |
| `--av-ink-hover` | `#2b2c2d` | `#ccccce` |
| `--av-ink-pressed` | `#434445` | `#b0b1b3` |
| `--av-inset` | `#101828 / 4%` | `#ffffff / 3%` |
| `--av-inset-deep` | `#101828 / 6%` | `#ffffff / 6%` |
| `--av-inset-hover` | `#dfdddc` | `#2e2f33` |
| `--av-muted` | `#59595f` | `#a5a6ad` |
| `--av-needs` | `#3a64e4` | `#3f69e2` |
| `--av-needs-hover` | `#3359cc` | `#375dca` |
| `--av-needs-line` | `#3a64e4 / 28%` | `#3f69e2 / 40%` |
| `--av-needs-text` | `#284cc3` | `#97b3f4` |
| `--av-needs-tint` | `#3a64e4 / 7%` | `#3f69e2 / 14%` |
| `--av-on-danger` | `#ffffff` | `same` |
| `--av-on-ink` | `#f4f3f1` | `#1b1c1f` |
| `--av-on-needs` | `#ffffff` | `same` |
| `--av-on-primary` | `#ffffff` | `same` |
| `--av-on-primary-btn` | `#ffffff` | `same` |
| `--av-on-stopped` | `#ffffff` | `#141517` |
| `--av-on-verified` | `#ffffff` | `#141517` |
| `--av-page-bg` | `#f1efee` | `radial-gradient(1200px 640px at 22% -10%, rgb(220 232 255 / .04), transparent 62%), radial-gradient(900px 520px at 100% 0%, rgb(116 184 252 / .035), transparent 60%), #141517` |
| `--av-pending` | `#55585e` | `#b9bac1` |
| `--av-pending-line` | `#8d9097 / 35%` | `#94969e / 30%` |
| `--av-pending-soft` | `#f0f1f3` | `#ffffff / 7%` |
| `--av-pending-solid` | `#8d9097` | `#8c8d95` |
| `--av-primary` | `#3a64e4` | `#3f69e2` |
| `--av-primary-hover` | `#456ddc` | `#84a7fc` |
| `--av-primary-pressed` | `#4065c8` | `#8daefb` |
| `--av-primary-tint` | `#edf2ff` | `#7ba1fc / 12%` |
| `--av-scrim` | `#101828 / 35%` | `#060709 / 62%` |
| `--av-selected-border` | `#4a90e2` | `#74b8fc / 80%` |
| `--av-skeleton` | `#e6e4e2` | `#292a2e` |
| `--av-stopped` | `#b8352b` | `#f6a097` |
| `--av-stopped-line` | `#f3c9c6` | `#ec6a5e / 30%` |
| `--av-stopped-solid` | `#d64a3e` | `#ec6a5e` |
| `--av-stopped-tint` | `#fdeeee` | `#ec6a5e / 13%` |
| `--av-subtle` | `#5c5c61` | `#9e9fa7` |
| `--av-verified` | `#18744d` | `#78d6a8` |
| `--av-verified-line` | `#1f9d63 / 35%` | `#3cbf82 / 26%` |
| `--av-verified-solid` | `#1f9d63` | `#3cbf82` |
| `--av-verified-tint` | `#e9f8f1` | `#3cbf82 / 13%` |
| `--btn-tonal-fill` | `#e6eaf3` | `#2a2f3c` |
| `--btn-tonal-fill-hover` | `#dbe2f2` | `#2f3648` |
| `--btn-tonal-ink` | `#2d53ca` | `#b3c9ff` |
| `--btn-tonal-line` | `#6a7eae` | `#71809f` |
| `--btn-tonal-line-hover` | `#5672b8` | `#7f94c0` |
| `--btn-tonal-sheen` | `#ffffff / 70%` | `#ffffff / 12%` |
| `--f-edge` | `#101828 / 13%` | `#ffffff / 12%` |
| `--f-edge-hover` | `#101828 / 26%` | `#ffffff / 24%` |
| `--f-fill` | `#fbfaf9` | `#1f2024` |
| `--f-fill-focus` | `#ffffff` | `#232429` |
| `--f-halo` | `#101828 / 6%` | `#ffffff / 6%` |
| `--f-bad` | `#d64a3e` | `#ec6a5e` |
| `--field-focus-edge` | `#111214 / 50%` | `#ededef / 50%` |
| `--t-live` | `#1f9d63` | `#3cbf82` |
| `--t-stall` | `#284cc3` | `#97b3f4` |
| `--t-floor-dot` | `#111214 / 6%` | `#ffffff / 6%` |
| `--cg-main` | `#4a76f0` | `#7ba1fc` |
| `--cg-m1` | `#0f9b8e` | `#4fd1c1` |
| `--cg-m2` | `#e07a2e` | `#f5a25d` |
| `--cg-m3` | `#8b5cf6` | `#b197fc` |
| `--cg-m4` | `#d9467a` | `#f07aa5` |
| `--cg-m5` | `#5a9e2f` | `#8fd16a` |
| `--cg-m6` | `#2f8fd0` | `#6cbcf2` |
| `--cg-t-m1` | `#0a6a61` | `#4fd1c1` |
| `--cg-t-m2` | `#9a4c0d` | `#f5a25d` |
| `--cg-t-m3` | `#6232d6` | `#b9a3ff` |
| `--cg-t-m4` | `#a82757` | `#f58db2` |
| `--cg-t-m5` | `#3d6e1d` | `#9bd97a` |
| `--cg-t-m6` | `#1d6596` | `#80c6f4` |
| `--rcp-paper` | `#fbfaf6` | `#222326` |
| `--rcp-ink` | `#111214` | `#ededef` |
| `--rcp-rule` | `#111214 / 22%` | `#ededef / 26%` |
| `--cb-bg` | `#101828 / 6%` | `#ffffff / 6%` |
| `--cb-head` | `#d6d6d7 / 34%` | `#38393d / 34%` |
| `--tk-com` | `#6b6e73` | `#9aa0a6` |
| `--tk-fn` | `#1450b4` | `#8fb7ff` |
| `--tk-key` | `#1450b4` | `#8fb7ff` |
| `--tk-kw` | `#6a2fd0` | `#c6a8ff` |
| `--tk-num` | `#9a4600` | `#f2b87e` |
| `--tk-punct` | `#55585e` | `#b4b8be` |
| `--tk-str` | `#0f6a3d` | `#86d6a6` |
| `--tk-tag` | `#a3261a` | `#ff9e91` |
| `--tk-type` | `#0a6374` | `#72d4e2` |
| `--color-accent` | `#4a76f0` | `#7ba1fc` |
| `--color-accent-text` | `#2d53ca` | `#99b9ff` |
| `--color-focus-ring` | `#3a64e4` | `#99b9ff` |
| `--color-app-page` | `#f1efee` | `#141517` |
| `--color-app-panel` | `#f4f3f1` | `#1b1c1f` |
| `--color-app-raised` | `#e9e7e6` | `#27282c` |
| `--color-app-well` | `#e9e7e6` | `#ffffff / 4%` |
| `--color-text` | `#111214` | `#ededef` |
| `--color-text-muted` | `#66666d` | `#a5a6ad` |
| `--color-border` | `#e6e4e2` | `#ffffff / 7%` |
| `--color-border-strong` | `#dddcda` | `#ffffff / 13%` |

### 3.2 Type

| Role | Size / line height | Weight |
| --- | --- | --- |
| Page title (h1) | 28 / 36 | 500 |
| Section title, card title | 16 / 24 | 500 (600 on Agents, Drive, Getting started) |
| Large title in a card (welcome, sheet title) | 20 / 28 | 500 or 600 |
| Body | 14 / 20 | 400 |
| Label, secondary line | 13 / 20 | 400 or 500 |
| Small, meta, table header, tag | 12 / 16 or 12 / 18 | 400 or 500 |
| Mono | 12 or 13, same line height as its neighbours | 400 |
| Phone body | 16 / 24 where a paragraph is read; inputs are 16px so iOS doesn't zoom | 400 |

`tokens.css` still lists older entries that no screen uses: an 11px eyebrow, a 12.5px mono, 22, 24 and 40px numbers, and eyebrow and display letter spacing. Don't use them. The scale above is the rule.

### 3.3 Sizes

| Token | Value |
| --- | --- |
| Sidebar width | 264px; 64px collapsed |
| Canvas | fills the rest; 8px margin on top, right and bottom; 16px radius |
| Page gutter `--cr-gutter` | `clamp(16px, 3.2vw, 40px)`: 40px at 1440, 16px on a phone |
| Content max width | 1200px (`75rem`); Canon in focus mode uses `min(1600px, 100%)` |
| Panel side padding `--cr-panel-x` | 20px |
| Control heights | 28 (sm), 32 (md), 38 (lg); primary and form buttons are 40 |
| Field height | 40px on desk; 48px pill on a phone |
| Chip height | 22px |
| Tile (icon square) | 24, 32 or 36px |
| Minimum target | 24px; 44px for touch |
| Inspector / side panel | 360px; 440px wide; the filing sheet is 520px |
| z-index | raised 10, dock 200, modal 400, popover 450, toast 500 |

### 3.4 Shadows

- `--av-shadow-faceplate`
  - Light: `0 0 0 1px #e6e4e2, 0 1px 2px rgb(16 24 40 / .04)`
  - Night: `inset 0 1px 0 rgb(255 255 255 / .065), 0 0 0 1px rgb(255 255 255 / .05), 0 1px 2px rgb(0 0 0 / .4), 0 8px 20px -12px rgb(0 0 0 / .55)`
- `--av-shadow-raised`
  - Light: `0 0 0 1px #dddcda, 0 1px 1px rgb(16 24 40 / .04)`
  - Night: `inset 0 1px 0 rgb(255 255 255 / .065), 0 0 0 1px rgb(255 255 255 / .07), 0 1px 2px rgb(0 0 0 / .35)`
- `--av-shadow-inset`
  - Light: `inset 0 0 0 1px rgb(16 24 40 / .05)`
  - Night: `inset 0 0 0 1px rgb(255 255 255 / .06)`
- `--av-shadow-pressed`
  - Light: `inset 0 1px 2px rgb(16 24 40 / .05)`
  - Night: `inset 0 1px 1px rgb(0 0 0 / .22)`
- `--av-shadow-popover`
  - Light: `0 0 0 1px rgb(255 255 255 / 0), 0 0 0 1px rgb(16 24 40 / .04), 0 8px 24px -6px rgb(16 24 40 / .14)`
  - Night: `0 0 0 1px rgb(255 255 255 / .11), 0 0 0 1px rgb(255 255 255 / .06), 0 12px 32px -8px rgb(0 0 0 / .6)`
- `--av-shadow-overlay`
  - Light: `0 0 0 1px rgb(255 255 255 / 0), 0 0 0 1px rgb(16 24 40 / .04), 0 2px 6px rgb(16 24 40 / .05), 0 24px 56px -12px rgb(16 24 40 / .22)`
  - Night: `0 0 0 1px rgb(255 255 255 / .11), 0 0 0 1px rgb(255 255 255 / .06), 0 2px 6px rgb(0 0 0 / .3), 0 28px 64px -16px rgb(0 0 0 / .7)`
- `--shadow-card`
  - Light: `0 1px 2px rgb(16 24 40 / .04), 0 1px 1px rgb(16 24 40 / .02)`
  - Night: `0 1px 2px rgb(0 0 0 / .4), 0 8px 20px -12px rgb(0 0 0 / .55)`
- `--shadow-btn`
  - Light: `0 1px 2px rgb(16 24 40 / .06)`
  - Night: `0 1px 2px rgb(0 0 0 / .35)`
- `--shadow-field`
  - Light: `inset 0 1px 2px rgb(16 24 40 / .05)`
  - Night: `inset 0 1px 1px rgb(0 0 0 / .22)`
- `--shadow-popover`
  - Light: `0 0 0 1px rgb(16 24 40 / .04), 0 8px 24px -6px rgb(16 24 40 / .14)`
  - Night: `0 0 0 1px rgb(255 255 255 / .06), 0 12px 32px -8px rgb(0 0 0 / .6)`
- `--shadow-dialog`
  - Light: `0 0 0 1px rgb(16 24 40 / .04), 0 2px 6px rgb(16 24 40 / .05), 0 24px 56px -12px rgb(16 24 40 / .22)`
  - Night: `0 0 0 1px rgb(255 255 255 / .06), 0 2px 6px rgb(0 0 0 / .3), 0 28px 64px -16px rgb(0 0 0 / .7)`
- `--shadow-drag`
  - Light: `0 10px 28px rgb(16 24 40 / .12)`
  - Night: `0 14px 32px rgb(0 0 0 / .55)`
- `--cr-amb`
  - Light: `0 1px 2px rgb(16 24 40 / .04), 0 12px 28px -18px rgb(16 24 40 / .22)`
  - Night: `0 0 0 0 transparent`

### 3.5 Motion

| Token | Value | Used for |
| --- | --- | --- |
| `--m-fast` | 150ms | Press, hover lift |
| `--m-base` | 240ms | Page in, list rows arriving, toasts |
| `--m-slow` | 420ms | The receipt printing, titles coming into focus |
| `--m-ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Arriving |
| `--m-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving |
| `--m-spring` | `cubic-bezier(0.2, 0.9, 0.3, 1.15)` | Pops, toasts |
| `--m-step` | 35ms | Stagger between list rows, at most 6 steps |
| `--av-ease` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | General state changes |
| `--beat` | 2.2s by default; set from how many rooms are running | The one heartbeat every live dot shares |
| Sheet / panel | open 400ms, close 350ms, `cubic-bezier(0.22, 1, 0.36, 1)` | Sheets and side panels |
| Modal | open 250ms, close 150ms, same curve | Dialogs, the palette |

Leaving is faster than arriving. Only transform, opacity and filter animate; layout never does.

## 4. Every design pass, in order

Later passes override earlier ones. This is the full list of what was decided; sections 5 to 9 give the values.

### 4.1 Polish pass (`polish.css`)
- **Press:** one feel everywhere. Controls scale to 0.96 over 150ms ease-out; never on a disabled control. Tonal primary, secondary and ghost buttons press to 0.97.
- **Icons** keep their line weight at every size (1.5px, or 2px beside 500-weight labels).
- **Toggles are transitions,** so a reversal retargets instead of snapping.
- **High contrast (forced colours):** anything drawn with a shadow ring gets a real border.
- **Targets:** every control and row link at least 24px tall; links inside a sentence are exempt.
- **Order inside a control:** icon first, label, chevron last. A count pill is its own rounded shape.
- **Sidebar project rows:** the name keeps its room; the status note shrinks first.
- **Segmented controls** used as tabs mark the current one with `aria-selected`; radios use `aria-checked`.
- **Toast tones:** the icon and an edge carry the tone, never colour alone.
- **Inline code** sits on the type scale: 13px in body text, 12px in small text and tables.

### 4.2 Header and phone (`header.css`, `phone.css`, `sheets.css`)
- **Top bar right side:** the factory pulse and search share one height and one shape, as one quiet group.
- **The pulse** is one item with words ("1 room running · 1 parked"). Parked wins, because that's the one you act on.
- **A page title focused by a route change shows no ring.** It isn't a control.
- **Phone header:** only the current place, larger. A back link names the parent ("‹ Build") and replaces in-page back links.
- **Phone project header:** smaller title, gates on one line, tabs that scroll with a fade at the edge.
- **Phone Live:** rooms one at a time; a terminal shows its last eight lines, not a scroll box.
- **Phone text:** long lines wrap instead of clipping. Nothing under 12px.
- **Sheets:** one shared bottom sheet. Scrims fade with the sheet and never catch taps while closed. Filters, the navigation drawer, the Library browser and the palette all use it.
- **Landscape phone** keeps the dock.

### 4.3 Motion (`motion.css`)
- **Page changes** use the View Transitions API: the old page leaves in 110ms (up 4px, fading), the new one eases in from 8px below in 240ms. The sidebar and a project's header stay put.
- **Lists arrive in order,** 35ms apart, at most 6 steps, rising 6px.
- **The receipt prints:** its sections arrive top to bottom, 60ms apart, over 420ms.
- **Openable cards lift** 2px under the pointer (template cards, receipt files).
- **A badge pops** (scale from 0.6, 260ms spring) when its number changes.
- **The current tab's underline** grows in from the centre.
- **Toasts** rise in with the spring curve.

### 4.4 Focus (`focus.css`)
- **Clicks show nothing.** `:focus:not(:focus-visible)` has no outline.
- **Text boxes and selects** never show an outline or a blue halo. The edge darkens to 50% ink.
- **Fields inside a frame** (search boxes, the reason field, Canon's reply row, the palette input) keep their own edge off; the frame shows focus.
- **Cards, code blocks and scrolling tables** never show a ring from a click.
- **Forced colours:** fields get a 2px `Highlight` outline.

### 4.5 Taste pass (`taste.css`): motion means something
- **Text boxes:** one hairline edge, no inner shadow. On focus a bright segment runs once around the edge (1.4s), the field lifts, and a soft halo breathes (2.8s loop) while you type. Invalid: a red edge, one 320ms shake, and the message below in red.
- **Field rhythm:** label, field, hint, evenly spaced. On a phone: pill fields and selects at 48px, deep rounded text areas.
- **One heartbeat** (`--beat`) on every live dot. It stops, and the dot turns amber, when the stream stalls.
- **Event sweep:** a thin light crosses the top of the page when an event arrives (1.15s, at most one a second). It's clipped to the canvas so it never widens the page.
- **Gates as a conveyor:** a light runs along the current gate's rail (2.8s loop). A passed gate scans once as the page opens.
- **Busy rooms:** a thin scan line passes down a building room (3.6s), behind the terminal and gauges. The agent's line carries a small working light (1.4s blink). A parked room is still, with a red edge.
- **The floor and the machines:** the page is a faint dot grid that stays put while the work scrolls over it. Cards have a lit top edge, a hairline and a long soft shadow. Night adds a glow from where the live work is.
- **Status dots in tags glow.**
- **Machine data in mono,** tabular: counts, refs, meta.
- **Titles** take Inter's straighter alternates: a single-storey a, open digits.
- **Rolling numbers** on badges, counts and the daily line (300ms lift).
- **Approving feels physical:** the press, the next card sliding up, and a line under Undo that drains over 6 seconds.
- **Quiet states:** when nothing needs you, the factory idles (4.2s breathing), instead of a blank page.

### 4.6 Notch 2 (`notch.css`)
- **The blue is cobalt** in both themes.
- **Primary buttons are tonal at rest:** a faint cobalt wash (`#e6eaf3`), a greyish-blue 1px inset outline (`#6a7eae`) and a cobalt label (`#2d53ca`). On hover (desk, fine pointer) the button fills to solid cobalt (a `#3359cc` → `#2343ae` gradient) with a white label and a soft cobalt shadow under it. It presses to 0.97. Disabled or busy: 55% opacity, outline only.
- **Clicked text boxes are neutral:** darker edge, the running segment, a lift and a grey halo. No blue.
- **Decisions header** has the same anatomy as every page: title and the waiting tag on the left, today's progress on the right, the date and urgency below.
- **The next decision** carries a slow light around its edge while it waits on you (9s loop).
- **Terminals** have faint scanlines and glowing output.
- **Running time bars:** stripes travel while the attempt runs (1.2s).
- **The pulse and Live:** three activity bars move with the heartbeat while rooms run. They still read as bars when still.
- **Grain:** a still, barely visible texture over the floor.
- **New rows:** the newest event and the newest decision you made glow once (1.6s).
- **Gates:** passed gates glow faintly green; the current one's fill breathes.
- **Big numbers** (budgets, meters, receipts) get a lit meter: a gradient fill with a bright tip.
- **Entrances on desk:** titles and cards come into focus, from a 5px blur and 8px below, over 420ms.
- **Panels:** one radius, roomier heads, a title that reads as a title and a quiet mono count.
- **Labels:** every small section label is the same quiet 12px medium with the same space under it.
- **Sidebar:** a cobalt brand tile with the stream's heartbeat by the name; one quiet label style per group with a hairline between groups; 36px items; project dots as status lights with a halo; the account as a small raised card with the stream's state in words.
- **Layout:** on a tablet the menu button gets room beside a flush page title. A project's "Watch the work" and menu sit on the title's row, never over the gates.

### 4.7 Finish pass (`finish.css`)
- **Sidebar:** no numbers on screen (screen readers still hear "14 waiting on you"). Phase words ("Scoping", "Draft") have no tile. The current link has no tile either: a short cobalt bar on the left, a cobalt icon and a darker label.
- **Labels:** kind chips are soft filled pills with no border. Status tags lose the hard edge. "Next up" carries a dot. Key/value keys are 12px muted. Table headers are 12px on one line.
- **Library overview:** the release as a pill chip; three stat cards (icon tile, number, label); each section a grid of cards (icon tile, name, one-line blurb, count chip, an arrow on hover) under a heading with a hairline to the edge.
- **Library rail:** no counts; 36px items; the same cobalt bar on the current page.
- **Library search:** a magnifier and the field only, no placeholder; the label is screen-reader text. Soft fill at rest, a raised plate on focus.
- **Daylight (light mode only):** a cool cobalt wash with a hint of violet over the warm floor. Cards, the hero and the top-bar pills are white plates with a lit top edge and a long soft shadow. The next decision gets a cobalt-tinted edge and shadow.
- **Small fixes:** a finding's route on its own line; the retry-ladder note wraps; activity times don't split; the phone hero puts the expiry on the first line and the project on its own line.

### 4.8 Trail kit (`trail.css`)
- **One set of markers** for the trail and the graph: done (check on soft cobalt), failed (x), running (the thinking orb), needs you (solid cobalt with a breathing ring), parked (pause), not started (hollow), approval ahead (dashed), not landed yet (dashed cobalt), head (cobalt ring), commit and merge dots in the lane's colour, a collapsed count.
- **Agent trail** on the module page: tests locked → each try → your call → land on main → gates. The rail bends out to the running try's steps and back. Finished tries fold away. The step waiting on you opens inline with the ask, a reason box when the kind needs one, and Approve.
- **Commit graph:** newest first, main in cobalt, each module's tries on its own lane in its colour, curves at the fork and merge, the head ringed, older history folded into a count. Hover (desk) or tap (phone) opens the commit card.
- **Retro terminal:** each new line types in and ends with a blinking cobalt block cursor. One cursor everywhere text types (`.tt-cursor`).

### 4.9 Navigation pass (`nav.css`)
- **Breadcrumb:** top-level pages show none. Every other page shows its whole path in the top bar; links up, the current place as plain text. Long names shrink with an ellipsis only when the bar runs out of room. Phones show the back link instead.
- **Page tabs:** 34px on desk, 40px on a phone, 13px text, an underline only on the current tab. On phones the strip scrolls with soft edges and the current tab centres itself.
- **Switches:** every segmented control is one compact size: 26px buttons in a 30px track with 2px padding. On a phone the buttons are 44px tall.
- **Phone dock:** a floating bar with a cobalt lens that slides to where you are. Live states instead of numbers: a breathing pip on Decisions when items wait, activity bars on Live while a room runs, the project's gates as a ring (Canon's orb while it's his turn), a green pip on Release when it's ready. Each state is in the tab's accessible name.
- **Canon's turn:** a presence pill in the chat header (orb, word, step, live clock); the turn's steps in his message as they happen; folded to "4 steps · 1.9 s" when done.

### 4.10 Empty states
- **One component** wherever there's nothing to show: a scene, a title, one line, at most one action. Sizes: 240×180 for a page or card, 160×120 inside a panel.
- **The scene is decorative** and hidden from screen readers. All scenes share a 5.6s loop that stops under reduced motion.
- **Scenes by case** are listed in `handoff/components.md`.

### 4.11 Crew (`crew.css`)
- **A project's team as a live tree:** the lead on top, one card per module, the test writer and reviewers hanging under each module on a rail.
- **Cards** show the agent, model, a status pill, the current line (typing in on the running card), AI used against its cap as a bar, the try and the tests. Working cards glow, and a pulse runs down the wire from the lead.
- **Titles and the live line wrap** to two lines instead of being cut. Columns are at least 168px; more than fit scroll sideways. One column on a phone.

### 4.12 Bottleneck pass
- **A clean checkpoint** reads "… is clean", with a Clean tag, a four-line summary and a "See the breakdown" link. It's one tap.
- **The answer bar sticks** to the bottom of the screen on a laptop while the decision is in view. After you decide, the next item's title scrolls into view and takes focus.
- **Release bar:** a pending pass is accepted right there with its reason, then Release.

### 4.13 Desktop pass (`desk.css`)
- **Top bar:** scrolls away with the page. No sticky slab, no background, no blur, no border, no condensed title, in either theme. Things that used to stick below it now stick 16px from the top.
- **Search:** the icon alone, a 36px circle (44px on a phone). ⌘K still opens the palette. Its accessible name stays "Search".
- **No light follows the pointer** over cards.
- **List row links:** hover is a neutral wash (`--av-faceplate-hover`), with no tinted tile and no accent bar.
- **Live:** event-river rows are `60px 8px 1fr`, 10px column gap, 8px vertical padding; times never wrap. The project filters get `4px 20px 16px` padding and a hairline under them, with 8px between chips. At 1360px and up the grid is `1fr 360px`.
- **Canvas view:** meters and layout controls stay on one row from 1000px.
- **Canon:** from 901px the columns are `minmax(400px, 5fr) 7fr`. The interview is `100dvh − 32px` tall (at least 560px), pinned 16px from the top. The conversation keeps at least 220px above the question card, which scrolls inside at 62% height.
- **Canon's approve bar** sits flush on the card's bottom edge.
- **Decisions:** queue titles wrap to two lines on a laptop. The sticky answer bar takes the card's own surface.
- **Release:** at 1240px and up the receipt and "What ships" sit side by side.

### 4.14 Agents (`agents.css`)
- **The canvas is gone.** Agents is a grid of cards by team.
- **Agent card:** 20px radius; the whole card is a link to the agent's page. A round avatar (filled for builders, accent ring for leads, outline for checkers, dashed for Canon), name, what it does, a status pill (Working pulses; Waiting on you; Parked; Idle), a dark pill with the live command while working, work-kind pills, a model pill and effort, and a chevron that nudges on hover.
- **Team group:** the team's name, a count pill and its rule, then a grid of `auto-fill, minmax(272px, 1fr)`.
- **Agent page:** a hero card, Recent work, Works with (linked agent pills), Setup and Skills on the side, previous and next at the foot.

### 4.15 Drive (`uploads.css`)
- **The nav item is "Drive"** with the hard-drive icon, at `/drive`.
- **No count badge and no upload button in the top bar.** Drive's own Upload button is the way in without dragging.
- **No folded pill.** The upload tray shows only while you upload, and closes when you close it or change page. Progress stays on the file's Drive row.
- **Where a file will go is on screen before you drop it.** The drop target names the place first.
- **File rows:** held items first. "File" is a secondary button, not a bright one. On a phone the actions are a grid of 44px buttons.
- **Thumbnails are type icons** in a tinted square. Uploaded content is never the image source.

### 4.16 Getting started, Connections, the welcome and phase bars (`setup.css`)
- **Getting started pill** at the bottom of the sidebar: a progress ring, the words and "N of 6". It goes away when all six are done.
- **Steps tick from real state.** No checkboxes. The first step you can do now carries the page's one bright button; a step that waits on another has a dashed marker.
- **Connections** in Settings: GitHub, Repos, Secrets, CLI and MCP. Each has a 32px icon tile, a 16px title and a one-line description. Rows sit in a 12px-radius bordered list.
- **Credential sheet:** tokens and values are password fields, sent once, never shown back. It renders at the top of the document so it covers the phone dock.
- **Welcome** on an empty Decisions page: one heading, one sentence, one bright button, three small drawn previews (bars stand in for text), and a Getting started row.
- **Phase bars:** five thin segments (Scope, Plan, Build, Check, Release) with the phase name. In Build the current segment fills by modules landed. Green when delivered, grey when cancelled, amber when the deadline is at risk. On All projects the bar replaces the gate dashes.
- **One bright button per screen,** checked on every route at both sizes.

## 5. The shell (measured)

The sidebar is fixed at the left. The canvas is a rounded panel beside it that scrolls. The top bar and a page's header sit inside the canvas and scroll with it.

**Reading the measured lists.** Each piece gives the prototype's selector (so you can find its rules), its measured size, then Box, Type and colour. "Light" is the 1440 light value; "Night" lists only what differs at night; "Phone 360" lists only what differs on a phone. Type on a container is what its children inherit. A colour written `#101828 / 5%` is that colour at 5% opacity. Widths of fluid pieces are what they measured at that viewport, not fixed widths.

- **App background (body)** `body` · measured 1440×900 at 1440
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `radial-gradient(800px 500px at 0% 0%, #ffffff / 55%, transparent 70%), linear-gradient(#ebeaeb, #e6e4e3)`
  - Night: text `#ededef`; fill `#121315`; no background-image
  - Phone 360: 360×780
- **Sidebar** `.lib-rail` · measured 264×900 at 1440
  - Box: display `flex`; padding `16px 12px 12px`; gap `6px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 317×780; padding `20px 12px 12px`
- **Sidebar head** `.lib-rail-head` · measured 240×44 at 1440
  - Box: display `flex`; min-height `44px`; gap `6px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 293×44
- **Brand tile** `.lib-brand-mark` · measured 34×34 at 1440
  - Box: display `grid`; columns `34px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#ffffff`; background-image `radial-gradient(120% 120% at 20% 0%, #6d8ff7, #3a64e4 45%, #2a3fb0)`; shadow `#ffffff / 28% 0px 1px 0px 0px inset, #000000 / 18% 0px -1px 0px 0px inset, #2d53ca / 75% 0px 6px 16px -8px`
  - Phone 360: 34×34
- **Brand name** `.lib-brand-name` · measured 74×17 at 1440
  - Box: display `flex`; gap `8px`
  - Type: `14px/16.8px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 74×17
- **Brand sub-label** `.lib-brand-sub` · measured 74×14 at 1440
  - Box: overflow `hidden`
  - Type: `12px/14.4px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 74×14
- **Nav section** `.lib-nav-sec` · measured 240×166 at 1440
  - Box: display `flex`; padding `4px 0px 12px`; gap `2px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 293×166
- **Nav item (rest)** `.lib-nav-item:not([aria-current])` · measured 240×36 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `12px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214 / 72%`
  - Night: text `#ededef / 72%`
  - Phone 360: 293×36
- **Nav item (current)** `.lib-nav-item[aria-current=page]` · measured 240×36 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `12px`; radius `10px`
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 293×36
- **Nav item label** `.lib-nav-item:not([aria-current]) .lib-nav-label` · measured 192×20 at 1440
  - Box: overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214 / 72%`
  - Night: text `#ededef / 72%`
  - Phone 360: 245×20
- **Nav current indicator bar** `.lib-nav-indicator` · measured 240×36 at 1440
  - Box: position `absolute`; bottom `637px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 293×36; bottom `447px`
- **Nav group heading** `.cr-nav-head` · measured 240×30 at 1440
  - Box: display `flex`; padding `0px 0px 6px 10px`; gap `2px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 293×50
- **Project status dot** `.lib-nav-item .cr-pdot` · measured 8×8 at 1440
  - Box: margin `0px 2px`; radius `50%`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214 / 72%`; fill `#339797`; shadow `#339797 / 18% 0px 0px 0px 3px`
  - Night: text `#ededef / 72%`; fill `#63b5b4`; shadow `#63b5b4 0px 0px 10px -1px`
  - Phone 360: 8×8
- **Project phase note** `.lib-nav-meta` · measured 46×20 at 1440
  - Box: display `flex`; max-width `45%`; margin `0px 0px 0px 4px`; radius `6px`; overflow `hidden`
  - Type: `12px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 46×20
- **Getting started pill** `.gs-pill` · measured 224×42 at 1440
  - Box: display `flex`; min-height `40px`; padding `0px 12px`; margin `8px 8px 4px`; gap `10px`; radius `12px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`; border `1px solid #e6e4e2`
  - Night: text `#ededef`; border `1px solid #ffffff / 7%`
  - Phone 360: 277×42
- **Account card** `.cr-avatar-btn` · measured 240×75 at 1440
  - Box: display `flex`; min-height `52px`; padding `8px 10px`; gap `12px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff, #fafaf9)`; shadow `#ffffff / 50% 0px 1px 0px 0px inset, #e6e4e2 0px 0px 0px 1px, #101828 / 25% 0px 6px 14px -10px`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#ffffff / 5% 0px 1px 0px 0px inset, #ffffff / 7% 0px 0px 0px 1px, #000000 / 70% 0px 8px 18px -10px`; no background-image
  - Phone 360: 293×75
- **Avatar** `.cr-avatar` · measured 32×32 at 1440
  - Box: display `grid`; columns `32px`; radius `50%`
  - Type: `13px/20px` weight `500`
  - Light: text `#ffffff`; background-image `radial-gradient(120% 120% at 20% 0%, #6d8ff7, #2d53ca)`; shadow `#f6f5f3 0px 0px 0px 2px, #4a76f0 / 45% 0px 0px 0px 3.5px`
  - Night: shadow `#1b1c1f 0px 0px 0px 2px, #7ba1fc / 45% 0px 0px 0px 3.5px`
  - Phone 360: 32×32
- **Canvas (scroll area)** `.cr-canvas` · measured 1168×884 at 1440
  - Box: display `flex`; margin `8px 8px 8px 0px`; radius `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f2f1ef`; background-image `radial-gradient(1000px 460px at 82% -10%, #284cc3 / 12%, transparent 70%), radial-gradient(760px 380px at 4% 110%, #7c5cff / 6%, transparent 70%), radial-gradient(#111214 / 5% 1px, transparent 1.4px)`; shadow `#141c34 / 6% 0px 0px 0px 1px, #1c285a / 30% 0px 24px 60px -40px`
  - Night: text `#ededef`; fill `#141517`; background-image `radial-gradient(900px 420px at 78% -8%, #97b3f4 / 18%, transparent 70%), radial-gradient(700px 360px at 8% 108%, #9b84ff / 12%, transparent 70%), radial-gradient(#ffffff / 6% 1px, transparent 1.4px)`; shadow `#ffffff / 6% 0px 0px 0px 1px`
  - Phone 360: 360×780
- **Top bar** `.lib-topbar` · measured 1168×57 at 1440
  - Box: display `grid`; min-height `56px`; padding `0px 40px`; columns `0px 791.422px 260.578px 36px`; radius `16px 16px 0px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; border-bottom `1px solid transparent`
  - Night: text `#ededef`
  - Phone 360: 360×57; padding `0px 8px 0px 16px`; columns `205.312px 86.6875px 44px`
- **Factory pulse** `.cr-pulse` · measured 245×32 at 1440
  - Box: display `flex`; padding `0px 4px`; margin `0px 0px 0px 16px`; gap `2px`; radius `999px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#ffffff / 72%`; shadow `#ffffff / 90% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 18% 0px 4px 10px -6px`
  - Night: text `#ededef`; shadow `#ffffff / 7% 0px 0px 0px 1px inset`; no fill
  - Phone 360: 83×44; margin `0px 0px 0px 4px`
- **Search button** `.cr-head-right .cr-search` · measured 36×36 at 1440
  - Box: display `flex`; gap `6px`; radius `50%`
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`; fill `#ffffff / 72%`; shadow `#ffffff / 90% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 18% 0px 4px 10px -6px`
  - Night: text `#a5a6ad`; shadow `#ffffff / 7% 0px 0px 0px 1px inset`; no fill
  - Phone 360: 44×44
- **Page masthead** `.cr-mast` · measured 1168×97 at 1440
  - Box: padding `10px 40px 18px`; margin `-56px 0px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 360×160; padding `14px 16px 18px`
- **Masthead inner** `.cr-mast-inner` · measured 1088×69 at 1440
  - Box: max-width `1200px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×128
- **Page title (h1)** `.cr-mast-title` · measured 131×36 at 1440
  - Type: `28px/36px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 93×28; type `20px/28px` weight `500`
- **Page lead** `.cr-mast-lead` · measured 636×21 at 1440
  - Box: max-width `635.906px`; margin `8px 0px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 328×44
- **Page body** `.lib-screen` · measured 1088×1979 at 1440
  - Box: display `flex`; max-width `1200px`; gap `20px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×3057
- **Content wrapper** `.cr-content` · measured 1088×1979 at 1440
  - Box: display `flex`; gap `20px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×3057
- **Phone dock** `.lib-tabbar` · measured 340×66 at 360
  - Box: display `grid`; position `fixed`; top `706px`; bottom `8px`; padding `6px`; columns `65.5938px 65.5938px 65.6094px 65.5938px 65.5938px`; radius `22px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f8f7f6 / 80%`; shadow `#ffffff / 75% 0px 1px 0px 0px inset, #141c34 / 8% 0px 0px 0px 1px, #141c34 / 38% 0px 18px 40px -16px`; backdrop-filter `blur(18px) saturate(1.5)`
  - Night: text `#ededef`; fill `#1c1d22 / 78%`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 8% 0px 0px 0px 1px, #000000 / 85% 0px 20px 44px -16px`
- **Phone dock tab** `.lib-tab` · measured 66×54 at 360
  - Box: display `flex`; min-height `54px`; padding `0px 2px`; gap `4px`; radius `16px`
  - Type: `12px/16px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
- **Phone dock lens** `.dock-lens` · measured 66×54 at 360
  - Box: position `absolute`; top `6px`; bottom `6px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`

**Notes**
- The page header (`.cr-mast`) is pulled up 56px so the title sits in the top bar's row on pages that have one.
- The current nav item has no tile. The sliding indicator is transparent and draws only a cobalt bar on its left edge: 2px wide, 2px radius, inset 9px from the top and bottom of the 36px item (so 18px tall). The icon turns cobalt and the label darkens.
- On a phone the sidebar becomes a drawer, and the dock is the main navigation: five tabs at most, the middle one the current project.

## 6. Controls (measured)

### Buttons, tags, cards

- **Button primary** `.av-btn[data-variant=primary]` · measured 204×40 at 1440
  - Box: display `flex`; padding `0px 18px`; gap `6px`; radius `10px`
  - Type: `14px/14px` weight `500`
  - Light: text `#2d53ca`; fill `#e6eaf3`; background-image `linear-gradient(110deg, transparent 38%, #ffffff / 70% 50%, transparent 62%)`; shadow `#6a7eae 0px 0px 0px 1px inset, #101828 / 5% 0px 1px 2px 0px`
  - Night: text `#b3c9ff`; fill `#2a2f3c`; background-image `linear-gradient(110deg, transparent 38%, #ffffff / 12% 50%, transparent 62%)`; shadow `#71809f 0px 0px 0px 1px inset, #7ba1fc / 55% 0px 8px 22px -12px`
  - Phone 360: 177×44; min-height `44px`; padding `0px 12px`; type `13px/13px` weight `500`
- **Button secondary** `.av-btn[data-variant=secondary]` · measured 158×32 at 1440
  - Box: display `flex`; padding `0px 12px`; gap `6px`; radius `10px`
  - Type: `13px/13px` weight `500`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff, #fafaf9)`; shadow `#dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 9% 0px 0px 0px 1px`; no background-image
  - Phone 360: 158×44; min-height `44px`
- **Button ghost** `.av-btn[data-variant=ghost]` · measured 32×32 at 1440
  - Box: display `flex`; gap `6px`; radius `10px`
  - Type: `13px/13px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 44×44; min-height `44px`
- **Button sm** `.av-btn[data-size=sm]` · measured 95×28 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `6px`; radius `10px`
  - Type: `12px/12px` weight `500`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff, #fafaf9)`; shadow `#dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 9% 0px 0px 0px 1px`; no background-image
  - Phone 360: 143×44; min-height `44px`
- **Tag (default)** `.av-tag` · measured 80×22 at 1440
  - Box: display `flex`; padding `0px 8px`; gap `5px`; radius `6px`
  - Type: `12px/20px` weight `500`
  - Light: text `#111214 / 80%`; fill `#111214 / 7%`; border `1px solid transparent`
  - Night: text `#ececf0 / 86%`; fill `#ffffff / 7%`
  - Phone 360: 80×22
- **Tag verified** `.av-tag[data-tone=verified]` · measured 138×22 at 1440
  - Box: display `inline-flex`; padding `0px 8px`; gap `5px`; radius `6px`
  - Type: `12px/20px` weight `500`
  - Light: text `#18744d`; fill `#ebf2ee`; border `1px solid transparent`
  - Night: text `#78d6a8`; fill `#3cbf82 / 13%`; border `1px solid #3cbf82 / 26%`
  - Phone 360: 138×22
- **Tag stopped** `.av-tag[data-tone=stopped]` · measured 73×22 at 1440
  - Box: display `inline-flex`; padding `0px 8px`; gap `5px`; radius `6px`
  - Type: `12px/20px` weight `500`
  - Light: text `#b8352b`; fill `#fbedeb`; border `1px solid transparent`
  - Night: text `#f6a097`; fill `#ec6a5e / 13%`; border `1px solid #ec6a5e / 30%`
  - Phone 360: 73×22
- **Tag pending** `.av-tag[data-tone=pending]` · measured 130×22 at 1440
  - Box: display `inline-flex`; padding `0px 8px`; gap `5px`; radius `6px`
  - Type: `12px/20px` weight `500`
  - Light: text `#55585e`; fill `#eeefef`; border `1px solid transparent`
  - Night: text `#b9bac1`; fill `#ffffff / 7%`; border `1px solid #94969e / 30%`
  - Phone 360: 130×22
- **Card** `.lib-card` · measured 744×303 at 1440
  - Box: radius `14px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×753
- **Mono text** `.kb-mono` · measured 30×22 at 1440
  - Box: display `flex`; padding `0px 8px`; radius `6px`
  - Type: `12px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#59595f`; fill `#111214 / 6%`
  - Night: text `#a5a6ad`; fill `#ededef / 6%`
  - Phone 360: 30×22

### Forms

- **Form card** `.cr-form` · measured 680×443 at 1440
  - Box: display `flex`; max-width `680px`; padding `24px`; gap `24px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×571
- **Fieldset legend** `.cr-legend` · measured 47×22 at 1440
  - Box: margin `0px 0px 4px`
  - Type: `14px/22px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 47×22
- **Field label** `.cr-field > span` · measured 632×18 at 1440
  - Type: `13px/18px` weight `500`
  - Light: text `#111214 / 82%`
  - Night: text `#ededef / 82%`
  - Phone 360: 280×18; padding `0px 0px 0px 6px`
- **Text input** `.cr-input` · measured 632×40 at 1440
  - Box: min-height `40px`; padding `0px 14px`; radius `12px`; overflow `clip`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#fbfaf9, #fbfaf9), linear-gradient(#101828 / 13%, #101828 / 13%)`; border `1px solid transparent`
  - Night: text `#ededef`; background-image `linear-gradient(#1f2024, #1f2024), linear-gradient(#ffffff / 12%, #ffffff / 12%)`
  - Phone 360: 280×48; min-height `48px`; padding `0px 20px`; radius `999px`; type `16px/20px` weight `400`
- **Hint** `.cr-hint` · measured 545×72 at 1440
  - Box: max-width `545.062px`
  - Type: `12px/18px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 210×162
- **Form foot** `.cr-form-foot` · measured 632×49 at 1440
  - Box: display `flex`; padding `16px 0px 0px`; gap `8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; border-top `1px solid #e6e4e2`
  - Night: text `#ededef`; border-top `1px solid #ffffff / 7%`
  - Phone 360: 280×61

### Segmented control, settings sections, connection rows

- **Segmented track** `.lib-seg` · measured 150×30 at 1440
  - Box: display `flex`; padding `2px`; gap `2px`; radius `9px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 6%`; shadow `#e6e4e2 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#ffffff / 6%`; shadow `#ffffff / 7% 0px 0px 0px 1px inset`
  - Phone 360: 150×48
- **Segment button** `.lib-seg-btn:not([aria-checked=true])` · measured 73×26 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `6px`; radius `7px`
  - Type: `13px/20px` weight `500`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 73×44; min-height `44px`
- **Segment button (on)** `.lib-seg-btn[aria-checked=true]` · measured 71×26 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `6px`; radius `7px`
  - Type: `13px/20px` weight `500`
  - Light: text `#111214`; fill `#f8f7f6`; shadow `#dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#27282c`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 7% 0px 0px 0px 1px, #000000 / 35% 0px 1px 2px 0px`
  - Phone 360: 71×44; min-height `44px`
- **Settings section card** `.cr-sec` · measured 760×152 at 1440
  - Box: display `flex`; padding `20px`; gap `16px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×156
- **Section heading** `.scr-h2` · measured 720×20 at 1440
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 288×20
- **Connections head** `.cn-head` · measured 720×45 at 1440
  - Box: display `grid`; gap `12px`; columns `32px 572.094px 91.9062px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 288×117; columns `32px 244px`
- **Connections icon tile** `.cn-ico` · measured 32×32 at 1440
  - Box: display `grid`; columns `32px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`; fill `#101828 / 4%`
  - Night: text `#a5a6ad`; fill `#ffffff / 3%`
  - Phone 360: 32×32
- **Connections list** `.cn-list` · measured 720×269 at 1440
  - Box: radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; border `1px solid #e6e4e2`
  - Night: text `#ededef`; border `1px solid #ffffff / 7%`
  - Phone 360: 288×739
- **Connections row** `.cn-list li` · measured 718×66 at 1440
  - Box: display `flex`; padding `12px 14px`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 286×166
- **Connections row title** `.cn-row-t` · measured 464×20 at 1440
  - Box: display `flex`; gap `4px 10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 258×20
- **Connections sub line** `.cn-sub` · measured 464×20 at 1440
  - Box: display `flex`; gap `2px 12px`
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 258×64
- **Command strip** `.cn-cmd` · measured 720×40 at 1440
  - Box: display `flex`; padding `6px 6px 6px 14px`; gap `8px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 4%`
  - Night: text `#ededef`; fill `#ffffff / 3%`
  - Phone 360: 288×56
- **Count pill** `.ag-count` · measured 36×20 at 1440
  - Box: display `grid`; padding `0px 6px`; columns `24px`; radius `999px`
  - Type: `12px/20px` weight `400`
  - Light: text `#59595f`; fill `#f8f7f6`
  - Night: text `#a5a6ad`; fill `#27282c`
  - Phone 360: 36×20

### States and overlays

- **Button primary:hover** `.av-btn[data-variant=primary]` · measured 204×40 at 1440
  - Box: display `flex`; padding `0px 18px`; gap `6px`; radius `10px`
  - Type: `14px/14px` weight `500`
  - Light: text `#ffffff`; fill `#dbe2f2`; background-image `linear-gradient(#3359cc, #2343ae)`; shadow `#5672b8 0px 0px 0px 1px inset, #2d53ca / 60% 0px 6px 16px -10px`
  - Night: fill `#2f3648`; background-image `linear-gradient(#375dca, #2748ad)`; shadow `#71809f 0px 0px 0px 1px inset, #7ba1fc / 55% 0px 8px 22px -12px`
- **Button secondary:hover** `.av-btn[data-variant=secondary]` · measured 158×32 at 1440
  - Box: display `flex`; padding `0px 12px`; gap `6px`; radius `10px`
  - Type: `13px/13px` weight `500`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff, #fafaf9)`; shadow `#dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 9% 0px 0px 0px 1px`; no background-image
- **Button ghost:hover** `.av-btn[data-variant=ghost]` · measured 32×32 at 1440
  - Box: display `flex`; gap `6px`; radius `10px`
  - Type: `13px/13px` weight `500`
  - Light: text `#111214`; fill `#e9e7e6`
  - Night: text `#ededef`; fill `#27282c`
- **Nav item:hover** `.lib-nav-item:not([aria-current])` · measured 240×36 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `12px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#111214 / 4%`
  - Night: text `#ededef`; fill `#ededef / 4%`
- **Tab:hover** `.cr-mast-tab:not([aria-current])` · measured 55×34 at 1440
  - Box: display `flex`; padding `0px 8px`; radius `8px 8px 0px 0px`
  - Type: `13px/20px` weight `500`
  - Light: text `#111214`; fill `#111214 / 4%`
  - Night: text `#ededef`; fill `#ededef / 4%`
- **Template card:hover** `.tpg-card` · measured 349×409 at 1440
  - Box: display `flex`; radius `16px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#2442a0`; fill `#f6f5f3`; shadow `#e6e4e2 0px 0px 0px 1px, #101828 / 4% 0px 1px 2px 0px, #8d9097 / 35% 0px 0px 0px 1px`
  - Night: text `#a6bef4`; fill `#1b1c1f`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 5% 0px 0px 0px 1px, #000000 / 40% 0px 1px 2px 0px, #000000 / 55% 0px 8px 20px -12px, #94969e / 30% 0px 0px 0px 1px`
- **Agent card:hover** `.ag-card` · measured 355×260 at 1440
  - Box: display `grid`; padding `16px`; gap `12px`; columns `322.656px`; radius `20px`
  - Type: `14px/20px` weight `400`
  - Light: text `#2442a0`; fill `#f6f5f3`; shadow `#e6e4e2 0px 0px 0px 1px, #101828 / 4% 0px 1px 2px 0px, #c3d2fb 0px 0px 0px 1.5px`
  - Night: text `#a6bef4`; fill `#1b1c1f`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 5% 0px 0px 0px 1px, #000000 / 40% 0px 1px 2px 0px, #000000 / 55% 0px 8px 20px -12px, #7ba1fc / 40% 0px 0px 0px 1.5px`
- **List row:hover** `a.op-row` · measured 1088×70 at 1440
  - Box: display `flex`; min-height `48px`; padding `14px 16px`; gap `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#2442a0`; fill `#e9e7e6`
  - Night: text `#a6bef4`; fill `#27282c`
- **Text input:focus** `.cr-input` · measured 632×40 at 1440
  - Box: min-height `40px`; padding `0px 14px`; radius `12px`; overflow `clip`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff, #ffffff), conic-gradient(#101828 / 78%, #101828 / 32% 30%, #101828 / 32% 70%, #101828 / 78%)`; border `1px solid transparent`; shadow `#101828 / 6% 0px 0px 0px 4px, #101828 / 28% 0px 8px 20px -12px`
  - Night: text `#ededef`; background-image `linear-gradient(#232429, #232429), conic-gradient(#ffffff / 85%, #ffffff / 28% 30%, #ffffff / 28% 70%, #ffffff / 85%)`; shadow `#ffffff / 6% 0px 0px 0px 4px, #000000 / 70% 0px 10px 24px -12px`
  - Phone 360: 280×48; min-height `48px`; padding `0px 20px`; radius `999px`; type `16px/20px` weight `400`
- **Sheet** `.up-sheet` · measured 520×876 at 1440
  - Box: display `grid`; position `fixed`; top `12px`; bottom `12px`; columns `520px`; radius `24px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f8f7f6`; shadow `transparent 0px 0px 0px 1px, #101828 / 4% 0px 0px 0px 1px, #101828 / 14% 0px 8px 24px -6px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 11% 0px 0px 0px 1px, #ffffff / 6% 0px 0px 0px 1px, #000000 / 60% 0px 12px 32px -8px`
  - Phone 360: 360×780; columns `360px`
- **Sheet scrim** `.up-scrim` · measured 1440×900 at 1440
  - Box: position `fixed`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 35%`
  - Night: text `#ededef`; fill `#060709 / 62%`
  - Phone 360: 360×780
- **Sheet head** `.up-sheet-head` · measured 520×88 at 1440
  - Box: display `flex`; padding `20px 16px 16px 24px`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; shadow `#e6e4e2 0px -1px 0px 0px inset`
  - Night: text `#ededef`; shadow `#ffffff / 7% 0px -1px 0px 0px inset`
  - Phone 360: 360×72; padding `8px 8px 12px 16px`
- **Sheet title** `.up-sheet-head h2` · measured 436×28 at 1440
  - Type: `20px/28px` weight `600`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 228×28
- **Sheet body** `.up-sheet-body` · measured 520×696 at 1440
  - Box: display `grid`; padding `20px 24px 24px`; gap `16px`; columns `472px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 360×606; padding `16px`; columns `328px`
- **Sheet foot** `.up-sheet-foot` · measured 520×92 at 1440
  - Box: display `grid`; padding `14px 24px 16px`; gap `10px`; columns `472px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f8f7f6`; shadow `#e6e4e2 0px 1px 0px 0px inset`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 7% 0px 1px 0px 0px inset`
  - Phone 360: 360×102; padding `12px 16px`; columns `328px`
- **Destination card** `.up-dest` · measured 472×198 at 1440
  - Box: display `grid`; padding `14px 16px`; gap `14px`; columns `440px`; radius `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#c3d2fb 0px 0px 0px 1.5px inset`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#7ba1fc / 40% 0px 0px 0px 1.5px inset`
  - Phone 360: 328×224; columns `296px`
- **Sheet close** `.up-x` · measured 32×32 at 1440
  - Box: display `grid`; padding `1px 6px`; columns `20px`; radius `50%`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 44×44; columns `32px`
- **Command palette** `.cmdk` · measured 640×560 at 1440
  - Box: display `flex`; radius `12px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f8f7f6`; shadow `transparent 0px 0px 0px 1px, #101828 / 4% 0px 0px 0px 1px, #101828 / 5% 0px 2px 6px 0px, #101828 / 22% 0px 24px 56px -12px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 11% 0px 0px 0px 1px, #ffffff / 6% 0px 0px 0px 1px, #000000 / 30% 0px 2px 6px 0px, #000000 / 70% 0px 28px 64px -16px`
- **Palette input** `.cmdk-input` · measured 539×52 at 1440
  - Box: radius `10px`; overflow `clip`
  - Type: `16px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
- **Toast** `.cr-toast, .lib-toast` · measured 313×38 at 1440
  - Box: display `inline-flex`; padding `9px 14px`; gap `8px`; radius `999px`
  - Type: `13px/20px` weight `500`
  - Light: text `#f4f3f1`; fill `#111214`; shadow `#101828 / 4% 0px 0px 0px 1px, #101828 / 14% 0px 8px 24px -6px`
  - Night: text `#1b1c1f`; fill `#ededef`; shadow `#ffffff / 6% 0px 0px 0px 1px, #000000 / 60% 0px 12px 32px -8px`
  - Phone 360: 313×38
- **Toast wrap** `.lib-toast-wrap` · measured 313×38 at 1440
  - Box: position `fixed`; top `838px`; bottom `24px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 313×38; top `658px`; bottom `84px`

**Notes**
- A focused text box has a transparent 1px border. Its edge is drawn by the conic gradient behind a solid fill, so the bright segment can run around it.
- The keyboard ring is `2px solid var(--av-focus-ring)` at 2px offset on every control (6px radius where the control has none of its own).
- Toasts dismiss themselves after 3.2 seconds; a failure stays 6 seconds. They never take focus.
- Sheets open from the right on desk (520px wide, 24px radius, inset from the screen edge) and full screen on a phone. Escape and the scrim close them; focus returns to what opened them.

## 7. Screens (measured)

Each screen lists its pieces with the values at 1440 (light), what changes at night, and what changes on a 360px phone.

### 7.1 Decisions (home) `/`

Layout: a main column and a right rail at 1440. The next decision is a hero card; the rest wait in a queue below it.

- **Dashboard grid** `.cr-dash` · measured 1088×1979 at 1440
  - Box: display `grid`; gap `24px`; columns `744px 320px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×3057; gap `16px`; columns `328px`
- **Main column** `.cr-dash-main` · measured 744×1979 at 1440
  - Box: display `flex`; gap `24px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×2495
- **Right rail** `.cr-dash-rail` · measured 320×546 at 1440
  - Box: display `flex`; gap `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×546
- **Next decision (hero card)** `.cr-hero` · measured 744×998 at 1440
  - Box: display `flex`; padding `24px`; gap `18px`; radius `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #2442a1 / 25% 0px 0px 0px 1px, #141c34 / 5% 0px 2px 4px 0px, #284cc3 / 38% 0px 28px 60px -30px`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#ffffff / 6% 0px 1px 0px 0px inset, #ffffff / 9% 0px 0px 0px 1px`; no background-image
  - Phone 360: 328×1230
- **Hero top line** `.cr-hero-top` · measured 696×24 at 1440
  - Box: display `flex`; gap `10px`
  - Type: `12px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 280×52; gap `6px 10px`
- **Hero kind label** `.cr-hero-k` · measured 59×20 at 1440
  - Box: display `flex`; gap `8px`
  - Type: `12px/20px` weight `500`
  - Light: text `#284cc3`
  - Night: text `#97b3f4`
  - Phone 360: 59×20
- **Hero title** `.cr-hero-title` · measured 696×28 at 1440
  - Box: max-width `800.43px`
  - Type: `20px/28px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 280×56
- **Hero why line** `.cr-hero-why` · measured 696×20 at 1440
  - Box: margin `4px 0px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 280×40
- **Hero two-column grid** `.cr-hero-grid` · measured 696×369 at 1440
  - Box: display `grid`; padding `18px 0px 0px`; gap `24px`; columns `696px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; border-top `1px solid #e6e4e2`
  - Night: text `#ededef`; border-top `1px solid #ffffff / 7%`
  - Phone 360: 280×407; columns `280px`
- **Hero column label** `.cr-hero-label` · measured 696×16 at 1440
  - Box: margin `0px 0px 6px`
  - Type: `12px/16px` weight `500`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 280×16
- **Evidence item** `.cr-evl-item` · measured 696×51 at 1440
  - Box: display `grid`; gap `4px`; columns `696px`
  - Type: `13px/19px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 280×51; columns `280px`
- **Proof chip** `.cr-proof-chip` · measured 82×28 at 1440
  - Box: min-height `28px`; padding `0px 8px`; radius `999px`
  - Type: `12px/12px` weight `500`
  - Light: text `#111214`; shadow `#dddcda 0px 0px 0px 1px inset`
  - Night: text `#ededef`; shadow `#ffffff / 13% 0px 0px 0px 1px inset`
  - Phone 360: 86×28; padding `0px 10px`
- **Reason field frame** `.cr-why-field` · measured 696×44 at 1440
  - Box: display `flex`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#fbfaf9`; shadow `#101828 / 13% 0px 0px 0px 1.5px inset`
  - Night: text `#ededef`; fill `#1f2024`; shadow `#ffffff / 12% 0px 0px 0px 1.5px inset`
  - Phone 360: 280×44; radius `24px`
- **Reason input** `.cr-why-input` · measured 696×44 at 1440
  - Box: min-height `44px`; padding `14px 16px 6px`; radius `10px`
  - Type: `14px/23px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 280×44; type `16px/23px` weight `400`
- **Hero foot (answer bar)** `.cr-hero-foot` · measured 736×65 at 1440
  - Box: display `flex`; position `sticky`; padding `12px 20px`; margin `0px -20px`; gap `8px`; radius `0px 0px 14px 14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; border-top `1px solid #e6e4e2`
  - Night: text `#ededef`; fill `#1b1c1f`; border-top `1px solid #ffffff / 7%`; no background-image
  - Phone 360: not shown
- **Approve button** `.cr-hero-approve` · measured 204×40 at 1440
  - Box: display `flex`; padding `0px 18px`; gap `6px`; radius `10px`
  - Type: `14px/14px` weight `500`
  - Light: text `#2d53ca`; fill `#e6eaf3`; background-image `linear-gradient(110deg, transparent 38%, #ffffff / 70% 50%, transparent 62%)`; shadow `#6a7eae 0px 0px 0px 1px inset, #101828 / 5% 0px 1px 2px 0px`
  - Night: text `#b3c9ff`; fill `#2a2f3c`; background-image `linear-gradient(110deg, transparent 38%, #ffffff / 12% 50%, transparent 62%)`; shadow `#71809f 0px 0px 0px 1px inset, #7ba1fc / 55% 0px 8px 22px -12px`
  - Phone 360: not shown
- **What this sends** `.cr-dc-sends` · measured 696×24 at 1440
  - Box: margin `12px 0px 0px`
  - Type: `12px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 280×24
- **Section head** `.cr-sect-head` · measured 744×21 at 1440
  - Box: display `flex`; gap `8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×21
- **Section title** `.cr-sect-title` · measured 82×20 at 1440
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 82×20
- **Section count** `.cr-sect-count` · measured 28×20 at 1440
  - Box: display `grid`; padding `0px 6px`; columns `15.5625px`; radius `10px`
  - Type: `12px/20px` weight `500`
  - Light: text `#59595f`; fill `#101828 / 6%`
  - Night: text `#a5a6ad`; fill `#ffffff / 7%`
  - Phone 360: 28×20
- **Queue card** `.cr-dq` · measured 744×924 at 1440
  - Box: radius `14px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×1208
- **Queue row** `.cr-dq-row` · measured 744×64 at 1440
  - Box: display `grid`; min-height `64px`; padding `10px 20px`; gap `14px`; columns `8px 560px 0px 64px 16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×80; padding `10px 16px`; columns `8px 166px 64px 16px`
- **Queue title** `.cr-dq-title` · measured 560×20 at 1440
  - Box: display `flow-root`; overflow `hidden`
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 166×40
- **Queue meta** `.cr-dq-meta` · measured 560×18 at 1440
  - Type: `12px/18px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 166×18
- **Rail panel** `.cr-panel` · measured 320×390 at 1440
  - Box: radius `14px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×390
- **Panel head** `.cr-panel-head` · measured 320×52 at 1440
  - Box: display `flex`; min-height `52px`; padding `0px 20px`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; border-bottom `1px solid #e6e4e2`
  - Night: text `#ededef`; border-bottom `1px solid #ffffff / 7%`
  - Phone 360: 328×52; padding `0px 16px`
- **Panel title** `.cr-panel-title` · measured 97×20 at 1440
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 97×20
- **Panel meta** `.cr-panel-meta` · measured 7×20 at 1440
  - Type: `12px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 7×20
- **Done row** `.cr-done-row` · measured 320×118 at 1440
  - Box: display `grid`; padding `12px 20px`; gap `10px`; columns `84.9219px 175.078px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×118; padding `12px 16px`; columns `84.9219px 191.078px 0px`
- **Mini row** `.cr-mini-row` · measured 320×44 at 1440
  - Box: display `flex`; min-height `44px`; padding `0px 20px`; gap `12px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×44; padding `0px 16px`
- **Day progress bar** `.cr-dmline-bar` · measured 218×6 at 1440
  - Box: display `grid`; gap `3px`; columns `10px 10px 10px 10px 10px 10px 10px 10px 10px 10px 10px 10px 10px 10px 10px 10px 10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 286×6; columns `14px 14px 14px 14px 14px 14px 14px 14px 14px 14px 14px 14px 14px 14px 14px 14px 14px`
- **Phone pinned answer bar** `.cr-pin` · measured 340×144 at 360
  - Box: display `flex`; position `fixed`; top `554px`; bottom `82px`; padding `12px 14px`; gap `8px`; radius `20px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f8f7f6 / 86%`; shadow `#ffffff / 70% 0px 1px 0px 0px inset, #141c34 / 8% 0px 0px 0px 1px, #141c34 / 38% 0px 16px 36px -16px`; backdrop-filter `blur(16px) saturate(1.4)`
  - Night: text `#ededef`; fill `#1c1d22 / 86%`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 8% 0px 0px 0px 1px, #000000 / 85% 0px 20px 44px -16px`

**Polish to keep**
- The hero carries the slow edge light while it waits on you. Its answer bar sticks to the bottom of the screen on a laptop and uses the card's own surface.
- The reason field shows only when the choice needs one.
- "What this sends" sits under the answer, so you see exactly what approving does.
- Queue titles wrap to two lines on a laptop; one line with an ellipsis on a phone.
- On a phone the answer bar is pinned above the dock and can be tucked away.
- An empty factory shows the welcome (section 4.16), not "Nothing needs you".

### 7.2 All projects `/missions`

- **Filter bar** `.fb` · measured 1088×116 at 1440
  - Box: display `flex`; gap `8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×128
- **Filter search** `.fb-search` · measured 1088×40 at 1440
  - Box: display `flex`; padding `0px 8px 0px 12px`; gap `8px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`; fill `#fbfaf9`; shadow `#101828 / 13% 0px 0px 0px 1.5px inset`
  - Night: text `#a5a6ad`; fill `#1f2024`; shadow `#ffffff / 12% 0px 0px 0px 1.5px inset`
  - Phone 360: 328×44; min-height `44px`; padding `0px 16px`; radius `999px`
- **Facet button** `.fb-btn` · measured 62×36 at 1440
  - Box: display `inline-flex`; padding `0px 10px 0px 12px`; gap `6px`; radius `8px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#8d9097 / 35% 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#94969e / 30% 0px 0px 0px 1px inset`
  - Phone 360: 82×44; display `flex`; padding `0px 12px 0px 10px`
- **Sort button** `.fb-sort` · measured 170×36 at 1440
  - Box: margin `0px 0px 0px 762.219px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 137×44; margin `0px 0px 0px 100.359px`
- **Total** `.fb-total` · measured 62×20 at 1440
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 62×20
- **List card** `.op-list` · measured 1088×504 at 1440
  - Box: padding `4px 0px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×970
- **Row** `.op-row` · measured 1088×70 at 1440
  - Box: display `flex`; min-height `48px`; padding `14px 16px`; gap `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×164; padding `14px 12px`; gap `8px 12px`
- **Row main** `.op-row-main` · measured 472×42 at 1440
  - Box: display `grid`; gap `2px`; columns `472.234px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 304×42; columns `304px`
- **Row sub text** `.op-sub` · measured 472×20 at 1440
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 304×20
- **Phase bar** `.ph` · measured 200×24 at 1440
  - Box: display `grid`; gap `4px`; columns `200px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 304×24; columns `304px`
- **Phase segment** `.ph-track i` · measured 38×4 at 1440
  - Box: radius `999px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#284cc3`
  - Night: text `#ededef`; fill `#97b3f4`
  - Phone 360: 58×4
- **Phase label** `.ph-label` · measured 200×16 at 1440
  - Box: display `flex`; gap `6px`; overflow `hidden`
  - Type: `12px/16px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 304×16
- **Row side** `.op-row-side` · measured 352×22 at 1440
  - Box: display `flex`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 304×54
- **Needs-you note** `.op-needs` · measured 71×20 at 1440
  - Type: `13px/20px` weight `500`
  - Light: text `#284cc3`
  - Night: text `#97b3f4`
  - Phone 360: 71×20

**Polish to keep**
- One row per project: name and client on the left, the phase bar (200px wide), then the state tag and what's waiting on you.
- On a phone the phase bar drops to its own full-width line under the name.
- Row hover is the neutral wash.

### 7.3 A project `/missions/:id`

- **Masthead title row** `.cr-mast-titlerow` · measured 874×36 at 1440
  - Box: display `flex`; gap `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×28
- **Masthead side** `.cr-mast-side` · measured 198×32 at 1440
  - Box: display `flex`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×44; margin `12px 0px 0px`
- **Watch button** `.cr-watch-btn` · measured 158×32 at 1440
  - Box: display `flex`; padding `0px 12px`; gap `6px`; radius `10px`
  - Type: `13px/13px` weight `500`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff, #fafaf9)`; shadow `#dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 9% 0px 0px 0px 1px`; no background-image
  - Phone 360: 158×44; min-height `44px`
- **Menu button** `.cr-ctl-btn` · measured 32×32 at 1440
  - Box: display `flex`; gap `6px`; radius `10px`
  - Type: `13px/13px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 44×44; min-height `44px`
- **Gate strip** `.cr-gates` · measured 1088×28 at 1440
  - Box: display `flex`; margin `14px 0px 0px`; gap `8px 16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×50; margin `12px 0px 0px`; gap `6px`
- **Gate** `.cr-gate` · measured 123×28 at 1440
  - Box: display `grid`; padding `2px 0px 0px`; gap `6px`; columns `123.328px`; radius `4px`
  - Type: `12px/20px` weight `500`
  - Light: text `#18744d`
  - Night: text `#78d6a8`
  - Phone 360: 52×28; columns `52.1562px`
- **Gate number** `.cr-gate-n` · measured 7×16 at 1440
  - Type: `12px/16px` weight `500` mono (IBM Plex Mono)
  - Light: text `#18744d`
  - Night: text `#78d6a8`
  - Phone 360: 7×16
- **Gate name** `.cr-gate-name` · measured 36×16 at 1440
  - Box: overflow `hidden`
  - Type: `12px/16px` weight `500`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: not shown
- **Gate bar** `.cr-gate-bar` · measured 123×4 at 1440
  - Box: radius `2px`; overflow `hidden`
  - Type: `12px/20px` weight `500`
  - Light: text `#18744d`; fill `#8d9097 / 35%`
  - Night: text `#78d6a8`; fill `#94969e / 30%`
  - Phone 360: 52×4
- **Tabs strip** `.cr-mast-tabs` · measured 1096×34 at 1440
  - Box: display `flex`; margin `14px 0px 0px -8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 360×40; padding `0px 12px`; margin `14px -16px 0px`
- **Tab** `.cr-mast-tab:not([aria-current])` · measured 55×34 at 1440
  - Box: display `flex`; padding `0px 8px`; radius `8px 8px 0px 0px`
  - Type: `13px/20px` weight `500`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 57×40; padding `0px 9px`
- **Tab (current)** `.cr-mast-tab[aria-current=page]` · measured 47×34 at 1440
  - Box: display `flex`; padding `0px 8px`; radius `8px 8px 0px 0px`
  - Type: `13px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 49×40; padding `0px 9px`
- **Breadcrumb** `.lib-crumbs` · measured 246×28 at 1440
  - Box: display `flex`; gap `4px`
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: not shown
- **Crumb link** `.lib-crumb` · measured 62×28 at 1440
  - Box: max-width `100%`; padding `4px 6px`; margin `0px -2px 0px -6px`; radius `6px`; overflow `hidden`
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: not shown
- **Next-up strip** `.cr-next` · measured 1088×46 at 1440
  - Box: display `flex`; padding `10px 14px`; gap `8px 12px`; radius `14px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 4%`; shadow `#101828 / 5% 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#ffffff / 3%`; shadow `#ffffff / 6% 0px 0px 0px 1px inset`
  - Phone 360: 328×74
- **Next-up item** `.cr-next-item` · measured 80×26 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `4px`; radius `999px`
  - Type: `12px/20px` weight `400`
  - Light: text `#111214`; fill `#f8f7f6`; shadow `#dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 10% 0px 0px 0px 1px, #000000 / 35% 0px 1px 2px 0px`
  - Phone 360: 80×26
- **Module table row** `.cr-mt-row` · measured 744×34 at 1440
  - Box: display `grid`; min-height `34px`; padding `8px 20px`; gap `12px`; columns `170px 150px 150px 96px 92px`
  - Type: `13px/20px` weight `500`
  - Light: text `#59595f`; fill `#101828 / 4%`
  - Night: text `#a5a6ad`; fill `#ffffff / 3%`
  - Phone 360: 328×105; min-height `52px`; padding `12px 16px`; gap `8px 12px`; type `13px/20px` weight `400`
- **Module name** `.cr-mt-name` · measured 170×40 at 1440
  - Box: display `flex`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 170×40
- **Retry ladder** `.cr-ladder` · measured 150×40 at 1440
  - Box: display `flex`; gap `4px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 170×24
- **Bar track** `.cr-bar-track` · measured 52×6 at 1440
  - Box: radius `3px`; overflow `hidden`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 6%`
  - Night: text `#ededef`; fill `#ffffff / 6%`
  - Phone 360: 296×0; type `14px/20px` weight `400`
- **Commit graph** `.cg` · measured 744×672 at 1440
  - Box: radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×698
- **Graph row** `.cg-row` · measured 720×44 at 1440
  - Box: display `list-item`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 316×44
- **Graph title** `.cg-title` · measured 138×20 at 1440
  - Box: overflow `hidden`
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 184×20
- **Graph tag** `.cg-tag` · measured 131×22 at 1440
  - Box: display `flex`; max-width `260px`; padding `0px 8px`; radius `6px`; overflow `hidden`
  - Type: `12px/20px` weight `500` mono (IBM Plex Mono)
  - Light: text `#6232d6`; fill `#eeebff`
  - Night: text `#b9a3ff`; fill `#2c2a37`
  - Phone 360: not shown
- **Trail node** `.tn` · measured 20×20 at 1440
  - Box: display `inline-grid`; gap `16px`; columns `20px`; radius `50%`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`; fill `#ffffff`
  - Night: text `#a5a6ad`; fill `#1b1c1f`
  - Phone 360: 20×20
- **Big percent** `.cr-big-pct` · measured 280×28 at 1440
  - Box: display `flex`; gap `8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 296×28
- **Activity row time** `.cr-act-when` · measured 100×72 at 1440
  - Type: `12px/18px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 100×72
- **Activity row text** `.cr-act-main` · measured 170×72 at 1440
  - Type: `13px/18px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 186×72

**Polish to keep**
- "Watch the work" and the menu stay on the title's row. The gate strip gets the full width under it.
- Tabs are links with an underline on the current one only.
- The current gate's rail carries the conveyor light; passed gates glow faintly green.
- On a phone the gate names drop and the six gates fit one line.

### 7.4 A module `/missions/:id/modules/:ref`

- **Page grid** `.mdp` · measured 1088×1674 at 1440
  - Box: display `grid`; gap `16px`; columns `1088px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×2912; columns `328px`
- **Hero** `.mdp-hero` · measured 1088×120 at 1440
  - Box: display `grid`; padding `20px`; gap `16px`; columns `56px 705.969px 254.031px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×266; padding `16px`; columns `44px 236px`
- **Tile** `.mdp-tile` · measured 56×56 at 1440
  - Box: display `grid`; columns `56px`; radius `14px`
  - Type: `20px/20px` weight `500` mono (IBM Plex Mono)
  - Light: text `#111214`; fill `#101828 / 4%`; shadow `#8d9097 / 35% 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#ffffff / 3%`; shadow `#94969e / 30% 0px 0px 0px 1px inset`
  - Phone 360: 44×44; columns `44px`; radius `12px`; type `16px/20px` weight `500` mono (IBM Plex Mono)
- **Row grid** `.mdp-row` · measured 1088×254 at 1440
  - Box: display `grid`; gap `16px`; columns `643.188px 428.797px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×422; columns `328px`
- **Card** `.mdp-card` · measured 643×154 at 1440
  - Box: display `grid`; padding `16px 18px`; gap `12px`; columns `607.188px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×152; columns `292px`
- **Ladder node** `.mdp-node` · measured 24×24 at 1440
  - Box: display `grid`; margin `0px 0px 6px`; columns `24px`; radius `50%`
  - Type: `14px/20px` weight `400`
  - Light: text `#b8352b`; fill `#fdeeee`; shadow `#f3c9c6 0px 0px 0px 1.5px inset`
  - Night: text `#f6a097`; fill `#ec6a5e / 13%`; shadow `#ec6a5e / 30% 0px 0px 0px 1.5px inset`
  - Phone 360: 24×24
- **Big number** `.mdp-big` · measured 393×32 at 1440
  - Box: display `flex`; gap `6px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 292×32
- **Meter** `.mdp-meter` · measured 393×8 at 1440
  - Box: radius `4px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#8d9097 / 35%`
  - Night: text `#ededef`; fill `#94969e / 30%`
  - Phone 360: 292×8
- **Now card** `.mdp-now` · measured 1088×315 at 1440
  - Box: display `grid`; columns `1088px`; radius `14px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×451; columns `328px`
- **Live feed** `.mdp-feed` · measured 1088×204 at 1440
  - Box: padding `10px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 6%`
  - Night: text `#ededef`; fill `#ffffff / 6%`; background-image `repeating-linear-gradient(0deg, #ffffff / 2% 0px, #ffffff / 2% 1px, transparent 1px, transparent 3px)`
  - Phone 360: 328×260
- **Feed line** `.mdp-feed-x` · measured 972×20 at 1440
  - Type: `13px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 232×36; type `12px/18px` weight `400` mono (IBM Plex Mono)
- **Typing cursor** `.tt-cursor` · measured 8×16 at 1440
  - Box: margin `0px 0px 0px 2px`; radius `1px`
  - Type: `13px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#111214`; fill `#4a76f0`; shadow `#4a76f0 / 60% 0px 0px 8px 0px`
  - Night: text `#ededef`; fill `#7ba1fc`; shadow `#7ba1fc / 60% 0px 0px 8px 0px`
  - Phone 360: 8×16; type `12px/18px` weight `400` mono (IBM Plex Mono)
- **Inputs section** `.up-inputs` · measured 1088×319 at 1440
  - Box: display `grid`; padding `20px`; gap `16px`; columns `1048px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×417; padding `16px`; columns `296px`
- **Input row** `.up-inlist li` · measured 1048×74 at 1440
  - Box: display `grid`; padding `0px 0px 12px`; gap `12px`; columns `36px 922.828px 65.1719px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 296×130; columns `32px 252px`
- **Trail** `.tr` · measured 772×602 at 1440
  - Box: radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×854
- **Trail row** `.tr-row` · measured 732×40 at 1440
  - Box: display `flow-root`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 296×44
- **Trail label** `.tr-label` · measured 594×20 at 1440
  - Box: display `flex`; gap `6px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214 / 64%`
  - Night: text `#ededef / 64%`
  - Phone 360: 158×40
- **Trail ask box** `.tr-ask` · measured 664×82 at 1440
  - Box: padding `12px 14px`; margin `2px 0px 8px 68px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f2f6ff`; shadow `#3a64e4 / 28% 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#1d2129`; shadow `#3f69e2 / 40% 0px 0px 0px 1px inset`
  - Phone 360: 260×170; margin `2px 0px 8px 36px`
- **Side column** `.mdp-side` · measured 300×422 at 1440
  - Box: display `grid`; gap `16px`; columns `300px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×422; columns `328px`

**Polish to keep**
- The live feed types each line in and ends with the cobalt block cursor.
- The reading-list meter turns amber past 80% and says "Over budget: Gate 1 will flag it" past 100%.
- The step waiting on you opens inline in the trail with its ask and Approve.

### 7.5 Canon onboarding `/missions/:id/onboarding`

- **Steps strip** `.cv-steps` · measured 1344×67 at 1440
  - Box: display `grid`; gap `8px`; columns `1344px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×63; columns `328px`
- **Step dot** `.cv-step-dot` · measured 18×18 at 1440
  - Box: display `grid`; margin `1px 0px 0px`; columns `18px`; radius `50%`
  - Type: `14px/20px` weight `400`
  - Light: text `#ffffff`; fill `#1f9d63`
  - Night: fill `#3cbf82`
  - Phone 360: 18×18
- **Columns** `.cv-cols` · measured 1344×1613 at 1440
  - Box: display `grid`; gap `16px`; columns `553.328px 774.656px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×660; columns `328px`
- **Chat card** `.cv-chat` · measured 553×868 at 1440
  - Box: display `flex`; position `sticky`; top `16px`; min-height `560px`; radius `14px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×660; min-height `520px`
- **Chat head** `.cv-chat-head` · measured 553×91 at 1440
  - Box: display `flex`; padding `12px 16px`; gap `6px 8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; border-bottom `1px solid #e6e4e2`
  - Night: text `#ededef`; border-bottom `1px solid #ffffff / 7%`
  - Phone 360: 328×91
- **Presence pill** `.cv-presence` · measured 233×32 at 1440
  - Box: display `flex`; padding `0px 12px 0px 6px`; margin `0px 12px 0px 197.812px`; gap `8px`; radius `999px`
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`; fill `#111214 / 5%`
  - Night: text `#a5a6ad`; fill `#ededef / 5%`
  - Phone 360: 296×32; max-width `100%`
- **Messages** `.cv-msgs` · measured 553×394 at 1440
  - Box: display `flex`; min-height `220px`; padding `12px 16px`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×140
- **Message** `.cv-msg` · measured 480×96 at 1440
  - Box: display `grid`; max-width `92%`; gap `4px`; columns `479.609px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 272×136; columns `272.312px`
- **Message who** `.cv-who` · measured 480×16 at 1440
  - Box: display `flex`; gap `6px`
  - Type: `12px/16px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 272×16
- **Message text** `.cv-text` · measured 480×76 at 1440
  - Box: padding `8px 12px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 4%`
  - Night: text `#ededef`; fill `#ffffff / 3%`
  - Phone 360: 272×116
- **Question dock** `.cd` · measured 537×375 at 1440
  - Box: display `grid`; padding `8px`; margin `0px 8px 8px`; gap `8px`; columns `521.328px`; radius `20px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 4%`; shadow `#000000 / 6% 0px 1px 2px 0px inset`
  - Night: text `#ededef`; fill `#ffffff / 3%`
  - Phone 360: 316×423; padding `6px`; margin `0px 6px 6px`; columns `304px`; radius `22px`
- **Question card** `.cd-card` · measured 521×347 at 1440
  - Box: display `grid`; padding `12px`; gap `8px`; columns `497.328px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#3a64e4 / 28% 0px 0px 0px 1px, #000000 / 5% 0px 1px 2px 0px, #000000 / 16% 0px 8px 20px -10px`
  - Night: text `#ededef`; fill `#212226`; shadow `#3f69e2 / 40% 0px 0px 0px 1px, #000000 / 5% 0px 1px 2px 0px, #000000 / 16% 0px 8px 20px -10px`
  - Phone 360: 304×399; padding `12px 12px 10px`; gap `6px`; columns `301.797px`; radius `16px`
- **Question text** `.cd-q` · measured 497×24 at 1440
  - Type: `16px/24px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 302×48
- **Option** `.cd-opt` · measured 497×79 at 1440
  - Box: display `flex`; padding `10px 12px 10px 10px`; gap `10px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#284cc3 0px 0px 0px 1.5px inset`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#97b3f4 0px 0px 0px 1.5px inset`
  - Phone 360: 302×75; min-height `48px`; padding `8px 12px`
- **Option number** `.cd-n` · measured 20×20 at 1440
  - Box: display `grid`; columns `20px`; radius `6px`
  - Type: `12px/12px` weight `500` mono (IBM Plex Mono)
  - Light: text `#284cc3`; fill `#edf2ff`
  - Night: text `#97b3f4`; fill `#7ba1fc / 12%`
  - Phone 360: not shown
- **Recommended tag** `.cd-rec-tag` · measured 85×15 at 1440
  - Box: margin `0px 0px 0px 8px`
  - Type: `12px/20px` weight `400`
  - Light: text `#284cc3`
  - Night: text `#97b3f4`
  - Phone 360: 85×15
- **Doc card** `.cv-doc` · measured 775×1613 at 1440
  - Box: display `grid`; padding `16px 20px`; gap `16px`; columns `734.656px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: not shown
- **Doc head** `.cv-doc-head` · measured 735×52 at 1440
  - Box: display `flex`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: not shown
- **Margin note** `.cd-margin` · measured 248×142 at 1440
  - Box: display `grid`; padding `8px 10px`; gap `6px`; columns `228px`; radius `10px`
  - Type: `13px/18px` weight `400`
  - Light: text `#111214`; fill `#edf2ff / 45%`; shadow `#c3d2fb 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#7ba1fc / 5%`; shadow `#7ba1fc / 40% 0px 0px 0px 1px inset`
  - Phone 360: not shown
- **Approve bar** `.cv-act` · measured 751×126 at 1440
  - Box: display `grid`; position `sticky`; padding `12px`; margin `0px -8px -4px`; gap `10px`; columns `726.656px`; radius `12px 12px 14px 14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `transparent 0px 0px 0px 1px, #101828 / 4% 0px 0px 0px 1px, #101828 / 14% 0px 8px 24px -6px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 11% 0px 0px 0px 1px, #ffffff / 6% 0px 0px 0px 1px, #000000 / 60% 0px 12px 32px -8px`
  - Phone 360: 0×0; bottom `8px`; radius `12px`

**Polish to keep**
- The interview column is pinned and runs the screen's height; the checkpoint document scrolls beside it.
- Options are numbered, the recommended one tagged.
- The approve bar sits flush on the document card's bottom edge.
- On a phone the interview is the page and the document opens from it.

### 7.6 Release `/missions/:id/release`

- **Grid** `.op-release` · measured 1088×1100 at 1440
  - Box: display `grid`; padding `0px 0px 96px`; gap `16px`; columns `536px 536px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×1707; max-width `640px`; padding `0px 0px 160px`; columns `328px`
- **Receipt summary card** `.op-receipt` · measured 536×725 at 1440
  - Box: display `grid`; padding `20px`; gap `12px`; columns `496px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×877; columns `288px`
- **Stamp** `.op-stamp` · measured 58×30 at 1440
  - Box: padding `4px 12px`; radius `6px`
  - Type: `14px/20px` weight `500`
  - Light: text `#284cc3`; fill `#3a64e4 / 7%`; border `1px solid #3a64e4 / 28%`
  - Night: text `#97b3f4`; fill `#3f69e2 / 14%`; border `1px solid #3f69e2 / 40%`
  - Phone 360: 58×30
- **Release bar** `.op-release-bar` · measured 536×247 at 1440
  - Box: display `grid`; position `sticky`; bottom `16px`; padding `16px`; gap `12px`; columns `504px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f8f7f6`; shadow `transparent 0px 0px 0px 1px, #101828 / 4% 0px 0px 0px 1px, #101828 / 14% 0px 8px 24px -6px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 11% 0px 0px 0px 1px, #ffffff / 6% 0px 0px 0px 1px, #000000 / 60% 0px 12px 32px -8px`
  - Phone 360: 336×288; position `fixed`; top `415px`; bottom `77px`; columns `304px`
- **Pass reason input** `.op-pass-input` · measured 504×42 at 1440
  - Box: min-height `40px`; padding `0px 14px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#fbfaf9, #fbfaf9), linear-gradient(#101828 / 13%, #101828 / 13%)`; border `1px solid transparent`
  - Night: text `#ededef`; background-image `linear-gradient(#1f2024, #1f2024), linear-gradient(#ffffff / 12%, #ffffff / 12%)`
  - Phone 360: 304×48; min-height `48px`; padding `0px 20px`; radius `999px`; type `16px/20px` weight `400`

**Polish to keep**
- At 1240px and up the receipt and "What ships" sit side by side; below that they stack.
- A pending pass is accepted in the release bar with its reason, then Release.

### 7.7 Receipt `/missions/:id/receipt`

- **Grid** `.rcp-grid` · measured 1088×1467 at 1440
  - Box: display `grid`; gap `40px`; columns `460px 588px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×2511; columns `328px`
- **Paper** `.rcp-paper` · measured 460×1467 at 1440
  - Box: padding `36px 28px 40px`
  - Type: `13px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#111214`; fill `#fbfaf6`
  - Night: text `#ededef`; fill `#222326`
  - Phone 360: 328×1549; padding `32px 18px 36px`; type `12px/18px` weight `400` mono (IBM Plex Mono)
- **Paper title** `.rcp-title` · measured 164×29 at 1440
  - Box: margin `6px 0px 0px`
  - Type: `20px/28px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 164×29
- **Section** `.rcp-sec` · measured 404×147 at 1440
  - Box: padding `14px 0px`
  - Type: `13px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#111214`; border-top `1px dashed #111214 / 22%`
  - Night: text `#ededef`; border-top `1px dashed #ededef / 26%`
  - Phone 360: 292×139; type `12px/18px` weight `400` mono (IBM Plex Mono)
- **Row** `.rcp-row` · measured 416×24 at 1440
  - Box: display `flex`; padding `1px 6px`; margin `0px -6px`; gap `8px`; radius `4px`
  - Type: `13px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 304×22; type `12px/18px` weight `400` mono (IBM Plex Mono)
- **Check card** `.rcp-check` · measured 588×774 at 1440
  - Box: display `grid`; position `sticky`; top `16px`; padding `20px`; gap `16px`; columns `548px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×922; padding `16px`; columns `296px`
- **Check step** `.rcp-step-main` · measured 504×37 at 1440
  - Box: display `grid`; gap `1px`; columns `504px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 252×37; columns `252px`
- **File chip** `.rcp-file` · measured 280×78 at 1440
  - Box: display `grid`; padding `10px 12px`; gap `2px`; columns `256px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 4%`; shadow `#8d9097 / 35% 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#ffffff / 3%`; shadow `#94969e / 30% 0px 0px 0px 1px inset`
  - Phone 360: 180×114; columns `156px`
- **Code block** `.cb` · measured 792×232 at 1440
  - Box: radius `12px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 6%`; shadow `#e6e4e2 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#ffffff / 6%`; shadow `#ffffff / 7% 0px 0px 0px 1px inset`
  - Phone 360: 328×250
- **Code head** `.cb-head` · measured 792×36 at 1440
  - Box: display `flex`; min-height `36px`; padding `0px 4px 0px 12px`; gap `8px`
  - Type: `12px/16px` weight `400`
  - Light: text `#59595f`; fill `#d6d6d7 / 34%`; shadow `#e6e4e2 0px -1px 0px 0px inset`
  - Night: text `#a5a6ad`; fill `#38393d / 34%`; shadow `#ffffff / 7% 0px -1px 0px 0px inset`
  - Phone 360: 328×36
- **Code pre** `.cb-pre` · measured 792×164 at 1440
  - Box: padding `12px 0px`
  - Type: `13px/20px` weight `400` mono (IBM Plex Mono)
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×150; type `12px/18px` weight `400` mono (IBM Plex Mono)

**Polish to keep**
- The paper has a torn edge (a CSS mask) and prints section by section when the page opens.
- Inputs has a "Your view / Public view" switch. The public view shows the count and hashes only.

### 7.8 Live `/live`

- **Live head** `.cr-lvtop` · measured 1088×56 at 1440
  - Box: display `flex`; min-height `56px`; padding `0px 325px 0px 0px`; margin `-81px 0px 0px`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×108; gap `4px 12px`
- **Live title** `.cr-lvtop-title` · measured 38×28 at 1440
  - Box: display `flex`; gap `0px 8px`; radius `6px`
  - Type: `20px/28px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 30×28; type `16px/28px` weight `500`
- **Grid** `.cr-live` · measured 1088×769 at 1440
  - Box: display `grid`; gap `16px`; columns `712px 360px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×1494; columns `328px`
- **Room card** `.cr-wroom` · measured 712×497 at 1440
  - Box: display `grid`; padding `16px`; gap `14px`; columns `680px`; radius `14px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#ffffff / 90% 0px 1px 0px 0px inset, #101828 / 8% 0px 0px 0px 1px, #101828 / 4% 0px 1px 2px 0px, #101828 / 22% 0px 12px 28px -18px`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#ffffff / 6% 0px 1px 0px 0px inset, #ffffff / 7% 0px 0px 0px 1px, transparent 0px 0px 0px 0px`
  - Phone 360: 336×434; columns `304px`
- **Terminal** `.cr-cli` · measured 680×353 at 1440
  - Box: display `flex`; radius `10px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#0f1012`; shadow `#101828 / 20% 0px 0px 0px 1px`
  - Night: text `#ededef`; shadow `#ffffff / 6% 0px 0px 0px 1px`
  - Phone 360: 304×258
- **Terminal bar** `.cr-cli-bar` · measured 680×29 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#18191c`; border-bottom `1px solid #ffffff / 6%`
  - Night: text `#ededef`
  - Phone 360: 304×29
- **Terminal line** `.cr-cli-line` · measured 656×19 at 1440
  - Box: padding `0px 0px 0px 14.4001px`
  - Type: `12px/19px` weight `400` mono (IBM Plex Mono)
  - Light: text `#d7d8dc`
  - Phone 360: 280×38
- **Gauge** `.cr-gauge` · measured 558×32 at 1440
  - Box: display `grid`; gap `6px normal`; columns `497.906px 59.6719px`
  - Type: `12px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 166×44; columns `105.906px 59.6719px`
- **Free slot** `.cr-free-slot` · measured 24×24 at 1440
  - Box: display `grid`; columns `24px`; radius `6px`
  - Type: `12px/12px` weight `500` mono (IBM Plex Mono)
  - Light: text `#59595f`; shadow `#dddcda 0px 0px 0px 1px inset`
  - Night: text `#a5a6ad`; shadow `#ffffff / 13% 0px 0px 0px 1px inset`
  - Phone 360: 28×28; columns `28px`
- **River panel** `.cr-river-panel` · measured 360×744 at 1440
  - Box: display `flex`; radius `14px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×748
- **River filters** `.cr-river-filters` · measured 360×88 at 1440
  - Box: display `flex`; padding `4px 20px 16px`; gap `8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; shadow `#e6e4e2 0px -1px 0px 0px inset`
  - Night: text `#ededef`; shadow `#ffffff / 7% 0px -1px 0px 0px inset`
  - Phone 360: 328×116; padding `4px 16px 16px`
- **Chip** `.av-chip` · measured 92×30 at 1440
  - Box: display `flex`; padding `0px 11px`; gap `6px`; radius `999px`
  - Type: `13px/20px` weight `500`
  - Light: text `#111214`; fill `#f8f7f6`; shadow `#8d9097 / 35% 0px 0px 0px 1px inset, #dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#27282c`; shadow `#94969e / 30% 0px 0px 0px 1px inset, #ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 7% 0px 0px 0px 1px, #000000 / 35% 0px 1px 2px 0px`
  - Phone 360: 92×44; min-height `44px`
- **Event row** `.cr-ev` · measured 360×68 at 1440
  - Box: display `grid`; min-height `40px`; padding `8px 20px`; gap `10px`; columns `60px 8px 232px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×68; padding `8px 16px`; columns `60px 8px 208px`
- **Event time** `.cr-ev-t` · measured 60×20 at 1440
  - Type: `12px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 60×20
- **Event text** `.cr-ev-text` · measured 232×52 at 1440
  - Box: display `flex`; min-height `24px`; padding `8px 0px`; overflow `hidden`
  - Type: `13px/18px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 208×52
- **Day heading** `.cr-ev-day` · measured 360×34 at 1440
  - Box: display `list-item`; position `sticky`; padding `8px 20px 6px`
  - Type: `12px/20px` weight `500`
  - Light: text `#59595f`; fill `#f6f5f3`
  - Night: text `#a5a6ad`; fill `#1b1c1f`
  - Phone 360: 328×34; padding `8px 16px 6px`

**Polish to keep**
- Event times never wrap. The newest event glows once.
- A building room has the thin scan line and moving stripes on its time bar. A parked room is still with a red edge.

### 7.9 A project's crew `/missions/:id/live`

- **Crew card wrap** `.crew` · measured 1088×674 at 1440
  - Box: margin `0px 0px 16px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×696
- **Crew card** `.crew-card` · measured 320×136 at 1440
  - Box: display `grid`; padding `12px`; gap `6px`; columns `296px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#f3f7ff, #ffffff 70%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #4a76f0 / 38% 0px 0px 0px 1px, #4a76f0 / 55% 0px 10px 26px -14px`
  - Night: text `#ededef`; background-image `linear-gradient(#272d39, #1b1c1f 75%)`; shadow `#ffffff / 60% 0px 1px 0px 0px inset, #7ba1fc / 38% 0px 0px 0px 1px, #7ba1fc / 55% 0px 10px 26px -14px`
  - Phone 360: 304×136; min-height `44px`; columns `280px`
- **Crew pill** `.crew-pill` · measured 72×20 at 1440
  - Box: display `flex`; padding `0px 7px`; gap `4px`; radius `6px`
  - Type: `12px/20px` weight `500`
  - Light: text `#2d53ca`; fill `#4a76f0 / 13%`
  - Night: text `#99b9ff`; fill `#7ba1fc / 13%`
  - Phone 360: 72×20
- **Crew line** `.crew-line` · measured 296×20 at 1440
  - Box: display `flex`; min-height `20px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214 / 78%`
  - Night: text `#ededef / 78%`
  - Phone 360: 280×20
- **Crew bar** `.crew-bar-track` · measured 266×4 at 1440
  - Box: radius `2px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#111214 / 8%`
  - Night: text `#ededef`; fill `#ededef / 8%`
  - Phone 360: 250×4
- **Crew columns** `.crew-cols` · measured 1056×432 at 1440
  - Box: display `grid`; gap `12px`; columns `201.594px 201.594px 201.609px 201.594px 201.609px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 902×466; padding `0px 0px 0px 14px`; columns `177.594px 177.594px 177.609px 177.594px 177.609px`

### 7.10 Library `/library`

- **Layout** `.kbd` · measured 1088×1765 at 1440
  - Box: display `grid`; gap `32px`; columns `228px 828px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×3016; gap `16px`; columns `328px`
- **Side rail** `.kbd-side` · measured 228×812 at 1440
  - Box: display `flex`; position `sticky`; top `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×46
- **Find field** `.kbd-find` · measured 222×40 at 1440
  - Box: display `flex`; padding `0px 6px 0px 14px`; gap `10px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`; fill `#fbfaf9`; shadow `#101828 / 13% 0px 0px 0px 1.5px inset`
  - Night: text `#a5a6ad`; fill `#1f2024`; shadow `#ffffff / 12% 0px 0px 0px 1.5px inset`
  - Phone 360: not shown
- **Rail item** `.kbd-cat` · measured 222×36 at 1440
  - Box: display `flex`; min-height `36px`; padding `0px 10px`; gap `12px`; radius `10px`
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: not shown
- **Rail section label** `.kbd-sec-label` · measured 212×16 at 1440
  - Box: margin `0px 0px 6px 10px`
  - Type: `12px/16px` weight `500`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: not shown
- **Hero** `.kbd-hero` · measured 828×303 at 1440
  - Box: padding `8px 0px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×424
- **Hero title** `.kbd-h1` · measured 90×36 at 1440
  - Box: radius `6px`
  - Type: `28px/36px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 90×36
- **Lede** `.kbd-lede` · measured 626×51 at 1440
  - Box: max-width `625.812px`; margin `10px 0px 0px`
  - Type: `16px/25.6px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 328×102
- **Stat card** `.kbd-statcard` · measured 232×80 at 1440
  - Box: display `grid`; padding `16px`; gap `2px 14px`; columns `36px 150px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, #ffffff / 1%), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 16px 32px -20px`
  - Phone 360: 104×130; padding `12px`; gap `6px 14px`; columns `80px`
- **Stat icon tile** `.kbd-stat-ic` · measured 36×36 at 1440
  - Box: display `grid`; columns `36px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#2d53ca`; fill `#e6ebf7`; shadow `#4a76f0 / 18% 0px 0px 0px 1px inset`
  - Night: text `#99b9ff`; fill `#2f333e`; shadow `#7ba1fc / 18% 0px 0px 0px 1px inset`
  - Phone 360: 30×30; columns `30px`; radius `8px`
- **Section heading** `.kbd-h2` · measured 828×20 at 1440
  - Box: display `flex`; margin `0px 0px 14px`; gap `14px`
  - Type: `16px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×20
- **Card grid** `.kbd-cards` · measured 828×292 at 1440
  - Box: display `grid`; gap `12px`; columns `408px 408px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×616; gap `8px`; columns `328px`
- **Card** `.kbd-card` · measured 408×96 at 1440
  - Box: display `grid`; padding `16px`; gap `normal 14px`; columns `36px 246.109px 65.8906px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, #ffffff / 1%), none`; shadow `#ffffff / 6% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px`
  - Phone 360: 328×96; columns `36px 166.109px 65.8906px`
- **Card icon tile** `.kbd-card-ic` · measured 36×36 at 1440
  - Box: display `grid`; columns `36px`; radius `10px`
  - Type: `14px/20px` weight `400`
  - Light: text `#2d53ca`; fill `#e6ebf7`; shadow `#4a76f0 / 18% 0px 0px 0px 1px inset`
  - Night: text `#99b9ff`; fill `#2f333e`; shadow `#7ba1fc / 18% 0px 0px 0px 1px inset`
  - Phone 360: 36×36
- **Card count** `.kbd-card-n` · measured 66×22 at 1440
  - Box: display `flex`; padding `0px 8px`; radius `6px`
  - Type: `12px/20px` weight `400`
  - Light: text `#59595f`; fill `#111214 / 5%`
  - Night: text `#a5a6ad`; fill `#ededef / 5%`
  - Phone 360: 66×22
- **Entry row** `.kbd-entry` · measured 398×70 at 1440
  - Box: display `flex`; padding `12px 16px`; gap `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×70

### 7.11 Templates `/templates`

- **Grid** `.tpg-grid` · measured 1088×409 at 1440
  - Box: display `grid`; gap `20px`; columns `349.328px 349.328px 349.344px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×1212; columns `328px`
- **Card** `.tpg-card` · measured 349×409 at 1440
  - Box: display `flex`; radius `16px`; overflow `hidden`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#e6e4e2 0px 0px 0px 1px, #101828 / 4% 0px 1px 2px 0px`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 5% 0px 0px 0px 1px, #000000 / 40% 0px 1px 2px 0px, #000000 / 55% 0px 8px 20px -12px`
  - Phone 360: 328×396
- **Preview** `.tpg-shot` · measured 349×218 at 1440
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 6%`
  - Night: text `#ededef`; fill `#ffffff / 6%`
  - Phone 360: 328×205
- **Card body** `.tpg-card-body` · measured 349×191 at 1440
  - Box: display `flex`; padding `20px`; gap `8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; border-top `1px solid #e6e4e2`
  - Night: text `#ededef`; border-top `1px solid #ffffff / 7%`
  - Phone 360: 328×191
- **Pitch** `.tpg-pitch` · measured 309×42 at 1440
  - Type: `14px/21px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 288×42

### 7.12 Agents `/roster` and an agent `/roster/:agent`

- **Team group** `.ag-team` · measured 1088×320 at 1440
  - Box: display `grid`; gap `12px`; columns `1088px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×776; columns `328px`
- **Grid** `.ag-grid` · measured 1088×260 at 1440
  - Box: display `grid`; gap `12px`; columns `354.656px 354.672px 354.656px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×716; columns `328px`
- **Card** `.ag-card` · measured 355×260 at 1440
  - Box: display `grid`; padding `16px`; gap `12px`; columns `322.656px`; radius `20px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#e6e4e2 0px 0px 0px 1px, #101828 / 4% 0px 1px 2px 0px, #c3d2fb 0px 0px 0px 1.5px`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 5% 0px 0px 0px 1px, #000000 / 40% 0px 1px 2px 0px, #000000 / 55% 0px 8px 20px -12px, #7ba1fc / 40% 0px 0px 0px 1.5px`
  - Phone 360: 328×260; columns `296px`
- **Avatar** `.ag-av` · measured 40×40 at 1440
  - Box: display `grid`; columns `40px`; radius `50%`
  - Type: `13px/13px` weight `600`
  - Light: text `#111214`; fill `#f6f5f3`
  - Night: text `#ededef`; fill `#1b1c1f`
  - Phone 360: 40×40
- **Name** `.ag-name` · measured 142×24 at 1440
  - Box: overflow `hidden`
  - Type: `16px/24px` weight `600`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 115×24
- **Status** `.ag-st` · measured 117×24 at 1440
  - Box: display `flex`; min-height `24px`; padding `0px 10px 0px 8px`; gap `6px`; radius `999px`
  - Type: `12px/16px` weight `500`
  - Light: text `#284cc3`; fill `#edf2ff`
  - Night: text `#97b3f4`; fill `#7ba1fc / 12%`
  - Phone 360: 117×24
- **Pill** `.ag-pill` · measured 92×24 at 1440
  - Box: display `flex`; min-height `24px`; padding `0px 10px`; gap `6px`; radius `999px`
  - Type: `12px/16px` weight `400` mono (IBM Plex Mono)
  - Light: text `#111214`; fill `#f8f7f6`; shadow `#e6e4e2 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#27282c`; shadow `#ffffff / 7% 0px 0px 0px 1px inset`
  - Phone 360: 92×24
- **Top bar** `.ro-top` · measured 1088×64 at 1440
  - Box: display `flex`; gap `8px 32px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×148
- **Hero** `.ag-hero` · measured 1088×176 at 1440
  - Box: display `grid`; padding `20px`; gap `12px 16px`; columns `56px 800.953px 159.047px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×224; padding `16px`; columns `56px 224px`
- **Columns** `.ag-cols` · measured 1088×832 at 1440
  - Box: display `grid`; gap `16px`; columns `712px 360px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×1548; columns `328px`
- **Section** `.ag-sec` · measured 712×524 at 1440
  - Box: display `grid`; padding `20px`; gap `12px`; columns `672px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×524; columns `288px`
- **Section head** `.ag-sec-h` · measured 672×24 at 1440
  - Box: display `flex`; gap `8px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 288×24
- **Work row** `.ag-work-row` · measured 688×56 at 1440
  - Box: display `grid`; padding `10px 8px`; gap `normal 12px`; columns `8px 613.922px 26.0781px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 304×56; columns `8px 229.922px 26.0781px`
- **Chip** `.ag-chip` · measured 119×32 at 1440
  - Box: display `flex`; min-height `32px`; padding `0px 12px 0px 4px`; gap `8px`; radius `999px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#8d9097 / 35% 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#1b1c1f`; shadow `#94969e / 30% 0px 0px 0px 1px inset`
  - Phone 360: 119×44; min-height `44px`
- **Pager** `.ag-pager` · measured 1088×36 at 1440
  - Box: display `grid`; padding `4px 0px 0px`; gap `12px`; columns `501.281px 61.4375px 501.281px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×48; columns `121.281px 61.4375px 121.281px`

### 7.13 Clients `/clients`

- **Row** `.op-row` · measured 1088×92 at 1440
  - Box: display `flex`; min-height `48px`; padding `14px 16px`; gap `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×122; padding `14px 12px`; gap `8px 12px`
- **Client projects list** `.op-cl-projs` · measured 520×64 at 1440
  - Box: display `grid`; max-width `520px`; margin `6px 0px 0px`; gap `8px`; columns `520px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 304×112; columns `304px`

**Polish to keep**
- Each client lists up to three of its projects, open ones first, each with its phase bar.
- No tinted tile on a client card, and no accent bar on hover.

### 7.14 Activity `/activity`

- **Day heading** `.op-day-h` · measured 1088×24 at 1440
  - Type: `14px/24px` weight `500`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 328×24
- **Row** `.op-row` · measured 1088×92 at 1440
  - Box: display `flex`; min-height `48px`; padding `14px 16px`; gap `16px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×120; padding `14px 12px`; gap `8px 12px`
- **Action text** `.op-action` · measured 275×17 at 1440
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 275×17

### 7.15 Drive `/drive` and a file `/files/:id`

- **Item** `.up-item` · measured 1088×106 at 1440
  - Box: display `grid`; padding `16px 20px`; gap `14px`; columns `24px 44px 750.688px 187.312px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×226; padding `14px 16px`; gap `10px`; columns `24px 32px 220px`
- **Thumb** `.up-thumb` · measured 44×44 at 1440
  - Box: display `grid`; columns `44px`; radius `12px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#101828 / 4%`; shadow `#e6e4e2 0px 0px 0px 1px inset`
  - Night: text `#ededef`; fill `#ffffff / 3%`; shadow `#ffffff / 7% 0px 0px 0px 1px inset`
  - Phone 360: 32×32; columns `32px`; radius `8px`
- **Name** `.up-name` · measured 751×20 at 1440
  - Type: `14px/20px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 220×20
- **Meta** `.up-item-meta` · measured 751×20 at 1440
  - Type: `13px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 220×40
- **Suggestion** `.up-sug` · measured 747×20 at 1440
  - Box: display `flex`; margin `2px 0px 0px`; gap `8px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 220×60
- **Actions** `.up-item-acts` · measured 187×28 at 1440
  - Box: display `flex`; gap `6px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 296×44; display `grid`; columns `145px 145px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px 0px`
- **Action button** `.up-item-acts .av-btn` · measured 117×28 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `6px`; radius `10px`
  - Type: `12px/12px` weight `500`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff, #fafaf9)`; shadow `#dddcda 0px 0px 0px 1px, #101828 / 4% 0px 1px 1px 0px`
  - Night: text `#ededef`; fill `#212226`; shadow `#ffffff / 9% 0px 0px 0px 1px`; no background-image
  - Phone 360: 145×44; min-height `44px`
- **Checkbox box** `.up-box` · measured 18×18 at 1440
  - Box: margin `1px 0px 0px`; radius `5px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#f6f5f3`; shadow `#87878f 0px 0px 0px 1.5px inset`
  - Night: text `#ededef`; fill `#ffffff / 4%`; shadow `#76777f 0px 0px 0px 1.5px inset`
  - Phone 360: 18×18
- **Head** `.up-fhead, .up-file-head` · measured 1088×164 at 1440
  - Box: display `grid`; padding `20px`; gap `12px 16px`; columns `64px 843.703px 108.297px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×276; padding `16px`; columns `64px 216px`
- **Link row** `.up-link-row` · measured 672×84 at 1440
  - Box: display `grid`; padding `14px 0px`; gap `8px 16px`; columns `583.531px 72.4688px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 296×144; columns `296px`
- **Danger card** `.up-danger` · measured 360×160 at 1440
  - Box: display `grid`; padding `20px`; gap `12px`; columns `320px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×164; padding `16px`; columns `296px`

### 7.16 Getting started `/setup`

- **Wrapper** `.gs` · measured 880×893 at 1440
  - Box: display `grid`; max-width `880px`; gap `16px`; columns `880px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×1377; columns `328px`
- **Head card** `.gs-head` · measured 880×132 at 1440
  - Box: display `grid`; padding `20px`; gap `16px`; columns `840px`; radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×144; padding `16px`; columns `296px`
- **Progress segment** `.gs-bar i` · measured 137×4 at 1440
  - Box: radius `999px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; fill `#284cc3`
  - Night: text `#ededef`; fill `#97b3f4`
  - Phone 360: 46×4
- **Steps card** `.gs-steps` · measured 880×745 at 1440
  - Box: radius `14px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`; background-image `linear-gradient(#ffffff 0px, #fcfcfb 140px, #fbfaf9 100%)`; shadow `#ffffff / 95% 0px 1px 0px 0px inset, #141c34 / 7% 0px 0px 0px 1px, #141c34 / 5% 0px 1px 2px 0px, #1c285a / 26% 0px 18px 40px -22px`
  - Night: text `#ededef`; fill `#1b1c1f`; background-image `linear-gradient(#ffffff / 4%, transparent 160px), none`; shadow `#ffffff / 7% 0px 1px 0px 0px inset, #ffffff / 6% 0px 0px 0px 1px, #000000 / 75% 0px 18px 40px -20px`
  - Phone 360: 328×1217
- **Step** `.gs-step` · measured 880×130 at 1440
  - Box: display `grid`; padding `18px 20px`; gap `16px`; columns `32px 691.281px 84.7188px`
  - Type: `14px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 328×202; padding `16px`; gap `12px`; columns `28px 256px`
- **Step title** `.gs-step h3` · measured 691×24 at 1440
  - Type: `16px/24px` weight `500`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 256×24
- **Step what** `.gs-what` · measured 548×40 at 1440
  - Box: max-width `547.586px`; margin `2px 0px 0px`
  - Type: `14px/20px` weight `400`
  - Light: text `#59595f`
  - Night: text `#a5a6ad`
  - Phone 360: 256×60
- **Step fact** `.gs-fact` · measured 173×20 at 1440
  - Box: display `inline-flex`; margin `8px 0px 0px`; gap `6px`
  - Type: `13px/20px` weight `400`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 173×20
- **Step mark** `.gs-mark` · measured 30×30 at 1440
  - Box: display `grid`; columns `28px`; radius `50%`
  - Type: `13px/20px` weight `400`
  - Light: text `#18744d`; fill `#e9f8f1`; border `1px solid transparent`
  - Night: text `#78d6a8`; fill `#3cbf82 / 13%`
  - Phone 360: 30×30
- **Step action** `.gs-act` · measured 85×28 at 1440
  - Box: display `flex`; padding `0px 10px`; gap `6px`; radius `10px`
  - Type: `12px/12px` weight `500`
  - Light: text `#111214`
  - Night: text `#ededef`
  - Phone 360: 85×44; min-height `44px`

## 8. Motion catalogue

Every loop means something is happening now. Nothing loops for decoration.

| Effect | Where | Timing | Stops when |
| --- | --- | --- | --- |
| Heartbeat ring | Live dots (brand, account, rooms) | `--beat`, ease-out, infinite: scale 0.5 → 1.5, opacity 0.45 → 0 | The stream is offline or stalled (the dot turns amber) |
| Event sweep | Top of the canvas | 1.15s, once per event, at most one a second | — |
| Gate conveyor | The current gate's rail | 2.8s loop; a passed gate runs it once, 900ms, after 300ms | The project leaves that gate |
| Gate fill breathing | The current gate | `--beat`, brightness 1 → 1.25 | — |
| Room scan | A building room | 3.6s linear loop | The room stalls or is parked |
| Agent working light | The room's agent line | 1.4s, opacity 0.35 → 1 | The room stalls |
| Time-bar stripes | A running attempt | 1.2s linear loop | The attempt ends |
| Activity bars | Top-bar pulse, Live, the dock | `--beat`, height 3px → 10px | No room is running |
| Hero edge light | The next decision | 9s linear loop | You decide |
| New-row glow | Newest event, newest done decision | 1.6s, once: a 14% cobalt wash fading out | — |
| Undo drain | The snackbar after a decision | 6s linear, scaleX 1 → 0 | — |
| Rolling number | Counts and badges | 300ms: up 2px and back | — |
| Field beam and halo | A focused text box | Beam 1.4s once; halo 2.8s loop after it | The field loses focus |
| Invalid shake | An invalid field | 320ms, once: ±4px | — |
| Idle breathing | Decisions when clear | 4.2s loop, opacity 0.25 → 1 | Something needs you |
| Title focus-in | Page titles on desk | 420ms: 5px blur and 8px below → sharp | — |
| Typing cursor | Feeds, terminals, Canon's reply | A blinking cobalt block | Reduced motion |

## 9. Phone rules (360 to 760px)

- **Decisions and Release are designed phone first.** They must work one-handed.
- **The dock** floats 8px above the bottom edge: 66px tall, 22px radius, a translucent plate, five tabs. Pages leave room so nothing hides under it.
- **Sheets, not popovers.** Filters, menus and forms open as bottom sheets with a grab handle. Sheets that hold a form go full screen and cover the dock.
- **Buttons a finger lands on are 44px tall.** Side-by-side actions become a grid or stack full width.
- **Fields** are 48px pills (999px radius) at 16px text.
- **Page titles** drop from 28/36 to 20/28.
- **Rows stack:** a list row's side content moves under its main content. Nothing scrolls sideways except tab strips and the crew tree.
- **Back** is one link in the header naming the parent. Breadcrumbs are desk only.

## 10. Accessibility the prototype already meets

- Zero axe-core failures on every route, light and night, desk and phone.
- Every icon-only control has an accessible name; decorative icons and drawn previews are hidden from screen readers.
- A control's visible words are part of its accessible name.
- Dialogs and sheets trap focus and give it back on close.
- Live regions announce Canon's replies, proof-check results, upload progress and new agent steps, politely.
- Progress bars and meters carry their value and a label. A phase bar is one image with a label such as "Phase 3 of 5: Build, 2 of 5 landed".
- Errors sit under their field and are linked to it; a form's foot says how many things are left to fix.

## 11. Checking your build

Port these scripts from `tests/e2e/` (move their selectors to roles, labels or test ids) and run them with `APP_URL` set to your build. All must pass.

| Script | What it proves |
| --- | --- |
| `audit-off-scale-styles` | No font size off the scale, no weight 700, no letter spacing, no odd radius |
| `audit-type-and-targets` | Text sizes and minimum target sizes, desk and phone |
| `audit-button-gaps`, `audit-icon-spacing` | 8px and 12px between buttons; icon gaps |
| `audit-no-ring-on-click` | A click never shows a focus ring |
| `audit-axe-all-rules`, `audit-axe-routes`, `audit-axe-dock` | Accessibility on every route, both themes, both sizes |
| `audit-contract-rules` | No money, untrusted text as text, no polling, contract names only |
| `flow-*` | Each flow end to end: decisions, checkpoints, release, receipt, Canon, sheets, keyboard, phone, roster, uploads, setup |

Then compare values: run `tools/design-spec.cjs` against the prototype and against your build, and diff the two JSON files. A difference in size, line height, weight, padding, gap, radius, colour or shadow is a defect unless a contract change explains it.
