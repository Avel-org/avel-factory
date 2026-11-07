import { ErrorBody } from "@avel/contract/errors";
import { ORPCError } from "@orpc/client";

/**
 * Reading an error (UI contract section 3). The wire body is m1's `ErrorBody`, decoded once,
 * at the link, by `decodeErrorBody`; `toUiError` is the only mapper from what a call threw to
 * what the screen shows (FM, Errors by code).
 */

/** An error whose body was m1's `ErrorBody`: the AVEL code, the HTTP status, details and ID. */
export class ApiError extends ORPCError<
  string,
  { details: ErrorBody["details"]; requestId: string }
> {
  /**
   * The `ErrorBody`'s message as sent. `message` is the same, except that `ORPCError` replaces
   * an empty one with a fallback, so `UiError.stale.message` reads this.
   */
  readonly bodyMessage: string;

  constructor(body: ErrorBody, status: number) {
    super(body.code, {
      status,
      message: body.message,
      data: { details: body.details, requestId: body.requestId },
    });
    this.name = "ApiError";
    this.bodyMessage = body.message;
  }
}

/** The request's fetch rejected. Only the fetch wrapper throws it, with the ID it sent. */
export class NetworkError extends TypeError {
  readonly requestId: string;

  constructor(requestId: string, cause: unknown) {
    super("The request didn't reach the server", { cause });
    this.name = "NetworkError";
    this.requestId = requestId;
  }
}

/**
 * `OpenAPILink`'s `customErrorResponseBodyDecoder`: an `ErrorBody` becomes an `ApiError`;
 * anything else gives null, and oRPC throws its own `ORPCError`.
 */
export function decodeErrorBody(body: unknown, response: { status: number }): ApiError | null {
  const parsed = ErrorBody.safeParse(body);
  return parsed.success ? new ApiError(parsed.data, response.status) : null;
}

type UiErrorBase = { code: string | null; requestId: string | null };

/** What a screen draws for an error, by `kind` (UI contract section 3, `UiError`). */
export type UiError = UiErrorBase &
  (
    | {
        kind: "stale";
        field: string | null;
        currentVersion: number | string | null;
        /** The `ErrorBody`'s message, or "" when the body isn't an `ErrorBody` (revision 9). */
        message: string;
      }
    | { kind: "notAllowedNow"; state?: "resolved" | "expired" }
    | { kind: "notFound" }
    | { kind: "badRequest"; field?: string }
    | { kind: "signedOut" }
    | { kind: "forbidden"; message: string }
    | { kind: "rateLimited"; retryAfterMs: number | null }
    | { kind: "idempotencyConflict" }
    | { kind: "inProgress" }
    | { kind: "conflict"; message: string }
    | { kind: "unprocessable"; message: string }
    | { kind: "server"; status: number }
    | { kind: "network" }
  );

type Fields = Record<string, unknown>;

function fields(value: unknown): Fields {
  return value !== null && typeof value === "object" ? (value as Fields) : {};
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * The kind for a status and, when the body was an `ErrorBody`, its code, details and message.
 * `bodyMessage` is the `ErrorBody`'s message, or "" when the body isn't one; `stale` carries it.
 */
function byStatus(
  base: UiErrorBase,
  status: number,
  message: string,
  details: Fields,
  bodyMessage: string,
): UiError {
  const { code } = base;
  if (status === 409) {
    // `stale` is keyed on the code STALE_VERSION alone, never on 409 (Decisions, 2026-11-06).
    if (code === "STALE_VERSION") {
      const current = details.currentVersion;
      return {
        ...base,
        kind: "stale",
        field: stringField(details.field) ?? null,
        currentVersion: typeof current === "number" || typeof current === "string" ? current : null,
        message: bodyMessage,
      };
    }
    if (code === "IDEMPOTENCY_KEY_REUSED") return { ...base, kind: "idempotencyConflict" };
    if (code === "IDEMPOTENCY_IN_PROGRESS") return { ...base, kind: "inProgress" };
    return { ...base, kind: "conflict", message };
  }
  if (status === 422) {
    if (code === "INVALID_TRANSITION") {
      const state = details.state;
      return state === "resolved" || state === "expired"
        ? { ...base, kind: "notAllowedNow", state }
        : { ...base, kind: "notAllowedNow" };
    }
    return { ...base, kind: "unprocessable", message };
  }
  if (status === 404) return { ...base, kind: "notFound" };
  if (status === 401) return { ...base, kind: "signedOut" };
  if (status === 403) return { ...base, kind: "forbidden", message };
  if (status === 429) {
    const retryAfterMs = details.retryAfterMs;
    return {
      ...base,
      kind: "rateLimited",
      retryAfterMs: typeof retryAfterMs === "number" ? retryAfterMs : null,
    };
  }
  if (status >= 500) return { ...base, kind: "server", status };
  // 400, and any 4xx the table doesn't name: a bad request, never retried.
  const field = stringField(details.field);
  return field === undefined
    ? { ...base, kind: "badRequest" }
    : { ...base, kind: "badRequest", field };
}

/**
 * The only error mapper, in section 3's order: an `ApiError`, any other `ORPCError` (by status,
 * with code null), a `NetworkError`, and anything else (`network`, with no request ID).
 */
export function toUiError(e: unknown): UiError {
  if (e instanceof ApiError) {
    const data = fields(e.data);
    const base = { code: e.code, requestId: stringField(data.requestId) ?? null };
    return byStatus(base, e.status, e.message, fields(data.details), e.bodyMessage);
  }
  if (e instanceof ORPCError) {
    const headers = fields(fields(e.data).headers);
    const base = { code: null, requestId: stringField(headers["x-request-id"]) ?? null };
    return byStatus(base, e.status, e.message, {}, "");
  }
  if (e instanceof NetworkError) {
    return { kind: "network", code: null, requestId: e.requestId };
  }
  return { kind: "network", code: null, requestId: null };
}
