import { HealthDto } from "@avel/contract";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/platform/app.ts";
import { get } from "./support/harness.ts";

describe("T-B1-01 · GET /api/health", () => {
  it("returns 200 with a body that parses as HealthDto", async () => {
    const res = await get(createApp(), "/api/health");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body: unknown = await res.json();
    expect(HealthDto.safeParse(body).success).toBe(true);
    // Route 6's row names no field: 200 with an empty object means healthy.
    expect(body).toEqual({});
  });
});
