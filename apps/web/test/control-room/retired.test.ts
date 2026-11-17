import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { webRoot } from "./support";

// T-F7-01 (CR-W29): the old shell, the old home and the locked tests that cover them are gone.
describe("T-F7-01: the old shell and its locked tests are retired", () => {
  const gone = [
    "test/shell",
    "e2e/shell",
    "test/home-loader.test.ts",
    "test/home-loader-states.test.ts",
    "test/home-view.test.ts",
    "e2e/home.spec.ts",
    "e2e/states.spec.ts",
    "src/kit",
    "src/modules/system",
    "src/home",
    "src/routes/_shell.tsx",
    "src/routes/_shell",
  ];
  for (const path of gone) {
    it(`${path} is gone`, () => {
      expect(existsSync(join(webRoot, path)), path).toBe(false);
    });
  }

  it("what CR-W29 keeps is still there", () => {
    for (const path of ["src/data/client.ts", "src/styles", "src/lib/utils.ts"]) {
      expect(existsSync(join(webRoot, path)), path).toBe(true);
    }
  });

  it("the control room is mounted by src/routes/index.tsx", () => {
    expect(existsSync(join(webRoot, "src/routes/index.tsx"))).toBe(true);
    expect(existsSync(join(webRoot, "src/control-room.d.ts"))).toBe(true);
  });
});
