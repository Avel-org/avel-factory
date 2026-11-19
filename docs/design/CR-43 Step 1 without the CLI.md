# CR-43: Step 1 without the CLI (accepted)

Nov 18, 2026 · drafted by Axis for @javaris · **accepted Nov 18 by Javaris** (to OSA: "approve 5 to 9"; item 5 of his brief). Zero signed off Nov 18 (I3), with the two CR-W30 wording fixes below

- **What:** Step 1 doesn't build CLI login (item 7, routes 1 to 5) or step-up (item 6). CLI login moves to Step 5, where the CLI is built. Step-up moves to Step 4, where its first credential actions are. Step 1 builds the clients routes (8 to 11) instead, so its middleware tests still run on real routes.
- **Why:**
  - Javaris, Nov 18: "lets not owrk on the cli right now lets foucs more on building the needed modules to run the first real mission".
  - The CLI isn't on the critical path (0 → 1 → 2 → 4 → 8 → 9a → 9b, `Backend modules and build plan.md` section 1). Every approval a mission needs is made in the web app.
  - In Step 1, step-up guards only the CLI approval (`Step 0 and Step 1 plan.md`, item 6). Without the CLI it would have no caller, which E8 forbids. Its next users are secrets (route 45) and repo connections (routes 13, 14 and 17), all in Step 4.
  - A real mission needs a client before Canon can onboard it. The clients routes cost one ticket, and they give Step 1 the real writes that tests 2, 4 and 13 need. CR-31 moved them to Step 4 only because Step 1 already had the CLI login routes to prove the middleware on.

## Where each test goes

| Test | Before (CR-31) | Now |
| --- | --- | --- |
| 2. DTO mapper | A CLI session's output (route 4) | A client's output (routes 9 to 11) has exactly `ClientDto`'s fields and no internal column |
| 4. Idempotency | Revoking a CLI session (route 5); route 3's replay is 409 `TOKEN_REPLAYED` | Creating a client (route 9): a replay with the same key and body returns the first response, another body is 409, and a duplicate sent while the first is running is 409. Route 3's `TOKEN_REPLAYED` replay moves to Step 5 with route 3. T-B8's store already proves it at the service level (T-B8-07) |
| 5. Rate limit | The 6th device-login start in a minute (route 1) is 429 | The 6th sign-in in a minute, for one email or from one IP, is 429. T-B9 already has this test |
| 8. Step-up | Step 1 | Step 4, before the first route that needs a grant (repo connections or secrets) |
| 9. CLI login | Step 1 | Step 5, with the CLI |
| 13. Activity log | Step 1's writes (the CLI login routes) | Step 1's writes: the clients routes (9 and 11) |

Tests 1, 3, 6, 7 and 10 to 12 don't change. The stale `rowVersion` check from E13 runs on route 11.

## What moves

| Out of Step 1 | Where it lands |
| --- | --- |
| Item 6, step-up grants (`step_up_grants`), test 8 | Step 4, ahead of route 13 or route 45, whichever is built first |
| Item 7, CLI login and sessions (`device_logins`, `cli_sessions`), routes 1 to 5, test 9 | Step 5, with the `avel-cli` client |
| The CLI login rate limits (5 starts a minute, polling no faster than every 5 seconds) | Step 5, with routes 1 and 3. The limiter keeps its `device-login` name (T-B8) |
| **Into Step 1:** the clients routes 8 to 11 and `toClientDto` | Out of Step 4. Repo connections (routes 12 to 17) stay in Step 4 |

## Touches

- **`Step 0 and Step 1 plan.md`:**
  - items 6, 7, 8 and 12;
  - tests 2, 4, 5, 8, 9 and 13;
  - the tables touched: drop `step_up_grants`, `device_logins` and `cli_sessions`, and `clients` returns through routes 8 to 11;
  - the rate limits: the CLI login line moves to Step 5;
  - "Not in Step 1": add step-up and CLI login.
- **`AGENTS.md`, the Step 1 order:** "auth, step-up and CLI login, with the activity log on their writes (items 5 to 8)" becomes "sign-in, then the clients routes with the activity log on their writes (items 5 and 8)". The API rules' step-up line doesn't change, because it lists credential actions, not steps.
- **`CR-31`:** its test 2, 4 and 5 rows are replaced by the table above, and its clients row ("Step 4") is reversed. Its other rows stand.
- **`Backend modules and build plan.md`:**
  - section 4, the `cli` module: built in 5, not "1 (login), 5";
  - section 8, the order inside Step 1: item 3 loses step-up and CLI device login.
- **`Design v0.6 Main`** (frozen; this CR overrides it): build order Step 1 drops "single-use step-up grants for credential actions, 12-hour CLI sessions". Step 4 gains step-up, and Step 5 gains CLI login.
- **CR-W30 (frontend, accepted Nov 17):**
  - B (the step-up wire) waits for Step 4's step-up.
  - C (the mock serving routes 1 to 7) waits as a whole. Routes 1 to 5 wait for Step 5, and routes 6 and 7 aren't on the web's first-mission path either (Zero, Nov 18).
  - T-F13 is withdrawn (frontend re-plan, approved Nov 18): Settings' CLI sessions panel stays on the sample world.
  - This needs Zero's sign-off (I3).
- **Tables:** no schema change and no contract change. The contract already has routes 1 to 5 and 8 to 11.

## Effect on the backend plan

- **T-B10** (step-up and CLI login, routes 1 to 3) is withdrawn from sprint-03. It had no tests, no branch and no session. It keeps its ID and will be re-planned in two parts: step-up in Step 4, and CLI login in Step 5.
- **T-B12** (routes 4 and 5) was never rendered. It goes to Step 5's backlog with T-B10.
- **T-B9** (sign-in) doesn't change, apart from two notes that named T-B10 as the next user of the caller and the request scope. They now name T-B14, the clients ticket.

## Open, for Javaris

- **Step 5 and E9.** E9 runs the steps in order, so Step 5 still sits between Step 4 and Step 6, and the rest of Step 5 is CLI work too (`avel watch`, `doctor`, `link`). Only its event streams (routes 63 and 64) matter to the web. Should Step 5 split, so its CLI part waits until after the first mission? This CR doesn't decide that, and it doesn't need to until Step 4 closes.
