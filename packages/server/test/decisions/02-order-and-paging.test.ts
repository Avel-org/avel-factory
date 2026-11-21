/** T-B24-02: route 52's order (came back first, expiring soonest, then oldest) and its cursor paging. */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  clientsApp,
  ensureSession,
  listAll,
  listDecisions,
  operatorCookie,
  q,
  seedMission,
  seedProposal,
  uuid,
} from "./support.ts";

const database = testDatabase("b24order");

let checkpoints = 0;

/** A draft checkpoint (no expiry) created this many days ago. */
async function seedCheckpoint(url: string, missionId: string, daysAgo: number) {
  const id = uuid();
  const sessionId = await ensureSession(url, missionId);
  const version = ++checkpoints;
  await q(
    url,
    `insert into checkpoints (id, mission_id, session_id, checkpoint, version, sections, state, created_at)
     values ($1, $2, $3, '0.2', $5, '{}'::jsonb, 'draft', now() - ($4 || ' days')::interval)`,
    [id, missionId, sessionId, String(daysAgo), version],
  );
  return id;
}

describe("T-B24-02 · order and paging", () => {
  it("lists a returned item first, then the soonest to expire, then the oldest", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);

    const e2 = await seedProposal(m, { expiresInDays: 2, subjectKey: "e2", createdDaysAgo: 1 });
    const e1 = await seedProposal(m, { expiresInDays: 1, subjectKey: "e1", createdDaysAgo: 1 });
    // R came back: it replaced a proposal that was superseded before it took effect. It expires last and is newest.
    const returned = uuid();
    const before = await seedProposal(m, {
      state: "superseded",
      subjectKey: "r",
      supersededBy: returned,
      createdDaysAgo: 6,
    });
    await seedProposal(m, { id: returned, expiresInDays: 6, subjectKey: "r", createdDaysAgo: 0 });
    const oldest = await seedCheckpoint(d.url, m.missionId, 5);
    const newer = await seedCheckpoint(d.url, m.missionId, 2);

    const { items } = await listDecisions(app, cookie, "?limit=100");
    expect(items.map((i) => i.ref)).toEqual([
      `proposal:${returned}`,
      `proposal:${e1}`,
      `proposal:${e2}`,
      `checkpoint:${oldest}`,
      `checkpoint:${newer}`,
    ]);
    const back = items[0];
    expect(back?.previous).not.toBeNull();
    expect(back?.plain.returned).not.toBeNull();
    expect(items.every((i) => i.ref !== `proposal:${before}`)).toBe(true);
    expect(items[1]?.previous).toBeNull();
    expect(items[1]?.plain.returned).toBeNull();
  });

  it("pages with the cursor and limit without repeating or skipping a row", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    for (let i = 0; i < 7; i++)
      await seedProposal(m, { expiresInDays: 1 + (i % 3), subjectKey: `p${i}`, createdDaysAgo: i });
    for (let i = 0; i < 3; i++) await seedCheckpoint(d.url, m.missionId, i);

    const whole = await listAll(app, cookie, 100);
    expect(whole.length).toBe(10);
    for (const limit of [1, 3, 4]) {
      const paged = await listAll(app, cookie, limit);
      expect(paged.map((i) => i.ref)).toEqual(whole.map((i) => i.ref));
      expect(new Set(paged.map((i) => i.ref)).size).toBe(10);
    }
    const first = await listDecisions(app, cookie, "?limit=4");
    expect(first.items.length).toBe(4);
    expect(first.nextCursor).not.toBeNull();
    const last = await listDecisions(app, cookie, "?limit=10");
    expect(last.nextCursor).toBeNull();
  });
});
