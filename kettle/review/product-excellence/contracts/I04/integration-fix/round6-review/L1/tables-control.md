| probe | config | R5 runs | R5 R5-D1 runs (A: after entry phase) | R5 events after first input (B) | R5 probe FAIL | control reproduced twice? (A / B) | R6 runs | R6 R5-D1 runs (A) | R6 events after first input (B) | R6 probe FAIL | R6 list scrolled in (runs) | R6 older toast left while scrolled (runs) | R6 page-scroll-induced hide/overlap (runs) | R6 zeros count? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| natural | 375×667 light | 10 | 3 | 6 | 3 | YES / YES | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NO (R6 list never scrolled: trigger state not exercised) |
| natural | 375×667 dark | 10 | 3 | 5 | 3 | YES / YES | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NO (R6 list never scrolled: trigger state not exercised) |
| natural | 844×390 light | 10 | 0 | 8 | 3 | NO / YES | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NO (R6 list never scrolled: trigger state not exercised) |
| natural R5-alone (diagnostic) | 844×390 light | 10 | 0 | 6 | 3 | NO / YES | 0 | 0 | 0 | 0 | 0 | 0 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| natural-x | 375×667 light | 10 | 0 | 6 | 0 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-x | 375×667 dark | 10 | 1 | 5 | 1 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-x | 844×390 light | 10 | 1 | 8 | 3 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-x R5-alone (diagnostic) | 375×667 light | 10 | 4 | 6 | 4 | YES / YES | 0 | 0 | 0 | 0 | 0 | 0 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| natural-x R5-alone (diagnostic) | 375×667 dark | 10 | 1 | 7 | 1 | NO / YES | 0 | 0 | 0 | 0 | 0 | 0 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| natural-x R5-alone (diagnostic) | 844×390 light | 10 | 2 | 5 | 4 | YES / YES | 0 | 0 | 0 | 0 | 0 | 0 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| natural-x R6-alone (diagnostic) | 375×667 light | 0 | 0 | 0 | 0 | NO / NO | 10 | 0 | 0 | 0 | 10 | 10 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| natural-x R6-alone (diagnostic) | 375×667 dark | 0 | 0 | 0 | 0 | NO / NO | 10 | 0 | 0 | 0 | 10 | 10 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| natural-x R6-alone (diagnostic) | 844×390 light | 0 | 0 | 0 | 0 | NO / NO | 10 | 0 | 0 | 0 | 10 | 10 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| natural-x+video | 375×667 light | 10 | 0 | 5 | 0 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-x+video | 375×667 dark | 4 | 0 | 4 | 0 | NO / YES | 4 | 0 | 0 | 0 | 4 | 4 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-x+video | 844×390 light | 4 | 0 | 4 | 1 | NO / YES | 4 | 0 | 0 | 0 | 4 | 4 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| race | 375×667 light | 10 | 10 | 10 | 10 | YES / YES | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NO (R6 list never scrolled: trigger state not exercised) |
| race | 375×667 dark | 10 | 10 | 10 | 8 | YES / YES | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NO (R6 list never scrolled: trigger state not exercised) |
| race | 844×390 light | 10 | 7 | 7 | 6 | YES / YES | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NO (R6 list never scrolled: trigger state not exercised) |
| race-x | 375×667 light | 10 | 9 | 9 | 7 | YES / YES | 10 | 0 | 0 | 0 | 10 | 0 | 0 | YES |
| race-x | 375×667 dark | 10 | 10 | 10 | 7 | YES / YES | 10 | 0 | 0 | 0 | 10 | 0 | 0 | YES |
| race-x | 844×390 light | 10 | 8 | 8 | 6 | YES / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | YES |
| race-x+video | 375×667 light | 10 | 9 | 9 | 7 | YES / YES | 10 | 0 | 0 | 0 | 10 | 0 | 0 | YES |
| race-x+video | 375×667 dark | 4 | 4 | 4 | 3 | YES / YES | 4 | 0 | 0 | 0 | 4 | 0 | 0 | YES |
| race-x+video | 844×390 light | 4 | 3 | 3 | 1 | YES / YES | 4 | 0 | 0 | 0 | 4 | 4 | 0 | YES |
| repro6-sel | 375×667 light | 10 | 0 | 0 | 7 | NO / NO | 10 | 0 | 0 | 0 | 9 | 7 | 0 | NO (control not reproduced) |
| repro6-sel | 375×667 dark | 10 | 0 | 2 | 10 | NO / YES | 10 | 0 | 0 | 0 | 8 | 6 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| repro6-sel | 844×390 light | 10 | 0 | 2 | 10 | NO / YES | 10 | 0 | 0 | 0 | 4 | 4 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| repro6 (control = repro6-sel R5) | 375×667 light | 10 | 0 | 0 | 7 | NO / NO | 20 | 0 | 0 | 0 | 8 | 5 | 0 | NO (control not reproduced) |
| repro6 (control = repro6-sel R5) | 375×667 dark | 10 | 0 | 2 | 10 | NO / YES | 20 | 0 | 0 | 0 | 8 | 5 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| repro6 (control = repro6-sel R5) | 844×390 light | 10 | 0 | 2 | 10 | NO / YES | 20 | 0 | 0 | 0 | 2 | 2 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| gesture-fling | 375×667 light | 10 | 0 | 1 | 7 | NO / NO | 10 | 0 | 0 | 1 | 6 | 6 | 1 | NO (control not reproduced) |
| gesture-fling | 375×667 dark | 10 | 0 | 1 | 9 | NO / NO | 10 | 0 | 0 | 0 | 6 | 6 | 0 | NO (control not reproduced) |
| gesture-fling | 844×390 light | 10 | 0 | 1 | 10 | NO / NO | 10 | 0 | 0 | 3 | 6 | 6 | 3 | NO (control not reproduced) |
| gesture-fine | 375×667 light | 10 | 1 | 2 | 10 | NO / YES | 10 | 0 | 0 | 0 | 7 | 7 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| gesture-fine | 375×667 dark | 10 | 0 | 1 | 10 | NO / NO | 10 | 0 | 0 | 0 | 6 | 6 | 0 | NO (control not reproduced) |
| gesture-fine | 844×390 light | 10 | 0 | 1 | 10 | NO / NO | 10 | 0 | 0 | 0 | 5 | 4 | 0 | NO (control not reproduced) |
| gesture-kbd | 375×667 light | 10 | 0 | 1 | 9 | NO / NO | 10 | 0 | 0 | 0 | 6 | 6 | 0 | NO (control not reproduced) |
| gesture-kbd | 375×667 dark | 10 | 0 | 1 | 8 | NO / NO | 10 | 0 | 0 | 0 | 6 | 5 | 0 | NO (control not reproduced) |
| gesture-kbd | 844×390 light | 10 | 0 | 0 | 10 | NO / NO | 10 | 0 | 0 | 5 | 5 | 5 | 5 | NO (control not reproduced) |
| natural-g fling | 375×667 light | 10 | 1 | 4 | 1 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-g fling | 375×667 dark | 10 | 0 | 4 | 0 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-g fine | 375×667 light | 10 | 0 | 5 | 0 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-g fine | 375×667 dark | 10 | 0 | 3 | 0 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| natural-g fine | 844×390 light | 10 | 0 | 7 | 1 | NO / YES | 10 | 0 | 0 | 0 | 10 | 10 | 0 | WEAK (control reproduced only under reading B: entry-type flicker after the first input counted) |
| gesture-fling (warning-only classes) | 375×667 light | 10 | 0 | 0 | 7 | NO / NO | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NO (R6 list never scrolled: trigger state not exercised) |
| gesture-fling (warning-only classes) | 375×667 dark | 10 | 0 | 0 | 9 | NO / NO | 10 | 0 | 0 | 1 | 0 | 0 | 1 | NO (R6 list never scrolled: trigger state not exercised) |
| repro6-sel R5-alone (diagnostic) | 375×667 light | 10 | 0 | 1 | 8 | NO / NO | 0 | 0 | 0 | 0 | 0 | 0 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| repro6-sel R5-alone (diagnostic) | 844×390 light | 10 | 0 | 1 | 10 | NO / NO | 0 | 0 | 0 | 0 | 0 | 0 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| repro6-sel R6-alone (diagnostic) | 375×667 light | 0 | 0 | 0 | 0 | NO / NO | 10 | 0 | 0 | 0 | 8 | 6 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
| repro6-sel R6-alone (diagnostic) | 844×390 light | 0 | 0 | 0 | 0 | NO / NO | 10 | 0 | 0 | 0 | 4 | 4 | 0 | n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe) |
