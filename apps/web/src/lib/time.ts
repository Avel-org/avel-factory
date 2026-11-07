/**
 * Time formatting for the page (UI contract section 3).
 */

/** The design library's `avAgo`, word for word: `—`, `Ns`, `Nm`, or `Nh Mm`. */
export function formatAgo(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Local `HH:MM`, zero-padded, as the design library's approved stamp shows it (`14:06`). A
 * string that isn't a time gives `—`, the library's mark for no value.
 */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
