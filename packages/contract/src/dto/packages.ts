import { z } from "zod";
import { IndexStatus } from "../value-lists.js";
import { IsoTime, Json, Micros, mutableFields } from "./common.js";

/** Packages (route 18). */

/** `packages`. */
export const PackageDto = z.object({
  key: z.string(),
  version: z.string(),
  deadlineHours: z.int(),
  priceMicros: Micros,
  monthlyPriceMicros: Micros.nullable(),
  checkSet: Json,
  rubricProfile: Json,
  factoryCommit: z.string(),
  status: z.enum(IndexStatus),
  createdAt: IsoTime,
  ...mutableFields,
});
export type PackageDto = z.infer<typeof PackageDto>;
