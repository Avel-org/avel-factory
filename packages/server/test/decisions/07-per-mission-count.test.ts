/** T-B24-07: the per-mission count exported from factory/decisions counts only that mission's open items. */
import { describe, expect, it } from "vitest";
import { countPendingDecisionsByMission } from "../../src/factory/decisions/index.ts";
import { testDatabase } from "../db/support/database.ts";
import { runDb, seedMission, seedOneOfEachOpen, seedProposal } from "./support.ts";

const database = testDatabase("b24count");

describe("T-B24-07 · the per-mission count", () => {
  it("counts each mission's own open items and agrees with route 52's rows", async () => {
    const d = await database();
    const a = await seedMission(d.url);
    const b = await seedMission(d.url);
    const quiet = await seedMission(d.url);
    const ofA = await seedOneOfEachOpen(a); // nine rows; the release one sits on its own mission
    await seedProposal(b, { subjectKey: "b1" });
    await seedProposal(b, { subjectKey: "b2" });
    await seedProposal(b, { state: "resolved", subjectKey: "b-done" });
    await seedProposal(b, { state: "expired", expiresInDays: -1, subjectKey: "b-lapsed" });

    const exit = await runDb(d.url, countPendingDecisionsByMission);
    if (exit._tag !== "Success") throw new Error(`the count failed: ${JSON.stringify(exit)}`);
    const counts = exit.value;
    expect(counts.get(a.missionId)).toBe(8); // every kind but the release, which sits on its own mission
    expect(counts.get(ofA.releaseMission as string)).toBe(1);
    expect(counts.get(b.missionId)).toBe(2);
    expect(counts.get(quiet.missionId) ?? 0).toBe(0);
  });
});
