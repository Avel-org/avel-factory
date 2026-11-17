import { defineConfig } from "vitest/config";

// The locked tests build scratch git repos and run the lock check as a subprocess
// (test/helpers.ts allows each run 100 s), so the 5 s default is too short.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 240_000,
  },
});
