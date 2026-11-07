import type { ReactNode } from "react";

// DL's StatusGlyph (`ne`). `onColor` isn't a ported prop (UI contract section 4); DL's Tag still
// draws its glyph on colour, so the kit's Tag reaches it through drawStatusGlyph below.

export type GlyphStatus =
  | "stopped"
  | "needs"
  | "headsup"
  | "verified"
  | "running"
  | "done"
  | "stalled"
  | "paused"
  | "waiting";

export interface StatusGlyphProps {
  status?: GlyphStatus;
  size?: number;
}

export function StatusGlyph({ status = "running", size = 12 }: StatusGlyphProps) {
  return drawStatusGlyph(status, size, false);
}

/** DL's `ne` with its `onColor`, for the kit's own Tag. */
export function drawStatusGlyph(status: GlyphStatus, size: number, onColor: boolean) {
  const n = size;
  const a = n / 2;
  const svg = (children: ReactNode, viewBox?: string) => (
    <svg
      data-ui="StatusGlyph"
      width={n}
      height={n}
      viewBox={viewBox ?? `0 0 ${n} ${n}`}
      aria-hidden="true"
      style={{ flex: "none", display: "block" }}
    >
      {children}
    </svg>
  );
  switch (status) {
    case "stopped":
      return svg(
        <rect
          x={n * 0.1}
          y={n * 0.1}
          width={n * 0.8}
          height={n * 0.8}
          rx={n * 0.12}
          fill={onColor ? "currentColor" : "var(--av-stopped)"}
        />,
      );
    case "needs":
      return svg(
        <path
          d={`M${a} ${n * 0.08} L${n * 0.95} ${n * 0.88} L${n * 0.05} ${n * 0.88} Z`}
          fill="var(--av-needs)"
          stroke={onColor ? "currentColor" : "var(--av-ink)"}
          strokeWidth={Math.max(1, n / 11)}
          strokeLinejoin="round"
        />,
      );
    case "headsup":
      return svg(
        <g>
          <circle
            cx={a}
            cy={a}
            r={a * 0.6}
            fill="none"
            stroke="var(--av-needs)"
            strokeWidth={n * 0.2}
          />
          <circle
            cx={a}
            cy={a}
            r={a - 0.6}
            fill="none"
            stroke="var(--av-ink)"
            strokeOpacity=".5"
            strokeWidth="1"
          />
        </g>,
      );
    case "verified":
      return svg(
        <path
          d="M2.2 6.4 L4.9 9 L9.9 3.3"
          fill="none"
          stroke={onColor ? "currentColor" : "var(--av-verified)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />,
        "0 0 12 12",
      );
    case "running":
      return svg(
        <circle cx={a} cy={a} r={n * 0.3} fill={onColor ? "currentColor" : "var(--av-ink)"} />,
      );
    case "done":
      return svg(
        <g>
          <circle
            cx={a}
            cy={a}
            r={n * 0.4}
            fill="none"
            stroke="var(--av-muted)"
            strokeWidth="1.25"
          />
          <circle cx={a} cy={a} r={n * 0.18} fill="var(--av-muted)" />
        </g>,
      );
    case "stalled":
      return svg(
        <circle
          cx={a}
          cy={a}
          r={n * 0.36}
          fill="none"
          stroke="var(--av-muted)"
          strokeWidth="1.4"
          strokeDasharray="2 1.8"
        />,
      );
    case "paused":
      return svg(
        <g fill={onColor ? "currentColor" : "var(--av-ink)"}>
          <rect x={n * 0.22} y={n * 0.18} width={n * 0.2} height={n * 0.64} rx="1" />
          <rect x={n * 0.58} y={n * 0.18} width={n * 0.2} height={n * 0.64} rx="1" />
        </g>,
      );
    default:
      return svg(
        <circle
          cx={a}
          cy={a}
          r={n * 0.34}
          fill="none"
          stroke="var(--av-muted)"
          strokeWidth="1.4"
        />,
      );
  }
}
