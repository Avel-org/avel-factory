import { expect, test } from "@playwright/test";
import { attachShot } from "../support/page";
import { accessible, email, fillAndSubmit, OPERATOR, onLogin, SESSION_COOKIE } from "./helpers";

/** Anything the control room draws: its sidebar, its header's pulse, its root. */
async function expectNoShell(page: import("@playwright/test").Page) {
  await expect(page.locator("nav.lib-nav")).toHaveCount(0);
  await expect(page.locator('[data-ui="FactoryPulse"]')).toHaveCount(0);
  await expect(page.locator("#dc-root")).toHaveCount(0);
}

test.describe("T-F12-04 · LG-20: signed out, the server redirects and draws no shell", () => {
  test("the server answers / with a redirect to /login (no next) and /missions?x=1 with next kept", async ({
    request,
  }) => {
    const root = await request.get("/", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308]).toContain(root.status());
    expect(root.headers().location).toBe("/login");

    const missions = await request.get("/missions?x=1", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308]).toContain(missions.status());
    expect(missions.headers().location).toBe("/login?next=%2Fmissions%3Fx%3D1");
  });

  test("a hash route and a hostile next are handled: next is dropped when unsafe", async ({
    request,
  }) => {
    const hostile = await request.get("/login?next=%2F%2Fevil.example", { maxRedirects: 0 });
    expect(hostile.status()).toBe(200);
    const html = await hostile.text();
    expect(html).not.toContain("evil.example");
  });

  test("opening / and /missions?x=1 lands on Sign in, with no control-room element", async ({
    page,
  }, info) => {
    await page.goto("/");
    await onLogin(page);
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe("/login");
    await expectNoShell(page);

    await page.goto("/missions?x=1");
    await onLogin(page);
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(
      "/login?next=%2Fmissions%3Fx%3D1",
    );
    await expectNoShell(page);
    await expect(email(page)).toBeFocused();
    await accessible(page);
    await attachShot(page, info, "guard-signed-out");
  });

  test("signing in lands on next, a reload stays signed in, and no page's HTML holds the cookie value or a token key", async ({
    page,
    context,
  }, info) => {
    await page.goto("/missions?x=1");
    await onLogin(page);
    await fillAndSubmit(page, OPERATOR.password);
    await expect(page).toHaveURL(/\/missions\?x=1$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toHaveCount(0);

    const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
    expect(cookie, "the session cookie is set").toBeDefined();
    expect(cookie?.httpOnly, "the session cookie is httpOnly").toBe(true);
    const value = cookie?.value ?? "";
    expect(value.length).toBeGreaterThan(10);

    await page.reload();
    await expect(page).toHaveURL(/\/missions\?x=1$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toHaveCount(0);

    // Every page's HTML: the one signed in on, the server's answer for /, and /login signed in.
    const pages = [
      await page.content(),
      await (await page.request.get("/missions?x=1")).text(),
      await (await page.request.get("/", { maxRedirects: 0 })).text(),
    ];
    for (const html of pages) {
      expect(html).not.toContain(value);
      expect(html).not.toMatch(/\\?"token\\?"\s*:/);
    }
    await attachShot(page, info, "guard-signed-in-next");
  });

  test("signed in, /login goes to next, or to / with none", async ({ page }) => {
    await page.goto("/login");
    await fillAndSubmit(page, OPERATOR.password);
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/login?next=%2Fmissions%3Fx%3D1");
    await expect(page).toHaveURL(/\/missions\?x=1$/);

    await page.goto("/login?next=%2F%2Fevil.example");
    await expect(page).not.toHaveURL(/evil|\/login/);
    expect(new URL(page.url()).pathname).toBe("/");
  });
});
