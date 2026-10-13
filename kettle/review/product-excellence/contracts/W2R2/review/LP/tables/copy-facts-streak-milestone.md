## Copy stability across configurations (distinct values per day and build; arrival/settled/end)

- milestone / C / arrival: 1 distinct copy variant(s) across 2 runs
- milestone / C / end: 1 distinct copy variant(s) across 2 runs
- milestone / C / settled: 1 distinct copy variant(s) across 2 runs
- milestone / P / arrival: 1 distinct copy variant(s) across 2 runs
- milestone / P / end: 1 distinct copy variant(s) across 2 runs
- milestone / P / settled: 1 distinct copy variant(s) across 2 runs

## Every reward text, number and sentence: control vs P (settled state unless noted; first config run; identical lines omitted)

### milestone day (seed atRisk)
- visible text (line by line): DIFFERENT
    -One full brew a day keeps your streak warm.
    +One full brew a day keeps the kettle warm.
    -25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.
    +25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. 6 days warm.
- reward pills (Rewards li textContent): DIFFERENT
    -66 days warm, your best yetOne full brew a day keeps your streak warm.
    +66 days warm, your best yetOne full brew a day keeps the kettle warm.
- sr-only strings: DIFFERENT
    -25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.
    +25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. 6 days warm.
- aria-labels in the summary: IDENTICAL (3 item(s)): ["Rewards", "", "Cozy level 5"]
- live announcement (role=status in the summary): DIFFERENT
    -25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.
    +25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. 6 days warm.
- footer: IDENTICAL (1 item(s)): ["Tea time · 5 min Skip break"]
- arithmetic rows after the toggle click (aria-expanded control=true P=true): IDENTICAL
    control rows: [["25 focused minutes", "+25"], ["Full brew", "+5"], ["First brew today", "+3"], ["This brew", "+33"]]
    control details text: 25 focused minutes+25Full brew+5First brew today+3This brew +33Cozy level 5 → 619 leaves to goYour 6-day streak stays warm with one full brew a day.
    P details text:       25 focused minutes+25Full brew+5First brew today+3This brew +33Cozy level 5 → 619 leaves to go6 days warm. One full brew a day keeps the kettle warm.
- toasts during summary: control [] / P []

## Every occurrence of “streak” (case-insensitive) on the summary: where, and the surrounding words

Sources: visible text (innerText), textContent (adds sr-only and closed/hidden content), sr-only elements, aria-label/aria-*/alt/title attributes (any non-data attribute), svg title/desc, the summary live region, every document-wide live region/announcer/toast (snapshot), and a MutationObserver log of every live-region text from page load to the end of the run (focus screen + summary).

### Control b377c62

| day | phases seen | where | words around it (BADGE = the badge name “Warm Streak”) |
|---|---|---|---|
| milestone | arrival,end,settled | document live region (summary, p) | 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. |
| milestone | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| milestone | internal | internal data-kind on <li> (not user-facing) | streak |
| milestone | live-log | live-region log at #/done | 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. |
| milestone | arrival,end,settled | sr-only element | 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. |
| milestone | arrival,end,settled | summary live region (role=status) | 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. |
| milestone | arrival,end,settled | textContent (visible + sr-only + hidden) | 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. |
| milestone | arrival,end,settled | textContent (visible + sr-only + hidden) | ew +33Cozy level 5 → 619 leaves to goYour 6-day streak stays warm with one full brew a day.Tea time · |
| milestone | arrival,end,settled | textContent (visible + sr-only + hidden) | rm, your best yetOne full brew a day keeps your streak warm.+33 leaves25/30 min todayDaily goal: 25 of |
| milestone | end | visible text | +33 Cozy level 5 → 6 19 leaves to go Your 6-day streak stays warm with one full brew a day. Tea time · |
| milestone | arrival,end,settled | visible text | 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. |
| milestone | arrival,end,settled | visible text | m, your best yet One full brew a day keeps your streak warm. +33 leaves 25/30 min today Daily goal: 25 |

### P trial

| day | phases seen | where | words around it (BADGE = the badge name “Warm Streak”) |
|---|---|---|---|
| milestone | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| milestone | internal | internal data-kind on <li> (not user-facing) | streak |

### Totals of occurrences excluding the badge name “Warm Streak”, distinct (where, text) per day, all phases merged

| build | day | non-badge occurrences (visible/sr/aria/attr/live) | badge-name occurrences |
|---|---|---|---|
| control | milestone | 7: [document live region (summary, p)] 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.; [live-region log] 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.; [sr-only element] 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.; [summary live region (role=status)] 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.; [visible text] +33 Cozy level 5 → 6 19 leaves to go Your 6-day streak stays warm with one full brew a day. Tea time ·; [visible text] 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days.; [visible text] m, your best yet One full brew a day keeps your streak warm. +33 leaves 25/30 min today Daily goal: 25 | 0 |
| P | milestone | 0 | 0 |
