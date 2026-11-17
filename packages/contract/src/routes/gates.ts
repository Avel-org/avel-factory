import { Page } from "../dto/common.js";
import { OverrideDto } from "../dto/dispatches.js";
import {
  AcceptFindingInput,
  CreateGateOverrideInput,
  FindingDto,
  IntegrationCommitDetailDto,
  IntegrationCommitIdInput,
  ListFindingsInput,
  MissionGatesDto,
  UpdateFindingInput,
} from "../dto/gates.js";
import { MissionIdInput } from "../dto/missions.js";
import { route } from "./route.js";

const tag = "Gates and findings";

export const gates = {
  listForMission: route(
    55,
    "GET",
    "/api/missions/{missionId}/gates",
    tag,
    "Every gate evaluation and integration commit",
  )
    .input(MissionIdInput)
    .output(MissionGatesDto),
  getIntegrationCommit: route(
    56,
    "GET",
    "/api/integration-commits/{integrationCommitId}",
    tag,
    "Results and log",
  )
    .input(IntegrationCommitIdInput)
    .output(IntegrationCommitDetailDto),
  override: route(
    57,
    "POST",
    "/api/missions/{missionId}/overrides",
    tag,
    "Gates 3 and 4 only; caps the verdict at pass. Gates 1, 2 and 5 are refused.",
  )
    .input(CreateGateOverrideInput)
    .output(OverrideDto),
};

export const findings = {
  list: route(58, "GET", "/api/missions/{missionId}/findings", tag, "List findings")
    .input(ListFindingsInput)
    .output(Page(FindingDto)),
  update: route(59, "PATCH", "/api/findings/{findingId}", tag, "Confirm or dismiss, with a reason")
    .input(UpdateFindingInput)
    .output(FindingDto),
  accept: route(
    60,
    "POST",
    "/api/findings/{findingId}/acceptances",
    tag,
    "Accept with a reason; caps the verdict at pass; refused for an integrity failure at Gate 5",
  )
    .input(AcceptFindingInput)
    .output(FindingDto),
};
