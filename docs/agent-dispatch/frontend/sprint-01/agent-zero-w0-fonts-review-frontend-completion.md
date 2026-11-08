# ZERO: w0-fonts review-frontend, completion report

verdict: PASS

## Summary
Attempt a2 reviews only NEMI-02, as INT scoped it: commit 800cd50 (Nemi's 286d71d, cherry-picked onto main ab520cd) swaps `__root.tsx`'s IBM Plex Mono 500 preload for Mono 400, in the same link form as Inter's. It meets UI contract section 6 (revision 10's correction, still the rule in revision 12) and DL's `HashChip`, and it builds, typechecks, lints and tests clean. The size-matched fallbacks part of ZERO-02 (NEMI-03, ac820a7) isn't in this commit: INT is holding it, so I didn't review it and this verdict doesn't cover it.

## Pre-flight
- Part 2 files, in order. All read:
  1. `.claude/agents/zero.md`
  2. `codebase-analysis.md`
  3. `docs/ui-contracts/decisions-approval-page.md` (revision 12; section 6 and section 8 in full)
  4. `CR-W2 Pending decisions.md` (skimmed: nothing in it touches fonts)
  5. `decisions.md` (the "Fonts" entry, "Revision 10" and "Revision 11")
  6. Frontend Map v0.6 (line 289)
  7. Design library v1.1 (`HashChip`'s source, `dt`, at byte offset about 497,000)
  8. `Step 0 and Step 1 plan.md` (skimmed)
  9. Section 6's `__root.tsx` bullets
  10. This task doc
- Read first: `API and data reference.md` and `CR-16 Dispatch package contract.md` are both present. Nothing in either touches this diff.
- Branch: `frontend/sprint-01/agent-zero-w0-fonts-review-frontend-a2`, at 800cd50. `AVEL_BASE` = ab520cd = `main`.
- Part 7 commands: all available. The worktree had no `node_modules`, so I ran `pnpm install --frozen-lockfile` first. The lockfile didn't change.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE (judged by revision 10's form; see Deviations 2) | this report's commit |
| ZERO-02 | DONE for the preload swap (NEMI-02). The fallbacks part is out of scope (INT; Deviations 1) | this report's commit |

What I checked:
- **The diff** (`git diff ab520cd..800cd50`) is `apps/web/src/routes/__root.tsx`, +2 and -2:
  - the import at line 7, `ibm-plex-mono-400.woff2?url`;
  - the second link's `href` at line 53.
  - Everything else in the file is unchanged: Inter's preload, the stylesheet link, the theme cookie, the context and the shell.
  - `git diff 286d71d^ 286d71d | diff - <(git diff 800cd50^ 800cd50)` → no difference, so the cherry-pick is the same patch.
- **The link form** (`__root.tsx:51-57`): `rel: "preload"`, `as: "font"`, `type: "font/woff2"`, `crossOrigin: "anonymous"`. These are the same four fields as Inter's link at lines 44-50.
  - In the build, `dist/server/assets/router-*.js` holds exactly two `"preload"` links: `inter_variable_default` and `ibm_plex_mono_400_default`.
  - The only Plex file the server bundle references is `ibm-plex-mono-400-DMJ8VG8y.woff2`.
- **Mono 400 is the weight the first paint of `/` uses:**
  - **DL's `HashChip` (`dt`):** the chip's style object sets `fontFamily: "var(--av-font-mono)"` and no `fontWeight`. The only `fontWeight: 500` is on the prefix span, which is `var(--av-font-sans)`.
  - **The kit's copy:** `kit.css`'s `[data-ui="HashChip"]` sets no weight, so it inherits `body`'s `var(--av-weight-body)`, which is `400` (`tokens.css:398`). `.av-hash-prefix` is sans 500.
  - **Every other mono rule** in `kit.css` is weight 400 or unset (the Tag kbd and mono tones, `.av-err-code`), and `modules/` sets no mono family.
  - So Mono 500 isn't used on first paint, which matches section 6: "Mono 500 isn't preloaded".
- **`fonts.css`** still declares both Plex faces, 400 and 500. Section 6 asks for that ("loads Inter Variable and IBM Plex Mono"), and this diff doesn't touch it.
- **ZERO-02's Verify line:**
  - `grep` → `ibm-plex-mono-400.woff2` only. ✓
  - `tail -1 app.css` → `@import "./base.css";`. That's the expected state with NEMI-03 held: no `font-fallbacks.css` import yet.
  - The diff stat lists only `__root.tsx`.

## Findings
none

## Contract to files
- Section 6, "preloads … Inter Variable, and IBM Plex Mono 400 … Mono 500 isn't preloaded" (revision 10): `apps/web/src/routes/__root.tsx:7`, `:44-57`.
- Frontend Map v0.6 line 289 ("preloaded"): the same lines.
- Section 6's size-matched fallbacks (revision 11), section 8's CLS under 0.02, and font-fallbacks.css: not in this diff (NEMI-03 is held by INT).

## Deviations
1. **Scope narrowed by INT** (`[from INT]`, this session): "review NEMI-02 only".
   - So ZERO-02's fallback checks weren't done: the metrics recomputed by the formula, the inputs checked against the font files, the stacks, `tokens.css` unchanged, the `app.css` import, and the CLS re-run.
   - NEMI-03 (ac820a7, its CLS was 0.172) needs its own review once INT releases it.
2. **ZERO-01's wording is a1's, and revision 10 reversed it.** ZERO-01 asks for one Mono 500 preload and "no Mono 400 preload". Revision 10 makes it the other way round, and ZERO-02 says the same.
   - I judged the parts that still hold: one added Plex preload, in Inter's link form, nothing else changed in `__root.tsx`, and nothing outside the territory. The weight I checked against is revision 10's.
   - The plan should drop or reword ZERO-01 for any later attempt.
3. **No live check of the server's HTML.** This session isn't allowed to run local HTTP requests (both `curl localhost` and the dev server's output were denied), so I stopped the dev server.
   - Instead I checked the preload links in the built SSR bundle. I didn't run a browser "preloaded but not used" check.

## Limitations
- I didn't run the CLS measure. It belongs to the fallbacks, which aren't in this diff, and local HTTP is denied here anyway (Deviations 3).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** NEMI-03 (the fallbacks, ac820a7) still needs a review-frontend against section 6's "The size-matched fallbacks" once it's released. ZERO-01 in `plan.toml` is stale against revision 10 (Deviations 2).
- **Leah:** the Mono 400 preload is the fix for decisions-leah-04. It can be re-checked once this is merged.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-fonts-review-frontend-completion.md
```
(Before this commit, `git diff --name-only main...HEAD` listed only Nemi's `apps/web/src/routes/__root.tsx`, the commit under review.)

## Verification
```
$ pnpm --filter "@avel/web..." build
...
apps/web build: dist/client/assets/routes-rEFXJ-4c.js                 54.14 kB │ gzip:  19.20 kB
apps/web build: dist/client/assets/index-BNrD8qk7.js                 461.83 kB │ gzip: 143.88 kB
apps/web build: ✓ built in 1.27s
...
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.19 kB
apps/web build: ✓ built in 143ms
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
> biome check .
Checked 213 files in 155ms. No fixes applied.

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  196 passed (196)

$ grep -o 'ibm-plex-mono-[0-9]*.woff2' apps/web/src/routes/__root.tsx
ibm-plex-mono-400.woff2

$ tail -1 apps/web/src/styles/app.css
@import "./base.css";

$ git diff "$(git merge-base main HEAD)"..HEAD --stat     # before this report
 apps/web/src/routes/__root.tsx | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)

$ git diff --name-only main...HEAD                         # after this report
apps/web/src/routes/__root.tsx
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-fonts-review-frontend-completion.md
```
`__root.tsx` is the builder's commit under review (800cd50). The only path I wrote is my report, which is in Part 5.
