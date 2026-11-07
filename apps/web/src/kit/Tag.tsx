import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { drawStatusGlyph, type GlyphStatus } from "./StatusGlyph";

// DL's Tag (`Ze`) and its tones (`h8`). `glyph` and `style` aren't ported (UI contract section 4):
// a tone's glyph is always drawn, as DL's default `glyph: true` does.

interface TagTone {
  bg: string;
  fg: string;
  bd: string;
  glyph?: GlyphStatus;
  on?: boolean;
  dashed?: boolean;
  text?: string;
  h?: number;
  minW?: number;
  pad?: string;
  mono?: boolean;
  r?: string;
  fs?: number;
  weight?: number;
}

const TONES = {
  neutral: { bg: "var(--av-inset-deep)", fg: "var(--av-ink)", bd: "transparent" },
  needs: {
    bg: "var(--av-needs)",
    fg: "var(--av-on-needs)",
    bd: "var(--av-needs)",
    glyph: "needs",
    on: true,
  },
  headsup: {
    bg: "var(--av-needs-tint)",
    fg: "var(--av-needs-text)",
    bd: "var(--av-needs-line)",
    glyph: "headsup",
  },
  stopped: {
    bg: "var(--av-stopped-tint)",
    fg: "var(--av-stopped)",
    bd: "var(--av-stopped-line)",
    glyph: "stopped",
  },
  verified: {
    bg: "var(--av-verified-tint)",
    fg: "var(--av-verified)",
    bd: "var(--av-verified-line)",
    glyph: "verified",
  },
  pending: {
    bg: "var(--av-pending-soft)",
    fg: "var(--av-pending)",
    bd: "var(--av-pending-line)",
    glyph: "waiting",
  },
  accent: { bg: "var(--av-accent-tint)", fg: "var(--av-accent)", bd: "var(--av-accent-line)" },
  outline: { bg: "transparent", fg: "var(--av-ink)", bd: "var(--av-hairline-strong)" },
  estimated: {
    bg: "transparent",
    fg: "var(--av-pending)",
    bd: "var(--av-pending-line)",
    dashed: true,
    text: "Estimated",
  },
  unconfigured: {
    bg: "transparent",
    fg: "var(--av-pending)",
    bd: "var(--av-pending-line)",
    dashed: true,
    text: "Not configured",
  },
  count: {
    bg: "var(--av-float)",
    fg: "var(--av-ink)",
    bd: "var(--av-hairline)",
    h: 20,
    minW: 24,
    pad: "0 6px",
  },
  kbd: {
    bg: "var(--av-float)",
    fg: "var(--av-subtle)",
    bd: "var(--av-hairline-strong)",
    h: 18,
    pad: "0 5px",
    mono: true,
    r: "var(--av-radius-stamp)",
    fs: 11,
    weight: 400,
  },
  mono: {
    bg: "var(--av-pending-soft)",
    fg: "var(--av-muted)",
    bd: "transparent",
    h: 20,
    pad: "0 6px",
    mono: true,
    r: "var(--av-radius-stamp)",
    weight: 400,
  },
} satisfies Record<string, TagTone>;

export type TagToneName = keyof typeof TONES;

export interface TagProps {
  tone?: TagToneName;
  size?: "sm";
  icon?: IconName;
  title?: string;
  children?: ReactNode;
}

export function Tag({ tone = "neutral", size, icon, title, children }: TagProps) {
  const s: TagTone = TONES[tone] ?? TONES.neutral;
  const small = size === "sm";
  return (
    <span
      data-ui="Tag"
      data-tone={tone}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: s.minW ? "center" : undefined,
        gap: 5,
        height: s.h || (small ? 20 : "var(--av-chip-h)"),
        minWidth: s.minW,
        padding: s.pad || (small ? "0 6px" : "0 8px"),
        borderRadius: s.r || "var(--av-radius-chip)",
        background: s.bg,
        color: s.fg,
        fontFamily: s.mono ? "var(--av-font-mono)" : undefined,
        fontVariantNumeric: "tabular-nums",
        border: `1px ${s.dashed ? "dashed" : "solid"} ${s.bd}`,
        boxSizing: "border-box",
        fontSize: s.fs || (s.mono ? "var(--av-fs-mono)" : "var(--av-fs-caption)"),
        lineHeight: 1,
        fontWeight: s.weight || 500,
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        flex: "none",
      }}
    >
      {s.glyph ? (
        <span style={{ color: s.fg, display: "inline-flex" }}>
          {drawStatusGlyph(s.glyph, 10, s.on === true)}
        </span>
      ) : null}
      {icon ? <Icon name={icon} size={12} /> : null}
      {children ?? s.text}
    </span>
  );
}
