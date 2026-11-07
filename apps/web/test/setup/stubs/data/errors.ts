// An inert stand-in for src/data/errors.ts (vitest.config.ts). toUiError answers a kind no
// mapping row has, so every case fails on its assertion.

export interface UiError {
  kind: string;
  code: string | null;
  requestId: string | null;
  [extra: string]: unknown;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly data: unknown;
  constructor(
    body: { code: string; message: string; details?: unknown; requestId: string },
    status: number,
  ) {
    super(body.message);
    this.code = body.code;
    this.status = status;
    this.data = { details: body.details, requestId: body.requestId };
  }
}

export class NetworkError extends TypeError {
  readonly requestId: string;
  constructor(requestId: string, cause?: unknown) {
    super("stub", { cause });
    this.requestId = requestId;
  }
}

export function decodeErrorBody(_body: unknown, _response: { status: number }): ApiError | null {
  return null;
}

export function toUiError(_e: unknown): UiError {
  return { kind: "unbuilt", code: null, requestId: null };
}
