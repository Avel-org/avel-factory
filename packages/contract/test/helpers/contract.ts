import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Shared helpers for the contract's done-when tests (5, 6 and 7).
//
// Every test here reads the contract through its public entry,
// packages/contract/src/index.ts, and finds things by shape rather than by
// export name wherever the step contract (contract.md) does not name the export.
// A test that cannot find the entry fails with an assertion, never an import error.

const here = dirname(fileURLToPath(import.meta.url));

export const PKG_ROOT = resolve(here, "..", "..");
export const REPO_ROOT = resolve(PKG_ROOT, "..", "..");
export const ENTRY = join(PKG_ROOT, "src", "index.ts");

export type Exports = Record<string, unknown>;

export function entryExists(): boolean {
  return existsSync(ENTRY);
}

/** Loads the contract's public entry. Callers assert `entryExists()` first. */
export async function loadContract(): Promise<Exports> {
  return (await import(/* @vite-ignore */ ENTRY)) as Exports;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** The value lists the contract exports: non-empty arrays of strings, by export name. */
export function exportedLists(mod: Exports): Map<string, readonly string[]> {
  const lists = new Map<string, readonly string[]>();
  for (const [name, value] of Object.entries(mod)) {
    if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string")) {
      lists.set(name, value as string[]);
    }
  }
  return lists;
}

export function sameValues(a: readonly string[], b: readonly string[]): boolean {
  const left = [...new Set(a)].sort();
  const right = [...new Set(b)].sort();
  return left.length === right.length && left.every((v, i) => v === right[i]);
}

export type FoundRoute = { method: string | undefined; path: string | undefined };

/**
 * Every oRPC contract procedure reachable from the contract's exports. A procedure is an
 * object carrying `~orpc.route`. Routers are plain objects, so the walk goes into plain
 * objects and arrays only, never into schema instances.
 */
export function collectRoutes(mod: Exports): FoundRoute[] {
  const seen = new WeakSet<object>();
  const found: FoundRoute[] = [];
  const visit = (value: unknown): void => {
    if (typeof value !== "object" || value === null || seen.has(value)) return;
    seen.add(value);
    const def = Reflect.get(value, "~orpc");
    if (typeof def === "object" && def !== null && "route" in def) {
      const route = Reflect.get(def, "route") as { method?: unknown; path?: unknown } | undefined;
      found.push({
        method: typeof route?.method === "string" ? route.method : undefined,
        path: typeof route?.path === "string" ? route.path : undefined,
      });
      return;
    }
    if (Array.isArray(value) || isPlainObject(value)) {
      for (const child of Object.values(value)) visit(child);
    }
  };
  for (const value of Object.values(mod)) visit(value);
  return found;
}

export type Run = { status: number | null; output: string };

export function run(command: string, args: string[], cwd: string): Run {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 240_000 });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
  };
}
