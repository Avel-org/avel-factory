import * as C from "@avel/contract";
import { describe, expect, it } from "vitest";
import { createMock, type Mock, type MockFailure, world } from "../src/index.js";

/**
 * T-F23, tests 01 to 05: CR-W31 part (b), the streaming routes 33, 34, 105, 63, 64 and 109,
 * over contract-mock. The ticket doesn't name the interface, so these tests state what they
 * ask of the build, and Zero rules on it at the lock:
 *
 * - Every streamed chunk or event carries its SSE `id`: routes 34 and 105 number a reply's
 *   chunks, route 63 uses the event's `seq`, route 64 the `traceSeq` (steps) or trace ID.
 *   A client resumes with the `Last-Event-ID` header and gets only what came after it.
 * - Streams are paced by the mock's `now()` and never by the wall clock: a reply is "still
 *   streaming" from its POST until `now()` has moved past its script, and it is finished
 *   after that. The stream itself hands out its chunks without waiting.
 * - Route 34 stores the operator's message and Canon's reply, so route 33 lists them. An
 *   aborted reply is kept as `stopped`, with the text written so far.
 * - Route 63's stream replays the events the mock's routes have made, oldest first, and then
 *   waits for more; the tests stop reading once they have seen what they came for.
 * - Route 64 with `view=steps` and route 109 serve `world.STEPS` for the running attempt.
 * - `mock.failNext` takes route numbers 33, 34, 105, 63, 64 and 109, and `requests()[n].route`
 *   is that number.
 */

type Stage = "draft" | "0.1" | "0.2" | "0.3" | "0.4" | "building";
type Json = Record<string, unknown>;

const VERSION = "1.0.0";
const START = new Date("2026-11-12T15:00:00.000Z");
const ANY_ID = "0193b000-0000-7000-8000-00000000ffff";
const CLIENT_MESSAGE_ID = "0193d000-0000-7000-8000-000000000001";
const TURN_TEXT = "Dale said the crews need offline sign-off";

function newMock(clock: { t: number } = { t: START.getTime() }): Mock {
  return createMock({
    contractVersion: VERSION,
    world: true,
    now: () => new Date(clock.t),
  });
}

function seedAt(mock: Mock, stage: Stage) {
  if (typeof mock.seedMission !== "function")
    throw new Error(`mock.seedMission("${stage}") is not built: the world can't be seeded`);
  return mock.seedMission(stage);
}

/** failNext's route type is part (a)'s numbers until the build widens it. */
function failNext(mock: Mock, route: number, failure: MockFailure) {
  (mock.failNext as unknown as (r: number, f: MockFailure) => void).call(mock, route, failure);
}

type Answer = { status: number; headers: Headers; body: Json };

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
  };
}

function expectErrorBody(answer: Answer, status: number, code: string) {
  expect(answer.status).toBe(status);
  expect(answer.body.code).toBe(code);
  expect(typeof answer.body.message).toBe("string");
  expect(answer.body.requestId).toBe(answer.headers.get(C.REQUEST_ID_HEADER));
  expect(answer.headers.get(C.CONTRACT_VERSION_HEADER)).toBe(VERSION);
}

type Frame = { id: string | null; data: unknown };

/**
 * Opens a stream route and reads its frames until `until` says stop, `max` frames are in, or
 * the stream ends; then it cancels the read. Parses oRPC's SSE frames: `id:` and `data:`.
 */
async function openStream(
  mock: Mock,
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    lastEventId?: string;
    signal?: AbortSignal;
    key?: string;
  } = {},
) {
  const headers: Record<string, string> = { accept: "text/event-stream" };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.method === "POST") headers["idempotency-key"] = opts.key ?? crypto.randomUUID();
  if (opts.lastEventId !== undefined) headers["last-event-id"] = opts.lastEventId;
  const response = await mock.fetch(
    new Request(`http://mock${path}`, {
      method: opts.method ?? "GET",
      headers,
      ...(opts.body === undefined ? {} : { body: JSON.stringify(opts.body) }),
      ...(opts.signal === undefined ? {} : { signal: opts.signal }),
    }),
  );
  return response;
}

function frameOf(raw: string): Frame | null {
  let id: string | null = null;
  const data: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("id:")) id = line.slice(3).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0) return null;
  return { id, data: JSON.parse(data.join("\n")) as unknown };
}

async function readFrames(
  response: Response,
  until: (frames: Frame[]) => boolean = () => false,
  max = 500,
): Promise<Frame[]> {
  // A GET stream answers 200; route 34 is a POST, whose contract success status is 201.
  expect([200, 201], "a stream answers 200 or 201").toContain(response.status);
  expect(response.headers.get("content-type") ?? "").toContain("text/event-stream");
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  const frames: Frame[] = [];
  let buffer = "";
  try {
    while (frames.length < max && !until(frames)) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let cut = buffer.indexOf("\n\n");
      // Stop at the frame that satisfies `until`, even when it came in one read with the rest.
      while (cut !== -1 && frames.length < max && !until(frames)) {
        const frame = frameOf(buffer.slice(0, cut));
        if (frame !== null) frames.push(frame);
        buffer = buffer.slice(cut + 2);
        cut = buffer.indexOf("\n\n");
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return frames;
}

/** A few turns of the event loop, for an abort to reach the handler. Not a wall-clock wait. */
async function settle() {
  for (let i = 0; i < 20; i++) await new Promise((resolve) => setImmediate(resolve));
}

const turn = (missionId: string) => ({
  path: `/api/missions/${missionId}/messages`,
  body: {
    clientMessageId: CLIENT_MESSAGE_ID,
    text: TURN_TEXT,
    source: "said",
    checkpoint: "0.1",
  },
});

const isFinish = (frames: Frame[]) =>
  (frames.at(-1)?.data as { type?: string } | undefined)?.type === "finish";

function chunksOf(frames: Frame[]): C.CanonStreamChunk[] {
  return frames.map((f, i) => {
    const parsed = C.CanonStreamChunk.safeParse(f.data);
    expect(parsed.success, `frame ${i} is a CanonStreamChunk: ${JSON.stringify(f.data)}`).toBe(
      true,
    );
    return f.data as C.CanonStreamChunk;
  });
}

const textOf = (chunks: C.CanonStreamChunk[]) =>
  chunks.flatMap((c) => (c.type === "text-delta" ? [c.delta] : [])).join("");

/** The whole reply for `TURN_TEXT`, from a fresh mock: the reference the other tests compare to. */
async function referenceReply() {
  const mock = newMock();
  const { missionId } = seedAt(mock, "0.1");
  const t = turn(missionId);
  const frames = await readFrames(
    await openStream(mock, t.path, { method: "POST", body: t.body }),
    isFinish,
  );
  return { frames, chunks: chunksOf(frames) };
}

async function messagesOf(mock: Mock, missionId: string) {
  const answer = await send(mock, "GET", `/api/missions/${missionId}/messages`);
  expect(answer.status).toBe(200);
  return (answer.body.items as C.CanonMessageDto[]) ?? [];
}

describe("T-F23-01: route 34 streams Canon's scripted reply, and an abort stops it", () => {
  it("streams CanonStreamChunk values from start to finish, and stores the reply for route 33", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    const t = turn(missionId);
    const frames = await readFrames(
      await openStream(mock, t.path, { method: "POST", body: t.body }),
      isFinish,
    );
    const chunks = chunksOf(frames);
    expect(chunks[0]?.type).toBe("start");
    const finish = chunks.at(-1);
    expect(finish?.type).toBe("finish");
    expect(finish).toMatchObject({ messageMetadata: { status: "done" } });
    const reply = textOf(chunks);
    expect(reply.length).toBeGreaterThan(0);

    const messageId = (chunks[0] as { messageId: string }).messageId;
    const items = await messagesOf(mock, missionId);
    for (const item of items) {
      const parsed = C.CanonMessageDto.safeParse(item);
      expect(parsed.success, JSON.stringify(item)).toBe(true);
    }
    const canon = items.find((m) => m.id === messageId);
    expect(canon, "route 33 lists the reply the stream started").toBeDefined();
    expect(canon).toMatchObject({ role: "canon", status: "done", checkpoint: "0.1" });
    expect(canon?.text.trim()).toBe(reply.trim());
    const mine = items.find((m) => m.clientMessageId === CLIENT_MESSAGE_ID);
    expect(mine, "route 33 lists the operator's turn").toBeDefined();
    expect(mine).toMatchObject({ role: "operator", text: TURN_TEXT, source: "said" });
  });

  it("an aborted request stops the script: the reply is kept as stopped, with what was written", async () => {
    const full = await referenceReply();
    const fullText = textOf(full.chunks);

    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    const t = turn(missionId);
    const abort = new AbortController();
    const response = await openStream(mock, t.path, {
      method: "POST",
      body: t.body,
      signal: abort.signal,
    });
    const seen = await readFrames(response, (frames) =>
      frames.some((f) => (f.data as { type?: string }).type === "text-delta"),
    );
    abort.abort();
    await settle();

    const messageId = (chunksOf(seen)[0] as { messageId: string }).messageId;
    const canon = (await messagesOf(mock, missionId)).find((m) => m.id === messageId);
    expect(canon, "the stopped reply is in the history").toBeDefined();
    expect(canon?.status).toBe("stopped");
    expect(canon?.text.length).toBeGreaterThan(0);
    expect(canon?.text.length).toBeLessThan(fullText.length);
    expect(fullText.startsWith(canon?.text ?? "x")).toBe(true);

    // A stopped reply is not one a client can re-attach to.
    const resumed = await send(
      mock,
      "GET",
      `/api/missions/${missionId}/messages/${messageId}/stream`,
    );
    expectErrorBody(resumed, 410, "STREAM_GONE");
  });
});

describe("T-F23-02: route 105 re-attaches to a reply still streaming, and answers STREAM_GONE once it's finished", () => {
  it("resumes after Last-Event-ID, so the two halves are the whole script", async () => {
    const full = await referenceReply();
    const clock = { t: START.getTime() };
    const mock = newMock(clock);
    const { missionId } = seedAt(mock, "0.1");
    const t = turn(missionId);

    // The first client reads three chunks and stays attached; the clock hasn't moved.
    const first = await readFrames(
      await openStream(mock, t.path, { method: "POST", body: t.body }),
      (frames) => frames.length >= 3,
    );
    expect(first).toHaveLength(3);
    const last = first.at(-1)?.id ?? null;
    expect(last, "every chunk carries an SSE id to resume from").not.toBeNull();
    const messageId = (chunksOf(first)[0] as { messageId: string }).messageId;

    const resumed = await readFrames(
      await openStream(mock, `/api/missions/${missionId}/messages/${messageId}/stream`, {
        lastEventId: last as string,
      }),
      isFinish,
    );
    expect(resumed.length).toBeGreaterThan(0);
    expect(resumed.map((f) => f.id)).toEqual(full.frames.slice(3).map((f) => f.id));
    expect(chunksOf([...first, ...resumed])).toEqual(full.chunks);

    // Without Last-Event-ID, the whole reply so far comes again.
    const again = await readFrames(
      await openStream(mock, `/api/missions/${missionId}/messages/${messageId}/stream`),
      isFinish,
    );
    expect(chunksOf(again)).toEqual(full.chunks);

    // The script's time has gone by: the reply is finished and can't be re-attached to.
    clock.t += 60 * 60_000;
    const gone = await send(mock, "GET", `/api/missions/${missionId}/messages/${messageId}/stream`);
    expectErrorBody(gone, 410, "STREAM_GONE");
    expect((await messagesOf(mock, missionId)).find((m) => m.id === messageId)?.status).toBe(
      "done",
    );
  });

  it("a reply that was never made is NOT_FOUND, not a stream", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    const answer = await send(mock, "GET", `/api/missions/${missionId}/messages/${ANY_ID}/stream`);
    expect(answer.status).toBe(404);
    expect(answer.body.code).toBe("NOT_FOUND");
  });
});

describe("T-F23-03: route 63 sends an event for each state move, and resumes from Last-Event-ID", () => {
  /** Part (a)'s moves on the mission, and a second mission made through route 20. */
  async function makeMoves(mock: Mock) {
    const other = await send(mock, "POST", "/api/missions", { name: "Acme portal" });
    expect(other.status).toBe(201);
    const { missionId } = seedAt(mock, "0.1");
    for (let i = 0; i < 2; i++) {
      const rows = await send(mock, "GET", `/api/pending-decisions?missionId=${missionId}`);
      const row = (rows.body.items as C.PendingDecisionDto[]).find((r) => r.kind === "checkpoint");
      expect(row, `checkpoint row ${i}`).toBeDefined();
      const call = C.approveCallFor(row as C.PendingDecisionDto, { reason: "Looks right" })
        .input as Json;
      const { checkpointId, ...body } = call;
      const moved = await send(
        mock,
        "POST",
        `/api/checkpoints/${String(checkpointId)}/approvals`,
        body,
      );
      expect(moved.status).toBe(201);
    }
    return { missionId, otherId: other.body.id as string };
  }

  const checkpointEvents = (frames: Frame[]) =>
    frames.filter((f) => (f.data as { kind?: string }).kind === "onboarding.checkpoint.changed");

  it("each move is an event of a contract kind, in seq order, and a mission's stream holds only its own", async () => {
    const mock = newMock();
    const { missionId, otherId } = await makeMoves(mock);

    const all = await readFrames(
      await openStream(mock, "/api/events/stream"),
      (frames) => checkpointEvents(frames).length >= 2,
    );
    const events = all.map((f, i) => {
      const parsed = C.EventDto.safeParse(f.data);
      expect(parsed.success, `frame ${i} is an EventDto: ${JSON.stringify(f.data)}`).toBe(true);
      return f.data as C.EventDto;
    });
    for (const event of events) expect(C.EventKind).toContain(event.kind);
    const seqs = events.map((e) => e.seq);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(all.map((f) => f.id)).toEqual(seqs.map(String));
    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("missions.mission.created");
    expect(
      events.some((e) => e.kind === "missions.mission.created" && e.missionId === otherId),
      "route 20's mission has its created event",
    ).toBe(true);
    expect(checkpointEvents(all)).toHaveLength(2);
    for (const f of checkpointEvents(all)) {
      expect((f.data as C.EventDto).missionId).toBe(missionId);
    }

    const one = await readFrames(
      await openStream(mock, `/api/events/stream?missionId=${missionId}`),
      (frames) => checkpointEvents(frames).length >= 2,
    );
    expect(one.length).toBeGreaterThan(0);
    for (const f of one) expect((f.data as C.EventDto).missionId).toBe(missionId);
    expect(one.map((f) => (f.data as C.EventDto).kind)).not.toContain("missions.mission.created");
  });

  it("a reconnect with Last-Event-ID sends only what came after it", async () => {
    const mock = newMock();
    const { missionId } = await makeMoves(mock);
    const path = `/api/events/stream?missionId=${missionId}`;
    const full = await readFrames(
      await openStream(mock, path),
      (frames) => checkpointEvents(frames).length >= 2,
    );
    const firstAt = full.findIndex(
      (f) => (f.data as { kind?: string }).kind === "onboarding.checkpoint.changed",
    );
    expect(firstAt).toBeGreaterThanOrEqual(0);
    expect(firstAt).toBeLessThan(full.length - 1);
    const after = full[firstAt]?.id as string;

    const resumed = await readFrames(
      await openStream(mock, path, { lastEventId: after }),
      (frames) => checkpointEvents(frames).length >= 1,
    );
    expect(resumed).toEqual(full.slice(firstAt + 1));
    for (const f of resumed) expect(Number(f.id)).toBeGreaterThan(Number(after));
  });
});

describe("T-F23-04: route 64 with view=steps streams an attempt's steps, and route 109 returns them oldest first", () => {
  const attemptId = world.STEPS[0]?.attemptId as string;
  const stepsPath = `/api/traces/stream?attemptId=${attemptId}&view=steps`;

  async function building() {
    const mock = newMock();
    seedAt(mock, "building");
    return mock;
  }

  /** Route 109 is already served (T-F22), so this alone passes; the stream test below needs it. */
  async function expectStepsRoute(mock: Mock) {
    const all = await send(mock, "GET", `/api/attempts/${attemptId}/steps`);
    expect(all.status).toBe(200);
    expect(all.headers.get(C.REQUEST_ID_HEADER)).toBeTruthy();
    const items = all.body.items as C.AgentStepDto[];
    for (const item of items) {
      const parsed = C.AgentStepDto.safeParse(item);
      expect(parsed.success, JSON.stringify(item)).toBe(true);
      expect(item.attemptId).toBe(attemptId);
    }
    expect(items.map((s) => s.traceSeq)).toEqual(world.STEPS.map((s) => s.traceSeq));
    expect(items.map((s) => s.text)).toEqual(world.STEPS.map((s) => s.text));
    expect(all.body.lastSeq).toBe(world.STEPS.at(-1)?.traceSeq);

    const after = await send(mock, "GET", `/api/attempts/${attemptId}/steps?after=2`);
    expect(after.status).toBe(200);
    expect((after.body.items as C.AgentStepDto[]).map((s) => s.traceSeq)).toEqual([3, 4]);
    const none = await send(mock, "GET", `/api/attempts/${attemptId}/steps?after=4`);
    expect(none.body).toMatchObject({ items: [], lastSeq: null });
  }

  it("route 64 streams the same steps as route 109, and resumes after Last-Event-ID", async () => {
    const mock = await building();
    await expectStepsRoute(mock);
    const listed = (
      (await send(mock, "GET", `/api/attempts/${attemptId}/steps`)).body as {
        items: C.AgentStepDto[];
      }
    ).items;
    const frames = await readFrames(
      await openStream(mock, stepsPath),
      (seen) => seen.length >= world.STEPS.length,
    );
    for (const f of frames) {
      const parsed = C.AgentStepDto.safeParse(f.data);
      expect(parsed.success, JSON.stringify(f.data)).toBe(true);
    }
    expect(frames.map((f) => f.data)).toEqual(listed);
    expect(frames.map((f) => f.id)).toEqual(listed.map((s) => String(s.traceSeq)));

    const resumed = await readFrames(
      await openStream(mock, stepsPath, { lastEventId: "2" }),
      (seen) => seen.length >= 2,
    );
    expect(resumed.map((f) => (f.data as C.AgentStepDto).traceSeq)).toEqual([3, 4]);
  });

  it("route 64 wants exactly one of attemptId and sessionId", async () => {
    const mock = await building();
    const answer = await send(mock, "GET", "/api/traces/stream?view=steps");
    expect(answer.status).toBe(400);
    expect(answer.body.code).toBe("BAD_REQUEST");
  });
});

describe("T-F23-05: MockFailure works on every part (b) route, and requests are named by number", () => {
  const MISSION = "0193c000-0000-7000-8000-000000000000";
  const REQUESTS: Array<{ route: number; method: string; path: string; body?: unknown }> = [
    { route: 33, method: "GET", path: `/api/missions/${MISSION}/messages` },
    {
      route: 34,
      method: "POST",
      path: `/api/missions/${MISSION}/messages`,
      body: {
        clientMessageId: CLIENT_MESSAGE_ID,
        text: TURN_TEXT,
        source: "said",
        checkpoint: "0.1",
      },
    },
    { route: 105, method: "GET", path: `/api/missions/${MISSION}/messages/${ANY_ID}/stream` },
    { route: 63, method: "GET", path: "/api/events/stream" },
    { route: 64, method: "GET", path: `/api/traces/stream?attemptId=${ANY_ID}&view=steps` },
    { route: 109, method: "GET", path: `/api/attempts/${ANY_ID}/steps` },
  ];

  it("fails the next call to each route with any status and code, and only that call", async () => {
    const mock = newMock();
    seedAt(mock, "0.1");
    for (const r of REQUESTS) {
      failNext(mock, r.route, { status: 503, code: "UPSTREAM_DOWN", message: `route ${r.route}` });
      const failed = await send(mock, r.method, r.path, r.body);
      expect(failed.status, `route ${r.route}`).toBe(503);
      expect(failed.body, `route ${r.route}`).toMatchObject({
        code: "UPSTREAM_DOWN",
        message: `route ${r.route}`,
      });
      expect(failed.headers.get(C.REQUEST_ID_HEADER), `route ${r.route}`).toBeTruthy();
      expect(failed.headers.get(C.CONTRACT_VERSION_HEADER), `route ${r.route}`).toBe(VERSION);
    }
  });

  it("fails each route with a network failure that rejects with a TypeError", async () => {
    const mock = newMock();
    seedAt(mock, "0.1");
    for (const r of REQUESTS) {
      failNext(mock, r.route, { network: true });
      await expect(send(mock, r.method, r.path, r.body), `route ${r.route}`).rejects.toThrow(
        TypeError,
      );
    }
  });

  it("records each request with its route number, the failed ones and the network failures too", async () => {
    const mock = newMock();
    const { missionId } = seedAt(mock, "0.1");
    const real = REQUESTS.map((r) => ({ ...r, path: r.path.replace(MISSION, missionId) }));
    for (const r of real) {
      failNext(
        mock,
        r.route,
        r.route % 2 === 0 ? { network: true } : { status: 500, code: "BOOM" },
      );
      await send(mock, r.method, r.path, r.body).catch(() => undefined);
    }
    expect(mock.requests().map((entry) => entry.route as number | null)).toEqual(
      real.map((r) => r.route),
    );
    const sent = mock.requests().find((entry) => (entry.route as number | null) === 34);
    expect(sent).toMatchObject({ method: "POST", body: real[1]?.body });
    expect(sent?.idempotencyKey).toBeTruthy();
  });
});
