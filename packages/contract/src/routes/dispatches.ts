import * as z from "zod/mini";
import {
  AgentStepDto,
  CreateDispatchOverrideInput,
  DispatchDetailDto,
  DispatchIdInput,
  ListAttemptStepsInput,
  ListMissionDispatchesInput,
  MissionDispatchesDto,
  ModuleRunInput,
  ModuleRunViewDto,
  OverrideDto,
} from "../dto/dispatches.js";
import { route } from "./route.js";

const tag = "Dispatches";

export const dispatches = {
  listForMission: route(49, "GET", "/api/missions/{missionId}/dispatches", tag, "With DISPATCH.md")
    .input(ListMissionDispatchesInput)
    .output(MissionDispatchesDto),
  get: route(50, "GET", "/api/dispatches/{dispatchId}", tag, "Task doc versions, attempts, room")
    .input(DispatchIdInput)
    .output(DispatchDetailDto),
  override: route(
    51,
    "POST",
    "/api/dispatches/{dispatchId}/overrides",
    tag,
    "Start, retry, park or cancel by hand, with a reason",
  )
    .input(CreateDispatchOverrideInput)
    .output(OverrideDto),
  /** CR-W21 section 2: the module page. */
  getModule: route(
    null,
    "GET",
    "/api/missions/{missionId}/modules/{moduleRef}",
    tag,
    "One module run: its ladder, cost against its cap, attempts and findings (CR-W21)",
  )
    .input(ModuleRunInput)
    .output(ModuleRunViewDto),
  listSteps: route(
    null,
    "GET",
    "/api/attempts/{attemptId}/steps",
    tag,
    "An attempt's agent steps, oldest first, after a trace position (CR-W21)",
  )
    .input(ListAttemptStepsInput)
    .output(z.object({ items: z.array(AgentStepDto), lastSeq: z.nullable(z.int()) })),
};
