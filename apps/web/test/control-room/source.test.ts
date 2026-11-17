import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { crRoot, EXPORT_ROOT, filesUnder } from "./support";

// T-F7-02: SOURCE.md is the record of what was copied and what apps/web changed.
// Row format (the builder's choice within this): a line holding the file's path relative to
// control-room/ in backticks (src/..., contract/..., tools/check-contract.mjs) and its 64-hex
// SHA-256 as copied. A second backticked path starting with "/" may name the export path.
const sourcePath = join(crRoot, "SOURCE.md");
const sha = (buf: Buffer) => createHash("sha256").update(buf).digest("hex");

function parse() {
  const text = readFileSync(sourcePath, "utf8");
  const lines = text.split("\n");
  const rows = new Map<string, string>();
  let inChanged = false;
  const changed: string[] = [];
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) inChanged = /changed for apps\/web/i.test(line);
    const hash = /\b([0-9a-f]{64})\b/.exec(line)?.[1];
    const paths = [...line.matchAll(/`([^`\s]+)`/g)]
      .map((m) => m[1] ?? "")
      .filter((p) => !p.startsWith("/") && !/^[0-9a-f]{64}$/.test(p));
    if (hash && paths[0] && !inChanged) rows.set(paths[0], hash);
    else if (inChanged) changed.push(line);
  }
  return { rows, changed };
}

describe("T-F7-02: apps/web/control-room/SOURCE.md", () => {
  it("exists, with a 'Changed for apps/web' section", () => {
    expect(existsSync(sourcePath), "SOURCE.md").toBe(true);
    expect(readFileSync(sourcePath, "utf8")).toMatch(/^#{1,6}\s+Changed for apps\/web/im);
  });

  it("lists every copied file once, with a 64-hex SHA-256, and no other file is there", () => {
    const { rows } = parse();
    const onDisk = filesUnder(crRoot)
      .filter((f) => f !== "SOURCE.md")
      .sort();
    expect(onDisk.length, "files copied").toBeGreaterThan(100);
    expect([...rows.keys()].sort()).toEqual(onDisk);
  });

  it("copies only src/, contract/ and tools/check-contract.mjs, and nothing excluded", () => {
    const onDisk = filesUnder(crRoot).filter((f) => f !== "SOURCE.md");
    expect(onDisk.length).toBeGreaterThan(0);
    for (const f of onDisk) {
      expect(/^(src|contract)\//.test(f) || f === "tools/check-contract.mjs", f).toBe(true);
      expect(
        f
          .split("/")
          .some((s) => ["node_modules", "dist", "scratch", "tests", "handoff"].includes(s)),
        f,
      ).toBe(false);
    }
    for (const f of ["index.html", "package.json", "package-lock.json", "vite.config.js"]) {
      expect(onDisk).not.toContain(f);
    }
    expect(onDisk).toContain("src/main.jsx");
    expect(onDisk).toContain("src/app/ControlRoom.jsx");
    expect(onDisk).toContain("src/app/logic.js");
  });

  it("names each file whose SHA-256 differs from its listed one, with a reason", () => {
    const { rows, changed } = parse();
    expect(rows.size, "listed files").toBeGreaterThan(100);
    const section = changed.join("\n");
    const differing = [...rows].filter(([path, hash]) => {
      const file = join(crRoot, path);
      return !existsSync(file) || sha(readFileSync(file)) !== hash;
    });
    // CR-W29 names these as changed: ControlRoom (defaultProps) and main.jsx (stylesheets, mount).
    expect(differing.map(([p]) => p)).toContain("src/app/ControlRoom.jsx");
    for (const [path] of differing) {
      const line = changed.find((l) => l.includes(`\`${path}\``));
      expect(
        line,
        `${path} differs from its listed hash but isn't named in "Changed for apps/web"`,
      ).toBeDefined();
      const reason = (line ?? "").replace(path, "").replace(/[`|*\-:\s]/g, "");
      expect(reason.length, `${path} needs a reason`).toBeGreaterThanOrEqual(10);
    }
    // And the section names only files that really differ (no stale entries).
    const differingPaths = new Set(differing.map(([p]) => p));
    for (const line of section.split("\n")) {
      for (const m of line.matchAll(/`((?:src|contract|tools)\/[^`\s]+)`/g)) {
        expect(
          differingPaths.has(m[1] ?? ""),
          `${m[1]} is named as changed but matches its listed hash`,
        ).toBe(true);
      }
    }
  });

  it("lists the hash each file had in the export (when the export is on this machine)", () => {
    const { rows } = parse();
    expect(rows.size).toBeGreaterThan(100);
    if (!existsSync(EXPORT_ROOT)) return;
    for (const [path, hash] of rows) {
      const original = join(EXPORT_ROOT, path);
      expect(existsSync(original), `${path} is in the export`).toBe(true);
      expect(sha(readFileSync(original)), `${path}: listed hash is the export's`).toBe(hash);
    }
  });
});
