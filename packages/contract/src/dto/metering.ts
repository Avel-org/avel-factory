import * as z from "zod/mini";
import { IsoTime, Micros, Placeholder, Sha, Uuid } from "./common.js";

/** Metering (routes 69 and 70). */

/**
 * Route 69: "`?missionId=` or by package, and by factory commit". CR-13's split by
 * kind comes in Step 10, not here.
 */
export const GetMetricsInput = z.object({
  missionId: z.optional(Uuid),
  packageKey: z.optional(z.string().check(z.minLength(1))),
  factoryCommit: z.optional(Sha),
});
export type GetMetricsInput = z.infer<typeof GetMetricsInput>;

/** Route 69's output: no doc gives its fields yet, so it's a placeholder. */
export const MetricsDto = Placeholder;
export type MetricsDto = z.infer<typeof MetricsDto>;

/** `payments` (immutable). */
export const PaymentDto = z.object({
  id: Uuid,
  missionId: Uuid,
  amountMicros: Micros,
  receivedAt: IsoTime,
  recordedBy: Uuid,
  createdAt: IsoTime,
});
export type PaymentDto = z.infer<typeof PaymentDto>;

/** Route 70: "Record a payment". */
export const CreatePaymentInput = z.object({
  missionId: Uuid,
  amountMicros: Micros.check(z.minimum(1)),
  receivedAt: IsoTime,
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentInput>;
