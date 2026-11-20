/**
 * T-B16-02: startServer without AVEL_AUTH_SECRET, or with one shorter than 32 characters, fails to
 * start; its error names the variable and never contains the value given.
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import { envFor, loadStartServer, newSecret } from "./support.ts";

const database = testDatabase("b16config");

const messageOf = async (run: () => Promise<unknown>): Promise<string> => {
  try {
    await run();
  } catch (error) {
    return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }
  return "";
};

describe("T-B16-02 · the secret from Config", () => {
  it("a missing AVEL_AUTH_SECRET stops startup, and the error names the variable", async () => {
    const d = await database();
    const startServer = await loadStartServer();
    const env = envFor(d.url, { AVEL_AUTH_SECRET: undefined });
    let handle: { close(): Promise<void> } | undefined;
    const message = await messageOf(async () => {
      handle = await startServer(env);
    });
    await handle?.close();
    expect(handle).toBeUndefined();
    expect(message).toContain("AVEL_AUTH_SECRET");
  });

  it("a secret of 31 characters stops startup; the error names the variable and not the value", async () => {
    const d = await database();
    const startServer = await loadStartServer();
    const short = newSecret().slice(0, 31);
    expect(short).toHaveLength(31);
    let handle: { close(): Promise<void> } | undefined;
    const message = await messageOf(async () => {
      handle = await startServer(envFor(d.url, { AVEL_AUTH_SECRET: short }));
    });
    await handle?.close();
    expect(handle).toBeUndefined();
    expect(message).toContain("AVEL_AUTH_SECRET");
    expect(message).not.toContain(short);
  });

  it("a secret of 32 characters starts", async () => {
    const d = await database();
    const startServer = await loadStartServer();
    const ok = newSecret().slice(0, 32);
    const handle = await startServer(envFor(d.url, { AVEL_AUTH_SECRET: ok }));
    try {
      expect(handle.port).toBeGreaterThan(0);
    } finally {
      await handle.close();
    }
  });
});
