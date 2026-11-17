import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The root Vitest config: `pnpm test` runs every package's tests in one run.
// Each folder under apps/, packages/ and tools/ is a project, and a folder with its
// own vitest.config.ts uses that config. Folders are listed here instead of
// globbed, because Vitest refuses a glob that matches nothing, and the
// workspace starts with no packages.
const root = fileURLToPath(new URL(".", import.meta.url));

const projects = ["apps", "packages", "tools"].flatMap((parent) => {
  const dir = join(root, parent);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${parent}/${entry.name}`);
});

export default defineConfig({
  test: projects.length > 0 ? { projects } : { include: [] },
});
