### Invariant (100 ms samples)

| config | samples | samples with a notice | of which a sheet open | NON-MODAL drawn overlaps, top=notice | top=other | top=third | ctl | text | row | 9-pt control points covered by a notice (non-modal, controls) | modal drawn intersections | under a sheet | 9-pt covered, sheet open (controls) | clipped/off-viewport intersections | cut notice samples | distinct notices seen | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1440x900-dark-t100 | 1271 | 722 | 47 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 47 | 12 | 0 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-dark-t200 | 1373 | 737 | 54 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 57 | 11 | 0 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-light-t100 | 1250 | 679 | 39 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 39 | 8 | 0 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-light-t200 | 1337 | 735 | 38 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 49 | 0 | 14 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 375x667-dark-t100 | 1229 | 625 | 38 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 197 | 17 | 3 | 0 | 13 |  |
| 375x667-dark-t200-reduced | 1245 | 639 | 39 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 194 | 32 | 104 | 0 | 13 |  |
| 375x667-dark-t200 | 1535 | 548 | 31 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 87 | 1 | 45 | 0 | 12 | stats: locator.waitFor: Timeout 10000ms exceeded. |
| 375x667-light-t100 | 1386 | 640 | 42 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 198 | 19 | 1 | 0 | 13 |  |
| 375x667-light-t200 | 1724 | 650 | 42 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 186 | 33 | 52 | 0 | 13 |  |
| 390x844-dark-t100 | 1409 | 649 | 53 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 194 | 35 | 0 | 0 | 13 |  |
| 390x844-dark-t200 | 1535 | 618 | 42 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 228 | 17 | 8 | 0 | 13 |  |
| 390x844-light-t100-reduced | 1412 | 644 | 66 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 351 | 43 | 0 | 0 | 13 |  |
| 390x844-light-t100 | 1275 | 666 | 45 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 234 | 31 | 0 | 0 | 13 |  |
| 390x844-light-t200 | 1473 | 671 | 45 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 229 | 16 | 8 | 0 | 13 |  |
| 667x375-dark-t100 | 1236 | 627 | 41 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 210 | 73 | 38 | 0 | 13 |  |
| 667x375-dark-t200 | 1508 | 645 | 43 | 0 | 67 | 0 | 0 | 67 | 0 | 0 | 1 | 178 | 30 | 647 | 0 | 13 |  |
| 667x375-light-t100 | 1314 | 650 | 50 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 238 | 81 | 47 | 0 | 13 |  |
| 667x375-light-t200 | 1528 | 661 | 45 | 0 | 56 | 0 | 0 | 56 | 0 | 0 | 3 | 181 | 39 | 650 | 0 | 13 |  |
| 844x390-dark-t100 | 1197 | 625 | 38 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 123 | 17 | 20 | 0 | 13 |  |
| 844x390-dark-t200 | 1472 | 682 | 49 | 50 | 94 | 0 | 0 | 144 | 0 | 0 | 8 | 192 | 55 | 210 | 0 | 14 |  |
| 844x390-light-t100 | 1355 | 617 | 39 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 158 | 13 | 0 | 0 | 13 |  |
| 844x390-light-t200 | 1417 | 672 | 59 | 0 | 63 | 0 | 0 | 63 | 0 | 0 | 1 | 266 | 51 | 521 | 0 | 13 |  |

### Inline Undo

| config | surface | before | action | appear ms (from pointerdown) | Undo row box | Undo 9/9 | scrollY before->at appear | restored | shown ms when left to run out | said entries |
|---|---|---|---|---|---|---|---|---|---|---|
| 1440x900-dark-t100 | Mark done | 9/9 inView=True | 694 ms scrolled=False | 1 | [308, 499, 559, 44] | 9 | 0->0 | {'field': 'Chapter 3 notes', 'markBack': True} | 5155 | 2 |
| 1440x900-dark-t100 | History mid | row top 622 | tap | 0 | [895, 622, 421, 60] | 9 | 1600->1600 (undo row top 622) | True | None | 1 |
| 1440x900-dark-t100 | History end | row top 629 | tap | 3 | [895, 634, 421, 60] | 9 | 2013->1956 (undo row top 634) | None | 5488 | 1 |
| 1440x900-dark-t100 | Import undo | row top 587 err=None | sessions 89 | 4 | [309, 587, 676, 60] | 9 | 2000->2000 (undo row top 587) | after undo 6 | None | 0 |
| 1440x900-dark-t100 | Import expire | row top None err=None | sessions None | None | None | None | None->None (undo row top None) |  | None | 0 |
| 1440x900-dark-t200 | Mark done | 6/9 inView=True | 6908 ms scrolled=True | 9 | [308, 320, 551, 44] | 9 | 0->425 | {'field': 'Chapter 3 notes', 'markBack': True} | 5168 | 2 |
| 1440x900-dark-t200 | History mid | row top 743 | tap | 13 | [895, 743, 421, 70] | 9 | 2800->2800 (undo row top 743) | True | None | 1 |
| 1440x900-dark-t200 | History end | row top 599 | tap | 11 | [895, 620, 421, 70] | 9 | 3600->3507 (undo row top 620) | None | 5776 | 1 |
| 1440x900-dark-t200 | Import undo | row top 634 err=None | sessions 89 | 8 | [309, 634, 676, 65] | 9 | 3200->3200 (undo row top 634) | after undo 6 | None | 0 |
| 1440x900-dark-t200 | Import expire | row top None err=None | sessions None | None | None | None | None->None (undo row top None) |  | None | 0 |
| 1440x900-light-t100 | Mark done | 9/9 inView=True | 687 ms scrolled=False | -1 | [308, 499, 551, 44] | 9 | 0->0 | {'field': 'Chapter 3 notes', 'markBack': True} | 5152 | 2 |
| 1440x900-light-t100 | History mid | row top 622 | tap | 7 | [895, 622, 421, 60] | 9 | 1600->1600 (undo row top 622) | True | None | 1 |
| 1440x900-light-t100 | History end | row top 629 | tap | 15 | [895, 634, 421, 60] | 9 | 2013->1956 (undo row top 634) | None | 5391 | 1 |
| 1440x900-light-t100 | Import undo | row top 587 err=None | sessions 89 | 3 | [309, 587, 676, 60] | 9 | 2000->2000 (undo row top 587) | after undo 6 | None | 0 |
| 1440x900-light-t100 | Import expire | row top None err=None | sessions None | None | None | None | None->None (undo row top None) |  | None | 0 |
| 1440x900-light-t200 | Mark done | 6/9 inView=True | 3223 ms scrolled=True | 14 | [308, 496, 551, 44] | 9 | 0->249 | {'field': 'Chapter 3 notes', 'markBack': True} | 5152 | 2 |
| 1440x900-light-t200 | History mid | row top 743 | tap | 2 | [895, 743, 421, 70] | 9 | 2800->2800 (undo row top 743) | True | None | 1 |
| 1440x900-light-t200 | History end | row top 599 | tap | 14 | [895, 620, 421, 70] | 9 | 3600->3507 (undo row top 620) | None | 5503 | 1 |
| 1440x900-light-t200 | Import undo | row top 634 err=None | sessions 89 | 5 | [309, 634, 676, 65] | 9 | 3200->3200 (undo row top 634) | after undo 6 | None | 0 |
| 1440x900-light-t200 | Import expire | row top None err=None | sessions None | None | None | None | None->None (undo row top None) |  | None | 0 |
| 375x667-dark-t100 | Mark done | 0/9 inView=True | 2135 ms scrolled=True | 15 | [36, 156, 303, 44] | 9 | 0->400 | {'field': 'Chapter 3 notes', 'markBack': True} | 5152 | 2 |
| 375x667-dark-t100 | History mid | row top 331 | tap | -4 | [36, 331, 303, 60] | 9 | 3107->3107 (undo row top 331) | True | None | 1 |
| 375x667-dark-t100 | History end | row top 347 | tap | -7 | [36, 353, 303, 60] | 9 | 3510->3504 (undo row top 353) | None | 5600 | 1 |
| 375x667-dark-t100 | Import undo | row top 450 err=None | sessions 89 | 6 | [18, 450, 339, 65] | 9 | 2400->2400 (undo row top 450) | after undo 6 | None | 2 |
| 375x667-dark-t100 | Import expire | row top 450 err=None | sessions 89 | -1 | [18, 450, 339, 65] | 9 | 2400->2400 (undo row top 450) |  | 10367 | 1 |
| 375x667-dark-t200-reduced | Mark done | 0/9 inView=False | 5387 ms scrolled=True | 15 | [36, 43, 303, 108] | 9 | 0->1128 | {'field': 'Chapter 3 notes', 'markBack': True} | 5136 | 2 |
| 375x667-dark-t200-reduced | History mid | row top 268 | synthetic | None | [36, 268, 303, 145] | 9 | 6400->6400 (undo row top 268) | True | None | 1 |
| 375x667-dark-t200-reduced | History end | row top 264 | synthetic | None | [36, 264, 303, 145] | 9 | 7200->7200 (undo row top 264) | None | 5872 | 1 |
| 375x667-dark-t200-reduced | Import undo | row top 377 err=None | sessions 89 | 7 | [18, 377, 339, 161] | 9 | 5200->5200 (undo row top 377) | after undo 6 | None | 2 |
| 375x667-dark-t200-reduced | Import expire | row top 377 err=None | sessions 89 | -1 | [18, 377, 339, 161] | 9 | 5200->5200 (undo row top 377) |  | 10384 | 1 |
| 375x667-dark-t200 | Mark done | 0/9 inView=False | 3218 ms scrolled=True | 1 | [36, 43, 303, 108] | 9 | 0->1241 | {'field': 'Chapter 3 notes', 'markBack': True} | 5136 | 2 |
| 375x667-dark-t200 | History mid | row top None | None | None | None | None | None->None (undo row top None) | None | None | 0 |
| 375x667-dark-t200 | History end | row top None | None | None | None | None | None->None (undo row top None) | None | None | 0 |
| 375x667-dark-t200 | Import undo | row top 377 err=None | sessions 89 | -6 | [18, 377, 339, 161] | 9 | 5200->5200 (undo row top 377) | after undo 6 | None | 2 |
| 375x667-dark-t200 | Import expire | row top 377 err=None | sessions 89 | 4 | [18, 377, 339, 161] | 9 | 5200->5200 (undo row top 377) |  | 10527 | 1 |
| 375x667-light-t100 | Mark done | 0/9 inView=True | 3175 ms scrolled=True | 4 | [36, 356, 303, 44] | 9 | 0->200 | {'field': 'Chapter 3 notes', 'markBack': True} | 5138 | 2 |
| 375x667-light-t100 | History mid | row top 238 | tap | 13 | [36, 238, 303, 60] | 9 | 3200->3200 (undo row top 238) | True | None | 1 |
| 375x667-light-t100 | History end | row top 347 | tap | 13 | [36, 353, 303, 60] | 9 | 3510->3504 (undo row top 353) | None | 6193 | 1 |
| 375x667-light-t100 | Import undo | row top 450 err=None | sessions 89 | -7 | [18, 450, 339, 65] | 9 | 2400->2400 (undo row top 450) | after undo 6 | None | 2 |
| 375x667-light-t100 | Import expire | row top 450 err=None | sessions 89 | 4 | [18, 450, 339, 65] | 9 | 2400->2400 (undo row top 450) |  | 10368 | 1 |
| 375x667-light-t200 | Mark done | 0/9 inView=False | 2448 ms scrolled=True | -1 | [36, 43, 303, 108] | 9 | 0->1241 | {'field': 'Chapter 3 notes', 'markBack': True} | 5168 | 2 |
| 375x667-light-t200 | History mid | row top 268 | synthetic | None | [36, 268, 303, 145] | 9 | 6400->6400 (undo row top 268) | True | None | 1 |
| 375x667-light-t200 | History end | row top 264 | synthetic | None | [36, 264, 303, 145] | 9 | 7200->7200 (undo row top 264) | None | 8162 | 1 |
| 375x667-light-t200 | Import undo | row top 377 err=None | sessions 89 | 3 | [18, 377, 339, 161] | 9 | 5200->5200 (undo row top 377) | after undo 6 | None | 2 |
| 375x667-light-t200 | Import expire | row top 377 err=None | sessions 89 | 6 | [18, 377, 339, 161] | 9 | 5200->5200 (undo row top 377) |  | 10383 | 1 |
| 390x844-dark-t100 | Mark done | 9/9 inView=True | 805 ms scrolled=False | -4 | [36, 556, 318, 44] | 9 | 0->0 | {'field': 'Chapter 3 notes', 'markBack': True} | 5171 | 2 |
| 390x844-dark-t100 | History mid | row top 619 | tap | 5 | [36, 619, 318, 60] | 9 | 2800->2800 (undo row top 619) | True | None | 1 |
| 390x844-dark-t100 | History end | row top 638 | tap | 2 | [36, 638, 318, 60] | 9 | 3200->3200 (undo row top 638) | None | 6416 | 1 |
| 390x844-dark-t100 | Import undo | row top 445 err=None | sessions 89 | -42 | [18, 445, 354, 65] | 9 | 2369->2369 (undo row top 445) | after undo 6 | None | 2 |
| 390x844-dark-t100 | Import expire | row top 445 err=None | sessions 89 | -8 | [18, 445, 354, 65] | 9 | 2369->2369 (undo row top 445) |  | 10383 | 1 |
| 390x844-dark-t200 | Mark done | 0/9 inView=False | 2843 ms scrolled=True | 4 | [36, 219, 318, 108] | 9 | 0->1019 | {'field': 'Chapter 3 notes', 'markBack': True} | 5136 | 2 |
| 390x844-dark-t200 | History mid | row top 376 | tap | -1 | [36, 376, 318, 121] | 9 | 6000->6000 (undo row top 376) | True | None | 1 |
| 390x844-dark-t200 | History end | row top 385 | tap | 1 | [36, 412, 318, 121] | 9 | 6787->6760 (undo row top 412) | None | 5568 | 1 |
| 390x844-dark-t200 | Import undo | row top 285 err=None | sessions 89 | 14 | [18, 285, 354, 161] | 9 | 5137->5137 (undo row top 285) | after undo 6 | None | 2 |
| 390x844-dark-t200 | Import expire | row top 285 err=None | sessions 89 | 11 | [18, 285, 354, 161] | 9 | 5137->5137 (undo row top 285) |  | 10464 | 1 |
| 390x844-light-t100-reduced | Mark done | 9/9 inView=True | 841 ms scrolled=False | 2 | [36, 556, 318, 44] | 9 | 0->0 | {'field': 'Chapter 3 notes', 'markBack': True} | 5136 | 2 |
| 390x844-light-t100-reduced | History mid | row top 219 | tap | -2 | [36, 219, 318, 60] | 9 | 3200->3200 (undo row top 219) | True | None | 1 |
| 390x844-light-t100-reduced | History end | row top 638 | tap | 12 | [36, 638, 318, 60] | 9 | 3200->3200 (undo row top 638) | None | 5760 | 1 |
| 390x844-light-t100-reduced | Import undo | row top 445 err=None | sessions 89 | 10 | [18, 445, 354, 65] | 9 | 2369->2369 (undo row top 445) | after undo 6 | None | 2 |
| 390x844-light-t100-reduced | Import expire | row top 445 err=None | sessions 89 | 6 | [18, 445, 354, 65] | 9 | 2369->2369 (undo row top 445) |  | 10163 | 1 |
| 390x844-light-t100 | Mark done | 9/9 inView=True | 1834 ms scrolled=False | 2 | [36, 556, 318, 44] | 9 | 0->0 | {'field': 'Chapter 3 notes', 'markBack': True} | 5168 | 2 |
| 390x844-light-t100 | History mid | row top 619 | tap | 4 | [36, 619, 318, 60] | 9 | 2800->2800 (undo row top 619) | True | None | 1 |
| 390x844-light-t100 | History end | row top 638 | tap | -1 | [36, 638, 318, 60] | 9 | 3200->3200 (undo row top 638) | None | 5458 | 1 |
| 390x844-light-t100 | Import undo | row top 445 err=None | sessions 89 | 7 | [18, 445, 354, 65] | 9 | 2369->2369 (undo row top 445) | after undo 6 | None | 2 |
| 390x844-light-t100 | Import expire | row top 445 err=None | sessions 89 | 14 | [18, 445, 354, 65] | 9 | 2369->2369 (undo row top 445) |  | 10351 | 1 |
| 390x844-light-t200 | Mark done | 0/9 inView=False | 2519 ms scrolled=True | -3 | [36, 219, 318, 108] | 9 | 0->1019 | {'field': 'Chapter 3 notes', 'markBack': True} | 5152 | 2 |
| 390x844-light-t200 | History mid | row top 376 | tap | -4 | [36, 376, 318, 121] | 9 | 6000->6000 (undo row top 376) | True | None | 1 |
| 390x844-light-t200 | History end | row top 385 | tap | -8 | [36, 412, 318, 121] | 9 | 6787->6760 (undo row top 412) | None | 5519 | 1 |
| 390x844-light-t200 | Import undo | row top 285 err=None | sessions 89 | -1 | [18, 285, 354, 161] | 9 | 5137->5137 (undo row top 285) | after undo 6 | None | 2 |
| 390x844-light-t200 | Import expire | row top 285 err=None | sessions 89 | 12 | [18, 285, 354, 161] | 9 | 5137->5137 (undo row top 285) |  | 10352 | 1 |
| 667x375-dark-t100 | Mark done | 3/9 inView=True | 1249 ms scrolled=True | -8 | [378, 141, 249, 44] | 9 | 0->70 | {'field': 'Chapter 3 notes', 'markBack': True} | 5136 | 2 |
| 667x375-dark-t100 | History mid | row top 219 | tap | -3 | [132, 219, 487, 60] | 9 | 3200->3200 (undo row top 219) | True | None | 1 |
| 667x375-dark-t100 | History end | row top 238 | tap | 15 | [132, 238, 487, 60] | 9 | 3600->3600 (undo row top 238) | None | 5584 | 1 |
| 667x375-dark-t100 | Import undo | row top 164 err=None | sessions 89 | 6 | [110, 164, 531, 60] | 9 | 2398->2398 (undo row top 164) | after undo 6 | None | 2 |
| 667x375-dark-t100 | Import expire | row top 164 err=None | sessions 89 | 7 | [110, 164, 531, 60] | 9 | 2398->2398 (undo row top 164) |  | 10384 | 1 |
| 667x375-dark-t200 | Mark done | 0/9 inView=False | 1322 ms scrolled=True | -6 | [378, 77, 249, 150] | 9 | 0->314 | {'field': 'Chapter 3 notes', 'markBack': True} | 5152 | 2 |
| 667x375-dark-t200 | History mid | row top 112 | tap | 0 | [132, 112, 487, 70] | 9 | 5065->5065 (undo row top 112) | True | None | 1 |
| 667x375-dark-t200 | History end | row top 72 | tap | -7 | [132, 111, 487, 70] | 9 | 5761->5722 (undo row top 111) | None | 6159 | 1 |
| 667x375-dark-t200 | Import undo | row top 139 err=None | sessions 89 | -1 | [110, 139, 531, 110] | 9 | 4000->4000 (undo row top 139) | after undo 6 | None | 2 |
| 667x375-dark-t200 | Import expire | row top 139 err=None | sessions 89 | -3 | [110, 139, 531, 110] | 9 | 4000->4000 (undo row top 139) |  | 10367 | 1 |
| 667x375-light-t100 | Mark done | 3/9 inView=True | 1132 ms scrolled=True | 4 | [378, 141, 249, 44] | 9 | 0->70 | {'field': 'Chapter 3 notes', 'markBack': True} | 5168 | 2 |
| 667x375-light-t100 | History mid | row top 219 | tap | -6 | [132, 219, 487, 60] | 9 | 3200->3200 (undo row top 219) | True | None | 1 |
| 667x375-light-t100 | History end | row top 238 | tap | 0 | [132, 238, 487, 60] | 9 | 3600->3600 (undo row top 238) | None | 6047 | 1 |
| 667x375-light-t100 | Import undo | row top 164 err=None | sessions 89 | 4 | [110, 164, 531, 60] | 9 | 2398->2398 (undo row top 164) | after undo 6 | None | 2 |
| 667x375-light-t100 | Import expire | row top 164 err=None | sessions 89 | 11 | [110, 164, 531, 60] | 9 | 2398->2398 (undo row top 164) |  | 10336 | 1 |
| 667x375-light-t200 | Mark done | 0/9 inView=False | 2116 ms scrolled=True | 14 | [378, 77, 249, 150] | 9 | 0->314 | {'field': 'Chapter 3 notes', 'markBack': True} | 5140 | 2 |
| 667x375-light-t200 | History mid | row top 112 | tap | -2 | [132, 112, 487, 70] | 9 | 5065->5065 (undo row top 112) | True | None | 1 |
| 667x375-light-t200 | History end | row top 116 | tap | -7 | [132, 116, 487, 70] | 9 | 5717->5717 (undo row top 116) | None | 5823 | 1 |
| 667x375-light-t200 | Import undo | row top 139 err=None | sessions 89 | -13 | [110, 139, 531, 110] | 9 | 4000->4000 (undo row top 139) | after undo 6 | None | 2 |
| 667x375-light-t200 | Import expire | row top 139 err=None | sessions 89 | 13 | [110, 139, 531, 110] | 9 | 4000->4000 (undo row top 139) |  | 10576 | 1 |
| 844x390-dark-t100 | Mark done | 9/9 inView=True | 1299 ms scrolled=False | -3 | [459, 184, 345, 44] | 9 | 0->0 | {'field': 'Chapter 3 notes', 'markBack': True} | 5140 | 2 |
| 844x390-dark-t100 | History mid | row top 165 | tap | 14 | [513, 165, 283, 60] | 9 | 1486->1486 (undo row top 165) | True | None | 1 |
| 844x390-dark-t100 | History end | row top 184 | tap | -1 | [513, 184, 283, 60] | 9 | 1886->1886 (undo row top 184) | None | 5951 | 1 |
| 844x390-dark-t100 | Import undo | row top 173 err=None | sessions 89 | -7 | [150, 173, 628, 60] | 9 | 2389->2389 (undo row top 173) | after undo 6 | None | 2 |
| 844x390-dark-t100 | Import expire | row top 173 err=None | sessions 89 | -6 | [150, 173, 628, 60] | 9 | 2389->2389 (undo row top 173) |  | 10276 | 1 |
| 844x390-dark-t200 | Mark done | 0/9 inView=False | 2682 ms scrolled=True | 0 | [459, -54, 345, 88] | 6 | 0->406 | {'field': 'Chapter 3 notes', 'markBack': True} | 5140 | 2 |
| 844x390-dark-t200 | History mid | row top 86 | tap | 14 | [513, 86, 283, 145] | 9 | 3019->3019 (undo row top 86) | True | None | 1 |
| 844x390-dark-t200 | History end | row top 6 | tap | 1 | [513, 9, 283, 145] | 9 | 3895->3892 (undo row top 9) | None | 5744 | 1 |
| 844x390-dark-t200 | Import undo | row top 282 err=None | sessions 89 | 12 | [150, 312, 628, 110] | 9 | 3600->3600 (undo row top 312) | after undo 6 | None | 2 |
| 844x390-dark-t200 | Import expire | row top 282 err=None | sessions 89 | -7 | [150, 312, 628, 110] | 9 | 3600->3600 (undo row top 312) |  | 10672 | 1 |
| 844x390-light-t100 | Mark done | 9/9 inView=True | 1446 ms scrolled=False | 14 | [459, 184, 345, 44] | 9 | 0->0 | {'field': 'Chapter 3 notes', 'markBack': True} | 5152 | 2 |
| 844x390-light-t100 | History mid | row top 165 | tap | 0 | [513, 165, 283, 60] | 9 | 1486->1486 (undo row top 165) | True | None | 1 |
| 844x390-light-t100 | History end | row top 184 | tap | 14 | [513, 184, 283, 60] | 9 | 1886->1886 (undo row top 184) | None | 5391 | 1 |
| 844x390-light-t100 | Import undo | row top 173 err=None | sessions 89 | -3 | [150, 173, 628, 60] | 9 | 2389->2389 (undo row top 173) | after undo 6 | None | 2 |
| 844x390-light-t100 | Import expire | row top 173 err=None | sessions 89 | -2 | [150, 173, 628, 60] | 9 | 2389->2389 (undo row top 173) |  | 10256 | 1 |
| 844x390-light-t200 | Mark done | 0/9 inView=False | 3430 ms scrolled=True | 0 | [459, 16, 345, 88] | 9 | 0->336 | {'field': 'Chapter 3 notes', 'markBack': True} | 5136 | 2 |
| 844x390-light-t200 | History mid | row top 86 | tap | 13 | [513, 86, 283, 145] | 9 | 3019->3019 (undo row top 86) | True | None | 1 |
| 844x390-light-t200 | History end | row top 85 | tap | 12 | [513, 85, 283, 145] | 9 | 3816->3816 (undo row top 85) | None | 6243 | 1 |
| 844x390-light-t200 | Import undo | row top 282 err=None | sessions 89 | 3 | [150, 312, 628, 110] | 9 | 3600->3600 (undo row top 312) | after undo 6 | None | 2 |
| 844x390-light-t200 | Import expire | row top 282 err=None | sessions 89 | 14 | [150, 312, 628, 110] | 9 | 3600->3600 (undo row top 312) |  | 10238 | 1 |

### Brew length at rest (veteran)

| config | options | wholly in view | >=24x24 | 9/9 on top | boxes | scrollY |
|---|---|---|---|---|---|---|
| 1440x900-dark-t100 | 4 | 4 | 4 | 4 | 15 minGentle:[312, 548, 133, 48] 25 minClassic:[449, 548, 133, 48] 50 minDeep:[585, 548, 133, 48] CustomSet it:[722, 548, 133, 48] | 0 |
| 1440x900-dark-t200 | 4 | 0 | 4 | 0 | 15 minGentle:[312, 864, 133, 80] 25 minClassic:[449, 864, 133, 80] 50 minDeep:[585, 864, 133, 80] CustomSet it:[722, 864, 133, 80] | 0 |
| 1440x900-light-t100 | 4 | 4 | 4 | 4 | 15 minGentle:[312, 548, 133, 48] 25 minClassic:[449, 548, 133, 48] 50 minDeep:[585, 548, 133, 48] CustomSet it:[722, 548, 133, 48] | 0 |
| 1440x900-light-t200 | 4 | 0 | 4 | 0 | 15 minGentle:[312, 864, 133, 80] 25 minClassic:[449, 864, 133, 80] 50 minDeep:[585, 864, 133, 80] CustomSet it:[722, 864, 133, 80] | 0 |
| 375x667-dark-t100 | 4 | 4 | 4 | 4 | 15 min:[20, 443, 81, 44] 25 min:[105, 443, 81, 44] 50 min:[190, 443, 81, 44] Custom:[274, 443, 81, 44] | 0 |
| 375x667-dark-t200-reduced | 4 | 4 | 4 | 4 | 15 min:[20, 219, 166, 50] 25 min:[190, 219, 166, 50] 50 min:[20, 272, 166, 50] Custom:[190, 272, 166, 50] | 0 |
| 375x667-dark-t200 | 4 | 4 | 4 | 4 | 15 min:[20, 219, 166, 50] 25 min:[190, 219, 166, 50] 50 min:[20, 272, 166, 50] Custom:[190, 272, 166, 50] | 0 |
| 375x667-light-t100 | 4 | 4 | 4 | 4 | 15 min:[20, 443, 81, 44] 25 min:[105, 443, 81, 44] 50 min:[190, 443, 81, 44] Custom:[274, 443, 81, 44] | 0 |
| 375x667-light-t200 | 4 | 4 | 4 | 4 | 15 min:[20, 219, 166, 50] 25 min:[190, 219, 166, 50] 50 min:[20, 272, 166, 50] Custom:[190, 272, 166, 50] | 0 |
| 390x844-dark-t100 | 4 | 4 | 4 | 4 | 15 min:[20, 620, 85, 44] 25 min:[109, 620, 85, 44] 50 min:[197, 620, 85, 44] Custom:[286, 620, 85, 44] | 0 |
| 390x844-dark-t200 | 4 | 4 | 4 | 4 | 15 min:[20, 396, 173, 50] 25 min:[197, 396, 173, 50] 50 min:[20, 449, 173, 50] Custom:[197, 449, 173, 50] | 0 |
| 390x844-light-t100-reduced | 4 | 4 | 4 | 4 | 15 min:[20, 620, 85, 44] 25 min:[109, 620, 85, 44] 50 min:[197, 620, 85, 44] Custom:[286, 620, 85, 44] | 0 |
| 390x844-light-t100 | 4 | 4 | 4 | 4 | 15 min:[20, 620, 85, 44] 25 min:[109, 620, 85, 44] 50 min:[197, 620, 85, 44] Custom:[286, 620, 85, 44] | 0 |
| 390x844-light-t200 | 4 | 4 | 4 | 4 | 15 min:[20, 396, 173, 50] 25 min:[197, 396, 173, 50] 50 min:[20, 449, 173, 50] Custom:[197, 449, 173, 50] | 0 |
| 667x375-dark-t100 | 4 | 4 | 4 | 4 | 15 min:[366, 47, 65, 44] 25 min:[435, 47, 65, 44] 50 min:[505, 47, 65, 44] Custom:[574, 47, 65, 44] | 0 |
| 667x375-dark-t200 | 4 | 4 | 4 | 4 | 15 min:[366, 69, 134, 50] 25 min:[505, 69, 134, 50] 50 min:[366, 123, 134, 50] Custom:[505, 123, 134, 50] | 0 |
| 667x375-light-t100 | 4 | 4 | 4 | 4 | 15 min:[366, 47, 65, 44] 25 min:[435, 47, 65, 44] 50 min:[505, 47, 65, 44] Custom:[574, 47, 65, 44] | 0 |
| 667x375-light-t200 | 4 | 4 | 4 | 4 | 15 min:[366, 69, 134, 50] 25 min:[505, 69, 134, 50] 50 min:[366, 123, 134, 50] Custom:[505, 123, 134, 50] | 0 |
| 844x390-dark-t100 | 4 | 4 | 4 | 4 | 15 min:[546, 20, 65, 44] 25 min:[614, 20, 65, 44] 50 min:[683, 20, 65, 44] Custom:[751, 20, 65, 44] | 0 |
| 844x390-dark-t200 | 4 | 4 | 4 | 4 | 15 min:[447, 69, 183, 50] 25 min:[633, 69, 183, 50] 50 min:[447, 123, 183, 50] Custom:[633, 123, 183, 50] | 0 |
| 844x390-light-t100 | 4 | 4 | 4 | 4 | 15 min:[546, 20, 65, 44] 25 min:[614, 20, 65, 44] 50 min:[683, 20, 65, 44] Custom:[751, 20, 65, 44] | 0 |
| 844x390-light-t200 | 4 | 4 | 4 | 4 | 15 min:[447, 69, 183, 50] 25 min:[633, 69, 183, 50] 50 min:[447, 123, 183, 50] Custom:[633, 123, 183, 50] | 0 |

### Update prompt, queue, Break's over, Ambience

| config | update timeline (every 1.5 s) | Update tapped | onClick count | queue: notices seen of 4 | queue: change times ms | queue length after route change | Break's over notices | Ambience |
|---|---|---|---|---|---|---|---|---|
| 1440x900-dark-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [62, 3438, 6442, 12049] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 1440x900-dark-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [21, 2815, 6346, 10004] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 1440x900-light-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [8, 2858, 6450, 10055] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 1440x900-light-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [32, 2885, 6477, 10164] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 375x667-dark-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [92, 2796, 6455, 9825] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 375x667-dark-t200-reduced | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [2, 1888, 5264, 8667] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 5, "cov": 0}} |
| 375x667-dark-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [1, 3396, 7026, 10530] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 5, "cov": 0}} |
| 375x667-light-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [10, 2907, 6678, 10119] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 375x667-light-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [3, 2945, 6557, 10019] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 5, "cov": 0}} |
| 390x844-dark-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [37, 1516, 6294, 11670] | 4 | [] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 390x844-dark-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [49, 2817, 6462, 9977] | 4 | [] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 9, "cov": 0}} |
| 390x844-light-t100-reduced | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [1, 2037, 5737, 9538] | 4 | [] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 390x844-light-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [6, 2896, 6293, 9776] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 10, "cov": 0}} |
| 390x844-light-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [1, 2736, 6186, 9609] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 9, "cov": 0}} |
| 667x375-dark-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [23, 2787, 6126, 9642] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 7, "cov": 0}} |
| 667x375-dark-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [75, 2796, 7102, 9722] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 5, "cov": 0}} |
| 667x375-light-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [14, 3063, 6755, 10363] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 7, "cov": 0}} |
| 667x375-light-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [10, 2863, 6365, 9686] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 5, "cov": 0}} |
| 844x390-dark-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [8, 2836, 6197, 9731] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 9, "cov": 0}} |
| 844x390-dark-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [16, 2453, 6090, 9589] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 6, "cov": 0}} |
| 844x390-light-t100 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [1, 3031, 6499, 10065] | 4 | [] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 9, "cov": 0}} |
| 844x390-light-t200 | 500: Brew updated / 2000: Brew updated / 3500: A fresh brew of Kettle is ready. Update / 5000: A fresh brew of Kettle is ready. Update / 6500: A fresh brew of Kettle is ready. Update | True | 1 | 4 | [10, 2627, 6054, 9472] | 4 | ['Recipe done: Take a full tea break · +10 leaves'] | {"opened": true, "dialog": true, "sheetCtlsCovered": {"tot": 6, "cov": 0}} |

### Non-modal drawn overlap records (first per config/group/kind/what)

- 667x375-dark-t200 break [ambience] text top=other points=None notice=li "Notice one, waiting its turn." [349, 154, 284, 135] vs text ":" in span [480, 285, 21, 117] sy=0 hash=#/focus
- 667x375-dark-t200 nextbrew [nextbrew] text top=other points=None notice=li "Recipe done: Take a full tea break · +10" [347, 77, 288, 178] vs text ":" in span [480, 251, 21, 117] sy=0 hash=#/focus
- 667x375-light-t200 break [ambience] text top=other points=None notice=li "Notice one, waiting its turn." [348, 153, 287, 137] vs text ":" in span [480, 285, 21, 117] sy=0 hash=#/focus
- 667x375-light-t200 nextbrew [nextbrew] text top=other points=None notice=li "Recipe done: Take a full tea break · +10" [347, 77, 288, 178] vs text ":" in span [480, 253, 21, 117] sy=0 hash=#/focus
- 844x390-dark-t200 break [ambience] text top=other points=None notice=li "Notice one, waiting its turn." [525, 77, 287, 137] vs text ":" in span [657, 210, 21, 117] sy=0 hash=#/focus
- 844x390-dark-t200 nextbrew [nextbrew] text top=other points=None notice=li "Recipe done: Take a full tea break · +10" [524, 77, 288, 178] vs text ":" in span [657, 251, 21, 117] sy=0 hash=#/focus
- 844x390-dark-t200 stats [history-end] text@fixed top=notice points=None notice=li "Brew deleted Undo" [513, 9, 283, 145] vs text "23" in span [778, 3, 42, 43] sy=3892 hash=#/stats
- 844x390-light-t200 break [ambience] text top=other points=None notice=li "Notice one, waiting its turn." [527, 154, 283, 135] vs text ":" in span [657, 285, 21, 117] sy=0 hash=#/focus
- 844x390-light-t200 nextbrew [nextbrew] text top=other points=None notice=li "Recipe done: Take a full tea break · +10" [524, 77, 287, 178] vs text ":" in span [657, 254, 21, 117] sy=0 hash=#/focus
