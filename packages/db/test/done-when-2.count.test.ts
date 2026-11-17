// Done-when 2 asks for one test per rule and for the count to be filled in. This pins the count, so a rule
// that drops out of the map reader or the change list can't take its test with it unseen.
// It reads only the map and the change list, so it passes before any schema exists.
import { describe, expect, it } from "vitest";
import { counts } from "./helpers/rules.ts";

describe("done-when 2: the rule count", () => {
  it("[done-when 2] 553 rules, each with its own test: 243 CHECKs (232 plain and 11 parent rules), 88 unique and partial-unique indexes, and 222 foreign keys (219 delete refusals and 3 Better Auth cascades); contract 1.0.0 adds 36 CHECKs, 5 uniques and 15 foreign keys", () => {
    expect(counts).toEqual({
      checks: 232,
      parentRules: 11,
      uniques: 88,
      deleteRefusals: 219,
      deleteCascades: 3,
    });
    expect(
      counts.checks +
        counts.parentRules +
        counts.uniques +
        counts.deleteRefusals +
        counts.deleteCascades,
    ).toBe(553);
  });
});
