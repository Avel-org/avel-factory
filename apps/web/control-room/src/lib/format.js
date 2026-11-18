// One place for dates, times and shares, in US style (AVEL is in Austin). Every screen formats through
// here, so "Nov 10", "2:12 AM" and "26% of its cap" read the same everywhere. There is no money
// formatter on purpose: the control room shows AI cost only against its cap (CR-W20 section 3).

const D = (iso) => (iso instanceof Date ? iso : new Date(iso));
const TZ = "America/Chicago";

/** "Nov 10" */
export const fmtDate = (iso) => (iso ? D(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ }) : "");

/** "Tuesday, Nov 10" */
export const fmtDay = (iso) =>
  iso ? D(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: TZ }) : "";

/** "2:12 AM" */
export const fmtTime = (iso) => (iso ? D(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }) : "");

/** "Nov 10, 2:12 AM" */
export const fmtDateTime = (iso) => (iso ? fmtDate(iso) + ", " + fmtTime(iso) : "");

/** A whole percent of a cap: pct(390000, 15000000) is 3. Never more precise than the reader needs. */
export function pct(used, cap) {
  if (used == null || !cap) return null;
  const p = (used / cap) * 100;
  return p > 0 && p < 1 ? 1 : Math.round(p);
}

/** AI cost against its cap: "26% of the module cap". Under 1% shows as 1%. */
export function fmtCap(used, cap, what = "its cap") {
  const p = pct(used, cap);
  return p == null ? "—" : p + "% of " + what;
}

/** A change to a cap, as a share of it: "+33% to the module cap". */
export function fmtCapChange(delta, cap, what = "the cap") {
  const p = pct(Math.abs(delta), cap);
  return p == null ? "—" : (delta < 0 ? "−" : "+") + p + "% to " + what;
}

/** "3h 10m", "45m" */
export function fmtMinutes(min) {
  if (min == null) return "—";
  const h = Math.floor(min / 60),
    m = Math.round(min % 60);
  return h ? h + "h" + (m ? " " + m + "m" : "") : m + "m";
}

/** "in 3 days", "2 days ago", "today" */
export function fmtRelDays(iso, now = new Date()) {
  if (!iso) return "";
  const days = Math.round((D(iso) - now) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? "in " + days + " days" : -days + " days ago";
}
