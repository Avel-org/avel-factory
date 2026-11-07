import type { DecisionChoice, PendingDecisionRow } from "../../data";
import type { DecisionTagProps, DecisionVariant } from "../../kit";
import { formatAgo } from "../../lib/time";

/**
 * The decisions module's renderers (UI contract section 5.1): how each route 52 row is drawn as
 * a `DecisionTag`. Every value comes from the row; nothing is derived (FM line 134).
 */

export type ProposalRow = Extract<PendingDecisionRow, { kind: "proposal" }>;
export type FactoryChangeRow = Extract<PendingDecisionRow, { kind: "factory_change" }>;

/** A proposal whose options parsed: it has both choices, so it can be decided. */
export type DecidableProposal = ProposalRow & { approve: DecisionChoice; reject: DecisionChoice };

/** The part of a tag that comes from the row alone: not its state, actions or errors. */
export type RowTagProps = Pick<
  DecisionTagProps,
  | "variant"
  | "idLabel"
  | "title"
  | "clientName"
  | "age"
  | "binds"
  | "evidence"
  | "consequence"
  | "approveLabel"
  | "rejectLabel"
  | "link"
  | "notAllowedReason"
>;

/** The `DecisionTag` variant for each `proposalKind`; the other six are the generic `Decision`. */
const VARIANT_OF: Partial<Record<ProposalRow["proposalKind"], DecisionVariant>> = {
  parked: "parked",
  contract_change: "contract",
  quarantine: "quarantine",
  budget_increase: "budget",
  test_change: "testChange",
  gate5: "finding",
  repin: "repin",
};

/** Any key outside DL's `AV_DECISION_VARIANTS` is drawn as the generic `Decision` (D1). */
const GENERIC_VARIANT: DecisionVariant = "decision";

export const UNREADABLE_OPTIONS_REASON =
  "This decision's options can't be read, so it can't be decided here.";

export function isDecidable(row: ProposalRow): row is DecidableProposal {
  return row.approve !== undefined && row.reject !== undefined;
}

/** `Waiting {formatAgo(now − createdAt)}` (DL `eD`); `now` is the latest route 52 fetch. */
function waitingAge(createdAt: string, now: number): string {
  return `Waiting ${formatAgo(now - Date.parse(createdAt))}`;
}

/** A proposal: with both choices it's decidable, without them it's Locked with the reason. */
export function proposalTagProps(row: ProposalRow, now: number): RowTagProps {
  const base: RowTagProps = {
    variant: VARIANT_OF[row.proposalKind] ?? GENERIC_VARIANT,
    title: row.title,
    clientName: row.clientName,
    age: waitingAge(row.createdAt, now),
    binds: { kind: "version", label: `Version ${row.version}`, value: String(row.version) },
    evidence: row.evidence,
  };
  if (!isDecidable(row)) return { ...base, notAllowedReason: UNREADABLE_OPTIONS_REASON };
  return {
    ...base,
    consequence: row.approve.consequence,
    approveLabel: row.approve.label,
    rejectLabel: row.reject.label,
  };
}

/** A factory PR: read-only, with its commit and a link to GitHub. */
export function factoryChangeTagProps(row: FactoryChangeRow, now: number): RowTagProps {
  return {
    variant: "factoryPr",
    idLabel: `#${row.prNumber}`,
    title: row.title,
    age: waitingAge(row.createdAt, now),
    binds: { kind: "sha", label: "Commit", value: row.headSha },
    link: { label: "Open on GitHub", href: row.url },
  };
}

/** Route 54's dialog copy for one choice (section 5.2, step 1). */
export interface DialogCopy {
  title: string;
  description: string;
  confirmLabel: string;
}

export function approveDialogCopy(row: DecidableProposal): DialogCopy {
  const { label, consequence } = row.approve;
  return {
    title: label === "Approve" ? "Approve this decision?" : `${label}?`,
    description: `${row.title}. ${consequence} Your reason goes on the record.`,
    confirmLabel: label,
  };
}

export function rejectDialogCopy(row: DecidableProposal): DialogCopy {
  const { label, consequence } = row.reject;
  return {
    title: label === "Reject" ? "Reject this decision?" : `${label}?`,
    description: `${row.title}. ${consequence} Your reason goes on the record and is shown to whoever picks it up next.`,
    confirmLabel: label,
  };
}
