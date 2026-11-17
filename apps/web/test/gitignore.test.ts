import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const web = join(import.meta.dirname, "..");

function ignored(path: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", "--no-index", path], { cwd: web });
    return true;
  } catch {
    return false;
  }
}

describe("T-F1-10: a test run leaves git status clean", () => {
  it("apps/web/.gitignore exists", () => {
    expect(existsSync(join(web, ".gitignore"))).toBe(true);
  });

  it("ignores what Playwright writes: test-results/ and playwright-report/", () => {
    expect(ignored("test-results/a-test/video.webm")).toBe(true);
    expect(ignored("playwright-report/index.html")).toBe(true);
  });
});
