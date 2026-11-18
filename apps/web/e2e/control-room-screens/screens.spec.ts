import { expect, type Page, test } from "@playwright/test";
import { expectNoViolationsSettled, watchErrors } from "../control-room/support";
import { attachShot } from "../support/page";
import { ROUTES, THEMES, VIEWS } from "./routes";

/** The page has loaded: no skeleton is up and the page's title is its first h1. */
async function titled(page: Page, title: RegExp) {
  await expect(page.locator('[data-ui="Skeleton"]')).toHaveCount(0);
  await expect(page.locator("h1").first()).toHaveText(title);
}

async function openAs(page: Page, hash: string, theme: string) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("avel-cr", JSON.stringify({ theme: t, depth: "flat" }));
    } catch {}
  }, theme);
  await page.goto(`/${hash}`);
}

test.describe("T-F9-01: every page in the registry opens at its route", () => {
  for (const view of VIEWS) {
    test.describe(`${view.name} ${view.width}x${view.height}`, () => {
      test.use({ viewport: { width: view.width, height: view.height } });
      for (const route of ROUTES) {
        test(`${route.id} (${route.hash}) shows its title with no error`, async ({
          page,
        }, info) => {
          const errors = watchErrors(page);
          await openAs(page, route.hash, "light");
          await titled(page, route.title);
          expect(errors).toEqual([]);
          await attachShot(page, info, `open-${route.id}-${view.name}`);
        });
      }
    });
  }
});

test.describe("T-F9-02: axe finds no WCAG 2.2 AA violation on any page", () => {
  for (const view of VIEWS) {
    test.describe(`${view.name} ${view.width}x${view.height}`, () => {
      test.use({ viewport: { width: view.width, height: view.height } });
      for (const theme of THEMES) {
        for (const route of ROUTES) {
          test(`${route.id} (${route.hash}) in ${theme}`, async ({ page }, info) => {
            await openAs(page, route.hash, theme);
            await titled(page, route.title);
            await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
            await expectNoViolationsSettled(page);
            await attachShot(page, info, `axe-${route.id}-${view.name}-${theme}`);
          });
        }
      }
    });
  }
});

test.describe("T-F9-03: an unknown #/ route shows the Not found page", () => {
  const UNKNOWN = ["#/no-such-page", "#/missions/not-a-mission-id", "#/library/no-such-kind/x"];
  for (const hash of UNKNOWN) {
    test(`${hash} shows Not found`, async ({ page }, info) => {
      const errors = watchErrors(page);
      await page.goto(`/${hash}`);
      await expect(page.locator('[data-ui="Skeleton"]')).toHaveCount(0);
      await expect(page.locator("h1").first()).toHaveText(/Not found/);
      await expectNoViolationsSettled(page);
      expect(errors).toEqual([]);
      await attachShot(page, info, "not-found");
    });
  }
});
