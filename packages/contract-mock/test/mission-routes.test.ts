import * as C from "@avel/contract";
import { describe, expect, it } from "vitest";
import { createMock, type Mock, type MockFailure, world } from "../src/index.js";

/**
 * T-F22, tests 02, 04 and 05: part (a)'s routes' bodies and headers, their error rules,
 * MockFailure and the recorded route numbers, over contract-mock.
 *
 * Interface these tests ask for (the ticket doesn't name it, so Zero rules on it at the lock):
 * `mock.seedMission(stage)` puts the world's one internal client and one mission at `stage`
 * and returns their IDs; `mock.failNext` takes route numbers 9, 10, 20, 21, 28, 29, 30, 40,
 * 44, 104, 108 and 114 as well as 8, 19 and 52; and `requests()[n].route` is that number.
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
const ANY_ID = "0193b000-0000-7000-8000-00000000ffff";
const BAD_HASH = "f".repeat(64);

function newMock(): Seedable {
  return createMock({ contractVersion: VERSION, world: true, now: () => NOW }) as Seedable;
}

function seedAt(mock: Seedable, stage: Stage) {
  if (typeof mock.seedMission !== "function")
    throw new Error(`mock.seedMission("${stage}") is not built: the world can't be seeded`);
  return mock.seedMission(stage);
}

/** failNext's route type is m1's five numbers until the build widens it. */
function failNext(mock: Mock, route: number, failure: MockFailure, opts?: { times?: number }) {
  (mock.failNext as unknown as (r: number, f: MockFailure, o?: { times?: number }) => void).call(
    mock,
    route,
    failure,
    opts,
  );
}

type Json = Record<string, unknown>;
type Answer = { status: number; headers: Headers; body: Json; text: string };

async function send(
  mock: Mock,
  method: string,
  path: string,
  body?: unknown,
  key: string | null = method === "GET" ? null : crypto.randomUUID(),
): Promise<Answer> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (key !== null) headers["idempotency-key"] = key;
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
    text,
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

async function rowOf(mock: Mock, missionId: string, kind: C.DecisionKind) {
  const answer = await send(mock, "GET", `/api/pending-decisions?missionId=${missionId}`);
  expect(answer.status).toBe(200);
  const rows = (answer.body.items as C.PendingDecisionDto[]).filter((r) => r.kind === kind);
  expect(rows, `one ${kind} row for the mission`).toHaveLength(1);
  return rows[0] as C.PendingDecisionDto;
}

/** The approve call a row gives, as a path and a body. */
function callOf(item: C.PendingDecisionDto, input: Json = {}) {
  const built = C.approveCallFor(item, { reason: "Looks right" }).input as Json;
  const build = APPROVE_PATH[item.kind];
  if (build === undefined) throw new Error(`no approve path for ${item.kind}`);
  return build({ ...built, ...input });
}

type Proc = { "~orpc": { outputSchema: { "~standard": { validate: (v: unknown) => unknown } } } };

/** The contract's own output schema for `group.name` accepts this body. */
async function expectOutput(group: string, name: string, body: unknown) {
  const proc = (C.contract as unknown as Record<string, Record<string, Proc>>)[group]?.[name];
  expect(proc, `${group}.${name} is in the contract`).toBeDefined();
  const result = (await proc?.["~orpc"].outputSchema["~standard"].validate(body)) as {
    issues?: unknown;
  };
  expect(result.issues, `${group}.${name}: ${JSON.stringify(result.issues)}`).toBeUndefined();
}

function expectHeaders(answer: Answer) {
  expect(answer.headers.get(C.REQUEST_ID_HEADER), "X-Request-Id").toBeTruthy();
  expect(answer.headers.get(C.CONTRACT_VERSION_HEADER), "X-Contract-Version").toBe(VERSION);
}

function expectErrorBody(answer: Answer, status: number, code: string) {
  expect(answer.status).toBe(status);
  expect(answer.body.code).toBe(code);
  expect(typeof answer.body.message).toBe("string");
  expect(answer.body.requestId).toBe(answer.headers.get(C.REQUEST_ID_HEADER));
  expectHeaders(answer);
}

describe("T-F22-02: each part (a) route answers with a body its contract output accepts", () => {
  const cases: Array<{
    route: number;
    group: string;
    name: string;
    status: number;
    run: (mock: Seedable) => Promise<Answer>;
  }> = [
    {
      route: 8,
      group: "clients",
      name: "list",
      status: 200,
      run: async (mock) => {
        const made = await send(mock, "POST", "/api/clients", {
          name: "Acme Tools",
          kind: "client",
        });
        expect(made.status).toBe(201);
        const listed = await send(mock, "GET", "/api/clients");
        expect((listed.body.items as Json[]).map((c) => c.id)).toContain(made.body.id);
        return listed;
      },
    },
    {
      route: 9,
      group: "clients",
      name: "create",
      status: 201,
      run: (mock) => send(mock, "POST", "/api/clients", { name: "Acme Tools", kind: "client" }),
    },
    {
      route: 10,
      group: "clients",
      name: "get",
      status: 200,
      run: async (mock) => {
        const made = await send(mock, "POST", "/api/clients", {
          name: "Acme Tools",
          kind: "client",
        });
        return send(mock, "GET", `/api/clients/${String(made.body.id)}`);
      },
    },
    {
      route: 19,
      group: "missions",
      name: "list",
      status: 200,
      run: async (mock) => {
        const made = await send(mock, "POST", "/api/missions", { name: "Acme portal" });
        expect(made.status).toBe(201);
        const listed = await send(mock, "GET", "/api/missions");
        expect((listed.body.items as Json[]).map((m) => m.id)).toContain(made.body.id);
        return listed;
      },
    },
    {
      route: 20,
      group: "missions",
      name: "create",
      status: 201,
      run: (mock) => send(mock, "POST", "/api/missions", { name: "Acme portal" }),
    },
    {
      route: 21,
      group: "missions",
      name: "get",
      status: 200,
      run: async (mock) => {
        const made = await send(mock, "POST", "/api/missions", { name: "Acme portal" });
        return send(mock, "GET", `/api/missions/${String(made.body.id)}`);
      },
    },
    {
      route: 28,
      group: "missions",
      name: "finalize",
      status: 201,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "0.4");
        const cp = callOf(await rowOf(mock, missionId, "checkpoint"));
        await send(mock, "POST", cp.path, cp.body);
        const fin = callOf(await rowOf(mock, missionId, "plan_finalize"));
        return send(mock, "POST", fin.path, fin.body);
      },
    },
    {
      route: 29,
      group: "missions",
      name: "approvePass",
      status: 201,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "gate5");
        const call = callOf(await rowOf(mock, missionId, "pass_approval"));
        return send(mock, "POST", call.path, call.body);
      },
    },
    {
      route: 30,
      group: "missions",
      name: "release",
      status: 201,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "awaiting_release");
        const call = callOf(await rowOf(mock, missionId, "release"));
        return send(mock, "POST", call.path, call.body);
      },
    },
    {
      route: 40,
      group: "gate0",
      name: "approveCheckpoint",
      status: 201,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "0.1");
        const call = callOf(await rowOf(mock, missionId, "checkpoint"));
        return send(mock, "POST", call.path, call.body);
      },
    },
    {
      route: 44,
      group: "gate0",
      name: "answerQuestion",
      status: 201,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "draft");
        const call = callOf(await rowOf(mock, missionId, "checkpoint_question"));
        return send(mock, "POST", call.path, call.body);
      },
    },
    {
      route: 52,
      group: "decisions",
      name: "listPending",
      status: 200,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "0.1");
        return send(mock, "GET", `/api/pending-decisions?missionId=${missionId}`);
      },
    },
    {
      route: 104,
      group: "health",
      name: "status",
      status: 200,
      run: async (mock) => {
        seedAt(mock, "0.1");
        return send(mock, "GET", "/api/status");
      },
    },
    {
      route: 108,
      group: "dispatches",
      name: "getModule",
      status: 200,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "building");
        return send(mock, "GET", `/api/missions/${missionId}/modules/${world.MODULE_RUN.ref}`);
      },
    },
    {
      route: 114,
      group: "dispatchPackage",
      name: "commit",
      status: 201,
      run: async (mock) => {
        const { missionId } = seedAt(mock, "finalized");
        const call = callOf(await rowOf(mock, missionId, "dispatch_package_commit"));
        return send(mock, "POST", call.path, call.body);
      },
    },
  ];

  it.each(cases)("route $route answers $status, validated, with its headers", async (c) => {
    const answer = await c.run(newMock());
    expect(answer.status).toBe(c.status);
    await expectOutput(c.group, c.name, answer.body);
    expectHeaders(answer);
  });

  it("an error on a part (a) route is the contract's body with the same two headers", async () => {
    const mock = newMock();
    expectErrorBody(await send(mock, "GET", `/api/clients/${ANY_ID}`), 404, "NOT_FOUND");
    expectErrorBody(await send(mock, "GET", `/api/missions/${ANY_ID}`), 404, "NOT_FOUND");
    expectErrorBody(
      await send(mock, "POST", "/api/clients", { name: "", kind: "client" }),
      400,
      "BAD_REQUEST",
    );
  });
});

describe("T-F22-04: the state machine, stale versions and replay", () => {
  it("a move the state machine doesn't allow is 422 INVALID_TRANSITION with the allowed moves", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    const before = await send(mock, "GET", `/api/missions/${missionId}`);

    const finalize = await send(mock, "POST", `/api/missions/${missionId}/finalizations`, {
      version: 1,
    });
    expectErrorBody(finalize, 422, "INVALID_TRANSITION");
    expect(Array.isArray((finalize.body.details as Json).allowed)).toBe(true);
    expect((finalize.body.details as Json).state).toBe("onboarding");

    const release = await send(mock, "POST", `/api/missions/${missionId}/releases`, {
      receiptHash: BAD_HASH,
    });
    expectErrorBody(release, 422, "INVALID_TRANSITION");
    expect(Array.isArray((release.body.details as Json).allowed)).toBe(true);

    const pass = await send(mock, "POST", `/api/missions/${missionId}/pass-approvals`, {
      receiptHash: BAD_HASH,
      reason: "Looks right",
    });
    expectErrorBody(pass, 422, "INVALID_TRANSITION");

    // None of the refusals moved anything.
    expect(await send(mock, "GET", `/api/missions/${missionId}`)).toMatchObject({
      body: before.body,
    });
  });

  it("a stale rowVersion is 409 STALE_VERSION naming rowVersion and its current value", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    const row = (await rowOf(mock, missionId, "checkpoint")) as Extract<
      C.PendingDecisionDto,
      { kind: "checkpoint" }
    >;
    const stale = callOf(row, { rowVersion: row.target.rowVersion + 1 });
    const answer = await send(mock, "POST", stale.path, stale.body);
    expectErrorBody(answer, 409, "STALE_VERSION");
    expect(answer.body.details).toMatchObject({
      field: "rowVersion",
      currentVersion: row.target.rowVersion,
    });
    // The row is still there, and the true call still works.
    const fresh = callOf(await rowOf(mock, missionId, "checkpoint"));
    expect((await send(mock, "POST", fresh.path, fresh.body)).status).toBe(201);
  });

  it("a stale receipt hash is 409 STALE_VERSION on receiptHash, and a stale package hash on packageHash", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "awaiting_release");
    const row = (await rowOf(mock, missionId, "release")) as Extract<
      C.PendingDecisionDto,
      { kind: "release" }
    >;
    const answer = await send(mock, "POST", `/api/missions/${missionId}/releases`, {
      receiptHash: BAD_HASH,
    });
    expectErrorBody(answer, 409, "STALE_VERSION");
    expect(answer.body.details).toMatchObject({
      field: "receiptHash",
      currentVersion: row.target.receiptHash,
    });
    await rowOf(mock, missionId, "release");

    const other = newMock();
    const { missionId: id2 } = seedAt(other, "finalized");
    const pkg = (await rowOf(other, id2, "dispatch_package_commit")) as Extract<
      C.PendingDecisionDto,
      { kind: "dispatch_package_commit" }
    >;
    const stalePkg = await send(other, "POST", `/api/missions/${id2}/dispatch-package/commits`, {
      packageHash: BAD_HASH,
    });
    expectErrorBody(stalePkg, 409, "STALE_VERSION");
    expect(stalePkg.body.details).toMatchObject({
      field: "packageHash",
      currentVersion: pkg.target.packageHash,
    });
  });

  it("a replayed Idempotency-Key returns the first response and moves nothing twice", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    const call = callOf(await rowOf(mock, missionId, "checkpoint"));
    const key = crypto.randomUUID();
    const first = await send(mock, "POST", call.path, call.body, key);
    expect(first.status).toBe(201);
    const second = await send(mock, "POST", call.path, call.body, key);
    expect(second.status).toBe(first.status);
    expect(second.body).toEqual(first.body);

    // One move, not two: checkpoint 0.2 is the open one.
    const open = (await rowOf(mock, missionId, "checkpoint")) as Extract<
      C.PendingDecisionDto,
      { kind: "checkpoint" }
    >;
    expect(open.target.checkpoint).toBe("0.2");

    // The same key for a create makes one client.
    const body = { name: "Acme Tools", kind: "client" };
    const a = await send(mock, "POST", "/api/clients", body, `${key}-c`);
    const b = await send(mock, "POST", "/api/clients", body, `${key}-c`);
    expect(b.body.id).toBe(a.body.id);
    const listed = await send(mock, "GET", "/api/clients");
    expect((listed.body.items as Json[]).filter((c) => c.name === "Acme Tools")).toHaveLength(1);
  });

  it("the same key with a different body is 409 IDEMPOTENCY_KEY_REUSED, and a write with no key is 400", async () => {
    const mock = newMock();
    const key = crypto.randomUUID();
    await send(mock, "POST", "/api/missions", { name: "Acme portal" }, key);
    const reused = await send(mock, "POST", "/api/missions", { name: "Another" }, key);
    expectErrorBody(reused, 409, "IDEMPOTENCY_KEY_REUSED");

    const keyless = await send(
      mock,
      "POST",
      "/api/clients",
      { name: "Acme Tools", kind: "client" },
      null,
    );
    expectErrorBody(keyless, 400, "BAD_REQUEST");
  });
});

/** A well-formed request for each part (a) route; the IDs needn't exist, because failNext runs first. */
const REQUESTS: Array<{ route: number; method: string; path: string; body?: unknown }> = [
  { route: 8, method: "GET", path: "/api/clients" },
  { route: 9, method: "POST", path: "/api/clients", body: { name: "Acme Tools", kind: "client" } },
  { route: 10, method: "GET", path: `/api/clients/${ANY_ID}` },
  { route: 19, method: "GET", path: "/api/missions" },
  { route: 20, method: "POST", path: "/api/missions", body: { name: "Acme portal" } },
  { route: 21, method: "GET", path: `/api/missions/${ANY_ID}` },
  {
    route: 28,
    method: "POST",
    path: `/api/missions/${ANY_ID}/finalizations`,
    body: { version: 1 },
  },
  {
    route: 29,
    method: "POST",
    path: `/api/missions/${ANY_ID}/pass-approvals`,
    body: { receiptHash: BAD_HASH, reason: "Looks right" },
  },
  {
    route: 30,
    method: "POST",
    path: `/api/missions/${ANY_ID}/releases`,
    body: { receiptHash: BAD_HASH },
  },
  {
    route: 40,
    method: "POST",
    path: `/api/checkpoints/${ANY_ID}/approvals`,
    body: { rowVersion: 1 },
  },
  {
    route: 44,
    method: "POST",
    path: `/api/questions/${ANY_ID}/answers`,
    body: { rowVersion: 1, choice: "client" },
  },
  { route: 52, method: "GET", path: "/api/pending-decisions" },
  { route: 104, method: "GET", path: "/api/status" },
  { route: 108, method: "GET", path: `/api/missions/${ANY_ID}/modules/M3` },
  {
    route: 114,
    method: "POST",
    path: `/api/missions/${ANY_ID}/dispatch-package/commits`,
    body: { packageHash: BAD_HASH },
  },
];

describe("T-F22-05: MockFailure and the recorded requests", () => {
  it("fails the next call to every part (a) route with any status and code, and only that call", async () => {
    const mock = newMock();
    for (const r of REQUESTS) {
      failNext(mock, r.route, { status: 503, code: "UPSTREAM_DOWN", message: `route ${r.route}` });
      const failed = await send(mock, r.method, r.path, r.body);
      expect(failed.status, `route ${r.route}`).toBe(503);
      expect(failed.body, `route ${r.route}`).toMatchObject({
        code: "UPSTREAM_DOWN",
        message: `route ${r.route}`,
      });
      expectHeaders(failed);
      // The failure is spent: the same call now reaches the handler (a 404 for an unknown ID is fine).
      const next = await send(mock, r.method, r.path, r.body);
      expect(next.status, `route ${r.route} after its failure`).not.toBe(503);
    }
    failNext(
      mock,
      40,
      { status: 409, code: "STALE_VERSION", data: { field: "rowVersion", currentVersion: 9 } },
      { times: 2 },
    );
    const req = REQUESTS.find((r) => r.route === 40) as (typeof REQUESTS)[number];
    expect((await send(mock, req.method, req.path, req.body)).status).toBe(409);
    expect((await send(mock, req.method, req.path, req.body)).status).toBe(409);
    expect((await send(mock, req.method, req.path, req.body)).status).not.toBe(409);
  });

  it("fails every part (a) route with a network failure that rejects with a TypeError", async () => {
    const mock = newMock();
    for (const r of REQUESTS) {
      failNext(mock, r.route, { network: true });
      await expect(send(mock, r.method, r.path, r.body), `route ${r.route}`).rejects.toThrow(
        TypeError,
      );
    }
  });

  it("records each request with its route number, the failed ones and the network failures too", async () => {
    const mock = newMock();
    for (const r of REQUESTS) {
      failNext(
        mock,
        r.route,
        r.route % 2 === 0 ? { network: true } : { status: 500, code: "BOOM" },
      );
      await send(mock, r.method, r.path, r.body).catch(() => undefined);
    }
    for (const r of REQUESTS) await send(mock, r.method, r.path, r.body);

    const routes = mock.requests().map((entry) => entry.route as number | null);
    const expected = REQUESTS.map((r) => r.route);
    expect(routes).toEqual([...expected, ...expected]);

    // A real call keeps its key and body in the log.
    const { missionId } = seedAt(mock, "0.1");
    const call = callOf(await rowOf(mock, missionId, "checkpoint"));
    await send(mock, "POST", call.path, call.body, "key-40");
    const last = mock.requests().at(-1);
    expect(last).toMatchObject({
      route: 40,
      method: "POST",
      idempotencyKey: "key-40",
      body: call.body,
    });
  });
});
