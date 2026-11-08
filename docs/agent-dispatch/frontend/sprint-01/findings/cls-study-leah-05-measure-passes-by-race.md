status: open
severity: P2
owner: Zero (section 6 "The measure", section 8)

# Section 6's measure can pass at 0.0008 while the page shifts 0.13 on a phone: first paint is held past hydration by the delayed fonts

With every `woff2` delayed 1.2 s, Chromium holds first contentful paint to 130-160 ms, after hydration (66-92 ms). The desk layout is never painted, so finding 01's shift isn't counted: main reads 0.0008 and the measure would pass 0.02. The same build with the CPU throttled 4x (`Emulation.setCPUThrottlingRate`, rate 4) paints at 228-272 ms, before hydration (290-330 ms), and reads 0.1296. Evidence: `fcp=` and `hyd=` columns in the run logs (report, Verification).

**Fix means:** add to section 6's measure a run at 4x CPU throttle, and record FCP and the hydration time with each run, so a pass can't come from first paint coming late. Also say that `hadRecentInput` is true on the hydration shift under touch emulation and that the sum includes flagged entries.
