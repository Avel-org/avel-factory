import { expect, test } from "@playwright/test";
import { attachShot } from "../support/page";
import { accessible, fillAndSubmit, OPERATOR, onLogin } from "./helpers";

test.describe("T-F12-07 · LG-22: Sign out from Settings", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows who is signed in, signs out to /login, and Back lands on /login too", async ({
    page,
  }, info) => {
    await page.goto("/login?next=%2F%23%2Fsettings");
    await onLogin(page);
    await fillAndSubmit(page, OPERATOR.password);
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.getByText(`Signed in as ${OPERATOR.email}`)).toBeVisible();
    await accessible(page);
    await attachShot(page, info, "sign-out-settings");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await onLogin(page);
    await expect(page.locator("nav.lib-nav")).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
    await onLogin(page);
    await expect(page.locator("nav.lib-nav")).toHaveCount(0);

    // The session is gone for good: the control room's own address sends you to Sign in.
    await page.goto("/");
    await onLogin(page);
    await attachShot(page, info, "sign-out-after");
  });
});
