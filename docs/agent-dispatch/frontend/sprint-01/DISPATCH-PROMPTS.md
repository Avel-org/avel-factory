# Activation prompts: frontend sprint-01

Every activation prompt in this package, archived (CR-16). Each is also the last section of its task doc.

## agent-brennan-approvals-uic-review-spec

```text
You are BRENNAN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-brennan-approvals-uic-review-spec. Branch: frontend/sprint-01/agent-brennan-approvals-uic-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-brennan-approvals-uic-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Data and API: section 1's interim, section 2's mock and section 5.3's error handling follow CR-W2 sections 2 to 6, m1's error map and D21, D23 and D25; nothing the page reads is derived on the client
- BRENNAN-02: Design: every component, prop, state, copy string and token in sections 4 to 6 is the design library's, or is listed as a change with a decision behind it
- BRENNAN-03: Scenarios: UC-01 to UC-31 cover every done-when line in plan.toml and every row of sections 5.3 and 5.4, and each can be tested on the mock as specified

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-brennan-approvals-uic-review-spec-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/approvals-uic-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-brennan-approvals-uic-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-nemi-w0-app-build

```text
You are NEMI on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-nemi-w0-app-build. Branch: frontend/sprint-01/agent-nemi-w0-app-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- NEMI-01: apps/web/package.json (@avel/web) with exactly section 6's dependencies at pinned versions (oRPC and zod at packages/contract's exact versions), tsconfig.json extending tsconfig.base.json for a DOM and JSX app, vite.config.ts with TanStack Start, Tailwind v4, __AVEL_CONTRACT_VERSION__ and the AVEL_API=mock dev middleware (/api and /__mock), and .gitignore for the generated route tree
- NEMI-02: apps/web/src/styles/tokens.css: the design library's token stylesheet, every declaration under the same selectors with the same value, plus the Tailwind @theme mapping that reads them
- NEMI-03: apps/web/src/routes/__root.tsx: the html shell, data-theme from the avel-theme cookie on the server before first paint (default light), the two fonts, the QueryClient from the router context, and an Outlet

You may change only: apps/web/{package.json,vite.config.ts,tsconfig.json,.gitignore}, apps/web/src/styles/**, docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-nemi-w0-fonts-build

```text
You are NEMI on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-nemi-w0-fonts-build. Branch: frontend/sprint-01/agent-nemi-w0-fonts-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-fonts-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- NEMI-01: apps/web/src/routes/__root.tsx: preload IBM Plex Mono 500 beside Inter Variable, in the same link form; no Mono 400 preload, no other change

You may change only: apps/web/src/routes/__root.tsx, docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-fonts-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-fonts-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-w0-fonts-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zero-w0-fonts-review-frontend. Branch: frontend/sprint-01/agent-zero-w0-fonts-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-fonts-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: Review the w0-fonts diff: one added preload for IBM Plex Mono 500 in Inter's link form, no Mono 400 preload, no fallback metrics, nothing else changed in __root.tsx, nothing outside the territory

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-fonts-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-fonts-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-fonts-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-w0-app-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zero-w0-app-review-frontend. Branch: frontend/sprint-01/agent-zero-w0-app-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: Review the w0-app diff: the dependency list is exactly section 6's, tokens are the library's, the theme cookie is read on the server, nothing outside the territory

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zane-w0-app-review-security

```text
You are ZANE on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zane-w0-app-review-security. Branch: frontend/sprint-01/agent-zane-w0-app-review-security-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-app-review-security.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZANE-01: Review every dependency the w0-app diff adds: pinned exact, on section 6's list, no install scripts you can't account for, licence compatible

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-app-review-security-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zane-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-app-review-security-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-brennan-w0-app-review-spec

```text
You are BRENNAN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-brennan-w0-app-review-spec. Branch: frontend/sprint-01/agent-brennan-w0-app-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-app-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Review the w0-app diff against section 6: package name, dependencies, tokens, the shell

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-app-review-spec-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-app-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-app-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fenn-w0-data-test-unit

```text
You are FENN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-fenn-w0-data-test-unit. Branch: frontend/sprint-01/agent-fenn-w0-data-test-unit-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-data-test-unit.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: apps/web/vitest.config.ts and apps/web/test/setup/ (jsdom, the mock-backed client helper, the render helper)
- FENN-02: UC-01 to UC-07 as Vitest tests in apps/web/test/data/

You may change only: apps/web/vitest.config.ts, apps/web/test/setup/**, apps/web/test/data/**, docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-data-test-unit-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-data-test-unit-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-ghost-w0-data-build

```text
You are GHOST on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-ghost-w0-data-build. Branch: frontend/sprint-01/agent-ghost-w0-data-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- GHOST-01: packages/contract-mock: createMock with the exact surface in section 2 (failNext written raw with times, remove, MOCK_OPERATOR_ID), routes 52 to 54 through the contract (route 54 answers 201), every error as m1's ErrorBody (BAD_REQUEST details { field, issues }, S1-3), both response headers, the idempotency rules, route 54's checks in CR-W2's order (check 1 the schema check only; the path's proposalId wins, S1-5), every request recorded (failed ones too), the dev-only bump and reset paths, and fixtures empty, step1 and many
- GHOST-02: apps/web/src/data and lib: createApiClient with its fetch wrapper (X-Request-Id, Idempotency-Key, NetworkError, the browser-only X-Contract-Version check) and decodeErrorBody as OpenAPILink's customErrorResponseBodyDecoder, createApi, bindApi, apiFor and useApi, BUILT_CONTRACT_VERSION and useContractMismatch, newIdempotencyKey, ApiError, NetworkError and toUiError's four branches (section 3, 'Reading an error') with section 3's UiError, createQueryClient with retryDelay, the CR-W2 row schemas, parsePendingPage (one page) and selectPendingPages (route 52's infinite select), formatAgo and formatClock; apps/web/src/router.tsx with getRouter (per request on the server, forwarding the incoming X-Request-Id)

You may change only: apps/web/src/data/**, apps/web/src/lib/**, apps/web/src/router.tsx, packages/contract-mock/**, docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-w0-data-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zero-w0-data-review-frontend. Branch: frontend/sprint-01/agent-zero-w0-data-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: Review the w0-data diff: every export and UiError member as section 3 names it, the mock's surface as section 2 fixes it, no field derived on the client, nothing outside the territory

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-brennan-w0-data-review-spec

```text
You are BRENNAN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-brennan-w0-data-review-spec. Branch: frontend/sprint-01/agent-brennan-w0-data-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-data-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Review the w0-data diff: the mock's route 52 rows are CR-W2's, route 54's checks run in CR-W2's order with m1's error data, the interim schema matches CR-W2 sections 2.1 to 2.3 field for field

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-data-review-spec-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-data-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-data-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zane-w0-data-review-security

```text
You are ZANE on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zane-w0-data-review-security. Branch: frontend/sprint-01/agent-zane-w0-data-review-security-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-data-review-security.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZANE-01: Review the w0-data diff: one key per intent and reused only on a retry, no key or request ID logged with a body, the mock and /__mock paths absent from a production build

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-data-review-security-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-data-review-security-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fenn-w0-kit-test-unit

```text
You are FENN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-fenn-w0-kit-test-unit. Branch: frontend/sprint-01/agent-fenn-w0-kit-test-unit-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-kit-test-unit.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: UC-08 (DecisionTag, one test per state), UC-09 (ReasonDialog) and UC-10 (ErrorPanel) in apps/web/test/kit/

You may change only: apps/web/test/kit/**, docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-kit-test-unit-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-fenn-w0-kit-test-unit-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fantem-w0-kit-build

```text
You are FANTEM on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-fantem-w0-kit-build. Branch: frontend/sprint-01/agent-fantem-w0-kit-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FANTEM-01: Button, Tag, Icon, StatusGlyph, HashChip, ReasonDialog (R1 to R4), ErrorPanel (E1), WidgetState (W1): DL's, with section 4's props, exported by name from apps/web/src/kit/index.ts
- FANTEM-02: DecisionTag with DecisionTagProps exactly as section 4 gives them, and changes D1 to D14 from the library

You may change only: apps/web/src/kit/**, docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-w0-kit-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zero-w0-kit-review-frontend. Branch: frontend/sprint-01/agent-zero-w0-kit-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: Review the w0-kit diff: props, states, copy and data-ui names as section 4 gives them, values by section 0's rule, plain props with no oRPC or router import

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-brennan-w0-kit-review-spec

```text
You are BRENNAN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-brennan-w0-kit-review-spec. Branch: frontend/sprint-01/agent-brennan-w0-kit-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-kit-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Review the w0-kit diff: every component is the library's with only section 4's listed changes

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-kit-review-spec-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-kit-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fenn-decisions-test-unit

```text
You are FENN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-fenn-decisions-test-unit. Branch: frontend/sprint-01/agent-fenn-decisions-test-unit-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-unit.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: UC-11 to UC-28 as screen tests in apps/web/test/modules/decisions/

You may change only: apps/web/test/modules/decisions/**, docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-unit-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-unit-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-fenn-decisions-test-e2e

```text
You are FENN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-fenn-decisions-test-e2e. Branch: frontend/sprint-01/agent-fenn-decisions-test-e2e-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- FENN-01: apps/web/playwright.config.ts (the dev server with AVEL_API=mock; 390x844 and 1280x800 projects; workers 1, each test starting with POST /__mock/reset) and UC-29 to UC-31

You may change only: apps/web/e2e/**, apps/web/playwright.config.ts, docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-leon-decisions-build

```text
You are LEON on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-leon-decisions-build. Branch: frontend/sprint-01/agent-leon-decisions-build-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- LEON-01: api.ts (route 52's infiniteOptions with parsePendingPage, route 54's mutation with the key in the client context), decisions.ts (section 5.1's row mapping), screens/DecisionsScreen.tsx, index.ts, screens.ts, and routes/index.tsx with ssr true and the loader
- LEON-02: Deciding (section 5.2), every error and list state (sections 5.3 and 5.4), and the contract version banner (5.5)

You may change only: apps/web/src/modules/decisions/**, apps/web/src/routes/index.tsx, docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-zero-decisions-review-frontend

```text
You are ZERO on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-zero-decisions-review-frontend. Branch: frontend/sprint-01/agent-zero-decisions-review-frontend-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-zero-decisions-review-frontend.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- ZERO-01: Review the decisions diff: each row's props, the reason step, the exact route 54 body, every error state and copy string as section 5 gives them; no fetch, no server data in state, index.ts light

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-zero-decisions-review-frontend-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/decisions-zero-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-zero-decisions-review-frontend-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-brennan-decisions-review-spec

```text
You are BRENNAN on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-brennan-decisions-review-spec. Branch: frontend/sprint-01/agent-brennan-decisions-review-spec-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-brennan-decisions-review-spec.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- BRENNAN-01: Review the decisions diff: approve what you saw (the body from the drawn row), a stale version never re-sent, nothing derived on the client beyond the count section 5 allows

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-brennan-decisions-review-spec-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/decisions-brennan-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-brennan-decisions-review-spec-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```

## agent-leah-decisions-review-a11y-perf

```text
You are LEAH on avel-factory, frontend sprint-01 (step 1: The minimal approval page on the contract mock, with the thin W0 slice under it).
Dispatch: agent-leah-decisions-review-a11y-perf. Branch: frontend/sprint-01/agent-leah-decisions-review-a11y-perf-a<attempt>, in your own worktree.

Before you act, read docs/agent-dispatch/frontend/sprint-01/agent-leah-decisions-review-a11y-perf.md in full. It is your whole briefing.
Read every file in its Part 2, in order. If one is missing, stop and say which.

Your tasks:
- LEAH-01: Review the decisions diff for accessibility on phone and desk, and the / route's initial JavaScript against the 150 KB budget
- LEAH-02: Fonts on / (Frontend Map v0.6 line 289; UI contract section 6): Inter Variable and IBM Plex Mono 500 are preloaded and both are used by the first paint; layout shift on / at 390x844 against the CLS budget (under 0.02), measured with the fonts arriving after first paint, since there's no size-matched fallback yet (decisions.md, 'Fonts')

You may change only: docs/agent-dispatch/frontend/sprint-01/agent-leah-decisions-review-a11y-perf-completion.md, docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-*.md.
Everything else is read-only. Locked tests (locks.md) are never changed.

Work by Part 6 of the task doc. Finish with Part 7: run every verification command,
write docs/agent-dispatch/frontend/sprint-01/agent-leah-decisions-review-a11y-perf-completion.md, commit it, tell INT with scripts/tell.sh INT "..." (Part 7), and stop.
Never push, rebase or force anything. If the task doc is missing something you need,
don't guess: say so in your report.
```
