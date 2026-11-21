// Vitest global setup for packages/db and packages/server (A6): migrate once into the template
// database for the current migrations, and hand its name to the test files. A failure here is
// never fatal: the helpers fall back to running `migrate:up` per file, as before.
import type { TestProject } from "vitest/node";
import { ensureTemplate, TEMPLATE_KEY } from "./helpers/template.ts";

declare module "vitest" {
  export interface ProvidedContext {
    avelDbTemplate: string | undefined;
  }
}

export default function setup(project: TestProject): void {
  let name: string | undefined;
  try {
    const t = ensureTemplate();
    name = t.name;
    if (!name) console.warn(`db template: none, each file migrates itself (${t.output})`);
  } catch (error) {
    console.warn(`db template: none, each file migrates itself (${String(error)})`);
  }
  project.provide(TEMPLATE_KEY, name);
}
