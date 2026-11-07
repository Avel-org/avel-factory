import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";

// The web's unit, component and screen tests (Frontend Map v0.6, Testing): jsdom, Testing Library,
// and the contract mock. There is no database here; the tests never reach a server.

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(here, "../..");
const srcDir = join(here, "src");
const stubsDir = join(here, "test/setup/stubs");

// The @avel/contract version this web is built with (UI contract section 3, escalation 02):
// read from packages/contract/package.json at config time, exactly as vite.config.ts does.
function readContractVersion(): string {
  const file = join(repoRoot, "packages/contract/package.json");
  const pkg: unknown = JSON.parse(readFileSync(file, "utf8"));
  const version =
    typeof pkg === "object" && pkg !== null && "version" in pkg ? pkg.version : undefined;
  if (typeof version !== "string" || version === "") {
    throw new Error(`${file} has no version, so __AVEL_CONTRACT_VERSION__ can't be set`);
  }
  return version;
}

// Before the data core and the contract mock are built, a test that imports them would fail with
// an import error, which isn't a failing test. So a subject that doesn't exist yet resolves to an
// inert stub in test/setup/stubs, which has the same names and answers wrongly: the test then
// fails on its assertion. The moment the real file or package exists, this plugin steps aside and
// the test runs against the real one. A stub is never used once its subject is built.
function stubUnbuiltSubjects(): Plugin {
  const candidates = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];
  return {
    name: "avel:stub-unbuilt-subjects",
    enforce: "pre",
    resolveId(source, importer) {
      if (source === "@avel/contract-mock") {
        const built = existsSync(join(repoRoot, "packages/contract-mock/package.json"));
        return built ? null : join(stubsDir, "contract-mock.ts");
      }
      if (!source.startsWith(".") || importer === undefined) return null;
      const target = resolve(dirname(importer), source.split("?")[0] ?? source);
      if (!target.startsWith(srcDir + sep)) return null;
      if (candidates.some((suffix) => existsSync(target + suffix))) return null;
      const stub = `${join(stubsDir, relative(srcDir, target))}.ts`;
      return existsSync(stub) ? stub : null;
    },
  };
}

export default defineConfig({
  define: {
    __AVEL_CONTRACT_VERSION__: JSON.stringify(readContractVersion()),
  },
  resolve: {
    alias: [
      // packages/contract isn't built in a fresh checkout (its exports point at dist), so the
      // tests read its source. The types and the schemas are the same.
      {
        find: /^@avel\/contract$/,
        replacement: join(repoRoot, "packages/contract/src/index.ts"),
      },
    ],
  },
  plugins: [stubUnbuiltSubjects()],
  test: {
    name: "web",
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup/setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
