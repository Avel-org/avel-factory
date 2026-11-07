status: open
severity: P2
title: SSR client's baseUrl comes from the incoming request URL (Host-derived)

Evidence: apps/web/src/router.tsx:23 `baseUrl: new URL(request.url).origin`. Behind a proxy the origin is built from the Host / forwarded headers, which the caller controls, so a forged Host sends the server's loader fetches to an attacker-chosen origin (SSRF). Nothing leaks today: sprint-01 forwards no cookies or key (router.tsx comment, UI contract section 3). But the contract says W5 adds the cookie beside the request ID, and then a forged Host would send the session to that origin.
This follows UI contract section 3 as written, so it isn't a Ghost deviation.
Fix: before W5, take the server-side API origin from configuration (an env var, or an allow-list of hosts) and not from the request. Record that on W5's dispatch. For sprint-01, no code change is needed.
