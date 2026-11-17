import { expect, type Page } from "@playwright/test";

export const DESKTOP = { width: 1280, height: 800 };
export const NARROW = { width: 900, height: 800 };
export const PHONE = { width: 390, height: 844 };

export const SHELL = '[data-ui="AppShell"]';
export const hydrated = (page: Page) => page.locator(`${SHELL}[data-hydrated]`);

export type Box = { x: number; y: number; width: number; height: number };

/** The drawn box of the first match, or a failure that says which selector had none. */
export async function boxOf(page: Page, selector: string): Promise<Box> {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`no box for ${selector}`);
  return box;
}

/** The scroller around the page: the first ancestor of the h1 that scrolls vertically. */
export async function canvasStyle(page: Page) {
  return page.evaluate(() => {
    let el: HTMLElement | null = document.querySelector("h1");
    while (el && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && el !== document.body) {
        const r = el.getBoundingClientRect();
        return {
          found: true,
          radius: cs.borderTopLeftRadius,
          shadow: cs.boxShadow,
          overscroll: cs.overscrollBehaviorY,
          scrollPaddingTop: cs.scrollPaddingTop,
          marginTop: cs.marginTop,
          marginRight: cs.marginRight,
          marginBottom: cs.marginBottom,
          marginLeft: cs.marginLeft,
          background: cs.backgroundColor,
          backgroundImage: cs.backgroundImage,
          left: r.left,
          top: r.top,
          right: window.innerWidth - r.right,
          bottom: window.innerHeight - r.bottom,
        };
      }
      el = el.parentElement;
    }
    return { found: false } as const;
  });
}

/** The progress line's scaleX, from its computed transform. */
export async function progressOf(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector(".lib-progress");
    if (!el) return Number.NaN;
    const t = getComputedStyle(el).transform;
    if (t === "none") return 1;
    const m = /matrix\(([^,]+),/.exec(t);
    return m ? Number(m[1]) : Number.NaN;
  });
}

/** Make the page long enough to scroll, without touching the app's own markup. */
export async function addTallSpacer(page: Page) {
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.setAttribute("data-test-spacer", "");
    spacer.style.height = "3000px";
    (document.querySelector("main") ?? document.body).append(spacer);
  });
}

export async function expectNoSideScroll(page: Page) {
  const w = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(w.scroll).toBeLessThanOrEqual(w.client);
}

export function near(a: Box, b: Box, label: string) {
  for (const k of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(a[k] - b[k]), `${label}: ${k} moved (${a[k]} -> ${b[k]})`).toBeLessThanOrEqual(
      1,
    );
  }
}
