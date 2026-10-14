
## 6. Not worse (fix :5476, `--workers=1`, own `--output`)

SUITES6

## 7. Incomplete, deviations, and things to know about this run

- **Slots:** Lane R held 2 of the 3 browser slots and Lead queued jobs for the whole window, so Lane T ran one browser at a time (`--n 1`); the probe ran 3 contexts in that one browser (`--par 3`), which slowed timing-sensitive steps (the "+0.6 s" Mark done taps landed at 687–1,834 ms where no scroll was needed).
- **`notice-strip.spec.ts`** was run with `--workers=1` under one slot, not `--workers=2` as the brief says (two slots were never free to Lane T); see §1.4.
- **Not run:** `integrity.spec.ts` (only started, then stopped by Lane T at 2 of 77 tests of the first combined run), `a11y.spec.ts` (2 tests of `:61` passed in that stopped run; D4's tests not reached), and any suite not listed in §6.
- **Probe gaps:** History at 375×667 dark @200 failed in the matrix (dialog wait) and was taken from the A2 re-run; Import "run out" not measured at 1440 (the result row stays while the mouse rests on it, §2); Lane T captured no frame of a leaving sheet, so whether a notice pixel is drawn over a leaving sheet is not established (§1.3); the "finger in the air" trials did not record what already occupied the strip in 7 of 16 trials (§4.1); base groups that raise notices on demand were run only at 4 configurations (C).
- Every setup used the debug API; under test, only real taps, wheel, keys and the real file chooser. No source was edited; nothing committed or pushed. Scripts live in `/home/user/wt/w4tr-t2/kettle/.tmp/LT/` (untracked) and are copied to `LT/tools/`.
- All Lane T processes were started under the slot gate and have exited (checked at the end, §8).
