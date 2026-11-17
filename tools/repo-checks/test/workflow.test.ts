import { describe, expect, test } from "vitest";
import { readRepoFile } from "./helpers.ts";

describe("workflow", () => {
  test("locks.yml runs the lock check on pull_request with fetch-depth 0", () => {
    const yml = readRepoFile(".github/workflows/locks.yml");
    const lines = yml.split("\n").filter((l) => !l.trim().startsWith("#"));
    const text = lines.join("\n");
    expect(text).toMatch(/^on:\s*\n\s+pull_request:|^on:\s*\[?[^\n]*pull_request/m);
    expect(text).not.toMatch(/^\s+push:/m);
    expect(text).toMatch(/actions\/checkout@/);
    expect(text).toMatch(/fetch-depth:\s*0\s*$/m);
    expect(text).toMatch(/run:.*@avel\/repo-checks.*check-locks/);
  });
});
