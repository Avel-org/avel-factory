import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { drawStatusGlyph, type GlyphStatus } from "./StatusGlyph";

// DL's Tag (`Ze`) and its tones (`h8`). `glyph` and `style` aren't ported (UI contract section 4):
// a tone's glyph is always drawn, as DL's default `glyph: true` does. Each tone's look is in
// kit.css, keyed on data-tone; an unknown tone gets neutral's, as DL's fallback does. Here each
// tone keeps only what the markup needs: its glyph, whether it's drawn on colour, and its text.

interface TagTone {
  glyph?: GlyphStatus;
  on?: boolean;
  text?: string;
}

const TONES = {
  neutral: {},
  needs: { glyph: "needs", on: true },
  headsup: { glyph: "headsup" },
  stopped: { glyph: "stopped" },
  verified: { glyph: "verified" },
  pending: { glyph: "waiting" },
  accent: {},
  outline: {},
  estimated: { text: "Estimated" },
  unconfigured: { text: "Not configured" },
  count: {},
  kbd: {},
  mono: {},
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
  return (
    <span data-ui="Tag" data-tone={tone} data-size={size} title={title}>
      {s.glyph ? (
        <span className="av-tag-glyph">{drawStatusGlyph(s.glyph, 10, s.on === true)}</span>
      ) : null}
      {icon ? <Icon name={icon} size={12} /> : null}
      {children ?? s.text}
    </span>
  );
}
