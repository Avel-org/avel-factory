import * as z from "zod/mini";
import type * as core from "zod/v4/core";

// Classic zod sets English messages as the default on its first schema; zod/mini doesn't.
// The same default here keeps every issue message, and so BAD_REQUEST's details (S1-3),
// as they were. An explicit z.config() locale still wins, as it does with classic.
if (!z.core.globalConfig.localeError) z.config(z.locales.en());

/**
 * The value rules every DTO follows (contract.md section 4, rule 5; API and data
 * reference, Conventions): IDs are UUIDv7 strings, times are ISO strings with a
 * zone, and money is whole micro-dollars (`*Micros`).
 */
export const Uuid = z.uuid({ version: "v7" });
export const IsoTime = z.iso.datetime({ offset: true });
/** Whole micro-dollars: 1,000,000 = $1. */
export const Micros = z.int();
/** A `row_version`: writes send it back, and a stale one gets 409 `STALE_VERSION` (Q4). */
export const RowVersion = z.int().check(z.minimum(1));
/** A `jsonb` column with no shape in the map. */
export const Json = z.json();
/** A git commit SHA (`text` in the map). */
export const Sha = z.string().check(z.minLength(1));

/** A non-empty written reason, for overrides, decisions, acceptances and pass approvals. */
export const Reason = z.string().check(z.trim(), z.minLength(1));

/**
 * A placeholder for a shape that a route names but no accepted doc defines yet
 * (contract.md section 4, item 6). Each use is listed as open in the completion report.
 */
export const Placeholder = z.record(z.string(), z.json());
export type Placeholder = z.infer<typeof Placeholder>;

/** The fields every mutable table's DTO carries (rule 2). */
export const mutableFields = {
  rowVersion: RowVersion,
  updatedAt: IsoTime,
} as const;

// ---------------------------------------------------------------- paging (rule 7)

/** The cursor query every list route takes. `limit` is at most 100 (Frontend Map v0.6, Data layer). */
export const PageQuery = z.object({
  cursor: z.optional(z.string().check(z.minLength(1))),
  limit: z.optional(z.coerce.number().check(z.int(), z.minimum(1), z.maximum(100))),
});
export type PageQuery = z.infer<typeof PageQuery>;

/** The one list wrapper: `nextCursor` is null on the last page. */
export const Page = <T extends core.$ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.nullable(z.string()),
  });

// ---------------------------------------------------------------- files

/** A file in a request or a response (multipart in, a binary body out). */
export const FileBody = z.file();

/**
 * A binary response with its `ETag` (CR-16: the files route and the archive).
 * Used with `outputStructure: "detailed"`.
 */
export const FileWithEtag = z.object({
  headers: z.object({ etag: z.string() }),
  body: FileBody,
});
