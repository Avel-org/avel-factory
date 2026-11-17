import { type ChildProcess, execFile, spawn } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { MOCK_OPERATOR_ID } from "@avel/contract-mock";
import { expect, test } from "@playwright/test";
import { PREVIEW_PORT } from "./support/ports";

// E16: at most 150 KB of JavaScript for the route, a warning over 130 KB. Measured on the
// production build, gzipped, for what the server's HTML for / loads or preloads.
// KB means 1024 bytes here, not 1000.
const LIMIT = 150 * 1024;
const WARN = 130 * 1024;

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

/** Resolves once `vite preview` prints its Local URL; rejects if it exits first. */
function startPreview(): Promise<ChildProcess> {
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
      { cwd: root, env: { ...process.env, AVEL_API: "" } },
    );
    let seen = "";
    const onData = (chunk: Buffer) => {
      seen += chunk.toString();
      if (seen.includes(`:${PREVIEW_PORT}`)) resolve(child);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", (c: Buffer) => {
      seen += c.toString();
    });
    child.on("exit", (code) => reject(new Error(`vite preview exited (${code}):\n${seen}`)));
  });
}

test.describe("T-F1-11: the production build", () => {
  test.describe.configure({ timeout: 300_000 });
  let preview: ChildProcess | undefined;
  let ready: Promise<void> | undefined;
  // Each test awaits the same build and preview, so a failed build fails both tests.
  const ensureBuilt = () => {
    ready ??= (async () => {
      await run(["vite", "build"]);
      preview = await startPreview();
    })();
    return ready;
  };

  test.afterAll(() => {
    preview?.removeAllListeners("exit");
    preview?.kill();
  });

  test("the JavaScript / loads is at most 150 KB gzipped", async ({ page, request }) => {
    await ensureBuilt();
    const origin = `http://127.0.0.1:${PREVIEW_PORT}`;
    const html = await (await request.get(`${origin}/`)).text();

    const urls = new Set<string>();
    const add = (href: string) => urls.add(new URL(href, `${origin}/`).href);
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) add(m[1] ?? "");
    for (const m of html.matchAll(/<link\b[^>]*>/g)) {
      const tag = m[0];
      const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
      if (
        href &&
        (/rel="modulepreload"/.test(tag) || (/rel="preload"/.test(tag) && /as="script"/.test(tag)))
      )
        add(href);
    }
    for (const m of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      for (const u of (m[1] ?? "").matchAll(/["'`](\/[^"'`\s]+\.m?js)["'`]/g)) add(u[1] ?? "");
    }
    // What the browser really fetches, too (static imports of the entry chunk).
    page.on("response", (r) => {
      if (r.request().resourceType() === "script") urls.add(r.url());
    });
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });

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

    expect(sizes.length, "the HTML should load at least one script").toBeGreaterThan(0);
    if (total > WARN) {
      test.info().annotations.push({
        type: "warning",
        description: `JS is ${total} B gzipped, over 130 KB`,
      });
      console.warn(`budget warning: ${total} B gzipped (over ${WARN})`);
    }
    expect(total, `gzipped JS: ${JSON.stringify(sizes)}`).toBeLessThanOrEqual(LIMIT);
  });

  test("no built file contains the mock's operator id", async () => {
    await ensureBuilt();
    const files = filesUnder(join(root, "dist"));
    expect(files.length, "dist has files").toBeGreaterThan(0);
    const leaks = files.filter((f) => readFileSync(f).includes(MOCK_OPERATOR_ID));
    expect(leaks).toEqual([]);
  });
});
