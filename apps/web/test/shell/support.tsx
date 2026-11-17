import type { ReactNode } from "react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { AppShell } from "../../src/kit/AppShell";

type Props = Parameters<typeof AppShell>[0];

export const GROUPS: Props["groups"] = [
  {
    label: "Decide",
    items: [
      { id: "decisions", label: "Decisions", href: "/", icon: "inbox" },
      { id: "second", label: "Second", href: "/second", icon: "inbox" },
    ],
  },
  { label: "Empty group", items: [] },
  { label: "Watch", items: [{ id: "live", label: "Factory live", href: "/live", icon: "inbox" }] },
];

export const TABS: Props["tabs"] = [
  { id: "decisions", label: "Decisions", href: "/", icon: "inbox" },
  { id: "live", label: "Live tab", href: "/live", icon: "inbox" },
];

/** A plain-anchor renderLink: the seam the route layer fills with TanStack's Link. */
const renderLink: Props["renderLink"] = (p) =>
  createElement(
    "a",
    { href: p.href, className: p.className, "aria-current": p["aria-current"] },
    p.children,
  );

export function renderShell(over: Partial<Props> = {}, children: ReactNode = "page body") {
  return renderToString(
    createElement(AppShell, {
      groups: GROUPS,
      tabs: TABS,
      currentId: "decisions",
      crumbs: [{ label: "Decisions" }],
      renderLink,
      ...over,
      children,
    } as Props),
  );
}

export const text = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Each <a> or <button> start tag with its inner text, in document order. */
export function anchors(html: string): { tag: string; text: string }[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
    tag: m[1] ?? "",
    text: text(m[2] ?? ""),
  }));
}
