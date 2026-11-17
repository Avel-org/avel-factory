// The `packages` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { IndexStatus } from "@avel/contract";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  type PgTableExtraConfigValue,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { oneOf } from "./columns.js";
import { factoryVersions } from "./knowledge.js";

/** `packages` (Missions and money in): an index of the packages in factory.yaml; changed only by a factory PR */
export const packages = pgTable(
  "packages",
  {
    key: text("key").notNull(),
    version: text("version").notNull(),
    deadlineHours: integer("deadline_hours").notNull(),
    priceMicros: bigint("price_micros", { mode: "number" }).notNull(),
    monthlyPriceMicros: bigint("monthly_price_micros", { mode: "number" }),
    checkSet: jsonb("check_set").notNull(),
    rubricProfile: jsonb("rubric_profile").notNull(),
    factoryCommit: text("factory_commit").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "packages_pkey", columns: [t.key, t.version] }),
    foreignKey({
      name: "packages_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    check("packages_status_ck", oneOf(t.status, IndexStatus)),
    index("packages_factory_commit_ix").on(t.factoryCommit),
  ],
);
