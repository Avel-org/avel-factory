import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getEventIteratorSchemaDetails } from "@orpc/contract";
import { describe, expect, it } from "vitest";
import * as C from "../src/index.ts";
import { PKG_ROOT } from "./helpers/contract.ts";

// CR-W20 section 3 done-when: no money field on any web-facing DTO or event, except AI run
// cost against its cap (mission and module budgets, Canon's spend, a receipt's AI cost).

const MONEY = /price|amount|invoice|payment|revenue|margin|cash|quote|micros|cost|usd|dollar/i;

/** AI cost and budget only: each is spend by agents or Canon against a cap. */
const ALLOWED = new Set([
  "budgetMicros", // missions: the AI budget
  "reservedMicros", // missions, attempts: AI cost reserved
  "spentMicros", // missions, modules: AI spend
  "capMicros", // attempts, agent configs, module page: the AI cap
  "costMicros", // attempts, Canon messages, module page: AI cost
  "aiCostMicros", // receipts and eval runs: AI cost
  "canonSpentMicros", // the onboarding journey: Canon's AI spend
  "estMicros", // plan modules: estimated AI cost
  "fromMicros", // budget_increase: the AI budget before
  "toMicros", // budget_increase: the AI budget after
  "micros", // costImpact on a decision that changes AI spend
  "costImpact",
]);

type Schema = { _zod: { def: Record<string, unknown> } };

function fields(
  schema: unknown,
  path: string,
  out: Map<string, string>,
  seen = new Set<unknown>(),
) {
  if (!schema || typeof schema !== "object" || seen.has(schema)) return;
  seen.add(schema);
  const iter = getEventIteratorSchemaDetails(schema as never);
  if (iter) {
    fields(iter.yields, path, out, seen);
    fields(iter.returns, path, out, seen);
    return;
  }
  const def = (schema as Schema)._zod?.def;
  if (!def) return;
  const shape = def.shape as Record<string, unknown> | undefined;
  if (shape) {
    for (const [k, v] of Object.entries(shape)) {
      out.set(`${path}.${k}`, k);
      fields(v, `${path}.${k}`, out, seen);
    }
  }
  for (const key of ["innerType", "element", "in", "out", "valueType", "keyType"])
    fields(def[key], path, out, seen);
  for (const key of ["options", "items"]) {
    const list = def[key];
    if (Array.isArray(list)) for (const o of list) fields(o, path, out, seen);
  }
}

type Proc = { "~orpc": { outputSchema?: unknown; route: { method: string; path: string } } };

function procedures(router: unknown, out: Proc[] = []): Proc[] {
  if (!router || typeof router !== "object") return out;
  if ("~orpc" in router) {
    out.push(router as Proc);
    return out;
  }
  for (const v of Object.values(router)) procedures(v, out);
  return out;
}

describe("CR-W20 section 3: no money in the control room", () => {
  it("no route's output carries a money field except AI cost and budget", () => {
    const hits: string[] = [];
    for (const p of procedures(C.contract)) {
      const found = new Map<string, string>();
      fields(p["~orpc"].outputSchema, `${p["~orpc"].route.method} ${p["~orpc"].route.path}`, found);
      for (const [where, name] of found)
        if (MONEY.test(name) && !ALLOWED.has(name)) hits.push(where);
    }
    expect(hits).toEqual([]);
  });

  it("no event payload carries a money field except AI spend against its budget", () => {
    const hits: string[] = [];
    for (const [kind, schema] of Object.entries(C.eventPayloads)) {
      const found = new Map<string, string>();
      fields(schema, kind, found);
      for (const [where, name] of found)
        if (MONEY.test(name) && !ALLOWED.has(name)) hits.push(where);
    }
    expect(hits).toEqual([]);
  });

  it("the lint sees a money field when there is one", () => {
    const found = new Map<string, string>();
    fields(C.ProposalDecision, "probe", found);
    expect([...found.values()]).toContain("fromMicros");
    expect(MONEY.test("priceMicros") && !ALLOWED.has("priceMicros")).toBe(true);
  });

  it("MissionDto has no price (CR-W20 section 3)", () => {
    expect(Object.keys(C.MissionDto.shape)).not.toContain("priceMicros");
  });
});

describe("S1-2: the contract version", () => {
  it("CONTRACT_VERSION equals package.json's version", () => {
    const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")) as {
      version: string;
    };
    expect(C.CONTRACT_VERSION).toBe(pkg.version);
    expect(C.CONTRACT_VERSION).toBe("1.0.1");
  });
});
