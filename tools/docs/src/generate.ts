// `pnpm --filter @avel/docs generate`: writes erd.md and openapi.json into docs/generated/,
// or into $AVEL_DOCS_OUT. Both are deterministic, so CI can compare them with the committed copies.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderErd } from "./erd.ts";
import { renderOpenapi } from "./openapi.ts";
import { outDir } from "./paths.ts";
import { readSchema } from "./schema.ts";

async function main(): Promise<void> {
  const out = outDir();
  const erd = renderErd(readSchema());
  const openapi = await renderOpenapi();
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "erd.md"), erd);
  writeFileSync(join(out, "openapi.json"), openapi);
  console.log(`wrote erd.md and openapi.json to ${out}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(2);
});
