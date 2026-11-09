# Escalation 04: sign-in's wire under /api/auth/* isn't written down

**Status: open.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. `login.md` builds on the mock with the stand-in below until it's answered.

## What's missing

- **`/api/auth/*` is outside `@avel/contract`** (API reference, "Three routes live outside the contract"). So no doc gives the web the paths, the bodies or the error shapes for sign-in, the session read and sign-out.
- **The lockout's answer isn't named.** The Step 0 and Step 1 plan sets the lockout (10 failures in 15 minutes) and the rate limit (5 a minute), and test 7 says "the 11th failed sign-in is locked out". Nothing says what the web receives: the status, the code, or how long to wait.
- **The SSR cookie.** `router.tsx` doesn't forward cookies yet ("until W5 brings sessions"). The web needs to know that the session cookie is all it forwards.

## What I propose (the stand-in, `login.md` section 1)

| Call | Request | Answer |
| --- | --- | --- |
| Sign in | `POST /api/auth/sign-in/email`, `{ email, password }` | 200 `{ user: { id, email, name } }` with `Set-Cookie`; 401 `code: "INVALID_EMAIL_OR_PASSWORD"` |
| Session | `GET /api/auth/get-session` | 200 `{ session: { id, userId, expiresAt }, user }`, or 200 `null` |
| Sign out | `POST /api/auth/sign-out`, `{}` | 200 `{ success: true }` |

- **Locked out or rate-limited:** 429 with `X-Retry-After` in seconds, as Better Auth's own rate limiter answers. The lockout uses the same status and header, with the seconds until it lifts.
- **The web reads only these fields,** so a code you prefer for the lockout (for example `TOO_MANY_ATTEMPTS`) changes nothing as long as it's 429 with the header.
- **These are Better Auth's email and password defaults,** with `basePath` `/api/auth`.

## What I need back

1. Confirm the three paths and the fields above, or give the real ones.
2. Confirm the lockout's status and header.
3. Confirm the session cookie's name and attributes, and that it's the only cookie the web forwards on SSR calls.
