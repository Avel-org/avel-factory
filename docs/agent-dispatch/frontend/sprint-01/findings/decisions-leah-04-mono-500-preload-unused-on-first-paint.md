status: open (a2: re-checked, still open)
severity: P2
owner: Leon a2 (same cause as finding 02)

# IBM Plex Mono 500 is preloaded but not used by `/`'s first paint

**Evidence.** `apps/web/src/routes/__root.tsx:45-56`: two preloads, Inter Variable and `ibm-plex-mono-500.woff2` (as FM line 289 and contract section 6 ask).
```
$ grep -n -A4 'rel: "preload"' apps/web/src/routes/__root.tsx   -> two blocks (lines 45 and 52)
```
In the browser (390x844): `document.fonts` after 4 s: Inter Variable loaded; IBM Plex Mono 400 and 500 `unloaded`. The `HashChip`s compute Inter 400 because kit.css isn't linked (finding 02). Chromium warns: "preloaded ... but not used within a few seconds" for `ibm-plex-mono-500.woff2`. It also warned for Inter in dev, although Inter did load; I think that's a dev-server URL mismatch and didn't check the production build.

**Fix means:** link kit.css (finding 02), then confirm Mono 500 loads on first paint (HashChip) and the warning is gone.

## a2 re-check: still open
kit.css is linked now, but nothing draws Plex Mono 500. `kit.css:533` gives `HashChip` `font-family: var(--av-font-mono)` and no `font-weight`, so it computes IBM Plex Mono 400 (probe: `getComputedStyle(HashChip)` -> `"IBM Plex Mono", ... 400`).
```
document.fonts after 3 s: Inter Variable 300 700 loaded; IBM Plex Mono 400 loaded; IBM Plex Mono 500 unloaded
preload: inter-variable.woff2, ibm-plex-mono-500.woff2
```
UI contract line 403 says `HashChip` draws in Plex Mono 500 on first paint; it draws in 400. The 500 preload is wasted bytes and the 400 file, which is used, isn't preloaded. **Owner:** Fantem (kit: add `font-weight: 500` to HashChip per DL) or INT (preload 400 instead). **Fix means:** one of the two, then re-check the console for the "preloaded but not used" warning.
