status: routed (sprint-02, fallbacks revisited with the shell; Zero decisions.md 2026-11-07)
severity: P3
owner: INT to decide (section 6's fallbacks); see cls-study-leah-03 and cls-study-leah-04

# The font swap itself shifts `/` by 0.0008 (prod) to 0.006 (dev) with no fallback: under the 0.02 budget; decisions-leah-07's "0.13 from the swap" was the hydration shift

Fonts each delayed 1.2 s, 390x844, three runs, main (the shift at about 1.23 s is the swap; faces from CDP `CSS.getPlatformFontsForNode`, read after first contentful paint):

| Server | Throttle | Runs | Swap shift | Sans / mono drawn before -> after |
| --- | --- | --- | --- | --- |
| prod | none | 0.0008 x3 | 1225-1243 ms | DejaVu Sans / DejaVu Sans Mono -> Inter / IBM Plex Mono |
| prod | 4x | swap 0.0008 x3 (plus the hydration shift, finding 01) | 1249-1263 ms | same |
| dev | none | 0.0060 x3 (plus 0.1320 at hydration) | 1229-1240 ms | same |

Swap sources: `span.av-dt-client` 114 -> 107 px wide, the "Needs you" tags 96 -> 93, `span.dec-count` 9 -> 10 (prod). The DejaVu fallback is wider than Inter by a few percent, which only shifts short inline runs. d8bc228 is the same (prod 0.0008 x3, dev 0.0059 / 0.0059 / 0.0059).

decisions-leah-07 said fonts aborted gave 0 and the swap gave the 0.13; on `/` as merged that no longer holds, and in fact never isolated the two (its "aborted: 0" ran on an earlier page, per Nemi). The swap is not why `/` misses 0.02. The size-matched fallback is still FM line 289's promise, for the smaller shift it removes (finding 04).

**Fix means:** none needed to meet 0.02 on the swap; see finding 04 for whether to keep the fallbacks.
