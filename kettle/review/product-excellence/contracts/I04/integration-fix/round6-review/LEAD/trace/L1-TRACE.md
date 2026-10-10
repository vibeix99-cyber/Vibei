# LEAD trace-check of L1/RECEIPT.md (21:35–21:55 UTC)

- **Probe hashes:** race.mjs, natural.mjs, lib.mjs and repro6.mjs in L1/probes match /tmp/rv6-servers/probe-sha256.txt.
  race-x.diff and natural-x.diff are as declared: the R5 code path is unchanged, and the R6 path is made direction-aware.
- **Independent re-judge** of the raw jsonl (LEAD/trace/l1_judge.py; entry = the first 1.2 s after full opacity
  excluded; then re-show, box below the list bottom, box over the dock, fade). Runs with the box below the room on R5 vs
  R6:
  - race 10/10/7 vs 0/0/0 (R6 list never scrolled: vacuous, agrees with L1);
  - race-x (rx) 9/10/8 vs 0/0/0 (R6 list scrolled 10/10 per config);
  - racex+video (375L) 9 vs 0;
  - natural 3/3/1 vs 0 (R6 not scrolled);
  - natural-x pair 0/1/1 vs 0 (R6 scrolled 10/10);
  - natural-x R5 alone (dnx) 375L 4, 844L 2; natural-x R6 alone (dnx6) 375L 0.
  - R6's maximum (warning bottom − list bottom) is −2 px in every judged frame of every R6 series checked.
  These agree with L1's tables. Differences of 0–1 run at natural 844 come from the entry-phase definition.
- **Clips:**
  - R5 375L racex run0: a per-frame scan of the "Save backup" crop (LEAD/trace/clipscan.py → scan-R5-375L.txt) finds the
    warning gone at 18.32–18.64 s and back at 18.68 s. Frames l1-frames/R5-375L-event/e008 (fading) and e012 (gone)
    were opened.
  - R6 375L, 375D and 844L naturalx run0: the scans show the warning present continuously from first appearance to the
    end of the clip. Frame R6-375L-event/e006 (list scrolled, older toasts fading, warning in place) was opened.
- **Verdict input:**
  - race-x: R6 zeros count. Caveat: L1 dispatches one synthetic hold/release per run, and on R6 the release happens with
    the list at rest at 375.
  - natural-x: R6 zeros count only against the R5-alone control (375L 4/10, 844L 2/10); 375D does not count (1/10).
  - repro6 and the extra gestures: the R5 control was not reproduced, so their R6 zeros do not count.
  - The orchestrator's alone-rerun is pending.
- **Page-scroll chain** (fling or arrow keys scroll the page and the dock rises under the region): seen on R6 and on R5.
  It is maker Still-open 2. INT comparison needed (L3).
