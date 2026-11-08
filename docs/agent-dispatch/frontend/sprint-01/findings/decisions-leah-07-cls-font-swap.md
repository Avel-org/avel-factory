status: open
severity: P2
owner: INT to decide (no size-matched fallback yet: decisions.md, "Fonts"); Fantem/Nemi

# CLS on `/` at 390x844 is 0.13 with the fonts arriving after first paint, over the 0.02 budget; the font swap is the cause

**Method.** Dev server, `AVEL_API=mock`, Chromium 390x844 touch. A `PerformanceObserver` for `layout-shift` registered before navigation, summed over 3 s after hydration. Three runs:
| Fonts | CLS |
| --- | --- |
| normal (local, fast) | 0.131 (one shift at 476 ms) |
| all woff2 aborted (fallbacks only) | 0 |
| each woff2 delayed 1.2 s (swap after first paint) | 0.137 |

So the swap causes it, not hydration. Shifted nodes (normal run): the Budget increase article 496->536 y, `dl.av-dt-facts` height 117->129, the `Contract change` article moved. With `font-display: swap` (`fonts.css:8,16,24`) and fallbacks `ui-monospace`/system sans with different metrics, text re-wraps when Inter and Plex Mono 400 arrive. The two preloads (`__root.tsx:45-56`) present but not enough: the fonts still land after first paint in dev. Not measured on a production build (the dev server only; the prod preview needs the server entry).

**Fix means:** a size-matched fallback `@font-face` (`size-adjust`, `ascent-override`) for Inter and Plex Mono, or `font-display: optional` for the mono. Re-measure; target under 0.02.
