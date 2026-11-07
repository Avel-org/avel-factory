// DL's `avAgo` (`jr`), word for word, for WidgetState's "Stale, last good value {age} old". The
// kit takes plain props and imports nothing outside itself (Frontend Map v0.6, Layers), so it keeps
// its own copy; the data core's formatAgo is the same function for screens.
export function ago(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
