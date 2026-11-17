import { describe, expect, it } from "vitest";
import * as C from "../src/index.ts";
import { SAMPLE_DECISIONS } from "./fixtures/decisions.ts";

// CR-W2 done-when: every DecisionKind has a schema and an approve route, and its approve input
// is built from the item's target alone (no second read). CR-W15: refs and `previous`.

type Proc = { "~orpc": { inputSchema: { "~standard": { validate: (v: unknown) => unknown } } } };
const contract = C.contract as unknown as Record<string, Record<string, Proc>>;

describe("CR-W2: the pending-decisions union", () => {
  it("has one member per DecisionKind, and the samples cover every kind", () => {
    const kinds = SAMPLE_DECISIONS.map((d) => d.kind).sort();
    expect(kinds).toEqual([...C.DecisionKind].sort());
  });

  it.each(SAMPLE_DECISIONS.map((d) => [d.kind, d] as const))(
    "%s parses against PendingDecisionDto",
    (_k, d) => {
      const r = C.PendingDecisionDto.safeParse(d);
      expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    },
  );

  it.each(SAMPLE_DECISIONS.map((d) => [d.kind, d] as const))(
    "%s: its approve route exists and the input built from its target alone parses",
    async (_k, d) => {
      const { route, input } = C.approveCallFor(d, { reason: "Looks right" });
      const proc = contract[route[0]]?.[route[1]];
      expect(proc, `${route.join(".")} isn't a route`).toBeDefined();
      const result = await proc?.["~orpc"].inputSchema["~standard"].validate(input);
      expect((result as { issues?: unknown }).issues, JSON.stringify(input)).toBeUndefined();
    },
  );

  it("every kind has an owner, a plain template and an approve route", () => {
    for (const k of C.DecisionKind) {
      expect(C.decisionApproveRoutes[k]).toBeDefined();
      expect(C.decisionTemplateKinds[k]).toBe(true);
    }
  });

  it("a ref is `<kind>:<id>` and parses back (conflict 7: unique by the row's id)", () => {
    for (const d of SAMPLE_DECISIONS) {
      expect(C.DecisionRef.safeParse(d.ref).success, d.ref).toBe(true);
      expect(C.parseDecisionRef(d.ref)?.kind).toBe(d.kind);
    }
    expect(C.parseDecisionRef("question:Q-0.1")).toBeNull();
  });

  it("CR-W19 section 8.2: a question answered in your own words sends choice other with the text", () => {
    const q = SAMPLE_DECISIONS.find((d) => d.kind === "checkpoint_question");
    if (!q) throw new Error("no question sample");
    const { input } = C.approveCallFor(q, { choice: "other", answer: "A starter for field crews" });
    expect(C.AnswerQuestionInput.safeParse(input).success).toBe(true);
    expect(C.AnswerQuestionInput.safeParse({ ...input, answer: undefined }).success).toBe(false);
  });

  it("CR-W15: plain.returned fits its limit and the 409 carries the current item", () => {
    const returned = C.returnedLine({
      verdict: "approved",
      boundVersion: 4,
      newVersion: 5,
      changedBy: "an agent",
    });
    expect(returned.length).toBeLessThanOrEqual(240);
    expect(C.plainTextIssues(returned)).toEqual([]);
    const details = { field: "version", currentVersion: 5, current: SAMPLE_DECISIONS[0] };
    expect(C.StaleVersionDetails.safeParse(details).success).toBe(true);
  });
});
