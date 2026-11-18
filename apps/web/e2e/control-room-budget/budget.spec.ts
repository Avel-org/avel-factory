import { gzipSync } from "node:zlib";
import { expect, type Page, test } from "@playwright/test";
import { attachShot, expectNoViolations } from "../support/page";
import { ORIGIN, productionPreview } from "./preview";

// T-F8: (the 150 KB limit itself is held by e2e/budget.spec.ts) every other page loads its own code when it
// opens (E16, CR-W29 decision 6). Measured on the production build, gzipped. KB is 1024 bytes.
const LIMIT = 150 * 1024;
const SPRING_LAUNCH = "01a1912f-ee80-709f-891e-7d29547e91a0"; // a running mission in the mock world

const preview = productionPreview();

/** Records every script the browser fetches, in order, with its response body's gzipped size. */
function watchScripts(page: Page) {
  const seen = new Map<string, number>();
  const pending: Array<Promise<void>> = [];
  page.on("response", (r) => {
    if (r.request().resourceType() !== "script") return;
    pending.push(
      r
        .body()
        .then((b) => {
          seen.set(r.url(), gzipSync(b).length);
        })
        .catch(() => {
          seen.set(r.url(), 0);
        }),
    );
  });
  return {
    async settled() {
      await Promise.all(pending);
      return new Map(seen);
    },
  };
}

async function idle(page: Page) {
  await page.waitForLoadState("networkidle");
}

test.describe("T-F8: first load budget and a script per page", () => {
  test.describe.configure({ timeout: 300_000 });
  test.afterAll(() => preview.stop());

  test("T-F8-02: Library, Live and a project's Progress each fetch their own script the first time", async ({
    page,
  }, info) => {
    await preview.ensure();
    const scripts = watchScripts(page);
    await page.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
    await expect(page.locator('[data-ui="DecisionsDashboard"]')).toBeVisible();
    let known = new Set((await scripts.settled()).keys());

    const targets = [
      { hash: "#/library", h1: "Library", text: /Library/ },
      { hash: "#/live", h1: "Live", text: /Live/ },
      { hash: `#/missions/${SPRING_LAUNCH}`, h1: "Spring launch site", text: /Spring launch site/ },
    ];
    const bodies: string[] = [];
    for (const t of targets) {
      await page.evaluate((h) => {
        location.hash = h.slice(1);
      }, t.hash);
      await expect(page.locator("h1").first()).toContainText(t.h1);
      await idle(page);
      const now = await scripts.settled();
      const fresh = [...now.keys()].filter((u) => !known.has(u));
      expect(fresh.length, `${t.hash} fetched no script of its own the first time`).toBeGreaterThan(
        0,
      );
      known = new Set(now.keys());
      const body = await page.locator("main#cr-main").innerText();
      expect(body, `${t.hash} rendered nothing`).toMatch(t.text);
      expect(body.length, `${t.hash} rendered almost nothing`).toBeGreaterThan(40);
      bodies.push(body);
      // A page that loaded must not hang on its skeleton.
      await expect(page.locator('[data-ui="Skeleton"]')).toHaveCount(0);
    }

    // Opening a page a second time fetches nothing new: its code is already loaded.
    await page.evaluate(() => {
      location.hash = "/library";
    });
    await expect(page.locator("h1").first()).toContainText("Library");
    await idle(page);
    const again = await scripts.settled();
    expect([...again.keys()].filter((u) => !known.has(u))).toEqual([]);
    expect(await page.locator("main#cr-main").innerText()).toBe(bodies[0]);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectNoViolations(page);
    await attachShot(page, info, "budget-pages-library");
  });

  test.describe("T-F8-03: a phone on slow 4G", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("the first decision card is visible within the first load", async ({
      page,
      context,
    }, info) => {
      await preview.ensure();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
      const scripts = watchScripts(page);
      await page.goto(`${ORIGIN}/`, { waitUntil: "commit" });
      const card = page.locator('[data-ui="DecisionHero"]').first();
      await expect(card).toBeVisible({ timeout: 30_000 });
      // What the browser had fetched by the time the card showed: that is the first load.
      const sizes = await scripts.settled();
      const total = [...sizes.values()].reduce((a, b) => a + b, 0);
      expect(
        total,
        `JS fetched before the first card: ${JSON.stringify([...sizes])}`,
      ).toBeLessThanOrEqual(LIMIT);
      await idle(page);
      const after = await scripts.settled();
      // Nothing for another page came along with it.
      expect(
        [...after.values()].reduce((a, b) => a + b, 0),
        "scripts fetched by the time the page went idle",
      ).toBeLessThanOrEqual(LIMIT);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expectNoViolations(page);
      await attachShot(page, info, "budget-phone-slow4g");
    });
  });
});
