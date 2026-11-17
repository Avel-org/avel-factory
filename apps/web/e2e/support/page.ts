import { world } from "@avel/contract-mock";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

export const THEMES = ["light", "night"] as const;
export type Theme = (typeof THEMES)[number];

export const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** How many decisions `createMock({ world: true })` lists on route 52's first page. */
export const WORLD_COUNT = world.DECISIONS.length;

export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** E17: no WCAG 2.2 AA violation. */
export async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => n.target.join(" ")),
  }));
  expect(summary, "axe-core WCAG 2.2 AA violations").toEqual([]);
}

/** F6: a screenshot attached to the report (the config also records one per test). */
export async function attachShot(page: Page, info: TestInfo, name: string) {
  await info.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}

/** The text a reader gets from server HTML: scripts, styles and comments dropped, tags removed. */
export function textOfHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<head\b[\s\S]*?<\/head>/i, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** What a reader sees on the page: the body's rendered text (scripts and styles excluded). */
export async function visibleText(page: Page): Promise<string> {
  return (await page.locator("body").allInnerTexts()).join("\n");
}
