import { describe, expect, it } from "vitest";
import { MAP_VALUE_LISTS, type MapList } from "./fixtures/map-value-lists.ts";
import { entryExists, exportedLists, loadContract, sameValues } from "./helpers/contract.ts";

// Done-when 6 (Step 0 and Step 1 plan): the contract exports every value list the schema
// checks, defined once. contract.md section 3 and Appendix A are the source: the map's 99
// value-list CHECKs, section 3's changes on top, and five new lists (CR-13, B9).

const NEW_ROLES = [
  "ui-contract",
  "review-frontend",
  "review-a11y-perf",
  "api-contract",
  "review-backend",
];

/** Section 3, "Changes applied on top of the map". */
function applyChanges(list: MapList): MapList {
  const key = `${list.table}.${list.column}`;
  const values = [...list.values];
  switch (key) {
    case "dispatches.role":
    case "eval_tasks.role":
      values.push(...NEW_ROLES); // CR-7, CR-8
      break;
    case "plan_modules.work_kind":
      values.push("frontend-components", "frontend-data"); // CR-7
      break;
    case "scenarios.level":
      values.push("load"); // CR-9
      break;
    case "integration_commits.kind":
      values.push("ui_contract", "api_contract", "dispatch_docs"); // CR-7, CR-8 (B3), CR-16
      break;
    case "jobs.state":
      values[values.indexOf("leased")] = "claimed"; // CR-6
      break;
  }
  return { ...list, values };
}

const NEW_LISTS: readonly MapList[] = [
  {
    table: "clients",
    column: "kind",
    optional: false,
    check: "clients_kind_ck",
    values: ["client", "internal"],
  },
  {
    table: "missions",
    column: "kind",
    optional: false,
    check: "missions_kind_ck",
    values: ["client", "internal", "template"],
  },
  {
    table: "missions",
    column: "client_kind",
    optional: false,
    check: "missions_client_kind_ck",
    values: ["client", "internal"],
  },
  {
    table: "design_systems",
    column: "layer",
    optional: false,
    check: "design_systems_layer_ck",
    values: ["global", "client"],
  },
  {
    table: "design_systems",
    column: "status",
    optional: false,
    check: "design_systems_status_ck",
    values: ["active", "retired"],
  },
];

const EXPECTED: readonly MapList[] = [...MAP_VALUE_LISTS.map(applyChanges), ...NEW_LISTS];

const valuesOf = (table: string, column: string): readonly string[] => {
  const hit = EXPECTED.find((l) => l.table === table && l.column === column);
  if (!hit) throw new Error(`no expected list for ${table}.${column}`);
  return hit.values;
};

/** Section 3's table of shared names, and the two examples it gives for the rest. */
const NAMED: ReadonlyArray<readonly [name: string, table: string, column: string]> = [
  ["MissionState", "missions", "state"],
  ["DispatchState", "dispatches", "state"],
  ["ModuleRunState", "module_runs", "state"],
  ["DispatchRole", "dispatches", "role"],
  ["Package", "onboarding_sessions", "package_provisional"],
  ["Topic", "topic_coverage", "topic"],
  ["FactKind", "facts", "kind"],
  ["Stage", "onboarding_sessions", "stage"],
  ["Checkpoint", "checkpoints", "checkpoint"],
  ["WorkKind", "plan_modules", "work_kind"],
  ["EarsPattern", "requirements", "ears_pattern"],
  ["Level", "scenarios", "level"],
  ["EvalSet", "eval_runs", "set"],
  ["LibraryLayer", "kb_entries", "layer"],
  ["IndexStatus", "packages", "status"],
  ["ArchiveStatus", "clients", "status"],
  ["ClientKind", "clients", "kind"],
  ["ProjectKind", "missions", "kind"],
  ["DesignSystemLayer", "design_systems", "layer"],
  ["AttemptOutcome", "attempts", "outcome"],
  ["FindingState", "findings", "state"],
];

async function lists(): Promise<Map<string, readonly string[]>> {
  expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
  const found = exportedLists(await loadContract());
  expect(found.size, "the contract exports no value lists").toBeGreaterThan(0);
  return found;
}

describe("done-when 6: the expected lists (the map plus section 3's changes)", () => {
  it("done-when 6: pins existing behaviour (passes): the map has 99 value-list CHECKs and five lists are new, 104 in all", () => {
    expect(MAP_VALUE_LISTS).toHaveLength(99);
    expect(NEW_LISTS).toHaveLength(5);
    expect(EXPECTED).toHaveLength(104);
  });
});

describe("done-when 6: the contract exports every list the schema checks", () => {
  it("done-when 6: each of the 104 CHECKed columns has an exported list with exactly its values", async () => {
    const exported = [...(await lists()).values()];
    const missing = EXPECTED.filter((l) => !exported.some((v) => sameValues(v, l.values))).map(
      (l) => `${l.table}.${l.column} (${l.check}): ${l.values.join(", ")}`,
    );
    expect(missing, "columns with no exported list of their values").toEqual([]);
  });

  it.each(NAMED)(
    "done-when 6: the list %s (%s.%s) is exported under that name",
    async (name, table, column) => {
      const found = await lists();
      const list = found.get(name);
      expect(list, `no exported list named ${name}`).toBeDefined();
      expect([...(list ?? [])].sort()).toEqual([...valuesOf(table, column)].sort());
    },
  );

  it("done-when 6: DispatchState backs parked_from too, so it holds `parked` (the CHECK refuses it, D8)", async () => {
    const list = (await lists()).get("DispatchState");
    expect(list, "no exported list named DispatchState").toBeDefined();
    expect(list).toContain("parked");
    expect(sameValues(list ?? [], valuesOf("dispatches", "parked_from"))).toBe(true);
  });

  it("done-when 6: FactKind is Topic plus Canon's eleven other kinds", async () => {
    const found = await lists();
    const topic = found.get("Topic") ?? [];
    const factKind = found.get("FactKind") ?? [];
    expect(topic).toHaveLength(10);
    const extra = [
      "nogo",
      "risk",
      "module",
      "requirement",
      "scenario",
      "work_kind",
      "package",
      "territory",
      "constraint",
      "context_ref",
      "trace",
    ];
    expect([...factKind].sort()).toEqual([...topic, ...extra].sort());
  });
});

describe("done-when 6: section 3's changes are applied", () => {
  it("done-when 6: DispatchRole, WorkKind, Level and the integration commit kinds carry the added values", async () => {
    const found = await lists();
    const commitKinds = [...found.values()].find((v) =>
      sameValues(v, valuesOf("integration_commits", "kind")),
    );
    expect(commitKinds, "no exported list of the integration commit kinds").toBeDefined();
    expect(found.get("DispatchRole")).toEqual(expect.arrayContaining(NEW_ROLES));
    expect(found.get("WorkKind")).toEqual(
      expect.arrayContaining(["frontend-components", "frontend-data"]),
    );
    expect(found.get("Level")).toContain("load");
    expect(commitKinds).toEqual(
      expect.arrayContaining(["ui_contract", "api_contract", "dispatch_docs"]),
    );
  });

  it("done-when 6: the job states say `claimed`, and no exported list says `leased` (CR-6)", async () => {
    const found = await lists();
    const jobStates = [...found.values()].find((v) => sameValues(v, valuesOf("jobs", "state")));
    expect(jobStates, "no exported list of the job states").toBeDefined();
    expect(jobStates).toContain("claimed");
    const withLeased = [...found].filter(([, v]) => v.includes("leased")).map(([n]) => n);
    expect(withLeased).toEqual([]);
  });
});

describe("done-when 6: every list is defined once (D18)", () => {
  it("done-when 6: no list holds a value twice, and none is empty", async () => {
    const found = await lists();
    const bad = [...found].filter(([, v]) => new Set(v).size !== v.length).map(([n]) => n);
    expect(bad).toEqual([]);
  });

  it("done-when 6: no two exported lists have the same values", async () => {
    const found = await lists();
    const byReference = new Map<readonly string[], string>();
    for (const [name, list] of found) if (!byReference.has(list)) byReference.set(list, name);
    const entries = [...byReference];
    const repeats: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [a, nameA] = entries[i] as [readonly string[], string];
        const [b, nameB] = entries[j] as [readonly string[], string];
        if (sameValues(a, b)) repeats.push(`${nameA} = ${nameB}`);
      }
    }
    expect(repeats).toEqual([]);
  });
});
