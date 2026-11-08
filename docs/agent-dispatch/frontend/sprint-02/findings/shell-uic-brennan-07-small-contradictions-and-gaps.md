status: open
severity: P3
owner: Zero (app-shell.md sections 1, 3, 4 and 7)

# shell-uic-brennan-07: five small contradictions and gaps a builder would have to guess at

1. **`/`'s head: "unchanged" against "set the title".**
   - `app-shell.md:161`: "`routes/index.tsx` moves to `routes/_shell/index.tsx`. Its URL stays `/`, and its loader, `ssr: true` and head are unchanged."
   - `app-shell.md:177`: "The document title is `{crumb} · AVEL`†, set in each route's head."
   - SH-10 (line 267) tests `/` → Decisions.
   - Today `/`'s head has only `links` (`apps/web/src/routes/index.tsx:15-17`), and `__root.tsx:38-41` sets no title.

   **Fix:** line 161 says `/`'s head gains `Decisions · AVEL`.

2. **Section 4's builder.** `app-shell.md:221` says "`decisions`; a builder Leon names in the plan". The plan names Ghost (`decisions.md:31`; `agent-ghost-decisions-build.md`), and Leon doesn't name builders.

   **Fix:** "Ghost (`apps/web/src/modules/decisions/**`)".

3. **The onboarding stub's icon.**
   - `PlannedScreen` draws `WidgetState` `empty` "with the item's icon" (`app-shell.md:207`).
   - The focus-mode stub (line 214) isn't a nav item, so it has no icon in the table.
   - DL's icon for it is `message-circle` (`pm`, id `canon`), which isn't in the kit's `Icon` (`apps/web/src/kit/Icon.tsx:27-47`).

   **Fix:** name the icon (`circle`, or add `message-circle` as section 2's second new icon).

4. **Focus mode's padding under 760px.**
   - `app-shell.md:57` gives `main` `padding-bottom: 120px` at 760px and under.
   - DL keys that on the tab bar: `.lib-app[data-tabbar] .lib-main { padding-bottom: 120px; }` (DL line 2527). It sets `data-tabbar` only when the tab bar is drawn (`"data-tabbar":a&&a!=="canon"?"":void 0`).
   - In focus mode there's no tab bar, so DL keeps 160px.

   **Fix:** say "while the tab bar is drawn".

5. **SH-24 compares elements that aren't drawn.**
   - Line 278 compares "the aside, the top bar, the tab bar, the `h1` and the first nav item" at 1280, 900 and 390.
   - The aside is `display: none` at 900 and 390, and the tab bar at 1280 and 900, so their rects are zero and match trivially.
   - "The first nav item" may be the aside's or the closed sheet's (`visibility: hidden`, translated off screen).

   **Fix:** list the elements compared at each width, all of them drawn (for example at 390: the top bar, the tab bar and its first tab, the `h1`).
