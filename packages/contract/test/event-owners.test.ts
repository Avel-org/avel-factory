import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENTRY, entryExists, loadContract, REPO_ROOT, run } from "./helpers/contract.ts";

// Done-when 7 (Step 0 and Step 1 plan): an event kind with no owning module fails to compile.
// contract.md section 5 (E5, B5, O1): one exhaustive Record<EventKind, Module> in
// packages/contract, 12 kinds.
//
// The type half compiles small fixture programs against the contract's real types with tsc
// and expects exact diagnostics. The contract names the type `EventKind`; the map itself is
// found by shape (the export keyed by `dispatch.ready`), because contract.md leaves its
// export name open.

const OWNERS: Readonly<Record<string, string>> = {
  "dispatch.ready": "factory",
  "dispatch.started": "factory",
  "dispatch.parked": "factory",
  "attempt.started": "runner",
  "attempt.ended": "runner",
  "mission.created": "factory",
  "pass.approved": "gate",
  "receipt.issued": "gate",
  "usage.recorded": "metering",
  "task_doc.rendered": "factory",
  "message.stopped": "onboarding",
  "mission.closed": "factory",
};
const KINDS = Object.keys(OWNERS);

function ownerMapOf(mod: Record<string, unknown>): Record<string, unknown> | undefined {
  return Object.values(mod).find(
    (v): v is Record<string, unknown> =>
      typeof v === "object" && v !== null && !Array.isArray(v) && "dispatch.ready" in v,
  );
}

const q = (s: string) => JSON.stringify(s);
const literal = (kinds: string[], extra: Record<string, string> = {}) =>
  `{\n${[...kinds.map((k) => [k, OWNERS[k]] as const), ...Object.entries(extra)]
    .map(([k, v]) => `  ${q(k)}: ${q(v as string)},`)
    .join("\n")}\n}`;

const PRELUDE = `import type * as contract from ${q(ENTRY)};
import type { EventKind } from ${q(ENTRY)};

type Exports = typeof contract;
// The export whose type is keyed by an event kind: the kind-to-owner map.
type OwnerMapName = { [K in keyof Exports]: "dispatch.ready" extends keyof Exports[K] ? K : never }[keyof Exports];
type OwnerMap = Exports[OwnerMapName];
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
`;

type Compiled = { status: number | null; errors: string[] };

function compile(source: string): Compiled {
  const dir = mkdtempSync(join(tmpdir(), "avel-event-owners-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(dir, "fixture.ts"), source);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        extends: join(REPO_ROOT, "tsconfig.base.json"),
        compilerOptions: {
          noEmit: true,
          allowImportingTsExtensions: true,
          typeRoots: [join(REPO_ROOT, "node_modules", "@types")],
        },
        files: ["fixture.ts"],
      }),
    );
    const result = run(
      join(REPO_ROOT, "node_modules", ".bin", "tsc"),
      ["-p", join(dir, "tsconfig.json"), "--pretty", "false"],
      dir,
    );
    return {
      status: result.status,
      errors: result.output.split("\n").filter((l) => /error TS\d+/.test(l)),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("done-when 7: the event kinds and their owners (runtime)", () => {
  it("done-when 7: the contract exports one kind-to-owner map with exactly the 12 kinds of contract.md section 5", async () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const map = ownerMapOf(await loadContract());
    expect(
      map,
      "no exported kind-to-owner map (an object keyed by `dispatch.ready`)",
    ).toBeDefined();
    expect(Object.keys(map ?? {}).sort()).toEqual([...KINDS].sort());
  });

  it("done-when 7: each kind is owned by the module contract.md section 5 names", async () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const map = ownerMapOf(await loadContract());
    expect(
      map,
      "no exported kind-to-owner map (an object keyed by `dispatch.ready`)",
    ).toBeDefined();
    expect({ ...map }).toEqual(OWNERS);
  });
});

describe("done-when 7: a kind with no owner does not compile (type test)", () => {
  it("done-when 7: the owner map is exactly Record<EventKind, Module>: same keys as EventKind, no index signature", () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const result = compile(`${PRELUDE}
export const sameKeysAsEventKind: Equal<keyof OwnerMap, EventKind> = true;
export const noIndexSignature: string extends keyof OwnerMap ? false : true = true;
export const kindsAreIn: Equal<${KINDS.map(q).join(" | ")} extends EventKind ? true : false, true> = true;
`);
    expect(result.errors).toEqual([]);
    expect(result.status).toBe(0);
  });

  it("done-when 7: EXPECTED COMPILE ERROR, a map that leaves out one owner is refused (TS2741, names the kind)", () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const result = compile(`${PRELUDE}
// \`mission.closed\` has no owner here: this must not compile.
export const incomplete: OwnerMap = ${literal(KINDS.filter((k) => k !== "mission.closed"))};
`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("error TS2741");
    expect(result.errors[0]).toContain("mission.closed");
  });

  it("done-when 7: EXPECTED COMPILE ERROR, an owner for a kind that is not an EventKind is refused (TS2353)", () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const result = compile(`${PRELUDE}
// \`test.new_kind\` is not in EventKind yet: it cannot be given an owner by itself.
export const extra: OwnerMap = ${literal(KINDS, { "test.new_kind": "factory" })};
`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("error TS2353");
    expect(result.errors[0]).toContain("test.new_kind");
  });

  it("done-when 7: EXPECTED COMPILE ERROR, a new kind is not an EventKind until the contract adds it and its owner (TS2322)", () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const result = compile(`${PRELUDE}
export const unknownKind: EventKind = "test.new_kind";
`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("error TS2322");
  });
});
