# BRENNAN: login-uic review-spec, completion report

verdict: FAIL

## Summary
I reviewed `docs/ui-contracts/login.md` revision 1 (12856 bytes, at `a60a549`) once, before the build. Every value and string I checked matches `mh`, a token, DL's 401 copy, or is marked †. All 12 LG scenarios are present and each traces to a section. Three P1s block it:
- after a contract 401, `/login`'s own guard sends the operator back, so LG-06 can't pass;
- the `next` rule lets a tab or newline redirect off-site;
- following section 3 literally caches the session token, and the shape doesn't fit.

## Pre-flight
- **Part 2 files:** all 17 read. Each file the agent definition's Read first list names exists: the Backend plan, Roster, the API and data reference (I read its "outside the contract" item 6) and DATABASE.md (`auth_sessions`, line 364). I didn't read the DL HTML whole (1.9 MB, minified). I read `mh` (the step-up dialog), its footer band, the alert and the 401 entry of `TT` by offset.
- **Branch:** `frontend/sprint-02/agent-brennan-login-uic-review-spec-a1`, starting at `a60a549` (`AVEL_BASE` = HEAD). The diff from base was empty, so the work under review is commit `a60a549` itself (`git show a60a549`): `login.md`, escalation 04, `decisions.md` and the plan.
- **Part 7 commands:** all available once I ran `pnpm install --frozen-lockfile --offline` (the worktree had no `node_modules`).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE (faithful: no finding) | 7815722 |
| BRENNAN-02 | DONE (three P1s) | 7815722 |

**BRENNAN-01:** `grep -c 'av-stepup-pw\|Your session ended' '…v1.9.html'` gives `1` (the bundle is one line), and `wc -c login.md` gives `12856`, under 15 KB. What I checked against `mh` (offsets about 637,100 to 639,900):
- **The card:** `maxWidth: 420`, `--av-float`, `--av-glass-blur-float`, `--av-radius-dialog`, `--av-shadow-faceplate` when inline, `padding: 20px 24px 0` and `gap: 16`.
- **The title:** `--av-fs-title-lg`, `--av-lh-title-lg` and `--av-weight-title`.
- **The fields:** the label is `--av-fs-label` at weight 500. The input is `max(40px, var(--av-control-h))` with `0 12px` padding, `--av-radius-control`, `--av-fs-body`, and a `--av-stopped` border when invalid. Password has `autoComplete="current-password"`.
- **The alert:** `role="alert"`, `StatusGlyph` `stopped` at size 10, `--av-stopped` and `--av-fs-label`.
- **The footer band:** `--av-band`, a `--av-hairline` top border and `padding: 12px 16px 12px 24px`.

The rest:
- **The 401 copy:** DL's `TT[401]` is title `Signed out`, the body word for word, and glyph `stopped`.
- **Tokens:** `--av-page-bg`, `--av-float` and `--av-band` exist in `tokens.css`.
- **Strings:** every other string is marked †.
- **FM:** the `/login` row (no sign-up, passkeys later), line 188's guard, Errors 401, SSR `true` for Login, State (Session) and Security all match.
- **The Step 0 and Step 1 plan:** item 5 (one operator, a mock-only password, the lockout of 10 failures in 15 minutes) and test 7 (the 11th is locked out) match.
- **The 429 copy:** it departs from FM's countdown, and the departure is marked † and explained (line 78).

**BRENNAN-02:** `grep -n '^- \*\*LG-' login.md | wc -l` gives `12`. Each one traced:
- **LG-01:** section 3's markup and title.
- **LG-02:** section 3's submit table, and section 1.
- **LG-03:** section 2's `next`.
- **LG-04:** section 3's error rows.
- **LG-05:** section 2's guard and the failed read.
- **LG-06:** section 2's 401 path and section 3's notice.
- **LG-07:** section 4.
- **LG-08:** section 5.
- **LG-20:** sections 0 and 2, the SSR redirect.
- **LG-21:** section 3 at 390 and 1280.
- **LG-22:** section 4's Back.
- **LG-23:** section 7's setup.

Section 6's owners and order match the drafted `plan.toml` entries: Fenn's e2e comes after `auth-mock`, and Leon's `login` build comes after the kit, the mock and both test dispatches. The mock's lockout and sessions match section 5 and test 7. Two of the three findings sit here: `next` (02) and the token (03). Finding 01 (the 401 path) breaks LG-06.

## Findings
- `docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-01-401-bounces-off-login.md`: **P1**. After a contract 401, `/login`'s own guard sends the operator back, so the expired notice is never drawn and LG-06 can't pass.
- `docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-02-next-rule-allows-off-site.md`: **P1**. The `next` rule's prefix checks let a tab or newline send the operator off-site.
- `docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-03-token-reaches-the-cache.md`: **P1**. "Set the session's query data from the answer" puts the session token in the cache and the SSR HTML, and the shape doesn't fit.

## Contract to files
- **Sections 0 to 4** against FM v0.6 (lines 65, 140 to 149, 186 to 188, 216, 221, 265, 360 to 366), the Step 0 and Step 1 plan (lines 72, 94 to 95, 107) and DL `mh` and `TT`: BRENNAN-01 above, plus findings 01 to 03.
- **Section 1** against the code: `apps/web/src/router.tsx:28-35` (`baseUrl`, no cookie forwarding yet), `apps/web/src/data/errors.ts:67,126` (`signedOut`) and `apps/web/src/data/query.ts` (retries).
- **Section 2** against TanStack Query 5.107.1's `ensureQueryData` and `invalidateQueries`: finding 01.
- **Section 5** against `packages/contract-mock/src/mock.ts`: `MOCK_OPERATOR_ID`, `RecordedRequest.route: MockRoute | null`, `failNext` and `reset()`.
- **Section 7** against `apps/web/playwright.config.ts`: the projects, and `workers: 1`.

## Deviations
- **The diff:** it was empty because `AVEL_BASE` equals HEAD. I reviewed commit `a60a549`, which adds `login.md`, as the work.
- **The install:** I ran `pnpm install --frozen-lockfile --offline` so that Part 7's commands could run. It changes only the ignored `node_modules`.

## Limitations
- **Better Auth:** I didn't run it. The wire is a stand-in (escalation 04), so I judged only that the web reads section 1's fields. Finding 03's point that `get-session` returns `session.token` rests on `DATABASE.md:364`, not on a running server.
- **TanStack Router:** I didn't check how its `redirect`/`navigate` treat a `next` that carries a search string (see Issues).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
P3s, which don't block. For Zero to copy into `backlog.md`, and to consider for revision 2:
- **Zero / Axis (escalation 04):**
  - **The header name:** section 1 reads `X-Retry-After`, while FM line 221 and CR-W8 name `Retry-After`. Reading both would keep the copy working whichever one the server sends.
  - **The failure count:** section 5 doesn't say whether a right password resets it.
  - **The session length:** the mock's 12-hour `expiresAt` comes from CLI sessions (plan item 7). No web session length is written down.
- **Zero / Leon (section 3):**
  - **The footer:** mh puts its alert and footer band inside the `<form>`. Markup items 5 and 6 read as siblings of item 4, and a `type="submit"` button outside the form doesn't submit.
  - **Focus:** "Password, if Email is pre-filled by the browser" can't be detected on load (autofill values aren't readable before the user interacts with the page). Suggest Email always.
- **Leon (section 2):**
  - **The session read's retries:** with `data/query.ts`'s defaults (3 retries on network or server errors), a failed session read waits several seconds before it counts as signed out. Also, a caught failure cached as `null` with `staleTime: Infinity` stays signed out until the next sign-in. The contract should say which of the two it wants.
  - **Navigating to `next`:** use `href`, not `to`, for a value with a search string.
  - **The 401 burst:** "once per 401 burst" isn't defined. Suggest: until the navigation to `/login` settles.
- **Fenn:** no LG checks section 0's "no `better-auth` package, `fetch` only in `api.ts`", or `sessionQueryOptions`' key and `staleTime`.

## Files changed
```text
$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-01-401-bounces-off-login.md
docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-02-next-rule-allows-off-site.md
docs/agent-dispatch/frontend/sprint-02/findings/login-uic-brennan-03-token-reaches-the-cache.md
```

## Verification
```text
$ pnpm --filter "@avel/web..." build
apps/web build: dist/server/server.js   261.21 kB │ gzip: 63.20 kB
apps/web build: ✓ built in 135ms
apps/web build: Done
(exit 0)

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
(exit 0)

$ pnpm lint
> biome check .
Checked 213 files in 149ms. No fixes applied.
(exit 0)

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)
(exit 0)

$ git diff --name-only main...HEAD   # only paths from Part 5
(the four paths above, all in Part 5)
```
