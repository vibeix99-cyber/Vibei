## Copy stability across configurations (distinct values per day and build; arrival/settled/end)

- big / C / arrival: 2 distinct copy variant(s) across 8 runs  <- variants: 7 runs e.g. 375x667-dark-t100 | 1 runs e.g. 390x844-light-t200
- big / C / end: 1 distinct copy variant(s) across 8 runs
- big / C / settled: 1 distinct copy variant(s) across 8 runs
- big / P / arrival: 1 distinct copy variant(s) across 8 runs
- big / P / end: 1 distinct copy variant(s) across 8 runs
- big / P / settled: 1 distinct copy variant(s) across 8 runs
- routine / C / arrival: 1 distinct copy variant(s) across 8 runs
- routine / C / end: 1 distinct copy variant(s) across 8 runs
- routine / C / settled: 1 distinct copy variant(s) across 8 runs
- routine / P / arrival: 1 distinct copy variant(s) across 8 runs
- routine / P / end: 1 distinct copy variant(s) across 8 runs
- routine / P / settled: 1 distinct copy variant(s) across 8 runs
- task / C / arrival: 1 distinct copy variant(s) across 8 runs
- task / C / end: 1 distinct copy variant(s) across 8 runs
- task / C / settled: 1 distinct copy variant(s) across 8 runs
- task / P / arrival: 1 distinct copy variant(s) across 8 runs
- task / P / end: 1 distinct copy variant(s) across 8 runs
- task / P / settled: 1 distinct copy variant(s) across 8 runs

## Every reward text, number and sentence: control vs P (settled state unless noted; first config run; identical lines omitted)

### routine day (seed veteran)
- visible text (line by line): IDENTICAL (15 item(s)): ["25 minutes brewed", "Tea’s ready. Take five before the next one.", "+40 leaves", "Goal met · 75/60 min", "Daily goal met: 75 of 60 minutes today", "23", "23 days warm", "Recipes 1/3", "12", "144 leaves to level 13", "144 leaves to cozy level 13", "How your leaves added up", "Tea time · 5 min", "Skip break", "25 minutes brewed. 40 leaves earned. Daily goal met."]
- reward pills (Rewards li textContent): IDENTICAL (5 item(s)): ["+40 leaves", "Goal met · 75/60 minDaily goal met: 75 of 60 minutes today", "2323 days warm", "Recipes 1/3", "12144 leaves to level 13144 leaves to cozy level 13"]
- sr-only strings: IDENTICAL (3 item(s)): ["Daily goal met: 75 of 60 minutes today", "144 leaves to cozy level 13", "25 minutes brewed. 40 leaves earned. Daily goal met."]
- aria-labels in the summary: IDENTICAL (3 item(s)): ["Rewards", "", "Cozy level 12"]
- live announcement (role=status in the summary): IDENTICAL (1 item(s)): ["25 minutes brewed. 40 leaves earned. Daily goal met."]
- footer: IDENTICAL (1 item(s)): ["Tea time · 5 min Skip break"]
- arithmetic rows after the toggle click (aria-expanded control=true P=true): IDENTICAL
    control rows: [["25 focused minutes", "+25"], ["Full brew", "+5"], ["Daily goal met", "+10"], ["This brew", "+40"]]
    control details text: 25 focused minutes+25Full brew+5Daily goal met+10This brew +40Cozy level 12 → 13144 leaves to goYour 23-day streak stays warm with one full brew a day.
    P details text:       25 focused minutes+25Full brew+5Daily goal met+10This brew +40Cozy level 12 → 13144 leaves to go23 days warm. One full brew a day keeps the kettle warm.
- toasts during summary: control [] / P []

### task day (seed newbie, task)
- visible text (line by line): IDENTICAL (19 item(s)): ["25 minutes brewed", "Tea’s ready. Take five before the next one.", "Chapter 3 notes", "Study", "Done", "Carry forward", "Fairy lights is in your nook", "5", "Cozy level 5 · Tiny warm stars for rainy evenings.", "+65 leaves", "Goal met · 50/30 min", "Daily goal met: 50 of 30 minutes today", "3", "3 days warm", "2 recipes done", "How your leaves added up", "Tea time · 5 min", "Skip break", "25 minutes brewed. 65 leaves earned. Daily goal met. Cozy level 5: something new in your nook."]
- reward pills (Rewards li textContent): IDENTICAL (4 item(s)): ["+65 leaves", "Goal met · 50/30 minDaily goal met: 50 of 30 minutes today", "33 days warm", "2 recipes done"]
- sr-only strings: IDENTICAL (2 item(s)): ["Daily goal met: 50 of 30 minutes today", "25 minutes brewed. 65 leaves earned. Daily goal met. Cozy level 5: something new in your nook."]
- aria-labels in the summary: IDENTICAL (6 item(s)): ["Your task", "“Chapter 3 notes”: done, or carry it forward to your next brew?", "Cozy level 5: Fairy lights is in your nook", "Cozy level 5", "Rewards", ""]
- live announcement (role=status in the summary): IDENTICAL (1 item(s)): ["25 minutes brewed. 65 leaves earned. Daily goal met. Cozy level 5: something new in your nook."]
- footer: IDENTICAL (1 item(s)): ["Tea time · 5 min Skip break"]
- arithmetic rows after the toggle click (aria-expanded control=true P=true): IDENTICAL
    control rows: [["25 focused minutes", "+25"], ["Full brew", "+5"], ["Daily goal met", "+10"], ["Recipe: Name what you’re brewing", "+10"], ["Recipe: Brew for 30 minutes", "+15"], ["This brew", "+65"]]
    control details text: 25 focused minutes+25Full brew+5Daily goal met+10Recipe: Name what you’re brewing+10Recipe: Brew for 30 minutes+15This brew +65Cozy level 5 → 6102 leaves to goYour 3-day streak stays warm with one full brew a day.
    P details text:       25 focused minutes+25Full brew+5Daily goal met+10Recipe: Name what you’re brewing+10Recipe: Brew for 30 minutes+15This brew +65Cozy level 5 → 6102 leaves to go3 days warm. One full brew a day keeps the kettle warm.
- toasts during summary: control [] / P []

### big day (seed celebrate)
- visible text (line by line): DIFFERENT
    -You earned a Tea Cozy: it keeps your streak warm for one missed day
    +You earned a Tea Cozy: it covers one missed day, so your warm days keep going
    -25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.
    +25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.
- reward pills (Rewards li textContent): DIFFERENT
    -Tea Cozy earnedYou earned a Tea Cozy: it keeps your streak warm for one missed day
    +Tea Cozy earnedYou earned a Tea Cozy: it covers one missed day, so your warm days keep going
- sr-only strings: DIFFERENT
    -You earned a Tea Cozy: it keeps your streak warm for one missed day
    -25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.
    +You earned a Tea Cozy: it covers one missed day, so your warm days keep going
    +25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.
- aria-labels in the summary: IDENTICAL (6 item(s)): ["Cozy level 8: Record player is in your nook", "Cozy level 8", "Rewards", "", "Warm Streak II", "Weekend Warmth I"]
- live announcement (role=status in the summary): DIFFERENT
    -25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.
    +25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.
- footer: IDENTICAL (1 item(s)): ["Tea time · 5 min Skip break"]
- arithmetic rows after the toggle click (aria-expanded control=true P=true): IDENTICAL
    control rows: [["25 focused minutes", "+25"], ["Full brew", "+5"], ["First brew today", "+3"], ["Daily goal met", "+10"], ["Recipe: Finish a full brew", "+10"], ["Recipe: Brew for 30 minutes", "+15"], ["This brew", "+68"]]
    control details text: 25 focused minutes+25Full brew+5First brew today+3Daily goal met+10Recipe: Finish a full brew+10Recipe: Brew for 30 minutes+15This brew +68Cozy level 8 → 9207 leaves to goYour 7-day streak stays warm with one full brew a day.
    P details text:       25 focused minutes+25Full brew+5First brew today+3Daily goal met+10Recipe: Finish a full brew+10Recipe: Brew for 30 minutes+15This brew +68Cozy level 8 → 9207 leaves to go7 days warm. One full brew a day keeps the kettle warm.
- toasts during summary: control [] / P []

## Every occurrence of “streak” (case-insensitive) on the summary: where, and the surrounding words

Sources: visible text (innerText), textContent (adds sr-only and closed/hidden content), sr-only elements, aria-label/aria-*/alt/title attributes (any non-data attribute), svg title/desc, the summary live region, every document-wide live region/announcer/toast (snapshot), and a MutationObserver log of every live-region text from page load to the end of the run (focus screen + summary).

### Control b377c62

| day | phases seen | where | words around it (BADGE = the badge name “Warm Streak”) |
|---|---|---|---|
| routine | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| routine | internal | internal data-kind on <li> (not user-facing) | streak |
| routine | arrival,end,settled | textContent (visible + sr-only + hidden) | 40Cozy level 12 → 13144 leaves to goYour 23-day streak stays warm with one full brew a day.Tea time · |
| routine | end | visible text | Cozy level 12 → 13 144 leaves to go Your 23-day streak stays warm with one full brew a day. Tea time · |
| task | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| task | internal | internal data-kind on <li> (not user-facing) | streak |
| task | arrival,end,settled | textContent (visible + sr-only + hidden) | w +65Cozy level 5 → 6102 leaves to goYour 3-day streak stays warm with one full brew a day.Tea time · |
| task | end | visible text | 65 Cozy level 5 → 6 102 leaves to go Your 3-day streak stays warm with one full brew a day. Tea time · |
| big | arrival,end,settled | aria-label | BADGE Warm Streak II |
| big | arrival,end,settled | attribute aria-label on <svg> | BADGE Warm Streak II |
| big | arrival,end,settled | document live region (summary, p) | 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| big | internal | internal data-kind on <li> (not user-facing) | streak |
| big | live-log | live-region log at #/done | 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New |
| big | live-log | live-region log at #/done | BADGE Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | sr-only element | 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New |
| big | arrival,end,settled | sr-only element | BADGE Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | sr-only element | You earned a Tea Cozy: it keeps your streak warm for one missed day |
| big | arrival,end,settled | summary live region (role=status) | 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New |
| big | arrival,end,settled | summary live region (role=status) | BADGE Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | textContent (visible + sr-only + hidden) | BADGE 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | textContent (visible + sr-only + hidden) | BADGE for one missed day2 recipes done7IIBadge: Warm Streak IIIBadge: Weekend WarmthHow your leaves added u |
| big | arrival,end,settled | textContent (visible + sr-only + hidden) | Cozy earnedYou earned a Tea Cozy: it keeps your streak warm for one missed day2 recipes done7IIBadge: |
| big | arrival,end,settled | textContent (visible + sr-only + hidden) | brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your no |
| big | arrival,end,settled | textContent (visible + sr-only + hidden) | w +68Cozy level 8 → 9207 leaves to goYour 7-day streak stays warm with one full brew a day.Tea time · |
| big | end | visible text | 68 Cozy level 8 → 9 207 leaves to go Your 7-day streak stays warm with one full brew a day. Tea time · |
| big | arrival,end,settled | visible text | BADGE 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | visible text | BADGE one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves adde |
| big | arrival,end,settled | visible text | brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your no |
| big | arrival,end,settled | visible text | ozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Bad |

### P trial

| day | phases seen | where | words around it (BADGE = the badge name “Warm Streak”) |
|---|---|---|---|
| routine | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| routine | internal | internal data-kind on <li> (not user-facing) | streak |
| task | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| task | internal | internal data-kind on <li> (not user-facing) | streak |
| big | arrival,end,settled | aria-label | BADGE Warm Streak II |
| big | arrival,end,settled | attribute aria-label on <svg> | BADGE Warm Streak II |
| big | arrival,end,settled | document live region (summary, p) | BADGE 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | internal | internal data-art on <svg> (not user-facing) | streak-mug |
| big | internal | internal data-kind on <li> (not user-facing) | streak |
| big | live-log | live-region log at #/done | BADGE oal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | sr-only element | BADGE oal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | summary live region (role=status) | BADGE oal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | textContent (visible + sr-only + hidden) | BADGE 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | textContent (visible + sr-only + hidden) | BADGE arm days keep going2 recipes done7IIBadge: Warm Streak IIIBadge: Weekend WarmthHow your leaves added u |
| big | arrival,end,settled | visible text | BADGE 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. |
| big | arrival,end,settled | visible text | BADGE days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves adde |

### Totals of occurrences excluding the badge name “Warm Streak”, distinct (where, text) per day, all phases merged

| build | day | non-badge occurrences (visible/sr/aria/attr/live) | badge-name occurrences |
|---|---|---|---|
| control | routine | 1: [visible text] Cozy level 12 → 13 144 leaves to go Your 23-day streak stays warm with one full brew a day. Tea time · | 0 |
| control | task | 1: [visible text] 65 Cozy level 5 → 6 102 leaves to go Your 3-day streak stays warm with one full brew a day. Tea time · | 0 |
| control | big | 8: [document live region (summary, p)] 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.; [live-region log] 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New; [sr-only element] 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New; [sr-only element] You earned a Tea Cozy: it keeps your streak warm for one missed day; [summary live region (role=status)] 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New; [visible text] 68 Cozy level 8 → 9 207 leaves to go Your 7-day streak stays warm with one full brew a day. Tea time ·; [visible text] brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your no; [visible text] ozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Bad | 7 |
| P | routine | 0 | 0 |
| P | task | 0 | 0 |
| P | big | 0 | 8 |
