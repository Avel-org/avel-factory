import { expect, test } from "@playwright/test";
import { expectNoViolationsSettled, watchErrors } from "../control-room/support";
import { ROUTES } from "../control-room-screens/routes";
import { attachShot } from "../support/page";

/**
 * T-F10-05: OSA is behind a flag. With ?osa=1 absent, no OSA bar and no text naming OSA shows
 * on any route; with it, the OSA bar shows. Each test starts on a fresh page, so no flag is
 * carried over from another.
 */
const OSA_TEXT = /\bOSA\b/;
const BAR = '[data-ui="OsaBar"]';

test.describe("T-F10-05: with ?osa=1 absent, nothing of OSA shows", () => {
  for (const route of ROUTES) {
    test(`${route.id} (${route.hash})`, async ({ page }, info) => {
      const errors = watchErrors(page);
      await page.goto(`/${route.hash}`);
      await expect(page.locator('[data-ui="Skeleton"]')).toHaveCount(0);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator(BAR)).toHaveCount(0);
      const text = await page.evaluate(() => document.body.innerText);
      expect(text.match(/.{0,30}\bOSA\b.{0,30}/g) ?? [], "text naming OSA").toEqual([]);
      expect(await page.locator('[aria-label*="OSA"]').count(), "an aria-label naming OSA").toBe(0);
      await expectNoViolationsSettled(page);
      expect(errors).toEqual([]);
      await attachShot(page, info, `osa-off-${route.id}`);
    });
  }
});

test.describe("T-F10-05: with ?osa=1, the OSA bar shows", () => {
  for (const route of ROUTES.filter((r) =>
    ["decisions", "projects", "clients", "settings"].includes(r.id),
  )) {
    test(`${route.id} (${route.hash})`, async ({ page }, info) => {
      const errors = watchErrors(page);
      await page.goto(`/?osa=1${route.hash}`);
      await expect(page.locator('[data-ui="Skeleton"]')).toHaveCount(0);
      const bar = page.locator(BAR);
      await expect(bar).toBeVisible();
      await expect(bar).toContainText("OSA");
      await expect(bar.getByRole("button", { name: "Ask OSA" })).toBeVisible();
      await expectNoViolationsSettled(page);
      expect(errors).toEqual([]);
      await attachShot(page, info, `osa-on-${route.id}`);
    });
  }
});
