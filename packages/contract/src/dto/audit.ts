import { z } from "zod";
import { ActivityLogActorKind } from "../value-lists.js";
import { IsoTime, Uuid } from "./common.js";

/** Audit (route 93). */

/** `activity_log`: overrides write their row here too, so they're included. */
export const ActivityDto = z.object({
  id: Uuid,
  actorKind: z.enum(ActivityLogActorKind),
  userId: Uuid.nullable(),
  credentialId: Uuid.nullable(),
  action: z.string(),
  target: z.string(),
  reason: z.string().nullable(),
  createdAt: IsoTime,
});
export type ActivityDto = z.infer<typeof ActivityDto>;
