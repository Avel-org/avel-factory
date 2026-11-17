import { CONTRACT_VERSION } from "@avel/contract";
import { createMock } from "@avel/contract-mock";
import { describe, expect, it } from "vitest";
import { createClient } from "../src/data/client";
import { loadHome } from "../src/home/load-home";

function clientOver(mock: ReturnType<typeof createMock>) {
  return createClient({
    baseUrl: "http://mock.test",
    fetch: (request) => mock.fetch(request as Request),
  });
}

describe("T-F1-02: loadHome's empty and error states", () => {
  it("gives empty when route 52 has no rows", async () => {
    const mock = createMock({ contractVersion: CONTRACT_VERSION });
    await expect(loadHome(clientOver(mock))).resolves.toEqual({ kind: "empty" });
  });

  it("gives error, without throwing, when failNext(52) fails it", async () => {
    const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true });
    mock.failNext(52, { status: 500, code: "INTERNAL" });
    await expect(loadHome(clientOver(mock))).resolves.toEqual({ kind: "error" });
    // the failure was for one request: the next load reads the world again
    await expect(loadHome(clientOver(mock))).resolves.toMatchObject({ kind: "ready" });
  });

  it("gives error, without throwing, when the network fails", async () => {
    const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true });
    mock.failNext(52, { network: true });
    await expect(loadHome(clientOver(mock))).resolves.toEqual({ kind: "error" });
  });

  it("gives error when route 52 answers a body that isn't a page", async () => {
    const client = createClient({
      baseUrl: "http://mock.test",
      fetch: async () => new Response("<html>not json</html>", { status: 200 }),
    });
    await expect(loadHome(client)).resolves.toEqual({ kind: "error" });
  });
});
