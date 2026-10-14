
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
