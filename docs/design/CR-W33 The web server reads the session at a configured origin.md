# CR-W33: the web server reads the session at a configured origin

Nov 21, 2026 · drafted by Zero · **accepted Nov 21** (Javaris, to OSA: "Option b"). It's from Axis's G7 second review of T-F12 (#102), which raised t-f12-fenn-01 to P1. Under option B, T-F12 merged with the P1 accepted until **T-F15** fixes it. The fix must land before the web is served anywhere beyond localhost.

**What:**
- **The rule:** every call the web server makes to `/api` while it renders goes to one configured origin, `AVEL_API_ORIGIN`, and never to an origin taken from the request. Today the only such call is the guard's session read (`get-session`, with the caller's cookie forwarded).
- **The browser is unchanged:** it calls `/api` on its own origin, as before.
- **`AVEL_API_ORIGIN`:**
  - It's set on the web server. In production it's required.
  - When it's missing or isn't an absolute `http(s)` origin, every session read fails, so every visitor counts as signed out (fail closed). The server logs that once, with no values.
  - In vite dev and vite preview, it's the server's own configured origin: what the Playwright web servers and the preview specs start with, or for a person's `vite dev`, the host and port Vite resolved.
- **`safeNext(raw, origin)` still takes the request's origin.** There the origin is only compared with `next`'s, never fetched, so a forged Host can only make `next` fall back to `/`.

**Why:**
- login.md section 1 says `api.ts` forwards the cookie to `get-session` "at the request's origin (as `router.tsx` sets `baseUrl`)". That origin is built from the Host header.
- **Guard bypass:** a request with `Host: attacker.example` makes the web server fetch that host, and an answer shaped like `{ session, user }` makes the guard draw the control room. That breaks section 2's "the shell is never drawn signed out".
- **SSRF:** an internal Host makes the server probe internal addresses, up to the 10 s timeout each.
- **No leak today:** no data leaks, because a browser can't send someone else's cookie to a spoofed host, and the API checks the real session on every data call. But it fails the security checklist's "every input is validated before use", and every later server-side read that copies the pattern would inherit it.
- Axis rated it P1 (G3: a broken rule). Javaris chose option B: T-F12 (#102) merges as it is, and T-F15 fixes it.

**Touches:**
- **`docs/ui-contracts/login.md` section 1:** "at the request's origin (as `router.tsx` sets `baseUrl`)" becomes "at `AVEL_API_ORIGIN`, the web server's configured API origin (CR-W33)". This CR overrides the line until login.md is next revised (I1).
- **T-F15 (frontend sprint-13, now full rigor):** by an amendment with this CR. The guard reads at `AVEL_API_ORIGIN`, with a test that a forged Host gets no request. The dev and preview servers set it.
- **`.env.example`:** gains `AVEL_API_ORIGIN` with no value. Javaris adds it (E6).
- **The backend:** nothing. The API's own Better Auth origin checks are unchanged.

**Decided:** accepted with option B. The fix is in T-F15, and the web isn't served beyond localhost until T-F15 merges.
