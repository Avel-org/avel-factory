import {
  ArrowUpRight,
  BadgeCheck,
  Circle,
  CirclePause,
  Copy,
  FileDiff,
  Flag,
  FlaskConical,
  GitPullRequest,
  Inbox,
  ListChecks,
  Lock,
  type LucideIcon,
  PackageCheck,
  Pin,
  RefreshCw,
  SearchCheck,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";

// DL's Icon (`te`), drawn from per-icon lucide-react imports instead of DL's registry (UI contract
// section 4). Only the icons the kit draws are registered, so an unknown name is a type error
// rather than DL's console warning.
const ICONS = {
  "arrow-up-right": ArrowUpRight,
  "badge-check": BadgeCheck,
  circle: Circle,
  "circle-pause": CirclePause,
  copy: Copy,
  "file-diff": FileDiff,
  flag: Flag,
  "flask-conical": FlaskConical,
  "git-pull-request": GitPullRequest,
  inbox: Inbox,
  "list-checks": ListChecks,
  lock: Lock,
  "package-check": PackageCheck,
  pin: Pin,
  "refresh-cw": RefreshCw,
  "search-check": SearchCheck,
  "shield-alert": ShieldAlert,
  wallet: Wallet,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  /** Gives the icon role="img" and a <title>; without it the icon is aria-hidden. */
  title?: string;
}

export function Icon({ name, size = 16, strokeWidth = 1.75, title }: IconProps) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      data-ui="Icon"
      data-icon={name}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
    </Glyph>
  );
}
