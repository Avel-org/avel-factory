// An inert stand-in for @avel/contract-mock, used only while packages/contract-mock doesn't
// exist (see vitest.config.ts). It has the names UI contract section 2 fixes, and it answers
// nothing: every request is NOT_FOUND. A test against it fails on its assertion.

type Failure =
  | { status: number; code: string; data?: unknown; message?: string }
  | { network: true };

export interface RecordedRequest {
  route: 52 | 53 | 54 | null;
  method: string;
  path: string;
  requestId: string | null;
  idempotencyKey: string | null;
  body: unknown;
}

export type SeedRow =
  | {
      kind: "proposal";
      id: string;
      missionId: string;
      clientName: string | null;
      proposalKind: string;
      subjectKey: string;
      title: string;
      evidence: string;
      version: number;
      options: unknown;
      createdAt: string;
      expiresAt: string;
      state?: "open" | "resolved" | "expired";
      moduleRunId?: string | null;
    }
  | {
      kind: "factory_change";
      prNumber: number;
      title: string;
      headSha: string;
      url: string;
      createdAt: string;
    };

export interface Mock {
  fetch(request: Request): Promise<Response>;
  seed(rows: SeedRow[]): void;
  bumpVersion(proposalId: string): number;
  resolve(proposalId: string): void;
  expire(proposalId: string): void;
  remove(proposalId: string): void;
  failNext(route: 52 | 53 | 54, failure: Failure, opts?: { times?: number }): void;
  injectRawItem(item: Record<string, unknown>): void;
  requests(): RecordedRequest[];
  reset(): void;
}

export const MOCK_OPERATOR_ID = "0193a000-0000-7000-8000-000000000001";

export const fixtures: { empty: SeedRow[]; step1: SeedRow[]; many: SeedRow[] } = {
  empty: [],
  step1: [],
  many: [],
};

export function createMock(_opts: { contractVersion: string; now?: () => Date }): Mock {
  return {
    fetch: async () =>
      new Response(
        JSON.stringify({
          code: "NOT_FOUND",
          message: "stub: @avel/contract-mock isn't built yet",
          requestId: "stub",
        }),
        { status: 404, headers: { "content-type": "application/json" } },
      ),
    seed: () => {},
    bumpVersion: () => 0,
    resolve: () => {},
    expire: () => {},
    remove: () => {},
    failNext: () => {},
    injectRawItem: () => {},
    requests: () => [],
    reset: () => {},
  };
}
