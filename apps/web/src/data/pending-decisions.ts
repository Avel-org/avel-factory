import { IsoTime, type PendingDecisionDto, ProposalKind, Uuid } from "@avel/contract";
import type { InfiniteData } from "@tanstack/react-query";
import { z } from "zod";

/**
 * CR-W2's route 52 row, transcribed from CR-W2 sections 2.1 to 2.3, field for field (UI
 * contract section 1). m1's route 52 returns `Page(Placeholder)` (D30), so this is the web's
 * only copy of the row until the Step 1 contract exports `PendingDecisionDto`; then this file
 * imports the contract's instead.
 */

/** `DecisionChoice` (CR-W2 2.2): the exact `choice` route 54 accepts, its label and consequence. */
export const DecisionChoice = z.object({
  choice: z.string(),
  label: z.string(),
  consequence: z.string(),
});
export type DecisionChoice = z.infer<typeof DecisionChoice>;

/** `costImpact` (CR-W2 2.2, INT Q6). Step 1 never sends it. */
export const CostImpact = z.object({
  micros: z.int(),
  estimated: z.boolean(),
});
export type CostImpact = z.infer<typeof CostImpact>;

/** `kind: 'proposal'` (CR-W2 2.1 and 2.2): can be decided. */
const ProposalRow = z.object({
  kind: z.literal("proposal"),
  ref: z.string().regex(/^proposal:[^:]+$/),
  title: z.string(),
  createdAt: IsoTime,
  missionId: Uuid,
  clientName: z.string().nullable(),
  proposalId: Uuid,
  proposalKind: z.enum(ProposalKind),
  subjectKey: z.string(),
  moduleRunId: Uuid.nullable(),
  version: z.int().min(1),
  evidence: z.string(),
  approve: DecisionChoice.optional(),
  reject: DecisionChoice.optional(),
  expiresAt: IsoTime,
  costImpact: CostImpact.optional(),
});

/** `kind: 'factory_change'` (CR-W2 2.1 and 2.3): read-only. */
const FactoryChangeRow = z.object({
  kind: z.literal("factory_change"),
  ref: z.string().regex(/^factory_change:[1-9][0-9]*$/),
  title: z.string(),
  createdAt: IsoTime,
  missionId: z.null(),
  clientName: z.null(),
  changeId: z.string().regex(/^[1-9][0-9]*$/),
  prNumber: z.int(),
  headSha: z.string().regex(/^[0-9a-fA-F]{40}$/),
  url: z.url(),
});

export const PendingDecisionRow = z.discriminatedUnion("kind", [ProposalRow, FactoryChangeRow]);
export type PendingDecisionRow = z.infer<typeof PendingDecisionRow>;

/** One route 52 page, as m1 types it. */
export interface PendingPage {
  items: PendingDecisionDto[];
  nextCursor: string | null;
}

export interface ParsedPage {
  rows: PendingDecisionRow[];
  /** Rows that didn't parse: counted, never drawn (UC-24). */
  unreadable: number;
  nextCursor: string | null;
}

/** Parses one route 52 page (UI contract section 3). */
export function parsePendingPage(page: PendingPage): ParsedPage {
  const rows: PendingDecisionRow[] = [];
  let unreadable = 0;
  for (const item of page.items) {
    const parsed = PendingDecisionRow.safeParse(item);
    if (parsed.success) rows.push(parsed.data);
    else unreadable += 1;
  }
  return { rows, unreadable, nextCursor: page.nextCursor };
}

/**
 * Route 52's infinite query `select`: every loaded page through `parsePendingPage`, rows in
 * page order (the server's order), `unreadable` summed, and the last page's `nextCursor`.
 */
export function selectPendingPages(data: InfiniteData<PendingPage, unknown>): ParsedPage {
  const rows: PendingDecisionRow[] = [];
  let unreadable = 0;
  let nextCursor: string | null = null;
  for (const page of data.pages) {
    const parsed = parsePendingPage(page);
    rows.push(...parsed.rows);
    unreadable += parsed.unreadable;
    nextCursor = parsed.nextCursor;
  }
  return { rows, unreadable, nextCursor };
}
