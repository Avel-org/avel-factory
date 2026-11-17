status: resolved (a2, 1f6c6a8, checked by Zane)
severity: P3
title: Forwarded X-Request-Id is taken from the incoming request without a check

Evidence: apps/web/src/router.tsx:21-25 passes the incoming `X-Request-Id` through as `requestId`; client.ts `wrapFetch` sets it on every SSR request. There's no length or character check. A caller can supply a huge or log-forging value (control characters, fake log lines) that downstream logs and the echoed response carry.
Fix: accept it only if it matches a UUID, or a short `[A-Za-z0-9-]{1,64}`, and otherwise let the wrapper make a new one.
