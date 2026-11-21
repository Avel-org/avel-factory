/** T-B24-04: route 104 reads the factory's own rows: slots, what needs you, standing alerts and the last seq. */
import { StatusDto } from "@avel/contract";
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  clientsApp,
  listAll,
  operatorCookie,
  q,
  seedMission,
  seedOneOfEachOpen,
  send,
  sql,
  uuid,
} from "../decisions/support.ts";

const database = testDatabase("b24status");

const alert = (key: string, kind: string, missionId: string | null = null) => ({
  alert: {
    key,
    kind,
    severity: "heads_up",
    missionId,
    plain: `Alert ${key}`,
    since: "2026-11-21T10:00:00.000Z",
  },
});

async function seedEvent(url: string, kind: string, payload: unknown) {
  const rows = await sql<{ seq: string }>(
    url,
    "insert into events (schema_version, kind, payload) values (1, $1, $2::jsonb) returning seq",
    [kind, JSON.stringify(payload)],
  );
  return Number(rows[0]?.seq);
}

let passes = 0;

async function seedDispatch(url: string, missionId: string, planId: string, state: string) {
  await q(
    url,
    `insert into dispatches (id, mission_id, plan_id, agent, role, frozen_identity, wave, state, pass)
     values ($1, $2, $3, 'soap', 'build', '{}'::jsonb, 1, $4, $5)`,
    [uuid(), missionId, planId, state, ++passes],
  );
}

describe("T-B24-04 · route 104", () => {
  it("returns slots, needsYouCount, standing alerts and lastSeq, valid against StatusDto", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    await seedOneOfEachOpen(m);

    const plan = uuid();
    await seedDispatch(d.url, m.missionId, plan, "running");
    await seedDispatch(d.url, m.missionId, plan, "running");
    await seedDispatch(d.url, m.missionId, plan, "pending");
    await seedDispatch(d.url, m.missionId, plan, "succeeded");

    const stays = "no_progress:a";
    const cleared = "parked:b";
    await seedEvent(d.url, "system.alert.raised", alert(stays, "no_progress", m.missionId));
    await seedEvent(d.url, "system.alert.raised", alert(cleared, "parked", m.missionId));
    await seedEvent(d.url, "system.alert.cleared", {
      key: cleared,
      clearedAt: "2026-11-21T10:05:00.000Z",
    });
    const last = await seedEvent(d.url, "system.alert.raised", alert("dead_job:c", "dead_job"));

    const res = await send(app, "GET", "/api/status", { cookie });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const status = StatusDto.parse(await res.json());

    expect(status.slots).toEqual({ busy: 2, total: 6 });
    expect(status.needsYouCount).toBe((await listAll(app, cookie, 100)).length);
    expect(status.needsYouCount).toBe(9);
    expect(status.alerts.map((a) => a.key).sort()).toEqual([stays, "dead_job:c"].sort());
    expect(status.alerts.some((a) => a.key === cleared)).toBe(false);
    expect(status.lastSeq).toBe(last);
    expect(status.stallAfterMs).toBeGreaterThan(0);
    expect(JSON.stringify(status)).not.toMatch(/micros|cost|price/i);
  });

  it("is zero everywhere on an empty factory, and a cleared alert that is raised again stands", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);

    const emptyRes = await send(app, "GET", "/api/status", { cookie });
    expect(emptyRes.status).toBe(200);
    const empty = StatusDto.parse(await emptyRes.json());
    expect(empty.slots).toEqual({ busy: 0, total: 6 });
    expect(empty.needsYouCount).toBe(0);
    expect(empty.alerts).toEqual([]);

    await seedEvent(d.url, "system.alert.raised", alert("parked:z", "parked"));
    await seedEvent(d.url, "system.alert.cleared", {
      key: "parked:z",
      clearedAt: "2026-11-21T10:05:00.000Z",
    });
    const raised = await seedEvent(d.url, "system.alert.raised", alert("parked:z", "parked"));
    const again = StatusDto.parse(await (await send(app, "GET", "/api/status", { cookie })).json());
    expect(again.alerts.map((a) => a.key)).toEqual(["parked:z"]);
    expect(again.lastSeq).toBe(raised);
  });
});
