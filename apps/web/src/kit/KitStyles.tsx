// The few rules the kit needs that inline styles can't hold (hover, focus, keyframes and reduced
// motion), copied from DL's own stylesheet. apps/web/src/styles carries DL's tokens and base
// element defaults only, so the kit brings these itself. React 19 hoists this <style> into the
// document head once, however many components render it, on the server and in the browser.
//
// - DL's "Overlays: Dialog" rules, word for word (the Sheet rules are left out: no kit component
//   draws one yet).
// - DL's "AVEL field anatomy" rules, scoped to the reason dialog's textarea.
// - DecisionTag's hole fill: DL's `av-hole-fill 160ms var(--av-ease) both`, which DL's
//   reduced-motion block doesn't cover; here it isn't animated under reduced motion (D12).
const CSS = `
.av-scrim { position: fixed; inset: 0; z-index: var(--z-modal); display: flex; align-items: center; justify-content: center; padding: 16px;
  background: var(--av-scrim); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); animation: av-fade var(--av-d-sheet) var(--av-ease) both; }
@keyframes av-fade { from { opacity: 0; } to { opacity: 1; } }
.av-dialog { max-height: min(86vh, 720px); display: flex; flex-direction: column; overflow: hidden; border-radius: var(--av-radius-dialog);
  background: var(--color-app-float); color: var(--av-ink); box-shadow: var(--av-shadow-overlay); animation: av-dialog-in var(--av-d-sheet) var(--av-ease) both; }
@keyframes av-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
.av-dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 20px 20px 0; }
.av-dialog-title { margin: 0; font-size: var(--av-fs-title-lg); line-height: var(--av-lh-title-lg); font-weight: 620; letter-spacing: -0.012em; text-wrap: balance; }
.av-dialog-desc { margin: 0; color: var(--av-muted); line-height: 21px; text-wrap: pretty; }
.av-dialog-body { padding: 16px 20px; overflow-y: auto; overscroll-behavior: contain; }
.av-dialog-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--av-hairline); background: var(--av-band); }
.av-dialog-head + .av-dialog-foot { margin-top: 16px; }
.av-icon-close { flex: none; width: 32px; height: 32px; margin: -6px -8px 0 0; border: none; border-radius: var(--av-radius-control); background: transparent; color: var(--av-muted);
  display: grid; place-items: center; cursor: pointer; transition: background-color var(--av-d-color) var(--av-ease), color var(--av-d-color) var(--av-ease); }
.av-icon-close:hover { background: var(--av-faceplate-hover); color: var(--av-ink); }
@media (prefers-reduced-motion: reduce) { .av-scrim, .av-dialog { animation: none !important; } }

[data-ui="ReasonDialog"] textarea {
  background: var(--av-field-fill); border: 1px solid var(--av-field-edge); box-shadow: var(--shadow-field); border-radius: var(--av-radius-control);
  transition: border-color var(--av-d-color) var(--av-ease), box-shadow var(--av-d-color) var(--av-ease), background-color var(--av-d-color) var(--av-ease);
}
[data-ui="ReasonDialog"] textarea:hover { border-color: var(--color-field-edge-hover); }
[data-ui="ReasonDialog"] textarea:focus-visible {
  outline: none; border-color: var(--av-field-focus); background: var(--color-field-fill-focus); box-shadow: 0 0 0 3px var(--av-field-halo);
}

[data-ui="DecisionTag"] [data-hole-fill] { animation: av-hole-fill 160ms var(--av-ease) both; }
@media (prefers-reduced-motion: reduce) { [data-ui="DecisionTag"] [data-hole-fill] { animation: none; } }
`;

export function KitStyles() {
  return (
    <style href="avel-kit" precedence="default">
      {CSS}
    </style>
  );
}
