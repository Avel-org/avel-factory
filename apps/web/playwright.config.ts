import { defineConfig } from "@playwright/test";
import { BARE_PORT, MOCK_PORT } from "./e2e/support/ports";

const host = "127.0.0.1";
/** The lockout spec locks the one operator on its own mock, so it has its own dev server (D5: the worktree's ports). */
const LOCKOUT_PORT = MOCK_PORT + 4; // +2 is budget.spec's preview, +3 is prod.spec's
/** Where e2e/support/auth.setup.ts saves the signed-in state (git ignores test-results/). */
const STATE = "test-results/.auth/operator.json";

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
  // T-F12-09 · LG-23: "setup" signs in once; every earlier spec (T-F7 to T-F11) runs signed in and
  // unchanged. The LG specs under e2e/sign-in/ start signed out, with no stored state.
  projects: [
    { name: "setup", testMatch: /support\/auth\.setup\.ts$/ },
    {
      name: "signed-in",
      dependencies: ["setup"],
      testIgnore: [/sign-in\//, /support\/auth\.setup\.ts$/],
      use: { storageState: STATE },
    },
    {
      name: "sign-in",
      dependencies: ["setup"],
      testMatch: /sign-in\/.*\.spec\.ts$/,
      testIgnore: [/sign-in\/lockout\.spec\.ts$/],
    },
    {
      name: "lockout",
      dependencies: ["setup"],
      testMatch: /sign-in\/lockout\.spec\.ts$/,
      use: { baseURL: `http://${host}:${LOCKOUT_PORT}` },
    },
  ],
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
    {
      command: `pnpm exec vite dev --host ${host} --port ${LOCKOUT_PORT} --strictPort`,
      env: { AVEL_API: "mock" },
      port: LOCKOUT_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
