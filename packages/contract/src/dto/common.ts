import { z } from "zod";

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
export const RowVersion = z.int().min(1);
/** A `jsonb` column with no shape in the map. */
export const Json = z.json();
/** A git commit SHA (`text` in the map). */
export const Sha = z.string().min(1);

/** A non-empty written reason, for overrides, decisions, acceptances and pass approvals. */
export const Reason = z.string().trim().min(1);

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
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type PageQuery = z.infer<typeof PageQuery>;

/** The one list wrapper: `nextCursor` is null on the last page. */
export const Page = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
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
