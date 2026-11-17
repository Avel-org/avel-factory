import { describe, expect, it } from "vitest";
import { navFromRoutes } from "../../src/modules/system/nav";
import { getRouter } from "../../src/router";

type Nav = { group: string; order: number; label: string; icon: string };
const route = (path: string, nav?: Nav) => ({
  id: path,
  fullPath: path,
  to: path,
  options: { staticData: nav ? { nav } : {} },
});

describe("T-F2-04: navFromRoutes", () => {
  const routes = [
    route("/business", { group: "Business", order: 1, label: "Business", icon: "wallet" }),
    route("/live", { group: "Watch", order: 1, label: "Factory live", icon: "radio" }),
    route("/b", { group: "Decide", order: 2, label: "Bee", icon: "inbox" }),
    route("/a", { group: "Decide", order: 1, label: "Ay", icon: "inbox" }),
    route("/plain"),
    route("/"),
  ];
  const { groups } = navFromRoutes(routes as never);

  it("orders the groups as section 4 does, and the items by order", () => {
    expect(groups.map((g) => g.label)).toEqual(["Decide", "Watch", "Business"]);
    expect(groups[0]?.items.map((i) => i.label)).toEqual(["Ay", "Bee"]);
    expect(groups[0]?.items[0]).toMatchObject({ href: "/a", icon: "inbox" });
  });

  it("skips routes without staticData.nav, and draws no empty group", () => {
    const all = groups.flatMap((g) => g.items.map((i) => i.label));
    expect(all.sort()).toEqual(["Ay", "Bee", "Business", "Factory live"].sort());
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });

  it("with no nav routes at all, gives no groups and no tabs", () => {
    const none = navFromRoutes([route("/x")] as never);
    expect(none.groups).toEqual([]);
    expect(none.tabs).toEqual([]);
  });

  it("with T-F2's route tree gives the Decide group with Decisions at / and inbox, and nothing else", () => {
    const router = getRouter();
    const real = navFromRoutes(Object.values(router.routesById) as never);
    expect(real.groups).toHaveLength(1);
    expect(real.groups[0]?.label).toBe("Decide");
    expect(real.groups[0]?.items).toHaveLength(1);
    expect(real.groups[0]?.items[0]).toMatchObject({
      label: "Decisions",
      href: "/",
      icon: "inbox",
    });
    expect(real.tabs).toHaveLength(1);
    expect(real.tabs[0]).toMatchObject({ label: "Decisions", href: "/", icon: "inbox" });
  });
});
