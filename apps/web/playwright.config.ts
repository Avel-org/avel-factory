import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

// The approval page end to end (UI contract section 7, UC-29 to UC-31): Playwright starts the dev
// server with AVEL_API=mock, so every test talks to the dev server's one mock instance (section 3).
// Each test starts with POST /__mock/reset (e2e/fixtures.ts), so the tests run one at a time.

const PORT = Number(process.env.AVEL_E2E_PORT ?? 4173);
const ORIGIN = `http://127.0.0.1:${PORT}`;

// Before the data core's router and the contract mock are built, the dev server can't start, and
// a test that can't start its server fails on setup, which isn't a failing test. So until both
// exist, the stand-in in e2e/unbuilt-server.mjs answers 403 to everything and the tests fail on
// their assertions. The moment both exist, the real dev server runs. (Same idea as the stubs in
// vitest.config.ts.)
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const appBuilt =
  existsSync(here("./src/router.tsx")) &&
  existsSync(here("../../packages/contract-mock/package.json"));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  // Under node_modules so the results never show up as untracked files.
  outputDir: "./node_modules/.playwright-results",
  use: {
    baseURL: ORIGIN,
    trace: "off",
  },
  webServer: {
    command: appBuilt
      ? `pnpm exec vite dev --host 127.0.0.1 --port ${PORT} --strictPort`
      : `node e2e/unbuilt-server.mjs ${PORT}`,
    url: ORIGIN,
    env: { AVEL_API: "mock" },
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "phone",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: "desk",
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
});
