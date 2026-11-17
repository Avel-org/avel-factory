# CR-31: Step 1 without the sample route and the approval page (accepted)

Nov 13, 2026 · @javaris · **accepted Nov 13 by the operator**

- **What:** Step 1 no longer builds the clients sample route (item 12) or the minimal approval page (item 13). The goal is to get straight into the build.
- **Why:** both were demonstrations. The middleware they were meant to show off is proved instead on routes Step 1 builds anyway (health and CLI login), and decisions get approved in the control room, which the frontend session is already building against `contract-mock`.
- **Touches:**
  - `Step 0 and Step 1 plan.md`: items 12 and 13, tests 2, 4, 5, 6, 14 and 15, the tables touched.
  - `AGENTS.md`: the Step 1 order.
  - Design v0.6 Main, build order Step 1 (it overrides the "one sample route" line).
  - The project instructions' Step 1 list ("one sample route that shows the DTO mapper, a typed error, an idempotent replay and a 429").
  - Tables: Step 1 no longer touches `clients`, `proposals` or `missions`. No schema change.

## Where the removed work goes

| Removed from Step 1 | Where it lands |
| --- | --- |
| The clients routes (8 to 11) and `toClientDto` | Step 4, with repo connections (the Port inventory already ports clients there) |
| Pending decisions and deciding a proposal (routes 52 and 54) | The first step that opens a decision: Step 6 or 7 (finalize, checkpoints) |
| The approval page | The control room's Decisions screen, from the frontend session |
| The AVEL internal client in the seed | Stays: the seed still creates it (CR-13), with no route |

## How Step 1's tests are proved now

| Test | Before | Now |
| --- | --- | --- |
| 2. DTO mapper | A client's output | A CLI session's output (route 4) has exactly `CliSessionDto`'s fields and never `token_sha256` |
| 3. Errors | Any typed error | Unchanged: an unknown route and a typed error both return the contract's body with the request ID |
| 4. Idempotency | Creating a client | Revoking a CLI session (route 5): a replay with the same key and body returns the first response; a different body is 409; a duplicate during the first is 409. Route 3 still answers a replay with 409 `TOKEN_REPLAYED` |
| 5. Rate limit | The sample route's 429 | CLI login: the 6th device-login start in a minute gets 429 |
| 6. Database rules | A second internal client through the route | The error mapper, fed real Postgres errors from the `Db` service: a unique violation is 409, a CHECK violation is 422, a stale `rowVersion` update is 409 |
| 14. Approval page | A seeded proposal decided on the page | Removed |
| 15. Kind freeze | Through the missions read for route 52 | Removed from Step 1: the `db` suite already tests `missions_frozen` (`done-when-3.cr13.test.ts`) |
