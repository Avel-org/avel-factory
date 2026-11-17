import { expect, test } from "@playwright/test";
import { attachShot, expectNoViolations, textOfHtml, visibleText } from "./support/page";
import { BARE_PORT } from "./support/ports";

// The second dev server has no mock behind /api, so route 52 can't be read: the error state.
const bare = `http://127.0.0.1:${BARE_PORT}`;

test.describe("T-F1-06/08/09: the error state, in the browser", () => {
  test("shows the alert and a Try again that asks route 52 again", async ({ page }, info) => {
    await page.goto(bare);
    await expect(page.getByRole("heading", { level: 1, name: "Decisions" })).toBeVisible();
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Couldn't load your decisions.");
    await expect(page.getByText("Nothing needs you")).toHaveCount(0);
    await expect(page.getByText(/\d\+? waiting/)).toHaveCount(0);
    expect(await visibleText(page)).not.toContain("$");
    await expectNoViolations(page);
    await attachShot(page, info, "error");

    const asked = page.waitForRequest((r) => r.url().includes("/api/pending-decisions"));
    await page.getByRole("button", { name: "Try again" }).click();
    await asked;
  });

  test("the error is in the server's HTML too", async ({ request }) => {
    const html = await (await request.get(bare)).text();
    expect(html).toMatch(/role="alert"/);
    expect(textOfHtml(html)).toContain("Couldn't load your decisions.");
    expect(textOfHtml(html)).toContain("Try again");
  });
});
