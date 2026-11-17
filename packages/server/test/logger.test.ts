import { REQUEST_ID_HEADER } from "@avel/contract";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { appRunning, fixedIds, get } from "./support/harness.ts";

const ID = "0193a000-0000-7000-8000-0000000000dd";

describe("T-B1-09 · spike 1.4: the JSON logger in Effect's logger slot", () => {
  it("writes one JSON line per log call, each carrying the request ID", async () => {
    const lines: string[] = [];
    const app = appRunning(
      () =>
        Effect.gen(function* () {
          yield* Effect.logInfo("first-call-marker");
          yield* Effect.logWarning("second-call-marker");
          return {};
        }),
      { layer: fixedIds(ID), logLine: (line) => lines.push(line) },
    );
    const res = await get(app, "/api/health");
    expect(res.status).toBe(200);
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(ID);

    // Every line the logger wrote is one JSON object on one line.
    for (const line of lines) {
      expect(line.trim()).not.toContain("\n");
      expect(JSON.parse(line)).toEqual(expect.any(Object));
    }

    for (const marker of ["first-call-marker", "second-call-marker"]) {
      const mine = lines.filter((l) => l.includes(marker));
      expect(mine, marker).toHaveLength(1);
      expect((JSON.parse(mine[0] as string) as { requestId?: string }).requestId).toBe(ID);
    }
  });
});
