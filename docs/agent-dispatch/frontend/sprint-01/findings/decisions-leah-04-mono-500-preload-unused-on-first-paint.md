status: open
severity: P2
owner: Leon a2 (same cause as finding 02)

# IBM Plex Mono 500 is preloaded but not used by `/`'s first paint

**Evidence.** `apps/web/src/routes/__root.tsx:45-56`: two preloads, Inter Variable and `ibm-plex-mono-500.woff2` (as FM line 289 and contract section 6 ask).
```
$ grep -n -A4 'rel: "preload"' apps/web/src/routes/__root.tsx   -> two blocks (lines 45 and 52)
```
In the browser (390x844): `document.fonts` after 4 s: Inter Variable loaded; IBM Plex Mono 400 and 500 `unloaded`. The `HashChip`s compute Inter 400 because kit.css isn't linked (finding 02). Chromium warns: "preloaded ... but not used within a few seconds" for `ibm-plex-mono-500.woff2`. It also warned for Inter in dev, although Inter did load; I think that's a dev-server URL mismatch and didn't check the production build.

**Fix means:** link kit.css (finding 02), then confirm Mono 500 loads on first paint (HashChip) and the warning is gone.
