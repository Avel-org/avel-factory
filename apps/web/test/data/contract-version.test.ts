import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { expectOk, ORIGIN } from "../setup/app";
import { proposalRow } from "../setup/seed";

// UC-07: the contract version check (UI contract section 3, "The contract check, in the
// browser only"). The mismatch store is module state, "fixed until reload", so each test loads
// fresh copies of the modules.

declare const __AVEL_CONTRACT_VERSION__: string;

async function load() {
  vi.resetModules();
  const client = await import("../../src/data/client");
  const version = await import("../../src/data/contract-version");
  const mockPackage = await import("@avel/contract-mock");
  const seed = [proposalRow(1)];
  const serving = (contractVersion: string) => {
    const mock = mockPackage.createMock({ contractVersion });
    mock.seed(seed);
    return mock;
  };
  return { ...client, ...version, serving };
}

/** The same mock answer, without the X-Contract-Version header. */
function withoutVersionHeader(inner: (request: Request) => Promise<Response>): typeof fetch {
  const wrapped = async (request: Request): Promise<Response> => {
    const response = await inner(request);
    const headers = new Headers(response.headers);
    headers.delete("X-Contract-Version");
    return new Response(await response.text(), { status: response.status, headers });
  };
  return wrapped as unknown as typeof fetch;
}

describe("UC-07 the contract version check", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("UC-07 a response whose X-Contract-Version differs sets useContractMismatch, and it stays set", async () => {
    const { createApi, useContractMismatch, serving } = await load();
    const mock = serving("9.9.9");
    const api = createApi({ fetch: mock.fetch, baseUrl: ORIGIN, contractVersion: "1.0.0" });
    const hook = renderHook(() => useContractMismatch());
    expect(hook.result.current, "null until the first mismatch").toBeNull();

    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    hook.rerender();
    expect(hook.result.current).toEqual({ serverVersion: "9.9.9" });

    // Fixed until reload: a later response that matches does not clear it.
    const matching = createApi({ fetch: mock.fetch, baseUrl: ORIGIN, contractVersion: "9.9.9" });
    await expectOk(matching.client.decisions.listPending({ limit: 50 }));
    hook.rerender();
    expect(hook.result.current).toEqual({ serverVersion: "9.9.9" });
  });

  test("UC-07 a response whose X-Contract-Version equals the client's does not", async () => {
    const { createApi, useContractMismatch, serving } = await load();
    const mock = serving("1.0.0");
    const api = createApi({ fetch: mock.fetch, baseUrl: ORIGIN, contractVersion: "1.0.0" });
    const response = await expectOk(api.client.decisions.listPending({ limit: 50 }));
    expect(response.items.length, "the call should have been answered").toBeGreaterThan(0);
    const hook = renderHook(() => useContractMismatch());
    expect(hook.result.current).toBeNull();
  });

  test("UC-07 a response with no X-Contract-Version does not", async () => {
    const { createApi, useContractMismatch, serving } = await load();
    const mock = serving("9.9.9");
    const api = createApi({
      fetch: withoutVersionHeader(mock.fetch),
      baseUrl: ORIGIN,
      contractVersion: "1.0.0",
    });
    const response = await expectOk(api.client.decisions.listPending({ limit: 50 }));
    expect(response.items.length, "the call should have been answered").toBeGreaterThan(0);
    const hook = renderHook(() => useContractMismatch());
    expect(hook.result.current).toBeNull();
  });

  test("UC-07 an error response that differs counts too", async () => {
    const { createApi, useContractMismatch, serving } = await load();
    const mock = serving("9.9.9");
    mock.failNext(52, { status: 500, code: "INTERNAL", data: {} });
    const api = createApi({ fetch: mock.fetch, baseUrl: ORIGIN, contractVersion: "1.0.0" });
    await api.client.decisions.listPending({ limit: 50 }).catch(() => undefined);
    expect(mock.requests(), "the request reached the mock").toHaveLength(1);
    const hook = renderHook(() => useContractMismatch());
    expect(hook.result.current).toEqual({ serverVersion: "9.9.9" });
  });

  test("UC-07 BUILT_CONTRACT_VERSION is the version in packages/contract/package.json, and the default the client compares with", async () => {
    const { BUILT_CONTRACT_VERSION, createApi, useContractMismatch, serving } = await load();
    const file = resolve(import.meta.dirname, "../../../../packages/contract/package.json");
    const { version } = JSON.parse(readFileSync(file, "utf8")) as { version: string };
    expect(__AVEL_CONTRACT_VERSION__).toBe(version);
    expect(BUILT_CONTRACT_VERSION).toBe(version);

    // With no contractVersion option, the client compares with BUILT_CONTRACT_VERSION.
    const same = serving(version);
    const api = createApi({ fetch: same.fetch, baseUrl: ORIGIN });
    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    const hook = renderHook(() => useContractMismatch());
    expect(hook.result.current).toBeNull();

    const other = serving(`${version}-other`);
    const differing = createApi({ fetch: other.fetch, baseUrl: ORIGIN });
    await expectOk(differing.client.decisions.listPending({ limit: 50 }));
    hook.rerender();
    expect(hook.result.current).toEqual({ serverVersion: `${version}-other` });
  });
});
