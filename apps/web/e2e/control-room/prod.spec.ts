import { type ChildProcess, execFile, spawn } from "node:child_process";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { attachShot } from "../support/page";
import { PREVIEW_PORT } from "../support/ports";
import { booted, DESKTOP, expectNoViolationsSettled, watchErrors } from "./support";

// T-F7-07: in a production build the Prototype dock and viewport preview don't render,
// and nothing of OSA shows without ?osa=1. Serves its own build on a port of its own.
const root = join(import.meta.dirname, "..", "..");
const PORT = PREVIEW_PORT + 1;
const origin = `http://127.0.0.1:${PORT}`;
// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

function build(): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "pnpm",
      ["exec", "vite", "build"],
      { cwd: root, maxBuffer: 64 * 1024 * 1024 },
      (err, out, e) => (err ? reject(new Error(`vite build failed:\n${out}\n${e}`)) : resolve()),
    );
  });
}

function preview(onSpawn: (c: ChildProcess) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
      { cwd: root, env: { ...process.env, AVEL_API: "", NO_COLOR: "1", FORCE_COLOR: "0" } },
    );
    onSpawn(child);
    let seen = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`vite preview did not start:\n${seen}`));
    }, 60_000);
    const onData = (b: Buffer) => {
      seen += b.toString().replace(ANSI, "");
      if (seen.includes(`:${PORT}`)) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`vite preview exited (${code}):\n${seen}`));
    });
  });
}

test.describe("T-F7-07: the production build hides the prototype dock and OSA", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({ viewport: DESKTOP });
  let child: ChildProcess | undefined;
  let ready: Promise<void> | undefined;
  const ensure = () => {
    ready ??= (async () => {
      await build();
      try {
        await preview((c) => {
          child = c;
        });
      } catch (err) {
        child?.removeAllListeners("exit");
        child?.kill();
        throw err;
      }
    })();
    return ready;
  };
  test.afterAll(() => {
    child?.removeAllListeners("exit");
    child?.kill();
  });

  test("no dock and no viewport preview, and nothing of OSA", async ({ page }, info) => {
    await ensure();
    const errors = watchErrors(page);
    await page.goto(`${origin}/`);
    await booted(page);
    await expect(page.locator('[data-ui="SimPanel"]')).toHaveCount(0);
    await expect(page.locator(".cr-dock")).toHaveCount(0);
    await expect(page.getByLabel("Prototype controls")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Prototype/ })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Viewport preview" })).toHaveCount(0);
    await expect(page.locator(".cr-vp")).toHaveCount(0);
    await expect(page.locator('[data-ui="OsaBar"]')).toHaveCount(0);
    await expect(page.getByLabel("OSA, your operator agent")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/\bOSA\b/);
    await expectNoViolationsSettled(page);
    expect(errors).toEqual([]);
    await attachShot(page, info, "prod-no-dock");
  });

  test("the OSA flag shows OSA, and the dock stays out of the production build", async ({
    page,
  }, info) => {
    await ensure();
    await page.goto(`${origin}/?osa=1#/`);
    await booted(page);
    await expect(page.locator('[data-ui="OsaBar"]')).toBeVisible();
    await expect(page.locator('[data-ui="SimPanel"]')).toHaveCount(0);
    await expect(page.locator(".cr-vp")).toHaveCount(0);
    await expectNoViolationsSettled(page);
    await attachShot(page, info, "prod-osa-flag");
  });
});
