import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DECIDE_PROPOSAL_CASES } from "../fixtures/decide-proposal-cases.mjs";
import { entryExists, loadContract, PKG_ROOT } from "../helpers/contract.ts";

// RIGG-03 (S1-6 check 5, S1-3): route 54's input gives the same issues after the move to
// zod/mini. fixtures/decide-proposal-issues.json was recorded from the classic-zod contract
// (scripts/record-decide-proposal-issues.mjs). Each issue is (path joined with '.', code,
// message), in the validator's order: the shape S1-3 puts in BAD_REQUEST's details. A good
// case keeps its parsed data (the reason is trimmed).

type Issue = { path: string; code: string; message: string };
type Recorded =
  | { name: string; input: unknown; success: false; issues: Issue[] }
  | { name: string; input: unknown; success: true; data: unknown };
type Fixture = { route: number; schema: string; cases: Recorded[] };

const fixture = JSON.parse(
  readFileSync(join(PKG_ROOT, "test", "fixtures", "decide-proposal-issues.json"), "utf8"),
) as Fixture;

type Parser = {
  safeParse(input: unknown):
    | { success: true; data: unknown }
    | {
        success: false;
        error: { issues: { path: PropertyKey[]; code: string; message: string }[] };
      };
};

async function decideProposalInput(): Promise<Parser> {
  expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
  const schema = (await loadContract()).DecideProposalInput as Parser | undefined;
  expect(schema, "DecideProposalInput is not exported").toBeDefined();
  return schema as Parser;
}

describe("RIGG-03 (S1-6 check 5, S1-3): route 54's bad inputs give the same issues", () => {
  it("RIGG-03 (pins existing behaviour: passes on classic): the fixture covers every case the test defines, in order", () => {
    expect(fixture.route).toBe(54);
    expect(fixture.schema).toBe("DecideProposalInput");
    expect(fixture.cases.map((c) => c.name)).toEqual(DECIDE_PROPOSAL_CASES.map((c) => c.name));
    expect(fixture.cases.map((c) => c.input)).toEqual(DECIDE_PROPOSAL_CASES.map((c) => c.input));
    expect(fixture.cases.filter((c) => !c.success).length).toBeGreaterThanOrEqual(5);
  });

  for (const recorded of fixture.cases) {
    it(`RIGG-03 (pins existing behaviour: passes on classic): ${recorded.name}`, async () => {
      const result = (await decideProposalInput()).safeParse(recorded.input);
      if (recorded.success) {
        expect(result.success, "expected the input to parse").toBe(true);
        if (result.success) expect(result.data).toEqual(recorded.data);
        return;
      }
      expect(result.success, "expected the input to be refused").toBe(false);
      if (result.success) return;
      const issues: Issue[] = result.error.issues.map((i) => ({
        path: i.path.map(String).join("."),
        code: i.code,
        message: i.message,
      }));
      expect(issues).toEqual(recorded.issues);
    });
  }

  it("RIGG-03 (pins existing behaviour: passes on classic): a padded reason is trimmed to 'because it is right'", async () => {
    const result = (await decideProposalInput()).safeParse(
      fixture.cases.find((c) => c.success)?.input,
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as { reason: string }).reason).toBe("because it is right");
  });
});
