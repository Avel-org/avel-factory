status: routed (sprint-02, fallbacks revisited with the shell; Zero decisions.md 2026-11-07)
severity: P2
owner: INT to decide; Zero (section 6), Nemi (NEMI-03)

# Recommendation for section 6: change the formula to one average-width method and keep the fallbacks; they cut the swap to 0, but they are not what brings `/` under 0.02

**The version measured** (main + ac820a7's rules with the sans values recomputed): `size-adjust` 107.50% (v3 weighted average on both files: 972.28 / 904.46 = 1.07498), `ascent-override` = 1984/2048 / 1.07498 = 90.12%, `descent-override` = 494/2048 / 1.07498 = 22.44%, `line-gap-override` 0.00%. The mono rule is unchanged (99.98%, 102.52%, 27.50%): both files already use the same measure there (the advance of `0`, 600/1000 and 1229/2048), so there was no mix to fix. Faces before the swap: Arial and Courier New (CDP), same scratch fontconfig as finding 03.

Swap shift, fonts delayed 1.2 s, three runs each:

| Version | prod | prod, 4x CPU | dev |
| --- | --- | --- | --- |
| main (no fallback) | 0.0008 | 0.0008 | 0.0060 |
| main + ac820a7 (138.27%) | 0.0185 | 0.0185 | 0.0412 |
| main + one method (107.50%) | **0.0001** | **0.0001** | **0.0000** |

Fonts normal (no swap after paint): 0.132 in all three, the hydration shift (finding 01). No fallback changes it.

**Recommendation.**
1. Change the formula: `size-adjust` from one average-width method for both files. The a-to-z-and-space weighted average (OS/2 v3's definition) is reproducible from the glyph advances alone, needs no OS/2 table version, and checks against Arial's stored 904.
2. Keep the fallbacks. They are FM line 289's promise; with the corrected values they remove the swap shift (0.0008 -> 0.0001 prod, 0.006 -> 0.000 dev) and cost two `@font-face` rules and one CSS file.
3. State their limit in section 6: they only matter where `local("Arial")` or `local("Liberation Sans")` (and the Courier pair) resolve. Android has neither, so those users fall through to `system-ui` and get the main-column numbers. And nothing in this finding brings `/` under 0.02: finding 01 does.
4. Section 6's measure needs the 4x CPU throttle (finding 05), or it passes without a fallback on a fast machine.

**Caveats.** I measured with Arial and Courier New from Windows, not Liberation Sans and Liberation Mono: none is installed here. Their `xAvgCharWidth` was not checked. Only regular weights were exposed, so bold text is synthesized in both versions. Prod was served with `dist/server/server.js` and the mock; dev was the Vite dev server with `AVEL_API=mock`.

**Fix means:** Nemi changes the sans values in `font-fallbacks.css` as above, and the formula text in section 6 changes to the one method; then NEMI-03 merges.
