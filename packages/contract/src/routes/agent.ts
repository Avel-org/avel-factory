import {
  AddProgressNoteInput,
  CompletionReportDto,
  DependencyRequestDto,
  EscalateInput,
  ProgressNoteDto,
  RequestDependencyInput,
  SearchKbEntriesInput,
  SubmitCompletionReportInput,
  SubmitFindingInput,
} from "../dto/agent.js";
import { Page } from "../dto/common.js";
import { ProposalDto } from "../dto/decisions.js";
import { FindingDto } from "../dto/gates.js";
import { KbEntryDto } from "../dto/library.js";
import { route } from "./route.js";

const tag = "Agent";
/** "Called only through the host tool server with a dispatch token." */
const agentOnly = { caller: "agent" } as const;

export const agent = {
  report: route(94, "POST", "/api/agent/reports", tag, "Completion report", agentOnly)
    .input(SubmitCompletionReportInput)
    .output(CompletionReportDto),
  finding: route(95, "POST", "/api/agent/findings", tag, "Reviewers only", agentOnly)
    .input(SubmitFindingInput)
    .output(FindingDto),
  dependencyRequest: route(
    96,
    "POST",
    "/api/agent/dependency-requests",
    tag,
    "At most 3 new packages per dispatch",
    agentOnly,
  )
    .input(RequestDependencyInput)
    .output(DependencyRequestDto),
  escalation: route(
    97,
    "POST",
    "/api/agent/escalations",
    tag,
    "Test disputes, test changes, suppressions, contract changes",
    agentOnly,
  )
    .input(EscalateInput)
    .output(ProposalDto),
  progressNote: route(98, "POST", "/api/agent/progress-notes", tag, "Progress notes", agentOnly)
    .input(AddProgressNoteInput)
    .output(ProgressNoteDto),
  searchKb: route(
    99,
    "GET",
    "/api/agent/kb-entries",
    tag,
    "The kb-search tool: read-only, scoped to the mission's client, its stack and global entries; logged in the trace",
    agentOnly,
  )
    .input(SearchKbEntriesInput)
    .output(Page(KbEntryDto)),
};
