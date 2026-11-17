import * as z from "zod/mini";
import {
  FollowupChannel,
  FollowupKind,
  FollowupSentBy,
  FollowupState,
  LeadLostReason,
  LeadSource,
  PipelineStage,
} from "../value-lists.js";
import { IsoTime, mutableFields, PageQuery, RowVersion, Sha, Uuid } from "./common.js";
import { PlainShort } from "./plain.js";

/**
 * Pipeline (CR-W17 Phase 1): leads, follow-ups and the pipeline read. No amounts anywhere
 * (CR-W17 rule 5; CR-W20 section 3). Owned by the new `pipeline` module.
 */

/** `leads`: a lead is a client with status `lead`; this row holds only the extra fields. */
export const LeadDto = z.object({
  id: Uuid,
  clientId: Uuid,
  clientName: z.string(),
  source: z.enum(LeadSource),
  referrerId: z.nullable(Uuid),
  referrerName: z.nullable(z.string()),
  firstContactAt: IsoTime,
  notes: z.nullable(z.string()),
  lostReason: z.nullable(z.enum(LeadLostReason)),
  lostAt: z.nullable(IsoTime),
  stage: z.enum(PipelineStage),
  createdAt: IsoTime,
  ...mutableFields,
});
export type LeadDto = z.infer<typeof LeadDto>;

export const ListLeadsInput = z.extend(PageQuery, {
  stage: z.optional(z.enum(PipelineStage)),
});
export type ListLeadsInput = z.infer<typeof ListLeadsInput>;

/**
 * Create a lead: a new client with status `lead` and its `leads` row, in one transaction.
 * A name matching an archived client gets `CLIENT_NAME_TAKEN` with its `clientId`.
 */
export const CreateLeadInput = z.object({
  name: z.string().check(z.trim(), z.minLength(1), z.maxLength(120)),
  source: z.enum(LeadSource),
  referrerName: z.optional(z.string().check(z.trim(), z.minLength(1))),
  firstContactAt: z.optional(IsoTime),
  notes: z.optional(z.string().check(z.maxLength(2000))),
});
export type CreateLeadInput = z.infer<typeof CreateLeadInput>;

/** Close a lead as lost (nothing is deleted: a lost lead is a state). */
export const CloseLeadInput = z.object({
  leadId: Uuid,
  rowVersion: RowVersion,
  lostReason: z.enum(LeadLostReason),
});
export type CloseLeadInput = z.infer<typeof CloseLeadInput>;

/** `followups`: drafted by server templates, sent only through a decision. */
export const FollowupDto = z.object({
  id: Uuid,
  clientId: Uuid,
  missionId: z.nullable(Uuid),
  kind: z.enum(FollowupKind),
  channel: z.enum(FollowupChannel),
  draft: z.string(),
  draftHash: Sha,
  state: z.enum(FollowupState),
  sentAt: z.nullable(IsoTime),
  sentBy: z.nullable(z.enum(FollowupSentBy)),
  /** CR-W17 rule 3: a contact who unsubscribed gets nothing; the decision says so. */
  unsubscribed: z.boolean(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type FollowupDto = z.infer<typeof FollowupDto>;

export const FollowupIdInput = z.object({ followupId: Uuid });
export type FollowupIdInput = z.infer<typeof FollowupIdInput>;

/**
 * The approve route of `followup_send` and `upkeep_offer`, bound to `draftHash`. With
 * channel `copy` the factory sends nothing and records it as sent by you; `skip` is the no.
 */
export const SendFollowupInput = z.object({
  followupId: Uuid,
  draftHash: Sha,
  outcome: z.enum(["sent", "skipped"]),
});
export type SendFollowupInput = z.infer<typeof SendFollowupInput>;

/** The pipeline read: each client's derived stage, never set (CR-W17 rule 1). */
export const PipelineRowDto = z.object({
  clientId: Uuid,
  clientName: z.string(),
  stage: z.enum(PipelineStage),
  leadId: z.nullable(Uuid),
  missionIds: z.array(Uuid),
  lastActivityAt: z.nullable(IsoTime),
  salesMinutes: z.int(),
  proofConsent: z.boolean(),
  plain: PlainShort,
});
export type PipelineRowDto = z.infer<typeof PipelineRowDto>;

export const PipelineDto = z.object({
  stages: z.array(z.object({ stage: z.enum(PipelineStage), count: z.int() })),
  rows: z.array(PipelineRowDto),
});
export type PipelineDto = z.infer<typeof PipelineDto>;
