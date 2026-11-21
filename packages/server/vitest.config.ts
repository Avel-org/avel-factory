import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // A6: migrate once into a template database; testDatabase() clones it (packages/db/test/helpers/template.ts).
    globalSetup: ["../db/test/global-setup.ts"],
    // Real Postgres (E10): a test file makes its own database, which can pass 5 s without the template.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
