import { expect, test } from "@playwright/test";
import { attachShot, expectNoViolations, WORLD_COUNT } from "../support/page";
import {
  boxOf,
  canvasStyle,
  DESKTOP,
  expectNoSideScroll,
  hydrated,
  NARROW,
  PHONE,
} from "./support";

const waiting = `${WORLD_COUNT} waiting`;

test.describe("T-F2-06: at 1280x800, / is server-rendered inside the shell", () => {
  test.use({ viewport: DESKTOP });

  test("the server's HTML carries the shell", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(/data-ui="AppShell"/);
    expect(html).toMatch(/data-ui="AppShell"[^>]*\sdata-tabbar|data-tabbar[^>]*data-ui="AppShell"/);
    expect(html).not.toContain("data-hydrated");
    expect(html).toMatch(/aria-current="page"/);
    expect(html).toMatch(/aria-label="Breadcrumb"/);
    expect(html).toMatch(/<title\b[^>]*>Decisions · AVEL<\/title>/);
  });

  test.describe("with scripts off", () => {
    test.use({ javaScriptEnabled: false });
    test("rail, canvas, crumb, h1 and count are all painted", async ({ page }, info) => {
      await page.goto("/");
      await expect(page.locator(".lib-rail")).toBeVisible();
      await expect(page.locator(".lib-rail").getByRole("link", { name: "AVEL" })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(page.locator(".lib-rail .lib-nav-item[aria-current='page']")).toContainText(
        "Decisions",
      );
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveText(/Decisions/);
      await expect(page.getByRole("heading", { level: 1, name: "Decisions" })).toBeVisible();
      await expect(page.getByText(waiting, { exact: true })).toBeVisible();
      await attachShot(page, info, "shell-ssr-1280");
    });
  });

  test("rail, rounded canvas, header, no tab bar, and T-F1's content inside", async ({
    page,
  }, info) => {
    await page.goto("/");
    await expect(hydrated(page)).toBeAttached();
    const rail = page.locator(".lib-rail");
    await expect(rail).toBeVisible();
    await expect(rail.getByRole("navigation", { name: "Main" })).toBeVisible();
    const row = rail.getByRole("link", { name: /Decisions/ });
    await expect(row).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".lib-tabbar")).toBeHidden();

    const header = page.locator(".lib-topbar");
    await expect(header.getByRole("navigation", { name: "Breadcrumb" })).toHaveText(
      /^\s*Decisions\s*$/,
    );

    await expect(page.getByRole("heading", { level: 1, name: "Decisions" })).toBeVisible();
    await expect(page.getByText(waiting, { exact: true })).toBeVisible();

    const c = await canvasStyle(page);
    expect(c.found, "h1 sits inside a vertical scroller (the canvas)").toBe(true);
    if (!c.found) return;
    expect(c.radius).toBe("16px");
    expect(c.shadow).toMatch(/0px 0px 0px 1px/);
    expect(c.overscroll).toBe("contain");
    expect(c.scrollPaddingTop).toBe("76px");
    // inset on top, right and bottom; flush with the sidebar on the left
    expect(c.top).toBeGreaterThan(0);
    expect(c.right).toBeGreaterThan(0);
    expect(c.bottom).toBeGreaterThan(0);
    expect(c.top).toBeCloseTo(c.right, 0);
    expect(c.top).toBeCloseTo(c.bottom, 0);
    const railBox = await boxOf(page, ".lib-rail");
    expect(c.left).toBeGreaterThanOrEqual(railBox.x + railBox.width - 1);
    // the header lives inside the canvas
    const inside = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const head = document.querySelector(".lib-topbar");
      let el: HTMLElement | null = h1 as HTMLElement | null;
      while (el && !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el = el.parentElement;
      return !!el && !!head && el.contains(head);
    });
    expect(inside).toBe(true);
    await expectNoViolations(page);
    await attachShot(page, info, "shell-1280");
  });
});

test.describe("T-F2-07: the frame at 900 and 390", () => {
  test.describe("900x800", () => {
    test.use({ viewport: NARROW });
    test("no rail, no tab bar; the header and the page show", async ({ page }, info) => {
      await page.goto("/");
      await expect(hydrated(page)).toBeAttached();
      await expect(page.locator(".lib-rail")).toBeHidden();
      await expect(page.locator(".lib-tabbar")).toBeHidden();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "Decisions" })).toBeVisible();
      await expect(page.getByText(waiting, { exact: true })).toBeVisible();
      await expectNoSideScroll(page);
      await expectNoViolations(page);
      await attachShot(page, info, "shell-900");
    });
  });

  test.describe("390x844", () => {
    test.use({ viewport: PHONE });
    test("the tab bar, Decisions current, 44px tabs, padded main, no sideways scroll", async ({
      page,
    }, info) => {
      await page.goto("/");
      await expect(hydrated(page)).toBeAttached();
      await expect(page.locator(".lib-rail")).toBeHidden();
      const bar = page.locator(".lib-tabbar");
      await expect(bar).toBeVisible();
      const tabs = bar.locator(".lib-tab");
      const decisions = tabs.filter({ hasText: "Decisions" });
      await expect(decisions).toHaveCount(1);
      await expect(decisions).toHaveAttribute("aria-current", "page");
      for (const tab of await tabs.all()) {
        const box = await tab.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      }
      const barBox = await boxOf(page, ".lib-tabbar");
      const padBottom = await page
        .locator("main")
        .first()
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingBottom));
      const mainPad = await page.evaluate(() => {
        // the padding that keeps content above the bar may sit on main or on its wrapper
        let el: HTMLElement | null = document.querySelector("main");
        let max = 0;
        while (el && el !== document.body) {
          max = Math.max(max, Number.parseFloat(getComputedStyle(el).paddingBottom));
          el = el.parentElement;
        }
        return max;
      });
      expect(Math.max(padBottom, mainPad)).toBeGreaterThanOrEqual(barBox.height);
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      await expectNoSideScroll(page);
      await expectNoViolations(page);
      await attachShot(page, info, "shell-390");
    });
  });
});
