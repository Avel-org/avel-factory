# BRENNAN: w0-kit review-spec, completion report

verdict: PASS

## Summary
I reviewed attempt a2 of Fantem's w0-kit, FANTEM-03 only, as INT directed: head d3535b1 on `frontend/sprint-01/agent-fantem-w0-kit-build-a2`, code 4f0cf1c, based on 3bf5e3b. a1 is merged and reviewed, so I didn't review it again.

The kit's styles now live in `apps/web/src/kit/kit.css`, exported as `kitStylesheetHref`, as UI contract revision 7 section 4 ("The kit's styles") and Decisions "Revision 7" require:
- `KitStyles.tsx` is gone.
- No `<style>` element and no CSS strings remain.
- Every value is unchanged.
- The locked UC-08 to UC-10 pass unchanged.

One P3 finding, against the contract's wording rather than the build: section 4's inline list leaves out D12's stamp animation, which the locked UC-08 forces inline.

## Pre-flight
- **Part 2 files:** all present and read:
  - `.claude/agents/brennan.md` (Learned: none)
  - `codebase-analysis.md`
  - `decisions-approval-page.md`: revision 7, with sections 0, 4 and 8 read in full
  - `CR-W2 Pending decisions.md`: skimmed. a2 changes where values live, not what they are.
  - `decisions.md`: "Revision 7" read in full
  - Frontend Map v0.6: skimmed for its styles and budget lines (280, 383, 423, 439)
  - the design library: not re-read in full. a1's values were reviewed against it, and a2's are checked against a1 below.
  - `Step 0 and Step 1 plan.md`: skimmed
  - this task doc
- **Branch:** `frontend/sprint-01/agent-brennan-w0-kit-review-spec-a2`, start commit e4674f0 (main).
- **Part 7 commands:** all available. I ran them at d3535b1 in a temporary detached worktree, `git worktree add --detach`, removed afterwards. That's under Deviations.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | this report's commit |

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-brennan-01-stamp-animation-not-in-inline-list.md`: P3. Section 4's "What stays inline" list leaves out D12's stamp animation, which the locked UC-08 needs inline. The build is accepted, and the contract text needs amending (Zero).

## Contract to files
- **Section 4, "Where they live"** (one static stylesheet, class and `[data-ui]` rules, values unchanged): met by `apps/web/src/kit/kit.css`. I checked it three ways:
  - **Tokens:** every `--av-*` and `--color-*` token in kit.css appears in main's kit (3bf5e3b). None is new.
  - **Literals:** every numeric literal in kit.css (57 checked, by script) appears in main's kit. The one exception is `0.985`, which was `.985` in `KitStyles.tsx` and was reformatted by Biome (Fantem's Deviation 5).
  - **Cascade, read by hand.** These rules still give the inline styles' outcome:
    - Button: hover against press against disabled, through `:not()` specificity and order; size against link, segment and icon-only padding; the sheen variants' hover.
    - Tag: each tone overrides `sm`.
    - The skeleton's widths: `nth-child(even)` stands for 0-based odd `i`.
    - DecisionTag: hover isn't applied when done.
    - The error edge on the ReasonDialog field comes after `:hover` and `:focus-visible`.
    - The D9 anchor's colour beats base.css `a:hover`.
- **Section 4, "How it's loaded":** `apps/web/src/kit/index.ts:6,21` imports `./kit.css?url` and exports it as `kitStylesheetHref`.
- **Section 4, "No CSS in JavaScript":** `KitStyles.tsx` is deleted. `grep -rlE '<style|KitStyles|dangerouslySetInnerHTML' apps/web/src/kit` lists nothing (exit 1). Nothing outside the kit imported `KitStyles` or `LINK_BUTTON_STYLE`.
- **Section 4, "What stays inline":** three places, at `DecisionTag.tsx`:
  - line 197: D11's grid, in the contract;
  - line 298: D6's strike, in the contract;
  - line 357: D12's stamp animation, not in the contract's list. It's needed by the locked UC-08, `apps/web/test/kit/decision-tag.test.tsx:97`. That's finding 01, and Fantem's Deviation 1.
- **Locked UC-08 to UC-10:** `apps/web/test/kit/**` is unchanged, and 68 of 68 pass.
- **Territory:** `git diff --name-only main...frontend/sprint-01/agent-fantem-w0-kit-build-a2` lists only `apps/web/src/kit/**` and Fantem's report.

## Deviations
- **I reviewed a different commit from the one this session was checked out at.** The session started at e4674f0 (main), not at Fantem's result commit, so `AVEL_BASE..HEAD` was empty. Fantem's a2 branch is based on 3bf5e3b, and main has since moved to e4674f0. INT then named the work: d3535b1, reviewed as the diff `main...frontend/sprint-01/agent-fantem-w0-kit-build-a2`. I read it there.
- **I ran the verification commands at d3535b1 in a temporary detached worktree** under my scratchpad, removed afterwards. My own branch has only docs, so commands run here would test main, not the work under review. I didn't switch branches, and I changed no code.

## Limitations
- **I didn't repeat Fantem's browser computed-style comparison** (5,139 elements, 0 differences). My parity check is the token and literal scripts plus a by-hand read of the cascade.
- **The kit draws unstyled until the page links `kitStylesheetHref`.** That's Leon's decisions a2 (section 5, "Styles and loading"). No page on main draws the kit yet.
- **The JS budget wasn't checked here:** it's Leah's. Fantem's library-mode figures (kit 11,096 to 7,527 B gzip) weren't reproduced.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero:** amend section 4's "What stays inline" list to include D12's stamp animation (finding 01).
- **Leon (decisions a2):** link `kitStylesheetHref` from route `/`'s `head` (section 5). Without it, the kit draws unstyled.
- **Fenn:** if UC-29's inline-selector count covers the kit's inline styles, allow for the stamp's (finding 01).
- **INT:** `pnpm --filter @avel/web test` exits 1 at d3535b1. All 37 failures are the locked decisions tests:
  - `deciding`: 7
  - `errors`: 16
  - `list`: 14

  They fail because `apps/web/src/modules` doesn't exist yet. That's Leon's, not the kit's.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-kit-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-brennan-01-stamp-animation-not-in-inline-list.md
```

## Verification
At d3535b1, in a detached worktree. `pnpm install --frozen-lockfile --offline` ran clean first.
```
$ pnpm --filter "@avel/web..." build
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/index-SlPnXw7v.js                 496.83 kB │ gzip: 155.40 kB
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.19 kB
apps/web build: Done
exit 0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract-mock typecheck: Done
apps/web typecheck: Done
exit 0

$ pnpm lint
> biome check .
Checked 197 files in 223ms. No fixes applied.
exit 0

$ pnpm --filter @avel/web exec vitest run test/kit        # BRENNAN-01's verify
 Test Files  3 passed (3)
      Tests  68 passed (68)
exit 0

$ pnpm --filter @avel/web test
      Tests  37 failed | 153 passed (190)
exit 1
   7  FAIL  test/modules/decisions/deciding.test.tsx
  16  FAIL  test/modules/decisions/errors.test.tsx
  14  FAIL  test/modules/decisions/list.test.tsx
$ ls apps/web/src/modules
ls: cannot access 'apps/web/src/modules': No such file or directory
```
None of the failures is the kit's: the decisions module isn't built yet.

On this branch:
```
$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-kit-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-brennan-01-stamp-animation-not-in-inline-list.md
```
