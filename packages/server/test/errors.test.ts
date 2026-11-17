import { ErrorBody, REQUEST_ID_HEADER } from "@avel/contract";
import { Data, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/platform/app.ts";
import { effectHandler } from "../src/platform/effect-handler.ts";
import { NotFound } from "../src/platform/errors.ts";
import { appRunning, deferred, fixedIds, get } from "./support/harness.ts";

const ID = "0193a000-0000-7000-8000-0000000000cc";

describe("T-B1-04 · an unknown /api route", () => {
  it("returns 404 with the contract's ErrorBody, whose requestId equals X-Request-Id", async () => {
    const res = await get(createApp({ layer: fixedIds(ID) }), "/api/no-such-route");

    expect(res.status).toBe(404);
    const body = ErrorBody.parse(await res.json());
    expect(body.code).toBe("NOT_FOUND");
    expect(body.requestId).toBe(res.headers.get(REQUEST_ID_HEADER));
    expect(body.requestId).toBe(ID);
  });
});

describe("T-B1-05 · spike 1.1: a tagged failure through effectHandler", () => {
  it("returns the error's contract code and status, as ErrorBody with the requestId", async () => {
    const app = appRunning(() => Effect.fail(new NotFound({ message: "no such row" })), {
      layer: fixedIds(ID),
    });
    const res = await get(app, "/api/health");

    expect(res.status).toBe(404);
    const body = ErrorBody.parse(await res.json());
    expect(body.code).toBe("NOT_FOUND");
    expect(body.requestId).toBe(ID);
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(ID);
  });
});

describe("T-B1-06 · spike 1.1: a tag with no entry in the error table", () => {
  it("fails to compile (checked by `pnpm --filter @avel/server typecheck`)", () => {
    class Unmapped extends Data.TaggedError("Unmapped")<{ message: string }> {}

    // @ts-expect-error: "Unmapped" has no row in the error table, so this must not compile.
    const refused = effectHandler(() => Effect.fail(new Unmapped({ message: "x" })));
    // The control: a mapped tag compiles, so the line above fails for the right reason.
    const accepted = effectHandler(() => Effect.fail(new NotFound({ message: "x" })));

    expect(typeof refused).toBe("function");
    expect(typeof accepted).toBe("function");
  });
});

describe("T-B1-07 · an unexpected defect", () => {
  const DETAIL = "boom-internal-detail";

  it("returns 500 as ErrorBody with the requestId, hides the message, and logs it with the requestId", async () => {
    const lines: string[] = [];
    const app = appRunning(() => Effect.die(new Error(DETAIL)), {
      layer: fixedIds(ID),
      logLine: (line) => lines.push(line),
    });
    const res = await get(app, "/api/health");
    const text = await res.text();

    expect(res.status).toBe(500);
    // The catalog has no 500 code until CR-38: check shape and requestId, not the code.
    const body = ErrorBody.parse(JSON.parse(text));
    expect(body.requestId).toBe(ID);
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(ID);
    expect(text).not.toContain(DETAIL);

    const logged = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
    const mine = logged.filter((l) => JSON.stringify(l).includes(DETAIL));
    expect(mine.length).toBeGreaterThanOrEqual(1);
    for (const line of mine) expect(line.requestId).toBe(ID);
  });
});

describe("T-B1-08 · spike 1.3: an aborted request", () => {
  it("interrupts the program and runs its finalizers (a fake reservation is released)", async () => {
    const reserved = deferred();
    const released = deferred();
    let releases = 0;

    const app = appRunning(() =>
      Effect.scoped(
        Effect.gen(function* () {
          yield* Effect.acquireRelease(
            Effect.sync(() => reserved.resolve()),
            () =>
              Effect.sync(() => {
                releases += 1;
                released.resolve();
              }),
          );
          return yield* Effect.never;
        }),
      ),
    );

    const abort = new AbortController();
    // Left unawaited on purpose: the response may reject or answer once aborted.
    void app
      .fetch(new Request("http://avel.test/api/health", { signal: abort.signal }))
      .catch(() => undefined);

    await reserved.promise;
    expect(releases).toBe(0); // held while the request is open
    abort.abort();
    await released.promise;
    expect(releases).toBe(1);
  });
});
