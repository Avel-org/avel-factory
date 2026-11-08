# Activation prompts: frontend sprint-02

Every activation prompt in this package, archived (CR-16). Each is also the last section of its task doc.

## agent-brennan-shell-uic-review-spec

```text
You are BRENNAN on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-brennan-shell-uic-review-spec. Branch: frontend/sprint-02/agent-brennan-shell-uic-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-brennan-shell-uic-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Design: every class, value, breakpoint, label, icon and copy string the shell contract gives as DL's is DL's, and every departure is in section 2's S1 to S8 or marked †, with a reason
- BRENNAN-02: Routes and territory: section 3's routes, nav ids and stubs follow FM's route table and folder layout; each build's territory is one FM row (a module plus its route files, as in sprint-01); section 0's deferrals each name a wave that exists in FM's build order
- BRENNAN-03: Testable as written: SH-01 to SH-24 cover sections 1 to 6; revision 15's D16, marker and UC-32 are consistent with the shell (section 4); the budget rule and the conditional cut in section 6 are unambiguous

You may change only: docs/agent-dispatch/frontend/sprint-02/agent-brennan-shell-uic-review-spec-completion.md, docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-brennan-shell-uic-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fenn-shell-test-unit

```text
You are FENN on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-fenn-shell-test-unit. Branch: frontend/sprint-02/agent-fenn-shell-test-unit-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: SH-01 to SH-07: AppShell (brand, nav, current item, badge, sheet focus and inert, focus mode, skip link, tab bar) and ScreenHeader, and SH-06's kit.css rules read as text
- FENN-02: SH-08 to SH-11: ShellLayout on the contract mock (section 3's table, tabs, badge rule with fixtures.step1, 50+ and failNext, current id, crumb and title by route) and PlannedScreen's copy
- FENN-03: The approval page's tests for app-shell.md section 4: the header is ScreenHeader (data-ui, eyebrow Home, h1 Decisions, the lead), and nothing else in the decisions tests changes

You may change only: apps/web/test/**, docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-unit-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fenn-shell-test-e2e

```text
You are FENN on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-fenn-shell-test-e2e. Branch: frontend/sprint-02/agent-fenn-shell-test-e2e-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: UC-32 in (5abf046), the 900 project, and SH-20 to SH-24

You may change only: apps/web/e2e/**, apps/web/playwright.config.ts, docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-fenn-shell-test-e2e-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-nemi-shell-fonts-build

```text
You are NEMI on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-nemi-shell-fonts-build. Branch: frontend/sprint-02/agent-nemi-shell-fonts-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- NEMI-01: font-fallbacks.css (ac820a7) with the sans rule by one method: size-adjust 107.50%, ascent-override 90.12%, descent-override 22.44%, line-gap-override 0.00%, inputs in the comment; imported last in app.css

You may change only: apps/web/src/styles/**, docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-nemi-shell-fonts-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fantem-shell-kit-build

```text
You are FANTEM on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-fantem-shell-kit-build. Branch: frontend/sprint-02/agent-fantem-shell-kit-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-fantem-shell-kit-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FANTEM-01: AppShell: the frame, rail, nav, badge, top bar, sheet (inert, focus trap, Escape, scrim, return focus), tab bar with More, skip link, focus mode on the element, the shell's K1, and the chrome reset; exported with its types from kit/index.ts
- FANTEM-02: ScreenHeader (DL's .scr-head, h1 title, one column under 760px) and Icon's menu
- FANTEM-03: D16 (approval page contract revision 15): the desk layout draws the phone layout under @media (max-width: 899px) from kit.css alone, with the phone layout's own values; the DOM unchanged

You may change only: apps/web/src/kit/**, docs/agent-dispatch/frontend/sprint-02/agent-fantem-shell-kit-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-fantem-shell-kit-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-leon-system-build

```text
You are LEON on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-leon-system-build. Branch: frontend/sprint-02/agent-leon-system-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-leon-system-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- LEON-01: _shell.tsx (pathless, ssr true, the badge loader, kitStylesheetHref in its head), ShellLayout from system's screens.ts, and / moved under it
- LEON-02: The stub routes from section 3's table and the focus-mode stub, each rendering PlannedScreen with its staticData, title and copy

You may change only: apps/web/src/modules/system/**, apps/web/src/routes/**, docs/agent-dispatch/frontend/sprint-02/agent-leon-system-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-leon-system-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-ghost-decisions-build

```text
You are GHOST on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-ghost-decisions-build. Branch: frontend/sprint-02/agent-ghost-decisions-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- GHOST-01: Every DecisionTag drawn with layout="desk"; no viewport read; ReasonDialog through loadReasonDialog with no import past kit/index.ts
- GHOST-02: The header as ScreenHeader (eyebrow Home, h1 Decisions, the lead); .dec-head, .dec-eyebrow, .dec-title and .dec-lead out of decisions.css; .dec-page without its padding; decisionsScreenStylesheets without kitStylesheetHref

You may change only: apps/web/src/modules/decisions/**, docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-ghost-decisions-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-shell-kit-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-zero-shell-kit-review-frontend. Branch: frontend/sprint-02/agent-zero-shell-kit-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-zero-shell-kit-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: AppShell, ScreenHeader and D16: names, props, aria, the sheet's focus behaviour, every value traced to DL or a token, nothing read from the viewport in JavaScript; D16's check re-run, not taken from the report

You may change only: docs/agent-dispatch/frontend/sprint-02/agent-zero-shell-kit-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-02/findings/shell-kit-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-zero-shell-kit-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-system-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-zero-system-review-frontend. Branch: frontend/sprint-02/agent-zero-system-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-zero-system-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: _shell, ShellLayout, the nav table, tabs, badge, crumb, title, stubs and focus stub exactly as section 3 gives them; module boundaries through index.ts; / unchanged but for its file's move; nothing moves at hydration (SH-24 re-run)

You may change only: docs/agent-dispatch/frontend/sprint-02/agent-zero-system-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-02/findings/system-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-zero-system-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-decisions-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-zero-decisions-review-frontend. Branch: frontend/sprint-02/agent-zero-decisions-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-zero-decisions-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: layout=desk everywhere, no viewport read, loadReasonDialog, ScreenHeader, padding and stylesheets as section 4 gives them; the marker rule still holds (own probe at 390x844, 10 fresh loads); UC-32's check by hand

You may change only: docs/agent-dispatch/frontend/sprint-02/agent-zero-decisions-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-02/findings/decisions-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-zero-decisions-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-leah-shell-review-a11y-perf

```text
You are LEAH on avel-factory, frontend sprint-02 (step 1: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it).
Dispatch: agent-leah-shell-review-a11y-perf. Branch: frontend/sprint-02/agent-leah-shell-review-a11y-perf-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-02/agent-leah-shell-review-a11y-perf.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- LEAH-01: Performance: /'s first load (section 8's count) and layout shift by section 6's cases (/ at 390; /missions at 390 and 1280), production build, three runs each, with each shift's sources, FCP and hydration time
- LEAH-02: Accessibility: axe on every route at 1280 and 390; the sheet (dialog, inert, focus trap, return focus), the skip link, landmarks and nav names, the tab bar's and nav's 44px targets under 900px; and D16's focus order on a phone (Approve before Reject, Reject drawn left) under WCAG 2.4.3 and 1.3.2

You may change only: docs/agent-dispatch/frontend/sprint-02/agent-leah-shell-review-a11y-perf-completion.md, docs/agent-dispatch/frontend/sprint-02/findings/shell-leah-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-02/agent-leah-shell-review-a11y-perf-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
