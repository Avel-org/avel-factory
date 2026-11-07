status: open
severity: P3
owner: Nemi (`apps/web/vite.config.ts`)

# Size study 06: build options (candidate 6)

**Measurement, not a defect.** Baseline `/` first load 174.35 kB gzip (vite: entry 157.31 + route chunk 17.04).

## Result: nothing to gain
| Option | first load, vite gzip | change |
| --- | --- | --- |
| `build.target: "esnext"` | 157.31 + 17.04 = 174.35 | 0.00 (the output is identical: the default `baseline-widely-available` target already leaves the code as written) |
| `build.target: "es2022"` | 174.35 | 0.00 |
| `build.minify: "esbuild"` (instead of the default Oxc) | 163.42 + 17.24 = 180.66 | **+6.31** (Oxc is better) |
| `build.minify: "esbuild"` with `target: "esnext"` | 163.41 + 17.24 | +6.30 |
| Rolldown `treeshake: { propertyReadSideEffects: false, unknownGlobalSideEffects: false }` | 157.22 + 16.78 = 174.00 | -0.35 (assumes property reads are pure: unsafe for getters; not worth it) |
| Rolldown `treeshake: { moduleSideEffects: false }` | identical to baseline | 0.00 (no effect) |
| Rolldown `output.minify` `{ mangle: { toplevel: true } }`, with and without `compress` | identical to baseline | 0.00 (Vite's `build.minify` governs; a `compress` object is rejected by the schema: "Expected (boolean | Object) but received Object") |

## Checks on the baseline bundle (`index-DEz1F4dU.js`, 502 kB raw)
```
legal comments (@license, @preserve, /*!):      0
modulepreload polyfill (relList.supports):      absent
process.env / NODE_ENV / "development" / import.meta.hot:   0 occurrences
packages in the sourcemap: 26; any package in two versions:   none
```
- **Legal comments:** none are emitted; nothing to strip.
- **Modulepreload polyfill:** not in the bundle. Start has no HTML entry, so Vite doesn't inject it.
- **Dev-only code:** `NODE_ENV` is replaced and the dev branches are gone. The remaining `Warning:` and `__REACT_DEVTOOLS` strings (8 each) are react-dom's production messages and its DevTools hook, which production builds keep.
- **Duplicate copies:** the sourcemap lists each package once. (`zod` is classic only; `zod/v4/core` is part of it.)

## Level: A for the figures
Each option is a real build of the baseline. Only the sizes were read, since none changes the page's behaviour except the treeshake option, which I did not run through the flow.

## Cost and risk
None to recommend. The one non-zero line (`propertyReadSideEffects: false`) changes how every dependency is tree-shaken for 0.35 kB.

## Recommendation: don't
The default build is already the smallest of the options Vite 8 offers here.
