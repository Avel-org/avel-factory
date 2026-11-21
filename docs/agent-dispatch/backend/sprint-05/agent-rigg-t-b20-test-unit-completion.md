status: done
ticket: T-B20

# T-B20 tests report (Rigg)

## Pre-flight
- `pnpm build`, `pnpm typecheck`, `pnpm lint`: pass (lint: 6 existing warnings, none in my files; `biome check --write` applied to `test/step-1`).
- `pnpm --filter @avel/server typecheck`: pass.
- `pnpm test` (full, DATABASE_URL from pg-local): 1121 passed, 6 failed. Five are my T-B20-01 tests, which must fail now. The sixth is `platform-hardening/pool-timeouts.test.ts` T-B8-02 ("no new connection reached the proxy ... expected 0 to be >= 1"). It is not my file and does not touch it; it passed when run alone (2/2), so it is load-flaky. Axis should know (F5 is the lead's call; I did not quarantine).
- `pnpm --filter @avel/server test` runs the same server files as the full run above (same failures); I did not run it a second time.

## Failing first
Start commit: b7fac15 (docs/steps/step-1-done.md absent).
- Behaviour, `test/step-1/done-when.test.ts` (T-B20-01), 5 tests, all fail: "docs/steps/step-1-done.md is missing: expected false to be true" (exists; has a row for each of tests 1 to 15; rows name real files and IDs; no skip, focus or quarantine; moved tests name CR-43 or CR-31 and test 12 names Step 7).
- Guard, `test/step-1/running-server.test.ts` (T-B20-G01): **passes** on the start commit (guard, CR-42). It starts the real server on a free port and signs in, creates a client with an Idempotency-Key (replay returns the same client), counts one activity row, accepts a signed factory merge (one factory_versions row), and checks the unknown-route 404 ErrorBody and X-Contract-Version.
- Checked the parser against a throwaway draft of the report (deleted, not committed): it accepted real rows and caught a too-short "says" cell, so the test can pass once the lead writes the report.

## What changed
- `packages/server/test/step-1/done-when.test.ts`: T-B20-01.
- `packages/server/test/step-1/running-server.test.ts`: T-B20-G01.
- This report.

## Contract to files
- T-B20-01 -> done-when.test.ts; T-B20-G01 -> running-server.test.ts.

The report format the lead must write is in done-when.test.ts's header comment: table rows `| N | says | `file` | `test ID` | ticket |`, rows 1 to 15 each once. Moved tests (5, 8, 9 CR-43; 14, 15 CR-31): cell 3 says "moved" and the row names the CR; row 12 names Step 7. Each test ID must appear in a describe, it or test title in a named file. The report is the lead's to write (C5), in the build.

## Deviations
- The task names rows 1 to 13; the test also requires rows 14 and 15, because the notes say the moved tests name where they went.
- The test does not check that the ticket cell has a locks.md line, because early db and contract tests predate locks.

## Limitations
- Ticket-in-locks.md is not verified. The guard does not run main.ts as a process (entry/start.test.ts does) and does not cover the webhook against the real `avel/factory` repo.
- Test IDs are matched as text on a title line; `it.each` titles are matched on their literal string.

## Lock line
- T-B20: packages/server/test/step-1/done-when.test.ts, packages/server/test/step-1/running-server.test.ts @ <branch tip>

## Messages received
None
