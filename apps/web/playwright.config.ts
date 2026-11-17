import { defineConfig } from "@playwright/test";
import { BARE_PORT, MOCK_PORT } from "./e2e/support/ports";

const host = "127.0.0.1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  reporter: [["list"]],
  outputDir: "./test-results",
  timeout: 60_000,
  use: {
    baseURL: `http://${host}:${MOCK_PORT}`,
    // E17, F6: every end-to-end test records a screenshot and a short video.
    screenshot: "on",
    video: "on",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `pnpm exec vite dev --host ${host} --port ${MOCK_PORT} --strictPort`,
      env: { AVEL_API: "mock" },
      port: MOCK_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `pnpm exec vite dev --host ${host} --port ${BARE_PORT} --strictPort`,
      env: { AVEL_API: "" },
      port: BARE_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
