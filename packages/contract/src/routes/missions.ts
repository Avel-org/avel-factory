import { Page } from "../dto/common.js";
import { ProposalDto } from "../dto/decisions.js";
import {
  CancelMissionInput,
  CreateBudgetIncreaseInput,
  CreateMissionInput,
  CreatePassApprovalInput,
  CreateReadinessWaiverInput,
  CreateReleaseInput,
  FinalizeMissionInput,
  ListMessagesInput,
  ListMissionsInput,
  MessageDto,
  MissionDetailDto,
  MissionDto,
  MissionIdInput,
  MissionPauseDto,
  MissionRefreshDto,
  OnboardingSessionDto,
  PassApprovalDto,
  PauseMissionInput,
  PostMessageInput,
  ReadinessWaiverDto,
  ReleaseApprovalDto,
  ResumeMissionInput,
  UpdateMissionInput,
} from "../dto/missions.js";
import { route } from "./route.js";

const tag = "Missions";

export const missions = {
  list: route(19, "GET", "/api/missions", tag, "List missions")
    .input(ListMissionsInput)
    .output(Page(MissionDto)),
  create: route(20, "POST", "/api/missions", tag, "A new mission starts as a draft with a client")
    .input(CreateMissionInput)
    .output(MissionDto),
  get: route(
    21,
    "GET",
    "/api/missions/{missionId}",
    tag,
    "State, gate strip, onboarding progress and checkpoints, why, deliveries",
  )
    .input(MissionIdInput)
    .output(MissionDetailDto),
  update: route(22, "PATCH", "/api/missions/{missionId}", tag, "Links a repo connection")
    .input(UpdateMissionInput)
    .output(MissionDto),
  pause: route(23, "POST", "/api/missions/{missionId}/pauses", tag, "Pause")
    .input(PauseMissionInput)
    .output(MissionPauseDto),
  resume: route(
    24,
    "DELETE",
    "/api/missions/{missionId}/pauses/{pauseId}",
    tag,
    "Resume (ends that pause row; pauses are independent rows, not a stack, per the schema)",
  )
    .input(ResumeMissionInput)
    .output(MissionPauseDto),
  cancel: route(25, "POST", "/api/missions/{missionId}/cancellations", tag, "Cancel")
    .input(CancelMissionInput)
    .output(MissionDto),
  rerunContext: route(
    26,
    "POST",
    "/api/missions/{missionId}/context-runs",
    tag,
    "Read the context again after it was blocked",
  )
    .input(MissionIdInput)
    .output(OnboardingSessionDto),
  waiveReadiness: route(
    27,
    "POST",
    "/api/missions/{missionId}/readiness-waivers",
    tag,
    "Proceed on a partial readiness result, with a reason",
  )
    .input(CreateReadinessWaiverInput)
    .output(ReadinessWaiverDto),
  finalize: route(
    28,
    "POST",
    "/api/missions/{missionId}/finalizations",
    tag,
    "Approval #1, with the plan version",
  )
    .input(FinalizeMissionInput)
    .output(MissionDto),
  approvePass: route(
    29,
    "POST",
    "/api/missions/{missionId}/pass-approvals",
    tag,
    "The receipt hash and a reason",
  )
    .input(CreatePassApprovalInput)
    .output(PassApprovalDto),
  release: route(
    30,
    "POST",
    "/api/missions/{missionId}/releases",
    tag,
    "Approval #2, with the receipt hash and, for a pass, the pass approval ID",
  )
    .input(CreateReleaseInput)
    .output(ReleaseApprovalDto),
  refresh: route(
    31,
    "POST",
    "/api/missions/{missionId}/refreshes",
    tag,
    "Refresh onto a newer client main",
  )
    .input(MissionIdInput)
    .output(MissionRefreshDto),
  increaseBudget: route(
    32,
    "POST",
    "/api/missions/{missionId}/budget-increases",
    tag,
    "Opens a budget-increase proposal naming the module or mission budget and the amount",
  )
    .input(CreateBudgetIncreaseInput)
    .output(ProposalDto),
  listMessages: route(
    33,
    "GET",
    "/api/missions/{missionId}/messages",
    tag,
    "Canon chat history, from the onboarding messages table",
  )
    .input(ListMessagesInput)
    .output(Page(MessageDto)),
  postMessage: route(
    34,
    "POST",
    "/api/missions/{missionId}/messages",
    tag,
    "Your turn with Canon; replies stream on the trace stream",
  )
    .input(PostMessageInput)
    .output(MessageDto),
};
