import * as z from "zod/mini";
import { ArchiveStatus, ClientKind, RepoConnectionState } from "../value-lists.js";
import { IsoTime, Json, mutableFields, RowVersion, Uuid } from "./common.js";

/** Clients and repos (routes 8 to 17). */

/**
 * `clients` plus CR-13's `kind`, without `rep_id` (CR-18): `id`, `name`, `kind`,
 * `contacts`, `status`, `archivedAt`, `rowVersion`, `createdAt`, `updatedAt`
 * (contract.md section 4, `ClientDto`).
 */
export const ClientDto = z.object({
  id: Uuid,
  name: z.string(),
  contacts: Json,
  status: z.enum(ArchiveStatus),
  archivedAt: z.nullable(IsoTime),
  kind: z.enum(ClientKind),
  createdAt: IsoTime,
  ...mutableFields,
});
export type ClientDto = z.infer<typeof ClientDto>;

/** Route 9. `kind` is required: `clients.kind` has no default (D20). */
export const CreateClientInput = z.object({
  name: z.string().check(z.trim(), z.minLength(1)),
  kind: z.enum(ClientKind),
  contacts: z.optional(Json),
});
export type CreateClientInput = z.infer<typeof CreateClientInput>;

export const ClientIdInput = z.object({ clientId: Uuid });
export type ClientIdInput = z.infer<typeof ClientIdInput>;

/** Route 11: edit a client, sending back the version it was read at. */
export const UpdateClientInput = z.object({
  clientId: Uuid,
  rowVersion: RowVersion,
  name: z.optional(z.string().check(z.trim(), z.minLength(1))),
  contacts: z.optional(Json),
  status: z.optional(z.enum(ArchiveStatus)),
});
export type UpdateClientInput = z.infer<typeof UpdateClientInput>;

/** `repo_connections`. The tokens themselves live in `secrets` and are never returned. */
export const RepoConnectionDto = z.object({
  id: Uuid,
  clientId: Uuid,
  owner: z.string(),
  repos: z.array(z.string()),
  readSecretId: Uuid,
  writeSecretId: Uuid,
  readExpiresAt: IsoTime,
  writeExpiresAt: IsoTime,
  state: z.enum(RepoConnectionState),
  revokedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type RepoConnectionDto = z.infer<typeof RepoConnectionDto>;

/** Route 13: "one per client, with a read token and a write token". Step-up. */
export const CreateRepoConnectionInput = z.object({
  clientId: Uuid,
  owner: z.string().check(z.minLength(1)),
  repos: z.array(z.string().check(z.minLength(1))).check(z.minLength(1)),
  readToken: z.string().check(z.minLength(1)),
  writeToken: z.string().check(z.minLength(1)),
});
export type CreateRepoConnectionInput = z.infer<typeof CreateRepoConnectionInput>;

export const RepoConnectionIdInput = z.object({ connectionId: Uuid });
export type RepoConnectionIdInput = z.infer<typeof RepoConnectionIdInput>;

/** Route 14: "Edit its `repos[]`". Step-up. */
export const UpdateRepoConnectionInput = z.object({
  connectionId: Uuid,
  rowVersion: RowVersion,
  repos: z.array(z.string().check(z.minLength(1))).check(z.minLength(1)),
});
export type UpdateRepoConnectionInput = z.infer<typeof UpdateRepoConnectionInput>;

/** Route 15: revokes both tokens; the record stays. */
export const RevokeRepoConnectionInput = z.object({
  connectionId: Uuid,
  rowVersion: RowVersion,
});
export type RevokeRepoConnectionInput = z.infer<typeof RevokeRepoConnectionInput>;

/** One token's check (route 16: "Checks both tokens and their scopes"). */
export const RepoTokenCheckDto = z.object({
  ok: z.boolean(),
  scopes: z.array(z.string()),
  expiresAt: z.nullable(IsoTime),
});
export type RepoTokenCheckDto = z.infer<typeof RepoTokenCheckDto>;

/** Route 16's output. */
export const RepoConnectionVerificationDto = z.object({
  connectionId: Uuid,
  read: RepoTokenCheckDto,
  write: RepoTokenCheckDto,
});
export type RepoConnectionVerificationDto = z.infer<typeof RepoConnectionVerificationDto>;

/** Route 17: "Replaces the read or the write token". Exactly one is sent. Step-up. */
export const RotateRepoConnectionInput = z
  .object({
    connectionId: Uuid,
    rowVersion: RowVersion,
    readToken: z.optional(z.string().check(z.minLength(1))),
    writeToken: z.optional(z.string().check(z.minLength(1))),
  })
  .check(
    z.refine((v) => (v.readToken === undefined) !== (v.writeToken === undefined), {
      message: "Send exactly one of readToken and writeToken",
    }),
  );
export type RotateRepoConnectionInput = z.infer<typeof RotateRepoConnectionInput>;
