# ZERO: w0-kit review-frontend, completion report

verdict: PASS

## Summary
This is a2. Per INT, I reviewed only Fantem's w0-kit a2, the third task: the kit's styles moved to `apps/web/src/kit/kit.css`, with `kitStylesheetHref` exported (UI contract revision 7, section 4, "The kit's styles"). Head d3535b1 on `frontend/sprint-01/agent-fantem-w0-kit-build-a2` (code 4f0cf1c), base 3bf5e3b. a1 is merged and was reviewed, so I didn't review it again.

The kit no longer writes CSS in JS and renders no `<style>`, and `KitStyles.tsx` is gone. Going rule by rule, every value in `kit.css` is the one the old inline style object or `KitStyles` string carried, and each cascade outcome is the same. The 68 locked kit tests pass unchanged. There are no findings. One contract gap is mine: D12's stamp animation must stay inline, and section 4's list doesn't name it.

## Pre-flight
- **Part 2 files:** all read, none missing: `.claude/agents/zero.md`, `codebase-analysis.md`, `docs/ui-contracts/decisions-approval-page.md` (section 0, section 4 in full including "The kit's styles", section 8), `CR-W2 Pending decisions.md`, `decisions.md` ("Revision 7" in full), the Frontend Map v0.6, the design library, the Step 0 and Step 1 plan, and this task doc. I also read w0-kit's plan entry (a2 note and third task) in `plan.toml`.
- **Branch:** `frontend/sprint-01/agent-zero-w0-kit-review-frontend-a2`, start commit e4674f0 (main), `AVEL_BASE` e4674f0.
- **The session wasn't checked out at the builder's commit.** HEAD equalled `AVEL_BASE`, so `git diff "$base"..HEAD` was empty. INT then named the work: `git diff main...frontend/sprint-01/agent-fantem-w0-kit-build-a2`. I reviewed that diff. I ran the commands in a throwaway detached worktree at d3535b1 under my scratchpad, which I removed afterwards (see Deviations).
- **Part 7 commands:** all available in that worktree after `pnpm install --frozen-lockfile --prefer-offline`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE (a2 scope: the third task only) | this report's commit |

ZERO-01 verify, run at d3535b1:
```
$ pnpm --filter @avel/web exec vitest run test/kit
 Test Files  3 passed (3)
      Tests  68 passed (68)
$ ! grep -rn '@orpc\|@tanstack/react-router\|#[0-9a-fA-F]\{6\}' apps/web/src/kit; echo "exit $?"
exit 0          (nothing listed)
$ ! grep -rlE '<style|KitStyles|dangerouslySetInnerHTML' apps/web/src/kit; echo "exit $?"
exit 0          (nothing listed: Fantem's task 3 check)
$ git diff --stat 965071b frontend/sprint-01/agent-fantem-w0-kit-build-a2 -- apps/web/test/kit
(empty: the w0-kit lock in locks.md is intact)
```

## Findings
none

## Contract to files
- **One static stylesheet** (section 4, "Where they live"): `apps/web/src/kit/kit.css` (934 lines). It has DL's "Overlays: Dialog" rules and its field-anatomy textarea rules as they were in `KitStyles`. Each component's former style objects are now class or `[data-ui]` rules. Per-render state reaches the CSS through data attributes: `data-variant`, `data-size`, `data-block`, `data-icon-only`, `data-hovered`, `data-pressed`, `data-tone`, `data-copy`, `data-copied`, `data-strike`, `data-compact`, `data-stopped`, `data-layout`, `data-state`, `aria-invalid`.
- **How it's loaded** (section 4): `kit/index.ts:7` `import kitStylesheetHref from "./kit.css?url"`, and `index.ts:23` exports it by name. Typecheck passes, so the `?url` import resolves.
- **No CSS in JS** (section 4): `KitStyles.tsx` is deleted, and its two users (`Dialog.tsx`, `DecisionTag.tsx`) no longer import it. `git grep 'style='` over the kit on the branch lists only three lines:
  - `DecisionTag.tsx:197`: D11's phone grid, read by the locked UC-08 (`decision-tag.test.tsx:307,310`).
  - `DecisionTag.tsx:298`: D6's version strike, inline `text-decoration`, read by the locked UC-08.
  - `DecisionTag.tsx:357`: D12's stamp animation, `av-stamp-land var(--av-d-punch) var(--av-ease) 80ms both`. It stays inline because the locked UC-08 at `decision-tag.test.tsx:95-97` checks `card.outerHTML` for `--av-d-punch`. That follows the contract's rule ("the values the locked kit tests read from the element"). The contract's list of examples leaves it out: see Issues.
- **Values unchanged** (section 0). I checked each moved declaration against the removed inline value, and each override against the old conditional, by specificity and source order:
  - **Button:**
    - **Size, variant and icon-only order:** the old ternaries ran icon-only, then link, then segment or sm, then lg, then md. The rules now come in size, link, segment, icon-only order, all at equal specificity (`kit.css:304-329`). So the same one wins.
    - **Hover versus press:** the old chain was disabled, then pressed, then hovered and not sheen, then rest. In CSS, `:disabled` (0,2,0) beats the variant rules because it comes later. Hover and press both carry `:not(:disabled)`, at (0,3,0) each, and press comes later (`:356`, `:365`). So the same one wins.
    - **Disabled shadow:** `none` for link, ghost and segment (`:382-388`, at (0,3,0)), and the hairline for the rest.
    - **Sheen:** `position` and `isolation` apply only when the button is primary or danger and enabled (`:336`). The sheen's opacity follows hovered and not pressed (`:350`).
    - **Link underline:** hovered link only (`:362`, at (0,3,1), over `button[data-ui=Button]`'s `none`).
    - **Segment:** never translates (`:370`), and its hover colour is ink (`:359`).
  - **D9's anchor:** it has `data-ui="Button" data-variant="link"` (`DecisionTag.tsx:172-174`), so it takes link's padding, min-height and colour. It gets no `text-decoration` rule, as before. `a[data-ui][data-variant]` (0,2,1) keeps its colour and offset over base.css's `a:hover`.
  - **Tag:** a tone's own height, padding and font size beat `size="sm"`, as `s.h || …` did, because the tone rules come after `:441` at equal specificity. `count` alone gets `justify-content: center`. `estimated` and `unconfigured` get dashed borders. An unknown tone falls back to neutral's variables.
  - **HashChip:** the copy padding is applied on `data-copy`, including on the null `—` chip, as before. `strike` is `[data-strike]`, and no locked test reads it (Fantem's Deviation 2).
  - **ReasonDialog:** the error edge was an inline `borderColor`, which beat `:hover` and `:focus-visible`. It's now `textarea[aria-invalid="true"]` at the same (0,2,1), placed after both (`kit.css:163`). `ReasonDialog.tsx:95` sets `aria-invalid` exactly when `error` is set.
  - **WidgetState:** loading's `flex-start` and staleVersion's row overrides sit at (0,2,0) over `.av-ws-frame`. The skeleton widths match the old `i === 0 ? 42% : i % 2 ? 86% : 64%`: `:first-child` gives 42% and 22px, `:nth-child(even)` gives 86%, and the rest get 64%.
  - **DecisionTag:**
    - **Phone values:** inset 18 against 16, head gap 8 with wrap, facts in one column with row-gap 2, and dt margin-top 4 and 8, all on `data-layout="phone"`.
    - **Approved title:** `padding-right: 96px`.
    - **Hover lift:** applies only when the card isn't done (`:749`).
    - **Hole fill:** DL's 160ms, and `none` under reduced motion (D12).
  - **Icon and StatusGlyph:** the svgs carry `data-ui="Icon"` (`Icon.tsx:63`) and `data-ui="StatusGlyph"` (`StatusGlyph.tsx:32`), so `[data-ui=Icon],[data-ui=StatusGlyph]` still gives them `flex: none; display: block`.
- **No hex, no new literals:** the grep above lists nothing. The literals in `kit.css` are those the removed code had (DL's), and Biome reprinted `.985` as `0.985`.
- **Plain props, no oRPC or router import:** grep above. No prop changed, apart from the `ButtonVariant` union now being written out, with the same nine members.

## Deviations
1. **Scope:** only the a2 diff (the third task), as INT's message said. a1 was reviewed and merged (6aeb690).
2. **Where I ran the commands.** The session started at main, not at the builder's result commit, and Part 1 forbids switching branches. So I ran every verification in a detached worktree at d3535b1, which I made with `git worktree add --detach` in my session scratchpad and removed when I was done. My own branch never moved.
3. **What Part 7's last command shows.** `git diff --name-only main...HEAD` is run on my branch, so it lists my report only. Fantem's files are listed in Files changed under "reviewed".

## Limitations
- **I didn't repeat Fantem's browser comparison.** Fantem reports 0 computed-style differences over 5,139 elements and 246 hover and press snapshots. The harness wasn't committed, so I couldn't re-run it. My check is the rule-by-rule cascade reading above, and it agrees.
- **Hover and press at sizes other than md** weren't in Fantem's comparison. By my reading the size rules don't interact with the state rules: the states set only background, colour, shadow, transform and text-decoration, and the sizes set only height, padding and font size.
- **Selector scope (an observation, not a finding).** A few DecisionTag rules key on an ancestor attribute: `[data-layout="phone"] .av-dt-head`, `.av-dt-facts` and `[data-state="approved"] .av-dt-title`, rather than `[data-ui="DecisionTag"][data-layout="phone"] …`. Nothing outside the card uses `data-layout` or `data-state="approved"` today: `git grep data-layout main -- apps/web/src` is empty, and so is Leon's a1 branch's `modules`. If a page later sets `data-layout="phone"` on a wrapper, a desk card inside it would get the phone values.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **ZERO (me), next contract revision:** add D12's stamp animation (inline `animation` naming `--av-d-punch`, read by the locked UC-08 at `decision-tag.test.tsx:95-97`) to section 4's "What stays inline" list, beside D11 and D6. This is Fantem's Deviation 1, and I accept it.
- **INT and Leon:** once a2 merges, the kit draws unstyled until something links `kitStylesheetHref`. That's Leon's decisions a2 (section 5, "Styles and loading"). No page on main draws the kit yet: main has no `apps/web/src/modules`.
- **Leah and INT:** Fantem's report, Limitations, says the client `index-*.js` reads 155.40 kB gzip after `pnpm --filter "@avel/web..." build`, against 127.47 kB before `packages/contract/dist` existed. My build at d3535b1 is consistent with that. The kit isn't in that chunk. So check which `@avel/contract` build the budget run resolves: it's near the 160 kB limit before the page is added.
- **Full web suite:** 37 tests fail, all in `test/modules/decisions/**` (locked UC-11 to UC-28). They fail with "screens.ts should export the screen as DecisionsScreen", because the module isn't on main yet. That's expected and not caused by this diff.

## Files changed
`git diff --name-only main...HEAD` on my branch:
- `docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md`

Reviewed, on Fantem's branch (`git diff --name-only main...frontend/sprint-01/agent-fantem-w0-kit-build-a2`): `apps/web/src/kit/{Button,DecisionTag,Dialog,ErrorPanel,HashChip,Icon,ReasonDialog,StatusGlyph,Tag,WidgetState}.tsx`, `apps/web/src/kit/KitStyles.tsx` (deleted), `apps/web/src/kit/index.ts`, `apps/web/src/kit/kit.css` (new), and Fantem's completion report.

## Verification
All run at d3535b1 (see Deviations 2), apart from the last command.

```
$ pnpm --filter "@avel/web..." build
exit 0
apps/web build: dist/server/assets/router-Dvq-asiP.js        27.35 kB │ gzip:  9.27 kB
apps/web build: dist/server/server.js                       261.19 kB │ gzip: 63.18 kB
apps/web build: ✓ built in 176ms
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
exit 0
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
exit 0
> biome check .
Checked 197 files in 121ms. No fixes applied.

$ pnpm --filter @avel/web test
exit 1
 Test Files  3 failed | 10 passed (13)
      Tests  37 failed | 153 passed (190)
(all 37 in test/modules/decisions/{list,deciding,errors}.test.tsx:
 "apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen";
 the module isn't on main. test/kit: 68/68 pass.)

$ git diff --name-only main...HEAD     # on my branch
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md
```
