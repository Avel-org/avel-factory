status: fixed (D25, e36737f: routes 39 and 44 send rowVersion, route 5 exempt)
severity: P3
title: Routes 5, 39 and 44 change a mutable row named in their path but send no `rowVersion`, against Axis's own rule A3
reviewer: Brennan (review-spec), agent-brennan-m1-contract-review-spec (a1)
under review: 0dce235 (base 6186c57)

## Where
- `packages/contract/src/dto/auth.ts:67`: `RevokeCliSessionInput = z.object({ sessionId: Uuid })`. Route 5 (`packages/contract/src/routes/auth.ts:54`, `DELETE /api/cli/sessions/{sessionId}`) takes it and returns `CliSessionDto`.
- `packages/contract/src/dto/gate0.ts:77`: `CheckpointIdInput = z.object({ checkpointId: Uuid })`. Route 39 (`packages/contract/src/routes/gate0.ts:49`, `POST /api/checkpoints/{checkpointId}/drafts`) takes it and returns `CheckpointDto`.
- `packages/contract/src/dto/gate0.ts:161`: `AnswerQuestionInput = z.object({ questionId, answer })`. Route 44 (`packages/contract/src/routes/gate0.ts:70`, `POST /api/questions/{questionId}/answers`) takes it and returns `QuestionDto`.

## What it breaks
- **Axis's rule A3** (completion report, Deviations): "A write that changes an existing mutable row named in its path sends that row's `rowVersion`. Creating a child row (a pause, a message, a waiver) doesn't." Each of these three routes changes the row its path names:
  - route 5 sets `cli_sessions.revoked_at`;
  - route 39 regenerates `checkpoints.sections`;
  - route 44 sets `questions.answer` and `answered_at`.
- **All three tables are mutable in the map,** with `row_version` (default 1) and `updated_at`. Their DTOs carry `rowVersion`, as rule 2 requires.
- **The API and data reference, Conventions:** "Writes send the row's version back. A stale version gets 409." Nothing higher in CR-19's order exempts these routes.
- **The other writes of this shape do send one:** routes 11, 14, 15, 17, 22, 24, 25, 37, 38, 40 to 43, 51, 57, 59, 60 and 66. So the contract follows its own rule except at these three.
- **Why it matters:** Step 1's server and the web's mock both read A3 off the contract. These three would either skip the stale check (two tabs answering one question, last write wins) or need a special case nobody wrote down.

## Evidence
```
$ node dump.mjs packages/contract/dist/index.js   # each route's input and output keys (scratch script)
5  DELETE  /api/cli/sessions/{sessionId}  {sessionId}  {id,userId,label,expiresAt,revokedAt,lastUsedAt,createdAt,rowVersion,updatedAt}
39  POST  /api/checkpoints/{checkpointId}/drafts  {checkpointId}  {id,missionId,sessionId,checkpoint,version,sections,state,staleModuleLabels,approvedAt,approvedBy,createdAt,rowVersion,updatedAt}
44  POST  /api/questions/{questionId}/answers  {questionId,answer}  {id,sessionId,stage,text,options,recommended,answer,answeredAt,blocking,moduleLabel,createdAt,rowVersion,updatedAt}
40  POST  /api/checkpoints/{checkpointId}/approvals  {checkpointId,rowVersion}  {...}
$ node -e '...' erd.json   # the map's ERD data
cli_sessions row_version=1 updated_at=now()
checkpoints row_version=1 updated_at=now()
questions row_version=1 updated_at=now()
```

## What fixing it means
Either of these, and Axis says which in the next report:
- **Add `rowVersion: RowVersion`** to the three inputs (Axis's territory, `packages/contract/src/dto/`). For route 39, that's the checkpoint's version as read.
- **Or narrow A3 in writing** to say why each route is exempt. For example, revoking a session can't be stale, since it's idempotent and one-way. INT then records the exemptions with A3 in `decisions.md`.

**What it blocks:** nothing in Step 0. Settle it before Step 1 builds idempotency and the stale-version check (routes 5 and 44 are Step 1 and Step 7 routes).
