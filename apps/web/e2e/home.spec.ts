import { expect, test } from "@playwright/test";
import {
  attachShot,
  expectNoViolations,
  THEMES,
  textOfHtml,
  VIEWPORTS,
  visibleText,
  WORLD_COUNT,
} from "./support/page";

const waiting = `${WORLD_COUNT} waiting`;

test.describe("T-F1-06: / is server-rendered", () => {
  test("the HTML before hydration has the h1, the count and the title", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<h1\b[^>]*>\s*Decisions\s*<\/h1>/);
    expect(textOfHtml(html)).toContain(waiting);
    const title = /<title\b[^>]*>([\s\S]*?)<\/title>/.exec(html.replace(/<!--[\s\S]*?-->/g, ""));
    expect(title?.[1]?.trim()).toBe("Decisions · AVEL");
  });

  test.describe("with scripts off", () => {
    test.use({ javaScriptEnabled: false });
    test("the page already shows the heading and the count", async ({ page }, info) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1, name: "Decisions" })).toBeVisible();
      await expect(page.getByText(waiting, { exact: true })).toBeVisible();
      await expect(page).toHaveTitle("Decisions · AVEL");
      await attachShot(page, info, "ssr-no-js");
    });
  });

  test("the hydrated page keeps the same content", async ({ page }, info) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Decisions" })).toBeVisible();
    await expect(page.getByText(waiting, { exact: true })).toBeVisible();
    await expect(page).toHaveTitle("Decisions · AVEL");
    await attachShot(page, info, "ready");
  });
});

test.describe("T-F1-07: the avel-theme cookie", () => {
  test("no cookie: light; avel-theme=night: night, in the server's HTML", async ({ request }) => {
    const none = await (await request.get("/")).text();
    expect(none).toMatch(/<html\b[^>]*\bdata-theme="light"/);
    expect(none).toMatch(/<html\b[^>]*\blang="en"/);
    expect(none).toMatch(/<html\b[^>]*\bdata-depth="glass"/);

    const night = await (
      await request.get("/", { headers: { cookie: "avel-theme=night" } })
    ).text();
    expect(night).toMatch(/<html\b[^>]*\bdata-theme="night"/);
    expect(night).toMatch(/<html\b[^>]*\bdata-depth="glass"/);

    const light = await (
      await request.get("/", { headers: { cookie: "avel-theme=light" } })
    ).text();
    expect(light).toMatch(/<html\b[^>]*\bdata-theme="light"/);

    const junk = await (
      await request.get("/", { headers: { cookie: "avel-theme=purple" } })
    ).text();
    expect(junk).toMatch(/<html\b[^>]*\bdata-theme="light"/);
  });

  test("the page background differs between light and night", async ({
    browser,
    baseURL,
  }, info) => {
    const backgrounds: Record<string, string> = {};
    for (const theme of THEMES) {
      const context = await browser.newContext({ baseURL: baseURL ?? "" });
      if (theme === "night") {
        await context.addCookies([{ name: "avel-theme", value: "night", url: baseURL ?? "" }]);
      }
      const page = await context.newPage();
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      backgrounds[theme] = await page.evaluate(() => {
        const clear = (c: string) => c === "rgba(0, 0, 0, 0)" || c === "transparent";
        const body = getComputedStyle(document.body).backgroundColor;
        return clear(body) ? getComputedStyle(document.documentElement).backgroundColor : body;
      });
      await attachShot(page, info, `theme-${theme}`);
      await context.close();
    }
    expect(backgrounds.light).not.toBe("rgba(0, 0, 0, 0)");
    expect(backgrounds.night).not.toBe("rgba(0, 0, 0, 0)");
    expect(backgrounds.night).not.toBe(backgrounds.light);
  });
});

test.describe("T-F1-08: WCAG 2.2 AA", () => {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`/ has no violation: ${theme}, ${viewport.width}x${viewport.height}`, async ({
        browser,
        baseURL,
      }, info) => {
        const context = await browser.newContext({
          baseURL: baseURL ?? "",
          viewport: { width: viewport.width, height: viewport.height },
        });
        if (theme === "night") {
          await context.addCookies([{ name: "avel-theme", value: "night", url: baseURL ?? "" }]);
        }
        const page = await context.newPage();
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByText(waiting, { exact: true })).toBeVisible();
        await expectNoViolations(page);
        await attachShot(page, info, `axe-${theme}-${viewport.name}`);
        await context.close();
      });
    }
  }
});

test.describe("T-F1-09: no money", () => {
  test("the page's text has no '$'", async ({ page, request }, info) => {
    await page.goto("/");
    await expect(page.getByText(waiting, { exact: true })).toBeVisible();
    const visible = await visibleText(page);
    expect(visible).not.toContain("$");
    const served = textOfHtml(await (await request.get("/")).text());
    expect(served).toContain("Decisions");
    expect(served).not.toContain("$");
    await expectNoViolations(page);
    await attachShot(page, info, "no-money");
  });
});
