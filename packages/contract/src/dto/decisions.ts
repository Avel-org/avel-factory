import * as z from "zod/mini";
import { DecisionOwner } from "../events.js";
import {
  Checkpoint,
  DecisionKind,
  DecisionVerdict,
  DeliveryKind,
  FactoryChangeArea,
  FollowupChannel,
  ProjectKind,
  ProposalKind,
  ProposalState,
  ReceiptVerdict,
} from "../value-lists.js";
import { IsoTime, Json, Micros, mutableFields, Reason, RowVersion, Sha, Uuid } from "./common.js";
import { EvalRunSummaryDto } from "./evals.js";
import { DecisionPlain } from "./plain.js";

/**
 * Decisions (routes 52 to 54): CR-W2 as accepted on Nov 6, extended by CR-W2 (Nov 3),
 * CR-W9, CR-W11, CR-W15, CR-W16, CR-W17, CR-W18 section 4, CR-W19 section 8 and CR-W22.
 */

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
  /** CR-W15: the proposal that replaced this one before it took effect. */
  supersededBy: z.nullable(Uuid),
  createdAt: IsoTime,
  ...mutableFields,
});
export type ProposalDto = z.infer<typeof ProposalDto>;

// ---------------------------------------------------------------- choices (CR-W2 section 3.2)

/** `proposals.options`: every write that creates or changes a proposal validates it. */
export const ProposalOptions = z.object({
  choices: z
    .array(
      z.object({
        choice: z.string().check(z.minLength(1)),
        label: z.string().check(z.minLength(1)),
        effect: z.enum(["approve", "reject", "other"]),
        consequence: z.string().check(z.minLength(1)),
        /** CR-W2 (Nov 3): exactly one choice is the one-tap default. */
        recommended: z.optional(z.boolean()),
      }),
    )
    .check(
      z.minLength(2),
      z.refine((cs) => new Set(cs.map((c) => c.choice)).size === cs.length, {
        message: "Each choice must be unique",
      }),
    ),
});
export type ProposalOptions = z.infer<typeof ProposalOptions>;

/** One choice as the page shows it: `choice` is the exact string route 54 takes. */
export const DecisionChoice = z.object({
  choice: z.string(),
  label: z.string(),
  consequence: z.string(),
  effect: z.enum(["approve", "reject", "other"]),
  recommended: z.boolean(),
});
export type DecisionChoice = z.infer<typeof DecisionChoice>;

// ---------------------------------------------------------------- the base (every member)

/**
 * What the item binds to, as the earlier item showed it (CR-W15): "4", a receipt hash, a
 * head SHA. `tookEffect: false` means it was superseded before it was carried out.
 */
export const PreviousDecision = z.object({
  ref: z.string(),
  verdict: z.enum(DecisionVerdict),
  optionLabel: z.nullable(z.string()),
  boundVersion: z.string(),
  decidedAt: IsoTime,
  reason: z.nullable(z.string()),
  tookEffect: z.boolean(),
});
export type PreviousDecision = z.infer<typeof PreviousDecision>;

/** A short plain line of evidence; `detailRef` opens a sheet behind Details (CR-W2). */
export const EvidenceLine = z.object({
  label: z.string(),
  value: z.string(),
  detailRef: z.optional(z.string()),
});
export type EvidenceLine = z.infer<typeof EvidenceLine>;

/** The mission an item is about. `name` is the project's name (CR-W22). */
export const DecisionMission = z.object({
  id: Uuid,
  name: z.string(),
  kind: z.nullable(z.enum(ProjectKind)),
  clientName: z.nullable(z.string()),
});
export type DecisionMission = z.infer<typeof DecisionMission>;

/**
 * `reasonRequired` (conflict 1): CR-W2's `{ approve, reject }`, not CR-W18's one boolean,
 * because a checkpoint's "request changes" takes a reason and its approval doesn't.
 */
export const ReasonRequired = z.object({ approve: z.boolean(), reject: z.boolean() });
export type ReasonRequired = z.infer<typeof ReasonRequired>;

/**
 * - `ref` is `<kind>:<id>`, unique across the factory because `<id>` is a row's UUID, a
 *   mission's UUID or a PR number (conflict 7). Display labels like "Q-0.1a" are a
 *   question's `code`, unique per session, never a ref.
 * - `asOfSeq` is the event `seq` the item reflects: the web ignores an event about it with
 *   a `seq` at or below it (CR-W1, "versions on every object change").
 * - `rejectable: false` means leaving it waiting is the "no" (CR-W11).
 * - `unlocks` names what approving opens, in plain words (CR-W18 section 4).
 * - `previous` and `plain.returned` are CR-W15's.
 */
const base = {
  ref: z.string().check(z.minLength(3)),
  owner: z.enum(DecisionOwner),
  mission: z.nullable(DecisionMission),
  createdAt: IsoTime,
  expiresAt: z.nullable(IsoTime),
  asOfSeq: z.int(),
  plain: DecisionPlain,
  evidence: z.array(EvidenceLine),
  reasonRequired: ReasonRequired,
  rejectable: z.boolean(),
  unlocks: z.nullable(z.string()),
  previous: z.nullable(PreviousDecision),
};

/** Only `budget_increase`, `contract_change` and `repin` carry it (FM 86); never 0 for "n/a". */
export const CostImpact = z.object({ micros: Micros, estimated: z.boolean() });

export const ProposalDecision = z.object({
  kind: z.literal("proposal"),
  ...base,
  target: z.object({
    proposalId: Uuid,
    proposalKind: z.enum(ProposalKind),
    subjectKey: z.string(),
    moduleRunId: z.nullable(Uuid),
    version: z.int().check(z.minimum(1)),
    /** Every choice in order; empty when `options` doesn't parse, and then `decidable` is false. */
    choices: z.array(DecisionChoice),
    decidable: z.boolean(),
  }),
  costImpact: z.optional(CostImpact),
  /** `budget_increase` only: AI budget from and to (CR-W2; allowed, CR-W20 section 3). */
  budget: z.nullable(
    z.object({
      scope: z.enum(["module", "mission"]),
      moduleRef: z.nullable(z.string()),
      fromMicros: Micros,
      toMicros: Micros,
    }),
  ),
});

export const FactoryChangeDecision = z.object({
  kind: z.literal("factory_change"),
  ...base,
  target: z.object({
    changeId: z.string().check(z.regex(/^[1-9][0-9]*$/)),
    prNumber: z.int(),
    headSha: Sha,
    url: z.url(),
    area: z.enum(FactoryChangeArea),
    /** CR-W16: set when the PR edits a skill; null means "Not tried on past tasks". */
    evalRun: z.nullable(EvalRunSummaryDto),
  }),
});

export const CheckpointDecision = z.object({
  kind: z.literal("checkpoint"),
  ...base,
  target: z.object({
    checkpointId: Uuid,
    checkpoint: z.enum(Checkpoint),
    version: z.int(),
    rowVersion: RowVersion,
  }),
});

export const PlanFinalizeDecision = z.object({
  kind: z.literal("plan_finalize"),
  ...base,
  target: z.object({ missionId: Uuid, planId: Uuid, planVersion: z.int().check(z.minimum(1)) }),
});

/** A question's subject (CR-W19 section 8.1): what the card is pinned to. */
export const QuestionSubject = z.object({
  checkpoint: z.enum(["0.1", "0.2", "0.3", "0.4"]),
  moduleRef: z.nullable(z.string()),
  risk: z.nullable(z.string()),
  label: z.string(),
});
export type QuestionSubject = z.infer<typeof QuestionSubject>;

/** One option of a question, written by the server. */
export const QuestionOption = z.object({
  id: z.string().check(z.minLength(1)),
  label: z.string(),
  consequence: z.string(),
});
export type QuestionOption = z.infer<typeof QuestionOption>;

/**
 * CR-W22's gate: the question stays out of route 52 until the question `ref` is answered
 * with `choice`.
 */
export const QuestionAfter = z.object({ ref: z.string(), choice: z.string() });

export const CheckpointQuestionDecision = z.object({
  kind: z.literal("checkpoint_question"),
  ...base,
  target: z.object({
    questionId: Uuid,
    rowVersion: RowVersion,
    code: z.nullable(z.string()),
    text: z.string(),
    subject: QuestionSubject,
    blocking: z.boolean(),
    options: z.array(QuestionOption),
    /** Canon's recommendation: one of `options[].id`, or null. */
    recommended: z.nullable(z.string()),
    why: z.nullable(z.string()),
    after: z.nullable(QuestionAfter),
  }),
});

export const PassApprovalDecision = z.object({
  kind: z.literal("pass_approval"),
  ...base,
  target: z.object({
    missionId: Uuid,
    receiptId: Uuid,
    receiptHash: Sha,
    verdictCaps: z.array(z.string()),
  }),
});

export const ReleaseDecision = z.object({
  kind: z.literal("release"),
  ...base,
  target: z.object({
    missionId: Uuid,
    receiptId: Uuid,
    receiptHash: Sha,
    verdict: z.enum(ReceiptVerdict.filter((v): v is "verified" | "pass" => v !== "fail")),
    passApprovalId: z.nullable(Uuid),
    commitSha: Sha,
    deliveryKind: z.enum(DeliveryKind),
  }),
});

export const DispatchPackageCommitDecision = z.object({
  kind: z.literal("dispatch_package_commit"),
  ...base,
  target: z.object({ missionId: Uuid, packageHash: Sha }),
});

/** CR-W17: `copy` until a mail service exists; then approving means "I sent it myself". */
const followupTarget = {
  followupId: Uuid,
  draftHash: Sha,
  channel: z.enum(FollowupChannel),
  /** The server-written draft, plain text. */
  draft: z.string(),
};

export const FollowupSendDecision = z.object({
  kind: z.literal("followup_send"),
  ...base,
  target: z.object(followupTarget),
});

export const UpkeepOfferDecision = z.object({
  kind: z.literal("upkeep_offer"),
  ...base,
  target: z.object({ ...followupTarget, clientId: Uuid, signals: z.array(z.string()) }),
});

/**
 * Route 52's row: one union over everything waiting on the operator (CR-W2). Ordered by
 * the server: items that came back first (CR-W15 rule 5), then expiring soonest, then
 * deadline risk, then oldest.
 */
export const PendingDecisionDto = z.discriminatedUnion("kind", [
  ProposalDecision,
  FactoryChangeDecision,
  CheckpointDecision,
  PlanFinalizeDecision,
  CheckpointQuestionDecision,
  PassApprovalDecision,
  ReleaseDecision,
  DispatchPackageCommitDecision,
  FollowupSendDecision,
  UpkeepOfferDecision,
]);
export type PendingDecisionDto = z.infer<typeof PendingDecisionDto>;
export type PendingDecisionOf<K extends DecisionKind> = Extract<PendingDecisionDto, { kind: K }>;

/** Route 52's input: the usual page, and `?missionId=` for a project's Decisions tab. */
export const ListPendingDecisionsInput = z.object({
  cursor: z.optional(z.string().check(z.minLength(1))),
  limit: z.optional(z.coerce.number().check(z.int(), z.minimum(1), z.maximum(100))),
  missionId: z.optional(Uuid),
});
export type ListPendingDecisionsInput = z.infer<typeof ListPendingDecisionsInput>;

// ---------------------------------------------------------------- routes 53 and 54

export const ProposalIdInput = z.object({ proposalId: Uuid });
export type ProposalIdInput = z.infer<typeof ProposalIdInput>;

/**
 * Routes 53 and 54's output (CR-W2 section 4): the `proposal` member's fields, plus the
 * resolution columns, so "decided elsewhere" and "Review version N" read the same row.
 */
export const ProposalViewDto = z.object({
  ...ProposalDecision.shape,
  state: z.enum(ProposalState),
  choice: z.nullable(z.string()),
  choiceReason: z.nullable(z.string()),
  resolvedBy: z.nullable(Uuid),
  resolvedAt: z.nullable(IsoTime),
  supersededBy: z.nullable(z.string()),
  rowVersion: RowVersion,
});
export type ProposalViewDto = z.infer<typeof ProposalViewDto>;

/** Route 54 (unchanged): bound to `proposals.version` (Q4); a reason for every choice. */
export const DecideProposalInput = z.object({
  proposalId: Uuid,
  version: z.int().check(z.minimum(1)),
  choice: z.string().check(z.minLength(1)),
  reason: Reason,
});
export type DecideProposalInput = z.infer<typeof DecideProposalInput>;

/** `GET /api/pending-decisions/{ref}` isn't a route: the web reads the list (FM 161). */
export const DecisionRef = z.string().check(z.regex(/^[a-z_]+:[0-9a-z-]+$/));
export type DecisionRef = z.infer<typeof DecisionRef>;

/** Parse a `ref` at its first `:` (CR-W2 section 1). */
export function parseDecisionRef(ref: string): { kind: DecisionKind; id: string } | null {
  const at = ref.indexOf(":");
  if (at < 1) return null;
  const kind = ref.slice(0, at) as DecisionKind;
  return DecisionKind.includes(kind) ? { kind, id: ref.slice(at + 1) } : null;
}
