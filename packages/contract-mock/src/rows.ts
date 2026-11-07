import type { ProposalKind } from "@avel/contract";
import { z } from "zod";

/**
 * What the mock stores, and how it turns a stored row into CR-W2's route 52 row
 * (UI contract section 2, "Route 52"; CR-W2 sections 1 to 3).
 */

export type SeedRow =
  | {
      kind: "proposal";
      id: string; // UUIDv7
      missionId: string;
      clientName: string | null;
      proposalKind: ProposalKind; // from @avel/contract
      subjectKey: string;
      title: string;
      evidence: string;
      version: number;
      options: unknown; // stored raw, like proposals.options (CR-W2 3.2)
      createdAt: string;
      expiresAt: string;
      state?: "open" | "resolved" | "expired"; // default "open"
      moduleRunId?: string | null;
    }
  | {
      kind: "factory_change";
      prNumber: number;
      title: string;
      headSha: string; // 40 hex
      url: string;
      createdAt: string;
    };

export type ProposalSeed = Extract<SeedRow, { kind: "proposal" }>;
export type FactorySeed = Extract<SeedRow, { kind: "factory_change" }>;

/** A proposal as the store holds it: the seed plus the resolution columns. */
export interface StoredProposal {
  kind: "proposal";
  id: string;
  missionId: string;
  clientName: string | null;
  proposalKind: ProposalKind;
  subjectKey: string;
  title: string;
  evidence: string;
  version: number;
  options: unknown;
  createdAt: string;
  expiresAt: string;
  state: "open" | "resolved" | "expired";
  moduleRunId: string | null;
  choice: string | null;
  choiceReason: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  rowVersion: number;
  updatedAt: string;
}

export function toStoredProposal(seed: ProposalSeed): StoredProposal {
  return {
    kind: "proposal",
    id: seed.id,
    missionId: seed.missionId,
    clientName: seed.clientName,
    proposalKind: seed.proposalKind,
    subjectKey: seed.subjectKey,
    title: seed.title,
    evidence: seed.evidence,
    version: seed.version,
    options: structuredClone(seed.options),
    createdAt: seed.createdAt,
    expiresAt: seed.expiresAt,
    state: seed.state ?? "open",
    moduleRunId: seed.moduleRunId ?? null,
    choice: null,
    choiceReason: null,
    resolvedBy: null,
    resolvedAt: null,
    rowVersion: 1,
    updatedAt: seed.createdAt,
  };
}

/**
 * `ProposalOptions` (CR-W2 3.2), with Step 1's rule: at least 2 choices, each `choice`
 * unique, and exactly one `approve` and one `reject`.
 */
const ProposalChoice = z.object({
  choice: z.string().min(1),
  label: z.string().min(1),
  effect: z.enum(["approve", "reject", "other"]),
  consequence: z.string().min(1),
});

export const ProposalOptions = z
  .object({ choices: z.array(ProposalChoice).min(2) })
  .refine(
    (options) => new Set(options.choices.map((c) => c.choice)).size === options.choices.length,
  )
  .refine((options) => options.choices.filter((c) => c.effect === "approve").length === 1)
  .refine((options) => options.choices.filter((c) => c.effect === "reject").length === 1);
export type ProposalOptions = z.infer<typeof ProposalOptions>;

export type DecisionChoice = { choice: string; label: string; consequence: string };

/** The `approve` and `reject` choices, or null when `options` doesn't parse. */
export function decisionChoices(
  options: unknown,
): { approve: DecisionChoice; reject: DecisionChoice; choices: string[] } | null {
  const parsed = ProposalOptions.safeParse(options);
  if (!parsed.success) return null;
  const pick = (effect: "approve" | "reject"): DecisionChoice => {
    const found = parsed.data.choices.find((c) => c.effect === effect);
    if (found === undefined) throw new Error(`ProposalOptions passed without a ${effect} choice`);
    return { choice: found.choice, label: found.label, consequence: found.consequence };
  };
  return {
    approve: pick("approve"),
    reject: pick("reject"),
    choices: parsed.data.choices.map((c) => c.choice),
  };
}

/** The `ref` (CR-W2 section 1). */
export function refOf(row: StoredProposal | FactorySeed): string {
  return row.kind === "proposal" ? `proposal:${row.id}` : `factory_change:${row.prNumber}`;
}

/**
 * CR-W2's row, as route 52 sends it. `approve` and `reject` are absent when `options`
 * doesn't parse, and `costImpact` is never sent (Step 1). Absent fields are left out,
 * never set to `undefined`, so the row stays JSON.
 */
export function toPendingRow(row: StoredProposal | FactorySeed): Record<string, unknown> {
  if (row.kind === "factory_change") {
    return {
      kind: "factory_change",
      ref: refOf(row),
      title: row.title,
      createdAt: row.createdAt,
      missionId: null,
      clientName: null,
      changeId: String(row.prNumber),
      prNumber: row.prNumber,
      headSha: row.headSha,
      url: row.url,
    };
  }
  const choices = decisionChoices(row.options);
  return {
    kind: "proposal",
    ref: refOf(row),
    title: row.title,
    createdAt: row.createdAt,
    missionId: row.missionId,
    clientName: row.clientName,
    proposalId: row.id,
    proposalKind: row.proposalKind,
    subjectKey: row.subjectKey,
    moduleRunId: row.moduleRunId,
    version: row.version,
    evidence: row.evidence,
    ...(choices ? { approve: choices.approve, reject: choices.reject } : {}),
    expiresAt: row.expiresAt,
  };
}
