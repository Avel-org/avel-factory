// The rules done-when 2 tests: the map's CHECKs, unique and partial-unique indexes and foreign keys,
// with the changes on top (helpers/changes.ts). Read from the map, never typed out.
import { expectedSchema } from "./changes.ts";
import { loadMap } from "./map.ts";
import type { Fk, Tbl } from "./model.ts";

/** The CHECKs that say which parents a row has (DATABASE.md, Integrity rules): exactly one, at most one, or the one its kind needs. */
export const PARENT_RULES = new Set([
  "agent_traces_parent_ck",
  "budget_reservations_expected_ck",
  "budget_reservations_request_ck",
  "secrets_owner_ck",
  "closeout_items_parent_ck",
  "credentials_parent_ck",
  "gate_evaluations_parent_ck",
  "integration_commits_by_kind_ck",
  "overrides_by_kind_ck",
  "rooms_parent_ck",
  "findings_decided_by_ck",
]);

export const schema: Tbl[] = expectedSchema(loadMap().tables);

export type CheckRule = { table: string; name: string; def: string };
export const checkRules: CheckRule[] = schema.flatMap((t) =>
  t.checks.map((c) => ({ table: t.name, name: c.name, def: c.def })),
);
export const plainCheckRules = checkRules.filter((r) => !PARENT_RULES.has(r.name));
export const parentRules = checkRules.filter((r) => PARENT_RULES.has(r.name));

export type UniqueRule = { table: string; name: string; cols: string[]; where: string | null };
export const uniqueRules: UniqueRule[] = schema.flatMap((t) =>
  t.uniques.map((u) => ({ table: t.name, name: u.name, cols: u.cols, where: u.where })),
);

export type FkRule = { table: string } & Fk;
export const fkRules: FkRule[] = schema.flatMap((t) =>
  t.foreignKeys.map((f) => ({ table: t.name, ...f })),
);
export const restrictRules = fkRules.filter((f) => f.onDelete !== "CASCADE");
export const cascadeRules = fkRules.filter((f) => f.onDelete === "CASCADE");

export const counts = {
  checks: plainCheckRules.length,
  parentRules: parentRules.length,
  uniques: uniqueRules.length,
  deleteRefusals: restrictRules.length,
  deleteCascades: cascadeRules.length,
};
