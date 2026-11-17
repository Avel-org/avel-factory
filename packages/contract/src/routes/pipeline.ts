import { Page } from "../dto/common.js";
import {
  CloseLeadInput,
  CreateLeadInput,
  FollowupDto,
  FollowupIdInput,
  LeadDto,
  ListLeadsInput,
  PipelineDto,
  SendFollowupInput,
} from "../dto/pipeline.js";
import { missionKindErrorMap, pipelineErrorMap } from "../errors.js";
import { route } from "./route.js";

const tag = "Pipeline";

/** CR-W17 Phase 1: leads, follow-ups and the pipeline read. No amounts (rule 5). */
export const leads = {
  list: route(null, "GET", "/api/leads", tag, "Leads, with their derived stage (CR-W17)")
    .input(ListLeadsInput)
    .output(Page(LeadDto)),
  create: route(
    null,
    "POST",
    "/api/leads",
    tag,
    "A new client with status lead, and its lead (CR-W17)",
  )
    .errors(missionKindErrorMap)
    .input(CreateLeadInput)
    .output(LeadDto),
  close: route(
    null,
    "POST",
    "/api/leads/{leadId}/closures",
    tag,
    "Close a lead as lost, with why (CR-W17)",
  )
    .input(CloseLeadInput)
    .output(LeadDto),
};

export const followups = {
  get: route(null, "GET", "/api/followups/{followupId}", tag, "A follow-up's draft (CR-W17)")
    .input(FollowupIdInput)
    .output(FollowupDto),
  send: route(
    null,
    "POST",
    "/api/followups/{followupId}/sends",
    tag,
    "Approve a follow-up or upkeep offer, bound to its draft hash: sent, or marked sent by you (CR-W17)",
  )
    .errors(pipelineErrorMap)
    .input(SendFollowupInput)
    .output(FollowupDto),
};

export const pipeline = {
  get: route(
    null,
    "GET",
    "/api/pipeline",
    tag,
    "Every client's derived stage, from lead to upkeep (CR-W17)",
  ).output(PipelineDto),
};
