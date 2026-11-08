status: open
severity: P3
title: serverFnGuard scans only apps/web/src for the string "createServerFn"

Evidence: apps/web/vite.config.ts `serverFnGuard` (filesUnder(srcDir) + `includes("createServerFn")`).
A server function defined outside apps/web/src (e.g. a workspace package the web imports) is not
caught: the stub silently resolves its client half to a function that throws at runtime, and the
alarm (generateBundle) only checks that real client-rpc modules/seroval are absent, so it passes.
I confirmed the guard fires for src (temp file src/zz-guard.ts -> RolldownError "createServerFn appears in zz-guard.ts"; file removed, tree clean).

Fix: none required for sprint-01 (UI contract section 6 scopes the guard to apps/web/src). Optionally
note the limit in the contract, or extend the scan to workspace packages the web imports.
