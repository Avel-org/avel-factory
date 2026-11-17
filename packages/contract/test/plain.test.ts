import { describe, expect, it } from "vitest";
import * as C from "../src/index.ts";

// CR-W9 done-when: a template test per object state (every module state, every decision kind,
// every verdict) with the length limits, and a lint that plain text holds no ID-like tokens.

function clean(block: Record<string, unknown>, limits: Record<string, number>) {
  for (const [key, value] of Object.entries(block)) {
    const lines = Array.isArray(value) ? value : value === null ? [] : [value];
    for (const line of lines) {
      expect(typeof line).toBe("string");
      const max = limits[key] ?? 120;
      expect((line as string).length, `${key}: ${line}`).toBeLessThanOrEqual(max);
      expect(C.plainTextIssues(line as string), `${key}: ${line}`).toEqual([]);
    }
  }
}

const LONG = { why: 240, ifYouApprove: 240, ifYouReject: 240, returned: 240 };

describe("CR-W9: the plain templates", () => {
  it.each(C.MissionDisplayState)("mission, %s", (displayState) => {
    for (const kind of [...C.ProjectKind, null]) {
      const p = C.missionPlain({
        name: "Spring launch site",
        clientName: "Blume Studio",
        kind,
        displayState,
        modules: { total: 8, landed: 4 },
        needsYouCount: 1,
      });
      expect(C.MissionPlain.safeParse(p).success).toBe(true);
      clean(p, {});
    }
  });

  it.each(C.ModuleRunState)("module, %s", (state) => {
    for (const retry of [0, 1, 2, 3]) {
      const p = C.modulePlain({
        name: "Quote form",
        goal: "Drivers send a quote request from the job page",
        state,
        retry,
      });
      expect(C.ModulePlain.safeParse(p).success).toBe(true);
      clean(p, { name: 60, step: 60 });
    }
  });

  it.each(C.DispatchState)("dispatch, %s", (state) => {
    for (const role of C.DispatchRole) {
      const p = C.dispatchPlain({ moduleName: "Quote form", role, state });
      expect(C.DispatchPlain.safeParse(p).success).toBe(true);
      clean(p, { role: 60, step: 60 });
    }
  });

  const facts: C.DecisionFacts[] = [
    ...C.ProposalKind.map((proposalKind) => ({
      kind: "proposal" as const,
      proposalKind,
      subject: "payments-api",
      reason: "The build needs a payment client the plan didn't list.",
    })),
    { kind: "factory_change", area: "factory_yaml", title: "Raise the review limit" },
    {
      kind: "checkpoint",
      checkpointName: "0.2 Breakdown",
      projectName: "Fleet portal",
      next: "0.3 Mission and roster",
    },
    { kind: "plan_finalize", projectName: "Fleet portal", parts: 6 },
    {
      kind: "checkpoint_question",
      question: "Is this a client project, or an internal template?",
      subjectLabel: "0.1 What it is",
      blocking: true,
    },
    { kind: "pass_approval", projectName: "Booking fix", caps: 2 },
    { kind: "release", projectName: "Booking fix", verdict: "pass", method: "pr" },
    { kind: "release", projectName: "Parts catalogue", verdict: "verified", method: "zip" },
    { kind: "dispatch_package_commit", projectName: "Landing page", repoName: "GTS" },
    { kind: "followup_send", clientName: "GTS Diesel", channel: "copy" },
    { kind: "upkeep_offer", clientName: "GTS Diesel", channel: "email" },
  ];

  it("every decision kind has a template", () => {
    expect([...new Set(facts.map((f) => f.kind))].sort()).toEqual([...C.DecisionKind].sort());
  });

  it.each(facts.map((f) => [f.kind, f] as const))("decision, %s", (_k, f) => {
    const p = C.decisionPlain(f);
    expect(C.DecisionPlain.safeParse(p).success).toBe(true);
    clean(p, { title: 120, ...LONG });
  });

  it.each(C.ReceiptVerdict)("receipt, %s", (verdict) => {
    const p = C.receiptPlain({
      verdict,
      tests: { passed: 472, total: 472 },
      acceptance: { verified: 9, total: 9 },
      accepted: 1,
    });
    expect(C.ReceiptPlain.safeParse(p).success).toBe(true);
    clean({ verdictLine: p.verdictLine, proofLines: p.proofLines }, {});
    expect(p.proofLines.length).toBeLessThanOrEqual(6);
  });

  it("the lint catches IDs, hashes and gate numbers", () => {
    expect(C.plainTextIssues("M3 failed")).toContain("M3");
    expect(C.plainTextIssues("commit 4f9e2a1 landed")).toContain("4f9e2a1");
    expect(C.plainTextIssues("Gate 3 passed")).toContain("Gate 3");
    expect(C.plainTextIssues("F-12 is open")).toContain("F-12");
    expect(C.plainTextIssues("All 472 tests pass")).toEqual([]);
  });

  it("clip cuts at a word and keeps the limit", () => {
    const long = "word ".repeat(80);
    expect(C.clip(long, 120).length).toBeLessThanOrEqual(120);
  });
});
