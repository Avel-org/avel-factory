/**
 * T-B19-02 (t-b15-rigg-01): a webhook body over the limit is 413 with the contract's body and a
 * requestId, and nothing is written; a body sent without Content-Length is cut off at the limit,
 * so the server never reads the rest. The limit is GitHub's 25 MiB payload cap (support.ts).
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  alerts,
  deliver,
  deliveries,
  operator,
  versions,
  webhookApp,
} from "../factory-repo/support.ts";
import { expectErrorBody, GITHUB_PAYLOAD_CAP, MiB, sign } from "./support.ts";

const database = testDatabase("b19limit");
const URL = "http://avel.test/api/webhooks/github";
const PEER = { address: "192.0.2.77" };

/** A stream of `total` bytes, in 64 KiB chunks, that counts what the reader pulled. */
function counted(total: number) {
  const chunk = new Uint8Array(64 * 1024).fill(32);
  const state = { pulled: 0 };
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (state.pulled >= total) return controller.close();
      state.pulled += chunk.byteLength;
      controller.enqueue(chunk);
    },
  });
  return { stream, state };
}

const headers = (extra: Record<string, string> = {}) => ({
  "content-type": "application/json",
  "x-github-event": "pull_request",
  "x-github-delivery": `d-${Math.random().toString(16).slice(2)}`,
  ...extra,
});

async function nothingWritten(url: string) {
  expect(await deliveries(url)).toEqual([]);
  expect(await versions(url)).toEqual([]);
  expect(await alerts(url)).toEqual([]);
}

describe("T-B19-02 · the webhook's body limit", () => {
  it("a body over 25 MiB is 413 with the contract's body, unsigned or signed, and writes nothing", async () => {
    const d = await database();
    await operator(d.url);
    const app = webhookApp(d.url);
    const big = " ".repeat(GITHUB_PAYLOAD_CAP + 1);

    const unsigned = await app.fetch(
      new Request(URL, {
        method: "POST",
        headers: headers({ "content-length": String(big.length) }),
        body: big,
      }),
      PEER,
    );
    const body = await expectErrorBody(unsigned, 413);
    expect(body.code, "413 is not an unauthorized answer").not.toBe("UNAUTHORIZED");

    const signed = await app.fetch(
      new Request(URL, {
        method: "POST",
        headers: headers({
          "content-length": String(big.length),
          "x-hub-signature-256": sign(big),
        }),
        body: big,
      }),
      PEER,
    );
    await expectErrorBody(signed, 413);
    await nothingWritten(d.url);
  });

  it("a declared Content-Length over the limit is refused before the body is read", async () => {
    const d = await database();
    const app = webhookApp(d.url);
    const { stream, state } = counted(GITHUB_PAYLOAD_CAP + MiB);
    const res = await app.fetch(
      new Request(URL, {
        method: "POST",
        headers: headers({ "content-length": String(GITHUB_PAYLOAD_CAP + MiB) }),
        body: stream,
        duplex: "half",
      } as RequestInit),
      PEER,
    );
    await expectErrorBody(res, 413);
    expect(state.pulled, "the body was read before the length was checked").toBeLessThan(MiB);
    await nothingWritten(d.url);
  });

  it("a body without Content-Length is cut off at the limit, not buffered to its end", async () => {
    const d = await database();
    const app = webhookApp(d.url);
    const { stream, state } = counted(4 * GITHUB_PAYLOAD_CAP);
    const request = new Request(URL, {
      method: "POST",
      headers: headers(),
      body: stream,
      duplex: "half",
    } as RequestInit);
    expect(request.headers.get("content-length")).toBeNull();
    const res = await app.fetch(request, PEER);
    await expectErrorBody(res, 413);
    expect(state.pulled, "the whole body was read").toBeLessThanOrEqual(
      GITHUB_PAYLOAD_CAP + 8 * MiB,
    );
    await nothingWritten(d.url);
  });

  it("a signed body of 1 MiB is still accepted", async () => {
    const d = await database();
    await operator(d.url);
    const app = webhookApp(d.url);
    const res = await deliver(app, { zen: "x".repeat(MiB) }, { event: "ping" });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });
});
