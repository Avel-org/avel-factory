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

// T-F12-03 · LG-02 and LG-04. login.md section 7 lists these as jsdom unit tests, but apps/web has no
// jsdom or testing library and this ticket may not add a dependency (apps/web/package.json is locked).
// So they run in the browser, with /api/auth/sign-in/email answered by page.route, and `page.clock`
// fixing now. Nothing waits on the wall clock: every wait is on a promise or an assertion.
test.use({ timezoneId: "UTC" });

const SIGN_IN = "**/api/auth/sign-in/email";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-20T13:55:00Z"));
  await page.goto("/login");
  await onLogin(page);
});

test.describe("T-F12-03: the submit states", () => {
  test("an empty field sends no request, names the first empty field and focuses it", async ({
    page,
  }, info) => {
    let requests = 0;
    await page.route(SIGN_IN, (route) => {
      requests++;
      return route.abort();
    });
    await submit(page).click();
    await expect(page.getByRole("alert")).toHaveText(COPY.empty);
    await expect(email(page)).toBeFocused();
    await expect(email(page)).toHaveAttribute("aria-invalid", "true");

    await email(page).fill(OPERATOR.email);
    await submit(page).click();
    await expect(page.getByRole("alert")).toHaveText(COPY.empty);
    await expect(password(page)).toBeFocused();
    await expect(password(page)).toHaveAttribute("aria-invalid", "true");
    expect(requests).toBe(0);
    await accessible(page);
    await attachShot(page, info, "submit-empty");
  });

  test("while busy the button says Signing in…, and a second submit sends no second request", async ({
    page,
  }, info) => {
    let requests = 0;
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(SIGN_IN, async (route) => {
      requests++;
      await held;
      await route.fulfill({ status: 401, json: { code: "INVALID_EMAIL_OR_PASSWORD" } });
    });
    await email(page).fill(OPERATOR.email);
    await password(page).fill("whatever");
    await submit(page).click();
    await expect(page.getByRole("button", { name: "Signing in…" })).toBeVisible();
    await password(page).press("Enter");
    await attachShot(page, info, "submit-busy");
    release();
    await expect(page.getByRole("alert")).toHaveText(COPY.mismatch);
    expect(requests).toBe(1);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("401: its copy, Password cleared and focused, Email kept, aria-invalid on both", async ({
    page,
  }, info) => {
    await page.route(SIGN_IN, (route) =>
      route.fulfill({ status: 401, json: { code: "INVALID_EMAIL_OR_PASSWORD" } }),
    );
    await fillAndSubmit(page, "wrong-password");
    await expect(page.getByRole("alert")).toHaveText(COPY.mismatch);
    await expect(password(page)).toHaveValue("");
    await expect(password(page)).toBeFocused();
    await expect(email(page)).toHaveValue(OPERATOR.email);
    await expect(email(page)).toHaveAttribute("aria-invalid", "true");
    await expect(password(page)).toHaveAttribute("aria-invalid", "true");
    await accessible(page);
    await attachShot(page, info, "submit-401");
  });

  test("429 with X-Retry-After 600 at 13:55 says to try again after 14:05, keeps both fields, button enabled", async ({
    page,
  }, info) => {
    await page.route(SIGN_IN, (route) =>
      route.fulfill({
        status: 429,
        headers: { "x-retry-after": "600" },
        json: { code: "TOO_MANY_ATTEMPTS" },
      }),
    );
    await fillAndSubmit(page, "hunter2");
    await expect(page.getByRole("alert")).toHaveText("Too many attempts. Try again after 14:05.");
    await expect(email(page)).toHaveValue(OPERATOR.email);
    await expect(password(page)).toHaveValue("hunter2");
    await expect(submit(page)).toBeEnabled();
    await accessible(page);
    await attachShot(page, info, "submit-429-time");
  });

  test("429 without X-Retry-After says to try again later", async ({ page }, info) => {
    await page.route(SIGN_IN, (route) =>
      route.fulfill({ status: 429, json: { code: "TOO_MANY_ATTEMPTS" } }),
    );
    await fillAndSubmit(page, "hunter2");
    await expect(page.getByRole("alert")).toHaveText(COPY.later);
    await expect(password(page)).toHaveValue("hunter2");
    await expect(submit(page)).toBeEnabled();
    await attachShot(page, info, "submit-429-later");
  });

  test("a 500 and a rejected fetch both say Couldn't sign in, and keep both fields", async ({
    page,
  }, info) => {
    await page.route(SIGN_IN, (route) => route.fulfill({ status: 500, body: "boom" }));
    await fillAndSubmit(page, "hunter2");
    await expect(page.getByRole("alert")).toHaveText(COPY.generic);
    await expect(email(page)).toHaveValue(OPERATOR.email);
    await expect(password(page)).toHaveValue("hunter2");

    await page.unroute(SIGN_IN);
    await page.route(SIGN_IN, (route) => route.abort("connectionrefused"));
    await submit(page).click();
    await expect(page.getByRole("alert")).toHaveText(COPY.generic);
    await expect(password(page)).toHaveValue("hunter2");
    await expect(submit(page)).toBeEnabled();
    await accessible(page);
    await attachShot(page, info, "submit-500");
  });

  test("the page draws no sign-up link, forgot-password link or remember-me box", async ({
    page,
  }) => {
    await expect(page.getByRole("link")).toHaveCount(0);
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page).toHaveTitle("Sign in · AVEL");
  });
});
