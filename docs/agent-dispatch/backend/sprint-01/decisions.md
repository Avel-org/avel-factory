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
  - **Brought forward (INT, 2026-11-07):** S1-6 is dispatched now, as its own module `zod-mini`, ahead of the rest of the Step 1 slice. Why: Leah's perf review of the decisions page failed (finding decisions-leah-01, report 45c715c on `frontend/sprint-01/agent-leah-decisions-review-a11y-perf-a1`). `/` loads 173.5 kB gzip against the 160 kB budget, and classic zod is 28 kB of that.
  - **The spike: done, 2026-11-07, Axis.** It ran in a detached worktree at 45c715c (main ceb6d47 plus Leon's c3effb3, Leah's review base) and was then removed. Inside it, `dto/common.ts`, `dto/decisions.ts` and `errors.ts` were rewritten in `zod/mini`, along with the web's `data/pending-decisions.ts` and the type-only import in `data/client.ts`. The rest of the contract stayed classic. **All five checks pass, with one change outside the contract (check 2) and one number for INT (check 4):**
    1. **oRPC accepts `zod/mini` for input and output.** Routes 52 and 54 went through `implement` and `OpenAPIHandler` (1.16.2) for five cases: 52 good, 52 with `limit=500`, 54 good, 54 with bad input, and 54 with bad output. Status and body were byte for byte the same as classic's in all five (`diff` printed nothing).
    2. **The OpenAPI document comes out byte for byte the same, once one line in `tools/docs/src/openapi.ts` changes.**
       - `dtoComponents()` picks DTOs with `value instanceof z.ZodType`, which is classic zod's class (`openapi.ts:27`). A `zod/mini` schema isn't an instance of it, so without the change every mini DTO drops out of `components.schemas` (a 2,081-line diff).
       - With `core.$ZodType` from `zod/v4/core` (both classic and mini schemas are instances of it), the document matches main's: `git diff --exit-code docs/generated/openapi.json` exits 0. `@orpc/zod`'s zod 4 converter already accepts mini, since its `condition` checks `vendor === "zod"` and `"_zod" in schema`.
       - So the module's territory includes `tools/docs/src/openapi.ts`.
       - The document stays byte-identical only if each shared schema stays one object. Main's document has `MetricsDto` wherever a `Placeholder` is used (S1-8), because every alias of `Placeholder` is the same object. A move that splits that object changes the document.
    3. **`z.json()`, the `Placeholder` record, `Page<T>` (constraint `z.ZodMiniType`), `z.coerce.number()` with checks, `z.iso.datetime`, `z.uuid({ version: "v7" })` and `z.file()`** all build and run in `zod/mini`.
    4. **The saving is 17.25 kB gzip, short of the "about 20 kB" target.** `pnpm --filter "@avel/web..." build` gives `index-*.js` at **173.53 kB** with both packages on classic and **156.28 kB** with both on mini. That's 3.7 kB under 160, but still 6.3 kB over the 150 that the frontend's decisions.md (2026-11-07, "160 kB for sprint-01") said the budget returns to when S1-6 lands. Nothing from classic zod is left in the bundle: `superRefine`, `nonnegative` and `safeExtend` each appear 0 times. **INT decides** whether 17.25 kB meets the gate. My recommendation is yes, since the aim was to clear 160. Whether the budget goes back to 150 is Zero's call. Leon a2's lazy `ReasonDialog` (about 1.7 kB, Leah's estimate) adds to this.
       - **Accepted (INT, 2026-11-07):** the gate passes at 17.25 kB (173.53 to 156.28). The package was committed at e4a1818, and Rigg's `agent-rigg-zod-mini-test-unit` a1 is open. Axis builds once Rigg's tests are merged and have their `locks.md` line.
    5. **Error issues are unchanged.** `DecideProposalInput` and `ErrorBody` were parsed on 6 inputs each: empty, a bad UUID, zero/empty/blank, wrong types, extra keys, and a padded `reason`. All 12 gave the same issues (`code`, `path`, `message`, bounds) or the same data as classic. The padded `reason` is trimmed the same way. S1-3's `details` are unaffected.
    - Also checked: the 44 locked contract tests pass on the half-moved contract (`pnpm --filter @avel/contract test`: 44 passed).
  - **The spike's notes for Ghost** (through Zero, frontend territory):
    - `data/client.ts` uses `z.ZodType` in its type-level `SchemaInput`/`SchemaOutput`. The mini name is `z.ZodMiniType`. The constraint could also be `$ZodType` from `zod/v4/core`, which accepts both.
    - In `pending-decisions.ts`, `.regex()` becomes `.check(z.regex(…))`, `.optional()`/`.nullable()` become `z.optional(x)`/`z.nullable(x)`, and `.min(1)` on an int becomes `.check(z.minimum(1))`.
  - **What the module changes, amended by the spike:**
    - `packages/contract/src/**`, as above;
    - `tools/docs/src/openapi.ts`: the `$ZodType` check only;
    - `biome.json`: the ban, as an `overrides` entry for `packages/contract/**`. Biome 2.6.5's `style/noRestrictedImports` takes `paths`. It bans `"zod"` and `"zod/v4"`: both are classic, and the frontend's check, `zod(/v4)?`, treats them the same.
    - Not `packages/contract/package.json`: no bump, no new dependency.
  - **The `Page<T>` constraint** becomes `$ZodType` from `zod/v4/core`, so the server can still page its own classic schemas ("Consumers", above).
  - **The size done-when moves to the joint landing.** The backend module can't build `apps/web`, so its report quotes the spike's 17.25 kB. Leah measures the real number on the frontend side once Ghost's change and this module are both on main (Zero plans that).
  - **One test added to Rigg's list:** a locked fixture of route 54's bad-input issues (path and message), recorded from classic, so check 5 stays a regression test after the spike is gone. It's small, and it guards S1-3.
  - **Amendment: found in the module build** (Axis a1, 2026-11-07; INT's answers on 719a41f):
    - **English issue messages.** Classic `zod` sets English as the default locale on its first schema, and only if none is set yet (`zod/v4/classic/schemas.js:9-13`, `_ensureDefaultLocale`). `zod/mini` never sets it.
      - **The effect:** on a contract that's all mini, every issue message becomes `"Invalid input"` instead of, for example, `"Invalid input: expected string, received undefined"`. S1-3 puts those messages on the wire (`ErrorBody.message`, `issues[].message`), and Rigg's locked RIGG-03 fixture has them. The spike's check 5 missed this: its half-moved contract still imported classic zod, which set the locale for the whole process.
      - **The decision:** the contract's **root entry** (`src/index.ts`, `@avel/contract`) sets the same default: `if (!z.core.globalConfig.localeError) z.config(z.locales.en());`.
        - The subpaths (D58) don't set it, so the web's bundle doesn't carry the locale (about 1.1 kB gzip under rolldown). The web imports only subpaths, both on main and on Ghost's `review-base/s1-6`. Its dev-server mock loads on the Node side.
        - The root entry is what the server, the CLI, `packages/contract-mock`, `tools/docs` and the contract's tests import.
        - An explicit `z.config()` locale still wins, as with classic. zod reads the locale when it reports an issue (`core/util.js:591`), not when it builds a schema.
        - No new subpath, so no `package.json` change.
      - **The rule for consumers:** code that wants S1-3's messages imports `@avel/contract` (the root) at least once, or sets a zod locale itself. A web page that shows a field error builds its own text, or sets the locale (Zero's call).
      - **Open (INT): bundling the root.** With `sideEffects: false`, a bundler drops `index.ts`'s own top-level statement when only its re-exports are used. Rolldown did exactly that on a root-only probe: no locale strings in the output. Node without a bundler (the server as planned, the mock, `tools/docs`, the tests) isn't affected. If the server or the CLI is ever bundled, add `"sideEffects": ["./dist/index.js"]` to `packages/contract/package.json`, which is packaging-only and so no bump (D58), or have them call `z.config` themselves. This is untested, and it's outside the module's territory.
    - **Calls S1-6 didn't count.** zod/mini has none of these as methods. Each form keeps the types (RIGG-02) and the OpenAPI output (byte-identical):
      - `.extract([...])` (3: `EscalationKind`, `dto/gates.ts`, `dto/your-work.ts`) becomes `z.enum([...] as const satisfies readonly List[])`. The same values in the same order, and tsc checks each one is in the value list, which replaces classic's runtime "Key not found".
      - `.exclude(["proposed"])` (1: `UpdateFactInput.status`) becomes `z.enum(FactStatus.filter((v): v is Exclude<FactStatus, "proposed"> => v !== "proposed"))`. It's still derived from the list, in order.
      - `.loose()` (1: `MissionCreatedPayload`) becomes `z.looseObject(shape)`, the same `catchall: unknown()`.
      - S1-6's "`.meta` 1" is oRPC's `base.meta(...)` in `routes/route.ts`, not zod's, so it's unchanged. Its "`.array` 49" are already `z.array(...)`, and 51 of its "`.int` 54" are top-level `z.int()`.
    - **The memoizer: not added** (INT). Classic also sets a default parse memoizer, and mini doesn't. It only changes the outcome for cyclic object graphs, and JSON from the wire can't be cyclic.
    - **The landing (INT):** Ghost's w0-data a3 is on `review-base/s1-6` (d6eacae: main ab520cd plus this module), and the two merge together. This module alone breaks main's web: `apps/web/src/data/pending-decisions.ts:40`'s `Uuid.nullable()` throws at load.
- **S1-7. No `minifyContractRouter` for the web yet** (INT's question, 2026-11-07):
  - **What it does in oRPC 1.16.2:** `@orpc/contract`'s `minifyContractRouter` keeps only each procedure's `route` and `meta`, and sets `errorMap` to `{}` (`dist/index.mjs:83-102`). `OpenAPILink` reads only `~orpc.route` (`@orpc/openapi-client` `dist/shared/openapi-client.DgkI_tTF.mjs:94-222`), so a minified router is enough for the link.
  - **The saving is 0.37 kB gzip today.** In the spike, on top of `zod/mini`, `{ decisions }` was minified to a 1 kB JSON at build time and imported in `client.ts` with the contract's types type-only. `index-*.js` went from 156.28 to 155.91 kB. The web still needs zod at runtime for `ErrorBody` (`errors.ts`), `IsoTime` and `Uuid`, and its row schema. Under mini, three routes' worth of schemas costs almost nothing.
  - **It has to happen at build time.** Calling `minifyContractRouter` in the browser bundle imports the full router first, so it saves nothing.
  - **Its costs:** a generated artifact that has to stay in sync, and a second way of building the client.
  - **Not now.** Revisit when the web's client takes more route groups (W2 onward) and Leah's attribution shows the contract's schemas are worth more than about 2 kB.
  - **If it's adopted later:** `@avel/contract` builds the minified JSON as a subpath export. That's packaging-only, so there's no bump (D58). A contract test checks that the file equals `minifyContractRouter` of the routes, and the web imports it with `typeof` the routes as its type.
- **S1-8. Every `Placeholder` field in the OpenAPI document points at `MetricsDto`** (found in the S1-6 spike; already true on main, and not S1-6's to fix):
  - **Why:** `MetricsDto` (`dto/metering.ts:18`) and `PendingDecisionDto` (`dto/decisions.ts:34`) are both `= Placeholder`, the same object. `dtoComponents()` registers both as common schemas, and oRPC matches by identity. So route 52's items, and every inline `Placeholder` field (for example `missions.gateStrip`, `plan.roster`, `gates.log`), are emitted as `$ref: "#/components/schemas/MetricsDto"` in `docs/generated/openapi.json`.
  - **The fix:** in the Step 1 slice. CR-W2 gives `PendingDecisionDto` its own shape, and then any DTO that remains a bare alias of `Placeholder` should be its own object, or `dtoComponents()` should skip aliases. That's a contract item (Axis) with a `tools/docs` change, and its document diff is intended. S1-6 deliberately keeps the bytes the same.
