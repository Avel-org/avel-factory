import * as z from "zod/mini";
import { EvalRunAim, EvalRunStage, EvalRunState, EvalSet } from "../value-lists.js";
import { IsoTime, Micros, Placeholder, Uuid } from "./common.js";
import { PlainShort } from "./plain.js";

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
export const EvalConfigDto = z.extend(AgentConfigDto, {
  results: Placeholder,
});
export type EvalConfigDto = z.infer<typeof EvalConfigDto>;

// ---------------------------------------------------------------- CR-W16: eval runs

/** The interval of the primary metric: 95% bootstrap, per the promotion rule. */
const Share = z.number().check(z.minimum(0), z.maximum(1));

/**
 * An eval run's summary (CR-W16), on a `factory_change` decision that edits a skill and in
 * `evals.run.*` events. `headSha` is the PR head it ran on: a different head means "Ran on an
 * earlier draft". No money: the run's AI cost is on the eval report, not the decision.
 */
export const EvalRunSummaryDto = z.object({
  id: Uuid,
  stage: z.enum(EvalRunStage),
  set: z.enum(EvalSet),
  aim: z.enum(EvalRunAim),
  state: z.enum(EvalRunState),
  headSha: z.nullable(z.string()),
  tasks: z.int(),
  repeats: z.int(),
  primary: z.object({
    metric: z.literal("first_attempt_pass"),
    baseline: z.nullable(Share),
    candidate: z.nullable(Share),
    interval: z.nullable(z.object({ low: z.number(), high: z.number() })),
  }),
  verdict: z.nullable(z.enum(["improved", "as_good", "worse", "inconclusive"])),
  plain: z.nullable(PlainShort),
});
export type EvalRunSummaryDto = z.infer<typeof EvalRunSummaryDto>;

/** "See the report" (CR-W16 open question 3): one run with its results and its AI cost. */
export const EvalRunDto = z.extend(EvalRunSummaryDto, {
  baselineConfigHash: z.string(),
  candidateConfigHash: z.string(),
  aiCostMicros: Micros,
  startedAt: z.nullable(IsoTime),
  finishedAt: z.nullable(IsoTime),
  results: z.array(
    z.object({
      taskId: Uuid,
      repeat: z.int(),
      config: z.enum(["baseline", "candidate"]),
      passedFirstAttempt: z.boolean(),
    }),
  ),
});
export type EvalRunDto = z.infer<typeof EvalRunDto>;

export const EvalRunIdInput = z.object({ runId: Uuid });
export type EvalRunIdInput = z.infer<typeof EvalRunIdInput>;
