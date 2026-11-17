import * as z from "zod/mini";

/**
 * CR-W9: the plain block. Screens lead with plain language; IDs, hashes, gate numbers and
 * factory wording stay in the structured fields behind Details. Plain text is written by
 * code from the templates in `plain-templates.ts`, never by a model at read time, and it
 * travels in the same events as its object (CR-W1).
 *
 * All plain text is untrusted for rendering purposes too: it's plain text, never HTML.
 */

/** A line of plain text at most `max` characters long, with no surrounding spaces. */
const line = (max: number) => z.string().check(z.trim(), z.minLength(1), z.maxLength(max));

/** At most 120 characters: summaries, titles and verdict lines. */
export const PlainShort = line(120);
/** At most 240 characters: why, if-you-approve, if-you-reject and returned. */
export const PlainLong = line(240);

/** On `MissionDto`, its list row and its detail. */
export const MissionPlain = z.object({ summary: PlainShort });
export type MissionPlain = z.infer<typeof MissionPlain>;

/** On a module run: its name ("Quote form"), a summary and where it is ("Being built (second try)"). */
export const ModulePlain = z.object({
  name: line(60),
  summary: PlainShort,
  step: line(60),
});
export type ModulePlain = z.infer<typeof ModulePlain>;

/** On `DispatchDto`: what the job is for, the role in plain words ("Writes the tests") and its step. */
export const DispatchPlain = z.object({
  summary: PlainShort,
  role: line(60),
  step: line(60),
});
export type DispatchPlain = z.infer<typeof DispatchPlain>;

/**
 * On every pending decision. `returned` is set exactly when the item came back: an earlier
 * decision on the same subject was superseded before it took effect (CR-W15).
 */
export const DecisionPlain = z.object({
  title: PlainShort,
  why: PlainLong,
  ifYouApprove: PlainLong,
  ifYouReject: z.nullable(PlainLong),
  returned: z.nullable(PlainLong),
});
export type DecisionPlain = z.infer<typeof DecisionPlain>;

/** On `ReceiptDto`: one verdict line and at most 6 proof lines. */
export const ReceiptPlain = z.object({
  verdictLine: PlainShort,
  proofLines: z.array(PlainShort).check(z.maxLength(6)),
});
export type ReceiptPlain = z.infer<typeof ReceiptPlain>;

/** On the dispatch package (CR-W11): "Add the Landing page dispatch to the GTS repo". */
export const PackagePlain = z.object({ summary: PlainShort });
export type PackagePlain = z.infer<typeof PackagePlain>;

/**
 * Tokens plain text must never contain (CR-W9, "Checked by"): module and finding refs, plan
 * labels, commit SHAs, UUIDs and gate numbers. The template tests and the mock run every
 * rendered line through this.
 */
const ID_LIKE: readonly RegExp[] = [
  /\bM\d+\b/, // module refs
  /\b[FRSQ]-?\d+[a-z]?\b/, // finding, requirement, scenario and question labels
  /\bCK\d+\b/, // check labels
  /\b[0-9a-f]{7,40}\b/i, // commit SHAs and hashes
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i, // UUIDs
  /\bgate\s*[0-5]\b/i, // gate numbers
  /\bsha256:/i,
];

/** The ID-like tokens in a plain line, empty when it's clean. */
export function plainTextIssues(text: string): string[] {
  return ID_LIKE.flatMap((re) => {
    const m = text.match(re);
    return m ? [m[0]] : [];
  });
}
