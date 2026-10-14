
## 5. The other follow-ups, controls first (base :5470 vs fix :5476)

### 5.1 `break-reach.spec.ts` "Break's over with a carried task" (the old `:179`, line 201 in the trial's spec), all 7 weekdays, frozen dates, 375×667 light @200 and 390×844 dark @200

Same spec file (the trial's, `BREAK_REACH_ALL_DAYS=1`, `-g "Break's over with a carried task" --grep-invert "844×390"`), `--workers=1`, run against each server. Base 00:13:55–00:18:03 (4.1 min), fix 00:18:03–00:22:16 (4.2 min). Logs `runs/break-reach-{5470,5476}.log`, JSON alongside.

| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| base 375×667 light | **✘** | ✓ | ✓ | **✘** | ✓ | ✓ | ✓ |
| base 390×844 dark | **✘** | ✓ | ✓ | **✘** | ✓ | ✓ | **✘** |
| fix 375×667 light | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| fix 390×844 dark | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Base: 9 passed, 5 failed. Every base failure message: `wheel: /^Put the kettle on/ brought wholly into view (centre y 730, visible 313–667)` (375×667 Mon, Thu) / `(centre y 838, visible 422–844)` (390×844 Mon, Thu, Sun), at `break-reach.spec.ts:172`. Fix: 14 passed.
(Playwright printed the test location as `:201:5` on the base run and `:261:136` on the fix run, same file and titles.)

### 5.2 Next brew over the status line (Settings › Next brew on, Monday; the next brew starts by itself; ~4.5 s sampled)

| Configuration | Base: drawn intersections with the notice on top (no sheet) | Base: what (first records) | Base: 9-point control hits | Fix: drawn intersections (no sheet) | Fix: 9-point control hits |
|---|---|---|---|---|---|
| 390×844 light 100 | 70 text | "Kettle's on. Nice start." 30, "Whistles at 16:25" 30 | 0 | 0 | 0 |
| 844×390 light 200 | 158 text | "Kettle's on. Nice start." 28, countdown digits "2" 15, "5" 9, "4" 5 | 0 | 31 text, all the countdown ":" line box (1–5 px), the countdown on top | 0 |
| 375×667 dark 200 | 233 text + 3 control | countdown digits, "Whistles at 16:25", "Kettle's on. Nice start.", "Next brew whenever you're ready" | 3 points | 0 | 0 |

Fix, all 22 configurations (§1.2): the "Recipe done: Take a full tea break · +10 leaves" notice was drawn in the nextbrew state in every configuration; the only drawn intersections in that state are the ":" rows listed in §1.2 (667×375 and 844×390 at 200 %), 0 control hits.

### 5.3 The Ambience sheet with notices queued

BASEAMB

### 5.4 Folded notices

BASEFOLD

### 5.5 Today right after End (base vs fix, same group)

| Configuration (light) | Base: 9-point control hits by a notice, no sheet | Base: drawn control / text intersections, notice on top | Fix: 9-point control hits, no sheet | Fix: drawn intersections, no sheet |
|---|---|---|---|---|
| 390×844 100 | 318 | 341 / 278 | 0 | 0 |
| 390×844 200 | 447 | 478 / 558 | 0 | 0 |
| 375×667 100 | 266 | 294 / 220 | 0 | 0 |
| 375×667 200 | 133 | 199 / 287 | 0 | 0 |
| 844×390 100 | 168 | 245 / 441 | 0 | 0 |
| 844×390 200 | 133 | 255 / 413 | 0 | 0 |
| 667×375 100 | 169 | 201 / 500 | 0 | 0 |
| 667×375 200 | 177 | 177 / 301 | 0 | 0 |

(Base: `probes/cmp/*-BASE-home+end.json`, the `end` group only; fix: the `end` group of `probes/fix/*.json`.)

### 5.6 R5-D1, LEAD-D1, R7-D1 and D4 (must keep passing)

SUITES56
