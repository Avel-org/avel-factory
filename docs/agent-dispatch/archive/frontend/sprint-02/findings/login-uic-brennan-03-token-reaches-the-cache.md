status: open
severity: P1
owner: Zero (login.md sections 1, 3 and 5, LG-02 and LG-08), then Leon (api.ts) and Ghost (the mock)

# login-uic-brennan-03: "set the session's query data from the answer" puts the session token in the cache and the SSR HTML, and the shape doesn't fit

## What the contract says
- `login.md:15`: "The web never reads, stores or logs the token or the password (FM, Security)."
- `login.md:23`: sign-in's 200 is `{ user: { id, email, name } }`. `login.md:24`: the session is `{ session: { id, userId, expiresAt }, user }`.
- `login.md:27`: "The web reads only these fields." Nothing says `api.ts` drops the rest.
- `login.md:72`: on 200, "Set the session's query data from the answer".
- `login.md:93`: the mock's sign-in body is `{ redirect: false, token, user }`.
- `login.md:33`: the guard runs on the server, so the session query is dehydrated into the page's HTML (FM, Rendering and SSR: `setupRouterSsrQueryIntegration`).

## Why the build goes wrong
1. **The token gets stored.** Following line 72 literally puts the mock's sign-in body, `token` included, into the `QueryClient`. That breaks line 15. Better Auth's real answers carry the token too: `auth_sessions` stores `token` in plain text (`docs/design/DATABASE.md:364`), and that row is what `get-session` returns as `session`. A raw `get-session` answer is then dehydrated into every SSR page, where any script can read the token, which undoes the httpOnly cookie (FM, Security: "nothing secret in localStorage or URLs").
2. **The shapes don't match.** Sign-in's answer has no `session` object, so "set the session's query data from the answer" has to make up `session.id`, `userId` and `expiresAt`, or cache a value of the wrong type. Leon and Fenn (LG-02: "the session's query data is set") can each pick a different reading.
3. **No test would catch it.** The mock's `get-session` (line 96) has no `token`, and no LG asserts that one is absent.

## Evidence
```text
$ grep -n 'token' docs/ui-contracts/login.md
15:- **The session lives in Better Auth's httpOnly cookie.** The web never reads, stores or logs the token or the password (FM, Security). …
93:- **Sign in, right password:** a new opaque token, kept in memory. `Set-Cookie: …`. The body is `{ redirect: false, token, user }`.
96:- **`get-session`:** reads that cookie. A known token gives the session …
$ sed -n 364p docs/design/DATABASE.md
auth_sessions    { user_id → users, token, expires_at, ip_address?, user_agent? }
```

## What fixing it means
- **Section 1:** `api.ts` builds each answer from section 1's named fields only: `{ session: { id, userId, expiresAt }, user: { id, email, name } }` or `null`. Anything else in the body, `token` included, is never returned, cached or logged.
- **Section 3:** on 200, either refetch the session (`fetchQuery` with `staleTime: 0`) and then navigate, or name the exact value that's set. Don't set it from sign-in's answer.
- **Section 5:** the mock's `get-session` adds `token` (and one other unnamed field) to `session`, as Better Auth does.
- **LG-02 and LG-08:** assert that the cached session, and the SSR HTML for LG-20, contain no `token`.
