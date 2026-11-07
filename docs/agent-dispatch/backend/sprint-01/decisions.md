# Backend sprint-01: decisions

Lead: Axis. Step 1 (the scaffold). The slice isn't written yet: sprint-00 comes first (INT). These entries are held here so the slice picks them up.

## Carried in from INT (2026-11-06)

- **CR-W2 (D37 in sprint-00):** `docs/design/CR-W2 Pending decisions.md`, accepted. Its `packages/contract` changes (section 8, item 5) and the note on Plan line 89 (route 52 reads `missions` and `clients`) go into this slice.

## Decisions

- **S1-1. A write with no `Idempotency-Key`:** 400 `BAD_REQUEST`, `details: { field: "Idempotency-Key" }`. This matches Zero's provisional mock.
  - **Sources:** API routes.md line 16 and Design v0.6 Main line 445 require the key but don't say what a missing key gets. D5 has no dedicated code, and `BAD_REQUEST` already names the field (CR-W2 section 5).
  - **Not a source:** Factory records.md line 286, whose `IDEMPOTENCY_KEY_REQUIRED` is only an example of the requirement format.
  - **Status:** final when the slice specifies the idempotency middleware.
- **S1-2. The contract version value** (frontend escalation 02, `docs/agent-dispatch/frontend/sprint-01/escalations/02-contract-version-value.md`):
  - **The constant:** `@avel/contract` exports `CONTRACT_VERSION: string` from `src/version.ts`. It sits beside `CONTRACT_VERSION_HEADER` and is re-exported from `src/index.ts`. Its value is semver `MAJOR.MINOR.PATCH`.
  - **One source:** the value always equals `packages/contract/package.json`'s `version`. Design v0.6 Main line 430 says the header carries "the contract package's version". A contract unit test reads `package.json` with `fs` and asserts the two are equal, so a bump that changes only one of them fails CI. `package.json`'s `exports` stays `"."` only.
  - **Who uses it:**
    - the server sends `CONTRACT_VERSION` in `X-Contract-Version` on every response (Step 1 plan, item 3 and test 3);
    - the web imports it as `BUILT_CONTRACT_VERSION`, which replaces the `__AVEL_CONTRACT_VERSION__` defines;
    - the CLI compares against it (CR-14, item 5).
  - **The bump rule** is the design library's commit convention:
    - `feat(contract)` bumps the minor version;
    - `feat(contract)!` (with a `BREAKING CHANGE:` line) bumps the major;
    - `fix(contract)` and changes to docs or comments only bump the patch.
  - **What counts as breaking:**
    - removing or renaming a route, field, error code or event kind;
    - a new required input field;
    - narrowing an input's type (for example CR-W2's `changeId` to digits);
    - changing an output field's type or nullability;
    - adding a value to an output value list or union, because an old bundle can't render it (Frontend Map v0.6 line 74: a new kind is a type error until registered).
  - **Additive changes** bump the minor: a new route, a new optional input field, or a new optional output field.
  - **Packaging-only changes don't bump** (D58, INT, 2026-11-07). A change to how the package is built or exported, with no route, field, error code, event kind or type change, keeps the version. The first one was the subpath exports, `fix/contract-subpaths` at da5b3c0.
  - **Who bumps and who checks:** the api-contract dispatch bumps `package.json` and `CONTRACT_VERSION` in the same commit as the change. The contract's reviewer (Brennan, review-spec) checks the bump against this rule.
  - **Start value:** m1 stays `0.0.0`, since it's reviewed and unreleased. This slice's api-contract dispatch sets `1.0.0` together with the CR-W2 changes. After that, the rule above applies.
  - **What a mismatch does** is a client choice, not set here:
    - the web shows a reload banner on any difference (Frontend Map v0.6 line 226);
    - the CLI warns on a minor difference and refuses on a major one (CR-14, item 5).
- **S1-3. The wire error shape and `BAD_REQUEST`'s details** (frontend finding approvals-uic-brennan-15, P1):
  - **The wire body stays m1's `ErrorBody`, `{ code, message, details?, requestId }`.** We don't switch to oRPC's error JSON (`{ defined, code, status, message, data }`). The shape is written three times:
    - Design v0.6 Main line 428 ("Every error has the same body, `{ code, message, details?, requestId }`");
    - Step 0 and Step 1 plan item 2.9 (the error mapper) and done-when test 3;
    - CR-14 line 15, where the CLI prints "the contract's error body plus hints".

    Changing it would mean amending three docs and the CLI's error parsing, to suit one client library's codec.
  - **The server (item 2.9):** one error mapper writes *every* error as `ErrorBody`, with the status from the contract's error map. That includes oRPC's own input-validation errors, typed procedure errors, and unexpected errors (500, with no internals). No oRPC error JSON ever reaches the wire. `requestId` equals `X-Request-Id`. `packages/contract-mock` follows the same rule, for its handler's errors and for `failNext`.
  - **Clients decode in one place.** `@avel/contract` exports a pure `parseErrorBody(status: number, body: unknown): ErrorBody | null`, which uses `ErrorBody.safeParse`. A body that doesn't parse gives null, and the caller then maps by status alone.
    - **The web:** Zero's revision 3 (committed; Brennan a3 reviewing) reads the `ErrorBody` from `e.data.body`, the malformed-response error's body. This is accepted, and it isn't a planned contract change. The web can run `e.data.body` through `parseErrorBody` once the Step 1 contract exports it, so the validation lives in one place. Doing so is optional: the wire doesn't change. A link-level rethrow (`code = ErrorBody.code`) is also fine if Ghost prefers it. `@orpc/openapi-client` 1.16.2 has the hook for that: `OpenAPILink`'s codec option `customErrorResponseBodyDecoder?: (deserializedBody, response) => ORPCError | null | undefined`. Checked in its `dist/shared/openapi-client.Dx4REA6z.d.ts:86`, from a copy in an earlier session's scratchpad, not the repo.
    - **The CLI** uses the same `parseErrorBody`.
  - **`BAD_REQUEST` details for invalid input:** `{ field: string, issues: Array<{ field: string, message: string }> }`.
    - `field` is the first failing path. `issues` lists every failing path, in the validator's order.
    - **A path** is the Zod issue path joined with `.`, for example `reason` or `items.0.name`. Path, query and body fields share one namespace, because oRPC merges them into one input.
    - **A header** uses its header name, for example `Idempotency-Key` (S1-1).
    - The `ErrorBody.message` is the first issue's message.
    - This keeps Zero's provisional `{ field: "<first failing path>" }` and adds the full list for "Field errors from `details` beside the inputs" (Frontend Map v0.6 line 215).
    - **What it replaces:** CR-W2 section 5's "details naming the field" and S1-1's `{ field: "Idempotency-Key" }` now mean this shape. A missing key gives `{ field: "Idempotency-Key", issues: [{ field: "Idempotency-Key", message: "required" }] }`.
  - **The other codes' details are unchanged:** `STALE_VERSION` (D21), D27's `{ constraint }` and `{ allowed }`, and `TOO_MANY_REQUESTS`'s `retryAfterMs`.
- **S1-4. `onboarding_started_at` can't be cleared once set** (D47; Brennan's m2 finding 01, P3; m2 merged as is):
  - **The gap today:** the map's CHECKs already keep `onboarding_started_at` set in every state except `draft` and `cancelled` (`missions_started_ck`). So a clear only gets through together with a move to `draft`, or on a `cancelled` mission. After the clear, `missions_frozen` (`freeze_after_set('onboarding_started_at', 'kind')`) no longer guards `kind`.
  - **The fix, in Step 1's migration** (a new numbered migration with its own down file; m2's 0000 to 0002 stay as merged):
    `CREATE TRIGGER missions_started_frozen BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION freeze_once_set('onboarding_started_at');`
    - It reuses the map's `freeze_once_set`. No new function is needed.
    - Once set, the column can be neither cleared nor changed.
    - Setting it from null, on the move from `draft` to `onboarding`, still works.
    - The down migration drops the trigger.
    - Postgres fires `BEFORE` triggers in name order (`missions_frozen`, `missions_started_frozen`, `missions_touch_updated_at`). Either freeze trigger refuses on its own, so the order doesn't matter.
  - **Error:** `freeze_once_set` raises `check_violation` with `CONSTRAINT = missions_started_frozen`, which the error mapper turns into `CONSTRAINT_VIOLATION` 422, `details: { constraint: "missions_started_frozen" }` (D27).
  - **No map state needs it cleared:**
    - `missions_draft_not_started_ck` (draft → null) is the only rule that wants it null, and no transition goes back to `draft`. Main line 454: "a new mission starts as a draft". The server never moves a mission back to draft (D47), and no route does.
    - `cancelled` allows it either set or null (`missions_started_ck`), so cancelling never needs a clear.
    - `missions_started_factory_commit_ck` only needs `factory_commit` set while it's set.
    - Re-entry, converge passes and checkpoint reopenings (Canon onboarding v0.5, lines 15, 66 and 412) reopen modules or stages, not the mission's state.
    - `refreshing` keeps it.
  - **contract.md (Step 1 slice):**
    - section 6's names table gains `missions_started_frozen`;
    - the hand-written triggers on `missions` become `missions_frozen` and `missions_started_frozen`;
    - Step 1's tables list `missions` as altered (trigger only).
  - **Its own done-when test** (Step 1 test 15; Rigg, test-unit, in `packages/db/test/`):
    - (a) a mission in `onboarding`: setting `onboarding_started_at = null` together with `state = 'draft'` is refused with `missions_started_frozen`;
    - (b) a `cancelled` mission with it set: clearing it is refused;
    - (c) changing it to a different timestamp is refused;
    - (d) the bypass Brennan found, clearing it and then changing `kind`, is refused at the first statement, and `kind` is unchanged;
    - (e) `draft` → `onboarding` with it set from null succeeds;
    - (f) with `missions_started_frozen` disabled, (b) succeeds, which proves the trigger and not a CHECK refuses it.
  - **Docs touched:** the Step 0 and Step 1 plan already has done-when 15 and `missions` in its tables (INT, e8e7c21). DATABASE.md gains the trigger next to `missions_frozen` (Atlas, docs, in the slice).
- **S1-5. Path parameters win; there's no body-versus-path check** (Zero's revision 4, frontend sprint-01 decisions.md, item 22):
  - **The decision:** drop the "`proposalId` in the body doesn't match the path" half of CR-W2 section 5's check 1. The schema half stays (`BAD_REQUEST`, S1-3).
  - **The rule for every route with path parameters:** the path is the only source of a path parameter. A copy in the body is ignored: overwritten, never compared, never refused.
  - **Why, checked in `@orpc/openapi` 1.16.2** (from a copy in an earlier session's scratchpad, not the repo):
    - The `compact` decode returns `{ ...data, ...params }` (`dist/shared/openapi.7hX3MhvE.mjs:16-32`), so the path overwrites the body.
    - The OpenAPI generator removes path parameters from the request body schema (`separateObjectSchema`, `openapi.BwdtJjDu.mjs:676-692`). So the published body for route 54 is `{ version, choice, reason }`, and `proposalId` isn't part of the API's body at all.
    - A server that read the raw body to refuse a mismatch would be checking a field its own OpenAPI document doesn't have. It would also need a second parse outside oRPC on every such route.
  - **The mock:** `packages/contract-mock` should drop its raw-body read for check 1, so it behaves like the server: a mismatched body `proposalId` is ignored. That's for Zero, through INT. Backend doesn't touch the mock.
  - **CR-W2 change:** section 5's check 1 and a note under the request, edited on main's working tree (uncommitted, for INT to commit; CR-W2 is accepted, D37).
- **S1-6. `@avel/contract` moves to `zod/mini`** (INT, 2026-11-07: the web pays 25.6 kB gzip for zod, and the target is about 20 kB less; the frontend budget is 160 kB until then). It's a planned contract change, with its own module in the Step 1 slice.
  - **Why `zod/mini`:** classic `zod` puts its methods on shared classes, so any schema pulls in all of zod. `zod/mini` exposes the same checks as functions that tree-shake, on the same `zod/v4/core`.
  - **The web imports zod too** (INT's correction, 2026-11-07). Ghost's w0-data, at 3183bc1 and not yet on main, has `apps/web/src/data/pending-decisions.ts` importing `{ z } from "zod"` at runtime. It builds CR-W2's row shapes itself (`DecisionChoice`, `CostImpact`, …), because the contract doesn't have them until Step 1. `client.ts` also has a type-only import. So the saving needs **both** packages off classic zod, in the same change:
    - **Contract side** (this module): Axis.
    - **Web side** (frontend territory, a dispatch Zero plans, through INT; backend never touches `apps/web`): the web's runtime zod moves to `zod/mini`. Better still, once this slice's contract exports CR-W2's shapes (`DecisionChoice`, `ProposalViewDto`, the union), the web imports them from `@avel/contract/dto/decisions` and drops its own copies. Type-only imports cost nothing at runtime, but `import type { z } from "zod/mini"` keeps a single source.
    - **Lands together:** the two land together, and the measured saving counts both. Measuring one alone would show little, because either package left on classic zod pulls all of classic back in.
  - **What changes:** schema construction in `packages/contract/src` only. About 377 chained calls get rewritten:
    - `.nullable()` 167 → `z.nullable(x)`;
    - `.min()` 79 → `.check(z.minLength(n))` or `z.minimum(n)`;
    - `.int()` 54 → `z.int()`;
    - `.optional()` 50 → `z.optional(x)`;
    - `.array()` 49 → `z.array(x)`;
    - `.extend()` 15 → `z.extend(S, shape)`;
    - `.trim()` 11 → `.check(z.trim())`;
    - `.refine` 2, `.pick` 2 and `.meta` 1 get their `zod/mini` forms.

    Package metadata stays the same: the subpaths (D58), `sideEffects: false` and the dependency on `zod` 4.6.7, which ships `zod/mini`.
  - **What doesn't change:**
    - the wire (routes, fields, codes, event kinds);
    - every `z.infer<>` type;
    - S1-3's `BAD_REQUEST` details: `zod/mini` raises the same core issues, with the same paths.
  - **Version (INT, 2026-11-07): no separate bump.** S1-6 lands ahead of the CR-W2 contract changes in this same slice, and those set `1.0.0` (S1-2). Nothing changes on the wire or in the inferred types, which is D58's spirit.
  - **Gate first: a spike** (Axis, in a scratch worktree, discarded) on oRPC 1.16.2 and zod 4.6.7, checking five things. If (2) or (4) fails, stop and report.
    1. `@orpc/contract` accepts `zod/mini` schemas as Standard Schema, for input and output.
    2. The OpenAPI generator, Step 1's CI step, converts them. `@orpc/zod`'s zod 4 converter works on `zod/v4/core`, so this has to be shown, not assumed. The OpenAPI document for routes 52 to 54 must come out byte for byte the same.
    3. `z.json()`, the `Placeholder` record and the `Page<T>` generic have `zod/mini` forms.
    4. **The measured saving:** the web's production build of the decisions page, with both `@avel/contract` and `apps/web/src` on classic and then both on mini (the web side on a scratch copy of Ghost's w0-data), from Leah's first-load budget check. Target: at least about 20 kB gzip less.
    5. Error issues and their paths are the same as classic's for route 54's bad inputs (S1-3).
  - **The module** (Step 1 slice, before the CR-W2 contract changes, so the new DTOs are written in `zod/mini` once):
    - **Builder:** Axis (api-contract).
    - **Test-unit (Rigg):** a test that no file in `packages/contract/src` imports `"zod"` (only `zod/mini` and `zod/v4/core`), and a type-level test that the `z.infer` types of every exported DTO are unchanged against the pre-move snapshot. The locked contract tests (44) don't touch zod's API (they use only route metadata), so they run unchanged as the regression.
    - **Lint:** Biome's `noRestrictedImports` bans `"zod"` in `packages/contract/**`.
    - **Review:** Brennan (review-spec).
    - **Done when:**
      - build, typecheck and lint pass;
      - 44/44 plus the new tests pass;
      - the OpenAPI document is unchanged;
      - with the web's matching change, the web's first-load gzip drops by about 20 kB, with the number in the report.
  - **Consumers:**
    - The server (Step 1) and `packages/contract-mock` use the contract's schemas as they are, or the `zod/mini` functions to derive from them.
    - The server may use classic zod for its own internal schemas.
    - The web uses only `zod/mini`, or the contract's own schemas (Zero, through INT; see above).
