import { expect, test } from "@playwright/test";
import { attachShot } from "../support/page";
import { booted, DESKTOP, expectNoViolationsSettled, watchErrors } from "./support";

const PAGES = [
  { hash: "#/", title: "Decisions" },
  { hash: "#/live", title: "Live" },
  { hash: "#/library", title: "Library" },
  { hash: "#/settings", title: "Settings" },
] as const;

test.describe("T-F7-05: #/ hash routes move between pages without a reload", () => {
  test.use({ viewport: DESKTOP });

  test("Decisions, Live, Library and Settings open by hash, and back returns", async ({
    page,
  }, info) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await booted(page, "Decisions");
    // A marker on window survives hash moves and dies on a full reload.
    await page.evaluate(() => {
      (window as unknown as { __noReload: number }).__noReload = 1;
    });
    const stillSamePage = () =>
      page.evaluate(() => (window as unknown as { __noReload?: number }).__noReload === 1);

    for (const p of PAGES.slice(1)) {
      await page.evaluate((h) => {
        location.hash = h.slice(1);
      }, p.hash);
      await expect(page).toHaveURL(new RegExp(`/${p.hash}$`));
      await expect(page.locator("h1").first()).toContainText(p.title);
      expect(await stillSamePage(), `${p.hash} reloaded the page`).toBe(true);
      await expectNoViolationsSettled(page);
      await attachShot(page, info, `route-${p.title.toLowerCase()}`);
    }

    // Back walks the history in reverse: Library, Live, Decisions.
    for (const p of [PAGES[2], PAGES[1], PAGES[0]]) {
      await page.goBack();
      await expect(page.locator("h1").first()).toContainText(p.title);
      expect(await stillSamePage(), `back to ${p.hash} reloaded the page`).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test("a sidebar link changes the hash and the page, without a reload", async ({ page }, info) => {
    await page.goto("/");
    await booted(page);
    await page.evaluate(() => {
      (window as unknown as { __noReload: number }).__noReload = 1;
    });
    await page
      .locator("nav.lib-nav[aria-label='Main']")
      .getByRole("link", { name: /Live/ })
      .first()
      .click();
    await expect(page).toHaveURL(/#\/live/);
    await expect(page.locator("h1").first()).toContainText("Live");
    expect(
      await page.evaluate(() => (window as unknown as { __noReload?: number }).__noReload),
    ).toBe(1);
    await page.goBack();
    await expect(page.locator("h1").first()).toContainText("Decisions");
    await expectNoViolationsSettled(page);
    await attachShot(page, info, "route-sidebar-link");
  });

  test("opening #/library directly boots on that page", async ({ page }, info) => {
    const errors = watchErrors(page);
    await page.goto("/#/library");
    await booted(page, "Library");
    await expectNoViolationsSettled(page);
    expect(errors).toEqual([]);
    await attachShot(page, info, "route-library-direct");
  });
});
