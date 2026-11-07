// An inert stand-in for src/data/pending-decisions.ts (vitest.config.ts). Its schemas accept
// nothing, and its parsers find no rows.

import { z } from "zod";

export const PendingDecisionRow = z.object({ unbuilt: z.literal(true) });
export type PendingDecisionRow = z.infer<typeof PendingDecisionRow>;
export const DecisionChoice = z.object({ unbuilt: z.literal(true) });
export const CostImpact = z.object({ unbuilt: z.literal(true) });

export interface ParsedPage {
  rows: PendingDecisionRow[];
  unreadable: number;
  nextCursor: string | null;
}

export function parsePendingPage(_page: unknown): ParsedPage {
  return { rows: [], unreadable: 0, nextCursor: null };
}

export function selectPendingPages(_data: unknown): ParsedPage {
  return { rows: [], unreadable: 0, nextCursor: null };
}
