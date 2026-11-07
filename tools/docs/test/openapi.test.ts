import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contractRoutes, generatedDir, generateInto, readText, tempDir } from "./helpers.js";

// Done-when 5, the OpenAPI half: the document generates and holds the contract's
// routes (contract.md section 2: 102, the 99 and CR-16's 3). RIGG-01.

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

type Doc = {
  openapi?: string;
  info?: { title?: string; version?: string };
  paths?: Record<
    string,
    Record<
      string,
      { responses?: Record<string, unknown>; parameters?: { in: string; name: string }[] }
    >
  >;
};

function generated(label: string): { doc: Doc; text: string } {
  const out = tempDir(label);
  generateInto(out);
  const file = join(out, "openapi.json");
  expect(existsSync(file), "openapi.json was not written").toBe(true);
  const text = readText(file);
  return { doc: JSON.parse(text) as Doc, text };
}

function operations(doc: Doc): string[] {
  const ops: string[] = [];
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const method of Object.keys(item)) {
      if (HTTP_METHODS.includes(method)) ops.push(`${method.toUpperCase()} ${path}`);
    }
  }
  return ops.sort();
}

describe("done-when 5 (RIGG-01): the OpenAPI document generates from the contract", () => {
  it("[done-when 5] generate writes openapi.json: valid JSON, OpenAPI 3.x, with a title and version", () => {
    const { doc } = generated("oa-shape");
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info?.title).toBeTruthy();
    expect(doc.info?.version).toBeTruthy();
  });

  it("[done-when 5] the contract.md route list parses to the 102 routes (the test's own input)", () => {
    const { doc } = generated("oa-input");
    expect(contractRoutes()).toHaveLength(102);
    expect(operations(doc).length).toBeGreaterThan(0);
  });

  it("[done-when 5] the document holds every one of the contract's 102 routes, and no other", () => {
    const { doc } = generated("oa-routes");
    const expected = contractRoutes();
    const actual = operations(doc);
    expect(expected).toHaveLength(102);
    expect(expected.filter((r) => !actual.includes(r))).toEqual([]);
    expect(actual.filter((r) => !expected.includes(r))).toEqual([]);
  });

  it("[done-when 5] routes outside the contract are not in it: /api/auth/*, the GitHub webhook, git", () => {
    const { doc } = generated("oa-outside");
    const paths = Object.keys(doc.paths ?? {});
    expect(paths.length).toBeGreaterThan(0);
    expect(
      paths.filter(
        (p) => p.startsWith("/api/auth") || p.includes("/webhooks/") || p.includes(".git"),
      ),
    ).toEqual([]);
  });

  it("[done-when 5] every operation declares at least one response", () => {
    const { doc } = generated("oa-responses");
    const ops = Object.values(doc.paths ?? {}).flatMap((item) =>
      Object.entries(item)
        .filter(([m]) => HTTP_METHODS.includes(m))
        .map(([, op]) => op),
    );
    expect(ops.length).toBe(102);
    expect(ops.filter((op) => !op.responses || Object.keys(op.responses).length === 0)).toEqual([]);
  });

  it("[done-when 5] CR-16's three dispatch-package routes take ?planVersion=, and the files route ?path=", () => {
    const { doc } = generated("oa-cr16");
    const base = "/api/missions/{missionId}/dispatch-package";
    const query = (path: string) =>
      (doc.paths?.[path]?.get?.parameters ?? []).filter((p) => p.in === "query").map((p) => p.name);
    expect(query(base)).toContain("planVersion");
    expect(query(`${base}/files`)).toEqual(expect.arrayContaining(["planVersion", "path"]));
    expect(query(`${base}/archive`)).toContain("planVersion");
  });

  it("[done-when 5] generate twice gives byte-identical output", () => {
    const a = generated("oa-a");
    const b = generated("oa-b");
    expect(b.text).toBe(a.text);
  });

  it("[done-when 5] docs/generated/openapi.json is committed and matches a fresh generate", () => {
    const fresh = generated("oa-fresh");
    const committed = join(generatedDir, "openapi.json");
    expect(existsSync(committed), "docs/generated/openapi.json is missing").toBe(true);
    expect(readText(committed)).toBe(fresh.text);
  });
});
