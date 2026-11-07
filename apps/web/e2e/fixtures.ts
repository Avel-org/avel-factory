import { type APIRequestContext, test as base, expect } from "@playwright/test";

// One mock instance serves every test (UI contract sections 3 and 7), so each test starts with
// POST /__mock/reset, which re-seeds fixtures.step1 and answers 204.
export const test = base.extend<{ reset: undefined }>({
  reset: [
    async ({ request }, use) => {
      const response = await request.post("/__mock/reset");
      expect(response.status(), "POST /__mock/reset re-seeds fixtures.step1").toBe(204);
      await use(undefined);
    },
    { auto: true },
  ],
});

export { expect };

// The first decidable proposal in route 52's server order: the row the flows act on.
interface PendingRow {
  kind: string;
  proposalId?: string;
  version?: number;
  title?: string;
  approve?: { label: string };
  reject?: { label: string };
}

export interface DecidableProposal {
  proposalId: string;
  version: number;
  title: string;
  approveLabel: string;
  rejectLabel: string;
}

export async function firstDecidableProposal(
  request: APIRequestContext,
): Promise<DecidableProposal> {
  const response = await request.get("/api/pending-decisions?limit=50");
  expect(response.status(), "route 52 answers 200 on the dev server's mock").toBe(200);
  const body = (await response.json()) as { items?: PendingRow[] };
  const items = body.items ?? [];
  const row = items.find(
    (item) => item.kind === "proposal" && item.approve !== undefined && item.reject !== undefined,
  );
  if (
    !row ||
    row.proposalId === undefined ||
    row.version === undefined ||
    row.title === undefined ||
    row.approve === undefined ||
    row.reject === undefined
  ) {
    throw new Error("fixtures.step1 has no decidable proposal in route 52's first page");
  }
  return {
    proposalId: row.proposalId,
    version: row.version,
    title: row.title,
    approveLabel: row.approve.label,
    rejectLabel: row.reject.label,
  };
}
