/**
 * How each decision kind is approved (CR-W2, "How each kind is approved"): the route, and
 * the input built from the item's `target` alone, never a second read. `reason` is asked for
 * only where `reasonRequired` says so; `choice` and `answer` only where the kind has them.
 */

import type {
  DecideProposalInput,
  PendingDecisionDto,
  PendingDecisionOf,
} from "./dto/decisions.js";
import type { CommitDispatchPackageInput } from "./dto/dispatch-package.js";
import type { MergeFactoryChangeInput } from "./dto/factory.js";
import type { AnswerQuestionInput, ApproveCheckpointInput } from "./dto/gate0.js";
import type {
  CreatePassApprovalInput,
  CreateReleaseInput,
  FinalizeMissionInput,
} from "./dto/missions.js";
import type { SendFollowupInput } from "./dto/pipeline.js";
import type { DecisionKind } from "./value-lists.js";

/** The contract path of each kind's approve route: `[group, procedure]`. */
export const decisionApproveRoutes = {
  proposal: ["decisions", "decide"],
  factory_change: ["factory", "mergeChange"],
  checkpoint: ["gate0", "approveCheckpoint"],
  plan_finalize: ["missions", "finalize"],
  checkpoint_question: ["gate0", "answerQuestion"],
  pass_approval: ["missions", "approvePass"],
  release: ["missions", "release"],
  dispatch_package_commit: ["dispatchPackage", "commit"],
  followup_send: ["followups", "send"],
  upkeep_offer: ["followups", "send"],
} as const satisfies Record<DecisionKind, readonly [string, string]>;

/** What the operator adds on the tap: a reason, a proposal choice, or a question's answer. */
export type DecisionTap = {
  reason?: string;
  /** A proposal's `choice`, or a question's option `id` or `other`. */
  choice?: string;
  /** A question answered in your own words (`choice: "other"`). */
  answer?: string;
};

type ApproveInputs = {
  proposal: DecideProposalInput;
  factory_change: MergeFactoryChangeInput;
  checkpoint: ApproveCheckpointInput;
  plan_finalize: FinalizeMissionInput;
  checkpoint_question: AnswerQuestionInput;
  pass_approval: CreatePassApprovalInput;
  release: CreateReleaseInput;
  dispatch_package_commit: CommitDispatchPackageInput;
  followup_send: SendFollowupInput;
  upkeep_offer: SendFollowupInput;
};
export type ApproveInputOf<K extends DecisionKind> = ApproveInputs[K];

const builders: {
  [K in DecisionKind]: (d: PendingDecisionOf<K>, tap: DecisionTap) => ApproveInputs[K];
} = {
  proposal: (d, t) => ({
    proposalId: d.target.proposalId,
    version: d.target.version,
    choice:
      t.choice ??
      d.target.choices.find((c) => c.recommended)?.choice ??
      d.target.choices.find((c) => c.effect === "approve")?.choice ??
      "",
    reason: t.reason ?? "",
  }),
  factory_change: (d) => ({ changeId: d.target.changeId, headSha: d.target.headSha }),
  checkpoint: (d) => ({ checkpointId: d.target.checkpointId, rowVersion: d.target.rowVersion }),
  plan_finalize: (d) => ({ missionId: d.target.missionId, version: d.target.planVersion }),
  checkpoint_question: (d, t) => {
    const choice = t.choice ?? d.target.recommended ?? d.target.options[0]?.id ?? "";
    return {
      questionId: d.target.questionId,
      rowVersion: d.target.rowVersion,
      choice,
      ...(choice === "other" && t.answer !== undefined ? { answer: t.answer } : {}),
    };
  },
  pass_approval: (d, t) => ({
    missionId: d.target.missionId,
    receiptHash: d.target.receiptHash,
    reason: t.reason ?? "",
  }),
  release: (d) => ({
    missionId: d.target.missionId,
    receiptHash: d.target.receiptHash,
    ...(d.target.passApprovalId ? { passApprovalId: d.target.passApprovalId } : {}),
  }),
  dispatch_package_commit: (d) => ({
    missionId: d.target.missionId,
    packageHash: d.target.packageHash,
  }),
  followup_send: (d) => ({
    followupId: d.target.followupId,
    draftHash: d.target.draftHash,
    outcome: "sent",
  }),
  upkeep_offer: (d) => ({
    followupId: d.target.followupId,
    draftHash: d.target.draftHash,
    outcome: "sent",
  }),
};

/** The approve call for an item: its route and its input, from the item alone. */
export function approveCallFor<D extends PendingDecisionDto>(
  item: D,
  tap: DecisionTap = {},
): { route: (typeof decisionApproveRoutes)[D["kind"]]; input: ApproveInputs[D["kind"]] } {
  const build = builders[item.kind] as unknown as (
    d: D,
    t: DecisionTap,
  ) => ApproveInputs[D["kind"]];
  const route = decisionApproveRoutes[item.kind] as (typeof decisionApproveRoutes)[D["kind"]];
  return { route, input: build(item, tap) };
}
