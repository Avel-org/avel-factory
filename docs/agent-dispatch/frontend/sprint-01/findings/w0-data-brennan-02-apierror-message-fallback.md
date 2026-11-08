status: open
severity: P3
owner: Zero (UI contract wording); no code change for Ghost

# w0-data-brennan-02: section 3 says `ApiError.message` = `body.message`, but oRPC swaps an empty message for a fallback

## What
UI contract section 3, "Reading an error", says: "`ApiError` extends `ORPCError`: `code` = `body.code`, `status` = the HTTP status, `message` = `body.message`, …". That doesn't hold when `body.message` is `""`, which m1's `ErrorBody` allows (`packages/contract/src/errors.ts:97`, `message: z.string()`, no minimum). `ORPCError`'s constructor runs `fallbackORPCErrorMessage(code, message)`, which is `message || COMMON_ORPC_ERROR_DEFS[code]?.message || code` (`@orpc/client` 1.16.2, `dist/shared/client.DeR0HTYb.mjs:106-107`).

Ghost's a2 handles this for `stale`: it keeps the body's message as sent in a new public field, `ApiError.bodyMessage` (`apps/web/src/data/errors.ts:15-19, 28`), and `UiError.stale.message` reads it (`errors.ts:109, 152`). That's the right behaviour for revision 9's "`message: string` (the `ErrorBody`'s `message`, or `""` …)". But section 3 doesn't name `bodyMessage`, and its `ApiError` line is now wrong in one case.

The difference is visible in other kinds too. `forbidden`, `conflict` and `unprocessable` carry `message` from `e.message` (`errors.ts:149-152` passes `e.message` to `byStatus`), so an empty `ErrorBody.message` reaches them as the fallback (`"Conflict"`, or the code). `stale.message` gets `""`. The contract doesn't say which one is meant for those three kinds.

## Evidence
```
$ cd apps/web && node --input-type=module -e 'import {ORPCError} from "@orpc/client"; \
  console.log(JSON.stringify(new ORPCError("STALE_VERSION",{status:409,message:""}).message)); \
  console.log(JSON.stringify(new ORPCError("CONFLICT",{status:409,message:""}).message));'
"STALE_VERSION"
"Conflict"
```

## Fixing it means
In Zero's next revision, section 3:
1. records `ApiError.bodyMessage: string`, the `ErrorBody`'s message as sent, and says `message` is oRPC's (`body.message`, or oRPC's fallback when that's empty);
2. says whether `forbidden`, `conflict` and `unprocessable` carry `message` from the body as sent or from oRPC's fallback. Today they get the fallback, so an empty server message never makes a blank panel body. If that's the intent, write it down.

This doesn't block Ghost's a2. The build meets revision 9 for `stale`, and the other kinds are as merged in a1.
