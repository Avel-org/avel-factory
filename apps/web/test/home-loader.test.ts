import { CONTRACT_VERSION } from "@avel/contract";
import { createMock, world } from "@avel/contract-mock";
import { describe, expect, it } from "vitest";
import { createClient } from "../src/data/client";
import { loadHome } from "../src/home/load-home";

const baseUrl = "http://mock.test";

describe("T-F1-01: the client and loadHome over the mock's world", () => {
  it("createClient lists route 52 through createMock({ world: true }).fetch", async () => {
    const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true });
    const client = createClient({ baseUrl, fetch: (request) => mock.fetch(request as Request) });
    const page = await client.decisions.listPending({});
    expect(page.items).toHaveLength(world.DECISIONS.length);
    expect(page.nextCursor).toBeNull();
    expect(mock.requests().map((r) => r.route)).toEqual([52]);
  });

  it("loadHome gives ready with the world's count", async () => {
    const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true });
    const client = createClient({ baseUrl, fetch: (request) => mock.fetch(request as Request) });
    await expect(loadHome(client)).resolves.toEqual({
      kind: "ready",
      count: world.DECISIONS.length,
      more: false,
    });
  });

  it("loadHome sets more when route 52 has a next cursor", async () => {
    const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true });
    const client = createClient({
      baseUrl,
      fetch: async (request) => {
        const response = await mock.fetch(request as Request);
        const body = (await response.json()) as { items: unknown[] };
        return new Response(JSON.stringify({ ...body, nextCursor: "more-after-this" }), {
          status: response.status,
          headers: response.headers,
        });
      },
    });
    await expect(loadHome(client)).resolves.toEqual({
      kind: "ready",
      count: world.DECISIONS.length,
      more: true,
    });
  });
});
