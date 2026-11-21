import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // A6: migrate once into a template database; migratedDb() clones it (test/helpers/template.ts).
    globalSetup: ["test/global-setup.ts"],
  },
});
