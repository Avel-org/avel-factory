# ZANE: w0-data review-security, completion report

verdict: PASS (with finding 01 open: it must be fixed before merge)

## Summary
Reviewed Ghost's head 3183bc1 (ff-merged into this branch, on top of main 087c9ca). The three things the task names are clean or have no caller yet. The production build holds no `__mock`, no `MOCK_OPERATOR_ID` value and no contract-mock. The fetch wrapper takes the key only from the call's context and logs nothing. One P2 breaks CI (a stale lockfile), one P2 is for W5, and there is one P3.

## Pre-flight
- Part 2: every file read (the docs/design files listed in zane.md exist). The UI contract was read in full through section 6.
- Branch `frontend/sprint-01/agent-zane-w0-data-review-security-a1`, started at 71e0c61, then ff-merged to 3183bc1 on INT's instruction. Review base is `git merge-base main HEAD` = 20d2915.
- Part 7 commands: all available. `pnpm install` was needed first, and `--frozen-lockfile` fails (finding 01). I installed with `--no-frozen-lockfile`, restored `pnpm-lock.yaml` with `git checkout`, then built `@avel/contract`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZANE-01 | DONE | findings commit, then this report |

## ZANE-01 review notes
- **One key per intent, reused only on a retry:** `newIdempotencyKey()` (data/idempotency.ts) is a bare `crypto.randomUUID()`. The wrapper (client.ts, `wrapFetch`) sets `Idempotency-Key` only from `options.context.idempotencyKey`, only for non-GET and non-HEAD methods. It makes no key of its own, and `createQueryClient` sets `mutations.retry: false`, so the data core never re-sends or reuses a key by itself. Whether the page makes a key per confirm and reuses it only on a retry is Leon's code (UI contract 5.2). It doesn't exist yet, so Zane's decisions-module review must check it. No caller of `newIdempotencyKey` exists outside data/ today.
- **No key or request ID logged with a body:** `grep -rn "console\.\|logger" apps/web/src` gives nothing. The mock records the key and body in `requests()`, in memory, for tests only. Errors carry a request ID and no key. `NetworkError` holds the ID and the cause only.
- **Mock and `/__mock` absent from production:** the plugin is `apply: "serve"` and added only when `AVEL_API=mock`. `grep -rlE '__mock|0193a000|contract-mock|MOCK_OPERATOR' apps/web/dist` lists nothing (10 files). `grep -rl '@avel/contract-mock' apps/web/src` lists nothing. The `.output` directory doesn't exist, so the task's own grep prints rc=2 for it. That's not a failure.
- **Dependencies in the diff:** packages/contract-mock adds `@avel/contract`, `@orpc/openapi`, `@orpc/server` and `zod`, all at the contract's own pins. No new package enters the tree.
- **Bundle:** the client chunk is `index-BDSlPvoT.js`, 488 kB raw. I didn't measure the 160 kB budget (that's Leah's).

## Findings
- docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-01-lockfile-stale.md: P2, pnpm-lock.yaml is not updated for packages/contract-mock's dependencies
- docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-02-ssr-baseurl-from-host.md: P2, SSR client's baseUrl comes from the incoming request URL (Host-derived)
- docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-03-forwarded-request-id-unvalidated.md: P3, forwarded X-Request-Id is taken without a check

## Contract to files
- UI contract section 8, Zane: keys and request IDs: apps/web/src/data/client.ts, idempotency.ts, router.tsx. Mock and `/__mock` out of production: apps/web/vite.config.ts, packages/contract-mock.

## Deviations
- Installed with `--no-frozen-lockfile` to review, then restored the lockfile. Nothing else.

## Limitations
- The page-side key handling (one key per confirm, reuse on a retry) isn't built yet, so I couldn't review it.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT or Ghost: finding 01 (regenerate the lockfile) before merge.
- Zane's decisions review (later): check Leon's key reuse (5.2 steps 2 and 4).
- Whoever dispatches W5: finding 02.
- Ghost: finding 03.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-01-lockfile-stale.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-02-ssr-baseurl-from-host.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-03-forwarded-request-id-unvalidated.md
```

(The full `main...HEAD` diff also lists Ghost's w0-data build files, which this branch carries; Zane changed only the paths above.)

## Verification
- `pnpm --filter "@avel/web..." build`: built, exit 0.
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: all three packages Done.
- `pnpm lint`: `Checked 183 files ... No fixes applied.`
- `pnpm --filter @avel/web test`: `Test Files 6 failed | 7 passed (13); Tests 105 failed | 85 passed (190)`. All 6 failing files are test/kit/{decision-tag,error-panel,reason-dialog} and test/modules/decisions/{deciding,errors,list}: the kit and decisions builds, which INT said haven't landed. Every data test passes.
- Task verify: `pnpm --filter @avel/web build && ! grep -rlE '__mock|0193a000-0000-7000-8000-000000000001' apps/web/.output apps/web/dist && ! grep -rl '@avel/contract-mock' apps/web/src`: builds, no file listed.
