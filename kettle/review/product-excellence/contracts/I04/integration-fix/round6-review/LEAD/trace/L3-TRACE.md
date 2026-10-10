# LEAD trace-check of L3/RECEIPT.md (22:47–23:05 UTC)

## Verified myself from raw evidence (not counts)

- **3a, the cause of forward Tab at 100 % (M2's (d)).**
  - Raw `3a/kbd-R6-375x667-t100-light-Tab.log`:
    - Tab 11 at scrollY 223 has lift 178 and zone [319,489].
    - Tab 12 at 6281 ms focuses "Put the kettle on" (box 235–295) at scrollY 513/1392. After it: lift null, zone
      [311,481], hit "Change brew length@301-325".
    - The 50 ms series shows the zone switching to [311,481] at 5851 ms; the warning `li` is removed at 6190 ms and
      re-added at 10015 ms; the second cycle is 15941/19767.
  - Raw `3a/R6-sweep-t100.log` (max scroll 754):
    - At scrollY 500/525/550 the dock bottom is 377/352/327, under the 400.2 line, so the region falls back to its
      stylesheet bottom (481, style ""). "Change brew length" (343–367 / 318–342 / 293–317) then lies in [311,481] and
      the warning is absent.
    - At 475 the dock bottom is 402, so the lift applies (region 292) and the warning is present.
    - At 575 the link is at 268–292, above 311, and the warning is present.
    - So the mechanism is M1's 60 % rule leading to the stylesheet-bottom zone overlapping a dock control. L3's
      correction stands: it is a scroll window, not "the page end".
  - `3a/INT-sweep-t100.log`: absent from 325 to 550. On INT the region drops to the stylesheet bottom (style "") as
    soon as the dock moves, and INT's zone reaches up to `region.top`, so the window is wider.
  - Clip scan (`trace/clipscan.py` on `video-3a-{R6,INT}-375x667-t100-light-Tab.webm`): R6 is absent 13.88–17.80 s and
    24.52–28.84 s; INT is absent 14.16–18.44 s and 25.04–29.72 s. This matches the logs' about 3.8 s absences.
  - **Classification input:** present on INT, not worse on R6 (the R6 window is narrower; 200 % is better on R6 at
    15/15 against 6/15). FOLLOW-UP (owner M1 and I04: `flow.ts` `protectedUnderToasts()` / `toastLiftBottom()`'s 60 %
    rule).
- **LEAD-D1 cause:** verified by counterfactual (`lead-d1/README.md`): warning-only `order:-2` gives 1/0 in 5 of 5
  runs; the control gives 11/10 in 3 of 3, with 30/30 removals preceded by the box over the dock.

## Taken from L3, raw files sampled (traceable)

- 3b: `blink2-R6` takeAways 72.3 / 90.6 / 91.1 / 72.9 / 60.9 ms with Save backup reached 6/6; `blink2-INT` has 4 of 6
  take-aways never re-shown and reached 2/6. These match the receipt.
- 3e: `back2` summaries, R6 100 % hit ms [285,137,221,168,166,172,260,167]; INT [1960,…,1868]. These match.
- 1: `m1-R6-phone.log` completeFull: summaryHeadingMounts 1, memRecordsForBrew 1. completeOk: the same. These match.
- 2, 3c, 3d, 3f, 3g: taken from the receipt; not re-derived by me.
