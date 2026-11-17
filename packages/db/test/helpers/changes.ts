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

// Contract 1.0.0 (Contract response to CR-W1 to W22): a change to an object the map or an
// earlier change made. `key` is the difference it makes against the map: `column~` or `check~`
// for the map's own, or the earlier change's `column+`/`check+`/`trigger+` when it amends one.
const setColumn = (table: string, c: Col, key: string, cr: string): Change => ({
  keys: [key],
  cr,
  apply: (m) => {
    const t = tbl(m, table);
    const at = t.columns.findIndex((x) => x.name === c.name);
    if (at < 0) throw new Error(`no column ${table}.${c.name}`);
    t.columns[at] = c;
  },
});
const replaceCheck = (
  table: string,
  name: string,
  def: string,
  key: string,
  cr: string,
): Change => ({
  keys: [key],
  cr,
  apply: (m) => {
    const c = tbl(m, table).checks.find((x) => x.name === name);
    if (!c) throw new Error(`no check ${name}`);
    c.def = def;
    c.raw = true;
  },
});
const setTrigger = (table: string, trg: Trg, key: string, cr: string): Change => ({
  keys: [key],
  cr,
  apply: (m) => {
    const t = tbl(m, table);
    t.triggers = [...t.triggers.filter((x) => x.name !== trg.name), trg];
  },
});

// The web's CRs' new tables (contract 1.0.0), as Postgres writes them.
const followups: Tbl = {
  name: "followups",
  partitioned: false,
  columns: [
    {
      name: "id",
      type: "uuid",
      required: true,
      default: "uuid_generate_v7()",
    },
    {
      name: "client_id",
      type: "uuid",
      required: true,
      default: null,
    },
    {
      name: "mission_id",
      type: "uuid",
      required: false,
      default: null,
    },
    {
      name: "kind",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "subject_id",
      type: "uuid",
      required: false,
      default: null,
    },
    {
      name: "draft",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "draft_hash",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "channel",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "state",
      type: "text",
      required: true,
      default: "'drafted'::text",
    },
    {
      name: "sent_at",
      type: "timestamptz",
      required: false,
      default: null,
    },
    {
      name: "sent_by",
      type: "text",
      required: false,
      default: null,
    },
    {
      name: "created_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
    {
      name: "row_version",
      type: "integer",
      required: true,
      default: "1",
    },
    {
      name: "updated_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
  ],
  primaryKey: ["id"],
  foreignKeys: [
    {
      name: "followups_client_id_clients_id_fk",
      cols: ["client_id"],
      parent: "clients",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    {
      name: "followups_mission_id_missions_id_fk",
      cols: ["mission_id"],
      parent: "missions",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
  ],
  checks: [
    {
      name: "followups_channel_ck",
      def: "((channel = ANY (ARRAY['email'::text, 'copy'::text])))",
    },
    {
      name: "followups_kind_ck",
      def: "((kind = ANY (ARRAY['followup'::text, 'upkeep'::text, 'intake_reply'::text])))",
    },
    {
      name: "followups_sent_by_ck",
      def: "(((sent_by IS NULL) OR (sent_by = ANY (ARRAY['factory'::text, 'you'::text]))))",
    },
    {
      name: "followups_sent_ck",
      def: "((((state = 'sent'::text) = (sent_at IS NOT NULL)) AND ((sent_at IS NULL) = (sent_by IS NULL)) AND ((channel <> 'copy'::text) OR (sent_by IS NULL) OR (sent_by = 'you'::text))))",
    },
    {
      name: "followups_state_ck",
      def: "((state = ANY (ARRAY['drafted'::text, 'sent'::text, 'skipped'::text])))",
    },
  ],
  uniques: [],
  indexes: [
    {
      name: "followups_client_id_ix",
      def: "btree (client_id)",
    },
    {
      name: "followups_drafted_ix",
      def: "btree (client_id) WHERE (state = 'drafted'::text)",
    },
    {
      name: "followups_mission_id_ix",
      def: "btree (mission_id)",
    },
  ],
  triggers: [
    {
      name: "followups_touch_updated_at",
      def: "CREATE TRIGGER followups_touch_updated_at BEFORE UPDATE ON public.followups FOR EACH ROW EXECUTE FUNCTION touch_updated_at()",
    },
  ],
};

const leads: Tbl = {
  name: "leads",
  partitioned: false,
  columns: [
    {
      name: "id",
      type: "uuid",
      required: true,
      default: "uuid_generate_v7()",
    },
    {
      name: "client_id",
      type: "uuid",
      required: true,
      default: null,
    },
    {
      name: "source",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "referrer_id",
      type: "uuid",
      required: false,
      default: null,
    },
    {
      name: "referrer_name",
      type: "text",
      required: false,
      default: null,
    },
    {
      name: "first_contact_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
    {
      name: "notes",
      type: "text",
      required: false,
      default: null,
    },
    {
      name: "lost_reason",
      type: "text",
      required: false,
      default: null,
    },
    {
      name: "lost_at",
      type: "timestamptz",
      required: false,
      default: null,
    },
    {
      name: "created_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
    {
      name: "row_version",
      type: "integer",
      required: true,
      default: "1",
    },
    {
      name: "updated_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
  ],
  primaryKey: ["id"],
  foreignKeys: [
    {
      name: "leads_client_id_clients_id_fk",
      cols: ["client_id"],
      parent: "clients",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    {
      name: "leads_referrer_id_users_id_fk",
      cols: ["referrer_id"],
      parent: "users",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
  ],
  checks: [
    {
      name: "leads_lost_ck",
      def: "(((lost_reason IS NULL) = (lost_at IS NULL)))",
    },
    {
      name: "leads_lost_reason_ck",
      def: "(((lost_reason IS NULL) OR (lost_reason = ANY (ARRAY['timing'::text, 'scope'::text, 'went_elsewhere'::text, 'no_reply'::text, 'other'::text]))))",
    },
    {
      name: "leads_source_ck",
      def: "((source = ANY (ARRAY['referral'::text, 'intake'::text, 'past_client'::text, 'partner'::text, 'direct'::text, 'other'::text])))",
    },
  ],
  uniques: [
    {
      name: "leads_client_id_uq",
      cols: ["client_id"],
      where: null,
    },
  ],
  indexes: [
    {
      name: "leads_referrer_id_ix",
      def: "btree (referrer_id)",
    },
  ],
  triggers: [
    {
      name: "leads_touch_updated_at",
      def: "CREATE TRIGGER leads_touch_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION touch_updated_at()",
    },
  ],
};

const receiptArtifacts: Tbl = {
  name: "receipt_artifacts",
  partitioned: false,
  columns: [
    {
      name: "receipt_id",
      type: "uuid",
      required: true,
      default: null,
    },
    {
      name: "key",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "ordinal",
      type: "integer",
      required: true,
      default: null,
    },
    {
      name: "label",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "file",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "lang",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "proves",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "sha256",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "bytes",
      type: "bigint",
      required: true,
      default: null,
    },
    {
      name: "created_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
  ],
  primaryKey: ["receipt_id", "key"],
  foreignKeys: [
    {
      name: "receipt_artifacts_receipt_id_receipts_id_fk",
      cols: ["receipt_id"],
      parent: "receipts",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
  ],
  checks: [
    {
      name: "receipt_artifacts_amounts_ck",
      def: "(((ordinal >= 0) AND (bytes >= 0)))",
    },
    {
      name: "receipt_artifacts_key_ck",
      def: "((key = ANY (ARRAY['tests'::text, 'acceptance'::text, 'build'::text, 'diff'::text, 'sbom'::text, 'screens'::text])))",
    },
  ],
  uniques: [
    {
      name: "receipt_artifacts_receipt_id_ordinal_uq",
      cols: ["receipt_id", "ordinal"],
      where: null,
    },
  ],
  indexes: [],
  triggers: [
    {
      name: "receipt_artifacts_immutable",
      def: "CREATE TRIGGER receipt_artifacts_immutable BEFORE UPDATE ON public.receipt_artifacts FOR EACH ROW EXECUTE FUNCTION refuse_update()",
    },
  ],
};

const templateDrafts: Tbl = {
  name: "template_drafts",
  partitioned: false,
  columns: [
    {
      name: "id",
      type: "uuid",
      required: true,
      default: null,
    },
    {
      name: "source_mission_id",
      type: "uuid",
      required: false,
      default: null,
    },
    {
      name: "slug",
      type: "text",
      required: false,
      default: null,
    },
    {
      name: "name",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "pitch",
      type: "text",
      required: true,
      default: null,
    },
    {
      name: "best_for",
      type: "text",
      required: false,
      default: null,
    },
    {
      name: "docs",
      type: "jsonb",
      required: true,
      default: "'{}'::jsonb",
    },
    {
      name: "modules",
      type: "text[]",
      required: true,
      default: "'{}'::text[]",
    },
    {
      name: "state",
      type: "text",
      required: true,
      default: "'draft'::text",
    },
    {
      name: "pr_number",
      type: "integer",
      required: false,
      default: null,
    },
    {
      name: "created_by",
      type: "uuid",
      required: true,
      default: null,
    },
    {
      name: "created_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
    {
      name: "row_version",
      type: "integer",
      required: true,
      default: "1",
    },
    {
      name: "updated_at",
      type: "timestamptz",
      required: true,
      default: "now()",
    },
  ],
  primaryKey: ["id"],
  foreignKeys: [
    {
      name: "template_drafts_created_by_users_id_fk",
      cols: ["created_by"],
      parent: "users",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    {
      name: "template_drafts_source_mission_id_missions_id_fk",
      cols: ["source_mission_id"],
      parent: "missions",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
  ],
  checks: [
    {
      name: "template_drafts_pr_ck",
      def: "(((state = 'draft'::text) OR (pr_number IS NOT NULL)))",
    },
    {
      name: "template_drafts_state_ck",
      def: "((state = ANY (ARRAY['draft'::text, 'pr_open'::text, 'merged'::text, 'closed'::text])))",
    },
  ],
  uniques: [],
  indexes: [
    {
      name: "template_drafts_created_by_ix",
      def: "btree (created_by)",
    },
    {
      name: "template_drafts_source_mission_id_ix",
      def: "btree (source_mission_id)",
    },
  ],
  triggers: [
    {
      name: "template_drafts_touch_updated_at",
      def: "CREATE TRIGGER template_drafts_touch_updated_at BEFORE UPDATE ON public.template_drafts FOR EACH ROW EXECUTE FUNCTION touch_updated_at()",
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
  // Contract 1.0.0: the web's CRs (Contract response to CR-W1 to W22)
  addCheck(
    "budget_reservations",
    "budget_reservations_scope_ck",
    "((scope = ANY (ARRAY['mission'::text, 'eval'::text])))",
    "CR-W16",
  ),
  addCheck(
    "budget_reservations",
    "budget_reservations_scope_owner_ck",
    "((((scope = 'mission'::text) = (mission_id IS NOT NULL)) AND ((scope = 'eval'::text) = (eval_run_id IS NOT NULL))))",
    "CR-W16",
  ),
  addCheck(
    "deliveries",
    "deliveries_pr_fields_ck",
    "((((pr_number IS NULL) OR (kind = 'pr'::text)) AND ((merged_at IS NULL) OR (pr_number IS NOT NULL))))",
    "CR-W18 section 8",
  ),
  addCheck(
    "messages",
    "messages_checkpoint_ck",
    "(((checkpoint IS NULL) OR (checkpoint = ANY (ARRAY['0.1'::text, '0.2'::text, '0.3'::text, '0.4'::text, '0.1+0.2'::text]))))",
    "CR-W19",
  ),
  addCheck(
    "messages",
    "messages_operator_source_ck",
    "(((role = 'operator'::text) = (source IS NOT NULL)))",
    "CR-W19",
  ),
  addCheck(
    "messages",
    "messages_relayed_by_ck",
    "(((relayed_by IS NULL) OR (source = 'relayed'::text)))",
    "CR-W19",
  ),
  addCheck(
    "messages",
    "messages_source_ck",
    "(((source IS NULL) OR (source = ANY (ARRAY['said'::text, 'relayed'::text]))))",
    "CR-W19",
  ),
  addCheck(
    "messages",
    "messages_status_ck",
    "((status = ANY (ARRAY['streaming'::text, 'done'::text, 'stopped'::text, 'failed'::text])))",
    "CR-W19",
  ),
  addCheck(
    "messages",
    "messages_streaming_ck",
    "(((status <> 'streaming'::text) OR (role = 'canon'::text)))",
    "CR-W19",
  ),
  addCheck(
    "messages",
    "messages_timing_ck",
    "((((ttft_ms IS NULL) OR (ttft_ms >= 0)) AND ((total_ms IS NULL) OR (total_ms >= 0))))",
    "CR-W19",
  ),
  addCheck(
    "mission_docs",
    "mission_docs_commit_state_ck",
    "((commit_state = ANY (ARRAY['awaiting_confirmation'::text, 'committing'::text, 'committed'::text, 'failed'::text])))",
    "CR-W11",
  ),
  addCheck(
    "mission_docs",
    "mission_docs_committed_ck",
    "(((commit_state = 'committed'::text) = (commit_sha IS NOT NULL)))",
    "CR-W11",
  ),
  addCheck(
    "mission_docs",
    "mission_docs_confirmed_ck",
    "((((confirmed_at IS NULL) = (confirmed_by IS NULL)) AND ((confirmed_at IS NULL) = (confirmed_hash IS NULL)) AND ((commit_state = 'awaiting_confirmation'::text) OR (confirmed_at IS NOT NULL))))",
    "CR-W11",
  ),
  addCheck(
    "missions",
    "missions_kind_client_ck",
    "((((kind IS NULL) = (client_id IS NULL)) AND ((client_id IS NULL) = (client_kind IS NULL))))",
    "CR-W22",
  ),
  addCheck(
    "missions",
    "missions_kind_set_ck",
    "(((state = ANY (ARRAY['draft'::text, 'onboarding'::text, 'cancelled'::text])) OR (kind IS NOT NULL)))",
    "CR-W22",
  ),
  addCheck("missions", "missions_name_ck", "((name <> ''::text))", "CR-W22"),
  addCheck(
    "missions",
    "missions_template_slug_ck",
    "(((template_slug IS NULL) OR (kind = 'template'::text)))",
    "CR-W22",
  ),
  addCheck(
    "proposals",
    "proposals_superseded_ck",
    "((((state = 'superseded'::text) = (superseded_by IS NOT NULL)) AND ((superseded_by IS NULL) OR (superseded_by <> id))))",
    "CR-W15",
  ),
  addCheck(
    "questions",
    "questions_after_ck",
    "((((after_question_id IS NULL) = (after_choice IS NULL)) AND ((after_question_id IS NULL) OR (after_question_id <> id))))",
    "CR-W19 section 8; CR-W22",
  ),
  addCheck(
    "questions",
    "questions_answer_source_ck",
    "(((answer_source IS NULL) OR (answer_source = ANY (ARRAY['option'::text, 'own_words'::text]))))",
    "CR-W19 section 8; CR-W22",
  ),
  addCheck(
    "questions",
    "questions_answer_source_set_ck",
    "(((answer IS NULL) = (answer_source IS NULL)))",
    "CR-W19 section 8; CR-W22",
  ),
  addCheck(
    "questions",
    "questions_subject_checkpoint_ck",
    "(((subject_checkpoint IS NULL) OR (subject_checkpoint = ANY (ARRAY['0.1'::text, '0.2'::text, '0.3'::text, '0.4'::text, '0.1+0.2'::text]))))",
    "CR-W19 section 8; CR-W22",
  ),
  addCheck(
    "repo_connections",
    "repo_connections_main_head_ck",
    "(((main_head IS NULL) = (main_head_at IS NULL)))",
    "CR-W18 section 10",
  ),
  addCheck(
    "skills",
    "skills_import_license_ck",
    "(((source <> 'import'::text) OR (license IS NOT NULL)))",
    "CR-W16",
  ),
  replaceCheck(
    "budget_reservations",
    "budget_reservations_expected_ck",
    "(((kind <> 'expected'::text) OR ((num_nonnulls(dispatch_id, session_id, eval_run_id) = 1) AND (attempt_id IS NULL) AND (request_id IS NULL))))",
    "check~ budget_reservations_expected_ck",
    "CR-W16",
  ),
  replaceCheck(
    "budget_reservations",
    "budget_reservations_request_ck",
    "(((kind <> 'request'::text) OR ((num_nonnulls(attempt_id, session_id, eval_run_id) = 1) AND (request_id IS NOT NULL))))",
    "check~ budget_reservations_request_ck",
    "CR-W16",
  ),
  replaceCheck(
    "clients",
    "clients_status_ck",
    "((status = ANY (ARRAY['active'::text, 'archived'::text, 'lead'::text, 'lost'::text])))",
    "check~ clients_status_ck",
    "CR-W17",
  ),
  replaceCheck(
    "human_time",
    "human_time_activity_ck",
    "((activity = ANY (ARRAY['onboarding'::text, 'approval'::text, 'review'::text, 'fix'::text, 'call'::text, 'override'::text, 'sales'::text])))",
    "check~ human_time_activity_ck",
    "CR-W17",
  ),
  replaceCheck(
    "missions",
    "missions_client_kind_ck",
    "(((client_kind IS NULL) OR (client_kind = ANY (ARRAY['client'::text, 'internal'::text]))))",
    "check+ missions_client_kind_ck",
    "CR-W22",
  ),
  replaceCheck(
    "missions",
    "missions_kind_ck",
    "(((kind IS NULL) OR (kind = ANY (ARRAY['client'::text, 'internal'::text, 'template'::text]))))",
    "check+ missions_kind_ck",
    "CR-W22",
  ),
  replaceCheck(
    "proposals",
    "proposals_resolved_ck",
    "(((state = ANY (ARRAY['resolved'::text, 'superseded'::text])) = ((choice IS NOT NULL) AND (choice_reason IS NOT NULL) AND (resolved_by IS NOT NULL) AND (resolved_at IS NOT NULL))))",
    "check~ proposals_resolved_ck",
    "CR-W15",
  ),
  replaceCheck(
    "proposals",
    "proposals_state_ck",
    "((state = ANY (ARRAY['open'::text, 'resolved'::text, 'expired'::text, 'superseded'::text])))",
    "check~ proposals_state_ck",
    "CR-W15",
  ),
  addColumn(
    "attempts",
    { name: "activation_sha256", type: "text", required: true, default: null },
    "CR-W11",
  ),
  addColumn(
    "attempts",
    { name: "task_doc_sha256", type: "text", required: true, default: null },
    "CR-W11",
  ),
  addColumn(
    "budget_reservations",
    { name: "eval_run_id", type: "uuid", required: false, default: null },
    "CR-W16",
  ),
  addColumn(
    "budget_reservations",
    { name: "scope", type: "text", required: true, default: "'mission'::text" },
    "CR-W16",
  ),
  addColumn(
    "clients",
    { name: "proof_consent_at", type: "timestamptz", required: false, default: null },
    "CR-W17",
  ),
  addColumn(
    "deliveries",
    { name: "merged_at", type: "timestamptz", required: false, default: null },
    "CR-W18 section 8",
  ),
  addColumn(
    "deliveries",
    { name: "pr_number", type: "integer", required: false, default: null },
    "CR-W18 section 8",
  ),
  addColumn(
    "messages",
    { name: "answers_question_id", type: "uuid", required: false, default: null },
    "CR-W19",
  ),
  addColumn(
    "messages",
    { name: "checkpoint", type: "text", required: false, default: null },
    "CR-W19",
  ),
  addColumn(
    "messages",
    { name: "client_message_id", type: "uuid", required: false, default: null },
    "CR-W19",
  ),
  addColumn(
    "messages",
    { name: "question_id", type: "uuid", required: false, default: null },
    "CR-W19",
  ),
  addColumn(
    "messages",
    { name: "relayed_by", type: "text", required: false, default: null },
    "CR-W19",
  ),
  addColumn("messages", { name: "source", type: "text", required: false, default: null }, "CR-W19"),
  addColumn(
    "messages",
    { name: "status", type: "text", required: true, default: "'done'::text" },
    "CR-W19",
  ),
  addColumn(
    "messages",
    { name: "total_ms", type: "integer", required: false, default: null },
    "CR-W19",
  ),
  addColumn(
    "messages",
    { name: "ttft_ms", type: "integer", required: false, default: null },
    "CR-W19",
  ),
  addColumn(
    "mission_docs",
    { name: "commit_sha", type: "text", required: false, default: null },
    "CR-W11",
  ),
  addColumn(
    "mission_docs",
    {
      name: "commit_state",
      type: "text",
      required: true,
      default: "'awaiting_confirmation'::text",
    },
    "CR-W11",
  ),
  addColumn(
    "mission_docs",
    { name: "confirmed_at", type: "timestamptz", required: false, default: null },
    "CR-W11",
  ),
  addColumn(
    "mission_docs",
    { name: "confirmed_by", type: "uuid", required: false, default: null },
    "CR-W11",
  ),
  addColumn(
    "mission_docs",
    { name: "confirmed_hash", type: "text", required: false, default: null },
    "CR-W11",
  ),
  addColumn(
    "missions",
    { name: "follows_delivery_id", type: "uuid", required: false, default: null },
    "CR-W17",
  ),
  addColumn(
    "missions",
    { name: "lead_id", type: "uuid", required: false, default: null },
    "CR-W17",
  ),
  addColumn("missions", { name: "name", type: "text", required: true, default: null }, "CR-W22"),
  addColumn(
    "missions",
    { name: "template_slug", type: "text", required: false, default: null },
    "CR-W22",
  ),
  addColumn(
    "proposals",
    { name: "superseded_by", type: "uuid", required: false, default: null },
    "CR-W15",
  ),
  addColumn(
    "questions",
    { name: "after_choice", type: "text", required: false, default: null },
    "CR-W19 section 8; CR-W22",
  ),
  addColumn(
    "questions",
    { name: "after_question_id", type: "uuid", required: false, default: null },
    "CR-W19 section 8; CR-W22",
  ),
  addColumn(
    "questions",
    { name: "answer_source", type: "text", required: false, default: null },
    "CR-W19 section 8; CR-W22",
  ),
  addColumn(
    "questions",
    { name: "code", type: "text", required: false, default: null },
    "CR-W22 (conflict 7)",
  ),
  addColumn(
    "questions",
    { name: "subject_checkpoint", type: "text", required: false, default: null },
    "CR-W19 section 8; CR-W22",
  ),
  addColumn(
    "questions",
    { name: "subject_risk", type: "text", required: false, default: null },
    "CR-W19 section 8; CR-W22",
  ),
  addColumn(
    "questions",
    { name: "why", type: "text", required: false, default: null },
    "CR-W19 section 8; CR-W22",
  ),
  addColumn(
    "receipts",
    { name: "signature", type: "text", required: true, default: null },
    "CR-W21 section 1",
  ),
  addColumn(
    "receipts",
    { name: "signature_key", type: "text", required: true, default: null },
    "CR-W21 section 1",
  ),
  addColumn(
    "repo_connections",
    { name: "main_head", type: "text", required: false, default: null },
    "CR-W18 section 10",
  ),
  addColumn(
    "repo_connections",
    { name: "main_head_at", type: "timestamptz", required: false, default: null },
    "CR-W18 section 10",
  ),
  addColumn(
    "skills",
    { name: "edition_note", type: "text", required: false, default: null },
    "CR-W16",
  ),
  addColumn("skills", { name: "license", type: "text", required: false, default: null }, "CR-W16"),
  addColumn(
    "skills",
    { name: "upstream_ref", type: "text", required: false, default: null },
    "CR-W16",
  ),
  setColumn(
    "budget_reservations",
    { name: "mission_id", type: "uuid", required: false, default: null },
    "column~ budget_reservations.mission_id",
    "CR-W16",
  ),
  setColumn(
    "missions",
    { name: "client_id", type: "uuid", required: false, default: null },
    "column~ missions.client_id",
    "CR-W22",
  ),
  setColumn(
    "missions",
    { name: "client_kind", type: "text", required: false, default: null },
    "column+ missions.client_kind",
    "CR-W22",
  ),
  setColumn(
    "missions",
    { name: "kind", type: "text", required: false, default: null },
    "column+ missions.kind",
    "CR-W22",
  ),
  addFk(
    "budget_reservations",
    {
      name: "budget_reservations_eval_run_id_eval_runs_id_fk",
      cols: ["eval_run_id"],
      parent: "eval_runs",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W16",
  ),
  addFk(
    "messages",
    {
      name: "messages_answers_question_id_questions_id_fk",
      cols: ["answers_question_id"],
      parent: "questions",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W19",
  ),
  addFk(
    "messages",
    {
      name: "messages_question_id_questions_id_fk",
      cols: ["question_id"],
      parent: "questions",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W19",
  ),
  addFk(
    "mission_docs",
    {
      name: "mission_docs_confirmed_by_users_id_fk",
      cols: ["confirmed_by"],
      parent: "users",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W11",
  ),
  addFk(
    "missions",
    {
      name: "missions_follows_delivery_id_deliveries_id_fk",
      cols: ["follows_delivery_id"],
      parent: "deliveries",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W17",
  ),
  addFk(
    "missions",
    {
      name: "missions_lead_id_leads_id_fk",
      cols: ["lead_id"],
      parent: "leads",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W17",
  ),
  addFk(
    "proposals",
    {
      name: "proposals_superseded_by_proposals_id_fk",
      cols: ["superseded_by"],
      parent: "proposals",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W15",
  ),
  addFk(
    "questions",
    {
      name: "questions_after_question_id_questions_id_fk",
      cols: ["after_question_id"],
      parent: "questions",
      parentCols: ["id"],
      onDelete: "RESTRICT",
      deferred: false,
    },
    "CR-W19 section 8; CR-W22",
  ),
  addIndex(
    "budget_reservations",
    "budget_reservations_eval_run_id_ix",
    "btree (eval_run_id)",
    "CR-W16",
  ),
  addIndex("messages", "messages_answers_question_id_ix", "btree (answers_question_id)", "CR-W19"),
  addIndex("messages", "messages_question_id_ix", "btree (question_id)", "CR-W19"),
  addIndex("mission_docs", "mission_docs_confirmed_by_ix", "btree (confirmed_by)", "CR-W11"),
  addIndex("missions", "missions_follows_delivery_id_ix", "btree (follows_delivery_id)", "CR-W17"),
  addIndex("missions", "missions_lead_id_ix", "btree (lead_id)", "CR-W17"),
  addIndex("proposals", "proposals_superseded_by_ix", "btree (superseded_by)", "CR-W15"),
  addIndex(
    "questions",
    "questions_after_question_id_ix",
    "btree (after_question_id)",
    "CR-W19 section 8; CR-W22",
  ),
  {
    keys: ["table+ followups"],
    cr: "CR-W17",
    apply: (m) => void m.set("followups", clone(followups)),
  },
  { keys: ["table+ leads"], cr: "CR-W17", apply: (m) => void m.set("leads", clone(leads)) },
  {
    keys: ["table+ receipt_artifacts"],
    cr: "CR-W21 section 1",
    apply: (m) => void m.set("receipt_artifacts", clone(receiptArtifacts)),
  },
  {
    keys: ["table+ template_drafts"],
    cr: "CR-W21 section 3",
    apply: (m) => void m.set("template_drafts", clone(templateDrafts)),
  },
  setTrigger(
    "missions",
    {
      name: "missions_frozen",
      def: "CREATE TRIGGER missions_frozen BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION freeze_after_set('approved_at', 'kind', 'client_id', 'client_kind')",
    },
    "trigger+ missions_frozen",
    "CR-W22",
  ),
  addUnique(
    "messages",
    "messages_client_message_id_uq",
    ["session_id", "client_message_id"],
    "(client_message_id IS NOT NULL)",
    "CR-W19",
  ),
  addUnique(
    "messages",
    "messages_one_streaming_uq",
    ["session_id"],
    "(status = 'streaming'::text)",
    "CR-W19",
  ),
  addUnique(
    "questions",
    "questions_session_id_code_uq",
    ["session_id", "code"],
    "(code IS NOT NULL)",
    "CR-W22 (conflict 7)",
  ),
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
