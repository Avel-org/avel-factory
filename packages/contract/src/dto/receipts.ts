import * as z from "zod/mini";
import {
  DeliveryKind,
  DeliveryState,
  ReceiptArtifactKey,
  ReceiptGateResult,
  ReceiptVerdict,
} from "../value-lists.js";
import { FileBody, IsoTime, Json, Micros, mutableFields, Uuid } from "./common.js";
import { ReceiptPlain } from "./plain.js";

/** Lowercase hex of a SHA-256. */
const Hex64 = z.string().check(z.regex(/^[0-9a-f]{64}$/));

/**
 * A receipt's proof file (CR-W21 section 1). The browser fetches its bytes from the
 * artifact route and hashes them itself.
 */
export const ReceiptArtifactDto = z.object({
  key: z.enum(ReceiptArtifactKey),
  label: z.string(),
  file: z.string(),
  lang: z.string(),
  proves: z.string(),
  sha256: Hex64,
  bytes: z.int().check(z.minimum(0)),
});
export type ReceiptArtifactDto = z.infer<typeof ReceiptArtifactDto>;

/** Gate 5's signature over the digest's raw bytes. `key` names the public key, never holds a secret. */
export const ReceiptSignature = z.object({
  by: z.literal("Gate 5"),
  key: z.string(),
  alg: z.literal("Ed25519"),
  value: z.string(),
});

/** Receipts and delivery (routes 61 and 62). */

/** `receipts` (immutable). */
export const ReceiptDto = z.object({
  id: Uuid,
  missionId: Uuid,
  gateRunId: Uuid,
  version: z.int(),
  hash: z.string(),
  verdict: z.enum(ReceiptVerdict),
  commitSha: z.string(),
  factoryCommit: z.string(),
  verdictCaps: z.array(z.string()),
  body: Json,
  humanMinutes: z.int(),
  aiTokens: z.int(),
  aiCostMicros: Micros,
  vendors: z.array(z.string()),
  overrideCount: z.int(),
  createdAt: IsoTime,
  // CR-W21 section 1
  target: z.object({ repo: z.string(), branch: z.string(), commit: z.string() }),
  plan: z.object({ version: z.int(), approvedAt: IsoTime }),
  modules: z.array(
    z.object({
      ref: z.string(),
      name: z.string(),
      result: z.enum(["landed", "accepted", "parked"]),
    }),
  ),
  gates: z.array(
    z.object({
      name: z.string(),
      result: z.enum(ReceiptGateResult),
      decision: z.nullable(z.string()),
    }),
  ),
  tests: z.object({ passed: z.int(), total: z.int() }),
  acceptance: z.object({ verified: z.int(), total: z.int() }),
  artifacts: z.array(ReceiptArtifactDto),
  signature: ReceiptSignature,
  plain: ReceiptPlain,
});
export type ReceiptDto = z.infer<typeof ReceiptDto>;

/** Route 61: `?verify=1` rechecks the hash. */
export const GetReceiptInput = z.object({
  receiptId: Uuid,
  verify: z.optional(z.literal("1")),
});
export type GetReceiptInput = z.infer<typeof GetReceiptInput>;

/** Route 61's output: `verified` is the recheck's result, or null when it wasn't asked. */
export const ReceiptViewDto = z.extend(ReceiptDto, {
  /** Set only with `?verify=1`: the server checked the signature against Gate 5's public key. */
  verified: z.nullable(z.object({ signature: z.boolean(), checkedAt: IsoTime })),
});
export type ReceiptViewDto = z.infer<typeof ReceiptViewDto>;

/** `deliveries`. */
export const DeliveryDto = z.object({
  id: Uuid,
  missionId: Uuid,
  releaseApprovalId: Uuid,
  receiptId: Uuid,
  repoConnectionId: z.nullable(Uuid),
  kind: z.enum(DeliveryKind),
  commitSha: z.string(),
  ref: z.nullable(z.string()),
  state: z.enum(DeliveryState),
  error: z.nullable(z.string()),
  recordedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type DeliveryDto = z.infer<typeof DeliveryDto>;

/** Route 62: the zip. */
export const DeliveryIdInput = z.object({ deliveryId: Uuid });
export type DeliveryIdInput = z.infer<typeof DeliveryIdInput>;
export const DeliveryArchiveDto = FileBody;

/**
 * The receipt digest (CR-W21 section 1), the same in the browser, the server and the mock:
 * the lines `id`, `commit`, `verdict`, `issuedAt` and each artifact's `sha256`, in the DTO's
 * order, joined with `\n` and UTF-8 encoded. `hash` is `sha256:` and the digest's hex.
 */
export function receiptDigestInput(r: {
  id: string;
  commitSha: string;
  verdict: string;
  createdAt: string;
  artifacts: readonly { sha256: string }[];
}): string {
  return [r.id, r.commitSha, r.verdict, r.createdAt, ...r.artifacts.map((a) => a.sha256)].join(
    "\n",
  );
}

/** The artifact route: one proof file's bytes, at most 2 MB (`ARTIFACT_TOO_LARGE` above). */
export const ReceiptArtifactInput = z.object({ receiptId: Uuid, key: z.enum(ReceiptArtifactKey) });
export type ReceiptArtifactInput = z.infer<typeof ReceiptArtifactInput>;
export const ReceiptArtifactBody = FileBody;
export const ARTIFACT_MAX_BYTES = 2 * 1024 * 1024;

/**
 * A delivery as Release shows it after you release (CR-W18 section 8, accepted with changes):
 * the stored `state` stays the design's three, and the PR's progress is `prNumber`, `prUrl` and
 * `mergedAt`, which the webhook fills.
 */
export const DeliveryViewDto = z.extend(DeliveryDto, {
  prNumber: z.nullable(z.int()),
  prUrl: z.nullable(z.url()),
  mergedAt: z.nullable(IsoTime),
  target: z.string(),
});
export type DeliveryViewDto = z.infer<typeof DeliveryViewDto>;
