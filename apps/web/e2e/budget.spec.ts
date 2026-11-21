import { type ChildProcess, execFile, spawn } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { MOCK_OPERATOR_ID } from "@avel/contract-mock";
import { expect, test } from "@playwright/test";
import { attachShot, expectNoViolations } from "./support/page";
import { PREVIEW_PORT } from "./support/ports";
import { PREVIEW_ENV, signInOnPreview } from "./support/preview-auth";

// E16 as changed by CR-W29 decision 6: at most 235 KB of JavaScript for /, a warning over
// 225 KB (T-F12 holds it to 235 KB, CR-W29 decision 6, second amendment). Measured on the production build, gzipped,
// for everything / loads before the Decisions home is interactive, scripts fetched after
// hydration included (the page is client-only, so the server's HTML names almost none).
// KB means 1024 bytes here, not 1000.
const LIMIT = 235 * 1024;
const WARN = 225 * 1024;

const root = join(import.meta.dirname, "..");

function run(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "pnpm",
      ["exec", ...args],
      { cwd: root, maxBuffer: 64 * 1024 * 1024 },
      (err, out, errOut) =>
        err
          ? reject(new Error(`pnpm exec ${args.join(" ")} failed:\n${out}\n${errOut}`))
          : resolve(out),
    );
  });
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

const STARTUP_MS = 60_000;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escape codes
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

/**
 * Starts `vite preview`. `onSpawn` gets the child at once, so the caller can kill it even if
 * startup never resolves. Resolves once the port shows in the output (colour codes stripped);
 * rejects if the child exits first or startup passes its own 60 s limit.
 */
function startPreview(onSpawn: (child: ChildProcess) => void): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "exec",
        "vite",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(PREVIEW_PORT),
        "--strictPort",
      ],
      { cwd: root, env: { ...process.env, ...PREVIEW_ENV } },
    );
    onSpawn(child);
    let seen = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`vite preview did not start within ${STARTUP_MS} ms:\n${seen}`));
    }, STARTUP_MS);
    const onData = (chunk: Buffer) => {
      seen += chunk.toString().replace(ANSI, "");
      if (seen.includes(`:${PREVIEW_PORT}`)) {
        clearTimeout(timer);
        resolve(child);
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

test.describe("T-F8-01: the production build (budget held to 220 KB under CR-W29)", () => {
  test.describe.configure({ timeout: 300_000 });
  let preview: ChildProcess | undefined;
  let ready: Promise<void> | undefined;
  // Each test awaits the same build and preview, so a failed build fails both tests.
  const ensureBuilt = () => {
    ready ??= (async () => {
      await run(["vite", "build"]);
      try {
        await startPreview((child) => {
          preview = child;
        });
      } catch (err) {
        preview?.removeAllListeners("exit");
        preview?.kill();
        throw err;
      }
    })();
    return ready;
  };

  test.afterAll(() => {
    preview?.removeAllListeners("exit");
    preview?.kill();
  });

  test("the JavaScript / loads before Decisions is interactive is at most 220 KB gzipped", async ({
    page,
    request,
  }) => {
    await ensureBuilt();
    const origin = `http://127.0.0.1:${PREVIEW_PORT}`;
    // T-F12-10: signed in on the preview's own mock, for the page and for the HTML read below.
    await signInOnPreview(page.request, origin);
    await signInOnPreview(request, origin);
    const html = await (await request.get(`${origin}/`)).text();

    const urls = new Set<string>();
    // What the browser really fetches: every script response, whoever asked for it.
    page.on("response", (r) => {
      if (r.request().resourceType() === "script") urls.add(r.url());
    });
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
    await expect(
      page.locator("nav.lib-nav[aria-label='Main']").filter({ visible: true }),
    ).toBeVisible();
    await expect(page.locator('[data-ui="FactoryPulse"]')).toBeVisible();
    await expect(page.locator("h1").first()).toContainText("Decisions");
    await expect(page.locator('[data-ui="DecisionsDashboard"]')).toBeVisible();

    const sizes: Array<[string, number]> = [];
    for (const url of urls) {
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
      sizes.push([url, gzipSync(await res.body()).length]);
    }
    const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].reduce(
      (sum, m) => sum + gzipSync(m[1] ?? "").length,
      0,
    );
    const total = sizes.reduce((sum, [, n]) => sum + n, 0) + inline;

    expect(sizes.length, "/ should load at least one script").toBeGreaterThan(0);
    // A client-only page fetches its app after the HTML: the control room is far past a stub.
    expect(total, "the control room's JS is more than a stub").toBeGreaterThan(50 * 1024);
    if (total > WARN) {
      test.info().annotations.push({
        type: "warning",
        description: `JS is ${total} B gzipped, over 200 KB`,
      });
      console.warn(`budget warning: ${total} B gzipped (over ${WARN})`);
    }
    expect(total, `gzipped JS: ${JSON.stringify(sizes)}`).toBeLessThanOrEqual(LIMIT);
    await page.emulateMedia({ reducedMotion: "reduce" }); // settled colours for axe (motion.css)
    await expectNoViolations(page);
    await attachShot(page, test.info(), "budget-decisions");
  });

  test("no built file contains the mock's operator id", async () => {
    await ensureBuilt();
    const files = filesUnder(join(root, "dist"));
    expect(files.length, "dist has files").toBeGreaterThan(0);
    const leaks = files.filter((f) => readFileSync(f).includes(MOCK_OPERATOR_ID));
    expect(leaks).toEqual([]);
  });
});
