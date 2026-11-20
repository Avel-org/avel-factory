import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { expectNoViolationsSettled, watchErrors } from "../control-room/support";
import { attachShot } from "../support/page";

/**
 * T-F10-04: agent, client and Canon text is untrusted and renders as text, never as HTML.
 *
 * The sample world must hold a string with <b>, <script> and a markdown link with javascript:
 * in each place the rule matters: an agent trail step, a Canon message and a Library entry.
 * The test finds that string in the shipped sample world, opens the page that shows it, and
 * checks the page shows its literal characters and made no element or script from it.
 */
const MOCK = join(import.meta.dirname, "..", "..", "control-room", "src", "mock");
const read = (file: string) => JSON.parse(readFileSync(join(MOCK, file), "utf8"));

const holdsPayload = (s: unknown): s is string =>
  typeof s === "string" &&
  s.includes("<b>") &&
  s.includes("<script>") &&
  /\]\(javascript:/i.test(s);

interface Hit {
  path: (string | number)[];
  text: string;
}
function find(value: unknown, path: (string | number)[] = []): Hit[] {
  if (holdsPayload(value)) return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => find(v, [...path, i]));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => find(v, [...path, k]));
  return [];
}

interface Sink {
  id: string;
  /** The first sample-world string that holds the payload, and the route that shows it. */
  locate: () => { hit: Hit | undefined; hash: string };
  open?: (page: Page) => Promise<void>;
}

const SINKS: Sink[] = [
  {
    id: "an agent trail step",
    locate: () => {
      const hit = find(read("operations.json").moduleRuns).find((h) => h.path.includes("steps"));
      // moduleRuns.<mission>.<module>.attempts[i].steps[j].text
      return { hit, hash: hit ? `#/missions/${hit.path[0]}/modules/${hit.path[1]}` : "#/" };
    },
    open: async (page) => {
      // finished tries fold away: open every one
      for (const b of await page.locator('main button[aria-expanded="false"]').all()) {
        if (await b.isVisible()) await b.click();
      }
    },
  },
  {
    id: "a Canon message",
    locate: () => {
      const onboarding = read("onboarding.json");
      for (const [mission, session] of Object.entries(onboarding)) {
        const hit = find((session as { messages?: unknown }).messages)[0];
        if (hit)
          return {
            hit: { ...hit, path: [mission, "messages", ...hit.path] },
            hash: `#/missions/${mission}/onboarding`,
          };
      }
      return { hit: undefined, hash: "#/" };
    },
  },
  {
    id: "a Library entry",
    locate: () => {
      const entries = read("library.json").entries as { kind: string; slug: string }[];
      const i = entries.findIndex((e) => find(e).length > 0);
      const hit = i >= 0 ? find(entries[i])[0] : undefined;
      return { hit, hash: i >= 0 ? `#/library/${entries[i]?.kind}/${entries[i]?.slug}` : "#/" };
    },
  },
];

for (const sink of SINKS) {
  test.describe(`T-F10-04: ${sink.id} shows <b>, <script> and a javascript: link as text`, () => {
    test("the sample world holds the payload", () => {
      const { hit } = sink.locate();
      expect(
        hit,
        `no sample-world string for ${sink.id} holds <b>, <script> and ](javascript:`,
      ).toBeDefined();
    });

    test("it renders as literal text and nothing executes", async ({ page }, info) => {
      const { hit, hash } = sink.locate();
      expect(hit, "the sample world holds the payload").toBeDefined();
      const errors = watchErrors(page);
      let dialogs = 0;
      page.on("dialog", (d) => {
        dialogs += 1;
        void d.dismiss();
      });
      await page.goto(`/${hash}`);
      await expect(page.locator('[data-ui="Skeleton"]')).toHaveCount(0);
      await expect(page.locator("h1").first()).toBeVisible();
      await sink.open?.(page);

      // the literal characters are on screen
      const text = await page.locator("main").innerText();
      expect(text).toContain("<b>");
      expect(text).toContain("<script>");
      expect(text).toContain("](javascript:");
      // and they are text nodes: escaped in the markup, with no element made from them
      const html = await page.locator("main").innerHTML();
      expect(html).toContain("&lt;b&gt;");
      expect(html).toContain("&lt;script&gt;");
      await expect(page.locator("main script")).toHaveCount(0);
      await expect(page.locator('main a[href^="javascript:" i]')).toHaveCount(0);
      const markup = await page.evaluate(
        () =>
          [...document.querySelectorAll("main b")].filter((b) =>
            /<script>|javascript:/i.test(b.parentElement?.textContent ?? ""),
          ).length,
      );
      expect(markup, "a <b> element made from the payload").toBe(0);
      // nothing ran
      expect(
        await page.evaluate(() => Object.keys(window).filter((k) => k.startsWith("__xss"))),
      ).toEqual([]);
      expect(dialogs).toBe(0);
      expect(errors).toEqual([]);
      await expectNoViolationsSettled(page);
      await attachShot(page, info, `untrusted-${sink.id.replace(/\W+/g, "-")}`);
    });
  });
}
