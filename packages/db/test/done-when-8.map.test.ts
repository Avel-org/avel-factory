// Done-when 8: the schema matches the map. The test reads the map's table, column, foreign-key, CHECK,
// unique, index and trigger lists (docs/design/AVEL Database Map.html), reads the same from the live
// database after the first migration, and compares them. Every difference has to be one that
// contract.md section 6 lists against a change request (helpers/changes.ts has them, each with its source).
import { describe, expect, it } from "vitest";
import { readCatalog } from "./helpers/catalog.ts";
import { CHANGES, declaredKeys } from "./helpers/changes.ts";
import { migratedDb } from "./helpers/db.ts";
import { diffSchemas } from "./helpers/diff.ts";
import { expectedNormalized } from "./helpers/expected.ts";
import { loadMap } from "./helpers/map.ts";

const db = migratedDb("dw8");

describe("done-when 8: the schema matches the map", () => {
  it("[done-when 8] pins existing behaviour (passes now): the reader finds in the map the 91 tables, 204 foreign keys, 199 CHECKs, 81 unique and 183 other indexes it states", () => {
    const { stats, tables } = loadMap();
    expect(tables.length).toBe(stats.tables);
    expect(tables.reduce((n, t) => n + t.foreignKeys.length, 0)).toBe(stats.foreignKeys);
    expect(tables.reduce((n, t) => n + t.checks.length, 0)).toBe(stats.checks);
    expect(tables.reduce((n, t) => n + t.uniques.length, 0)).toBe(stats.uniques);
    expect(tables.reduce((n, t) => n + t.indexes.length, 0)).toBe(stats.indexes);
    expect([stats.tables, stats.foreignKeys, stats.checks, stats.uniques, stats.indexes]).toEqual([
      91, 204, 199, 81, 183,
    ]);
  });

  it("[done-when 8] every difference between the schema and the map is listed against the change request that made it, and every listed change is there", () => {
    const live = readCatalog(db());
    const found = diffSchemas(loadMap().tables, live);
    const declared = declaredKeys();
    const unlisted = found.filter((k) => !declared.includes(k));
    const missing = declared.filter((k) => !found.includes(k));
    expect(unlisted, "differences from the map that no change request lists").toEqual([]);
    expect(missing, "listed changes the schema doesn't make").toEqual([]);
  });

  it("[done-when 8] the schema is the map with those changes applied: every column type, default and NOT NULL, key, foreign key, CHECK, index and trigger agrees", () => {
    const url = db();
    const left = diffSchemas(expectedNormalized(url), readCatalog(url));
    expect(left, "what still differs once the changes are applied").toEqual([]);
  });

  it("[done-when 8] pins existing behaviour (passes now): each listed change names its source", () => {
    expect(CHANGES.length).toBeGreaterThan(0);
    for (const c of CHANGES) {
      expect(c.cr, `a source for ${c.keys.join(", ")}`).toMatch(/\S/);
      expect(c.keys.length).toBeGreaterThan(0);
    }
  });
});
