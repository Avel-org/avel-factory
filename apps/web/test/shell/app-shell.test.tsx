import { describe, expect, it } from "vitest";
import { anchors, renderShell, text } from "./support";

const navOf = (html: string, name: string) => {
  const m = new RegExp(`<nav\\b[^>]*aria-label="${name}"[^>]*>([\\s\\S]*?)</nav>`).exec(html);
  return m?.[1] ?? "";
};

describe("T-F2-01: AppShell's brand, nav, current row and crumbs", () => {
  const html = renderShell({ currentId: "second", crumbs: [{ label: "Second" }] });
  const rail = (() => {
    const i = html.indexOf('aria-label="Main"');
    return html.slice(i);
  })();

  it("draws the brand link to / with 'AVEL'", () => {
    const brand = anchors(html).find((a) => /href="\/"/.test(a.tag) && a.text.includes("AVEL"));
    expect(brand, "a link to / that says AVEL").toBeDefined();
  });

  it('draws nav "Main" with each group\'s label and its items in order', () => {
    expect(html).toMatch(/<nav\b[^>]*aria-label="Main"/);
    const t = text(navOf(html, "Main"));
    const order = ["Decide", "Decisions", "Second", "Watch", "Factory live"].map((s) =>
      t.indexOf(s),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("marks currentId's row with aria-current=page, and no other row", () => {
    const rows = anchors(rail).filter((a) => /class="[^"]*lib-nav-item/.test(a.tag));
    expect(rows.map((r) => r.text.replace(/\s+/g, " "))).toEqual(
      expect.arrayContaining([expect.stringContaining("Second")]),
    );
    const current = rows.filter((r) => /aria-current="page"/.test(r.tag));
    expect(current).toHaveLength(1);
    expect(current[0]?.text).toContain("Second");
  });

  it("draws the crumbs in a breadcrumb nav", () => {
    expect(text(navOf(html, "Breadcrumb"))).toBe("Second");
    const two = renderShell({
      crumbs: [{ label: "All projects", href: "/missions" }, { label: "Acme" }],
    });
    expect(text(navOf(two, "Breadcrumb"))).toBe("All projects Acme");
    expect(anchors(navOf(two, "Breadcrumb"))[0]?.tag).toContain('href="/missions"');
  });

  it("draws the children, and no money", () => {
    expect(text(html)).toContain("page body");
    expect(text(html)).not.toContain("$");
  });
});

describe("T-F2-02: AppShell's server markup", () => {
  const html = renderShell();
  it('has data-ui="AppShell" and data-tabbar, and no data-hydrated', () => {
    const tag = /<[a-z]+\b[^>]*data-ui="AppShell"[^>]*>/.exec(html)?.[0] ?? "";
    expect(tag).not.toBe("");
    expect(tag).toMatch(/\sdata-tabbar(=|\s|>)/);
    expect(html).not.toContain("data-hydrated");
  });
  it("draws the progress line at 0", () => {
    expect(html).toMatch(
      /class="[^"]*lib-progress[^"]*"[^>]*scaleX\(0\)|scaleX\(0\)[^>]*lib-progress/,
    );
  });
});

describe("T-F2-03: AppShell's tab bar", () => {
  const html = renderShell({ currentId: "live" });
  const bar =
    /<nav\b[^>]*class="[^"]*lib-tabbar[^"]*"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? "";

  it("draws the tabs in order", () => {
    expect(bar).not.toBe("");
    const tabs = anchors(bar);
    expect(tabs.map((t) => t.text)).toEqual(["Decisions", "Live tab"]);
    expect(tabs.every((t) => /class="[^"]*lib-tab\b/.test(t.tag))).toBe(true);
  });

  it("marks the current tab, and only that one", () => {
    const tabs = anchors(bar);
    expect(tabs.map((t) => /aria-current="page"/.test(t.tag))).toEqual([false, true]);
  });

  it("is labelled Main", () => {
    expect(html).toMatch(
      /<nav\b[^>]*class="[^"]*lib-tabbar[^"]*"[^>]*aria-label="Main"|<nav\b[^>]*aria-label="Main"[^>]*class="[^"]*lib-tabbar/,
    );
  });

  it("leaves out a group with no items", () => {
    expect(text(navOf(html, "Main"))).not.toContain("Empty group");
    expect(text(html)).not.toContain("Empty group");
  });
});
