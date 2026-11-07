/**
 * `@avel/db`: the Drizzle schema rebuilt from the database map
 * (`docs/design/AVEL Database Map.html`) with contract.md section 6's changes on top (CR-19),
 * and the table-owner map (D9). The migrations are in `drizzle/`.
 */
export * from "./owners.js";
export * from "./schema/index.js";
