// What differs between the database map and the schema Step 0 builds, each change
// with its source. Built from contract.md section 6 ("Applied on top of the map" and
// "Every new or renamed object, by name"). Done-when 8 compares the live schema with the
// map and requires every difference to be one of these; done-when 2 takes its rules from
// the map with these applied.
import { type Col, canon, clone, type Fk, type Tbl, type Trg } from "./model.ts";

export type Change = {
  /** The difference this change makes, as done-when 8 reports it, for example `column+ missions.kind`. */
  keys: string[];
  cr: string;
  apply: (tables: Map<string, Tbl>) => void;
};

const tbl = (m: Map<string, Tbl>, name: string): Tbl => {
  const t = m.get(name);
  if (!t) throw new Error(`map has no table ${name}`);
  return t;
};
const col = (name: string, type: string, required: boolean, def: string | null = null): Col => ({
  name,
  type,
  required,
  default: def,
});

const addColumn = (table: string, c: Col, cr: string): Change => ({
  keys: [`column+ ${table}.${c.name}`],
  cr,
  apply: (m) => void tbl(m, table).columns.push(c),
});
const dropColumn = (table: string, name: string, cr: string): Change => ({
  keys: [`column- ${table}.${name}`],
  cr,
  apply: (m) => {
    const t = tbl(m, table);
    t.columns = t.columns.filter((c) => c.name !== name);
  },
});
const renameColumn = (table: string, from: string, to: string, cr: string): Change => ({
  keys: [`column- ${table}.${from}`, `column+ ${table}.${to}`],
  cr,
  apply: (m) => {
    const c = tbl(m, table).columns.find((x) => x.name === from);
    if (!c) throw new Error(`map has no column ${table}.${from}`);
    c.name = to;
  },
});
const need = <T>(x: T | undefined, what: string): T => {
  if (x === undefined) throw new Error(`map has no ${what}`);
  return x;
};
const addCheck = (table: string, name: string, expr: string, cr: string): Change => ({
  keys: [`check+ ${name}`],
  cr,
  apply: (m) => void tbl(m, table).checks.push({ name, def: expr, raw: true }),
});
const setCheck = (
  table: string,
  name: string,
  edit: (def: string) => string,
  cr: string,
): Change => ({
  keys: [`check~ ${name}`],
  cr,
  apply: (m) => {
    const c = tbl(m, table).checks.find((x) => x.name === name);
    if (!c) throw new Error(`map has no check ${name}`);
    c.def = edit(c.def);
    c.raw = true;
  },
});
const addUnique = (
  table: string,
  name: string,
  cols: string[],
  where: string | null,
  cr: string,
): Change => ({
  keys: [`unique+ ${name}`],
  cr,
  apply: (m) => void tbl(m, table).uniques.push({ name, cols, where, raw: where !== null }),
});
const addFk = (table: string, fk: Fk, cr: string): Change => ({
  keys: [`fk+ ${fk.name}`],
  cr,
  apply: (m) => void tbl(m, table).foreignKeys.push(fk),
});
const dropFk = (table: string, name: string, cr: string): Change => ({
  keys: [`fk- ${name}`],
  cr,
  apply: (m) => {
    const t = tbl(m, table);
    t.foreignKeys = t.foreignKeys.filter((f) => f.name !== name);
  },
});
const addIndex = (table: string, name: string, def: string, cr: string): Change => ({
  keys: [`index+ ${name}`],
  cr,
  apply: (m) => void tbl(m, table).indexes.push({ name, def }),
});
const dropIndex = (table: string, name: string, cr: string): Change => ({
  keys: [`index- ${name}`],
  cr,
  apply: (m) => {
    const t = tbl(m, table);
    t.indexes = t.indexes.filter((i) => i.name !== name);
  },
});
const addTrigger = (table: string, trg: Trg, cr: string): Change => ({
  keys: [`trigger+ ${trg.name}`],
  cr,
  apply: (m) => void tbl(m, table).triggers.push(trg),
});
const restrictFk = (name: string, cols: string[], parent: string, parentCols: string[]): Fk => ({
  name,
  cols,
  parent,
  parentCols,
  onDelete: "RESTRICT",
  deferred: false,
});

/** `... ARRAY['a'::text])` → `... ARRAY['a'::text, 'b'::text])`, for the first list in a def. */
export const withValues =
  (...values: string[]) =>
  (def: string): string => {
    const added = values.map((v) => `'${v}'::text`).join(", ");
    if (!/\]\)/.test(def)) throw new Error(`no value list in ${def}`);
    return def.replace("])", `, ${added}])`);
  };

const DISPATCH_ROLES = [
  "ui-contract",
  "review-frontend",
  "review-a11y-perf",
  "api-contract",
  "review-backend",
];
const CONTRACT_KINDS = ["ui_contract", "api_contract", "dispatch_docs"];

/** CR-6's mechanical renames on `jobs` and `consumer_cursors`. */
const claimWords = (def: string): string =>
  def
    .replaceAll("lease_epoch", "claim_no")
    .replaceAll("lease_until", "claim_expires_at")
    .replaceAll("'leased'", "'claimed'");

const designSystems: Tbl = {
  name: "design_systems",
  partitioned: false,
  columns: [
    col("slug", "text", true),
    col("version", "text", true),
    col("layer", "text", true),
    col("client_id", "uuid", false),
    col("path", "text", true),
    col("factory_commit", "text", true),
    col("status", "text", true, "'active'::text"),
    col("created_at", "timestamptz", true, "now()"),
    col("row_version", "integer", true, "1"),
    col("updated_at", "timestamptz", true, "now()"),
  ],
  primaryKey: ["slug", "version"],
  foreignKeys: [
    restrictFk("design_systems_client_id_clients_id_fk", ["client_id"], "clients", ["id"]),
    restrictFk(
      "design_systems_factory_commit_factory_versions_sha_fk",
      ["factory_commit"],
      "factory_versions",
      ["sha"],
    ),
  ],
  checks: [
    { name: "design_systems_layer_ck", def: "layer IN ('global', 'client')", raw: true },
    { name: "design_systems_status_ck", def: "status IN ('active', 'retired')", raw: true },
    {
      name: "design_systems_client_layer_ck",
      def: "(layer = 'client') = (client_id IS NOT NULL)",
      raw: true,
    },
  ],
  uniques: [],
  indexes: [
    { name: "design_systems_client_id_ix", def: "btree (client_id)" },
    { name: "design_systems_factory_commit_ix", def: "btree (factory_commit)" },
  ],
  triggers: [
    {
      name: "design_systems_touch_updated_at",
      def: "CREATE TRIGGER design_systems_touch_updated_at BEFORE UPDATE ON public.design_systems FOR EACH ROW EXECUTE FUNCTION touch_updated_at()",
    },
  ],
};

export const CHANGES: Change[] = [
  // CR-6
  renameColumn("jobs", "lease_epoch", "claim_no", "CR-6"),
  renameColumn("jobs", "lease_until", "claim_expires_at", "CR-6"),
  renameColumn("consumer_cursors", "lease_epoch", "claim_no", "CR-6"),
  setCheck("jobs", "jobs_state_ck", claimWords, "CR-6"),
  {
    keys: ["check- jobs_lease_ck", "check+ jobs_claim_ck"],
    cr: "CR-6 (the name is CR-6's)",
    apply: (m) => {
      const c = need(
        tbl(m, "jobs").checks.find((x) => x.name === "jobs_lease_ck"),
        "check jobs_lease_ck",
      );
      c.name = "jobs_claim_ck";
      c.def = claimWords(c.def);
    },
  },
  {
    keys: ["index- jobs_expired_leases_ix", "index+ jobs_expired_claims_ix"],
    cr: "CR-6 (the name is CR-6's)",
    apply: (m) => {
      const i = need(
        tbl(m, "jobs").indexes.find((x) => x.name === "jobs_expired_leases_ix"),
        "index jobs_expired_leases_ix",
      );
      i.name = "jobs_expired_claims_ix";
      i.def = claimWords(i.def);
    },
  },
  {
    keys: ["unique~ jobs_one_live_key_uq"],
    cr: "CR-6",
    apply: (m) => {
      const u = need(
        tbl(m, "jobs").uniques.find((x) => x.name === "jobs_one_live_key_uq"),
        "unique jobs_one_live_key_uq",
      );
      u.where = claimWords(need(u.where ?? undefined, "predicate on jobs_one_live_key_uq"));
      u.raw = true;
    },
  },
  // CR-7, CR-8, CR-9, CR-16: the lists
  setCheck(
    "plan_modules",
    "plan_modules_work_kind_ck",
    withValues("frontend-components", "frontend-data"),
    "CR-7",
  ),
  setCheck("dispatches", "dispatches_role_ck", withValues(...DISPATCH_ROLES), "CR-7, CR-8"),
  setCheck("eval_tasks", "eval_tasks_role_ck", withValues(...DISPATCH_ROLES), "CR-7, CR-8"),
  setCheck(
    "integration_commits",
    "integration_commits_kind_ck",
    withValues(...CONTRACT_KINDS),
    "CR-7, CR-8 (B3); CR-16",
  ),
  setCheck(
    "integration_commits",
    "integration_commits_by_kind_ck",
    (def) =>
      def.replace(
        "ELSE NULL::boolean",
        "WHEN 'ui_contract'::text THEN (module_run_id IS NOT NULL) " +
          "WHEN 'api_contract'::text THEN (module_run_id IS NOT NULL) " +
          "WHEN 'dispatch_docs'::text THEN ((module_run_id IS NULL) AND (attempt_id IS NULL) AND (dependency_request_id IS NULL)) " +
          "ELSE NULL::boolean",
      ),
    "INT finding 01; CR-16",
  ),
  setCheck("scenarios", "scenarios_level_ck", withValues("load"), "CR-9"),
  // CR-5
  addColumn("usage_log", col("vendor", "text", true), "CR-5"),
  // CR-13: clients
  addColumn("clients", col("kind", "text", true), "CR-13"),
  addCheck("clients", "clients_kind_ck", "kind IN ('client', 'internal')", "CR-13"),
  addUnique("clients", "clients_one_internal_uq", ["kind"], "(kind = 'internal'::text)", "CR-13"),
  addUnique(
    "clients",
    "clients_id_kind_uq",
    ["id", "kind"],
    null,
    "CR-13 (a composite FK needs it)",
  ),
  // CR-13: missions
  addColumn("missions", col("kind", "text", true), "CR-13"),
  addColumn("missions", col("client_kind", "text", true), "CR-13"),
  addCheck(
    "missions",
    "missions_kind_ck",
    "kind IN ('client', 'internal', 'template')",
    "CR-13 (B2)",
  ),
  addCheck("missions", "missions_client_kind_ck", "client_kind IN ('client', 'internal')", "CR-13"),
  addCheck(
    "missions",
    "missions_client_kind_match_ck",
    "(kind = 'client') = (client_kind = 'client')",
    "CR-13",
  ),
  addFk(
    "missions",
    restrictFk("missions_client_kind_fk", ["client_id", "client_kind"], "clients", ["id", "kind"]),
    "CR-13",
  ),
  addIndex("missions", "missions_client_kind_ix", "btree (client_id, client_kind)", "CR-13"),
  addTrigger(
    "missions",
    {
      name: "missions_frozen",
      def: "CREATE TRIGGER missions_frozen BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION freeze_after_set('onboarding_started_at', 'kind')",
    },
    "CR-13; INT finding 02",
  ),
  // CR-13: templates
  addColumn("templates", col("source_mission_id", "uuid", false), "CR-13"),
  addFk(
    "templates",
    restrictFk("templates_source_mission_id_missions_id_fk", ["source_mission_id"], "missions", [
      "id",
    ]),
    "CR-13",
  ),
  addIndex("templates", "templates_source_mission_id_ix", "btree (source_mission_id)", "CR-13"),
  // B9: the design library index and a mission's pin
  {
    keys: ["table+ design_systems"],
    cr: "B9 (INT)",
    apply: (m) => void m.set("design_systems", clone(designSystems)),
  },
  addColumn("missions", col("design_system_slug", "text", false), "B9 (INT)"),
  addColumn("missions", col("design_system_version", "text", false), "B9 (INT)"),
  addFk(
    "missions",
    restrictFk(
      "missions_design_system_fk",
      ["design_system_slug", "design_system_version"],
      "design_systems",
      ["slug", "version"],
    ),
    "B9",
  ),
  addCheck(
    "missions",
    "missions_design_system_pair_ck",
    "(design_system_slug IS NULL) = (design_system_version IS NULL)",
    "B9",
  ),
  addIndex(
    "missions",
    "missions_design_system_ix",
    "btree (design_system_slug, design_system_version)",
    "B9",
  ),
  // CR-18: no reps
  dropColumn("clients", "rep_id", "CR-18"),
  dropFk("clients", "clients_rep_id_users_id_fk", "CR-18"),
  dropIndex("clients", "clients_rep_id_ix", "CR-18"),
  dropColumn("missions", "rep_id", "CR-18"),
  dropColumn("missions", "rep_pct", "CR-18"),
  dropFk("missions", "missions_rep_id_users_id_fk", "CR-18"),
  dropIndex("missions", "missions_rep_id_ix", "CR-18"),
];

// consumer_cursors has no index or check on lease_epoch in the map; if one appears the build fails here.
export const FUNCTIONS = [
  "uuid_generate_v7",
  "touch_updated_at",
  "freeze_once_set",
  "refuse_update",
  "freeze_plan_detail",
  "freeze_plan",
  "freeze_after_set",
] as const;

/** The map with every change applied. Defs marked `raw` still need Postgres to write them in its own form. */
export function expectedSchema(map: Tbl[]): Tbl[] {
  const m = new Map(clone(map).map((t) => [t.name, t]));
  for (const change of CHANGES) change.apply(m);
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const declaredKeys = (): string[] => CHANGES.flatMap((c) => c.keys).sort();

export { canon };
