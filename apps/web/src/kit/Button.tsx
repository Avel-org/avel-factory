import { type CSSProperties, type MouseEventHandler, type ReactNode, useId } from "react";
import { Icon, type IconName } from "./Icon";
import { usePress } from "./interaction";

// DL's Button (`ee`, and `ButtonWithReason` when it has a disabled reason) with its variants
// (`d8`). Not ported (UI contract section 4): `holdToConfirm`, `onConfirm`, `pressed`, `type`,
// `title`, `ariaLabel` and `style`. So the kit's button is always type="button", and a segment
// button is never drawn pressed.

interface Look {
  bg: string;
  hover: string;
  pressed: string;
  fg: string;
  sh?: string;
  shp?: string;
  ts?: string;
}

const VARIANTS = {
  primary: {
    bg: "var(--av-btn-primary-fill)",
    hover: "var(--av-btn-primary-fill-hover)",
    pressed: "var(--av-btn-primary-fill-pressed)",
    fg: "var(--av-on-primary-btn)",
    sh: "var(--av-btn-primary-shadow)",
    shp: "var(--av-btn-primary-shadow-pressed)",
    ts: "var(--av-btn-primary-label)",
  },
  danger: {
    bg: "var(--av-btn-danger-fill)",
    hover: "var(--av-btn-danger-fill-hover)",
    pressed: "var(--av-btn-danger-fill-pressed)",
    fg: "var(--av-on-danger)",
    sh: "var(--av-btn-danger-shadow)",
    shp: "var(--av-btn-danger-shadow-pressed)",
    ts: "var(--av-btn-danger-label)",
  },
  dangerOutline: {
    bg: "transparent",
    hover: "var(--av-stopped-tint)",
    pressed: "var(--av-stopped-tint)",
    fg: "var(--av-stopped)",
    sh: "inset 0 0 0 1px var(--av-stopped-line)",
    shp: "inset 0 0 0 1px var(--av-stopped-line)",
  },
  ink: {
    bg: "var(--av-ink)",
    hover: "var(--av-ink-hover)",
    pressed: "var(--av-ink-pressed)",
    fg: "var(--av-on-ink)",
    sh: "var(--av-shadow-raised)",
    shp: "var(--av-shadow-pressed)",
  },
  secondary: {
    bg: "var(--av-float)",
    hover: "var(--av-faceplate-hover)",
    pressed: "var(--av-faceplate-pressed)",
    fg: "var(--av-ink)",
    sh: "var(--av-btn-secondary-shadow)",
    shp: "var(--av-shadow-pressed)",
  },
  ghost: {
    bg: "transparent",
    hover: "var(--av-faceplate-hover)",
    pressed: "var(--av-faceplate-pressed)",
    fg: "var(--av-ink)",
  },
  link: { bg: "transparent", hover: "transparent", pressed: "transparent", fg: "var(--av-accent)" },
  needs: {
    bg: "var(--av-needs)",
    hover: "var(--av-needs-hover)",
    pressed: "var(--av-needs-hover)",
    fg: "var(--av-on-needs)",
    sh: "var(--av-shadow-raised)",
    shp: "var(--av-shadow-pressed)",
  },
  segment: {
    bg: "transparent",
    hover: "transparent",
    pressed: "transparent",
    fg: "var(--av-muted)",
  },
} satisfies Record<string, Look>;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  disabled?: boolean;
  /** Disables the button and shows the reason beside it, linked with aria-describedby. */
  disabledReason?: string;
  icon?: IconName;
  iconRight?: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
}

const TRANSITION =
  "background-color var(--av-d-color) var(--av-ease), color var(--av-d-color) var(--av-ease), box-shadow var(--av-d-color) var(--av-ease), transform var(--av-d-color) var(--av-ease)";

/**
 * DL's look for a link-variant Button at rest, for an anchor that must look like one (DecisionTag's
 * `link`, D9). Not exported from the kit.
 */
export const LINK_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  height: "var(--av-control-h)",
  minHeight: 24,
  padding: "0 2px",
  border: "none",
  borderRadius: "var(--av-radius-control)",
  boxSizing: "border-box",
  background: VARIANTS.link.bg,
  color: VARIANTS.link.fg,
  fontFamily: "var(--av-font-sans)",
  fontSize: "var(--av-fs-label)",
  fontWeight: 500,
  lineHeight: 1,
  whiteSpace: "nowrap",
  cursor: "pointer",
  textUnderlineOffset: 3,
  transition: TRANSITION,
};

export function Button({
  variant = "secondary",
  size = "md",
  block,
  disabled,
  disabledReason,
  icon,
  iconRight,
  onClick,
  children,
}: ButtonProps) {
  const look: Look = VARIANTS[variant] ?? VARIANTS.secondary;
  const off = !!disabled || disabledReason != null;
  const press = usePress(off);
  const reasonId = useId();
  const segment = variant === "segment";
  const sheen = (variant === "primary" || variant === "danger") && !off;
  const height =
    segment || size === "xs"
      ? 24
      : size === "sm"
        ? "var(--av-control-h-sm)"
        : size === "lg"
          ? "var(--av-control-h-lg)"
          : "var(--av-control-h)";
  const iconOnly = !!icon && (children == null || children === false);
  const padding = iconOnly
    ? 0
    : variant === "link"
      ? "0 2px"
      : segment || size === "sm"
        ? "0 10px"
        : size === "lg"
          ? "0 16px"
          : "0 12px";
  const background = off
    ? "var(--av-disabled-bg)"
    : press.pressed
      ? look.pressed
      : press.hovered && !sheen
        ? look.hover
        : look.bg;
  const color = off
    ? "var(--av-disabled-fg)"
    : segment && press.hovered
      ? "var(--av-ink)"
      : look.fg;
  const shadow = off
    ? variant === "link" || variant === "ghost" || segment
      ? "none"
      : "inset 0 0 0 1px var(--av-hairline)"
    : press.pressed
      ? look.shp || "none"
      : look.sh || "none";

  const button = (
    <button
      data-ui="Button"
      data-variant={variant}
      type="button"
      disabled={off}
      onClick={onClick}
      aria-pressed={segment ? false : undefined}
      aria-describedby={disabledReason != null ? reasonId : undefined}
      {...press.handlers}
      style={{
        position: sheen ? "relative" : undefined,
        isolation: sheen ? "isolate" : undefined,
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height,
        minWidth: iconOnly ? height : undefined,
        minHeight: variant === "link" ? 24 : undefined,
        padding,
        border: "none",
        borderRadius: segment ? "var(--av-radius-chip)" : "var(--av-radius-control)",
        boxSizing: "border-box",
        background,
        color,
        fontFamily: "var(--av-font-sans)",
        fontSize: segment || size === "sm" ? "var(--av-fs-small)" : "var(--av-fs-label)",
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
        textShadow: off ? "none" : look.ts,
        cursor: off ? "not-allowed" : "pointer",
        textDecoration: variant === "link" && press.hovered ? "underline" : "none",
        textUnderlineOffset: 3,
        transform: press.pressed && !off && !segment ? "translateY(0.5px)" : "none",
        transition: TRANSITION,
        boxShadow: shadow,
      }}
    >
      {sheen ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: "linear-gradient(180deg, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0.04))",
            opacity: press.hovered && !press.pressed ? 1 : 0,
            transition: "opacity var(--av-d-color) var(--av-ease)",
          }}
        />
      ) : null}
      {icon ? <Icon name={icon} size={size === "xs" ? 14 : 16} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={16} /> : null}
    </button>
  );

  if (disabledReason == null) return button;
  return (
    <span
      data-ui="ButtonWithReason"
      style={{
        display: block ? "flex" : "inline-flex",
        flexDirection: block ? "column" : "row",
        alignItems: block ? "stretch" : "center",
        gap: block ? 6 : 8,
        flexWrap: "wrap",
      }}
    >
      <span
        // biome-ignore lint/a11y/noNoninteractiveTabindex: DL's ButtonWithReason keeps the disabled button reachable, so its reason can be read.
        tabIndex={0}
        title={disabledReason}
        style={{
          display: block ? "flex" : "inline-flex",
          cursor: "not-allowed",
          borderRadius: "var(--av-radius-control)",
        }}
      >
        {button}
      </span>
      <span
        id={reasonId}
        style={{
          fontSize: "var(--av-fs-caption)",
          lineHeight: "var(--av-lh-caption)",
          color: "var(--av-muted)",
        }}
      >
        {disabledReason}
      </span>
    </span>
  );
}
