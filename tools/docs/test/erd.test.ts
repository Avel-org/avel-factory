import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generatedDir, generateInto, readText, step0TableNames, tempDir } from "./helpers.js";

// Done-when 4, the generator half: the ERD is generated from the schema. RIGG-01.

describe("done-when 4 (RIGG-01): the ERD generates from the schema", () => {
  it("[done-when 4] generate writes erd.md as a mermaid erDiagram", () => {
    const out = tempDir("erd");
    generateInto(out);
    const erd = join(out, "erd.md");
    expect(existsSync(erd), "erd.md was not written").toBe(true);
    const text = readText(erd);
    expect(text).toContain("```mermaid");
    expect(text).toContain("erDiagram");
  });

  it("[done-when 4] the ERD names every table: the map's 91 and design_systems", () => {
    const out = tempDir("erd-tables");
    generateInto(out);
    expect(existsSync(join(out, "erd.md")), "erd.md was not written").toBe(true);
    const text = readText(join(out, "erd.md"));
    const missing = step0TableNames().filter((t) => !new RegExp(`\\b${t}\\b`).test(text));
    expect(missing).toEqual([]);
  });

  it("[done-when 4] the ERD holds nothing the changes removed: outbox, lease_epoch, rep_id", () => {
    const out = tempDir("erd-removed");
    generateInto(out);
    expect(existsSync(join(out, "erd.md")), "erd.md was not written").toBe(true);
    const text = readText(join(out, "erd.md"));
    expect(text).toContain("clients");
    for (const gone of ["outbox", "lease_epoch", "rep_id"]) {
      expect(text, gone).not.toMatch(new RegExp(`\\b${gone}\\b`));
    }
  });

  it("[done-when 4] generate twice gives byte-identical output", () => {
    const a = tempDir("erd-a");
    const b = tempDir("erd-b");
    generateInto(a);
    generateInto(b);
    expect(existsSync(join(a, "erd.md")), "erd.md was not written").toBe(true);
    expect(readText(join(b, "erd.md"))).toBe(readText(join(a, "erd.md")));
  });

  it("[done-when 4] docs/generated/erd.md is committed and matches a fresh generate", () => {
    const out = tempDir("erd-fresh");
    generateInto(out);
    expect(existsSync(join(generatedDir, "erd.md")), "docs/generated/erd.md is missing").toBe(true);
    expect(existsSync(join(out, "erd.md")), "generate wrote no erd.md").toBe(true);
    expect(readText(join(generatedDir, "erd.md"))).toBe(readText(join(out, "erd.md")));
  });
});
