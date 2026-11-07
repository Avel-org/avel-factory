import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { databaseMdCopy, databaseMdPath, driftAgainst, runDocs } from "./helpers.js";

// Done-when 4: the ERD drift check passes (the schema and DATABASE.md agree), and
// fails on a planted mismatch. RIGG-01.

function plant(path: string, edit: (text: string) => string): void {
  const before = readFileSync(path, "utf8");
  const after = edit(before);
  expect(after, "the plant did not change DATABASE.md: its text moved, update the test").not.toBe(
    before,
  );
  writeFileSync(path, after);
}

// Each planted copy starts as a control: the unmodified copy must pass first, so a
// check that always fails (or never runs) can't satisfy the planted case.
function plantedCopy(label: string, edit: (text: string) => string) {
  const copy = databaseMdCopy(label);
  const control = driftAgainst(copy);
  expect(control.output, "control: the unmodified DATABASE.md").toMatch(/no drift/i);
  expect(control.status, "control: the unmodified DATABASE.md").toBe(0);
  plant(copy, edit);
  return driftAgainst(copy);
}

describe("done-when 4 (RIGG-01): the drift check passes on the real DATABASE.md", () => {
  it("[done-when 4] the schema and docs/design/DATABASE.md agree: exit 0 and 'no drift'", () => {
    const result = runDocs("drift");
    expect(result.output).toMatch(/no drift/i);
    expect(result.status).toBe(0);
  });

  it("[done-when 4] the check only reads DATABASE.md: the file is the same after a run", () => {
    const before = readFileSync(databaseMdPath, "utf8");
    runDocs("drift");
    expect(readFileSync(databaseMdPath, "utf8")).toBe(before);
    expect(runDocs("drift").output).toMatch(/no drift/i);
  });
});

describe("done-when 4 (RIGG-01): the drift check fails on a planted mismatch", () => {
  it("[done-when 4] a table in DATABASE.md that the schema lacks fails, naming it", () => {
    const result = plantedCopy("extra-table", (text) =>
      text.replace(
        "## Integrity rules",
        "### Planted\n\n```\nghost_table      { name, status: 'active'|'archived' }\n```\n\n## Integrity rules",
      ),
    );
    expect(result.status).toBe(1);
    expect(result.output).toContain("ghost_table");
  });

  it("[done-when 4] a schema table missing from DATABASE.md fails, naming it", () => {
    const result = plantedCopy("missing-table", (text) =>
      text
        .split("\n")
        .filter((line) => !/^payments\s/.test(line))
        .join("\n"),
    );
    expect(result.status).toBe(1);
    expect(result.output).toContain("payments");
  });

  it("[done-when 4] a column renamed in DATABASE.md fails, naming the old and the new", () => {
    const result = plantedCopy("renamed-column", (text) =>
      text.replace("contacts: jsonb", "contact_list: jsonb"),
    );
    expect(result.status).toBe(1);
    expect(result.output).toContain("contact_list");
    expect(result.output).toContain("contacts");
  });

  it("[done-when 4] a dropped rep column put back in DATABASE.md fails (CR-18), naming it", () => {
    const result = plantedCopy("rep-column", (text) =>
      text.replace(/^(clients\s+\{\s*)/m, "$1rep_id → users, "),
    );
    expect(result.status).toBe(1);
    expect(result.output).toContain("rep_id");
  });

  it("[done-when 4] a relationship removed from the ERD in DATABASE.md fails, naming both tables", () => {
    const result = plantedCopy("missing-edge", (text) =>
      text
        .split("\n")
        .filter((line) => !/^\s*clients \|\|--o\{ missions\b/.test(line))
        .join("\n"),
    );
    expect(result.status).toBe(1);
    expect(result.output).toContain("clients");
    expect(result.output).toContain("missions");
  });

  it("[done-when 4] a planted mismatch never edits the file it checked", () => {
    const copy = databaseMdCopy("read-only");
    writeFileSync(
      copy,
      `${readFileSync(copy, "utf8")}\n### Planted\n\n\`\`\`\nghost_table { name }\n\`\`\`\n`,
    );
    const before = readFileSync(copy, "utf8");
    const result = driftAgainst(copy);
    expect(result.status).toBe(1);
    expect(readFileSync(copy, "utf8")).toBe(before);
  });
});
