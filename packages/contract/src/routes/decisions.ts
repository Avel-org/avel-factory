import { Page } from "../dto/common.js";
import {
  DecideProposalInput,
  ListPendingDecisionsInput,
  PendingDecisionDto,
  ProposalIdInput,
  ProposalViewDto,
} from "../dto/decisions.js";
import { route } from "./route.js";

const tag = "Decisions";

export const decisions = {
  listPending: route(
    52,
    "GET",
    "/api/pending-decisions",
    tag,
    "Everything waiting on you: proposals, factory PRs, checkpoints, finalize, Canon's questions, pass approvals, releases, package commits and follow-ups",
  )
    .input(ListPendingDecisionsInput)
    .output(Page(PendingDecisionDto)),
  getProposal: route(53, "GET", "/api/proposals/{proposalId}", tag, "One proposal")
    .input(ProposalIdInput)
    .output(ProposalViewDto),
  decide: route(
    54,
    "POST",
    "/api/proposals/{proposalId}/decisions",
    tag,
    "Choose an option, with a reason",
  )
    .input(DecideProposalInput)
    .output(ProposalViewDto),
};
