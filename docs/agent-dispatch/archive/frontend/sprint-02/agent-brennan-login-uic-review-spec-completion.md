# BRENNAN: login-uic review-spec, completion report (round 2, a2)

verdict: PASS

## Summary
I reviewed `docs/ui-contracts/login.md` revision 2 (14988 bytes, at `4012ac7`) in round 2. Round 1's three P1s are closed and nothing new at P0 or P1 came in. Nothing else is raised, so there are no new findings.

## Pre-flight
- **Part 2 files:** all read (the DL HTML by offset, as in a1). None missing.
- **Branch:** `frontend/sprint-02/agent-brennan-login-uic-review-spec-a2`, starting at `4012ac7`. The diff from base was empty, so I reviewed the file at HEAD against a1's findings.
- **Part 7 commands:** all available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE (no change from a1; revision 2 touches no value or string) | this report |
| BRENNAN-02 | DONE (all three P1s closed) | this report |

**Round 1 closure:**
- **01 (401 bounce): closed.** Section 2 (lines 46-52) sets the session query data to `null` before navigating, so `/login`'s guard reads `null` from the cache, draws the expired notice, and makes no session or contract call. A flag and the "not already on /login" check keep it to one navigation. A fresh load rereads the session. LG-06 (line 136) now tests the cached `null`, one navigation, the notice, and no second session request.
- **02 (`next` off-site): closed.** `safeNext(raw, origin)` (lines 37-44) rejects control characters (tab, newline, CR), anything not starting with a single `/`, and any URL whose parsed origin differs, so `/\evil` fails on the origin check. It also rejects `/login`, and it redirects to the parsed `pathname + search + hash`. One function serves `validateSearch`, the signed-in redirect and post-sign-in. LG-03 (line 133) covers `//evil`, `/\evil`, `https://x`, the tab, newline and CR cases, `/login`, the length cap and a kept `/missions?x=1#a`.
- **03 (token in the cache): closed.** `api.ts` builds answers from named fields only (line 27), sign-in is read for status and the session is refetched (line 82), and the mock's `get-session` carries `token` so tests can see it dropped (line 106). LG-02 and LG-08 assert it, and LG-20 checks the HTML for the cookie value and a `"token"` key.

**BRENNAN-02 checks:** `grep -n '^- \*\*LG-' login.md | wc -l` gives 12, each traced to a section (LG-01 s3, 02 s1/s3, 03 s2, 04 s3, 05 s2, 06 s2, 07 s4, 08 s5, 20 s2/s3, 21 s3, 22 s4, 23 s5/s6). The mock's lockout (10 failures in 15 minutes, 429 with `X-Retry-After`) matches the plan's item 5 and test 7. Owners and order in section 6 stay in their territories.

## Findings
none. Round 1's three findings (`login-uic-brennan-01`, `-02`, `-03`) are closed by revision 2: Zero can set their `status` to closed.

## Contract to files
- `docs/ui-contracts/login.md` (sections 0 to 7): reviewed whole.
- `docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec-completion.md`: this report.

## Deviations
none.

## Limitations
I didn't read the 1.9 MB minified DL HTML whole. I checked `mh` and the 401 copy by offset in a1 and by grep now.

## Parked chains
none.

## P0 discoveries
none.

## Issues for other agents
- **Zero (P3, for backlog.md):** `login.md` is 14988 bytes, 372 bytes under the 15 KB (15360) budget. Any later revision has to cut as it adds.
- **Leon:** in `safeNext`, use the same `origin` on the server as `router.tsx`'s `baseUrl`, or rule 4 would reject every `next` during SSR.

## Files changed
`git diff --name-only main...HEAD`:
docs/agent-dispatch/frontend/sprint-02/agent-brennan-login-uic-review-spec-completion.md

## Verification
- `grep -c 'av-stepup-pw\|Your session ended' '…v1.9.html' && wc -c docs/ui-contracts/login.md` → `1`, `14988`
- `grep -n '^- \*\*LG-' docs/ui-contracts/login.md | wc -l` → `12`
- `pnpm --filter "@avel/web..." build` → built, Done
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck` → both Done
- `pnpm lint` → Checked 213 files, no fixes applied
- `pnpm --filter @avel/web test` → 14 files, 197 tests passed
- `git diff --name-only main...HEAD` → only this report
