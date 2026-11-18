import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { crRoot, filesUnder, webRoot } from "./support";

describe("T-F7-03: the dependency and no console.log", () => {
  it("@avel/web pins thinking-orbs to exactly 0.3.2, in dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(webRoot, "package.json"), "utf8"));
    expect(pkg.dependencies?.["thinking-orbs"]).toBe("0.3.2");
    expect(pkg.devDependencies?.["thinking-orbs"]).toBeUndefined();
  });

  it("no file under control-room/ contains console.log", () => {
    const files = filesUnder(crRoot);
    expect(files.length, "control-room/ holds the export").toBeGreaterThan(100);
    const offenders = files.filter((f) =>
      /console\s*\.\s*log\b/.test(readFileSync(join(crRoot, f), "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
