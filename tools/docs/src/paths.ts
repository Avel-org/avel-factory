// Where the docs read and write. The tests (tools/docs/test/helpers.ts) lock these names:
// AVEL_DOCS_OUT for generate's output folder, AVEL_DOCS_DATABASE_MD for the file drift reads.
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

/** A path from the environment, relative to where pnpm was started (pnpm runs scripts in the package folder). */
function fromEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value) return fallback;
  if (isAbsolute(value)) return value;
  return resolve(process.env.INIT_CWD ?? process.cwd(), value);
}

export const outDir = (): string => fromEnv("AVEL_DOCS_OUT", join(repoRoot, "docs/generated"));

export const databaseMdPath = (): string =>
  fromEnv("AVEL_DOCS_DATABASE_MD", join(repoRoot, "docs/design/DATABASE.md"));
