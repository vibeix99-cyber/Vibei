# W2R3 round 3 · Lane T receipt · Maker T2 fix revision (T2-D1, summary notices)

Raw evidence only, no verdict. Lane T implemented none of this.

| | |
|---|---|
| Under review | `pe/w2r3-notices@64f29cd` (code `40f92b6`, kettle/src `aa88587`) |
| Fix trial | `99d9368` = integration `8af5430` + `64f29cd`, worktree `/home/user/wt/w4tr-t2f` (clean), `HEAD:kettle/src` = `5cd9a44`, dev **:5477** (served `ShellOverlays.tsx` has `busy = status !== 'idle' \|\| route === '/focus' \|\| route === '/done'`) |
| First trial (control, defective) | `490ca97`, dev **:5476** |
| Base | `61aba17`, dev **:5470** |
| Window | 03:35–05:10 UTC, 2026-10-14 |
| Gate | every browser through `slots.py run --lane LT --n 1`; one job for the suites, one chained job for the probes (`fix2/runs/chainfix.log`, `fix2/runs/suites.log`) |
| Scripts | `/home/user/wt/w4tr-t2f/kettle/.tmp/LT/` (`sumprobe.mjs` new, `sumagg.py`, `ltprobe.mjs` and `agg.py` from round 3, `chainfix.sh`, `suites.sh`); copies in `fix2/tools/` |
| Evidence | `review/LT/fix2/` (`probes/sum-*` summary runs as JSON, one per configuration × day × case; `probes/inv-fix` invariant re-probe; `shots/<port>*` full-size captures; `runs/` suite logs and JSON) |

The round-3 receipt for `490ca97` (`RECEIPT-LT.md`) was closed first: the container restart at about 00:40 UTC cut `notice-strip.spec.ts` after 7 of 25 tests (all 7 passed); its §8 now says so. Nothing in it was re-run.


## How Lane T measured (`sumprobe.mjs`)

- **Per run:** a fresh context; Monday 2026-10-12 07:40 UTC frozen (`clock.install` + `resume`); settings onboarded, scene off, muted, no auto-start; 200 % = `html{font-size:200%!important}`. Task day = `?seed=newbie`, big day = `?seed=celebrate`; the brew is started with `startFocus({ intention: 'Chapter 3 notes', tag: 'study' })` and finished with `__kettle.finish()` (setup). Phones: `hasTouch`, DPR 2, real `touchscreen.tap`; 1440: `mouse.click`.
- **On the summary (every animation frame from the first frame with P's sheet on `#/done`):** the box of P's `._sheet_` inside the summary `role=region` (top and bottom edges, 0.1 px), the `footer` box, the rows (`[data-fold]` in the sheet) cut by the footer's top edge and those wholly under it, every drawn notice (`[data-notice-strip] li`, `[data-inline-undo]`, base `[aria-label="Notifications"] li`), whether a notice box meets the sheet, the footer, Chai's face (upper 45 % of `[data-stage-figure="chai"]`) or the kettle gauge (`._track_` arc in `[data-stage-figure="kettle"]`), and `elementFromPoint` at the face and gauge centres. "Settled" = frames from +900 ms (P's entrance motion is 420 ms). Each case is compared with the **no-notice run of the same configuration and day** (max |Δ| of the settled top and bottom edges and of the footer top).
- **Cases:** `none`; `adebug` (a persistent notice with an action, raised in the same task as `finish()`, i.e. pending as the summary arrives); `b` (a persistent notice with an action raised 1.5 s after arrival); `c` (a timed notice, 4 s, "Couldn't save just now…", raised 1.5 s after arrival); `areal` (the real update prompt, below).
- **After the summary (real tap):** `none`, `adebug`, `c` → "Tea time" (the tea break, `#/focus`); `b`, `areal` → "Skip break" (Today, `#/`). Every 120 ms for up to 16 s: what is drawn, in order, how many at once, wholly in the viewport, clipped (scroll size > client size on the notice or any descendant with overflow / line clamp). The notice's action ("Open" / "Update") is tapped for real once it has been drawn ≥ 1.5 s and is 9/9 on top. Announcer: every addition to `[data-notices-said]` (and every other `aria-live` / `role=status|alert|log` region) from page load to the end of the run is counted per message.
- **How the notices are raised, and how close that is to the real update prompt:**
  - `adebug`, `b`, `c`: `__kettle.toast(message, options)` = the same `toast()` every caller uses. This is **not** the update prompt's path.
  - `areal` = the real path. Read in `src/app/ShellOverlays.tsx` (fix): `PwaUpdatePrompt` reads `needRefresh` from `usePwaUpdate()` (`src/pwa/register.ts`), computes `busy = status !== 'idle' || route === '/focus' || route === '/done'`, and in an effect calls `toast.dismiss('pwa-update')` when `!needRefresh || busy`, else `toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', duration: Infinity, action: Update → applyPwaUpdate() })`. `needRefresh` is set only by the module-internal `patch()`, called from `registerSW({ onNeedRefresh })`, which runs only in a production build with a service worker (`registerPwa()` returns at once in dev). Lane T served `/src/pwa/register.ts` to the page through `context.route` with one extra line appended, `window.__ltPwa = (v) => patch({ needRefresh: v })` (no file changed), and called `__ltPwa(true)` 1.5 s into the brew. Everything after that, from `usePwaUpdate` through `PwaUpdatePrompt`'s busy rule to the notice strip, is the app's own code. In dev `applyPwaUpdate()` has no `updateSW`, so a tap on Update reloads the page (`location.reload()`); the probe counts the reload.
  - **Proven by code only:** that a production service worker's `onNeedRefresh` calls the same `patch({ needRefresh: true })`; that the prompt is dismissed (removed from the queue, not kept) whenever `busy` is true, so it cannot be waiting in the queue during a brew, a break or the summary; that it is raised again (and so announced again) each time `busy` turns false while `needRefresh` is still true.
  - **Proven by run (`areal`, 4 configurations):** the rows in §3.


## 1. Control first: the measurement detects T2-D1 on `490ca97`, then the fix in the same session

`chainfix.sh` P1, 03:42:28–03:44:57 UTC: the same probe, same configurations, task day, cases `none`, `adebug` (persistent, pending as the summary arrives) and `c` (timed, raised 1.5 s after arrival); `490ca97` (:5476) first, then the fix (:5477). JSON: `fix2/probes/sum-490ca97/`, `fix2/probes/sum-fix-ctl/`.

| Server | Configuration | Case | Sheet top / bottom (settled) | max \|Δ\| top / bottom vs no notice (same server) | Footer top | Rows cut / under | Frames with a notice drawn on the summary | Frames with a notice over sheet, footer, Chai face or gauge | Chai face / gauge centre top element |
|---|---|---|---|---|---|---|---|---|---|
| :5476 | 375x667-light-t100 task | adebug | 359 / 985.9 | 74.5 / 74.5 | 529 | 1/8 | 33 | 0 | summary/summary |
| :5476 | 375x667-light-t100 task | c | 284.5–359 / 911.4–985.9 | 74.5 / 74.5 | 529 | 1/8,2/6 | 20 | 0 | summary/summary |
| :5476 | 375x667-light-t100 task | none | 284.5 / 911.4 | 0.0 / 0.0 | 529 | 2/6 | 0 | 0 | summary/summary |
| :5476 | 375x667-light-t200 task | adebug | 493.5 / 1919.6 | 208.0 / 208.0 | 493.5 | 0/12 | 34 | 34 | NOTICE/NOTICE |
| :5476 | 375x667-light-t200 task | c | 285.5–441 / 1711.6–1867.1 | 155.5 / 155.5 | 474.8 | 0/12,1/10 | 23 | 23 | div/summary,summary/summary |
| :5476 | 375x667-light-t200 task | none | 285.5 / 1711.6 | 0.0 / 0.0 | 474.8 | 1/10 | 0 | 0 | summary/summary |
| :5476 | 390x844-light-t100 task | adebug | 456.5 / 968.5 | 74.5 / 74.5 | 706 | 2/5 | 33 | 0 | summary/summary |
| :5476 | 390x844-light-t100 task | c | 382–456.5 / 894–968.5 | 74.5 / 74.5 | 706 | 0/5,2/5 | 21 | 0 | summary/summary |
| :5476 | 390x844-light-t100 task | none | 382 / 894 | 0 / 0 | 706 | 0/5 | 0 | 0 | summary/summary |
| :5477 | 375x667-light-t100 task | adebug | 284.5 / 911.4 | 0.0 / 0.0 | 529 | 2/6 | 0 | 0 | summary/summary |
| :5477 | 375x667-light-t100 task | c | 284.5 / 911.4 | 0.0 / 0.0 | 529 | 2/6 | 0 | 0 | summary/summary |
| :5477 | 375x667-light-t100 task | none | 284.5 / 911.4 | 0.0 / 0.0 | 529 | 2/6 | 0 | 0 | summary/summary |
| :5477 | 375x667-light-t200 task | adebug | 285.5 / 1711.6 | 0.0 / 0.0 | 474.8 | 1/10 | 0 | 0 | summary/summary |
| :5477 | 375x667-light-t200 task | c | 285.5 / 1711.6 | 0.0 / 0.0 | 474.8 | 1/10 | 0 | 0 | summary/summary |
| :5477 | 375x667-light-t200 task | none | 285.5 / 1711.6 | 0.0 / 0.0 | 474.8 | 1/10 | 0 | 0 | summary/summary |
| :5477 | 390x844-light-t100 task | adebug | 382 / 894 | 0 / 0 | 706 | 0/5 | 0 | 0 | summary/summary |
| :5477 | 390x844-light-t100 task | c | 382 / 894 | 0 / 0 | 706 | 0/5 | 0 | 0 | summary/summary |
| :5477 | 390x844-light-t100 task | none | 382 / 894 | 0 / 0 | 706 | 0/5 | 0 | 0 | summary/summary |

- `490ca97`: with a notice, P's sheet sits **74.5 px lower** (375×667 @100, 390×844 @100) and **208 px** (`adebug`) / **155.5 px** (`c`) lower at 375×667 @200; the footer row count changes (cut / under 2/6 → 1/8; 1/10 → 0/12); at 375×667 @200 the notice is the hit target at Chai's face and at the kettle gauge (34 frames with the notice over a figure). For `c` (raised after arrival) the sheet moves during the run (top 285.5 → 441).
- Fix: 0.0 px at all three, footer rows unchanged, 0 frames with a notice drawn on the summary.
- Full-size frames of the same moment: `fix2/shots/5476/375x667-light-t200-task-adebug-summary.png` (the strip over Chai's face, the sheet's heading pushed under the footer: only "Tea time · 5 min" and "Skip break" visible below the scene) and `fix2/shots/5477/375x667-light-t200-task-adebug-summary.png` (no notice; "25 minutes brewed" in place).

## 2. The summary sheet with a queued notice vs the no-notice run, fix :5477

`chainfix.sh` P1 matrix, 03:47:15–04:04:43 UTC: 20 configurations (375×667, 390×844, 844×390, 667×375 and 1440×900, each at 100 % and 200 %, light and dark) × task day and big day × `none`, `adebug`, `b`, `c` = **160 runs**, plus `areal` at 4 configurations (§3). JSON: `fix2/probes/sum-fix/<cfg>-<day>-<case>.json`.

Totals over the 124 runs with a notice (each against its own configuration and day without one):
- **max |Δ| of the settled sheet top = 0.0 px, sheet bottom = 0.0 px, footer top = 0.0 px** (124 of 124);
- **frames with a notice drawn on the summary: 0** (all frames from arrival, 124 runs); frames with a notice box over the sheet, the footer, Chai's face or the gauge: 0;
- rows cut by the footer / wholly under it: identical to the no-notice run in 124 of 124;
- Chai's face centre and the gauge centre: the same top element as in the no-notice run in 124 of 124 (at these sizes it is the summary layer in both: P's transparent scroll layer reaches over the stage; the sheet's own box overlaps the face or gauge in 0 of 4,450 settled frames);
- `__kettle.notices()` on the summary, +4.5 s: one notice in the queue and `strip: null` in 120 of 120 (`adebug`: `shown: 'lt-persist'`; `b`: `shown: null`; `c`: `shown: null`, its time left **4,000 ms of 4,000**, i.e. no time spent on the summary).

| Configuration | Day | No notice: sheet top / bottom; footer top (settled) | Cases run | max \|Δ\| sheet top / bottom / footer top vs no notice | Rows cut by footer / wholly under it (no notice → with notices) | Chai face / gauge centre top element (no notice → with notices) | Frames with a notice drawn on the summary | Next screen: first drawn (ms after the tap), adebug·c → tea break, b → Today | Notices drawn at once (max) | Said once (adebug, b, c) |
|---|---|---|---|---|---|---|---|---|---|---|
| 375x667-light-t100 | task | 284.5 / 911.4; 529 | adebug,b,c | 0 / 0 / 0 | 2/6 → 2/6 | summary/summary → summary/summary | 0 | adebug:473 b:310 c:443 | 1 | [1, 1, 1] |
| 375x667-light-t100 | big | 284.5 / 1003.4; 529 | adebug,b,c | 0 / 0 / 0 | 2/8 → 2/8 | summary/summary → summary/summary | 0 | adebug:592 b:790 c:415 | 1 | [1, 1, 1] |
| 375x667-dark-t100 | task | 284.5 / 911.4; 529 | adebug,b,c | 0 / 0 / 0 | 2/6 → 2/6 | summary/summary → summary/summary | 0 | adebug:698 b:358 c:764 | 1 | [1, 1, 1] |
| 375x667-dark-t100 | big | 284.5 / 1003.4; 529 | adebug,b,c | 0 / 0 / 0 | 2/8 → 2/8 | summary/summary → summary/summary | 0 | adebug:536 b:422 c:908 | 1 | [1, 1, 1] |
| 375x667-light-t200 | task | 285.5 / 1711.6; 474.8 | adebug,b,c | 0 / 0 / 0 | 1/10 → 1/10 | summary/summary → summary/summary | 0 | adebug:406 b:563 c:860 | 1 | [1, 1, 1] |
| 375x667-light-t200 | big | 285.5 / 1982.2; 474.8 | adebug,b,c | 0 / 0 / 0 | 1/12 → 1/12 | summary/summary → summary/summary | 0 | adebug:756 b:451 c:623 | 1 | [1, 1, 1] |
| 375x667-dark-t200 | task | 285.5 / 1711.6; 474.8 | adebug,b,c | 0 / 0 / 0 | 1/10 → 1/10 | summary/summary → summary/summary | 0 | adebug:614 b:417 c:679 | 1 | [1, 1, 1] |
| 375x667-dark-t200 | big | 285.5 / 1982.2; 474.8 | adebug,b,c | 0 / 0 / 0 | 1/12 → 1/12 | summary/summary → summary/summary | 0 | adebug:1144 b:561 c:622 | 1 | [1, 1, 1] |
| 390x844-light-t100 | task | 382 / 894; 706 | adebug,b,c | 0 / 0 / 0 | 0/5 → 0/5 | summary/summary → summary/summary | 0 | adebug:790 b:317 c:615 | 1 | [1, 1, 1] |
| 390x844-light-t100 | big | 382 / 986; 706 | adebug,b,c | 0 / 0 / 0 | 0/7 → 0/7 | summary/summary → summary/summary | 0 | adebug:818 b:352 c:636 | 1 | [1, 1, 1] |
| 390x844-dark-t100 | task | 382 / 894; 706 | adebug,b,c | 0 / 0 / 0 | 0/5 → 0/5 | summary/summary → summary/summary | 0 | adebug:569 b:699 c:1389 | 1 | [1, 1, 1] |
| 390x844-dark-t100 | big | 382 / 986; 706 | adebug,b,c | 0 / 0 / 0 | 0/7 → 0/7 | summary/summary → summary/summary | 0 | adebug:716 b:387 c:569 | 1 | [1, 1, 1] |
| 390x844-light-t200 | task | 393 / 1575.3; 651.8 | adebug,b,c | 0 / 0 / 0 | 1/9 → 1/9 | summary/summary → summary/summary | 0 | adebug:619 b:454 c:482 | 1 | [1, 1, 1] |
| 390x844-light-t200 | big | 393 / 1731.3; 651.8 | adebug,b,c | 0 / 0 / 0 | 1/11 → 1/11 | summary/summary → summary/summary | 0 | adebug:598 b:964 c:1281 | 1 | [1, 1, 1] |
| 390x844-dark-t200 | task | 393 / 1575.3; 651.8 | adebug,b,c | 0 / 0 / 0 | 1/9 → 1/9 | summary/summary → summary/summary | 0 | adebug:935 b:429 c:566 | 1 | [1, 1, 1] |
| 390x844-dark-t200 | big | 393 / 1731.3; 651.8 | adebug,b,c | 0 / 0 / 0 | 1/11 → 1/11 | summary/summary → summary/summary | 0 | adebug:1282 b:885 c:790 | 1 | [1, 1, 1] |
| 844x390-light-t100 | task | 22 / 737.2; 234 | adebug,b,c | 0 / 0 / 0 | 1/7 → 1/7 | figure/figure → figure/figure | 0 | adebug:646 b:368 c:518 | 1 | [1, 1, 1] |
| 844x390-light-t100 | big | 22 / 829.2; 234 | adebug,b,c | 0 / 0 / 0 | 1/9 → 1/9 | figure/figure → figure/figure | 0 | adebug:919 b:606 c:791 | 1 | [1, 1, 1] |
| 844x390-dark-t100 | task | 22 / 737.2; 234 | adebug,b,c | 0 / 0 / 0 | 1/7 → 1/7 | figure/figure → figure/figure | 0 | adebug:1145 b:591 c:353 | 1 | [1, 1, 1] |
| 844x390-dark-t100 | big | 22 / 829.2; 234 | adebug,b,c | 0 / 0 / 0 | 1/9 → 1/9 | figure/figure → figure/figure | 0 | adebug:609 b:627 c:800 | 1 | [1, 1, 1] |
| 844x390-light-t200 | task | 26.4 / 1331.5; 175.4 | adebug,b,c | 0 / 0 / 0 | 1/10 → 1/10 | figure/figure → figure/figure | 0 | adebug:1338 b:450 c:647 | 1 | [1, 1, 1] |
| 844x390-light-t200 | big | 26.4 / 1564; 175.4 | adebug,b,c | 0 / 0 / 0 | 1/12 → 1/12 | figure/figure → figure/figure | 0 | adebug:501 b:484 c:1191 | 1 | [1, 1, 1] |
| 844x390-dark-t200 | task | 26.4 / 1331.5; 175.4 | adebug,b,c | 0 / 0 / 0 | 1/10 → 1/10 | figure/figure → figure/figure | 0 | adebug:2459 b:453 c:815 | 1 | [1, 1, 1] |
| 844x390-dark-t200 | big | 26.4 / 1564; 175.4 | adebug,b,c | 0 / 0 / 0 | 1/12 → 1/12 | figure/figure → figure/figure | 0 | adebug:1041 b:916 c:1043 | 1 | [1, 1, 1] |
| 667x375-light-t100 | task | 14.5 / 729.7; 226.5 | adebug,b,c | 0 / 0 / 0 | 1/7 → 1/7 | figure/figure → figure/figure | 0 | adebug:623 b:681 c:835 | 1 | [1, 1, 1] |
| 667x375-light-t100 | big | 14.5 / 821.7; 226.5 | adebug,b,c | 0 / 0 / 0 | 1/9 → 1/9 | figure/figure → figure/figure | 0 | adebug:888 b:583 c:954 | 1 | [1, 1, 1] |
| 667x375-dark-t100 | task | 14.5 / 729.7; 226.5 | adebug,b,c | 0 / 0 / 0 | 1/7 → 1/7 | figure/figure → figure/figure | 0 | adebug:514 b:457 c:970 | 1 | [1, 1, 1] |
| 667x375-dark-t100 | big | 14.5 / 821.7; 226.5 | adebug,b,c | 0 / 0 / 0 | 1/9 → 1/9 | figure/figure → figure/figure | 0 | adebug:702 b:724 c:465 | 1 | [1, 1, 1] |
| 667x375-light-t200 | task | 18.9 / 1324; 167.9 | adebug,b,c | 0 / 0 / 0 | 1/10 → 1/10 | figure/figure → figure/figure | 0 | adebug:2749 b:936 c:741 | 1 | [1, 1, 1] |
| 667x375-light-t200 | big | 18.9 / 1556.5; 167.9 | adebug,b,c | 0 / 0 / 0 | 1/12 → 1/12 | figure/figure → figure/figure | 0 | adebug:558 b:469 c:668 | 1 | [1, 1, 1] |
| 667x375-dark-t200 | task | 18.9 / 1324; 167.9 | adebug,b,c | 0 / 0 / 0 | 1/10 → 1/10 | figure/figure → figure/figure | 0 | adebug:657 b:909 c:612 | 1 | [1, 1, 1] |
| 667x375-dark-t200 | big | 18.9 / 1556.5; 167.9 | adebug,b,c | 0 / 0 / 0 | 1/12 → 1/12 | figure/figure → figure/figure | 0 | adebug:706 b:434 c:1704 | 1 | [1, 1, 1] |
| 1440x900-light-t100 | task | 29.5 / 732.5; 732.5 | adebug,b,c | 0 / 0 / 0 | 0/0 → 0/0 | figure/figure → figure/figure | 0 | adebug:1423 b:353 c:1669 | 1 | [1, 1, 1] |
| 1440x900-light-t100 | big | 39.5 / 788.5; 722.5 | adebug,b,c | 0 / 0 / 0 | 1/0 → 1/0 | figure/figure → figure/figure | 0 | adebug:1985 b:378 c:799 | 1 | [1, 1, 1] |
| 1440x900-dark-t100 | task | 29.5 / 732.5; 732.5 | adebug,b,c | 0 / 0 / 0 | 0/0 → 0/0 | figure/figure → figure/figure | 0 | adebug:740 b:2130 c:4739 | 1 | [1, 1, 1] |
| 1440x900-dark-t100 | big | 39.5 / 788.5; 722.5 | adebug,b,c | 0 / 0 / 0 | 1/0 → 1/0 | figure/figure → figure/figure | 0 | adebug:4410 b:448 c:806 | 1 | [1, 1, 1] |
| 1440x900-light-t200 | task | 55.5 / 1205.9; 698.5 | adebug,b,c | 0 / 0 / 0 | 1/6 → 1/6 | figure/figure → figure/figure | 0 | adebug:1928 b:564 c:627 | 1 | [1, 1, 1] |
| 1440x900-light-t200 | big | 55.5 / 1325.9; 698.5 | adebug,b,c | 0 / 0 / 0 | 1/8 → 1/8 | figure/figure → figure/figure | 0 | adebug:3580 b:337 c:3466 | 1 | [1, 1, 1] |
| 1440x900-dark-t200 | task | 55.5 / 1205.9; 698.5 | adebug,b,c | 0 / 0 / 0 | 1/6 → 1/6 | figure/figure → figure/figure | 0 | adebug:2761 b:359 c:911 | 1 | [1, 1, 1] |
| 1440x900-dark-t200 | big | 55.5 / 1325.9; 698.5 | adebug,b,c | 0 / 0 / 0 | 1/8 → 1/8 | figure/figure → figure/figure | 0 | adebug:1065 b:358 c:782 | 1 | [1, 1, 1] |

("summary/summary" = the element on top at Chai's face centre / the gauge centre belongs to the summary's region, in the no-notice run and with notices alike.)


## 3. After the summary: where the queued notice goes, how often it is said, and its action

Same 160-run matrix (`groups`: the `next` sequence, the announcer log and the action tap in each JSON).

- **Order, one at a time, nothing dropped:** in each run one notice was queued; it was drawn on the next screen in **120 of 120** runs (`adebug` and `c` on the tea break `#/focus`, `b` on Today `#/`), never more than **1** drawn at once. It was first drawn **310–4,739 ms** after the real tap that left the summary (tea break `adebug` 406–4,410 ms, `c` 353–4,739 ms; Today `b` 310–2,130 ms; the slow ones are mostly 1440 (mouse) and landscape @200; per run in the table above). For several notices queued at once, see `summary-notice.spec.ts` (§5: three notices, Today, in order).
- **Clipping:** 0 runs with a clipped notice (scroll size > client size) on the next screen.
- **Wholly in the viewport:** **not** in 12 runs: 844×390 @200 (light, dark; task, big) `adebug` on the tea break: the notice box is [527, 155, 282, 266], bottom at 421 in a 390 px viewport (31 px below it), its action "Open" not 9/9 on top for 16 s without scrolling, so **not tapped** (4 runs); 667×375 @200 (light, dark; task, big) `adebug` on the tea break: box [347–350, 153–155, 282–288, 266–271], bottom 419–424 in a 375 px viewport, action not tapped (4 runs); 667×375 @200 `b` on Today: box [108, 26, 234, 352], bottom 378 in a 375 px viewport (3 px below), "Open" 9/9 and tapped (4 runs). The test message is 52 characters plus an action; the maker's own messages may be shorter.
- **Reaching that action by a real wheel** over the notice in the session panel (`fix2/probes/sum-fix-wheel*`): 4 × 60 px moved the panel 242 px (notice top 155 → −87; "Open" then partly under the session top bar, not 9/9, not tapped; 844×390 and 667×375 @200, light and dark, task day, 4 runs). 2 × 25 px moved it 52 px (notice [347 or 524, 103, 282–288, 271], wholly in view) and "Open" was 9/9 and tapped, its handler ran once (844×390 and 667×375 light @200, 2 runs).
- **Announced:** every `adebug`, `b` and `c` notice appears in `[data-notices-said]` **exactly once** over the whole run (120 of 120): `adebug` while the brew screen was still up (`#/focus`, raised in the same task as the finish), `b` and `c` on the summary (`#/done`). Showing it on the next screen added no announcer line. No announcer line occurred twice in any run.
- **Action by a real tap:** where it was 9/9 on top, the action was tapped and its handler ran once: 76 of 76 (`adebug` on the tea break 32, `b` on Today 40, `areal` Update 4). Not tapped: the 8 landscape-@200 `adebug` runs above.

### 3.1 The real update prompt (`areal`; route-hooked `patch({ needRefresh: true })` 1.5 s into the brew; then "Skip break")

Runs at 375×667 light 200, 390×844 dark 100, 844×390 light 200 and 1440×900 light 100, twice (`fix2/probes/sum-fix/*areal*`, 03:44:57; `fix2/probes/sum-fix-areal2/`, 04:16:13, which also keeps the announcer log from before the Update reload):

| | 375×667 light 200 | 390×844 dark 100 | 844×390 light 200 | 1440×900 light 100 |
|---|---|---|---|---|
| During the brew, 1.2 s after `needRefresh` = true: drawn / in the queue | none / none (`needRefresh` true) | none / none | none / none | none / none |
| On the summary: drawn / in the queue | 0 frames / empty | 0 / empty | 0 / empty | 0 / empty |
| Sheet top / bottom vs no notice (run 1) | 0 / 0 px | 0 / 0 | 0 / 0 | 0 / 0 |
| "Skip break" → Today: first drawn (run 1; run 2) | 746; 548 ms | 525; 407 ms | 541; 448 ms | 348; 355 ms |
| Whole in view, clipped | yes, no | yes, no | yes, no | yes, no |
| Update 9/9, real tap → page reloads (`applyPwaUpdate` without a service worker) | 9/9, reloaded (both runs) | 9/9, reloaded | 9/9, reloaded | 9/9, reloaded |
| Said (run 2, before the reload) | once, on `#/` | once, on `#/` | once, on `#/` | once, on `#/` |

So by run: the real prompt is not drawn and not queued during the brew or on the summary, and is drawn whole and said once on Today. By code only (§ How): with `needRefresh` true it is dismissed again each time the person enters `/focus` or `/done` and raised (and said) again each time they leave; Lane T did not run a back-and-forth.

### 3.2 A notice raised during a brew

- The real update prompt: not drawn during the brew, appears on Today afterwards (§3.1).
- An ordinary `toast()` raised during a running brew **is drawn during the brew**, in the session panel's strip (invariant re-probe §4, `break` group, state `ambience`: "Notice one, waiting its turn." seen on `#/focus` in every configuration run; the fix did not change this).


## 4. Invariant re-probe on the fix (the round-3 `ltprobe.mjs`, unchanged method)

`chainfix.sh` P3, 04:04:43–04:16:13 UTC, :5477, 10 configurations (the 8 phone/landscape ones at 200 %, plus 1440×900 light 200 and dark 100), all 8 groups (`home`, `end`, `break`, `nextbrew`, `stats`, `import`, `update`, `queue`). JSON `fix2/probes/inv-fix/`. Compared with Lane T's round-3 run of the same probe on `490ca97` (`review/LT/probes/fix/`). Base `61aba17` was not re-probed (round-3 base numbers: `RECEIPT-LT.md` §5).

| Configuration | Revision | 100 ms samples / with a notice | drawn, no sheet: notice on top (ctl/text/row) | drawn, no sheet: other on top (ctl/text/row) | 9-point control hits by a notice, no sheet | sheet in the DOM: intersections / 9-point hits (controls) | clipped notice samples | distinct notices | group errors |
|---|---|---|---|---|---|---|---|---|---|
| 1440x900-dark-t100 | 490ca97 | 1271 / 722 | 0 (0/0/0) | 0 (0/0/0) | 0 | 47 / 12 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-dark-t100 | fix 99d9368 | 1267 / 686 | 0 (0/0/0) | 0 (0/0/0) | 0 | 19 / 2 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-light-t200 | 490ca97 | 1337 / 735 | 0 (0/0/0) | 0 (0/0/0) | 0 | 49 / 0 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-light-t200 | fix 99d9368 | 1311 / 546 | 0 (0/0/0) | 0 (0/0/0) | 0 | 65 / 0 | 0 | 11 | — |
| 375x667-dark-t200 | 490ca97 | 1535 / 548 | 0 (0/0/0) | 0 (0/0/0) | 0 | 87 / 1 | 0 | 12 | stats: locator.waitFor: Timeout 10000ms exceeded. |
| 375x667-dark-t200 | fix 99d9368 | 1817 / 685 | 0 (0/0/0) | 0 (0/0/0) | 0 | 276 / 58 | 0 | 13 | — |
| 375x667-light-t200 | 490ca97 | 1724 / 650 | 0 (0/0/0) | 0 (0/0/0) | 0 | 186 / 33 | 0 | 13 | — |
| 375x667-light-t200 | fix 99d9368 | 2090 / 685 | 0 (0/0/0) | 0 (0/0/0) | 0 | 286 / 34 | 0 | 13 | — |
| 390x844-dark-t200 | 490ca97 | 1535 / 618 | 0 (0/0/0) | 0 (0/0/0) | 0 | 228 / 17 | 0 | 13 | — |
| 390x844-dark-t200 | fix 99d9368 | 1651 / 673 | 0 (0/0/0) | 0 (0/0/0) | 0 | 286 / 25 | 0 | 13 | — |
| 390x844-light-t200 | 490ca97 | 1473 / 671 | 0 (0/0/0) | 0 (0/0/0) | 0 | 229 / 16 | 0 | 13 | — |
| 390x844-light-t200 | fix 99d9368 | 1482 / 668 | 16 (0/16/0) | 0 (0/0/0) | 0 | 213 / 20 | 0 | 13 | — |
| 667x375-dark-t200 | 490ca97 | 1508 / 645 | 0 (0/0/0) | 67 (0/67/0) | 0 | 179 / 30 | 0 | 13 | — |
| 667x375-dark-t200 | fix 99d9368 | 1358 / 521 | 0 (0/0/0) | 63 (0/63/0) | 0 | 159 / 37 | 0 | 11 | — |
| 667x375-light-t200 | 490ca97 | 1528 / 661 | 0 (0/0/0) | 56 (0/56/0) | 0 | 184 / 39 | 0 | 13 | — |
| 667x375-light-t200 | fix 99d9368 | 1441 / 532 | 0 (0/0/0) | 67 (0/67/0) | 0 | 143 / 24 | 0 | 11 | — |
| 844x390-dark-t200 | 490ca97 | 1472 / 682 | 50 (0/50/0) | 94 (0/94/0) | 0 | 200 / 55 | 0 | 14 | — |
| 844x390-dark-t200 | fix 99d9368 | 1502 / 673 | 50 (0/50/0) | 79 (0/79/0) | 0 | 327 / 60 | 0 | 14 | — |
| 844x390-light-t200 | 490ca97 | 1417 / 672 | 0 (0/0/0) | 63 (0/63/0) | 0 | 267 / 51 | 0 | 13 | — |
| 844x390-light-t200 | fix 99d9368 | 1684 / 774 | 60 (0/60/0) | 102 (0/102/0) | 0 | 499 / 255 | 0 | 14 | — |

Totals on the fix: 15,603 samples, 6,443 with a notice drawn; **0 nine-point control hits by a notice with no sheet in the DOM; 0 drawn control or row intersections with no sheet**; 0 clipped-notice samples. Drawn text intersections with no sheet, by kind (`hits` in the JSON):
- the countdown ":" line box under the panel notice (other on top), as on `490ca97`: 667×375 and 844×390 @200;
- the History Undo row under the sticky Stats header (`@fixed` text "23" / "Stats", the Undo row the `elementFromPoint` target there): 844×390 dark @200 (last row, 50 samples, as on `490ca97`), and on this run also **390×844 light @200** (mid row: "Stats" 8 and "23" 8 records, 16 samples) and **844×390 light @200** (mid row: "23", 60 samples); in both the deleted row had been tapped near the top, under the header, and the Undo row is drawn in its place (`shot-390x844-light-t200-stats-*.png`, `shot-844x390-light-t200-stats-0.png`). This depends on where the row was when tapped, not on the summary change.
- Sheet-in-DOM 9-point hits: 3,207 points, 3,162 of them inside a `[role=dialog]` box; states as in round 3 (History delete, Import, Ambience: leaving sheets).
- `import` at 667×375 @200 (light and dark): the real tap on "Import a backup" (9/9 on top after 10 wheel steps) opened **no file chooser within 10 s** in this run. Classified by one second run (`fix2/probes/inv-fix-import2/`, 04:20:12): fix light and dark and `490ca97` light: file chooser opened, Undo at the row (139 → 139), 89 → 6 brews after Undo, run-out 10.4 s. Both results reported.

## 5. Suites on the fix (:5477, `--workers=1`, own `--output`, one after another under one slot; `fix2/runs/suites.log`)

| Spec | Run (UTC) | Result (Playwright summary line) | Failures |
|---|---|---|---|
| `summary-notice.spec.ts` | 03:35:38–03:42:36 | 14 passed (6.9m) | — |
| `toast-room.spec.ts` | 03:42:36–03:47:19 | 14 passed (4.7m) | — |
| `a11y.spec.ts` | 03:47:19–03:59:09 | 11 passed (11.8m) | — |
| `notice-strip.spec.ts` | 03:59:09–04:32:49 | 3 failed; 22 passed (33.6m) | 3: (844×390 light 200 % reduced motion) (4.0m); (844×390 dark 200 %) (4.0m); (1440×900 light 200 % reduced motion) (messages below) |

`summary-notice` per test: ✓ 375×667 light 100 %, task day, ✓ 375×667 light 100 %, big day, ✓ 375×667 dark 200 %, task day, ✓ 375×667 dark 200 %, big day, ✓ 390×844 dark 100 %, task day, ✓ 390×844 dark 100 %, big day, ✓ 390×844 light 200 %, task day, ✓ 390×844 light 200 %, big day, ✓ 844×390 light 100 %, task day, ✓ 844×390 light 100 %, big day, ✓ 667×375 dark 100 %, task day, ✓ 667×375 dark 100 %, big day, ✓ 1440×900 light 100 %, task day, ✓ 1440×900 light 100 %, big day

`toast-room` per test: ✓ 375×667, 200 % text, ✓ 375×667, 200 % text, ✓ 844×390, 200 % text, ✓ 844×390, 200 % text, ✓ 667×375, 200 % text, ✓ 667×375, 200 % text, ✓ 375×667, 200 % text, wheel, light, ✓ 375×667, 200 % text, wheel, dark, ✓ 375×667, 200 % text, ✓ 844×390, 200 % text, ✓ 375×667, 200 % text, light, ✓ 375×667, 200 % text, dark, ✓ 667×375, 200 % text, wheel, light, ✓ 844×390, 200 % text, touch, dark

`a11y` per test: ✓ 1.7m, ✓ 1.6m, ✓ pointer targets are at least 24×24 px or meet a WC, ✓ 375×667): every control can be scrolled clear of sticky chrome, no sideways scroll, ✓ 4.8m, ✓ welcome: first brew from the keyboard alone, ✓ no spoken countdown, ✓ 390×844, ✓ 375×667, ✓ 390×844, ✓ 375×667

`notice-strip` per test: ✓ 1.1m, ✓ 1.2m, ✓ 1.0m, ✓ 1.2m, ✓ 1.2m, ✓ 1.1m, ✓ 1.9m, ✓ 1.3m, ✓ 1.0m, ✓ 1.8m, ✓ 1.1m, ✓ 1.1m, ✘ 4.0m, ✓ 1.0m, ✘ 4.0m, ✓ 667×375 light 100 %, ✓ 1.0m, ✓ 667×375 light 200 % reduced motion, ✓ 667×375 dark 100 %, ✓ 1.0m, ✓ 1440×900 light 100 %, ✓ 1440×900 light 200 %, ✘ 1440×900 light 200 % reduced motion, ✓ 1440×900 dark 100 %, ✓ 1440×900 dark 200 %
**`notice-strip.spec.ts`, first run (03:59:09–04:32:49): 22 passed, 3 failed.** Error messages (verbatim from `fix2/runs/suite-notice-strip.log`):
1. `(844×390 light 200 % reduced motion)`, 4.0 m: `Test timeout of 240000ms exceeded.` / `Error: locator.evaluate: Test ended.` waiting for `getByRole('button', { name: /^Mark “Chapter 3 notes” done/ })` at `notice-strip.spec.ts:306:31` (Today after End: the page snapshot shows the task field empty and no "Mark done" line).
2. `(844×390 dark 200 %)`, 4.0 m: the same error at the same line.
3. `(1440×900 light 200 % reduced motion)`, 39.9 s: `Error: the Undo is the deleted row, in place, on screen where the person saw the row` / `expect(received).toBeLessThanOrEqual(expected)` `Expected: <= 2` `Received: 111` at `notice-strip.spec.ts:403:117`.

Traces: none (the spec sets `test.use({ trace: 'off' })`). Error contexts (page snapshots) copied to `fix2/runs/notice-strip-failure/<test dir>/error-context.md` (originals under `/tmp/claude-0/lt4-out-notice-strip/`). During this first run Lane T's probe chain (a second browser) and Lane R / Lead jobs were also running.

**Second run, to classify only (04:33:08–04:35:55; the three tests alone, same command plus `-g`, `--output=/tmp/claude-0/lt4-out-ns-classify`):** 3 passed (51.0 s, 57.0 s, 55.8 s). Log `fix2/runs/notice-strip-classify.log`, JSON alongside. Both results are recorded: first run 3 of 25 failed; second run those 3 passed.

Related Lane T probe facts: Lane T's own `end` group typed the task and tapped Mark done at 844×390 @200 on the fix in both themes (§4 run); the History Undo row lands 3–39 px from the row it replaces at the end of the list in Lane T's runs (round 3 §2; this run 1440 @200 last row: 599 → 620); the spec's first-row check measured 111 px once.

`a11y.spec.ts` includes D4 ("toasts never cover the break-over controls, carried task included", 390×844 and 375×667: both passed) and the changed `:332` ("a toast never covers the session controls or the summary footer", both passed). `toast-room.spec.ts` carries the R5-D1, LEAD-D1 and R7-D1 shapes (14 of 14 passed).

## 6. REFERENCE → BEFORE → AFTER (full size; summary with a queued notice, then the next screen)

The design reference: `fix2/shots/REFERENCE-07-summary.png` (copied from the maker's `T2/triples/K02-1-REFERENCE-07-summary.png`). All captures `animations` live, DPR 2 on phones; the summary frame is taken 3.5 s after the summary's first frame.

| Configuration | BEFORE base `61aba17` (:5470) | BEFORE `490ca97` (:5476) | AFTER fix (:5477) summary | AFTER fix, the next screen with the notice drawn |
|---|---|---|---|---|
| 375×667 light 200 % | `shots/5470-c/375x667-light-t200-task-c-summary.png` (case `c`: the toast floats over the sheet's heading; case `adebug` on the base navigated away twice, "Execution context was destroyed", so it has no frame) | `shots/5476/375x667-light-t200-task-adebug-summary.png` (strip over Chai's face, sheet pushed under the footer) | `shots/5477/375x667-light-t200-task-adebug-summary.png` | tea break: `shots/5477-next/375x667-light-t200-task-adebug-next-drawn.png`; Today: `shots/5477-today/375x667-light-t200-task-b-next-drawn.png` |
| 390×844 dark 100 % | `shots/5470/390x844-dark-t100-task-adebug-summary.png` (toast over the sheet's unlock row) | `shots/5476/390x844-dark-t100-task-adebug-summary.png` | `shots/5477/390x844-dark-t100-task-adebug-summary.png` | `shots/5477-next/390x844-dark-t100-task-adebug-next-drawn.png`; Today: `shots/5477-today/390x844-dark-t100-task-b-next-drawn.png` |
| 1440×900 light 100 % | `shots/5470/1440x900-light-t100-task-adebug-summary.png` | `shots/5476/1440x900-light-t100-task-adebug-summary.png` | `shots/5477/1440x900-light-t100-task-adebug-summary.png` | `shots/5477-next/1440x900-light-t100-task-adebug-next-drawn.png`; Today: `shots/5477-today/1440x900-light-t100-task-b-next-drawn.png` |

Opened and checked by Lane T: the 375×667 @200 base / `490ca97` / fix summary frames, the fix tea-break frame (notice whole under the scene, "Open" in view, countdown below) and the fix Today frame at 390×844 dark (notice at the top of Today, whole).

## 7. Not proven / incomplete / deviations

- **The real update prompt in a production build:** not run (needs a new service worker). The `areal` runs use the app's own code from `patch({ needRefresh: true })` onward; the service-worker side is by code only (§ How).
- **A prompt re-raised (and re-said) on each return from the session screen** while `needRefresh` stays true: by code only; not run.
- **Several notices queued at once from the summary:** Lane T's runs queue one notice each; multi-notice order on Today comes from `summary-notice.spec.ts` (maker's spec, run by Lane T, §5) only.
- **Next-screen appearance time:** measured 310–4,739 ms after the tap, not "the first frame"; Lane T did not separate the causes.
- **Landscape @200:** with Lane T's 52-character message plus an action, the notice on the tea break is taller than the space under the top bar (§3); reachable by a short wheel (50 px), not by a 240 px one.
- `ltprobe` re-probe covered 10 of 22 configurations (the brief's minimum plus 1440); base not re-probed in this round.
- Base `adebug` at 375×667 @200 (and once at 390×844 dark @100): the page navigated during the run (Playwright: "Execution context was destroyed"); cause not established.
- Not run: the other suites (`integrity`, `w2-home`, `statusbar`, `break-reach`).
- Setup used the debug API (and, for `areal`, the served-module hook); actions under test were real taps / clicks / wheel. No source edited, nothing committed.
