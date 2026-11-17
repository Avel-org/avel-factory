import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENTRY, entryExists, loadContract, REPO_ROOT, run } from "./helpers/contract.ts";

// Done-when 7 (Step 0 and Step 1 plan), as CR-W1 and CR-W10 change it: every event kind is
// `<module>.<object>.<verb>` with a known prefix, has exactly one owning module and one payload
// schema, and the web's registry (`EventHandlers`) fails to compile when a kind has no handler.
// The type half compiles small fixture programs against the contract's real types with tsc.

const q = (s: string) => JSON.stringify(s);

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

type Mod = Record<string, unknown> & {
  EventKind: readonly string[];
  EventPrefix: readonly string[];
  Module: readonly string[];
  eventOwners: Record<string, string>;
  eventPayloads: Record<string, unknown>;
  EVENT_KIND_PATTERN: RegExp;
  DecisionOwner: readonly string[];
};

async function mod(): Promise<Mod> {
  expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
  return (await loadContract()) as unknown as Mod;
}

describe("done-when 7: the event catalog (runtime)", () => {
  it("CR-W10: every kind is <prefix>.<object>.<verb>, lowercase snake_case, with a known prefix", async () => {
    const m = await mod();
    const bad = m.EventKind.filter(
      (k) => !m.EVENT_KIND_PATTERN.test(k) || !m.EventPrefix.includes(k.split(".")[0] ?? ""),
    );
    expect(bad).toEqual([]);
    expect(new Set(m.EventKind).size).toBe(m.EventKind.length);
  });

  it("CR-W10: a module prefix is the module that writes it; missions is factory's and system is platform's", async () => {
    const m = await mod();
    const wrong = m.EventKind.filter((k) => {
      const prefix = k.split(".")[0] ?? "";
      const owner = m.eventOwners[k];
      if (prefix === "missions") return owner !== "factory";
      if (prefix === "system") return owner !== "platform";
      return owner !== prefix;
    });
    expect(wrong).toEqual([]);
  });

  it("done-when 7: the owner map and the payload map have exactly the kinds", async () => {
    const m = await mod();
    expect(Object.keys(m.eventOwners).sort()).toEqual([...m.EventKind].sort());
    expect(Object.keys(m.eventPayloads).sort()).toEqual([...m.EventKind].sort());
    for (const owner of Object.values(m.eventOwners)) expect(m.Module).toContain(owner);
  });

  it("CR-W10, CR-W15: each decision owner emits opened, resolved, expired and returned", async () => {
    const m = await mod();
    for (const owner of m.DecisionOwner)
      for (const verb of ["opened", "resolved", "expired", "returned"])
        expect(m.EventKind).toContain(`${owner}.decision.${verb}`);
  });

  it("CR-W1: no old entity name survives (nothing stored uses them)", async () => {
    const m = await mod();
    expect(m.EventKind.filter((k) => k.split(".").length !== 3)).toEqual([]);
  });
});

const PRELUDE = `import type { EventHandlers, EventKind, Module } from ${q(ENTRY)};
`;

describe("done-when 7 and CR-W1: kinds without an owner or a handler don't compile (type tests)", () => {
  it("the owner map is exactly Record<EventKind, Module>", () => {
    const result = compile(`import { eventOwners } from ${q(ENTRY)};
${PRELUDE}
const check: Record<EventKind, Module> = eventOwners;
type Keys = keyof typeof eventOwners;
const back: Keys[] = [] as EventKind[];
void check; void back;
`);
    expect(result.errors).toEqual([]);
    expect(result.status).toBe(0);
  });

  it("EXPECTED COMPILE ERROR: an owner map that leaves out a kind is refused (TS2741)", () => {
    const result = compile(`${PRELUDE}
import { eventOwners } from ${q(ENTRY)};
const { ["missions.mission.closed"]: _gone, ...rest } = eventOwners;
const map: Record<EventKind, Module> = rest;
void map;
`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("error TS2741");
    expect(result.errors[0]).toContain("missions.mission.closed");
  });

  it("EXPECTED COMPILE ERROR: a kind that isn't in the catalog isn't an EventKind (TS2322)", () => {
    const result = compile(`${PRELUDE}
const k: EventKind = "test.thing.happened";
void k;
`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("error TS2322");
  });

  it("EXPECTED COMPILE ERROR: the web's registry without a handler for one kind is refused (TS2741)", () => {
    const result = compile(`${PRELUDE}
import { EventKind as Kinds } from ${q(ENTRY)};
const all = Object.fromEntries(Kinds.map((k) => [k, () => {}])) as unknown as EventHandlers;
const { ["gate.receipt.issued"]: _gone, ...rest } = all;
const registry: EventHandlers = rest;
void registry;
`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("error TS2741");
    expect(result.errors[0]).toContain("gate.receipt.issued");
  });

  it("a handler gets its own kind's typed payload", () => {
    const result = compile(`${PRELUDE}
const handlers: Partial<EventHandlers<string>> = {
  "missions.mission.kind_set": (e) => e.payload.kind,
  "gate.receipt.issued": (e) => e.payload.verdict,
};
void handlers;
`);
    expect(result.errors).toEqual([]);
  });
});
