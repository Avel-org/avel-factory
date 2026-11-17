import { describe, expect, test } from "vitest";
import { readRepoFile } from "./helpers.ts";

const OWNER = "@Avel-org/operator";

type Rule = { re: RegExp; owners: string[] };

// CODEOWNERS follows gitignore patterns, and the last matching line wins. Only the pattern
// forms CODEOWNERS allows are read here: a leading /, *, **, and a trailing /. Brace lists
// ({a,b}) are not a CODEOWNERS feature, so a line must spell each path out.
function toRegex(pattern: string): RegExp {
  let p = pattern;
  const anchored = p.startsWith("/") || p.replace(/\/$/, "").includes("/");
  if (p.startsWith("/")) p = p.slice(1);
  const dir = p.endsWith("/");
  if (dir) p = p.slice(0, -1);
  let out = "";
  for (let i = 0; i < p.length; i++) {
    if (p.startsWith("**/", i)) {
      out += "(?:.*/)?";
      i += 2;
    } else if (p.startsWith("**", i)) {
      out += ".*";
      i += 1;
    } else if (p[i] === "*") out += "[^/]*";
    else if (p[i] === "?") out += "[^/]";
    else out += (p[i] ?? "").replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${anchored ? "" : "(?:.*/)?"}${out}(?:/.*)?$`);
}

function parse(text: string): Rule[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"))
    .map((l) => {
      const [pattern = "", ...owners] = l.split(/\s+/);
      return { re: toRegex(pattern), owners };
    });
}

function ownersOf(rules: Rule[], path: string): string[] {
  let owners: string[] = [];
  for (const r of rules) if (r.re.test(path)) owners = r.owners;
  return owners;
}

// The C4 areas (Build rules C4, the ticket's note) and the rule files, each with a file inside.
const PATHS = [
  ...["auth", "db", "jobs"].map((a) => `packages/server/src/platform/${a}/nested/file.ts`),
  ...["events", "integrator", "runner", "harness", "compute", "metering", "gate", "delivery"].map(
    (m) => `packages/server/src/modules/${m}/nested/file.ts`,
  ),
  ".github/CODEOWNERS",
  ".github/workflows/locks.yml",
  ".github/workflows/ci.yml",
  "scripts/agents/roster.json",
  "scripts/agents/limits.json",
  "scripts/render.py",
  "scripts/dispatch.sh",
  "scripts/agent.sh",
  ".agents/system/osa.md",
  ".claude/agents/rigg.md",
  "docs/design/Build rules.md",
  // "every path is owned": a file nobody listed is owned too
  "README.md",
  "packages/contract/src/index.ts",
];

describe("CODEOWNERS", () => {
  test("every C4 area path and every rule file is owned by @Avel-org/operator", () => {
    const rules = parse(readRepoFile(".github/CODEOWNERS"));
    const wrong = PATHS.map((p) => ({ path: p, owners: ownersOf(rules, p) })).filter(
      (x) => x.owners.length !== 1 || x.owners[0] !== OWNER,
    );
    expect(wrong).toEqual([]);
  });
});
