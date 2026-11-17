import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { readRepoFile, repoRoot } from "./helpers.ts";

// T-B2: the server's `check:effect` script (CR-39). The interface these tests lock:
//   command  `pnpm --filter @avel/server run check:effect [-- <paths>]`
//   no paths it checks the server's src and test.
//   paths    absolute .ts file paths; it checks those instead.
//   fails    exit non-zero on any Effect error diagnostic, and the output names the file and the
//            rule (effect(floatingEffect)).
//   passes   exit 0.
// The fixtures are copied to a scratch directory, with node_modules linked to the server's, so
// `effect` resolves. The scratch tsconfig.json enables the plugin entry `@effect/language-service`
// (the name effect-tsgo reads; it's the plugin's name, not the package's).

const serverModules = join(repoRoot, "packages/server/node_modules");
let scratch = "";

function checkEffect(paths: string[]): { status: number | null; output: string } {
  const r = spawnSync(
    "pnpm",
    ["--filter", "@avel/server", "run", "check:effect", ...(paths.length ? ["--", ...paths] : [])],
    { cwd: repoRoot, encoding: "utf8", timeout: 200_000, env: { ...process.env } },
  );
  return { status: r.status, output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), "avel-effect-check-"));
  cpSync(new URL("./fixtures/effect", import.meta.url), scratch, { recursive: true });
  // stored as .ts.txt so the repo's own typecheck and lint don't read the deliberate mistake
  for (const f of ["bad/floating.ts", "clean/clean.ts"])
    renameSync(join(scratch, `${f}.txt`), join(scratch, f));
  symlinkSync(serverModules, join(scratch, "node_modules"), "dir");
});

afterAll(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

describe("check:effect (CR-39)", () => {
  test("T-B2-03: a fixture with an Effect that is created and never run exits non-zero and names the file", () => {
    const file = join(scratch, "bad/floating.ts");
    const r = checkEffect([file]);
    expect(r.output).toContain("floating.ts");
    expect(r.output).toContain("floatingEffect");
    expect(r.status).not.toBe(0);
    expect(r.status).not.toBeNull();
    // a missing script also exits non-zero, so the output must come from effect-tsgo, not pnpm
    expect(r.output).not.toMatch(/Missing script|NO_SCRIPT|has a "check:effect" script/);
  });

  test("T-B2-04: the same script exits 0 on a clean fixture, and with no arguments on the server", () => {
    const clean = checkEffect([join(scratch, "clean/clean.ts")]);
    expect(clean.output, clean.output).not.toMatch(
      /Missing script|NO_SCRIPT|has a "check:effect" script/,
    );
    expect(clean.status, clean.output).toBe(0);

    const server = checkEffect([]);
    expect(server.output, server.output).not.toMatch(
      /Missing script|NO_SCRIPT|has a "check:effect" script/,
    );
    expect(server.status, server.output).toBe(0);
  });

  test("T-B2-05: ci.yml runs the check after typecheck, in the main job", () => {
    const lines = readRepoFile(".github/workflows/ci.yml")
      .split("\n")
      .filter((l) => !l.trim().startsWith("#"));
    const at = (re: RegExp) => lines.findIndex((l) => re.test(l));
    const typecheck = at(/run:\s*pnpm typecheck\s*$/);
    const effect = at(/run:\s*pnpm --filter @avel\/server run check:effect\s*$/);
    expect(typecheck).toBeGreaterThan(-1);
    expect(effect).toBeGreaterThan(typecheck);
  });
});
