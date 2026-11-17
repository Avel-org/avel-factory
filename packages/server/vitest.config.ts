import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Real Postgres (E10): a test file makes and migrates its own database, which can pass 5 s.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
