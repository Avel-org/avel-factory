import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { attachShot, visibleText } from "../support/page";
import { booted, DESKTOP, expectNoViolationsSettled, watchErrors } from "./support";

test.describe("T-F7-04: / boots the export", () => {
  test.use({ viewport: DESKTOP });

  test("the sidebar, the header and the Decisions home render, with no error", async ({
    page,
  }, info) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await booted(page, "Decisions");
    await expect(page.getByRole("navigation", { name: "Top bar" })).toBeVisible();
    expect(page.url()).not.toContain("/_shell");
    await expectNoViolationsSettled(page);
    expect(await visibleText(page)).not.toContain("$");
    expect(errors).toEqual([]);
    await attachShot(page, info, "control-room-decisions-1280");
  });

  test("the page is client-rendered, with a skeleton until the app boots (ssr: false)", async ({
    page,
    request,
  }, info) => {
    const html = await (await request.get("/")).text();
    expect(html, "the server's HTML carries no Decisions home").not.toContain(
      'data-ui="DecisionsDashboard"',
    );
    await page.goto("/");
    await booted(page);
    await expectNoViolationsSettled(page);
    await attachShot(page, info, "control-room-booted");
  });

  test("/ loads the export's stylesheets (as many as main.jsx imports) and not T-F1's app.css or tokens.css", async ({
    page,
  }, info) => {
    await page.goto("/");
    await booted(page);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll("style[data-vite-dev-id], link[rel=stylesheet]")].map(
        (el) => el.getAttribute("data-vite-dev-id") ?? el.getAttribute("href") ?? "",
      ),
    );
    const imported = readFileSync(
      join(import.meta.dirname, "../../control-room/src/main.jsx"),
      "utf8",
    ).match(/^import\s+["']\.\/styles\/[^"']+\.css["'];?$/gm);
    const expected = imported?.length ?? 0;
    expect(expected, "main.jsx imports the export's stylesheets").toBeGreaterThan(0);
    const exportSheets = ids.filter((id) => /control-room\/src\/styles\/[^/]+\.css/.test(id));
    expect(exportSheets.length, "every stylesheet main.jsx imports is loaded").toBeGreaterThanOrEqual(
      expected,
    );
    // T-F1's tokens.css and app.css stay in the repo but / doesn't load them.
    expect(ids.filter((id) => /src\/styles\/(app|tokens)\.css/.test(id))).toEqual([]);
    await expectNoViolationsSettled(page);
    await attachShot(page, info, "control-room-styles");
  });
});
