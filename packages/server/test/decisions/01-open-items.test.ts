/** T-B24-01: route 52 returns one row per open item it serves, each valid, and none for a resolved or expired one. */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  clientsApp,
  listDecisions,
  operatorCookie,
  seedMission,
  seedOneOfEachOpen,
  seedProposal,
} from "./support.ts";

const database = testDatabase("b24open");

const SERVED = [
  "proposal",
  "checkpoint",
  "plan_finalize",
  "checkpoint_question",
  "pass_approval",
  "release",
  "dispatch_package_commit",
  "followup_send",
  "upkeep_offer",
] as const;

describe("T-B24-01 · route 52 lists what is open", () => {
  it("returns one valid row for each of the nine served kinds, and nothing for factory_change", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    const ids = await seedOneOfEachOpen(m);

    const { items } = await listDecisions(app, cookie, "?limit=100");
    const kinds = items.map((i) => i.kind).sort();
    expect(kinds).toEqual([...SERVED].sort());
    expect(items.some((i) => i.kind === "factory_change")).toBe(false);

    const byKind = new Map(items.map((i) => [i.kind, i]));
    const p = byKind.get("proposal");
    expect(p?.ref).toBe(`proposal:${ids.proposal}`);
    expect(p?.kind === "proposal" && p.target.proposalId).toBe(ids.proposal);
    expect(byKind.get("checkpoint")?.ref).toBe(`checkpoint:${ids.checkpoint}`);
    expect(byKind.get("checkpoint_question")?.ref).toBe(
      `checkpoint_question:${ids.checkpoint_question}`,
    );
    expect(byKind.get("followup_send")?.ref).toBe(`followup_send:${ids.followup_send}`);
    expect(byKind.get("upkeep_offer")?.ref).toBe(`upkeep_offer:${ids.upkeep_offer}`);
    // Each row names its mission and carries the words the server wrote.
    for (const item of items) {
      expect(item.mission?.id).toBeDefined();
      expect(item.plain.title.length).toBeGreaterThan(0);
      expect(item.plain.why.length).toBeGreaterThan(0);
      expect(item.asOfSeq).toBeGreaterThanOrEqual(0);
    }
    expect(byKind.get("pass_approval")?.mission?.id).toBe(m.missionId);
    expect(byKind.get("release")?.mission?.id).toBe(ids.releaseMission);
  });

  it("leaves out a resolved, an expired, a superseded and a past-due proposal", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const m = await seedMission(d.url);
    const open = await seedProposal(m, { subjectKey: "open-one" });
    await seedProposal(m, { state: "resolved", subjectKey: "done" });
    await seedProposal(m, { state: "expired", expiresInDays: -1, subjectKey: "lapsed" });
    await seedProposal(m, { state: "superseded", supersededBy: open, subjectKey: "old" });
    await seedProposal(m, { state: "open", expiresInDays: -1, subjectKey: "past-due" }); // CR-W2: counted as expired

    const { items } = await listDecisions(app, cookie, "?limit=100");
    expect(items.map((i) => i.ref)).toEqual([`proposal:${open}`]);
  });
});
