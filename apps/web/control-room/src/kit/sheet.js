// One behaviour for every sheet, drawer and side panel (better-ui + better-accessibility):
// focus moves in on open and back to the opener on close, the page behind is inert, Escape closes,
// Tab stays inside, and the sheet can be dragged closed from its handle or header. Motion is CSS
// transitions on [data-open], so a close mid-open reverses instead of snapping.
import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Make everything outside `el` inert (siblings at every level up to body). Returns the undo. */
function inertOutside(el) {
  const done = [];
  let node = el;
  while (node && node.parentElement && node !== document.body) {
    for (const sib of node.parentElement.children) {
      if (sib === node || sib.inert || sib.hasAttribute("data-sheet-keep") || sib.tagName === "SCRIPT") continue;
      sib.inert = true;
      done.push(sib);
    }
    node = node.parentElement;
  }
  return () => done.forEach((n) => (n.inert = false));
}

/**
 * useSheet(ref, { open, onClose, side })
 * side: "bottom" (drag down to close) or "left" (drag left to close).
 * Drag starts on [data-sheet-drag] inside the sheet (the handle and the header).
 */
export function useSheet(ref, { open, onClose, side = "bottom" }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return undefined;
    const opener = document.activeElement;
    const undoInert = inertOutside(el);
    const t = setTimeout(() => {
      if (el.contains(document.activeElement)) return;
      const first = el.querySelector("[autofocus]") || el.querySelector(FOCUSABLE);
      (first || el).focus({ preventScroll: true });
    }, 30);

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        close.current && close.current();
      } else if (e.key === "Tab") {
        const f = [...el.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null || x === document.activeElement);
        if (!f.length) return;
        const a = f[0],
          z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    el.addEventListener("keydown", onKey);

    // drag to dismiss
    let start = null;
    const axis = side === "left" ? "x" : "y";
    const sign = side === "left" ? -1 : 1;
    const down = (e) => {
      const h = e.target.closest && e.target.closest("[data-sheet-drag]");
      if (!h || !el.contains(h) || e.target.closest("button, a, input, select, textarea")) return;
      start = { p: axis === "x" ? e.clientX : e.clientY, t: performance.now(), id: e.pointerId, d: 0 };
      el.setAttribute("data-dragging", "");
      h.setPointerCapture && h.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const d = Math.max(0, sign * ((axis === "x" ? e.clientX : e.clientY) - start.p));
      start.d = d;
      el.style.translate = axis === "x" ? -d + "px 0" : "0 " + d + "px";
    };
    const up = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const size = axis === "x" ? el.offsetWidth : el.offsetHeight;
      const v = start.d / Math.max(1, performance.now() - start.t);
      const shut = start.d > Math.min(120, size * 0.3) || v > 0.6;
      el.removeAttribute("data-dragging");
      el.style.translate = "";
      start = null;
      if (shut) close.current && close.current();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    return () => {
      clearTimeout(t);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeAttribute("data-dragging");
      el.style.translate = "";
      undoInert();
      if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, side, ref]);
}
