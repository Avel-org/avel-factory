status: open
severity: P3
module: zod-mini
reviewer: brennan (review-spec)
reviewed commit: a36d3c8 (backend/sprint-01/agent-axis-zod-mini-api-contract-a1)
route to: INT (`packages/contract/package.json` is outside zod-mini's territory, and S1-6 keeps it unchanged); Axis, for the Step 1 server

# The root entry's English locale is a side effect in a package that says it has none: any bundled consumer loses S1-3's messages

## What's wrong
`packages/contract/src/index.ts:22` (07cc98b) runs `if (!z.core.globalConfig.localeError) z.config(z.locales.en());` as a top-level side effect. `packages/contract/package.json:6` still says `"sideEffects": false` (D58; S1-6 freezes the file). So a bundler is free to drop the statement whenever a consumer uses only the root's re-exports, and it does. The bundled consumer then puts `"Invalid input"` on the wire instead of S1-3's `"Invalid input: expected string, received undefined"` (`ErrorBody.message`, `details.issues[].message`).

This **isn't a defect in Axis's diff.** The S1-6 amendment (decisions.md, "Open (INT): bundling the root") records the case and the fix, and leaves it untested and outside the module. This finding is the test, so INT can rule on it with evidence.

Today nothing is affected. The server (as planned), `packages/contract-mock`, `tools/docs` and the tests all run on Node without a bundler, and the web imports only subpaths. The risk is the first bundled server or CLI build (the CLI is in another repo, and how it's built isn't stated here).

## Evidence
Scratch files only; nothing in the repo was changed.

1. **Without a bundler**, the root sets the locale and a subpath alone doesn't (this matches the amendment):
   ```
   $ node -e "import('./packages/contract/dist/dto/decisions.js') … DecideProposalInput.safeParse({})"
   {"expected":"string","code":"invalid_type","path":["proposalId"],"message":"Invalid input"}
   $ node -e "await import('./packages/contract/dist/index.js'); … same parse"
   {"expected":"string","code":"invalid_type","path":["proposalId"],"message":"Invalid input: expected string, received undefined"}
   ```
2. **Bundled, root import only.** The entry is `import { DecideProposalInput } from ".../packages/contract/dist/index.js"`, and it logs the first issue's message. Built with the workspace's vite 8.3.6 (rolldown), `build.ssr`, `ssr.noExternal: true`, `minify: false`:
   ```
   $ node bundle/out.mjs
   Invalid input
   ```
3. **The same bundle with the proposed fix.** This is a scratch copy of `packages/contract` (same `dist/`) whose `package.json` has `"sideEffects": ["./dist/index.js"]`:
   ```
   $ node bundle2/out.mjs
   Invalid input: expected string, received undefined
   ```

## Doc it breaks
- decisions.md S1-3: `BAD_REQUEST`'s `message` and `issues[].message` are zod's messages, and the locked RIGG-03 fixture pins them in English.
- decisions.md S1-6, "What doesn't change": S1-3's details. That holds for every unbundled consumer, and fails for a bundled one.
- The amendment's rule for consumers ("imports `@avel/contract` (the root) at least once") isn't enough under a bundler, because the import survives and the statement doesn't.

## What fixing it means
My ruling on Axis's open point: **take the packaging fix, before any consumer is bundled, and preferably in the S1-6 landing or straight after it.**
- In `packages/contract/package.json`, set `"sideEffects": ["./dist/index.js"]`. Under S1-2 and D58 this is packaging-only, so there's no bump. It costs the web nothing, because the web never imports `dist/index.js` (subpaths only, D58). It also makes the package's metadata true again. Who does it: INT, as a packaging change outside zod-mini's territory, or a one-line task in the next contract dispatch. Check: evidence 3 above, or a contract test that bundles a root-only import and asserts the English message.
- Also, belt and braces: the Step 1 server's error mapper (item 2.9) should not depend on an import side effect for the text it puts on the wire. Have it set `z.config(z.locales.en())` at boot, or assert `z.core.globalConfig.localeError` is set. This belongs to Step 1's slice (Axis), not here.
- The CLI (avel-cli repo) gets the same note through INT if it's bundled.
