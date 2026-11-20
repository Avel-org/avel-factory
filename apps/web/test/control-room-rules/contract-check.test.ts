import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contract, EventKind } from "@avel/contract";
import { describe, expect, it } from "vitest";
import { crRoot, webRoot } from "../control-room/support";

interface IndexRoute {
  method: string;
  path: string;
}
const index = JSON.parse(readFileSync(join(crRoot, "contract", "contract-index.json"), "utf8")) as {
  routes: IndexRoute[];
  events: string[];
};

/** Every route in packages/contract, as "METHOD /path". The tree's leaves carry ~orpc.route. */
function contractRoutes(node: unknown, out: string[] = []): string[] {
  if (!node || (typeof node !== "object" && typeof node !== "function")) return out;
  const def = (node as { "~orpc"?: { route?: { method?: string; path?: string } } })["~orpc"];
  if (def?.route?.method && def.route.path) {
    out.push(`${def.route.method} ${def.route.path}`);
    return out;
  }
  for (const child of Object.values(node as Record<string, unknown>)) contractRoutes(child, out);
  return out;
}

describe("T-F10-01: the control room names only what contract 1.0.0 has", () => {
  it("apps/web has the check:contract script, exactly as the plan words it", () => {
    const pkg = JSON.parse(readFileSync(join(webRoot, "package.json"), "utf8"));
    expect(pkg.scripts?.["check:contract"]).toBe("node control-room/tools/check-contract.mjs");
  });

  it("pnpm run check:contract (node control-room/tools/check-contract.mjs) exits 0", () => {
    const run = spawnSync("pnpm", ["run", "check:contract"], { cwd: webRoot, encoding: "utf8" });
    expect(run.stderr + run.stdout).toContain("check-contract: every route");
    expect(run.status).toBe(0);
  });

  it("contract-index.json names the same routes as packages/contract", () => {
    const fromIndex = index.routes.map((r) => `${r.method} ${r.path}`).sort();
    const fromContract = contractRoutes(contract).sort();
    expect(fromContract.length, "the contract's routes were found").toBeGreaterThan(100);
    expect(fromIndex).toEqual(fromContract);
  });

  it("contract-index.json names the same event kinds as packages/contract", () => {
    expect([...index.events].sort()).toEqual([...EventKind].sort());
  });
});
