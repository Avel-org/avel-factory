# UI contract: v1.9 on the kit, the approval page and the styles (frontend sprint-02)

Zero, 2026-11-08. Status: **revision 1, for Brennan's one review, with `shell-layout.md`.**
- **What it is:** revision 16 of the approval page contract (AP). From sprint-02, AP's DL is the v1.9 file.
- **AP's §0 names v1.1's functions.** In v1.9 they're Button `te`, DecisionTag (`ve`'s `.pd` card), Dialog `Xo`, ReasonDialog `Zo`, Icon `ne` and WidgetState `OT`.
- **What it compares:** v1.1 against v1.9, as the style blocks and the components' sources differ.

## 1. Kit (Fantem)

| Part | v1.9's change | Applied as |
| --- | --- | --- |
| `Button` | `busy` adds the `loader` icon with `.av-spin`, `aria-busy`, `aria-disabled` and `cursor: progress`, and drops `onClick`. `reasonPlacement` is `"below"` (the default) or `"tip"` (a `title` and sr-only text). A disabled button always has a reason | Ported, with props `busy` and `reasonPlacement` |
| `DecisionTag` | Approve is `busy` while approving, and so is Reject. Approve's reason is `Review the new version first` (`stale`) or `notAllowedReason \|\| "Your role can't approve this"` | `approving` and `rejecting`: both buttons `busy` (D7 and D8). `stale`: both disabled, with Approve's reason DL's, below it, and Reject's the same as a `tip` (D8 keeps Reject off, because route 54 refuses an unreviewed version). `actionsDisabledReason`: below Approve, and as a `tip` on Reject (D10). `notAllowed` stays with no buttons (D8, because route 54 answers 422 or 404) |
| `ReasonDialog` | Confirm under `minLength` carries the reason `Write a reason first` as a `tip`. The textarea is `data-ui="ReasonField"` | Ported |
| `Dialog` | The close button is `data-ui="DialogClose"`. On close the dialog stays mounted for `--av-d-exit`, with `data-closing` and `aria-hidden`, without `aria-modal`, and takes no input (`av-fade-out`, `av-dialog-out`, `--av-ease-in`) | Ported. Tests wait for the dialog to unmount |
| `kit.css` hovers | Every `:hover` rule moves under `@media (hover: hover) and (pointer: fine)` | That applies to `.av-icon-close` and the dialog's textarea |
| D16 (AP revision 15) | Unchanged: under 899px the desk layout draws the phone layout, from `kit.css` alone | Built here |

`WidgetState`, `Tag`, `HashChip`, `StatusGlyph` and `ErrorPanel` are unchanged, apart from v1.9's dev-only checks.

## 2. The approval page (Ghost, `modules/decisions/**`)

- **What still applies from AP revision 15:** every tag drawn with `layout="desk"`; no `matchMedia`; the marker waits for the final layout; and UC-32.
- **No deep imports:** `loadReasonDialog`, and nothing past `kit/index.ts`.
- **The header is `ScreenHeader`,** with `Home`, `Decisions` and AP §5's lead. The `.dec-head`, `.dec-eyebrow`, `.dec-title` and `.dec-lead` rules leave `decisions.css`, and `.dec-page` loses its padding.
- **`decisionsScreenStylesheets`** is the module's own sheet only, because `_shell` links `kit.css`.
- **Merge order:** after `system`'s shell.

## 3. Styles (Nemi, `apps/web/src/styles/**`)

- **`tokens.css` is copied again from v1.9.**
  - **What changes:** the night theme's `--color-text-subtle` (`#8f9098` → `#9e9fa7`), the new `--av-d-exit: 160ms` and `--av-ease-in: cubic-bezier(0.4, 0, 1, 1)`, and `--av-d-exit: 0ms` under reduced motion.
  - **What's added:** DL's two `--av-page-bg` blocks, "NIGHT: light from above" and "Glass needs something behind it". They come before DL's "Library chrome" comment, so they're the product's.
  - **The header comment** names v1.9.
- **`base.css`:** `a:hover` moves under `(hover: hover) and (pointer: fine)`, as v1.9 has it.
- **New `chrome.css`,** imported after `base.css` in `app.css`, with DL's document rules:
  - library chrome's `html`, `body` (`--av-page-bg` fixed, font features), `h1, h2, h3` and `p`;
  - the v1.6 chrome reset's rules on the document;
  - the theme crossfade (`::view-transition-*`, `lib-reveal`, `.lib-theme-fade`).
- **Fonts:** `font-fallbacks.css`, from Nemi's ac820a7, imported last. One method (cls-study-leah-04):
  - **sans:** `local("Arial")` and `local("Liberation Sans")`; `size-adjust: 107.50%`, `ascent-override: 90.12%`, `descent-override: 22.44%`, `line-gap-override: 0.00%`;
  - **mono, unchanged:** `local("Courier New")` and `local("Liberation Mono")`; `99.98%`, `102.52%`, `27.50%`, `0.00%`.
- **Theme and depth on `<html>`:** `__root.tsx` (system's dispatch, `routes/**`) sets `data-depth` from `avel-depth`, beside `data-theme` (`shell-layout.md` section 4).

## 4. Scenarios (Fenn)

- **SH-09** Section 1, unit:
  - `busy` and `tip` on `Button`;
  - DecisionTag's buttons for `approving`, `rejecting`, `stale` and `actionsDisabledReason`;
  - ReasonDialog's tip and `ReasonField`;
  - Dialog's `data-closing` and `DialogClose`.

  UC-08, UC-09 and UC-13 change only where section 1 changes them, under the lock override.
- **SH-12** Section 2, unit:
  - no import past `kit/index.ts` in `modules/decisions` (the source read as text);
  - the header is `ScreenHeader`;
  - `decisions.css` has no `.dec-head`, `.dec-eyebrow`, `.dec-title` or `.dec-lead` rule, and no padding on `.dec-page`;
  - the stylesheet list is the module's own sheet only.
- **SH-13** Section 3, unit, the files read as text: `tokens.css`'s changed values, `base.css`'s hover gate, `chrome.css`'s rules, and `font-fallbacks.css`'s eight values and two `local()` pairs, imported last.
- **SH-25** D16, end to end:
  - the harness is inside `e2e/**`: `renderToStaticMarkup` of a desk and a phone `DecisionTag` with the same props, from their source files, on a page that links the dev server's `app.css` and `kit.css`;
  - the rows are `fixtures.step1`'s decidable, `factory_change`, stale and `notAllowed` rows;
  - at 390, the article, head, title, facts, footer and each button match within 1px;
  - at 1280, the desk tag is unchanged.
