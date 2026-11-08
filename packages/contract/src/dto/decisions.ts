import * as z from "zod/mini";
import { ProposalKind, ProposalState } from "../value-lists.js";
import { IsoTime, Json, mutableFields, Placeholder, Reason, Uuid } from "./common.js";

/** Decisions (routes 52 to 54). */

/** `proposals`. */
export const ProposalDto = z.object({
  id: Uuid,
  missionId: Uuid,
  moduleRunId: z.nullable(Uuid),
  dispatchId: z.nullable(Uuid),
  kind: z.enum(ProposalKind),
  subjectKey: z.string(),
  version: z.int(),
  reason: z.string(),
  options: Json,
  state: z.enum(ProposalState),
  expiresAt: IsoTime,
  choice: z.nullable(z.string()),
  choiceReason: z.nullable(z.string()),
  resolvedBy: z.nullable(Uuid),
  resolvedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type ProposalDto = z.infer<typeof ProposalDto>;

/**
 * Route 52: "Everything waiting on you: proposals of every kind, plus open factory
 * PRs". A plain `Placeholder` (D30, finding 02): no accepted doc gives its shape,
 * CR-W2 isn't decided, and Step 1's routes 52 to 54 decide it.
 */
export const PendingDecisionDto = Placeholder;
export type PendingDecisionDto = z.infer<typeof PendingDecisionDto>;

export const ProposalIdInput = z.object({ proposalId: Uuid });
export type ProposalIdInput = z.infer<typeof ProposalIdInput>;

/**
 * Route 54: "Choose an option, with a reason", bound to the proposal's `version`
 * (Q4). `choice` and `reason` land in `proposals.choice` and `choice_reason`.
 */
export const DecideProposalInput = z.object({
  proposalId: Uuid,
  version: z.int().check(z.minimum(1)),
  choice: z.string().check(z.minLength(1)),
  reason: Reason,
});
export type DecideProposalInput = z.infer<typeof DecideProposalInput>;
