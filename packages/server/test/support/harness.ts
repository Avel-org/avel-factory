/**
 * Shared harness for T-B1's acceptance tests. It names the server's seams once.
 *
 * The seams the build must provide (listed in the completion report for the lead to confirm
 * before the lock):
 *   src/platform/app.ts            createApp({ router?, layer?, logLine? }) -> { fetch(Request) }
 *   src/platform/effect-handler.ts effectHandler(({ input }) => program)
 *   src/platform/ids.ts            Ids: an Effect service, { uuidv7: Effect<string> }
 *   src/platform/errors.ts         NotFound: a tagged error (tag "NotFound") mapped to NOT_FOUND
 */
import { contract } from "@avel/contract";
import { implement } from "@orpc/server";
import { Effect, Layer } from "effect";
import { createApp } from "../../src/platform/app.ts";
import { effectHandler } from "../../src/platform/effect-handler.ts";
import { Ids } from "../../src/platform/ids.ts";

export const ORIGIN = "http://avel.test";

/** A UUIDv7 shape: version nibble 7, variant 8 to b. */
export const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** An Ids layer that hands out these UUIDv7s in order, then repeats the last. */
export function fixedIds(...ids: string[]): Layer.Layer<Ids> {
  let n = 0;
  return Layer.succeed(Ids)({
    uuidv7: Effect.sync(() => ids[Math.min(n++, ids.length - 1)] as string),
  });
}

export function get(app: { fetch(r: Request): Promise<Response> }, path: string, headers = {}) {
  return app.fetch(new Request(`${ORIGIN}${path}`, { headers }));
}

type Program = Parameters<typeof effectHandler>[0];

/**
 * An app whose route 6 runs this program through effectHandler, so a test can fail it, kill
 * it or interrupt it. `logLine` collects what the JSON logger writes.
 */
export function appRunning(
  program: Program,
  options: { layer?: Layer.Layer<Ids>; logLine?: (line: string) => void } = {},
) {
  const os = implement(contract);
  const router = { health: { health: os.health.health.handler(effectHandler(program)) } };
  return createApp({ router, ...options });
}

export function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
