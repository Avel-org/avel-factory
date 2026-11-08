status: open
severity: P2
owner: INT to decide NEMI-03 (ac820a7, held); Zero (section 6's formula)

# Section 6's formula (ac820a7) makes the swap shift 20 to 7 times larger than no fallback; it mixes OS/2 v4 and v3 `xAvgCharWidth`

main + ac820a7 (size-adjust 138.27%, ascent 70.06%, descent 17.44%; mono 99.98% / 102.52% / 27.50%). Fonts delayed 1.2 s, three runs, swap shift only (the hydration shift is finding 01). Faces before the swap: **Arial** and **Courier New**, through the rule's `local()` (CDP, scratch `FONTCONFIG_FILE` exposing `/mnt/c/Windows/Fonts` arial.ttf and cour.ttf; without it neither source resolves here and the page draws DejaVu).

| Version | prod | prod, 4x CPU | dev |
| --- | --- | --- | --- |
| main (no fallback) | 0.0008 x3 | 0.0008 x3 | 0.0060 x3 |
| main + ac820a7 | **0.0185 x3** | **0.0185 x3** | **0.0412 x3** |

On prod the formula's version is 0.0185, 0.0015 under the budget with nothing else shifting; on dev it is 0.0412 (matching Nemi's 0.0411 and, with the hydration shift, his 0.172). It is worse than having no fallback in every row.

**Cause.** The sans `size-adjust` divides Inter's OS/2 v4 `xAvgCharWidth` (1250, the mean over all glyphs) by Arial's v3 value (904, a weighted a-to-z-and-space average). I recomputed both with the v3 weights through Chromium's `measureText` at 2048 px: Inter 972.28, Arial 904.46 (Arial's stored 904 matches, so the method checks). 972.28 / 904.46 = 107.50%, not 138.27%. At 138.27% the fallback draws about 29% too wide.

**Fix means:** change section 6's formula to one method for both files (finding 04), or drop NEMI-03. Do not merge ac820a7 as it is.
