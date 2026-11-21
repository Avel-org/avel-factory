import * as C from "@avel/contract";
import { describe, expect, it } from "vitest";
import { createMock, world } from "../src/index.js";

// The brief's done-when: the mock serves every new shape with fixtures matching the control
// room's sample world, every emitted event parses against the catalog, and plain text holds
// no IDs. Each fixture parses against the contract's own schema.

const NAMES = [
  "Fleet portal",
  "Spring launch site",
  "Booking fix",
  "Field app",
  "Parts catalogue",
  "Control room",
];

const parse = (
  schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: unknown } } },
  value: unknown,
) => {
  const r = schema.safeParse(value);
  expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
};

describe("the sample world", () => {
  it("has the six projects, each a valid MissionDto and list row", () => {
    expect(world.MISSIONS.map((m) => m.name)).toEqual(NAMES);
    for (const m of world.MISSIONS) parse(C.MissionDto, m);
    for (const r of world.MISSION_ROWS) parse(C.MissionListRowDto, r);
  });

  it("Field app is waiting on Q-0.1a: no kind and no client yet (CR-W22)", () => {
    const field = world.MISSIONS.find((m) => m.name === "Field app");
    expect(field?.kind).toBeNull();
    expect(field?.clientId).toBeNull();
  });

  it("has a pending decision of every kind, each valid, and approvable from its target alone", async () => {
    expect([...new Set(world.DECISIONS.map((d) => d.kind))].sort()).toEqual(
      [...C.DecisionKind].sort(),
    );
    for (const d of world.DECISIONS) {
      parse(C.PendingDecisionDto, d);
      const { route, input } = C.approveCallFor(d, { reason: "Looks right" });
      const proc = (
        C.contract as unknown as Record<
          string,
          Record<
            string,
            { "~orpc": { inputSchema: { "~standard": { validate: (v: unknown) => unknown } } } }
          >
        >
      )[route[0]]?.[route[1]];
      const result = (await proc?.["~orpc"].inputSchema["~standard"].validate(input)) as {
        issues?: unknown;
      };
      expect(result.issues, `${d.kind}: ${JSON.stringify(result.issues)}`).toBeUndefined();
    }
  });

  it("every plain line passes the length limits and the ID lint", () => {
    const lines: string[] = [
      ...world.MISSIONS.map((m) => m.plain.summary),
      ...world.DECISIONS.flatMap((d) => [
        d.plain.title,
        d.plain.why,
        d.plain.ifYouApprove,
        d.plain.ifYouReject ?? "",
        d.plain.returned ?? "",
      ]),
      world.MODULE_RUN.plain.summary,
      world.MODULE_RUN.plain.step,
      ...world.ALERTS.map((a) => a.plain),
    ].filter((l) => l !== "");
    for (const line of lines) expect(C.plainTextIssues(line), line).toEqual([]);
  });

  it("the other reads parse against their schemas", async () => {
    parse(C.StatusDto, world.STATUS);
    parse(C.ModuleRunViewDto, world.MODULE_RUN);
    for (const s of world.STEPS) parse(C.AgentStepDto, s);
    parse(C.ReceiptViewDto, await world.buildReceipt());
    for (const m of world.CANON_MESSAGES) parse(C.CanonMessageDto, m);
    for (const l of world.LEADS) parse(C.LeadDto, l);
    for (const f of world.FOLLOWUPS) parse(C.FollowupDto, f);
    parse(C.PipelineDto, world.PIPELINE);
    parse(C.SkillResultsDto, world.SKILL_RESULTS);
    parse(C.EvalRunDto, world.EVAL_RUN);
    parse(C.TemplateSourceDto, world.TEMPLATE_SOURCE);
    parse(C.TemplateDraftDto, world.TEMPLATE_DRAFT);
    parse(C.FindingDto, world.FINDING);
    parse(C.DeliveryViewDto, world.DELIVERY);
  });

  it("the receipt's hash is the digest of its id, commit, verdict, time and artifact hashes (CR-W21)", async () => {
    const r = await world.buildReceipt();
    const digest = await world.sha256Hex(C.receiptDigestInput(r));
    expect(r.hash).toBe(`sha256:${digest}`);
    for (const a of r.artifacts)
      expect(a.sha256).toBe(await world.sha256Hex(world.ARTIFACT_FILES[a.key] ?? ""));
  });
});

describe("the event catalog in the mock (CR-W1)", () => {
  it("has one sample of every kind, and each parses against EventDto", async () => {
    const events = await world.sampleEvents();
    expect(events.map((e) => e.kind).sort()).toEqual([...C.EventKind].sort());
    for (const e of events) {
      const r = C.EventDto.safeParse(e);
      expect(r.success, `${e.kind}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
  });
});

describe("the mock serves the new routes", () => {
  const mock = createMock({ contractVersion: C.CONTRACT_VERSION, world: true });
  const get = async (path: string) => {
    const res = await mock.fetch(new Request(`http://mock${path}`));
    return {
      status: res.status,
      body: res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text(),
    };
  };
  const fleet = world.MISSIONS[0]?.id ?? "";

  it("GET /api/status", async () => {
    const { status, body } = await get("/api/status");
    expect(status).toBe(200);
    parse(C.StatusDto, body);
  });

  it("GET /api/missions with ?kind=unset lists Field app only", async () => {
    const { body } = await get("/api/missions?kind=unset");
    expect((body as { items: { name: string }[] }).items.map((i) => i.name)).toEqual(["Field app"]);
  });

  it("GET /api/pending-decisions returns every kind, the returned item first (CR-W15)", async () => {
    const { body } = await get("/api/pending-decisions");
    const items = (body as { items: C.PendingDecisionDto[] }).items;
    for (const i of items) parse(C.PendingDecisionDto, i);
    expect(items[0]?.previous?.tookEffect).toBe(false);
  });

  it("GET /api/missions/{id}, the module page, steps, the receipt and an artifact", async () => {
    parse(C.MissionDetailDto, (await get(`/api/missions/${fleet}`)).body);
    parse(C.ModuleRunViewDto, (await get(`/api/missions/${fleet}/modules/M3`)).body);
    const receipt = (
      await get(
        `/api/receipts/${world.DECISIONS.find((d) => d.kind === "release")?.target.receiptId}?verify=1`,
      )
    ).body as C.ReceiptViewDto;
    parse(C.ReceiptViewDto, receipt);
    expect(receipt.verified?.signature).toBe(true);
    const art = await get(`/api/receipts/${receipt.id}/artifacts/tests`);
    expect(art.status).toBe(200);
  });

  // F2, Nov 21 (Zero's ruling): route 63 is a live stream. It replays the events the routes have
  // made, oldest first from seq 1, then waits for more. It never ends on its own, it doesn't
  // serve world.sampleEvents(), and it stops when the request is aborted. The catalog of every
  // kind stays covered by "has one sample of every kind" above.
  it("GET /api/events/stream replays the events the routes made, then waits, and stops on abort", async () => {
    const live = createMock({ contractVersion: C.CONTRACT_VERSION, world: true });
    const made = await live.fetch(
      new Request("http://mock/api/missions", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ name: "Acme portal" }),
      }),
    );
    expect(made.status).toBe(201);

    const abort = new AbortController();
    const res = await live.fetch(
      new Request("http://mock/api/events/stream", {
        headers: { accept: "text/event-stream" },
        signal: abort.signal,
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") ?? "").toContain("text/event-stream");
    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    const turns = async () => {
      for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
    };

    // Replay: route 20's own events (the mission, and Q-0.1a's decision), from seq 1, each an EventDto with its seq as the SSE id.
    let text = "";
    while (!text.includes("onboarding.decision.opened")) {
      const { done, value } = await reader.read();
      expect(done, "the stream is still open after the replay").toBe(false);
      text += decoder.decode(value, { stream: true });
    }
    expect(text).toMatch(/^id: ?1$/m);
    const datas = [...text.matchAll(/^data: ?(.*)$/gm)].map((m) => JSON.parse(m[1] ?? "null"));
    for (const d of datas) parse(C.EventDto, d);
    expect(datas[0]?.seq).toBe(1);
    const kinds = datas.map((d) => d.kind as string);
    expect(kinds).toContain("missions.mission.created");
    expect(kinds).toContain("onboarding.decision.opened");
    // It isn't the sample catalog: kinds no route has made are absent.
    expect(new Set(kinds).size).toBeLessThan(C.EventKind.length);

    // Then it waits: the next read stays pending, and the stream doesn't end.
    let next: "pending" | "settled" = "pending";
    const pending = reader.read().then((r) => {
      next = "settled";
      return r;
    });
    await turns();
    expect(next, "the stream waits for more events instead of ending").toBe("pending");

    // Aborting the request stops it: the pending read comes back, and nothing is left running.
    abort.abort();
    await Promise.race([pending.catch(() => undefined), turns()]);
    await turns();
    expect(next, "an aborted request stops the stream").toBe("settled");
    await reader.cancel().catch(() => undefined);
  });
});
