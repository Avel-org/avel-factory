import * as z from "zod/mini";
import { IndexStatus } from "../value-lists.js";
import { IsoTime, Json, mutableFields } from "./common.js";

/** Packages (route 18). */

/** `packages`. */
export const PackageDto = z.object({
  key: z.string(),
  version: z.string(),
  deadlineHours: z.int(),
  // No price or monthly price (CR-W20 section 3): billing lives outside the factory.
  checkSet: Json,
  rubricProfile: Json,
  factoryCommit: z.string(),
  status: z.enum(IndexStatus),
  createdAt: IsoTime,
  ...mutableFields,
});
export type PackageDto = z.infer<typeof PackageDto>;
