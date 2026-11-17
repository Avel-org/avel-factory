# Escalation 04: sign-in's wire under /api/auth/* isn't written down

**Status: answered by Axis, 2026-11-08 (S1-10 in backend sprint-01 `decisions.md`). The server half goes into the Step 1 slice, and `SESSION_COOKIE_NAMES` into the contract's `1.0.0`.** From Zero (frontend lead), 2026-11-08. **To:** Axis, via INT. **Blocks:** nothing. `login.md` builds on the mock with the stand-in below until it's answered.

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

## Axis's answer (2026-11-08)

**What this is checked against:** Better Auth 1.7.18's published source (`better-auth` and `@better-auth/core`, read from the npm tarballs, not run). Where these answers come from the source and not a design doc, they say so. AVEL's server sets a few options on top, and each one is marked **AVEL**. They go into the Step 1 slice. **The paths and your stand-in mostly hold.** Three things change what the web may assume: the token (1), the lockout's body (2) and the refreshed cookie on SSR (3).

### 1. The three calls

| Call | Request | Answer |
| --- | --- | --- |
| Sign in | `POST /api/auth/sign-in/email`, JSON `{ email, password }` | **200** `{ redirect: false, user }` with `Set-Cookie`. **401** `{ code: "INVALID_EMAIL_OR_PASSWORD", message }` for a wrong password and for an unknown email alike. **400** `{ code: "INVALID_EMAIL", message }` if the email isn't an email. **429**: section 2 |
| Session | `GET /api/auth/get-session` | **200** `{ session, user }`, or **200** `null` with no valid session |
| Sign out | `POST /api/auth/sign-out`, JSON `{}` | **200** `{ success: true }`, and `Set-Cookie` clears the session cookie. You get the same answer with no session |

**`user`** is `{ id, email, name, emailVerified, image, createdAt, updatedAt }` (`users`, DATABASE.md). **`session`** is `{ id, userId, expiresAt, createdAt, updatedAt, ipAddress, userAgent }`. The web reads only the fields you list. Better Auth's errors are `{ code, message }`, not the contract's `ErrorBody`, because `/api/auth/*` is outside the contract.

**AVEL: no session token in any body.**
- **What Better Auth does:** it returns the raw session token as `token` in sign-in's body (`api/routes/sign-in.mjs`, `return ctx.json({ redirect, token, url, user })`). It also returns it as `session.token` in get-session's, because the session schema's `token` field isn't marked `returned: false` (`@better-auth/core` `db/get-tables.mjs:105`).
- **What AVEL's server does:** it strips `token` from both answers. The cookie is the only place the token lives.
- **Why:** this is the server half of Brennan's login-uic P1 ("the token reaches the session cache and SSR HTML"). Revision 2 should still never store a field it doesn't read.
- **The Step 1 test:** neither body contains the session token's value.

**Fields the web never sends:**
- **`callbackURL`:** Better Auth would answer with a `Location` header and `redirect: true`. Where to go after sign-in (`next`) is the web's own check.
- **`rememberMe: false`:** it would set a second cookie, `dont_remember`.

**The `Origin` header:**
- **The rule:** Better Auth checks `Origin` on cookie-bearing POSTs. A missing origin, or one not in `trustedOrigins`, gets **403** `MISSING_OR_NULL_ORIGIN` or `INVALID_ORIGIN` (`api/middlewares/origin-check.mjs`).
- **AVEL:** the web's origin is in `trustedOrigins`, so a browser POST passes.
- **SSR:** it never POSTs to `/api/auth/*`.

### 2. Locked out or rate-limited

**Better Auth has no lockout.** Its limiter keys by IP and path only:
- In production its default for `/sign-in*` is 3 in 10 seconds (`api/rate-limiter/index.mjs`, `getDefaultSpecialRules`).
- It's off outside production (`context/create-context.mjs:172`).
- Its 429 body is `{ message }`, with no `code`.

**AVEL:**
- **The Step 1 plan's sign-in limits** need AVEL's own wrapper in front of `POST /api/auth/sign-in/email`: 5 a minute per email and per IP, plus the lockout of 10 failures in 15 minutes.
- **Only one limiter answers.** Better Auth's own limiter is turned off (`rateLimit.enabled: false`).

**Both the lockout and the rate limit answer the same way:**
- **Status:** **429**.
- **Body:** `{ code: "TOO_MANY_REQUESTS", message }`.
- **Headers:** `X-Retry-After` and `Retry-After` both carry the same whole number of seconds, rounded up. For the lockout, that's the time until it lifts.
- **What the web reads:** the status and `X-Retry-After`, as you propose. Write one line of copy that fits both cases. The web can't tell them apart, and that's on purpose.

**While the lockout lasts:**
- **The right password** also gets the 429 (test 7).
- **Which emails it applies to:** it's counted per submitted email, whether or not that email exists, so neither the lockout nor its timing shows which email is the operator's.

### 3. The cookie, and SSR

**The session cookie is the only cookie** (AVEL turns Better Auth's cookie cache off, so there's no `session_data` cookie):

| Item | Value |
| --- | --- |
| Name | `better-auth.session_token` over http (local dev). Over https it's `__Secure-better-auth.session_token`. The prefix `__Secure-` follows the base URL's scheme (`cookies/index.mjs`, `createCookieGetter`) |
| Attributes | `HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` (7 days), and `Secure` over https. No `Domain` |
| Value | signed by Better Auth. Opaque to the web |

**AVEL, in the contract's `1.0.0`:** `@avel/contract` exports `SESSION_COOKIE_NAMES = ["__Secure-better-auth.session_token", "better-auth.session_token"]`, beside `CONTRACT_VERSION_HEADER`. The name then has one source, and the web never writes it down itself.

**On an SSR call, the web forwards only that cookie:** whichever of the two names the browser sent, and nothing else.

**One catch: SSR must pass a refreshed cookie back.**
- **What happens:** once a session is more than a day past its last refresh (`updateAge`, 86400 seconds), `GET /api/auth/get-session` extends it and answers with a new `Set-Cookie`.
- **What the web must do:** when an SSR call gets a `Set-Cookie` from the API, it passes it on, unchanged, in its own response to the browser.
- **What goes wrong otherwise:** the browser's cookie expires 7 days after sign-in while the database still holds a live session, so the operator is signed out mid-use.
- **The web's test:** an SSR request whose API answer carries `Set-Cookie` returns that header to the browser.

### For the mock

**Answer as above:**
- the token stripped;
- 429 with both headers;
- `SESSION_COOKIE_NAMES[1]`, the http name, since the mock runs over http.

**Until `1.0.0` ships the constant:** a local copy of the two names, with a TODO, is fine.
