import { Context } from "effect";

/** Who is calling: the operator's `users.id` and the `auth_sessions.id` of their web session. */
export interface CallerIdentity {
  readonly userId: string;
  readonly sessionId: string;
}

/**
 * The request's caller, from its web session cookie. A request without a live session has no
 * Caller, so a procedure reads it with `Effect.serviceOption(Caller)`.
 */
export class Caller extends Context.Service<Caller, CallerIdentity>()("avel/Caller") {}

/** The client's address: the socket peer's, never a client-set X-Forwarded-For. */
export class ClientIp extends Context.Service<ClientIp, string>()("avel/ClientIp") {}

/** The request's Idempotency-Key header, or null without one. */
export class RequestIdempotencyKey extends Context.Service<RequestIdempotencyKey, string | null>()(
  "avel/RequestIdempotencyKey",
) {}
