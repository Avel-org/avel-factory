import { defineConfig } from "vitest/config";

// The locked tests run `pnpm --filter @avel/docs run generate|drift` as subprocesses
// (test/helpers.ts allows each 100 s), and a drift case runs twice (control, then planted),
// so the 5 s default is too short.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 240_000,
  },
});
