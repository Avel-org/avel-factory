import {
  CONTRACT_VERSION,
  CONTRACT_VERSION_HEADER,
  ErrorBody,
  REQUEST_ID_HEADER,
} from "@avel/contract";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/platform/app.ts";
import { NotFound } from "../src/platform/errors.ts";
import { appRunning, fixedIds, get, UUID_V7 } from "./support/harness.ts";

const GEN = "0193a000-0000-7000-8000-0000000000aa";

describe("T-B1-02 · X-Contract-Version", () => {
  it("is on every response, success or error, and equals CONTRACT_VERSION", async () => {
    const responses: [string, Response][] = [
      ["health 200", await get(createApp(), "/api/health")],
      ["unknown route 404", await get(createApp(), "/api/no-such-route")],
      ["unimplemented contract route", await get(createApp(), "/api/doctor")],
      [
        "tagged failure",
        await get(
          appRunning(() => Effect.fail(new NotFound({ message: "nope" }))),
          "/api/health",
        ),
      ],
      [
        "defect",
        await get(
          appRunning(() => Effect.die(new Error("boom-internal-detail"))),
          "/api/health",
        ),
      ],
    ];

    for (const [name, res] of responses) {
      expect(res.headers.get(CONTRACT_VERSION_HEADER), name).toBe(CONTRACT_VERSION);
    }
    // The set covers both kinds, so the loop above isn't all successes.
    expect(responses.some(([, r]) => r.status === 200)).toBe(true);
    expect(responses.some(([, r]) => r.status >= 400)).toBe(true);
  });
});

describe("T-B1-03 · X-Request-Id", () => {
  const withIds = () => createApp({ layer: fixedIds(GEN) });

  it("echoes a valid incoming X-Request-Id", async () => {
    const incoming = "0193a000-0000-7000-8000-000000000123";
    const res = await get(withIds(), "/api/health", { [REQUEST_ID_HEADER]: incoming });
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(incoming);
  });

  it("echoes it on an error too, and the body's requestId matches", async () => {
    const incoming = "0193a000-0000-7000-8000-000000000124";
    const res = await get(withIds(), "/api/no-such-route", { [REQUEST_ID_HEADER]: incoming });
    expect(res.status).toBe(404);
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(incoming);
    expect(ErrorBody.parse(await res.json()).requestId).toBe(incoming);
  });

  it("replaces a missing X-Request-Id with a new UUIDv7 from the Ids service", async () => {
    const res = await get(withIds(), "/api/health");
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(GEN);
    expect(GEN).toMatch(UUID_V7);
  });

  it("replaces a malformed X-Request-Id with a new UUIDv7 from the Ids service", async () => {
    for (const bad of ["not-a-uuid", "x".repeat(300), "0193a000 0000 7000 8000 000000000123"]) {
      const res = await get(withIds(), "/api/health", { [REQUEST_ID_HEADER]: bad });
      expect(res.headers.get(REQUEST_ID_HEADER), bad).toBe(GEN);
    }
  });

  it("takes a fresh ID from Ids for each request", async () => {
    const other = "0193a000-0000-7000-8000-0000000000bb";
    const app = createApp({ layer: fixedIds(GEN, other) });
    const first = await get(app, "/api/health");
    const second = await get(app, "/api/health");
    expect(first.headers.get(REQUEST_ID_HEADER)).toBe(GEN);
    expect(second.headers.get(REQUEST_ID_HEADER)).toBe(other);
  });
});
