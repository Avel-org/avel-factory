#!/usr/bin/env node
// Records test/fixtures/decide-proposal-issues.json: what DecideProposalInput.safeParse gives
// for each case in fixtures/decide-proposal-cases.mjs (S1-6 check 5, S1-3). The first
// recording was taken from the classic-zod contract. Re-record only for a deliberate change:
//
//   pnpm --filter @avel/contract build
//   node packages/contract/test/scripts/record-decide-proposal-issues.mjs
//
// Each issue is kept as (path joined with '.', code, message), in the validator's order,
// which is the shape S1-3 puts in BAD_REQUEST's details. A good case keeps its parsed data.
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DECIDE_PROPOSAL_CASES } from "../fixtures/decide-proposal-cases.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..", "..");
const built = await import(pathToFileURL(join(pkgRoot, "dist", "index.js")).href);

const cases = DECIDE_PROPOSAL_CASES.map(({ name, input }) => {
  const result = built.DecideProposalInput.safeParse(input);
  if (result.success) return { name, input, success: true, data: result.data };
  return {
    name,
    input,
    success: false,
    issues: result.error.issues.map((i) => ({
      path: i.path.map(String).join("."),
      code: i.code,
      message: i.message,
    })),
  };
});

const out = join(pkgRoot, "test", "fixtures", "decide-proposal-issues.json");
writeFileSync(
  out,
  `${JSON.stringify({ route: 54, schema: "DecideProposalInput", cases }, null, 2)}\n`,
);
console.log(`wrote ${out}: ${cases.length} cases`);
