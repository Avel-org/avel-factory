import { expect, test } from "@playwright/test";
import { attachShot } from "../support/page";
import {
  accessible,
  COPY,
  email,
  fillAndSubmit,
  OPERATOR,
  onLogin,
  password,
  submit,
} from "./helpers";

const VIEWS = [
  { name: "390", width: 390, height: 844 },
  { name: "1280", width: 1280, height: 800 },
] as const;

// Each combination fails sign-in once on the shared mock: four in all, under its 10-failure lockout.
for (const view of VIEWS) {
  for (const theme of ["light", "night"] as const) {
    test.describe(`T-F12-05 · LG-21: ${view.name} ${theme}`, () => {
      test.use({ viewport: { width: view.width, height: view.height } });

      test("a wrong password's alert, then the right one", async ({ page, context }, info) => {
        await context.addCookies([
          { name: "avel-theme", value: theme, url: info.project.use.baseURL ?? "http://127.0.0.1" },
        ]);
        await page.goto("/login");
        await onLogin(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await accessible(page);
        await attachShot(page, info, `login-${view.name}-${theme}-empty`);

        await fillAndSubmit(page, "not-the-password");
        await expect(page.getByRole("alert")).toHaveText(COPY.mismatch);
        await expect(password(page)).toBeFocused();
        await accessible(page);
        await attachShot(page, info, `login-${view.name}-${theme}-alert`);

        await password(page).fill(OPERATOR.password);
        await submit(page).click();
        await expect(page).toHaveURL((url) => url.pathname === "/");
        await expect(page.getByRole("heading", { name: "Sign in" })).toHaveCount(0);
      });

      test("no sideways scroll", async ({ page }) => {
        await page.goto("/login");
        await onLogin(page);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}

test.describe("T-F12-05 · LG-21: at 390 the fields and the button are 44px tall", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Email, Password and the Sign in button", async ({ page }, info) => {
    await page.goto("/login");
    await onLogin(page);
    for (const control of [email(page), password(page), submit(page)]) {
      const box = await control.boundingBox();
      expect(box?.height).toBeCloseTo(44, 0);
    }
    const button = await submit(page).boundingBox();
    const card = await page.locator("form").boundingBox();
    expect(button?.width, "full width at 760px and narrower").toBeCloseTo(card?.width ?? 0, 0);
    await attachShot(page, info, "login-390-targets");
  });
});
