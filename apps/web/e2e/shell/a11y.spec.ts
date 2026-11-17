import { expect, test } from "@playwright/test";
import {
  attachShot,
  expectNoViolations,
  THEMES,
  textOfHtml,
  visibleText,
  WORLD_COUNT,
} from "../support/page";
import { DESKTOP, hydrated, NARROW, PHONE } from "./support";

const widths = [
  { name: "1280", ...DESKTOP },
  { name: "900", ...NARROW },
  { name: "390", ...PHONE },
];

test.describe("T-F2-10: WCAG 2.2 AA and no money, in the shell", () => {
  for (const theme of THEMES) {
    for (const w of widths) {
      test(`/ has no violation and no '$': ${theme}, ${w.name}`, async ({
        browser,
        baseURL,
      }, info) => {
        const context = await browser.newContext({
          baseURL: baseURL ?? "",
          viewport: { width: w.width, height: w.height },
        });
        if (theme === "night") {
          await context.addCookies([{ name: "avel-theme", value: "night", url: baseURL ?? "" }]);
        }
        const page = await context.newPage();
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(hydrated(page)).toBeAttached();
        await expect(page.getByText(`${WORLD_COUNT} waiting`, { exact: true })).toBeVisible();
        await expectNoViolations(page);
        expect(await visibleText(page)).not.toContain("$");
        const served = textOfHtml(await (await context.request.get("/")).text());
        expect(served).toContain("AVEL");
        expect(served).not.toContain("$");
        await attachShot(page, info, `shell-axe-${theme}-${w.name}`);
        await context.close();
      });
    }
  }
});
