// Numbers that roll (taste pass, idea 10): when a count changes, the first number in the text
// counts to its new value instead of jumping, with a short lift. Text only: the value is rendered
// as a string, never as markup. Reduced motion shows the new value at once.
import { useEffect, useRef, useState } from "react";

const still = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const firstInt = (s) => {
  const m = String(s ?? "").match(/-?\d+/);
  return m ? { n: parseInt(m[0], 10), at: m.index, len: m[0].length } : null;
};

export function Roll({ value, className }) {
  const text = value == null ? "" : String(value);
  const [shown, setShown] = useState(text);
  const [moving, setMoving] = useState(false);
  const prev = useRef(text);
  useEffect(() => {
    const a = firstInt(prev.current),
      b = firstInt(text);
    prev.current = text;
    if (!a || !b || a.n === b.n || still() || Math.abs(b.n - a.n) > 400) {
      setShown(text);
      return;
    }
    let raf, t0;
    const dur = Math.min(700, 260 + Math.abs(b.n - a.n) * 40);
    setMoving(true);
    const step = (t) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const n = Math.round(a.n + (b.n - a.n) * e);
      setShown(text.slice(0, b.at) + n + text.slice(b.at + b.len));
      if (k < 1) raf = requestAnimationFrame(step);
      else setMoving(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return (
    <span className={"av-roll" + (className ? " " + className : "")} data-moving={moving ? "true" : undefined}>
      {shown}
    </span>
  );
}
