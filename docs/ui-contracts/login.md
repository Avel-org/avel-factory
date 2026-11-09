# UI contract: sign-in (frontend sprint-02)

Zero, 2026-11-08. **Revision 1, for Brennan's one review.**
- **Scope:** sign-in for the one operator, the root guard, 401 handling and sign-out, built in `system` (FM: "`system`: Auth (sign-in, session) … `/login`, `/settings`").
- **Sources:**
  - FM v0.6: the `/login` row, line 188's guard, Errors (401) and Security;
  - the Step 0 and Step 1 plan: item 5 (Better Auth) and Rate limits;
  - DL v1.9: the step-up dialog `mh` and the 401 panel copy.
- **It runs on the mock first** (section 5). The real wire is escalation 04.
- **Decisions:** sprint-02's `decisions.md`. † copy is this contract's.

## 0. Rules

- **The wire.** `/api/auth/*` is Better Auth's and outside `@avel/contract` (API reference, "Three routes live outside the contract"). The web adds no `better-auth` package. `modules/system/api.ts` calls the three endpoints in section 1 with `fetch`, the only place outside `data/` that does, so screens still never call `fetch`.
- **The session lives in Better Auth's httpOnly cookie.** The web never reads, stores or logs the token or the password (FM, Security). Nothing goes in `localStorage` or a URL but `next`.
- **Values** come from DL's `mh` (the step-up dialog, drawn inline) or are tokens, with `mh` named in a comment. Copy is DL's where DL has it, or †.
- **Nothing moves at hydration.** `/login` is `ssr: true`, and the guard runs in `beforeLoad` on the server as well as the client.

## 1. The wire (Better Auth's email and password defaults; escalation 04)

| Call | Request | Answer the web reads |
| --- | --- | --- |
| Sign in | `POST /api/auth/sign-in/email`, JSON `{ email, password }` | 200 with `{ user: { id, email, name } }` and `Set-Cookie`. 401 with `code: "INVALID_EMAIL_OR_PASSWORD"`. 429 with `X-Retry-After` (seconds), for both the lockout and the rate limit |
| Session | `GET /api/auth/get-session` | 200 with `{ session: { id, userId, expiresAt }, user: { id, email, name } }`, or 200 with `null` when signed out |
| Sign out | `POST /api/auth/sign-out`, JSON `{}` | 200 with `{ success: true }`, and the cookie cleared |

- **The web reads only these fields.** Any other status is "something else went wrong" (section 3).
- **On the server,** `api.ts` forwards the incoming request's `cookie` header to `get-session`, at the request's origin (as `router.tsx` sets `baseUrl`), and nothing else.
- **`sessionQueryOptions`** (system's `index.ts`): key `["auth", "session"]`, `staleTime: Infinity`. It's invalidated on sign-in and on a 401. Sign-out clears the whole `QueryClient`.

## 2. The guard (`__root`, Leon's `routes/**`)

- **`__root`'s `beforeLoad`** awaits `ensureQueryData(sessionQueryOptions)` and puts `{ session }` in the route context (FM, State: "Session · Route context from Better Auth").
- **Signed out:** on any path but `/login`, it throws `redirect({ to: "/login", search: { next } })`. `next` is the path and search the visitor asked for, and is left out for `/`. On the server this is a redirect response, so the shell is never drawn signed out.
- **Signed in on `/login`:** a redirect to `next`, or to `/`.
- **`next` is safe or ignored.** `/login`'s `validateSearch` keeps it only if it starts with `/`, not with `//` or `/\`, and isn't `/login`. Otherwise it's dropped, and the target is `/`. No open redirect.
- **A failed session read** (network, 5xx) counts as signed out. `/login` then shows section 3's error on submit, not on load.
- **A 401 from any contract route** (FM, Errors: "401 · Redirect to `/login?next=`"):
  - `system` subscribes to the `QueryClient`'s query and mutation caches once, in `__root`'s component.
  - On a `signedOut` error (`data/errors.ts`), it invalidates the session and navigates to `/login?next={current path and search}&reason=expired`.
  - It does this once per 401 burst, and never while it's already on `/login`.
  - The approval page's own `SignedOutPanel` (AP) is unchanged, as the fallback if the navigation is slow.
- **No guard exemptions** but `/login`. There's no public page.

## 3. `/login` (`modules/system/screens/LoginScreen`, route `routes/login.tsx`)

**Outside `_shell`:** no sidebar, header or tab bar. The page is centred on `--av-page-bg`, with the card at `width: 100%; max-width: 420px` and `16px` side margins at 760px and narrower.

**The card:** `mh`'s inline look (`--av-float`, `--av-glass-blur-float`, `--av-radius-dialog`, `--av-shadow-faceplate`, `padding: 20px 24px 0`, `gap: 16px`), with its footer band (`--av-band`, `--av-hairline` top border, `padding: 12px 16px 12px 24px`).

**Markup, in order:**
1. **The brand:** the 32px mark and `AVEL`, as the rail head draws them, as text and not a link.
2. **`h1` `Sign in`**†, in `mh`'s title size (`--av-fs-title-lg`, `--av-lh-title-lg`, `--av-weight-title`).
3. **The expired notice,** only with `reason=expired`: a `role="status"` line with `StatusGlyph` `stopped`, `Signed out`, and DL's 401 copy `Your session ended. Sign in again to continue. Nothing you approved was lost.`
4. **The form,** `<form method="post" noValidate>`:
   - **`Email`:** `type="email"`, `autoComplete="username"`, `name="email"`.
   - **`Password`:** `type="password"`, `autoComplete="current-password"`, `name="password"`.
   - **The fields:** each has `mh`'s label (`--av-fs-label`, 500) and input (`height: max(40px, var(--av-control-h))`, `padding: 0 12px`, `--av-radius-control`, `--av-fs-body`). At 760px and narrower they're `height: 44px`†.
   - **Focus:** Email, on load. Password, if Email is pre-filled by the browser.
5. **The error,** when there is one: `mh`'s `role="alert"` line (`StatusGlyph` `stopped` at 10, `--av-stopped`, `--av-fs-label`), above the footer. The inputs it names get `aria-invalid` and `--av-stopped` borders.
6. **The footer:** one primary `Button` `type="submit"`, `Sign in`†. It's `busy` with `Signing in…`† while the request runs, and at 760px and narrower it's full width and 44px tall†.

**Not drawn:** a sign-up link, "forgot password", "remember me" or a passkey button (FM: "no sign-up form … Passkeys later").

**Document title:** `Sign in · AVEL`†.

**What a submit does:**

| Case | What the page does | Copy |
| --- | --- | --- |
| A field is empty | No request. Focus the first empty field; `aria-invalid` on it | `Enter your email and password.`† |
| 200 | Set the session's query data from the answer, then navigate to `next` or `/` with `replace` | none |
| 401 | Clear Password and focus it; `aria-invalid` on both | `That email and password don't match.`† |
| 429 with `X-Retry-After` | Keep both fields; the button stays enabled | `Too many attempts. Try again after {time}.`†, where `{time}` is now plus the header, as the operator's local `HH:MM` |
| 429 without it | The same | `Too many attempts. Try again later.`† |
| Anything else, or a rejected fetch | Keep both fields | `Couldn't sign in. Check your connection and try again.`† |

- **No countdown (†).** FM's 429 rule wants one, from the shared clock, which isn't built. The time stands in for it. The lockout's length is the server's.
- **One request at a time.** A second submit while `busy` does nothing.

## 4. Sign-out (Settings' `Account` section, in `system`)

- **Where:** Settings gets a second section below Appearance (`shell-layout.md` section 5 draws Appearance; this section is added by this contract, and `system`'s build draws both).
- **The section:** an `h2` `Account`†, the line `Signed in as {email}`† from the session, and a secondary `Button` `Sign out`†, `busy` with `Signing out…`†.
- **On 200:** `queryClient.clear()`, then navigate to `/login` with `replace` (no `next`).
- **On anything else:** stay, and draw `mh`'s alert line `Couldn't sign out. Try again.`†.
- **Back** after a sign-out reaches the guard, so it lands on `/login`.

## 5. The mock (Ghost, `packages/contract-mock/**`)

**What it serves:** section 1's three endpoints, beside the contract routes, in the same `fetch` (so the dev server's `/api/*` middleware serves them unchanged).
- **`fixtures.operator`:** `{ id: MOCK_OPERATOR_ID, email: "operator@avel.test", name: "Operator", password: "avel-mock-only" }`. This is a test value: the real password is never in the repo (Step 0 and Step 1 plan, item 5).
- **Sign in, right password:** a new opaque token, kept in memory. `Set-Cookie: better-auth.session_token=<token>; Path=/; HttpOnly; SameSite=Lax`. The body is `{ redirect: false, token, user }`.
- **Wrong email or password:** 401 with `{ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }`.
- **The lockout:** after 10 failures for that email within 15 minutes of the mock's `now()`, every sign-in for it, right or wrong, gets 429 with `X-Retry-After: {seconds left}` and `{ code: "TOO_MANY_ATTEMPTS", message: "Too many attempts" }`, until 15 minutes after the 10th failure (test 7: the 11th is locked out). The 5-a-minute rate limit isn't simulated.
- **`get-session`:** reads that cookie. A known token gives the session (`expiresAt` 12 hours after sign-in), and anything else gives `null`.
- **`sign-out`:** forgets the token and expires the cookie (`Max-Age=0`).
- **Not served:** sign-up, or any other `/api/auth/*` path (404).
- **Contract routes don't check the session.** Routes 8, 19 and 52 to 54 answer as now, so the shell work and its tests don't change. A 401 is tested with `failNext` (`{ status: 401, code: "UNAUTHORIZED" }`).
- **`reset()`** clears failure counts but keeps sessions, because e2e workers share one dev server and specs call `/__mock/reset`. `resetAuth()` also forgets every token, for unit tests.
- **`recorded()`:** lists auth requests with `route: null`, with the password replaced by `"[redacted]"`.

## 6. Owners and order

| Part | Owner | Territory |
| --- | --- | --- |
| Section 5 | Ghost, `auth-mock` build | `packages/contract-mock/**` |
| Sections 1 to 4: `api.ts`, `sessionQueryOptions`, `LoginScreen`, the Account section, `login.css`; `routes/login.tsx` and `__root`'s guard | Leon, `login` build | `modules/system/**`, `routes/**` |
| Section 7 | Fenn | `test/**`; `e2e/**` and `playwright.config.ts` |

- **The order:** Leon's build comes after the shell kit (`Button`'s `busy`, `StatusGlyph`), Ghost's mock and Fenn's tests, and before `system`'s shell build.
- **What's left for later:**
  - forwarding the cookie on every SSR contract call (`router.tsx`, the data core) waits for the real server, because the mock doesn't check it;
  - the CLI sessions list waits for route 4 (shell-layout.md section 5).

## 7. Scenarios (Fenn)

Tests are marked to fail until their build merges (procedures rule 1), with their LG ID.

**Unit (jsdom, against the mock in process):**
- **LG-01** `/login`'s markup: brand, `h1`, the two fields (label, `type`, `autoComplete`), the button, the title, and no link or other control.
- **LG-02** A submit: no request with an empty field and its copy; `busy` while pending; a single request; on 200, the session's query data is set and the page goes to a safe `next` or to `/`.
- **LG-03** `next`: `//evil`, `/\evil`, `https://x`, `/login` and none all go to `/`; `/missions?x=1` is kept.
- **LG-04** 401's copy, Password cleared and focused, and `aria-invalid`. 429 with and without `X-Retry-After` (with a fixed `now`). A rejected fetch and a 500.
- **LG-05** The guard: signed out on `/` and `/missions?x=1` goes to `/login` with the right `next`; signed in on `/login` goes to `next`; a failed session read counts as signed out.
- **LG-06** A 401 on a query and on a mutation: one navigation to `/login?next=…&reason=expired`, and the expired notice's copy.
- **LG-07** The Account section: the email, the button, `busy`, the cache cleared, `/login` on 200, and the error copy otherwise. Marked to fail until `system`'s build too.
- **LG-08** The mock (test/data): the seeded operator, the cookie, `get-session` before and after, sign-out, 401's body, the 11th attempt's 429 and `X-Retry-After`, `reset()` keeping sessions and `resetAuth()` dropping them, and the redacted password.

**End to end (Playwright, `AVEL_API=mock`):**
- **LG-20** Signed out, the server answers `/missions?x=1` with a redirect to `/login?next=%2Fmissions%3Fx%3D1`, and the page has no shell element. Sign in, land on `/missions?x=1`, and a reload stays signed in.
- **LG-21** At 390 and 1280: a wrong password's alert, then the right one. At 390, the fields and the button are 44px tall, with no sideways scroll.
- **LG-22** Sign out from Settings lands on `/login`, and Back lands there too. Marked to fail until `system`'s build.
- **LG-23** A `setup` project signs in once through the mock and saves `storageState`. Phone, 900 and desk use it, so every other spec runs signed in. The LG specs start from an empty state. Without it, the guard would send the whole suite to `/login`.
