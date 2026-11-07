status: open
severity: P1
owner: Leon a2 (known work: decisions.css and linking kit.css)

# Tap targets under 44px and a 14px reason input on a phone: the stylesheets aren't linked yet

**Evidence.** UI contract UC-31 and section 5 "Styles and loading": the page links `kitStylesheetHref` and the module's stylesheet. `apps/web/src/routes/index.tsx` has no `head`, and nothing under `src` uses `kitStylesheetHref`:
```
$ grep -rn "kitStylesheetHref" apps/web/src --include=*.ts --include=*.tsx
apps/web/src/kit/index.ts:6,23   (defined and exported only)
```
Measured with Playwright (Chromium) on the dev server (`AVEL_API=mock`) at 390x844, after hydration:
- Approve 57x20, Reject… 53x20 (UC-31 wants D11's two-column grid, at least 44px tall).
- "Open on GitHub" 358x35; each HashChip copy button 12x12.
- Reason dialog: textarea `font-size` 14px (UC-31 wants 16px so iOS doesn't zoom). Dialog is a bottom sheet (390x166 at y=678).
- `HashChip` computes `font-family` Inter, weight 400, not Plex Mono 500 (see finding 04).

**Passing:** dialog has `role=dialog`, `aria-modal=true`, `aria-labelledby`; focus moves into the textarea on open; Escape closes it and focus returns to the Approve button; textarea is labelled "Why?"; every button/link has an accessible name; one h1, h2, h3 per row; `lang=en`; viewport meta present; no horizontal overflow at 390 or 1280. The dialog has no `aria-describedby` (the description isn't tied to it): P3, check after a2.

**Fix means:** link both sheets from `/`'s `head`, then re-measure: buttons at least 44px tall in the D11 grid, reason input 16px, the copy buttons and "Open on GitHub" at 44px (DL v1.8 touch rule), `aria-describedby` on the dialog.
