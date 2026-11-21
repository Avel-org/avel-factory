/**
 * T-B20-01 (Build rules C5): docs/steps/step-1-done.md, the done-when report, exists and holds one
 * row for each of Step 1's tests 1 to 13; every test file and test ID a row names exists in the
 * repo, and none of those files skips, focuses or quarantines a test.
 *
 * The report's format, which the lead writes (C5) and this test reads: a Markdown table whose
 * rows start with the test's number, five cells each:
 *
 *   | N | what the test says | `path/to/file.test.ts` | `T-Bxx-yy` | T-Bxx |
 *
 *   - cell 3 (File): one or more backticked paths from the repo root, each a `*.test.ts` file.
 *   - cell 4 (Test ID): one or more backticked strings. Each appears in a describe, it or test
 *     title in at least one of the named files (for example "T-B16-01", or "done-when 5").
 *   - cell 5 (Ticket): the ticket that locked it, as T-B<n> or T-F<n>.
 *   - A test that left Step 1 has no file: cell 3 says "moved" and names where it went. Tests 5, 8
 *     and 9 name CR-43; 14 and 15 name CR-31; 12 also names Step 7 (the finalize half).
 *   Rows 1 to 15 are all present, each number once.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const reportPath = resolve(root, "docs/steps/step-1-done.md");

const MOVED: Record<number, string> = {
  5: "CR-43",
  8: "CR-43",
  9: "CR-43",
  14: "CR-31",
  15: "CR-31",
};
const TITLE_CALL = /\b(describe|it|test)(\.\w+)?(\([^)]*\))?\s*\(/;

interface Row {
  readonly n: number;
  readonly says: string;
  readonly file: string;
  readonly id: string;
  readonly ticket: string;
  readonly line: string;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
const ticks = (cell: string) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);

function readRows(): Row[] {
  const text = readFileSync(reportPath, "utf8");
  const rows: Row[] = [];
  for (const line of text.split("\n")) {
    const c = cells(line);
    if (!line.trim().startsWith("|") || !/^\d+$/.test(c[0] ?? "")) continue;
    rows.push({
      n: Number(c[0]),
      says: c[1] ?? "",
      file: c[2] ?? "",
      id: c[3] ?? "",
      ticket: c[4] ?? "",
      line,
    });
  }
  return rows;
}

describe("T-B20-01 · Step 1's done-when report", () => {
  it("docs/steps/step-1-done.md exists", () => {
    expect(existsSync(reportPath), "docs/steps/step-1-done.md is missing").toBe(true);
  });

  it("has exactly one row for each of tests 1 to 15, each saying what it tests", () => {
    expect(existsSync(reportPath), "docs/steps/step-1-done.md is missing").toBe(true);
    const rows = readRows();
    expect(rows.map((r) => r.n).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    );
    for (const r of rows) expect(r.says.length, `row ${r.n} says nothing`).toBeGreaterThan(10);
  });

  it("each of tests 1 to 13 still in Step 1 names real test files and test IDs and a locking ticket", () => {
    expect(existsSync(reportPath), "docs/steps/step-1-done.md is missing").toBe(true);
    const rows = readRows().filter((r) => !(r.n in MOVED));
    expect(rows.map((r) => r.n)).toEqual([1, 2, 3, 4, 6, 7, 10, 11, 12, 13]);
    for (const r of rows) {
      const files = ticks(r.file);
      const ids = ticks(r.id);
      expect(files.length, `row ${r.n} names no test file`).toBeGreaterThan(0);
      expect(ids.length, `row ${r.n} names no test ID`).toBeGreaterThan(0);
      expect(r.ticket, `row ${r.n}: the locking ticket`).toMatch(/^T-[BF]\d+\b/);
      const sources = files.map((f) => {
        expect(f, `row ${r.n}: ${f} is not a *.test.ts file`).toMatch(/\.test\.ts$/);
        const path = resolve(root, f);
        expect(existsSync(path), `row ${r.n}: ${f} does not exist`).toBe(true);
        return readFileSync(path, "utf8");
      });
      for (const id of ids) {
        const found = sources.some((s) =>
          s.split("\n").some((l) => TITLE_CALL.test(l) && l.includes(id)),
        );
        expect(found, `row ${r.n}: no describe, it or test title holds "${id}" in ${files}`).toBe(
          true,
        );
      }
    }
  });

  it("no named test file skips, focuses, marks todo or is quarantined", () => {
    expect(existsSync(reportPath), "docs/steps/step-1-done.md is missing").toBe(true);
    const quarantine = readFileSync(resolve(root, "docs/quarantine.md"), "utf8");
    const named = new Set(readRows().flatMap((r) => ticks(r.file)));
    expect(named.size).toBeGreaterThan(0);
    for (const f of named) {
      const source = readFileSync(resolve(root, f), "utf8");
      expect(source, `${f} skips, focuses or marks a test todo (F3)`).not.toMatch(
        /\b(it|test|describe)\.(skip|only|todo|skipIf|fails)\b|\b(xit|xdescribe|fit|fdescribe)\(/,
      );
      expect(quarantine.includes(f), `${f} is quarantined (F5)`).toBe(false);
    }
  });

  it("tests that left Step 1 say where they went, and test 12 names Step 7", () => {
    expect(existsSync(reportPath), "docs/steps/step-1-done.md is missing").toBe(true);
    const rows = readRows();
    for (const [n, where] of Object.entries(MOVED)) {
      const r = rows.find((row) => row.n === Number(n));
      expect(r?.file.toLowerCase(), `row ${n} says it moved`).toContain("moved");
      expect(r?.line, `row ${n} names ${where}`).toContain(where);
    }
    const twelve = rows.find((r) => r.n === 12);
    expect(twelve?.line, "row 12 names Step 7 for the finalize half").toMatch(/Step 7/);
  });
});
