import * as z from "zod/mini";
import { DeviceLoginState } from "../value-lists.js";
import { IsoTime, mutableFields, Uuid } from "./common.js";

/** Auth (routes 1 to 5). */

/** `device_logins`, without `device_code_sha256` (rule 3). */
export const DeviceLoginDto = z.object({
  id: Uuid,
  userCode: z.string(),
  label: z.string(),
  state: z.enum(DeviceLoginState),
  approvedBy: z.nullable(Uuid),
  cliSessionId: z.nullable(Uuid),
  expiresAt: IsoTime,
  approvedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type DeviceLoginDto = z.infer<typeof DeviceLoginDto>;

/** `cli_sessions`, without `token_sha256` (rule 3). */
export const CliSessionDto = z.object({
  id: Uuid,
  userId: Uuid,
  label: z.string(),
  expiresAt: IsoTime,
  revokedAt: z.nullable(IsoTime),
  lastUsedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type CliSessionDto = z.infer<typeof CliSessionDto>;

/** Route 1's input: the CLI names itself (`device_logins.label`). */
export const StartDeviceLoginInput = z.pick(DeviceLoginDto, { label: true });
export type StartDeviceLoginInput = z.infer<typeof StartDeviceLoginInput>;

/**
 * Route 1's output: "a device code and a short user code". `deviceCode` is returned
 * once and stored only hashed; this response is never stored by idempotency (rule 3).
 */
export const DeviceLoginStartedDto = z.extend(DeviceLoginDto, {
  deviceCode: z.string().check(z.minLength(1)),
});
export type DeviceLoginStartedDto = z.infer<typeof DeviceLoginStartedDto>;

/** Route 2's input: the user code from the path. Step-up. */
export const ApproveDeviceLoginInput = z.pick(DeviceLoginDto, { userCode: true });
export type ApproveDeviceLoginInput = z.infer<typeof ApproveDeviceLoginInput>;

/** Route 3's input: the CLI polls with its device code. */
export const CreateCliSessionInput = z.object({ deviceCode: z.string().check(z.minLength(1)) });
export type CreateCliSessionInput = z.infer<typeof CreateCliSessionInput>;

/**
 * Route 3's output: the session and its token, returned once. A replayed key gets
 * 409 `TOKEN_REPLAYED`, and the token is never returned again.
 */
export const CliSessionCreatedDto = z.object({
  session: CliSessionDto,
  token: z.string().check(z.minLength(1)),
});
export type CliSessionCreatedDto = z.infer<typeof CliSessionCreatedDto>;

/** Route 5's input. */
export const RevokeCliSessionInput = z.object({ sessionId: Uuid });
export type RevokeCliSessionInput = z.infer<typeof RevokeCliSessionInput>;
