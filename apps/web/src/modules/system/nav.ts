import type { AppShellProps } from "../../kit/AppShell";
import type { IconName } from "../../kit/Icon";

export type NavEntry = { group: string; order: number; label: string; icon: IconName };

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    nav?: NavEntry;
  }
}

/** The groups in the sidebar's order (section 4). */
const GROUP_ORDER = ["Decide", "Projects", "Watch", "Business", "Factory"];
/** The routes the tab bar lists. A tab waits for its route (S17). */
const TAB_PATHS = ["/"];

type RouteLike = { fullPath: string; options: { staticData?: { nav?: NavEntry } } };

/** Reads each route's staticData.nav into the sidebar's groups and the tab bar's tabs. */
export function navFromRoutes(routes: RouteLike[]): Pick<AppShellProps, "groups" | "tabs"> {
  const entries = routes.flatMap((r) => {
    const nav = r.options.staticData?.nav;
    return nav ? [{ nav, href: r.fullPath }] : [];
  });
  const rank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g);
    return i < 0 ? GROUP_ORDER.length : i;
  };
  const sorted = [...entries].sort(
    (a, b) => rank(a.nav.group) - rank(b.nav.group) || a.nav.order - b.nav.order,
  );
  const item = (e: (typeof sorted)[number]) => ({
    id: e.href,
    label: e.nav.label,
    href: e.href,
    icon: e.nav.icon,
  });
  const groups: AppShellProps["groups"] = [];
  for (const e of sorted) {
    const g = groups.find((x) => x.label === e.nav.group);
    if (g) g.items.push(item(e));
    else groups.push({ label: e.nav.group, items: [item(e)] });
  }
  const tabs = TAB_PATHS.flatMap((p) => {
    const e = sorted.find((x) => x.href === p);
    return e ? [{ id: e.href, label: e.nav.label, href: e.href, icon: e.nav.icon }] : [];
  });
  return { groups, tabs };
}
