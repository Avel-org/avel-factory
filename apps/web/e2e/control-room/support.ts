import { expect, type Page } from "@playwright/test";

export const DESKTOP = { width: 1280, height: 800 };

/** Collects page errors and console errors from the moment it is called. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // A browser's own favicon request is not the app's error.
    if (/favicon/i.test(m.location().url)) return;
    errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

/** The control room has booted: its header and the first page's title are on screen. */
export async function booted(page: Page, title = "Decisions") {
  // .lib-nav is the export's own sidebar; apps/web's old shell had none.
  await expect(page.locator("nav.lib-nav[aria-label='Main']")).toBeVisible();
  // The export's own header (its factory pulse) is on every page; the old shell had none.
  await expect(page.locator('[data-ui="FactoryPulse"]')).toBeVisible();
  await expect(page.locator("h1").first()).toContainText(title);
}
