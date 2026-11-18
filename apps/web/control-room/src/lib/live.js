// The factory's live signals (taste pass, ideas 3 and 4). One sweep of light across the top of the
// page each time an event arrives, so you can see from across the room that the factory is moving.
// Not a fetch: it only reacts to events the app already received.
let last = 0;
export function sawLiveEvent() {
  if (typeof document === "undefined") return;
  const now = Date.now();
  if (now - last < 900) return; // one sweep at a time, never a strobe
  last = now;
  document.querySelectorAll(".cr-sweep").forEach((el) => {
    el.removeAttribute("data-go");
    void el.offsetWidth; // restart the animation
    el.setAttribute("data-go", "true");
  });
}

// A soft light that follows the pointer across a card (desk only). Decoration that tells you which
// machine you're over; never on touch, never with reduced motion.
export function installSpotlight() {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  let raf = 0,
    ev = null,
    lit = null;
  const paint = () => {
    raf = 0;
    const card = ev && ev.target && ev.target.closest ? ev.target.closest(".lib-card, .cr-hero") : null;
    if (lit && lit !== card) lit.removeAttribute("data-lit");
    lit = card;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", Math.round(ev.clientX - r.left) + "px");
    card.style.setProperty("--my", Math.round(ev.clientY - r.top) + "px");
    card.setAttribute("data-lit", "true");
  };
  const move = (e) => {
    ev = e;
    if (!raf) raf = requestAnimationFrame(paint);
  };
  window.addEventListener("pointermove", move, { passive: true });
  return () => window.removeEventListener("pointermove", move);
}
