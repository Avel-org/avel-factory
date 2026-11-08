status: open
severity: P3

# w0-split-zero-01: section 6's alarm says "any of the three stubs wasn't used", which start-client-core 1.170.39 makes impossible

**Where:** `apps/web/vite.config.ts:191-207` (the alarm in `generateBundle`, condition at line 200), against UI contract section 6, "The server-function stub", "The alarm" (`docs/ui-contracts/decisions-approval-page.md:560`): "a client build fails if any of the three stubs wasn't used."

**What the diff does:** the client build fails if **no** stub was used, or if any real `start-client-core/dist/esm/client-rpc/*` module, `seroval` or `seroval-plugins` has rendered code in a client chunk (`serverFnOnlyModules`, line 124). The builder reported this as Deviation 1.

**Why the contract's wording can't be built:** in `@tanstack/start-client-core` 1.170.39, the client reaches the three modules only through `client/ServerFunctionSerializationAdapter.js` → `client-rpc/createClientRpc.js`. `serverFnFetcher.js` is imported from `createClientRpc.js` and the package root `index.js` (not in the client graph). `frame-decoder.js` is imported only from `serverFnFetcher.js`. With `createClientRpc.js` stubbed, the other two never load. A check for "all three used" would fail every build.

**Evidence** (my run, at 0d5626e, after `pnpm --filter "@avel/web..." build`):
```
$ for f in serverFnFetcher createClientRpc frame-decoder; do printf "%s: " $f; grep -c "$f.js is stubbed" apps/web/dist/client/assets/*.js | grep -v ':0' || echo none; done
serverFnFetcher: none
createClientRpc: apps/web/dist/client/assets/index-C_5BT1FF.js:1
frame-decoder: none
$ grep -rln "./serverFnFetcher\|./frame-decoder\|client-rpc/createClientRpc" <start-client-core 1.170.39>/dist/esm --include=*.js
index.js
client-rpc/createClientRpc.js
client-rpc/serverFnFetcher.js
client/ServerFunctionSerializationAdapter.js
```
Renaming all three stub keys (scratch worktree, not committed) fails the build: `RolldownError: The server-function stub no longer holds in the client build (stubs used: none; server-function code in the client: …/seroval@1.7.9/…/seroval/dist/index.js, …`. So the built alarm catches the rename the contract worries about, and also a new import path to the RPC code. It's a stronger check than the wording, not a weaker one.

**What fixing it means:** a contract change only, with no code change. Revision 12 of section 6 rewords "The alarm" to what's built: "a client build fails if no stub was used, or if any of `start-client-core`'s `client-rpc` modules, `seroval` or `seroval-plugins` has code in a client chunk." Record it in `decisions.md`. The w0-split diff stands as built.
