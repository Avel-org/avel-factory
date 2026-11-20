/**
 * The server's entry point loads and serves, run the way the package runs it: `node
 * --experimental-strip-types src/main.ts` (package.json's `dev`). Vitest and tsc both accept
 * TypeScript that Node's type stripping refuses, so only a real start catches it (t-b16-rigg-01:
 * a parameter property in onboarding/clients/operator.ts stopped main.ts from loading at all).
 */
import { type ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const serverDir = fileURLToPath(new URL("../../", import.meta.url));

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });

let child: ChildProcess | undefined;

afterEach(async () => {
  if (child === undefined || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child?.once("exit", resolve));
  child.kill("SIGTERM");
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5_000))]);
  if (child.exitCode === null) child.kill("SIGKILL");
});

describe("the entry point", () => {
  it("node --experimental-strip-types src/main.ts starts, and GET /api/health answers 200", async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl)
      throw new Error("DATABASE_URL is not set: export DATABASE_URL=$(scripts/pg-local.sh start)");
    const port = await freePort();
    let output = "";
    child = spawn(process.execPath, ["--experimental-strip-types", "src/main.ts"], {
      cwd: serverDir,
      env: {
        ...process.env,
        PORT: String(port),
        DATABASE_URL: databaseUrl,
        // A throwaway secret for this run only; the operator's real one is never in the repo.
        AVEL_AUTH_SECRET: randomBytes(24).toString("hex"),
        AVEL_WEB_ORIGIN: "https://avel.test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      output += chunk;
    });

    const deadline = Date.now() + 20_000;
    let status = 0;
    while (Date.now() < deadline && child.exitCode === null) {
      try {
        status = (await fetch(`http://127.0.0.1:${port}/api/health`)).status;
        if (status === 200) break;
      } catch {
        // not listening yet
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    expect(child.exitCode, `the server exited early:\n${output}`).toBeNull();
    expect(status, `no 200 from /api/health within 20 s:\n${output}`).toBe(200);
  }, 30_000);
});
