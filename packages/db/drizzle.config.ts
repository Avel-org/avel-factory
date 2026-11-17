// drizzle-kit reads the schema from src/schema and writes the migrations to drizzle/.
// `pnpm --filter @avel/db generate` needs @avel/contract built (pnpm build) first.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
});
