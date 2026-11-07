import { z } from "zod";
import { IsoTime, Micros, Placeholder } from "./common.js";

/** Evals, later (route 92). */

/** `agent_configs`. */
export const AgentConfigDto = z.object({
  hash: z.string(),
  factoryCommit: z.string(),
  model: z.string(),
  modelSnapshot: z.string(),
  effort: z.string(),
  sdkVersion: z.string(),
  harnessVersion: z.string(),
  rendererVersion: z.string(),
  selectorVersion: z.string(),
  agentVersionSha256: z.string(),
  skillsSha256: z.string(),
  rulesVersion: z.string(),
  kbRelease: z.string(),
  tools: z.array(z.string()),
  capMinutes: z.int(),
  capMicros: Micros,
  maxTurns: z.int(),
  retryProtocolVersion: z.string(),
  roomImageDigest: z.string(),
  checkRunnerDigest: z.string(),
  createdAt: IsoTime,
});
export type AgentConfigDto = z.infer<typeof AgentConfigDto>;

/** Route 92: "Live results per config". The results have no shape yet. */
export const EvalConfigDto = AgentConfigDto.extend({
  results: Placeholder,
});
export type EvalConfigDto = z.infer<typeof EvalConfigDto>;
