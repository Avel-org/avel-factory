import * as C from "@avel/contract";
import { describe, expect, it } from "vitest";
import { createMock, type Mock } from "../src/index.js";

/**
 * T-F22, tests 01 and 03: the world's writes and its mission's walk, over contract-mock.
 *
 * Interface these tests ask for (the ticket doesn't name it, so Zero rules on it at the lock):
 * `mock.seedMission(stage)` puts the world's one internal client and one mission at `stage`
 * and returns their IDs. Everything after that goes through HTTP routes only.
 */

type Stage =
  | "draft"
  | "0.1"
  | "0.2"
  | "0.3"
  | "0.4"
  | "finalized"
  | "building"
  | "gate5"
  | "awaiting_release"
  | "delivered";

type Seedable = Mock & {
  seedMission(stage: Stage): { missionId: string; clientId: string };
};

const NOW = new Date("2026-11-12T15:00:00.000Z");
const VERSION = "1.0.0";

function newMock(): Seedable {
  return createMock({ contractVersion: VERSION, world: true, now: () => NOW }) as Seedable;
}

function seedAt(mock: Seedable, stage: Stage) {
  if (typeof mock.seedMission !== "function")
    throw new Error(`mock.seedMission("${stage}") is not built: the world can't be seeded`);
  return mock.seedMission(stage);
}

type Json = Record<string, unknown>;
type Answer = { status: number; headers: Headers; body: Json };

async function call(mock: Mock, method: string, path: string, body?: unknown): Promise<Answer> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (method !== "GET") headers["idempotency-key"] = crypto.randomUUID();
  const response = await mock.fetch(
    new Request(`http://mock${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: text === "" ? {} : (JSON.parse(text) as Json),
  };
}

const APPROVE_PATH: Record<string, (input: Json) => { path: string; body: Json }> = {
  checkpoint: ({ checkpointId, ...body }) => ({
    path: `/api/checkpoints/${String(checkpointId)}/approvals`,
    body,
  }),
  checkpoint_question: ({ questionId, ...body }) => ({
    path: `/api/questions/${String(questionId)}/answers`,
    body,
  }),
  plan_finalize: ({ missionId, ...body }) => ({
    path: `/api/missions/${String(missionId)}/finalizations`,
    body,
  }),
  pass_approval: ({ missionId, ...body }) => ({
    path: `/api/missions/${String(missionId)}/pass-approvals`,
    body,
  }),
  release: ({ missionId, ...body }) => ({
    path: `/api/missions/${String(missionId)}/releases`,
    body,
  }),
  dispatch_package_commit: ({ missionId, ...body }) => ({
    path: `/api/missions/${String(missionId)}/dispatch-package/commits`,
    body,
  }),
};

/** Route 52's rows for this mission. */
async function pending(mock: Mock, missionId: string): Promise<C.PendingDecisionDto[]> {
  const answer = await call(mock, "GET", `/api/pending-decisions?missionId=${missionId}`);
  expect(answer.status).toBe(200);
  return answer.body.items as C.PendingDecisionDto[];
}

/** Every row of route 52, whatever the mission. */
async function allPending(mock: Mock): Promise<C.PendingDecisionDto[]> {
  const answer = await call(mock, "GET", "/api/pending-decisions");
  expect(answer.status).toBe(200);
  return answer.body.items as C.PendingDecisionDto[];
}

/** The mission's one row of this kind. */
async function rowOf(mock: Mock, missionId: string, kind: C.DecisionKind) {
  const rows = (await pending(mock, missionId)).filter((r) => r.kind === kind);
  expect(
    rows.map((r) => r.ref),
    `one ${kind} row for the mission`,
  ).toHaveLength(1);
  return rows[0] as C.PendingDecisionDto;
}

/** Approves a row the way Decisions does: the call comes from the row's target alone. */
async function approve(mock: Mock, item: C.PendingDecisionDto): Promise<Answer> {
  const { input } = C.approveCallFor(item, { reason: "Looks right" });
  const build = APPROVE_PATH[item.kind];
  if (build === undefined) throw new Error(`no approve path for ${item.kind}`);
  const { path, body } = build(input as Json);
  return call(mock, "POST", path, body);
}

const stateOf = async (mock: Mock, missionId: string) => {
  const answer = await call(mock, "GET", `/api/missions/${missionId}`);
  expect(answer.status).toBe(200);
  return (answer.body.mission as Json).state;
};

describe("T-F22-01: reads follow writes", () => {
  it("a client made on route 9 is listed by route 8 and read by route 10", async () => {
    const mock = newMock();
    const made = await call(mock, "POST", "/api/clients", { name: "Acme Tools", kind: "client" });
    expect(made.status).toBe(201);
    const id = made.body.id as string;

    const listed = await call(mock, "GET", "/api/clients");
    const items = listed.body.items as Json[];
    expect(items.map((c) => c.id)).toContain(id);
    expect(items.find((c) => c.id === id)?.name).toBe("Acme Tools");

    const read = await call(mock, "GET", `/api/clients/${id}`);
    expect(read.status).toBe(200);
    expect(read.body).toEqual(made.body);
  });

  it("a mission made on route 20 is listed by route 19 and read by route 21, as a draft", async () => {
    const mock = newMock();
    const client = await call(mock, "POST", "/api/clients", { name: "Acme Tools", kind: "client" });
    const made = await call(mock, "POST", "/api/missions", {
      name: "Acme portal",
      clientId: client.body.id,
    });
    expect(made.status).toBe(201);
    expect(made.body.state).toBe("draft");
    const id = made.body.id as string;

    const listed = await call(mock, "GET", "/api/missions");
    const row = (listed.body.items as Json[]).find((m) => m.id === id);
    expect(row?.name).toBe("Acme portal");

    const read = await call(mock, "GET", `/api/missions/${id}`);
    expect((read.body.mission as Json).id).toBe(id);
    expect((read.body.mission as Json).name).toBe("Acme portal");
  });

  it("an approval on route 44 removes the question's row from route 52, and leaves the other missions' rows", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "draft");
    const before = await allPending(mock);
    const row = await rowOf(mock, missionId, "checkpoint_question");
    const answer = await approve(mock, row);
    expect(answer.status).toBe(201);
    const after = await allPending(mock);
    expect(after.map((r) => r.ref)).not.toContain(row.ref);
    expect(after).toHaveLength(before.length - 1);
  });

  it("an approval on route 40 removes the checkpoint's row from route 52", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.2");
    const row = await rowOf(mock, missionId, "checkpoint");
    const answer = await approve(mock, row);
    expect(answer.status).toBe(201);
    expect((await allPending(mock)).map((r) => r.ref)).not.toContain(row.ref);
  });

  it("an approval on route 28 removes the plan_finalize row from route 52", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.4");
    expect((await approve(mock, await rowOf(mock, missionId, "checkpoint"))).status).toBe(201);
    const row = await rowOf(mock, missionId, "plan_finalize");
    const answer = await approve(mock, row);
    expect(answer.status).toBe(201);
    expect((await allPending(mock)).map((r) => r.ref)).not.toContain(row.ref);
  });

  it("an approval on route 29 removes the pass_approval row from route 52", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "gate5");
    const row = await rowOf(mock, missionId, "pass_approval");
    const answer = await approve(mock, row);
    expect(answer.status).toBe(201);
    expect((await allPending(mock)).map((r) => r.ref)).not.toContain(row.ref);
  });

  it("an approval on route 30 removes the release row from route 52", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "awaiting_release");
    const row = await rowOf(mock, missionId, "release");
    const answer = await approve(mock, row);
    expect(answer.status).toBe(201);
    expect((await allPending(mock)).map((r) => r.ref)).not.toContain(row.ref);
  });
});

describe("T-F22-03: a mission walks from checkpoint 0.1 to release, only by the routes", () => {
  it("moves 0.1, 0.2, 0.3, 0.4, finalization and the package commit, one route at a time", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    expect(await stateOf(mock, missionId)).toBe("onboarding");

    for (const key of ["0.1", "0.2", "0.3", "0.4"] as const) {
      // Reading changes nothing, however often it's read.
      const first = await pending(mock, missionId);
      const second = await pending(mock, missionId);
      expect(second).toEqual(first);
      // Only this checkpoint is open: no later one is ahead of its turn.
      expect(first.map((r) => r.kind)).toEqual(["checkpoint"]);
      const row = first[0] as Extract<C.PendingDecisionDto, { kind: "checkpoint" }>;
      expect(row.target.checkpoint).toBe(key);

      const answer = await approve(mock, row);
      expect(answer.status).toBe(201);
      expect(answer.body.state).toBe("approved");
      expect(answer.body.checkpoint).toBe(key);
      expect(await stateOf(mock, missionId)).toBe("onboarding");
    }

    const detail = await call(mock, "GET", `/api/missions/${missionId}`);
    const checkpoints = detail.body.checkpoints as Json[];
    for (const key of ["0.1", "0.2", "0.3", "0.4"]) {
      expect(checkpoints.find((c) => c.checkpoint === key)?.state, key).toBe("approved");
    }

    // After 0.4, finalization is the only row.
    expect((await pending(mock, missionId)).map((r) => r.kind)).toEqual(["plan_finalize"]);
    const finalized = await approve(mock, await rowOf(mock, missionId, "plan_finalize"));
    expect(finalized.status).toBe(201);
    expect(["approved", "rendered"]).toContain(await stateOf(mock, missionId));

    // Gate 1 passed at render: the package commit is next, and nothing else.
    expect((await pending(mock, missionId)).map((r) => r.kind)).toEqual([
      "dispatch_package_commit",
    ]);
    const committed = await approve(mock, await rowOf(mock, missionId, "dispatch_package_commit"));
    expect(committed.status).toBe(201);
    expect(await pending(mock, missionId)).toEqual([]);
  });

  it("moves Gate 5 to a pass approval, then a release, and the mission is delivered", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "gate5");
    expect(["reviewing", "deciding"]).toContain(await stateOf(mock, missionId));
    expect((await pending(mock, missionId)).map((r) => r.kind)).toEqual(["pass_approval"]);

    const passed = await approve(mock, await rowOf(mock, missionId, "pass_approval"));
    expect(passed.status).toBe(201);

    // The release row now names the pass approval it needs.
    const release = (await rowOf(mock, missionId, "release")) as Extract<
      C.PendingDecisionDto,
      { kind: "release" }
    >;
    expect(release.target.passApprovalId).toBe(passed.body.id);
    expect(release.target.receiptHash).toBe(passed.body.receiptHash);
    expect(await stateOf(mock, missionId)).toBe("awaiting_release");

    const released = await approve(mock, release);
    expect(released.status).toBe(201);
    expect(released.body.passApprovalId).toBe(passed.body.id);
    expect(await pending(mock, missionId)).toEqual([]);
    expect(["delivering", "delivered"]).toContain(await stateOf(mock, missionId));
  });

  it("holds a seeded mission still: no clock or read moves it, and route 104 counts what route 52 lists", async () => {
    let at = NOW.getTime();
    const mock = createMock({
      contractVersion: VERSION,
      world: true,
      now: () => new Date(at),
    }) as Seedable;
    const { missionId } = seedAt(mock, "awaiting_release");
    const before = await pending(mock, missionId);
    at += 7 * 24 * 60 * 60_000;
    expect(await pending(mock, missionId)).toEqual(before);
    expect(await stateOf(mock, missionId)).toBe("awaiting_release");

    const status = await call(mock, "GET", "/api/status");
    expect(status.body.needsYouCount).toBe((await allPending(mock)).length);
    await approve(mock, await rowOf(mock, missionId, "release"));
    const after = await call(mock, "GET", "/api/status");
    expect(after.body.needsYouCount).toBe((status.body.needsYouCount as number) - 1);
  });
});
