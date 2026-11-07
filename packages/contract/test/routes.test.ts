import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXPECTED_ROUTES,
  EXPECTED_ROUTES_99,
  EXPECTED_ROUTES_CR16,
} from "./fixtures/expected-routes.ts";
import {
  collectRoutes,
  entryExists,
  loadContract,
  PKG_ROOT,
  REPO_ROOT,
  run,
} from "./helpers/contract.ts";

// Done-when 5 (Step 0 and Step 1 plan): the contract builds, and its route list is the
// 102 method and path pairs of contract.md section 2 (D4): API routes.md's 99, then CR-16's 3.

async function routePairs(): Promise<string[]> {
  expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
  const routes = collectRoutes(await loadContract());
  expect(routes.length, "the contract exports no oRPC route definitions").toBeGreaterThan(0);
  return routes.map((r) => `${r.method} ${r.path}`);
}

describe("done-when 5: the contract builds", () => {
  it("done-when 5: packages/contract is the package @avel/contract (D12)", () => {
    const manifest = join(PKG_ROOT, "package.json");
    let name: unknown;
    try {
      name = (JSON.parse(readFileSync(manifest, "utf8")) as { name?: unknown }).name;
    } catch {
      name = undefined;
    }
    expect(name, "packages/contract/package.json is missing or has no name").toBe("@avel/contract");
  });

  it("done-when 5: `pnpm --filter @avel/contract build` exits 0", () => {
    const result = run(
      "pnpm",
      ["--filter", "@avel/contract", "--fail-if-no-match", "run", "build"],
      REPO_ROOT,
    );
    expect(result.status, result.output).toBe(0);
  });
});

describe("done-when 5: the route snapshot (102 method and path pairs)", () => {
  it("done-when 5: pins existing behaviour (passes): the expected list is 99 from API routes.md plus CR-16's 3, with no repeats", () => {
    expect(EXPECTED_ROUTES_99).toHaveLength(99);
    expect(EXPECTED_ROUTES_CR16).toHaveLength(3);
    expect(EXPECTED_ROUTES).toHaveLength(102);
    expect(new Set(EXPECTED_ROUTES).size).toBe(102);
  });

  it("done-when 5: the contract defines exactly 102 routes, each once", async () => {
    const pairs = await routePairs();
    expect(pairs).toHaveLength(102);
    expect(new Set(pairs).size, "a method and path pair is defined twice").toBe(102);
  });

  it("done-when 5: every route has an explicit method and path", async () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const routes = collectRoutes(await loadContract());
    expect(routes.length, "the contract exports no oRPC route definitions").toBeGreaterThan(0);
    const unset = routes.filter((r) => r.method === undefined || r.path === undefined);
    expect(unset, "routes with no explicit method or path").toEqual([]);
  });

  it("done-when 5: the method and path pairs equal the snapshot, none missing and none extra", async () => {
    const actual = [...(await routePairs())].sort();
    const expected: string[] = [...EXPECTED_ROUTES].sort();
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it("done-when 5: CR-16's three dispatch-package routes are in", async () => {
    const actual = await routePairs();
    for (const pair of EXPECTED_ROUTES_CR16) expect(actual, pair).toContain(pair);
  });

  it("done-when 5: nothing outside the contract is defined (auth, the webhook, git over HTTP)", async () => {
    const outside = (await routePairs()).filter(
      (p) => /\/api\/auth(\/|$)/.test(p) || p.includes("/api/webhooks/") || p.includes("/git/"),
    );
    expect(outside).toEqual([]);
  });

  it("done-when 5: Library paths are written out per kind (D1)", async () => {
    const actual = await routePairs();
    for (const kind of ["skills", "kb-entries", "rules", "templates"]) {
      for (const pair of [
        `GET /api/library/${kind}`,
        `POST /api/library/${kind}`,
        `GET /api/library/${kind}/{itemId}`,
        `PATCH /api/library/${kind}/{itemId}`,
      ]) {
        expect(actual, pair).toContain(pair);
      }
    }
  });
});
