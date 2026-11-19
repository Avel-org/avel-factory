import { expect, test } from "@playwright/test";
import { expectNoViolationsSettled, watchErrors } from "../control-room/support";
import { ROUTES } from "../control-room-screens/routes";
import { attachShot } from "../support/page";

/**
 * T-F10-03 (E15): no page of the control room shows a '$'. Code, pre and kbd are the one
 * exception ("$" in code is a shell prompt, not money). Run with the OSA flag on and every
 * decision kind showing, and with OSA off, because OSA's text is part of what a page can show.
 */
const QUERIES = ["?osa=1&sim=every", "?osa=0"];

for (const query of QUERIES) {
  test.describe(`T-F10-03: no '$' on any route (${query})`, () => {
    for (const route of ROUTES) {
      test(`${route.id} (${route.hash})`, async ({ page }, info) => {
        const errors = watchErrors(page);
        await page.goto(`/${query}${route.hash}`);
        await expect(page.locator('[data-ui="Skeleton"]')).toHaveCount(0);
        await expect(page.locator("h1").first()).toBeVisible();
        const text = await page.evaluate(() => {
          const clone = document.body.cloneNode(true) as HTMLElement;
          for (const x of clone.querySelectorAll("code, pre, kbd, script, style")) x.remove();
          return { prose: clone.textContent ?? "", all: document.body.innerText };
        });
        expect(text.prose.match(/.{0,30}\$.{0,20}/g) ?? [], "prose holding a '$'").toEqual([]);
        expect(/\$\s?\d|\bUSD\b/.test(text.all), "a dollar amount or USD anywhere").toBe(false);
        await expectNoViolationsSettled(page);
        expect(errors).toEqual([]);
        await attachShot(page, info, `no-money-${route.id}`);
      });
    }
  });
}
