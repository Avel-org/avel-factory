import { contract } from "@avel/contract";
import { implement } from "@orpc/server";
import { Effect } from "effect";
import { effectHandler } from "./effect-handler.ts";

const os = implement(contract);

/** Route 6, the only route implemented so far (CR-31): 200 with an empty object. */
export const healthRouter = {
  health: { health: os.health.health.handler(effectHandler(() => Effect.succeed({}))) },
};
