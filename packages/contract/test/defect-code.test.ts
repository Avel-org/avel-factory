import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { errorMap } from "../src/errors.ts";
import * as C from "../src/index.ts";
import { REPO_ROOT } from "./helpers/contract.ts";

// T-B6 (CR-38): a defect's 500 has a code in the contract's catalog.

type Operation = { responses: Record<string, unknown> };
type OpenApi = {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, unknown> };
};

describe("T-B6-01: errorMap has INTERNAL_SERVER_ERROR (CR-38)", () => {
  it("is a 500 with the message 'Something went wrong' and no data schema", () => {
    expect(Object.keys(errorMap)).toContain("INTERNAL_SERVER_ERROR");
    const entry = (errorMap as Record<string, Record<string, unknown>>).INTERNAL_SERVER_ERROR;
    expect(entry?.status).toBe(500);
    expect(entry?.message).toBe("Something went wrong");
    // a defect never carries details: nothing from the cause reaches the body
    expect(entry).toBeDefined();
    expect("data" in (entry as object)).toBe(false);
    // and the code is in the catalog the web covers, with its status
    expect(C.ErrorCode).toContain("INTERNAL_SERVER_ERROR");
    expect((C.errorStatus as Record<string, number>).INTERNAL_SERVER_ERROR).toBe(500);
  });
});

describe("T-B6-02: the contract version", () => {
  it("CONTRACT_VERSION is 1.0.1", () => {
    expect(C.CONTRACT_VERSION).toBe("1.0.1");
  });
});

describe("T-B6-03: the generated OpenAPI document", () => {
  const doc = JSON.parse(
    readFileSync(join(REPO_ROOT, "docs", "generated", "openapi.json"), "utf8"),
  ) as OpenApi;

  it("defines Error_INTERNAL_SERVER_ERROR with code INTERNAL_SERVER_ERROR and a requestId", () => {
    const schema = doc.components.schemas.Error_INTERNAL_SERVER_ERROR as
      | {
          properties: Record<string, { const?: string; default?: string }>;
          required: string[];
        }
      | undefined;
    expect(
      schema,
      "Error_INTERNAL_SERVER_ERROR is missing: regenerate docs/generated",
    ).toBeDefined();
    expect(schema?.properties.code?.const).toBe("INTERNAL_SERVER_ERROR");
    expect(schema?.properties.message?.default).toBe("Something went wrong");
    expect(schema?.required).toContain("requestId");
    expect(Object.keys(schema?.properties ?? {})).not.toContain("details");
  });

  it("lists it as the 500 response of every operation", () => {
    const ops = Object.values(doc.paths).flatMap((p) => Object.values(p));
    expect(ops.length).toBeGreaterThan(0);
    const missing = ops.filter(
      (op) =>
        !JSON.stringify(op.responses["500"] ?? null).includes(
          "#/components/schemas/Error_INTERNAL_SERVER_ERROR",
        ),
    );
    expect(missing.length).toBe(0);
  });
});
