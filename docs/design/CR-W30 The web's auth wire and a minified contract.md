# CR-W30: The web's auth wire, the mock that serves it, and a minified contract (proposed)

Nov 17, 2026 · Zero, for Javaris · Axis's lane makes it · the frontend's sprint-12 (T-F12, T-F13) waits on it

Proposed, not yet accepted. The web never edits the contract or `contract-mock` (E2, I3), so this asks Axis's lane for three things. Without them, the frontend's wiring sprint can't start.

## Why

CR-W29's E14 term makes sign-in "the first ticket of the wiring sprint, before any screen talks to the API". Javaris's build order (Nov 17) puts the API client and the first live screens next, then sign-in, then the CLI login approval with step-up. Three gaps block all of it:

1. **`contract-mock` serves no auth.** It implements none of routes 1 to 7 and none of `/api/auth/*`. `docs/ui-contracts/login.md` section 5 specifies the auth mock, but it was never built.
2. **Neither the contract nor any doc defines the step-up wire.** Route 2 is marked `stepUp: true`, and its input is only `{ userCode }`. Nothing says which endpoint takes the password and returns a grant, what the grant looks like, or how route 2 carries it. That's the backend's step-up ticket to decide. The web needs it written down before it can draw the step-up dialog.
3. **No minified contract.** E16 says the data layer is built "from the minified contract". `packages/contract` exports only the full router, Zod schemas included. Measured on Nov 17 with esbuild, minified and gzipped:
   - today's client (`apps/web/src/data/client.ts`, one route group, full schemas) is about 24 KB;
   - the same oRPC client over a minified router is about 9 KB.

## What

| # | Change | Where | Owner |
| --- | --- | --- | --- |
| A | `contract-mock` serves `login.md` section 5 as written: sign-in, get-session, sign-out; the seeded operator; the lockout; `reset()`, `resetAuth()` and `recorded()` with the password redacted | `packages/contract-mock/**` | Axis's lane |
| B | The step-up wire, written once in the API reference and served by the mock: the endpoint that takes `{ password, action, target }` and returns a single-use grant (`{ grantId, expiresAt }`, 5 minutes); how route 2 carries it (a header or an input field: the backend's call); and the refusals (wrong password, used, wrong action or target, expired) with their contract error codes | the API reference; `packages/contract` only if route 2's input changes (I3: Zero signs off); `packages/contract-mock/**` | Axis's lane, with the backend's step-up ticket |
| C | `contract-mock` serves routes 1 to 7 (device logins, CLI sessions, health, doctor) from its world, with route 2 refusing without a valid grant (403 `STEP_UP_REQUIRED`) and route 5 idempotent | `packages/contract-mock/**` | Axis's lane |
| D | `packages/contract` exports a minified router (method, path, route number, `stepUp`; no schemas) for the web's client, generated from the router and checked to match it | `packages/contract/**` | Axis's lane |

## What doesn't change

- The web still adds no `better-auth` package (`login.md` section 0). It calls the auth endpoints with `fetch`, from one module.
- No money, no password on approvals (only credential actions step up), and agent and client text stays plain text (E15).
- The real server's auth stays the backend's sprint-03 work (Better Auth, step-up, CLI login). This CR only writes down the wire the web and the mock share, and the web tests against the mock first, then the real API (handoff, port order).

## Open questions

1. **B's carrier:** a header on route 2 (one rule for every step-up route later, such as secrets and repo connections), or a field in its input. Zero's recommendation is the header, because it changes no route's input. The backend's step-up ticket decides.
2. **Order inside Axis's sprint-03:** A and D don't depend on the real server, so they can land first. B and C follow the step-up design.

## Done when

- The web's e2e, under `AVEL_API=mock`, can sign in, read the session, sign out, step up with the mock's password, and approve a device login.
- `apps/web` can import the minified router from `@avel/contract`, and a test fails if the router and the minified copy disagree.
