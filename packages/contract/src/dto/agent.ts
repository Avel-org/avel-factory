import * as z from "zod/mini";
import { CompletionReportBody } from "../completion-report.js";
import {
  CompletionReportStatus,
  DependencyRequestState,
  FindingKind,
  type ProposalKind,
} from "../value-lists.js";
import { IsoTime, Json, mutableFields, PageQuery, Reason, Sha, Uuid } from "./common.js";

/**
 * Agent, host tool server only (routes 94 to 99). The dispatch token names the
 * dispatch, attempt and mission, so no input repeats them.
 */

/** `completion_reports` (immutable); `body` is the CR-10 schema (E6). */
export const CompletionReportDto = z.object({
  attemptId: Uuid,
  status: z.enum(CompletionReportStatus),
  resultCommit: z.nullable(z.string()),
  body: CompletionReportBody,
  submittedAt: IsoTime,
  createdAt: IsoTime,
});
export type CompletionReportDto = z.infer<typeof CompletionReportDto>;

/** Route 94: the completion report. */
export const SubmitCompletionReportInput = z.object({
  status: z.enum(CompletionReportStatus),
  resultCommit: z.optional(Sha),
  body: CompletionReportBody,
});
export type SubmitCompletionReportInput = z.infer<typeof SubmitCompletionReportInput>;

/** Route 95: reviewers only. Code sets the route and the state. */
export const SubmitFindingInput = z.object({
  kind: z.enum(FindingKind),
  checkId: z.optional(z.string().check(z.minLength(1))),
  targetRef: z.optional(z.string().check(z.minLength(1))),
  evidence: z.optional(Json),
  reviewedCommit: z.optional(Sha),
});
export type SubmitFindingInput = z.infer<typeof SubmitFindingInput>;

/** `dependency_requests`. */
export const DependencyRequestDto = z.object({
  id: Uuid,
  missionId: Uuid,
  dispatchId: Uuid,
  proposalId: z.nullable(Uuid),
  name: z.string(),
  version: z.string(),
  reason: z.string(),
  newToFactory: z.boolean(),
  state: z.enum(DependencyRequestState),
  createdAt: IsoTime,
  ...mutableFields,
});
export type DependencyRequestDto = z.infer<typeof DependencyRequestDto>;

/** Route 96: at most 3 new packages per dispatch. */
export const RequestDependencyInput = z.object({
  name: z.string().check(z.minLength(1)),
  version: z.string().check(z.minLength(1)),
  reason: Reason,
});
export type RequestDependencyInput = z.infer<typeof RequestDependencyInput>;

/**
 * Route 97: "Test disputes, test changes, suppressions, contract changes", each a
 * proposal of that kind.
 */
export const EscalationKind = z.enum([
  "dispute",
  "test_change",
  "suppression",
  "contract_change",
] as const satisfies readonly ProposalKind[]);
export const EscalateInput = z.object({
  kind: EscalationKind,
  reason: Reason,
  options: Json,
});
export type EscalateInput = z.infer<typeof EscalateInput>;

/** `progress_notes`. */
export const ProgressNoteDto = z.object({
  id: Uuid,
  attemptId: Uuid,
  body: z.string(),
  createdAt: IsoTime,
});
export type ProgressNoteDto = z.infer<typeof ProgressNoteDto>;

/** Route 98. */
export const AddProgressNoteInput = z.object({ body: z.string().check(z.trim(), z.minLength(1)) });
export type AddProgressNoteInput = z.infer<typeof AddProgressNoteInput>;

/** Route 99: the kb-search tool. */
export const SearchKbEntriesInput = z.extend(PageQuery, {
  query: z.string().check(z.trim(), z.minLength(1)),
});
export type SearchKbEntriesInput = z.infer<typeof SearchKbEntriesInput>;
