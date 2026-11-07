// Done-when 2 asks for one test per rule and for the count to be filled in. This pins the count, so a rule
// that drops out of the map reader or the change list can't take its test with it unseen.
// It reads only the map and the change list, so it passes before any schema exists.
import { describe, expect, it } from "vitest";
import { counts } from "./helpers/rules.ts";

describe("done-when 2: the rule count", () => {
  it("[done-when 2] pins existing behaviour (passes now): 497 rules, each with its own test: 207 CHECKs (196 plain and 11 parent rules), 83 unique and partial-unique indexes, and 207 foreign keys (204 delete refusals and 3 Better Auth cascades)", () => {
    expect(counts).toEqual({
      checks: 196,
      parentRules: 11,
      uniques: 83,
      deleteRefusals: 204,
      deleteCascades: 3,
    });
    expect(
      counts.checks +
        counts.parentRules +
        counts.uniques +
        counts.deleteRefusals +
        counts.deleteCascades,
    ).toBe(497);
  });
});
