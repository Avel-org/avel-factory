import {
  CreateDispatchOverrideInput,
  DispatchDetailDto,
  DispatchIdInput,
  ListMissionDispatchesInput,
  MissionDispatchesDto,
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
};
