import { eventIterator } from "@orpc/contract";
import { Page } from "../dto/common.js";
import { ProposalDto } from "../dto/decisions.js";
import {
  CancelMissionInput,
  CanonMessageDto,
  CanonStreamChunk,
  CreateBudgetIncreaseInput,
  CreateMissionInput,
  CreatePassApprovalInput,
  CreateReadinessWaiverInput,
  CreateReleaseInput,
  FinalizeMissionInput,
  ListMessagesInput,
  ListMissionsInput,
  MissionDetailDto,
  MissionDto,
  MissionIdInput,
  MissionListRowDto,
  MissionPauseDto,
  MissionRefreshDto,
  OnboardingSessionDto,
  PassApprovalDto,
  PauseMissionInput,
  ReadinessWaiverDto,
  ReleaseApprovalDto,
  ResumeMessageInput,
  ResumeMissionInput,
  SendMessageInput,
  TranscribeInput,
  TranscriptChunk,
  UpdateMissionInput,
} from "../dto/missions.js";
import { canonErrorMap, missionKindErrorMap } from "../errors.js";
import { route } from "./route.js";

const tag = "Missions";

export const missions = {
  list: route(19, "GET", "/api/missions", tag, "List missions")
    .input(ListMissionsInput)
    .output(Page(MissionListRowDto)),
  create: route(
    20,
    "POST",
    "/api/missions",
    tag,
    "A new mission starts as a draft with a name; Canon asks first whether it's a client project or a template (CR-W22)",
  )
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
    .errors(missionKindErrorMap)
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
    .output(Page(CanonMessageDto)),
  postMessage: route(
    34,
    "POST",
    "/api/missions/{missionId}/messages",
    tag,
    "Your turn with Canon; his reply streams back as it's written, and aborting the request stops it (CR-W19)",
  )
    .errors(canonErrorMap)
    .input(SendMessageInput)
    .output(eventIterator(CanonStreamChunk)),
  resumeMessage: route(
    null,
    "GET",
    "/api/missions/{missionId}/messages/{messageId}/stream",
    tag,
    "Re-attach to a reply still streaming; `STREAM_GONE` once it's finished (CR-W19)",
  )
    .errors(canonErrorMap)
    .input(ResumeMessageInput)
    .output(eventIterator(CanonStreamChunk)),
  transcribe: route(
    null,
    "POST",
    "/api/missions/{missionId}/transcriptions",
    tag,
    "A recorded clip in, its transcript streamed back for review; never sent on its own (CR-W19)",
  )
    .errors(canonErrorMap)
    .input(TranscribeInput)
    .output(eventIterator(TranscriptChunk)),
};
