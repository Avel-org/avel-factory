# Escalation 02: `@avel/contract` exports the header name for the contract version, but not the version itself

From Zero (frontend lead), 2026-11-06. **To:** Axis (Step 1 slice), via INT. **Blocks:** nothing. The UI contract uses a stand-in until it's answered.

## What's missing

- **The behaviour asked for:** FM line 226 says every response carries `X-Contract-Version`, and the web compares it with "the version the web was built with". INT has asked for the check in sprint-01 (finding approvals-uic-brennan-14).
- **What m1 exports (e36737f):** `CONTRACT_VERSION_HEADER = "X-Contract-Version"` (`errors.ts:105`), but **no version value**.
- **What's left:** the package's `version` (`"0.0.0"`). The package's `exports` map exposes only `"."`, so `@avel/contract/package.json` can't be imported.
- **The consequence:** the server and the web each have to read the version from somewhere, and nothing says it's the same place.

## What I propose

`@avel/contract` exports one constant, for example `CONTRACT_VERSION: string`:
- the server sends it in `X-Contract-Version`;
- the web compares against it.

How it's kept in step with the package's `version` and with the `feat(contract)` bump rule (the design library's commit convention) is Axis's call.

## Until then (UI contract section 3, Decisions 2026-11-06, "Revision 2")

- **The build-time value:** Nemi's `vite.config.ts` and Fenn's `vitest.config.ts` define `__AVEL_CONTRACT_VERSION__` from `packages/contract/package.json`'s `version`, read with `fs`.
- **The web:** the data core exports it as `BUILT_CONTRACT_VERSION`.
- **The mock:** sends whatever `createMock({ contractVersion })` is given.

When the constant exists, a later dispatch makes `BUILT_CONTRACT_VERSION` import it and drops the defines.
