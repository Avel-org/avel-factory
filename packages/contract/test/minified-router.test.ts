import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectRoutes, loadContract, PKG_ROOT } from "./helpers/contract.ts";

// T-B11 D (CR-W30): packages/contract/src/minified.ts holds, for every route in the router,
// its key path, method, path, route number, write and stepUp, and no schema. A script in
// packages/contract/scripts writes it; the file is committed.

const MINIFIED = join(PKG_ROOT, "src", "minified.ts");
const SCRIPTS = join(PKG_ROOT, "scripts");

type Entry = Record<string, unknown>;

/** The entries in whatever shape the module exports them: an array, or an object of entries. */
async function entries(): Promise<Entry[]> {
  expect(existsSync(MINIFIED), "packages/contract/src/minified.ts does not exist yet").toBe(true);
  const mod = (await import(/* @vite-ignore */ MINIFIED)) as Record<string, unknown>;
  for (const value of Object.values(mod)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      return value as Entry[];
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const vals = Object.values(value);
      if (vals.length > 50 && vals.every((v) => typeof v === "object" && v !== null)) {
        return vals as Entry[];
      }
    }
  }
  throw new Error("minified.ts exports no list or map of route entries");
}

/** Every procedure in the router with its meta, by walking `~orpc`. */
function routerRoutes(contract: unknown) {
  const out: Array<{
    keyPath: string[];
    method: string;
    path: string;
    routeNo: number | null;
    write: boolean;
    stepUp: boolean;
  }> = [];
  const walk = (node: unknown, keyPath: string[]) => {
    if (typeof node !== "object" || node === null) return;
    const def = Reflect.get(node, "~orpc") as
      | { route?: { method?: string; path?: string }; meta?: Record<string, unknown> }
      | undefined;
    if (def && typeof def === "object" && "route" in def) {
      out.push({
        keyPath,
        method: def.route?.method ?? "",
        path: def.route?.path ?? "",
        routeNo: (def.meta?.routeNo as number | null) ?? null,
        write: def.meta?.write as boolean,
        stepUp: def.meta?.stepUp as boolean,
      });
      return;
    }
    for (const [k, v] of Object.entries(node)) walk(v, [...keyPath, k]);
  };
  walk(contract, []);
  return out;
}

describe("T-B11-05: the minified router", () => {
  it("has one entry per route, with the same method, path, route number, write and stepUp, and no schema", async () => {
    const all = await entries();
    const { contract } = await loadContract();
    const routes = routerRoutes(contract);
    expect(routes.length).toBe(collectRoutes({ contract }).length);
    expect(routes.length).toBeGreaterThan(100);
    expect(all).toHaveLength(routes.length);

    const keyOf = (e: Entry) => `${String(e.method)} ${String(e.path)}`;
    const byRoute = new Map(all.map((e) => [keyOf(e), e]));
    expect(byRoute.size).toBe(all.length);

    for (const r of routes) {
      const e = byRoute.get(`${r.method} ${r.path}`);
      expect(e, `no entry for ${r.method} ${r.path}`).toBeDefined();
      expect(e?.routeNo, r.path).toBe(r.routeNo);
      expect(e?.write, r.path).toBe(r.write);
      expect(e?.stepUp, r.path).toBe(r.stepUp);
      // The key path: the router's own keys, joined by "." or held as an array.
      const kp = Object.entries(e ?? {}).find(([name]) => /key/i.test(name))?.[1];
      expect(kp, `no key path on ${r.path}`).toBeDefined();
      const joined = Array.isArray(kp) ? kp.join(".") : kp;
      expect(joined, r.path).toBe(r.keyPath.join("."));
    }
  });

  it("carries no schema: no entry has a ~orpc, _zod, input or output", async () => {
    const text = JSON.stringify(await entries());
    expect(text).not.toContain("_zod");
    for (const e of await entries()) {
      expect(Object.keys(e)).not.toEqual(expect.arrayContaining(["inputSchema"]));
      for (const name of ["~orpc", "_zod", "inputSchema", "outputSchema", "input", "output"]) {
        expect(name in e, `entry carries ${name}`).toBe(false);
      }
      for (const v of Object.values(e)) {
        expect(["string", "number", "boolean", "object"]).toContain(typeof v);
      }
    }
    expect(readFileSync(MINIFIED, "utf8")).not.toMatch(/from\s+["'](zod|@orpc)/);
  });

  it("is exported from the package's index", () => {
    expect(readFileSync(join(PKG_ROOT, "src", "index.ts"), "utf8")).toMatch(/minified/);
  });

  it("regenerating it from the router gives the committed file", () => {
    const scripts = existsSync(SCRIPTS)
      ? readdirSync(SCRIPTS).filter((f) => /\.(m?[jt]s)$/.test(f))
      : [];
    expect(scripts.length, "packages/contract/scripts has no generator yet").toBeGreaterThan(0);
    expect(existsSync(MINIFIED), "packages/contract/src/minified.ts does not exist yet").toBe(true);
    const committed = readFileSync(MINIFIED, "utf8");
    try {
      const run = spawnSync("node", [join(SCRIPTS, scripts[0] as string)], {
        cwd: PKG_ROOT,
        encoding: "utf8",
        timeout: 120_000,
      });
      expect(run.status, `${run.stdout}${run.stderr}`).toBe(0);
      expect(readFileSync(MINIFIED, "utf8")).toBe(committed);
    } finally {
      writeFileSync(MINIFIED, committed);
    }
  });
});
