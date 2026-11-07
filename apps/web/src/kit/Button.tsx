import { type MouseEventHandler, type ReactNode, useId } from "react";
import { Icon, type IconName } from "./Icon";
import { usePress } from "./interaction";

// DL's Button (`ee`, and `ButtonWithReason` when it has a disabled reason) with its variants
// (`d8`). Not ported (UI contract section 4): `holdToConfirm`, `onConfirm`, `pressed`, `type`,
// `title`, `ariaLabel` and `style`. So the kit's button is always type="button", and a segment
// button is never drawn pressed.

// The variants' looks (`d8`) are in kit.css, keyed on data-variant; an unknown variant gets
// secondary's, as DL's fallback does (UI contract section 4, "The kit's styles").
export type ButtonVariant =
  | "primary"
  | "danger"
  | "dangerOutline"
  | "ink"
  | "secondary"
  | "ghost"
  | "link"
  | "needs"
  | "segment";
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
  const off = !!disabled || disabledReason != null;
  const press = usePress(off);
  const reasonId = useId();
  const segment = variant === "segment";
  const sheen = (variant === "primary" || variant === "danger") && !off;
  const iconOnly = !!icon && (children == null || children === false);

  const button = (
    <button
      data-ui="Button"
      data-variant={variant}
      data-size={size}
      data-block={block ? "" : undefined}
      data-icon-only={iconOnly ? "" : undefined}
      data-hovered={press.hovered ? "" : undefined}
      data-pressed={press.pressed ? "" : undefined}
      type="button"
      disabled={off}
      onClick={onClick}
      aria-pressed={segment ? false : undefined}
      aria-describedby={disabledReason != null ? reasonId : undefined}
      {...press.handlers}
    >
      {sheen ? <span aria-hidden="true" className="av-btn-sheen" /> : null}
      {icon ? <Icon name={icon} size={size === "xs" ? 14 : 16} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={16} /> : null}
    </button>
  );

  if (disabledReason == null) return button;
  return (
    <span data-ui="ButtonWithReason" data-block={block ? "" : undefined}>
      <span
        // biome-ignore lint/a11y/noNoninteractiveTabindex: DL's ButtonWithReason keeps the disabled button reachable, so its reason can be read.
        tabIndex={0}
        title={disabledReason}
        className="av-btn-hold"
      >
        {button}
      </span>
      <span id={reasonId} className="av-btn-reason">
        {disabledReason}
      </span>
    </span>
  );
}
