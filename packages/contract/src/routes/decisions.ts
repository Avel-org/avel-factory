import { Page, PageQuery } from "../dto/common.js";
import {
  DecideProposalInput,
  PendingDecisionDto,
  ProposalDto,
  ProposalIdInput,
} from "../dto/decisions.js";
import { route } from "./route.js";

const tag = "Decisions";

export const decisions = {
  listPending: route(
    52,
    "GET",
    "/api/pending-decisions",
    tag,
    "Everything waiting on you: proposals of every kind, plus open factory PRs",
  )
    .input(PageQuery)
    .output(Page(PendingDecisionDto)),
  getProposal: route(53, "GET", "/api/proposals/{proposalId}", tag, "One proposal")
    .input(ProposalIdInput)
    .output(ProposalDto),
  decide: route(
    54,
    "POST",
    "/api/proposals/{proposalId}/decisions",
    tag,
    "Choose an option, with a reason",
  )
    .input(DecideProposalInput)
    .output(ProposalDto),
};
