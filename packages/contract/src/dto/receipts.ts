import * as z from "zod/mini";
import { DeliveryKind, DeliveryState, ReceiptVerdict } from "../value-lists.js";
import { FileBody, IsoTime, Json, Micros, mutableFields, Uuid } from "./common.js";

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
  verified: z.nullable(z.boolean()),
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
