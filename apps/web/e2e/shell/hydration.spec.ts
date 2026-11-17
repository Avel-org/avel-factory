import { expect, test } from "@playwright/test";
import { attachShot } from "../support/page";
import {
  addTallSpacer,
  type Box,
  boxOf,
  DESKTOP,
  hydrated,
  near,
  PHONE,
  progressOf,
} from "./support";

const targets: Record<string, Record<string, string>> = {
  desktop: {
    row: ".lib-rail .lib-nav-item[aria-current='page']",
    header: ".lib-topbar",
    h1: "h1",
  },
  phone: {
    header: ".lib-topbar",
    tabbar: ".lib-tabbar",
    h1: "h1",
  },
};

for (const [name, viewport] of [
  ["desktop", DESKTOP],
  ["phone", PHONE],
] as const) {
  test.describe(`T-F2-08: nothing moves at hydration (${viewport.width}x${viewport.height})`, () => {
    test("data-hydrated appears after hydration, and the boxes stay within 1px", async ({
      browser,
      baseURL,
    }, info) => {
      const boxes = async (js: boolean) => {
        const context = await browser.newContext({
          baseURL: baseURL ?? "",
          viewport,
          javaScriptEnabled: js,
        });
        const page = await context.newPage();
        await page.goto("/");
        const sel = targets[name] ?? {};
        for (const s of Object.values(sel)) await expect(page.locator(s).first()).toBeVisible();
        if (js) {
          await expect(hydrated(page)).toBeAttached();
        } else {
          await expect(page.locator('[data-ui="AppShell"]')).toBeAttached();
          await expect(page.locator("[data-hydrated]")).toHaveCount(0);
        }
        const out: Record<string, Box> = {};
        for (const [k, s] of Object.entries(sel)) out[k] = await boxOf(page, s);
        if (js) await attachShot(page, info, `hydrated-${name}`);
        await context.close();
        return out;
      };
      const server = await boxes(false);
      const live = await boxes(true);
      for (const k of Object.keys(server)) near(server[k] as Box, live[k] as Box, k);
    });
  });
}

test.describe("T-F2-09: the progress line follows the scroller", () => {
  test.describe("1280: the canvas scrolls", () => {
    test.use({ viewport: DESKTOP });
    test("0 before any scroll, grows when the canvas scrolls", async ({ page }, info) => {
      const html = await (await page.request.get("/")).text();
      expect(html).toMatch(/lib-progress[^>]*scaleX\(0\)|scaleX\(0\)[^>]*lib-progress/);
      await page.goto("/");
      await expect(hydrated(page)).toBeAttached();
      await addTallSpacer(page);
      expect(await progressOf(page)).toBe(0);
      await page.evaluate(() => {
        let el: HTMLElement | null = document.querySelector("h1");
        while (el && !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el = el.parentElement;
        if (!el) throw new Error("no scroller");
        el.scrollTop = Math.floor((el.scrollHeight - el.clientHeight) / 2);
      });
      await expect.poll(() => progressOf(page)).toBeGreaterThan(0.2);
      expect(await progressOf(page)).toBeLessThanOrEqual(1);
      await attachShot(page, info, "progress-1280");
    });
  });

  test.describe("390: the window scrolls", () => {
    test.use({ viewport: PHONE });
    test("0 before any scroll, grows when the window scrolls", async ({ page }, info) => {
      await page.goto("/");
      await expect(hydrated(page)).toBeAttached();
      await addTallSpacer(page);
      expect(await progressOf(page)).toBe(0);
      await page.evaluate(() =>
        window.scrollTo(0, Math.floor((document.documentElement.scrollHeight - innerHeight) / 2)),
      );
      await expect.poll(() => progressOf(page)).toBeGreaterThan(0.2);
      expect(await progressOf(page)).toBeLessThanOrEqual(1);
      await attachShot(page, info, "progress-390");
    });
  });
});
