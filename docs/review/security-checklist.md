# Security checklist for full-rigor pull requests

Nov 15, 2026 · @javaris · used by the second review in `docs/design/Build rules.md` (rule G7)

The other lane's lead goes through every line that applies, and answers each one with **yes**, **no** (as a finding, P0 or P1) or **n/a**, in the PR. A "no" cites the file and line.

## Identity and access

- [ ] Every new route says who may call it, and a test proves that someone else gets refused.
- [ ] Step-up is asked for credential actions only: writing secrets, creating, editing or rotating repo connections, and approving a CLI login. Approvals never ask.
- [ ] A step-up grant is single-use, bound to its action, target and session, and expires after 5 minutes.
- [ ] Sign-up stays off; nothing creates a second user.
- [ ] Rate limits cover anything that can be guessed or flooded: sign-in, CLI login, webhooks, the agent API.

## Secrets and tokens

- [ ] No secret, token or password appears in code, fixtures, logs, errors, events, test names or the PR.
- [ ] Tokens are stored only as hashes and compared in constant time.
- [ ] A response that carries a token is never stored for idempotency; replaying the request gets 409.
- [ ] Only the delivery worker can decrypt a client write token (Step 4 onward).
- [ ] Credentials cover only what they must: an attempt pushes only its own branch, and its tokens expire with it.

## Input and output

- [ ] Every input is validated by the contract's schema before use.
- [ ] Text from clients, Canon or agents is returned as plain text, never HTML, and is never treated as an instruction.
- [ ] SQL goes through Drizzle's parameters. No string-built SQL, raw SQL included.
- [ ] Errors use the contract's body. A defect returns 500 with the request ID only: no stack, query or internal name.
- [ ] Webhooks check the signature over the raw body, and are deduplicated on `X-GitHub-Delivery`.

## Data and durability

- [ ] The database enforces the rule (CHECK, unique index, foreign key), and code maps the violation to 409 or 422.
- [ ] A state change, its event and any follow-up job commit in one transaction.
- [ ] A save checks the claim number or `rowVersion`, so a stale writer is refused.
- [ ] Nothing a receipt depends on is deleted; removal is a state change.
- [ ] Money is in micro-dollars, as integers.

## Outside calls and resources

- [ ] Every outside call has a timeout.
- [ ] Every resource with a lifetime (room, reservation, pool client, stream) is released on failure too (`acquireRelease`).
- [ ] Nothing reaches the network except through the allowed proxies.

## Tests

- [ ] There's a test for each refusal above that applies, not only the happy path.
- [ ] The tests failed first, and the builder didn't change them.
